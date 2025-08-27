# データ作成・処理要件ドキュメント

## 概要
このドキュメントは、oshikatsu-collectionプロジェクトにおけるデータ作成・処理の包括的な要件を定義します。YouTubeチャンネルデータを起点として、celebrities、episodes、locations、itemsの各データを連携して作成・管理する手順を示します。

## 🎯 全体的な目標
- YouTubeチャンネルから包括的なアイドル・タレントデータベースを構築
- エピソードごとのロケーション・アイテム情報を詳細に記録
- 収益化（食べログアフィリエイト）とユーザビリティの両立
- 検索・フィルタリング機能の充実

---

## 1. Celebritiesデータ作成要件

### 1.1 データソース
- **主要ソース**: YouTubeチャンネル情報
- **補助ソース**: 公式サイト、Wikipedia、ファンサイト

### 1.2 必須データ項目
```typescript
interface Celebrity {
  id: string                    // UUID
  name: string                  // フルネーム
  slug: string                  // URL用スラッグ
  type: 'individual' | 'group' | 'youtube_channel'
  secondary_types?: ('individual' | 'group' | 'youtube_channel')[]  // 複数タイプ対応
  agency?: string               // 所属事務所
  image_url?: string           // プロフィール画像
  subscriber_count?: number    // YouTube登録者数
  fandom_name?: string         // ファンダム名
  official_color?: string      // 公式カラー（hex）
  debut_date?: string          // デビュー日
  bio?: string                 // プロフィール
  status: 'active' | 'inactive' // 活動状況
}
```

### 1.3 データ取得・処理手順
1. **YouTubeチャンネル情報取得**
   ```bash
   # YouTube Data API v3を使用
   GET https://www.googleapis.com/youtube/v3/channels
   ```

2. **複数タイプの処理**
   - グループ＋YouTubeチャンネル: SixTONES, Snow Man, なにわ男子
   - 個人＋YouTubeチャンネル: 二宮和也, 中丸雄一
   - `secondary_types`配列で管理

3. **画像取得**
   - YouTube thumbnail URL優先
   - 404エラー時の代替画像設定
   - 無効ID(`sample`, `pending`, `EP\\d+_`, `test`, `dummy`)の検証

4. **データ検証**
   - 重複チェック（name, slug）
   - 必須項目の存在確認
   - URL形式の妥当性検証

---

## 2. Episodesデータ作成要件

### 2.1 データソース
- **主要ソース**: YouTube動画情報
- **補助ソース**: 動画説明欄、コメント、関連サイト

### 2.2 必須データ項目
```typescript
interface Episode {
  id: string                   // UUID
  celebrity_id: string         // celebrities.idへの外部キー
  title: string               // エピソードタイトル
  date: string                // 放送・公開日 (YYYY-MM-DD)
  description?: string        // 説明・概要
  video_url?: string          // YouTube URL
  thumbnail_url?: string      // サムネイル画像
  platform: 'youtube' | 'tv' | 'instagram' | 'tiktok' | 'other'
  duration_minutes?: number   // 動画長（分）
  view_count?: number         // 再生数
  notes?: string             // 追加メモ
}
```

### 2.3 データ取得・処理手順
1. **YouTube動画データ取得**
   ```bash
   # YouTube Data API v3を使用
   GET https://www.googleapis.com/youtube/v3/videos
   ```

2. **タイトル・説明文の処理**
   - 自動生成タイトルの改善
   - 重要キーワードの抽出
   - 位置情報・アイテム情報のパース

3. **関連データの抽出**
   - 説明欄からロケーション情報を識別
   - アイテム情報の抽出
   - タイムスタンプ情報の解析

---

## 3. Locationsデータ作成・管理要件

### 3.1 データ項目
```typescript
interface Location {
  id: string                   // UUID
  name: string                // 店舗・施設名
  address?: string            // 住所
  category: string            // カテゴリ（下記参照）
  description?: string        // 説明
  image_urls: string[]        // 画像URL配列
  reservation_url?: string    // 予約・詳細URL
  phone?: string             // 電話番号
  website?: string           // 公式サイト
  opening_hours?: object     // 営業時間（JSON）
  price_range?: string       // 価格帯
  latitude?: number          // 緯度
  longitude?: number         // 経度
}
```

### 3.2 カテゴリ分類システム

#### 3.2.1 対応カテゴリ
| カテゴリ | ラベル | 色 | 主要キーワード |
|---------|--------|----|--------------| 
| `restaurant` | レストラン | オレンジ | レストラン,焼肉,ラーメン,居酒屋,すし,天ぷら,定食,〜屋,〜亭 |
| `cafe` | カフェ | アンバー | カフェ,コーヒー,スタバ,喫茶,アイス,パンケーキ,ラテ |
| `shop` | ショップ | パープル | ショップ,デパート,三越,ティファニー,ブティック,〜堂,本舗 |
| `hotel` | ホテル | ブルー | ホテル,旅館,リゾート,宿泊 |
| `tourist` | 観光・娯楽 | グリーン | 水族館,公園,博物館,神社,ドーム,城,ビーチ,タワー |
| `venue` | 会場 | - | 会場,ホール,劇場,スタジオ |

