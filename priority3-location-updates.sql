-- 優先度3: ファンによく知られた聖地（聖地巡礼スポット）の高品質実画像追加
-- data-creation-requirements.mdの手動キュレーション基準に従って実行

-- 1. 竹下通り（原宿ポップカルチャーの聖地）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=250&fit=crop&q=80', -- 原宿竹下通りの人混み
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', -- ポップカルチャーの街並み
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80'  -- 原宿のカラフルな店舗
  ],
  description = '原宿のポップカルチャーの聖地。若者文化の発信地として多くのタレントが訪れる人気スポット',
  category = 'tourist'
WHERE name ILIKE '%竹下通り%' OR (name ILIKE '%竹下%' AND name ILIKE '%原宿%');

-- 2. 江ノ島（神奈川の人気観光地）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', -- 江ノ島の海岸風景
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80', -- 江ノ島弁天橋
    'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'  -- 江ノ島灯台と夕景
  ],
  description = '神奈川県の人気観光地。美しい海岸と島の風景で多くのロケ地として使用される',
  category = 'tourist'
WHERE name ILIKE '%江ノ島%' OR name ILIKE '%江の島%' OR name ILIKE '%えのしま%';

-- 3. 代々木公園（東京都渋谷区の大型公園）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', -- 代々木公園の桜
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', -- 公園の広場
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80'  -- 緑豊かな公園風景
  ],
  description = '東京都渋谷区の大型公園。イベントやピクニックの定番スポットとして親しまれる',
  category = 'tourist'
WHERE name ILIKE '%代々木公園%' OR (name ILIKE '%代々木%' AND name ILIKE '%公園%');

-- 4. 鎌倉大仏（歴史ある名所）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', -- 鎌倉大仏の威厳
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', -- 大仏への参道
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80'  -- 境内の静寂な雰囲気
  ],
  description = '鎌倉の象徴的な大仏像。歴史ある寺院として多くの観光客が訪れる神奈川県の名所',
  category = 'tourist'
WHERE name ILIKE '%鎌倉大仏%' OR (name ILIKE '%大仏%' AND name ILIKE '%鎌倉%') OR name ILIKE '%高徳院%';

-- 5. お台場海浜公園（レインボーブリッジビュー）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80', -- お台場の夜景
    'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&q=80', -- レインボーブリッジビュー
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80'  -- 東京湾の美しい景観
  ],
  description = '東京湾に面した人工海浜公園。レインボーブリッジの絶景で知られるデートスポット',
  category = 'tourist'
WHERE name ILIKE '%お台場海浜公園%' OR (name ILIKE '%お台場%' AND name ILIKE '%海浜%') OR name ILIKE '%台場%';

-- 6. アメ横（上野の活気ある商店街）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', -- アメ横商店街の活気
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80', -- 商店街のショッピング
    'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80'  -- 上野アメ横の賑わい
  ],
  description = '上野駅前の活気ある商店街。戦後から続く歴史ある市場で食べ歩きやお買い物が楽しめる',
  category = 'shop'
WHERE name ILIKE '%アメ横%' OR name ILIKE '%アメヤ横丁%' OR (name ILIKE '%上野%' AND name ILIKE '%アメ%');

-- 7. 築地場外市場（食の聖地）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80', -- 築地の新鮮な海鮮
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', -- 市場の活気
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80'  -- 食べ歩きグルメ
  ],
  description = '東京の台所として親しまれる築地の場外市場。新鮮な海鮮グルメが味わえる食の聖地',
  category = 'restaurant'
WHERE name ILIKE '%築地%' OR (name ILIKE '%築地%' AND name ILIKE '%市場%') OR name ILIKE '%場外市場%';

-- 8. 明治神宮（東京の代表的神社）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', -- 明治神宮の鳥居
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', -- 神宮の森
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80'  -- 参拝客で賑わう境内
  ],
  description = '明治天皇と昭憲皇太后を祀る東京の代表的神社。初詣や観光で多くの人が訪れる',
  category = 'tourist'
WHERE name ILIKE '%明治神宮%';

-- 9. 秋葉原電気街（オタク文化の聖地）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80', -- 秋葉原の夜のネオン
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80', -- 電器店の賑わい
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop&q=80'  -- アキバの人通り
  ],
  description = '世界的に有名な電気街・オタク文化の聖地。アニメ、マンガ、電子機器の専門店が集積',
  category = 'shop'
WHERE name ILIKE '%秋葉原%' OR name ILIKE '%アキバ%' OR name ILIKE '%アキハバラ%';

-- 10. 皇居東御苑（江戸城跡の庭園）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', -- 皇居東御苑の桜
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', -- 江戸城跡の庭園
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80'  -- 日本庭園の美しさ
  ],
  description = '皇居の一般公開エリア。江戸城跡の歴史ある庭園で四季の自然が楽しめる',
  category = 'tourist'
WHERE name ILIKE '%皇居東御苑%' OR (name ILIKE '%皇居%' AND name ILIKE '%東御苑%');

-- 更新結果を確認
SELECT 
  id,
  name,
  category,
  array_length(image_urls, 1) as image_count,
  LEFT(description, 50) || '...' as description_preview
FROM locations 
WHERE 
  name ILIKE '%竹下通り%' OR
  name ILIKE '%江ノ島%' OR  
  name ILIKE '%代々木公園%' OR
  name ILIKE '%鎌倉大仏%' OR
  name ILIKE '%お台場%' OR
  name ILIKE '%アメ横%' OR
  name ILIKE '%築地%' OR
  name ILIKE '%明治神宮%' OR
  name ILIKE '%秋葉原%' OR
  name ILIKE '%皇居東御苑%'
ORDER BY category, name;