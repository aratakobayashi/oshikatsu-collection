/*
  # Fix Works System Migration

  1. New Tables
    - `works`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `slug` (text, unique, not null)
      - `type` (text, not null, check constraint for valid values)
      - `description` (text)
      - `release_date` (date)
      - `poster_url` (text)
      - `official_site` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Foreign Key Additions
    - Add `work_id` to episodes, items, locations, user_posts tables

  3. Security
    - Enable RLS on `works` table
    - Add policy for public read access
    - Add policy for authenticated users to manage works

  4. Indexes
    - Add indexes for performance optimization

  5. Sample Data
    - Insert sample works for testing
*/

-- Create works table
CREATE TABLE IF NOT EXISTS works (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  type text NOT NULL DEFAULT 'other',
  description text DEFAULT '',
  release_date date,
  poster_url text DEFAULT '',
  official_site text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add work type constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'works' AND constraint_name = 'works_type_check'
  ) THEN
    ALTER TABLE works ADD CONSTRAINT works_type_check 
    CHECK (type = ANY (ARRAY['drama'::text, 'movie'::text, 'cm'::text, 'variety'::text, 'other'::text]));
  END IF;
END $$;

-- Add work_id to episodes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'episodes' AND column_name = 'work_id'
  ) THEN
    ALTER TABLE episodes ADD COLUMN work_id uuid REFERENCES works(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add work_id to items table (fix the incorrect reference)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'items' AND column_name = 'work_id'
  ) THEN
    ALTER TABLE items ADD COLUMN work_id uuid REFERENCES works(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add work_id to locations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'locations' AND column_name = 'work_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN work_id uuid REFERENCES works(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add work_id to user_posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_posts' AND column_name = 'work_id'
  ) THEN
    ALTER TABLE user_posts ADD COLUMN work_id uuid REFERENCES works(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE works ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for works" ON works;
DROP POLICY IF EXISTS "Authenticated users can manage works" ON works;

-- Create policies
CREATE POLICY "Public read access for works"
  ON works
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage works"
  ON works
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_works_slug ON works(slug);
CREATE INDEX IF NOT EXISTS idx_works_type ON works(type);
CREATE INDEX IF NOT EXISTS idx_works_title ON works(title);

CREATE INDEX IF NOT EXISTS idx_episodes_work_id ON episodes(work_id);
CREATE INDEX IF NOT EXISTS idx_items_work_id ON items(work_id);
CREATE INDEX IF NOT EXISTS idx_locations_work_id ON locations(work_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_work_id ON user_posts(work_id);

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_works_updated_at ON works;
CREATE TRIGGER update_works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample works data
INSERT INTO works (title, slug, type, description, release_date, poster_url) VALUES
('相棒', 'aibou', 'drama', '人気刑事ドラマシリーズ。杉下右京と相棒が様々な事件を解決する。', '2002-10-09', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('君の名は。', 'kimi-no-na-wa', 'movie', '新海誠監督のアニメーション映画。時空を超えた恋愛ストーリー。', '2016-08-26', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('ソフトバンクCM', 'softbank-cm', 'cm', 'ソフトバンクのテレビCMシリーズ。白戸家の物語。', '2020-01-01', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('しゃべくり007', 'shabekuri007', 'variety', '人気バラエティ番組。ゲストとのトークが魅力。', '2008-07-12', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('半沢直樹', 'hanzawa-naoki', 'drama', '銀行員半沢直樹の活躍を描いたドラマ。', '2013-07-07', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('鬼滅の刃', 'kimetsu-no-yaiba', 'movie', '大ヒットアニメの劇場版。', '2020-10-16', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('ガキの使い', 'gaki-no-tsukai', 'variety', '人気お笑いバラエティ番組。', '1989-10-03', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400'),
('トヨタCM', 'toyota-cm', 'cm', 'トヨタ自動車のテレビCMシリーズ。', '2021-01-01', 'https://images.unsplash.com/photo-1489599162163-3fb4b4b5b0b3?w=400')
ON CONFLICT (slug) DO NOTHING;