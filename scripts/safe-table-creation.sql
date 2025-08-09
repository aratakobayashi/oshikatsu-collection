-- 安全なテーブル作成 - 既存データを保護
-- まず既存テーブルを削除してから再作成

-- 既存テーブルを削除（データも削除されます）
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.works CASCADE;
DROP TABLE IF EXISTS public.episodes CASCADE;
DROP TABLE IF EXISTS public.celebrities CASCADE;

-- 1. Celebrities テーブル
CREATE TABLE public.celebrities (
  id TEXT PRIMARY KEY,
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

-- 2. Episodes テーブル
CREATE TABLE public.episodes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Items テーブル
CREATE TABLE public.items (
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
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL,
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Locations テーブル
CREATE TABLE public.locations (
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
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL,
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Works テーブル
CREATE TABLE public.works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  release_date DATE,
  image_url TEXT,
  external_url TEXT,
  type TEXT,
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Posts テーブル
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_name TEXT,
  author_email TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'pending',
  celebrity_id TEXT REFERENCES public.celebrities(id) ON DELETE SET NULL,
  episode_id TEXT REFERENCES public.episodes(id) ON DELETE SET NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security 設定
ALTER TABLE public.celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 読み取り権限
CREATE POLICY "Allow read access to celebrities" ON public.celebrities FOR SELECT USING (true);
CREATE POLICY "Allow read access to episodes" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Allow read access to items" ON public.items FOR SELECT USING (true);
CREATE POLICY "Allow read access to locations" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Allow read access to works" ON public.works FOR SELECT USING (true);
CREATE POLICY "Allow read access to approved posts" ON public.posts FOR SELECT USING (status = 'approved');