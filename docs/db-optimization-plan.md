# 推し活コレクション DB最適化計画

## 🎯 ビジネスゴール
セレブリティファンが聖地巡礼する際に、食べログ予約を通じてアフィリエイト収益を最大化する

## 📊 現状分析（2025年8月23日）

### 数値サマリー
- エピソード総数: 1,000件
- ロケーション総数: 721件
- エピソード紐付きロケーション: 21件（2.9%）
- Tabelog設定済み: 15件
- 最適化済み（エピソード+Tabelog）: 4件
- **現在の月間収益: ¥480**
- **収益ポテンシャル: ¥2,520**
- **改善余地: 81%**

## 🏗️ 理想的なDB構造

### テーブル構成
```sql
-- 1. celebrities (セレブリティ/アイドル)
celebrities
├── id (PK)
├── name
├── group_id (FK)
├── profile_image_url
├── instagram_url
└── created_at

-- 2. groups (グループ)
groups
├── id (PK)
├── name (=SHOW, ≠ME, 櫻坂46など)
├── official_url
└── created_at

-- 3. episodes (エピソード/動画)
episodes
├── id (PK)
├── title
├── youtube_url
├── published_at
├── view_count
├── celebrity_id (FK) -- NEW: セレブリティ紐付け
└── created_at

-- 4. episode_celebrities (中間テーブル) -- NEW
episode_celebrities
├── episode_id (FK)
├── celebrity_id (FK)
└── appeared_at (出演時間)

-- 5. episode_locations (中間テーブル)
episode_locations
├── episode_id (FK)
├── location_id (FK)
├── visited_at (訪問時間)
└── description (シーンの説明)

-- 6. locations (ロケーション)
locations
├── id (PK)
├── name
├── address
├── category (restaurant, cafe, shop等)
├── tabelog_url -- アフィリエイト収益源
├── google_maps_url
├── instagram_hashtag
└── created_at
```

## 🚀 実装ロードマップ

### Phase 1: 即効性のある収益改善（1週間）
**目標: 月間収益 ¥480 → ¥2,520**

1. **エピソード紐付きロケーション17件にTabelog追加**
   - 優先度: 人気エピソード順
   - 手動検証でURL確認
   - 実装済みスクリプト活用

2. **人気エピソードTop10のロケーション特定**
   - YouTubeビュー数でソート
   - ロケーション情報抽出
   - Tabelog設定

### Phase 2: セレブリティデータ整備（2週間）
**目標: ユーザーエンゲージメント向上**

1. **メンバーマスタ作成**
   - =SHOW, ≠ME, 櫻坂46メンバー登録
   - プロフィール画像設定
   - SNSリンク追加

2. **エピソード-セレブリティ紐付け**
   - 既存1,000エピソードの出演者特定
   - episode_celebrities テーブル作成

### Phase 3: コンテンツ拡充（1ヶ月）
**目標: エピソード紐付きロケーション100件達成**

1. **人気動画の系統的分析**
   - 再生回数Top100の動画分析
   - ロケーション情報抽出
   - データベース登録

2. **Tabelog対応可能店舗の特定**
   - レストラン・カフェ優先
   - 営業中店舗確認
   - アフィリエイトURL設定

### Phase 4: ユーザー体験最適化（継続）
**目標: コンバージョン率向上**

1. **検索機能強化**
   - セレブリティ別検索
   - エリア別検索
   - ジャンル別フィルター

2. **レコメンド機能**
   - 人気聖地ランキング
   - 近隣スポット提案
   - ファン投稿機能

## 📈 KPI目標

### 短期（1ヶ月）
- エピソード紐付きロケーション: 21件 → 50件
- Tabelog設定済み: 15件 → 40件
- 月間収益: ¥480 → ¥3,000

### 中期（3ヶ月）
- エピソード紐付きロケーション: 100件
- Tabelog設定済み: 80件
- 月間収益: ¥6,000

### 長期（6ヶ月）
- エピソード紐付きロケーション: 200件
- Tabelog設定済み: 150件
- 月間収益: ¥12,000

## 🔧 技術的実装

### 必要なマイグレーション
```sql
-- 1. celebritiesテーブル作成
CREATE TABLE celebrities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  group_id UUID REFERENCES groups(id),
  profile_image_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. groupsテーブル作成
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  official_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. episode_celebritiesテーブル作成
CREATE TABLE episode_celebrities (
  episode_id UUID REFERENCES episodes(id),
  celebrity_id UUID REFERENCES celebrities(id),
  appeared_at INTEGER, -- 秒数
  PRIMARY KEY (episode_id, celebrity_id)
);

-- 4. episodesテーブル更新
ALTER TABLE episodes 
ADD COLUMN view_count INTEGER,
ADD COLUMN published_at TIMESTAMP;
```

## 💰 収益シミュレーション

### 前提条件
- 1ロケーションあたり月間クリック数: 3回
- コンバージョン率: 2%
- 平均単価: ¥2,000
- 手数料率: 3%
- **1店舗あたり月間収益: ¥120**

### 収益予測
| 店舗数 | 月間収益 | 年間収益 |
|--------|----------|----------|
| 10 | ¥1,200 | ¥14,400 |
| 25 | ¥3,000 | ¥36,000 |
| 50 | ¥6,000 | ¥72,000 |
| 100 | ¥12,000 | ¥144,000 |
| 200 | ¥24,000 | ¥288,000 |

## ✅ 次のアクション

1. **即実行（今日）**
   - エピソード紐付き17件のTabelog URL調査
   - 人気エピソードTop10の特定

2. **今週中**
   - Tabelog URL実装スクリプト実行
   - セレブリティマスタ設計

3. **来週**
   - DB構造改善の実装開始
   - ユーザーテスト実施

## 📝 注意事項

- 品質重視：ダミーURL絶対禁止
- 手動検証：全Tabelog URLは実在確認必須
- ユーザー第一：聖地巡礼体験の向上を最優先
- 透明性：アフィリエイトリンクは明示

---
*最終更新: 2025年8月23日*