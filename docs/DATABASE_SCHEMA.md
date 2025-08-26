# 📊 データベーススキーマ - 食べログアフィリエイト

## 🎯 食べログリンク保存場所

### テーブル: `locations`
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  address TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  image_url TEXT,
  website_url TEXT,
  phone TEXT,
  opening_hours TEXT,
  tags TEXT[],
  episode_id UUID, -- 廃止予定（中間テーブル移行済み）
  celebrity_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tabelog_url TEXT, -- 🍽️ 食べログアフィリエイトリンク保存場所
  affiliate_info JSONB
);
```

### 🎯 重要カラム: `tabelog_url`

**データ型**: `TEXT`  
**用途**: 食べログの直接URLを保存  
**形式**: `https://tabelog.com/[地域]/[エリア]/[サブエリア]/[店舗ID]/`

#### 保存例
```sql
-- 正しい保存例
UPDATE locations 
SET tabelog_url = 'https://tabelog.com/tokyo/A1311/A131101/13279833/'
WHERE name = '志づや';

UPDATE locations 
SET tabelog_url = 'https://tabelog.com/tokyo/A1310/A131003/13021812/'  
WHERE name = '亀澤堂';
```

## 🔄 中間テーブル: `episode_locations`

食べログアフィリエイトには直接関係ないが、エピソードとロケーションの関係を管理：

```sql
CREATE TABLE episode_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL,
  location_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
  UNIQUE(episode_id, location_id)
);
```

## 📋 食べログアフィリエイト関連クエリ

### 1. 新規店舗への食べログリンク追加
```sql
UPDATE locations 
SET tabelog_url = 'https://tabelog.com/[正確なURL]',
    updated_at = NOW()
WHERE id = '[location-uuid]';
```

### 2. アフィリエイト設定済み店舗の確認
```sql
SELECT id, name, tabelog_url
FROM locations 
WHERE tabelog_url IS NOT NULL;
```

### 3. エピソード紐付きでアフィリエイト未設定の店舗
```sql
SELECT l.id, l.name, l.address
FROM locations l
INNER JOIN episode_locations el ON l.id = el.location_id
WHERE l.tabelog_url IS NULL;
```

### 4. 食べログ設定済み店舗数と予想収益
```sql
SELECT 
  COUNT(*) as affiliate_stores,
  COUNT(*) * 120 as estimated_monthly_revenue
FROM locations 
WHERE tabelog_url IS NOT NULL;
```

## 🚨 重要な制約・ルール

### 1. NULL値の扱い
- `tabelog_url` が `NULL` = アフィリエイト未設定
- 空文字列 `''` は使用しない

### 2. URL形式の検証
```sql
-- 正しい食べログURLの形式チェック
SELECT *
FROM locations 
WHERE tabelog_url IS NOT NULL 
  AND tabelog_url NOT LIKE 'https://tabelog.com/%'
```

### 3. 重複チェック
```sql
-- 同じ食べログURLが重複登録されていないかチェック
SELECT tabelog_url, COUNT(*)
FROM locations 
WHERE tabelog_url IS NOT NULL
GROUP BY tabelog_url
HAVING COUNT(*) > 1;
```

## 📊 統計・分析クエリ

### 月別アフィリエイト店舗数の推移
```sql
SELECT 
  DATE_TRUNC('month', updated_at) as month,
  COUNT(*) as new_affiliate_stores
FROM locations 
WHERE tabelog_url IS NOT NULL
GROUP BY month
ORDER BY month;
```

### エピソード別アフィリエイト店舗数
```sql
SELECT 
  e.title as episode_title,
  COUNT(l.tabelog_url) as affiliate_stores
FROM episodes e
LEFT JOIN episode_locations el ON e.id = el.episode_id
LEFT JOIN locations l ON el.location_id = l.id AND l.tabelog_url IS NOT NULL
GROUP BY e.id, e.title
ORDER BY affiliate_stores DESC;
```

## 🔄 マイグレーション履歴

### 2025年8月23日 - 第1バッチ追加
```sql
-- 5店舗追加
UPDATE locations SET tabelog_url = 'https://tabelog.com/tokyo/A1311/A131101/13279833/' WHERE id = '75c9aef0-e088-48ca-8d6d-c8bf8e7d5695';
UPDATE locations SET tabelog_url = 'https://tabelog.com/tokyo/A1310/A131003/13021812/' WHERE id = '7c7d9db5-dae7-41a2-8005-c4178ae9bffa';
UPDATE locations SET tabelog_url = 'https://tabelog.com/tokyo/A1307/A130703/13197149/' WHERE id = '3b15c9b0-acad-4d83-8652-a9bddc1f9b2e';
UPDATE locations SET tabelog_url = 'https://tabelog.com/tokyo/A1304/A130401/13248277/' WHERE id = '5ec00c90-b52a-4a26-93d6-95d2c36857c4';
UPDATE locations SET tabelog_url = 'https://tabelog.com/tokyo/A1311/A131102/13003649/' WHERE id = 'fd57d908-08ac-4691-bae6-6a46611c42e5';
```

**結果**: 15店舗 → 20店舗 (月間収益: ¥1,800 → ¥2,400)

---

**📋 このスキーマは食べログアフィリエイト機能の中核です**

**最終更新**: 2025年8月23日