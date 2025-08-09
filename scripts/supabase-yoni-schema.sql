-- よにのチャンネル専用Supabaseスキーマ
-- YouTube Video IDを直接使用するよう修正

-- 1. Celebrities テーブル (YouTubeチャンネル情報)
CREATE TABLE IF NOT EXISTS public.celebrities (
  id TEXT PRIMARY KEY, -- YouTube Channel ID を直接使用
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  image_url TEXT,
  agency TEXT,
  fandom_name TEXT,
  group_name TEXT,
  birth_date DATE,
  debut_date DATE,
  social_links JSONB DEFAULT '{}',
  subscriber_count INTEGER,
  video_count INTEGER,
  view_count BIGINT,
  type TEXT DEFAULT 'youtube_channel',
  status TEXT DEFAULT 'active',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Episodes テーブル (YouTube動画情報)
CREATE TABLE IF NOT EXISTS public.episodes (
  id TEXT PRIMARY KEY, -- YouTube video ID
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER, -- 秒数
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE, -- TEXTに変更
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Items テーブル (動画で紹介されたアイテム)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  purchase_url TEXT,
  brand TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL, -- TEXTに変更
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE, -- TEXTに変更
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Locations テーブル (撮影場所・店舗情報)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  image_url TEXT,
  website_url TEXT,
  phone TEXT,
  opening_hours TEXT,
  tags TEXT[] DEFAULT '{}',
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL, -- TEXTに変更
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE, -- TEXTに変更
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Works テーブル (関連作品情報)
CREATE TABLE IF NOT EXISTS public.works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  release_date DATE,
  image_url TEXT,
  external_url TEXT,
  type TEXT, -- 'game', 'anime', 'music', etc.
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE, -- TEXTに変更
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Posts テーブル (ユーザー投稿)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE SET NULL, -- TEXTに変更
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL, -- TEXTに変更
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_celebrities_slug ON public.celebrities(slug);
CREATE INDEX IF NOT EXISTS idx_celebrities_type ON public.celebrities(type);
CREATE INDEX IF NOT EXISTS idx_episodes_celebrity_id ON public.episodes(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_episodes_date ON public.episodes(date DESC);
CREATE INDEX IF NOT EXISTS idx_items_episode_id ON public.items(episode_id);
CREATE INDEX IF NOT EXISTS idx_items_celebrity_id ON public.items(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_items_slug ON public.items(slug);
CREATE INDEX IF NOT EXISTS idx_locations_episode_id ON public.locations(episode_id);
CREATE INDEX IF NOT EXISTS idx_locations_celebrity_id ON public.locations(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON public.locations(slug);
CREATE INDEX IF NOT EXISTS idx_works_celebrity_id ON public.works(celebrity_id);
CREATE INDEX IF NOT EXISTS idx_works_slug ON public.works(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_celebrity_id ON public.posts(celebrity_id);

-- Row Level Security (RLS) 設定
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 読み取り権限（全ユーザー）
CREATE POLICY "Allow read access to celebrities" ON public.celebrities FOR SELECT USING (true);
CREATE POLICY "Allow read access to episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Allow read access to items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow read access to locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow read access to works" ON public.works FOR SELECT USING (true);
CREATE POLICY "Allow read access to approved posts" ON public.posts FOR SELECT USING (status = 'approved');

-- 更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 更新トリガー
CREATE TRIGGER update_celebrities_updated_at BEFORE UPDATE ON public.celebrities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_works_updated_at BEFORE UPDATE ON public.works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 初期データ確認用ビュー
CREATE OR REPLACE VIEW public.data_summary AS
SELECT 
  'celebrities' as table_name, COUNT(*) as count FROM public.celebrities
UNION ALL
SELECT 
  'episodes' as table_name, COUNT(*) as count FROM public.episodes
UNION ALL
SELECT 
  'items' as table_name, COUNT(*) as count FROM public.items
UNION ALL
SELECT 
  'locations' as table_name, COUNT(*) as count FROM public.locations
UNION ALL
SELECT 
  'works' as table_name, COUNT(*) as count FROM public.works
UNION ALL
SELECT 
  'posts' as table_name, COUNT(*) as count FROM public.posts;