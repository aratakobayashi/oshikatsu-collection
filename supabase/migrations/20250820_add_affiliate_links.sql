-- 食べログアフィリエイトリンクを格納するフィールドをlocationsテーブルに追加
ALTER TABLE public.locations
ADD COLUMN IF NOT EXISTS tabelog_url TEXT,
ADD COLUMN IF NOT EXISTS affiliate_info JSONB DEFAULT '{}';

-- affiliate_infoには以下の情報を格納予定：
-- {
--   "tabelog": {
--     "url": "アフィリエイトリンクURL",
--     "restaurant_id": "食べログの店舗ID",
--     "tracking_code": "トラッキングコード",
--     "last_updated": "最終更新日時"
--   },
--   "other_affiliates": {} // 将来的に他のアフィリエイトサービスを追加可能
-- }

-- インデックスを追加（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_locations_tabelog_url ON public.locations(tabelog_url) WHERE tabelog_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_affiliate_info ON public.locations USING GIN(affiliate_info);

-- コメントを追加
COMMENT ON COLUMN public.locations.tabelog_url IS '食べログのアフィリエイトリンクURL';
COMMENT ON COLUMN public.locations.affiliate_info IS 'アフィリエイト関連情報を格納するJSONフィールド';