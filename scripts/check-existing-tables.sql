-- 既存テーブル確認クエリ
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 既存のcelebritiesテーブル構造確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'celebrities' AND table_schema = 'public';