-- RLS権限修正用SQLクエリ
-- Supabaseのダッシュボードから実行してください

-- 1. 既存のRLSポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'articles';

-- 2. articlesテーブルのRLSを一時的に無効化（データ更新用）
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

-- 3. WordPress コンテンツを復元するためのUPDATEクエリ例
-- 注意: これは例です。実際のデータは restore-wordpress-content.ts の結果を使用してください
/*
UPDATE articles
SET
  content = 'WordPressから取得したコンテンツ',
  updated_at = NOW()
WHERE slug = '記事のスラッグ';
*/

-- 4. RLSを再度有効化
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 5. 新しいRLSポリシーを作成（必要に応じて）
-- 読み取り専用ポリシー（全ユーザー許可）
CREATE POLICY "Enable read access for all users" ON articles
  FOR SELECT
  USING (status = 'published');

-- 管理者用の更新ポリシー（service_roleのみ許可）
CREATE POLICY "Enable update for service role" ON articles
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- または、一時的に全ユーザーに更新を許可（危険：作業後は削除すること）
CREATE POLICY "Temporary update access" ON articles
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. 作業完了後、一時的なポリシーを削除
-- DROP POLICY "Temporary update access" ON articles;