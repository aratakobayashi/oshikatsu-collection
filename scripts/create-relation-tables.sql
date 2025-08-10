-- ============================================
-- エピソードとアイテム・ロケーションの関連テーブル作成
-- ============================================

-- 1. エピソードとアイテムの関連テーブル
CREATE TABLE IF NOT EXISTS episode_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER, -- 動画の何秒目に登場するか（NULL可）
  scene_description TEXT, -- シーンの説明（例：「オープニングで着用」）
  is_featured BOOLEAN DEFAULT false, -- 特に注目のアイテムか
  confidence_level VARCHAR(20) DEFAULT 'confirmed', -- confirmed, likely, unverified
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じエピソード・アイテムの組み合わせを防ぐ
  UNIQUE(episode_id, item_id)
);

-- インデックス作成（検索高速化）
CREATE INDEX idx_episode_items_episode ON episode_items(episode_id);
CREATE INDEX idx_episode_items_item ON episode_items(item_id);

-- 2. エピソードとロケーションの関連テーブル
CREATE TABLE IF NOT EXISTS episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  scene_description TEXT, -- シーンの説明（例：「朝食シーンで訪問」）
  visit_date DATE, -- 実際の訪問日（わかる場合）
  is_main_location BOOLEAN DEFAULT false, -- メインロケーションか
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じエピソード・ロケーションの組み合わせを防ぐ
  UNIQUE(episode_id, location_id)
);

-- インデックス作成（検索高速化）
CREATE INDEX idx_episode_locations_episode ON episode_locations(episode_id);
CREATE INDEX idx_episode_locations_location ON episode_locations(location_id);

-- 3. RLS（Row Level Security）ポリシー設定
-- 読み取りは全員可能、書き込みは認証ユーザーのみ

-- episode_items
ALTER TABLE episode_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "episode_items_read_all" ON episode_items
  FOR SELECT USING (true);

CREATE POLICY "episode_items_insert_auth" ON episode_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "episode_items_update_auth" ON episode_items
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "episode_items_delete_auth" ON episode_items
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- episode_locations
ALTER TABLE episode_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "episode_locations_read_all" ON episode_locations
  FOR SELECT USING (true);

CREATE POLICY "episode_locations_insert_auth" ON episode_locations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "episode_locations_update_auth" ON episode_locations
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "episode_locations_delete_auth" ON episode_locations
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- 4. 便利なビューの作成（オプション）

-- エピソードと関連アイテムの詳細情報を取得するビュー
CREATE OR REPLACE VIEW episode_items_details AS
SELECT 
  ei.*,
  e.title as episode_title,
  e.thumbnail_url as episode_thumbnail,
  i.name as item_name,
  i.brand as item_brand,
  i.price as item_price,
  i.image_url as item_image
FROM episode_items ei
JOIN episodes e ON ei.episode_id = e.id
JOIN items i ON ei.item_id = i.id;

-- エピソードと関連ロケーションの詳細情報を取得するビュー
CREATE OR REPLACE VIEW episode_locations_details AS
SELECT 
  el.*,
  e.title as episode_title,
  e.thumbnail_url as episode_thumbnail,
  l.name as location_name,
  l.address as location_address,
  l.lat as location_lat,
  l.lng as location_lng
FROM episode_locations el
JOIN episodes e ON el.episode_id = e.id
JOIN locations l ON el.location_id = l.id;

-- ============================================
-- 実行後の確認用クエリ
-- ============================================
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('episode_items', 'episode_locations');