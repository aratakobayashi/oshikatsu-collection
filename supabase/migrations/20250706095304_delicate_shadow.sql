/*
  # RLS ポリシーの更新

  1. 変更内容
    - 既存のパブリックアクセスポリシーを削除
    - 認証済みユーザーのみアクセス可能なポリシーに更新
    - INSERT, SELECT, UPDATE 操作を認証済みユーザーに制限

  2. 対象テーブル
    - celebrities
    - episodes
    - locations
    - items

  3. セキュリティ
    - auth.role() = 'authenticated' 条件を使用
    - 認証済みユーザーのみがデータを操作可能
*/

-- Drop existing public policies
DROP POLICY IF EXISTS "Public read access for celebrities" ON celebrities;
DROP POLICY IF EXISTS "Public read access for episodes" ON episodes;
DROP POLICY IF EXISTS "Public read access for locations" ON locations;
DROP POLICY IF EXISTS "Public read access for items" ON items;

-- Update celebrities policies
DROP POLICY IF EXISTS "Authenticated users can manage celebrities" ON celebrities;

CREATE POLICY "Authenticated users can insert celebrities"
  ON celebrities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can select celebrities"
  ON celebrities
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update celebrities"
  ON celebrities
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Update episodes policies
DROP POLICY IF EXISTS "Authenticated users can manage episodes" ON episodes;

CREATE POLICY "Authenticated users can insert episodes"
  ON episodes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can select episodes"
  ON episodes
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update episodes"
  ON episodes
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Update locations policies
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON locations;

CREATE POLICY "Authenticated users can insert locations"
  ON locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can select locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update locations"
  ON locations
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Update items policies
DROP POLICY IF EXISTS "Authenticated users can manage items" ON items;

CREATE POLICY "Authenticated users can insert items"
  ON items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can select items"
  ON items
  FOR SELECT
  TO authenticated
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update items"
  ON items
  FOR UPDATE
  TO authenticated
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');