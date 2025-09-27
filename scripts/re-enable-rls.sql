-- RLS再有効化用SQLクエリ
-- Supabaseのダッシュボードから実行してください

-- 1. RLSを再度有効化
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- 2. 必要に応じて基本的なRLSポリシーを追加
-- 読み取り専用ポリシー（全ユーザー許可）
DROP POLICY IF EXISTS "Enable read access for all users" ON articles;
CREATE POLICY "Enable read access for all users" ON articles
  FOR SELECT
  USING (status = 'published');

-- 管理者用の更新ポリシー（service_roleのみ許可）
DROP POLICY IF EXISTS "Enable update for service role" ON articles;
CREATE POLICY "Enable update for service role" ON articles
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');