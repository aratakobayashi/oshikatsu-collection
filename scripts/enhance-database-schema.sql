-- データベーススキーマ拡張：購入・予約リンク機能強化
-- よにのチャンネル oshikatsu-collection

-- 1. locationsテーブルにURL関連カラムを追加
ALTER TABLE public.locations 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS reservation_url TEXT,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS price_range TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- locationsテーブルのコメント追加
COMMENT ON COLUMN public.locations.website IS '店舗の公式ウェブサイトURL';
COMMENT ON COLUMN public.locations.reservation_url IS '予約・アフィリエイトURL（バリューコマースなど）';
COMMENT ON COLUMN public.locations.rating IS '評価（1.0-5.0）';
COMMENT ON COLUMN public.locations.price_range IS '価格帯（例：¥1,000-3,000）';
COMMENT ON COLUMN public.locations.opening_hours IS '営業時間（JSON形式）';
COMMENT ON COLUMN public.locations.tags IS 'タグ配列（カフェ、レストラン、聖地巡礼など）';

-- 2. itemsテーブルの購入リンク機能を強化
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS amazon_url TEXT,
ADD COLUMN IF NOT EXISTS rakuten_url TEXT,
ADD COLUMN IF NOT EXISTS official_store_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_commission DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- itemsテーブルのコメント追加
COMMENT ON COLUMN public.items.amazon_url IS 'Amazonアフィリエイトリンク（arata55507-22タグ付き）';
COMMENT ON COLUMN public.items.rakuten_url IS '楽天アフィリエイトリンク';
COMMENT ON COLUMN public.items.official_store_url IS 'ブランド公式ストアURL';
COMMENT ON COLUMN public.items.affiliate_commission IS 'アフィリエイト手数料率（%）';
COMMENT ON COLUMN public.items.availability_status IS '在庫状況（available, out_of_stock, discontinued, unknown）';
COMMENT ON COLUMN public.items.tags IS 'アイテムタグ配列';
COMMENT ON COLUMN public.items.image_urls IS 'アイテム画像URL配列';

-- 3. アフィリエイトパフォーマンス追跡テーブル作成
CREATE TABLE IF NOT EXISTS public.affiliate_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('location', 'item')),
  entity_id UUID NOT NULL,
  affiliate_url TEXT NOT NULL,
  service_name TEXT NOT NULL, -- 'valuecommerce', 'amazon', 'rakuten'
  clicks_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  commission_earned DECIMAL(10,2) DEFAULT 0.00,
  last_click_at TIMESTAMP WITH TIME ZONE,
  performance_period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_period_end DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- affiliate_performanceテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_entity ON public.affiliate_performance(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_service ON public.affiliate_performance(service_name);
CREATE INDEX IF NOT EXISTS idx_affiliate_performance_period ON public.affiliate_performance(performance_period_start, performance_period_end);

-- 4. ユーザーのお気に入り店舗・アイテム管理テーブル
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('location', 'item')),
  entity_id UUID NOT NULL,
  notes TEXT,
  visited_at TIMESTAMP WITH TIME ZONE, -- 店舗の場合の訪問日時
  purchased_at TIMESTAMP WITH TIME ZONE, -- アイテムの場合の購入日時
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id)
);

-- user_favoritesテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_entity ON public.user_favorites(entity_type, entity_id);

-- 5. リンク品質管理テーブル
CREATE TABLE IF NOT EXISTS public.link_quality_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('location', 'item')),
  entity_id UUID NOT NULL,
  url TEXT NOT NULL,
  quality_score INTEGER NOT NULL CHECK (quality_score >= 0 AND quality_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('excellent', 'good', 'poor', 'broken')),
  issues JSONB, -- 品質問題の配列
  recommendations JSONB, -- 改善提案の配列
  last_checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- link_quality_reportsテーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_link_quality_entity ON public.link_quality_reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_link_quality_status ON public.link_quality_reports(status);
CREATE INDEX IF NOT EXISTS idx_link_quality_score ON public.link_quality_reports(quality_score);

-- 6. RLS (Row Level Security) ポリシーの設定

-- affiliate_performance テーブル
ALTER TABLE public.affiliate_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to affiliate_performance" ON public.affiliate_performance FOR SELECT USING (true);
CREATE POLICY "Allow all access to affiliate_performance for admin" ON public.affiliate_performance USING (true) WITH CHECK (true);

-- user_favorites テーブル
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own favorites" ON public.user_favorites USING (auth.uid() = user_id);
CREATE POLICY "Allow read access to user_favorites for admin" ON public.user_favorites FOR SELECT USING (true);