#### 3.2.2 自動分類ロジック
```typescript
// 店舗名からカテゴリを推測
const inferCategoryFromName = (name: string) => {
  const lowerName = name.toLowerCase()
  
  // 各カテゴリのキーワード配列でマッチング
  if (restaurantKeywords.some(keyword => lowerName.includes(keyword))) return 'restaurant'
  if (cafeKeywords.some(keyword => lowerName.includes(keyword))) return 'cafe'
  // ... 他のカテゴリも同様
  
  return 'other'
}
```

### 3.3 検索・フィルタリング要件

#### 3.3.1 フォールバック検索システム
```typescript
// categoryカラムが存在しない場合の対処
if (error && error.code === '42703') {
  // 名前ベースの部分マッチング検索にフォールバック
  const conditions = []
  if (query.trim()) {
    conditions.push(`name.ilike.%${query}%`)
    conditions.push(`address.ilike.%${query}%`)
  }
  if (categoryFilter !== 'all') {
    getCategoryKeywords(categoryFilter).forEach(keyword => {
      conditions.push(`name.ilike.%${keyword}%`)
    })
  }
  fallbackQuery = fallbackQuery.or(conditions.join(','))
}
```

#### 3.3.2 画像システム

**段階的改善アプローチ**:
1. **フェーズ1**: 全ロケーションに高品質プレースホルダー適用（完了）
2. **フェーズ2**: 重要店舗から手動キュレーションで実画像追加
3. **フェーズ3**: 将来的にAPI自動化も検討

```typescript
// 画像取得の優先順位
const getLocationImage = (location: LocationWithDetails) => {
  // 1. 手動追加された実画像（最優先）
  if (location.image_urls?.length > 0) {
    return location.image_urls[0]
  }
  
  // 2. カテゴリ別高品質プレースホルダー（フォールバック）
  return getCategoryImage(location.category, location.id)
}

// カテゴリ別高品質プレースホルダー画像
const getCategoryImage = (category: string, locationId: string) => {
  const restaurantImages = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop',
    // ... 5枚のレストラン画像
  ]
  const cafeImages = [
    'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=250&fit=crop',
    // ... 5枚のカフェ画像
  ]
  const shopImages = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop',
    // ... 5枚のショップ画像
  ]
  const touristImages = [
    'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400&h=250&fit=crop',
    // ... 5枚の観光地画像
  ]
  const hotelImages = [
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=250&fit=crop',
    // ... 3枚のホテル画像
  ]
  
  // カテゴリ別に画像を選択、locationIdで一意性確保
  const images = getImageArray(category)
  const index = parseInt(locationId.replace(/[^0-9]/g, '') || '0') % images.length
  return images[index]
}
```

**手動キュレーションの基準**:
- **優先度1**: アフィリエイト対象の重要レストラン・カフェ
- **優先度2**: 複数エピソードで登場する人気スポット
- **優先度3**: ファンによく知られた聖地
- **画質基準**: 400x250px以上、鮮明で魅力的な画像
- **権利関係**: 使用許可済み、または権利フリー画像のみ

### 3.4 収益化要件（食べログアフィリエイト）

#### 3.4.1 アフィリエイトリンク管理
```typescript
interface AffiliateLink {
  location_id: string         // locations.id
  tabelog_url: string        // 食べログURL
  affiliate_url: string      // アフィリエイト変換後URL
  commission_rate?: number   // 手数料率
  last_updated: string       // 最終更新日
}
```

#### 3.4.2 実装要件
- 食べログURLの自動検出・収集
- バリューコマース等のアフィリエイトサービス連携
- 予約ボタンでのアフィリエイトリンク表示
- クリック率・収益のトラッキング

---

## 4. Itemsデータ作成要件

### 4.1 データ項目
```typescript
interface Item {
  id: string                  // UUID
  episode_id: string          // episodes.idへの外部キー
  name: string               // アイテム名
  brand?: string             // ブランド名
  category: string           // カテゴリ（clothing, shoes, bag, accessory, etc.）
  price?: number             // 価格
  currency: string           // 通貨（JPY）
  affiliate_url?: string     // アフィリエイトURL
  image_url?: string         // 商品画像
  description?: string       // 説明
  color?: string             // 色
  size?: string              // サイズ
  material?: string          // 素材
  is_available: boolean      // 購入可能性
}
```

### 4.2 データ取得・処理手順
1. **エピソード映像からのアイテム識別**
   - スクリーンショット解析
   - 説明欄からのアイテム情報抽出
   - タイムスタンプとアイテムの関連付け

