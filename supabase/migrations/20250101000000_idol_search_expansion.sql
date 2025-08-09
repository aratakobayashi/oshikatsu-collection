/*
  # 国内アイドル検索サイト - Celebritiesテーブル拡張

  1. 新規フィールド追加
    - `type` (text) - エンティティ種別（individual/group/youtube_channel）
    - `agency` (text) - 所属事務所
    - `debut_date` (date) - デビュー日
    - `member_count` (integer) - メンバー数（グループのみ）
    - `subscriber_count` (bigint) - 登録者数（YouTubeチャンネルのみ）
    - `status` (text) - 活動状況（active/hiatus/disbanded）
    - `official_color` (text) - 公式カラー（アイドルグループ用）
    - `fandom_name` (text) - ファンダム名

  2. Group-Member関連強化
    - celebrity_groups テーブルの活用
    - parent_group_id フィールド追加（個人→グループの逆参照）

  3. 検索機能対応
    - 全文検索用インデックス追加
    - type別検索最適化

  4. 制約とバリデーション
    - type check制約
    - status check制約
*/

-- Add new fields to celebrities table
DO $$
BEGIN
  -- Add type field with check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'type'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN type text DEFAULT 'individual';
    ALTER TABLE celebrities ADD CONSTRAINT celebrities_type_check 
    CHECK (type = ANY (ARRAY['individual'::text, 'group'::text, 'youtube_channel'::text]));
  END IF;

  -- Add agency field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'agency'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN agency text;
  END IF;

  -- Add debut_date field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'debut_date'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN debut_date date;
  END IF;

  -- Add member_count field (for groups)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'member_count'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN member_count integer;
  END IF;

  -- Add subscriber_count field (for YouTube channels)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'subscriber_count'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN subscriber_count bigint DEFAULT 0;
  END IF;

  -- Add status field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'status'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN status text DEFAULT 'active';
    ALTER TABLE celebrities ADD CONSTRAINT celebrities_status_check 
    CHECK (status = ANY (ARRAY['active'::text, 'hiatus'::text, 'disbanded'::text, 'graduated'::text]));
  END IF;

  -- Add official_color field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'official_color'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN official_color text;
  END IF;

  -- Add fandom_name field
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'fandom_name'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN fandom_name text;
  END IF;

  -- Add parent_group_id for individual members
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'celebrities' AND column_name = 'parent_group_id'
  ) THEN
    ALTER TABLE celebrities ADD COLUMN parent_group_id uuid REFERENCES celebrities(id) ON DELETE SET NULL;
  END IF;

END $$;

-- Create indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_celebrities_type ON celebrities(type);
CREATE INDEX IF NOT EXISTS idx_celebrities_agency ON celebrities(agency);
CREATE INDEX IF NOT EXISTS idx_celebrities_debut_date ON celebrities(debut_date);
CREATE INDEX IF NOT EXISTS idx_celebrities_status ON celebrities(status);
CREATE INDEX IF NOT EXISTS idx_celebrities_parent_group_id ON celebrities(parent_group_id);

-- Full-text search index for name and bio
CREATE INDEX IF NOT EXISTS idx_celebrities_search_name ON celebrities USING gin(to_tsvector('japanese', name));
CREATE INDEX IF NOT EXISTS idx_celebrities_search_bio ON celebrities USING gin(to_tsvector('japanese', coalesce(bio, '')));

-- Combined search index
CREATE INDEX IF NOT EXISTS idx_celebrities_full_search ON celebrities 
USING gin(to_tsvector('japanese', name || ' ' || coalesce(bio, '') || ' ' || coalesce(agency, '')));

-- Update existing celebrities to have proper types (if any exist)
UPDATE celebrities SET type = 'individual' WHERE type IS NULL;

-- Create or update the celebrity_groups table if needed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'celebrity_groups') THEN
    CREATE TABLE celebrity_groups (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      celebrity_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
      group_id uuid NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
      role text DEFAULT 'member',
      position text, -- Leader, Main Vocal, etc.
      joined_date date,
      left_date date,
      is_active boolean DEFAULT true,
      member_color text, -- Individual member color within group
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      UNIQUE(celebrity_id, group_id)
    );

    -- Enable RLS
    ALTER TABLE celebrity_groups ENABLE ROW LEVEL SECURITY;

    -- Create policies
    CREATE POLICY "Public read access for celebrity groups"
      ON celebrity_groups
      FOR SELECT
      TO public
      USING (true);

    CREATE POLICY "Authenticated users can manage celebrity groups"
      ON celebrity_groups
      FOR ALL
      TO authenticated
      USING (true);

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_celebrity_groups_celebrity_id ON celebrity_groups(celebrity_id);
    CREATE INDEX IF NOT EXISTS idx_celebrity_groups_group_id ON celebrity_groups(group_id);
    CREATE INDEX IF NOT EXISTS idx_celebrity_groups_is_active ON celebrity_groups(is_active);

    -- Create trigger for updated_at
    CREATE TRIGGER update_celebrity_groups_updated_at
      BEFORE UPDATE ON celebrity_groups
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add validation function
CREATE OR REPLACE FUNCTION validate_celebrity_constraints()
RETURNS TRIGGER AS $$
BEGIN
  -- Groups should have member_count > 0
  IF NEW.type = 'group' AND (NEW.member_count IS NULL OR NEW.member_count <= 0) THEN
    RAISE EXCEPTION 'Groups must have member_count > 0';
  END IF;

  -- Individual members shouldn't have member_count
  IF NEW.type = 'individual' AND NEW.member_count IS NOT NULL THEN
    NEW.member_count := NULL;
  END IF;

  -- YouTube channels should have subscriber_count
  IF NEW.type = 'youtube_channel' AND NEW.subscriber_count IS NULL THEN
    NEW.subscriber_count := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_celebrity_constraints_trigger ON celebrities;
CREATE TRIGGER validate_celebrity_constraints_trigger
  BEFORE INSERT OR UPDATE ON celebrities
  FOR EACH ROW
  EXECUTE FUNCTION validate_celebrity_constraints();