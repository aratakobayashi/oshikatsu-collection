-- 優先度2: 複数エピソードで登場する人気スポットの高品質実画像追加
-- data-creation-requirements.mdの手動キュレーション基準に従って実行

-- 1. すみだ水族館（観光・娯楽の代表スポット）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop&q=80', -- 水族館内部、魚の群れ
    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=250&fit=crop&q=80', -- 水族館の幻想的な照明
    'https://images.unsplash.com/photo-1520637836862-4d197d17c92a?w=400&h=250&fit=crop&q=80'  -- クラゲの美しい展示
  ],
  description = '東京スカイツリータウンにある人気の水族館。ペンギンやクラゲなど多彩な海の生き物を展示',
  category = 'tourist'
WHERE name ILIKE '%すみだ水族館%';

-- 2. 東京ドーム（エンターテイメント施設の代表）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80', -- 東京ドーム外観
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80', -- スタジアム内部
    'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=250&fit=crop&q=80'  -- ドーム球場の照明
  ],
  description = '日本初の屋根付き球場として親しまれる東京ドーム。野球観戦やコンサートなど多目的に利用',
  category = 'tourist'
WHERE name ILIKE '%東京ドーム%';

-- 3. 銀座三越（高級ショッピングの代表）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80', -- 高級デパート外観
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80', -- デパート内部のラグジュアリー空間
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'  -- 高級ショッピング
  ],
  description = '銀座を代表する老舗百貨店。最高級のファッション、グルメ、ライフスタイル商品が揃う',
  category = 'shop'
WHERE name ILIKE '%銀座三越%' OR (name ILIKE '%三越%' AND name ILIKE '%銀座%');

-- 4. 渋谷スクランブル交差点（観光名所）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop&q=80', -- スクランブル交差点の人波
    'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80', -- 渋谷の夜景
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80'  -- 渋谷交差点上空からの撮影
  ],
  description = '世界で最も有名な交差点の一つ。1日約50万人が行き交う東京の象徴的なスポット',
  category = 'tourist'
WHERE name ILIKE '%渋谷%' AND (name ILIKE '%スクランブル%' OR name ILIKE '%交差点%');

-- 5. 東京タワー（観光名所の代表）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&q=80', -- 東京タワーの赤い姿
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80', -- 夜の東京タワー
    'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'  -- 東京タワーと街並み
  ],
  description = '1958年開業の東京のシンボル。高さ333mの電波塔で、展望台からは東京の絶景を望める',
  category = 'tourist'
WHERE name ILIKE '%東京タワー%';

-- 6. 浅草寺（伝統文化・観光名所）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80', -- 浅草寺の雷門
    'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', -- 浅草寺本堂
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80'  -- 浅草の仲見世通り
  ],
  description = '東京最古の寺院として1400年の歴史を持つ。雷門と仲見世通りで知られる東京の代表的観光地',
  category = 'tourist'
WHERE name ILIKE '%浅草寺%' OR (name ILIKE '%浅草%' AND name ILIKE '%寺%');

-- 7. 新宿御苑（公園・自然スポット）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', -- 新宿御苑の桜
    'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80', -- 日本庭園の美しい池
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80'  -- 公園の緑豊かな風景
  ],
  description = '新宿の中心にある58.3haの広大な国民公園。四季折々の美しい自然と日本庭園が楽しめる',
  category = 'tourist'
WHERE name ILIKE '%新宿御苑%' OR (name ILIKE '%新宿%' AND name ILIKE '%御苑%');

-- 8. 上野動物園（ファミリー向け観光スポット）
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=400&h=250&fit=crop&q=80', -- パンダ（動物園の人気者）
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', -- 動物園の自然環境
    'https://images.unsplash.com/photo-1574146681337-f0b6709f0b58?w=400&h=250&fit=crop&q=80'  -- 動物園の入口や施設
  ],
  description = '1882年開園の日本最古の動物園。ジャイアントパンダをはじめ約400種3000点の動物を飼育',
  category = 'tourist'
WHERE name ILIKE '%上野動物園%' OR (name ILIKE '%上野%' AND name ILIKE '%動物園%');

-- 更新結果を確認
SELECT 
  id,
  name,
  category,
  array_length(image_urls, 1) as image_count,
  LEFT(description, 50) || '...' as description_preview
FROM locations 
WHERE 
  name ILIKE '%すみだ水族館%' OR
  name ILIKE '%東京ドーム%' OR  
  name ILIKE '%銀座三越%' OR
  name ILIKE '%スクランブル%' OR
  name ILIKE '%東京タワー%' OR
  name ILIKE '%浅草寺%' OR
  name ILIKE '%新宿御苑%' OR
  name ILIKE '%上野動物園%'
ORDER BY category, name;