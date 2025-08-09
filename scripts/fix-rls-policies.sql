-- Row Level Security ポリシー修正
-- データ挿入を許可するポリシーを追加

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Allow read access to celebrities" ON public.celebrities;
DROP POLICY IF EXISTS "Allow read access to episodes" ON public.episodes;
DROP POLICY IF EXISTS "Allow read access to items" ON public.items;
DROP POLICY IF EXISTS "Allow read access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow read access to works" ON public.works;
DROP POLICY IF EXISTS "Allow read access to approved posts" ON public.posts;

-- 読み取り・書き込み両方を許可するポリシー
CREATE POLICY "Allow all access to celebrities" ON public.celebrities USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to episodes" ON public.episodes USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to items" ON public.items USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to locations" ON public.locations USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to works" ON public.works USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to posts" ON public.posts USING (true) WITH CHECK (true);