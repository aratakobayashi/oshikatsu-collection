/*
  # トレンド作品機能の追加

  1. データベース変更
    - `works`テーブルに`is_trending`カラムを追加
    - `trending_order`カラムを追加（表示順序用）
    - インデックスを追加

  2. セキュリティ
    - 既存のRLSポリシーを維持
    - 認証ユーザーのみがトレンド設定を変更可能
*/

-- Add is_trending column to works table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'works' AND column_name = 'is_trending'
  ) THEN
    ALTER TABLE works ADD COLUMN is_trending boolean DEFAULT false;
  END IF;
END $$;

-- Add trending_order column for custom ordering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'works' AND column_name = 'trending_order'
  ) THEN
    ALTER TABLE works ADD COLUMN trending_order integer DEFAULT 0;
  END IF;
END $$;

-- Create index for trending works
CREATE INDEX IF NOT EXISTS idx_works_trending ON works(is_trending, trending_order);

-- Update some sample works to be trending
UPDATE works 
SET is_trending = true, trending_order = 1 
WHERE slug = 'hanzawa-naoki';

UPDATE works 
SET is_trending = true, trending_order = 2 
WHERE slug = 'kimi-no-na-wa';

UPDATE works 
SET is_trending = true, trending_order = 3 
WHERE slug = 'kimetsu-no-yaiba';

UPDATE works 
SET is_trending = true, trending_order = 4 
WHERE slug = 'shabekuri007';