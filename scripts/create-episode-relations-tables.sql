-- エピソード-店舗 紐付けテーブル
CREATE TABLE IF NOT EXISTS public.episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(episode_id, location_id)
);

-- エピソード-アイテム 紐付けテーブル
CREATE TABLE IF NOT EXISTS public.episode_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
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

-- 読み取り権限（全ユーザー）
CREATE POLICY "Allow read access to episode_locations" ON public.episode_locations FOR SELECT USING (true);
CREATE POLICY "Allow read access to episode_items" ON public.episode_items FOR SELECT USING (true);

-- 管理者用の全権限（後で調整可能）
CREATE POLICY "Allow all access to episode_locations for admin" ON public.episode_locations 
  USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to episode_items for admin" ON public.episode_items 
  USING (true) WITH CHECK (true);

-- 更新用トリガー
CREATE TRIGGER update_episode_locations_updated_at 
  BEFORE UPDATE ON public.episode_locations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episode_items_updated_at 
  BEFORE UPDATE ON public.episode_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();