2. **商品情報の補完**
   - ブランド公式サイトからの価格取得
   - Amazonアソシエイト等のアフィリエイトリンク生成
   - 在庫状況の確認

---

## 5. データ関連・表示要件

### 5.1 Episode_Locationsテーブル
```typescript
interface EpisodeLocation {
  id: string                  // UUID
  episode_id: string          // episodes.id
  location_id: string         // locations.id
  visited_at?: number         // エピソード内での訪問時間（秒）
  description?: string        // シーンの説明
  featured: boolean          // メインロケーションフラグ
}
```

### 5.2 エピソード表示でのタグ機能
```typescript
// エピソードカードで表示するタグ
interface EpisodeTags {
  locations: Array<{
    name: string
    category: string
    color: string             // カテゴリ色
  }>
  items: Array<{
    name: string
    brand: string
    category: string
  }>
}
```

### 5.3 UI表示要件
- **エピソードカード**: ロケーション・アイテムタグの表示
- **ロケーションカード**: カテゴリバッジ、アフィリエイトボタン
- **検索フィルター**: リアルタイム検索、カテゴリフィルタ
- **レスポンシブデザイン**: モバイル・デスクトップ対応

---

## 6. データ処理ワークフロー

### 6.1 新規YouTubeチャンネル追加時
```bash
# 1. チャンネル情報取得
npx tsx scripts/fetch-youtube-channel.ts --channel-id=UC_CHANNEL_ID

# 2. 動画リスト取得・エピソード作成
npx tsx scripts/create-episodes-from-channel.ts --channel-id=UC_CHANNEL_ID

# 3. エピソードからロケーション抽出
npx tsx scripts/extract-locations-from-episodes.ts --episode-ids=UUID1,UUID2

# 4. ロケーションのカテゴリ自動分類・検証
npx tsx scripts/validate-location-categories.ts

# 5. 食べログアフィリエイトリンク生成
npx tsx scripts/generate-tabelog-affiliates.ts --location-ids=UUID1,UUID2
```

### 6.2 品質管理・検証
```bash
# データ整合性チェック
npx tsx scripts/data-validation.ts

# 画像リンク検証
npx tsx scripts/validate-image-urls.ts

# アフィリエイトリンク動作確認
npx tsx scripts/test-affiliate-links.ts
```

---

## 7. 技術要件

### 7.1 必要なAPI・サービス
- **YouTube Data API v3**: チャンネル・動画情報取得
- **Unsplash API**: プレースホルダー画像
- **食べログAPI**: 店舗情報（可能な場合）
- **バリューコマース**: アフィリエイトリンク生成
- **Google Places API**: 位置情報・詳細情報

### 7.2 データベース設計
- **Supabase PostgreSQL**: メインデータベース
- **RLS (Row Level Security)**: セキュリティ設定
- **インデックス**: 検索性能最適化
- **外部キー制約**: データ整合性保証

### 7.3 フロントエンド要件
- **React 18 + TypeScript**: UI開発
- **Tailwind CSS**: レスポンシブデザイン
- **React Router**: SPA ルーティング
- **lodash**: デバウンス検索（300ms）

---

## 8. 運用・メンテナンス

### 8.1 定期実行処理
- **週次**: YouTube動画の新規チェック・エピソード追加
- **月次**: 登録者数・再生数の更新
- **四半期**: アフィリエイトリンクの有効性確認
- **年次**: データアーカイブ・クリーンアップ

### 8.2 監視・アラート
- **API利用制限**: YouTube API使用量監視
- **画像リンク切れ**: 定期的な404チェック
- **検索性能**: レスポンス時間監視
- **収益**: アフィリエイト成果レポート

---

## 9. パフォーマンス最適化

### 9.1 検索最適化
- **インデックス作成**: name, category, celebrity_idなど
- **フルテキスト検索**: PostgreSQLのGiST/GINインデックス活用
- **キャッシュ**: 人気検索結果のキャッシュ機能

### 9.2 画像最適化
- **CDN**: 画像配信の高速化
- **レスポンシブ画像**: デバイス別最適化
- **Lazy Loading**: スクロール時の遅延読み込み

---

## 10. セキュリティ・プライバシー

### 10.1 データ保護
- **個人情報**: タレント・ファンの個人情報保護
- **API키 관리**: 環境変数での秘匿管理
- **CORS設定**: 適切なCORS政策設定

### 10.2 利用規約遵守
- **YouTube利用規約**: 動画データ使用の適法性
- **著作権**: 画像・コンテンツの適正使用
- **アフィリエイト規約**: 各ASPの規約遵守

---

このドキュメントに基づいて、一貫性のあるデータ作成・管理プロセスを実行してください。新規要件や変更があれば、このドキュメントを更新して最新状態を保持します。