-- link_quality_reports テーブル
ALTER TABLE public.link_quality_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read access to link_quality_reports" ON public.link_quality_reports FOR SELECT USING (true);
CREATE POLICY "Allow all access to link_quality_reports for admin" ON public.link_quality_reports USING (true) WITH CHECK (true);

-- 7. トリガー関数とトリガーの作成（updated_at自動更新）

-- トリガー関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
CREATE TRIGGER update_affiliate_performance_updated_at 
  BEFORE UPDATE ON public.affiliate_performance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_link_quality_reports_updated_at
  BEFORE UPDATE ON public.link_quality_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. 初期サンプルデータの挿入（開発用）

-- サンプル営業時間データ
INSERT INTO public.locations (episode_id, name, address, website, reservation_url, rating, price_range, opening_hours, tags)
VALUES 
  ((SELECT id FROM public.episodes LIMIT 1), 'サンプルカフェ', '東京都渋谷区', 'https://sample-cafe.com', 'https://af.moshimo.com/af/c/click?a_id=123&p_id=456&pc_id=789&pl_id=000', 4.2, '¥1,000-2,000', 
   '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "closed", "thursday": "9:00-18:00", "friday": "9:00-20:00", "saturday": "10:00-20:00", "sunday": "10:00-18:00"}',
   ARRAY['カフェ', '聖地巡礼', 'インスタ映え'])
ON CONFLICT DO NOTHING;

-- サンプルアフィリエイト情報
UPDATE public.items 
SET 
  amazon_url = 'https://www.amazon.co.jp/dp/B08XXXXXX?tag=arata55507-22',
  rakuten_url = 'https://item.rakuten.co.jp/sample/item123/?_RTcand=000',
  availability_status = 'available',
  affiliate_commission = 3.00,
  tags = ARRAY['ファッション', 'よにちゃん着用', '人気']
WHERE id IN (SELECT id FROM public.items LIMIT 3);

-- 9. パフォーマンス最適化のための追加インデックス

-- 検索パフォーマンス向上
CREATE INDEX IF NOT EXISTS idx_locations_tags ON public.locations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_items_tags ON public.items USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_locations_rating ON public.locations(rating DESC);
CREATE INDEX IF NOT EXISTS idx_items_price ON public.items(price);

-- 10. ビューの作成（よく使用するクエリの最適化）

-- 高品質リンクのビュー
CREATE OR REPLACE VIEW public.high_quality_links AS
SELECT 
  lqr.entity_type,
  lqr.entity_id,
  lqr.url,
  lqr.quality_score,
  lqr.status,
  CASE 
    WHEN lqr.entity_type = 'location' THEN l.name 
    WHEN lqr.entity_type = 'item' THEN i.name 
  END as entity_name
FROM public.link_quality_reports lqr
LEFT JOIN public.locations l ON lqr.entity_type = 'location' AND lqr.entity_id = l.id::uuid
LEFT JOIN public.items i ON lqr.entity_type = 'item' AND lqr.entity_id = i.id::uuid
WHERE lqr.status IN ('excellent', 'good');

-- 人気店舗・アイテムのビュー
CREATE OR REPLACE VIEW public.popular_entities AS
SELECT 
  'location' as entity_type,
  l.id,
  l.name,
  COUNT(uf.id) as favorites_count,
  AVG(uf.rating) as avg_rating,
  l.rating as official_rating
FROM public.locations l
LEFT JOIN public.user_favorites uf ON uf.entity_type = 'location' AND uf.entity_id = l.id::uuid
GROUP BY l.id, l.name, l.rating

UNION ALL

SELECT 
  'item' as entity_type,
  i.id,
  i.name,
  COUNT(uf.id) as favorites_count,
  AVG(uf.rating) as avg_rating,
  NULL as official_rating
FROM public.items i
LEFT JOIN public.user_favorites uf ON uf.entity_type = 'item' AND uf.entity_id = i.id::uuid
GROUP BY i.id, i.name;

-- 11. 権限設定のクリーンアップ

-- 既存のRLS ポリシーで競合するものがないか確認して作成
DO $$ 
BEGIN
    -- affiliate_performance のポリシーを安全に作成
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow read access to affiliate_performance') THEN
        EXECUTE 'CREATE POLICY "Allow read access to affiliate_performance" ON public.affiliate_performance FOR SELECT USING (true)';
    END IF;
    
    -- 他のポリシーも同様に安全に作成
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage their own favorites') THEN
        EXECUTE 'CREATE POLICY "Users can manage their own favorites" ON public.user_favorites USING (auth.uid() = user_id)';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    -- エラーが発生しても続行
    RAISE NOTICE 'Some policies may already exist: %', SQLERRM;
END $$;