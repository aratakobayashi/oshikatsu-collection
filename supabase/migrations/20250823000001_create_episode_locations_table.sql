-- Episode Locations Junction Table Migration
-- 中間テーブル作成とインデックス設定
-- 作成日: 2025-08-23
-- 目的: locations.episode_id から episode_locations への移行準備

-- 1. episode_locations中間テーブル作成
CREATE TABLE IF NOT EXISTS episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL,
  location_id UUID NOT NULL,
  visited_at INTEGER, -- エピソード内での訪問時間（秒数）
  description TEXT,    -- シーンの説明・メモ
  featured BOOLEAN DEFAULT TRUE, -- メインロケーションフラグ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 制約
  CONSTRAINT fk_episode_locations_episode 
    FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_episode_locations_location 
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  
  -- ユニーク制約（同じエピソード-ロケーションの組み合わせは1つだけ）
  CONSTRAINT unique_episode_location 
    UNIQUE(episode_id, location_id)
);

-- 2. パフォーマンス向上のためのインデックス作成
CREATE INDEX IF NOT EXISTS idx_episode_locations_episode_id 
  ON episode_locations(episode_id);

CREATE INDEX IF NOT EXISTS idx_episode_locations_location_id 
  ON episode_locations(location_id);

CREATE INDEX IF NOT EXISTS idx_episode_locations_featured 
  ON episode_locations(featured) WHERE featured = TRUE;

CREATE INDEX IF NOT EXISTS idx_episode_locations_created_at 
  ON episode_locations(created_at DESC);

-- 3. updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_episode_locations_updated_at 
  BEFORE UPDATE ON episode_locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) 設定
ALTER TABLE episode_locations ENABLE ROW LEVEL SECURITY;

-- 全てのユーザーが読み取り可能
CREATE POLICY "Enable read access for all users" ON episode_locations
  FOR SELECT USING (true);

-- 認証済みユーザーのみが挿入・更新・削除可能  
CREATE POLICY "Enable insert for authenticated users only" ON episode_locations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON episode_locations
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON episode_locations
  FOR DELETE USING (auth.role() = 'authenticated');

-- 5. コメント追加
COMMENT ON TABLE episode_locations IS 'エピソードとロケーションの多対多関係を管理する中間テーブル';
COMMENT ON COLUMN episode_locations.episode_id IS 'エピソードID（episodes.idへの外部キー）';
COMMENT ON COLUMN episode_locations.location_id IS 'ロケーションID（locations.idへの外部キー）';
COMMENT ON COLUMN episode_locations.visited_at IS 'エピソード内での訪問時間（秒数）';
COMMENT ON COLUMN episode_locations.description IS 'シーンの説明やメモ';
COMMENT ON COLUMN episode_locations.featured IS 'メインロケーションかどうか（デフォルト: true）';