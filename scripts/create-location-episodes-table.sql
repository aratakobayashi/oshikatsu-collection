-- ロケーションとエピソードの多対多関係を実現する中間テーブル
-- 本番環境Supabaseで実行するSQL

-- 1. 中間テーブルの作成
CREATE TABLE IF NOT EXISTS public.location_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  episode_id TEXT NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 同じロケーション×エピソードの組み合わせの重複を防ぐ
  UNIQUE(location_id, episode_id)
);

-- 2. インデックスの作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_location_episodes_location_id ON public.location_episodes(location_id);
CREATE INDEX IF NOT EXISTS idx_location_episodes_episode_id ON public.location_episodes(episode_id);

-- 3. RLS (Row Level Security) の設定（Supabaseのセキュリティ）
ALTER TABLE public.location_episodes ENABLE ROW LEVEL SECURITY;

-- 4. 読み取り権限（認証なしでも読み取り可能）
CREATE POLICY "Enable read access for all users" ON public.location_episodes
FOR SELECT USING (true);

-- 5. 挿入権限（認証済みユーザーのみ）
CREATE POLICY "Enable insert for authenticated users only" ON public.location_episodes
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6. 更新権限（認証済みユーザーのみ）
CREATE POLICY "Enable update for authenticated users only" ON public.location_episodes
FOR UPDATE USING (auth.role() = 'authenticated');

-- 7. 削除権限（認証済みユーザーのみ）
CREATE POLICY "Enable delete for authenticated users only" ON public.location_episodes
FOR DELETE USING (auth.role() = 'authenticated');

-- 8. テーブル作成の確認
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'location_episodes' 
ORDER BY ordinal_position;