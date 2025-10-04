-- categoriesテーブルの作成
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(100) DEFAULT 'bg-gray-50 text-gray-700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本カテゴリの挿入
INSERT INTO categories (name, slug, description, color) VALUES
('推し活入門', 'oshikatsu-basics', '推し活を始める人向けの基礎知識', 'bg-blue-50 text-blue-700'),
('イベント参加', 'event-guide', 'ライブやイベントの参加ガイド', 'bg-red-50 text-red-700'),
('グッズ・アイテム', 'goods-items', '推し活グッズや関連アイテム情報', 'bg-green-50 text-green-700'),
('SNS活用', 'sns-tips', 'SNSでの推し活テクニック', 'bg-purple-50 text-purple-700'),
('応援マナー', 'support-manner', 'ファンとしてのマナーや心得', 'bg-yellow-50 text-yellow-700'),
('タレント情報', 'talent-info', 'タレント・アイドルの詳細情報', 'bg-pink-50 text-pink-700'),
('ライブレポート', 'live-report', 'ライブやコンサートのレポート', 'bg-orange-50 text-orange-700')
ON CONFLICT (slug) DO NOTHING;

-- RLS (Row Level Security) の設定
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー
CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (true);

-- 管理者のみ書き込み可能ポリシー
CREATE POLICY "Only authenticated users can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete categories" ON categories
  FOR DELETE USING (auth.role() = 'authenticated');