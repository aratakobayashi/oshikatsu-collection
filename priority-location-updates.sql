-- 優先度1: アフィリエイト対象レストラン・カフェの高品質実画像追加
-- data-creation-requirements.mdの手動キュレーション基準に従って実行

-- 1. ポール・ボキューズ 西新宿店
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80'
  ],
  description = 'ミシュラン三つ星シェフ、ポール・ボキューズの名を冠した高級フレンチレストラン',
  category = 'restaurant'
WHERE name ILIKE '%ポール・ボキューズ%' AND name ILIKE '%西新宿%';

-- 2. USHIHACHI 渋谷店
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80'
  ],
  description = '渋谷の人気焼肉店、高品質な和牛を提供',
  category = 'restaurant'
WHERE name ILIKE '%USHIHACHI%' AND name ILIKE '%渋谷%';

-- 3. NEM COFFEE & ESPRESSO
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80'
  ],
  description = 'スペシャルティコーヒーとエスプレッソが自慢のカフェ',
  category = 'cafe'
WHERE name ILIKE '%NEM COFFEE%' AND name ILIKE '%ESPRESSO%';

-- 4. Blue Seal アメリカンビレッジ店
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=250&fit=crop&q=80'
  ],
  description = '沖縄発祥の人気アイスクリームチェーン、アメリカンビレッジの店舗',
  category = 'cafe'
WHERE name ILIKE '%Blue Seal%' AND name ILIKE '%アメリカンビレッジ%';

-- 5. 浅草今半
UPDATE locations 
SET 
  image_urls = ARRAY[
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80'
  ],
  description = '創業明治28年の老舗すき焼き店、最高級の和牛を提供',
  category = 'restaurant'
WHERE name ILIKE '%今半%' AND (name ILIKE '%浅草%' OR name ILIKE '%国際通り%');

-- 更新結果を確認
SELECT 
  id,
  name,
  category,
  array_length(image_urls, 1) as image_count,
  description
FROM locations 
WHERE 
  name ILIKE '%ポール・ボキューズ%' OR
  name ILIKE '%USHIHACHI%' OR  
  name ILIKE '%NEM COFFEE%' OR
  name ILIKE '%Blue Seal%' OR
  name ILIKE '%今半%'
ORDER BY name;