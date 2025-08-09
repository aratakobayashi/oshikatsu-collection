-- 開発環境用: 書き込み権限追加
-- 以下のSQLを開発環境のSQL Editorで実行してください

-- 全ユーザーに書き込み権限を追加（開発環境のみ）
CREATE POLICY "Allow insert access to celebrities" ON public.celebrities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to celebrities" ON public.celebrities FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to celebrities" ON public.celebrities FOR DELETE USING (true);

CREATE POLICY "Allow insert access to episodes" ON public.episodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to episodes" ON public.episodes FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to episodes" ON public.episodes FOR DELETE USING (true);

CREATE POLICY "Allow insert access to items" ON public.items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to items" ON public.items FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to items" ON public.items FOR DELETE USING (true);

CREATE POLICY "Allow insert access to locations" ON public.locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to locations" ON public.locations FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to locations" ON public.locations FOR DELETE USING (true);

CREATE POLICY "Allow insert access to episode_locations" ON public.episode_locations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to episode_locations" ON public.episode_locations FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to episode_locations" ON public.episode_locations FOR DELETE USING (true);

CREATE POLICY "Allow insert access to episode_items" ON public.episode_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to episode_items" ON public.episode_items FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to episode_items" ON public.episode_items FOR DELETE USING (true);

CREATE POLICY "Allow insert access to posts" ON public.posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access to posts" ON public.posts FOR UPDATE USING (true);
CREATE POLICY "Allow delete access to posts" ON public.posts FOR DELETE USING (true);