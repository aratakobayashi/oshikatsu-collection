-- よにのちゃんねる エピソード関連テーブル作成
-- Created: 2025-08-08

-- エピソード-店舗紐付けテーブル
CREATE TABLE IF NOT EXISTS public.episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL,
  location_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, location_id)
);

-- エピソード-アイテム紐付けテーブル  
CREATE TABLE IF NOT EXISTS public.episode_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL,
  item_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, item_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_episode_locations_episode_id ON public.episode_locations(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_locations_location_id ON public.episode_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_episode_items_episode_id ON public.episode_items(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_items_item_id ON public.episode_items(item_id);

-- RLS設定
ALTER TABLE public.episode_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_items ENABLE ROW LEVEL SECURITY;

-- パブリックアクセスポリシー（読み取り）
CREATE POLICY "Allow read access to episode_locations" ON public.episode_locations FOR SELECT USING (true);
CREATE POLICY "Allow read access to episode_items" ON public.episode_items FOR SELECT USING (true);

-- 管理者用ポリシー（全操作）
CREATE POLICY "Allow all access to episode_locations for authenticated users" ON public.episode_locations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to episode_items for authenticated users" ON public.episode_items USING (true) WITH CHECK (true);

-- 外部キー制約追加
ALTER TABLE public.episode_locations 
ADD CONSTRAINT fk_episode_locations_episode_id 
FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;

ALTER TABLE public.episode_items 
ADD CONSTRAINT fk_episode_items_episode_id 
FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;

ALTER TABLE public.episode_locations 
ADD CONSTRAINT fk_episode_locations_location_id 
FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;

ALTER TABLE public.episode_items 
ADD CONSTRAINT fk_episode_items_item_id 
FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;

-- コメント
COMMENT ON TABLE public.episode_locations IS 'エピソードと店舗の紐付けテーブル';
COMMENT ON TABLE public.episode_items IS 'エピソードとアイテムの紐付けテーブル';
COMMENT ON COLUMN public.episode_locations.episode_id IS 'YouTubeのVideo ID（episodes.id）';
COMMENT ON COLUMN public.episode_items.episode_id IS 'YouTubeのVideo ID（episodes.id）';