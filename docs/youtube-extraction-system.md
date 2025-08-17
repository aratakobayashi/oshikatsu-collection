# YouTube概要欄ベース飲食店抽出システム

## 概要

YouTube動画の概要欄から飲食店・レストラン・カフェの情報をAIで自動抽出し、各種グルメサイトへのリンクを自動生成するシステムです。

特に=LOVEのような公式チャンネルで、概要欄に訪問した店舗の住所付き情報が記載されている動画に対して高い精度で抽出が可能です。

## 特徴

✅ **高精度**: 公式チャンネルの概要欄という信頼できる一次情報源を使用  
✅ **実用性**: ぐるなび、食べログ、ホットペッパーなどのリンクを自動生成  
✅ **ファン価値**: 推しと同じ店舗への訪問が容易に  
✅ **AI活用**: GPT-4による構造化データ抽出  

## システム構成

```
YouTube動画概要欄 
    ↓ 
AI抽出 (GPT-4)
    ↓
住所・店舗名・ジャンル抽出
    ↓
外部サービスリンク生成
    ↓
データベース保存
```

## 必要な環境変数

`.env.staging` ファイルに以下を設定：

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API (GPT-4使用)
OPENAI_API_KEY=your_openai_api_key

# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# グルメサイトAPI (オプション)
GURUNAVI_API_KEY=your_gurunavi_api_key
```

## 使用方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. テスト実行

```bash
npm run test:youtube-extraction
```

このコマンドで以下をテスト：
- AI抽出機能の動作確認
- サービスリンク生成の確認
- 環境変数設定の確認

### 3. =LOVE データの実際の抽出

```bash
npm run process:equal-love
```

このコマンドで：
- =LOVEの最新10エピソードを処理
- YouTube概要欄から飲食店情報を抽出
- データベースに自動保存

## 抽出データの例

```json
{
  "name": "浅草もんじゃ もんろう",
  "address": "東京都台東区浅草1-41-2", 
  "category": "restaurant",
  "description": "もんじゃ焼きが絶品でした！メンバーみんなで盛り上がりました",
  "confidence": "high",
  "service_links": {
    "googleMaps": "https://www.google.com/maps/search/...",
    "gurunavi": "https://r.gnavi.co.jp/...",
    "tabelog": "https://tabelog.com/...",
    "hotpepper": "https://www.hotpepper.jp/...",
    "retty": "https://retty.me/..."
  }
}
```

## データベーススキーマ

### locations テーブル
- `name`: 店舗名
- `address`: 住所
- `category`: カテゴリ（restaurant, cafe等）
- `description`: 概要欄での言及内容
- `website_url`: Google Mapsリンク
- `tags`: ["AI抽出", "YouTube概要欄", "high"]
- `episode_id`: 紐づくエピソードID
- `celebrity_id`: 紐づく芸能人ID
- `confidence`: 信頼度 (high/medium/low)
- `source`: "youtube_description"

## 改善可能な点

### 短期改善
1. **フィルタリング強化**: 品質基準の厳格化
2. **エラーハンドリング**: API制限対応
3. **バッチ処理**: 大量処理の最適化

### 中期改善
1. **画像解析**: 動画サムネイルから店舗情報抽出
2. **多言語対応**: 英語概要欄への対応
3. **リアルタイム処理**: 新動画の自動監視

### 長期改善
1. **コミュニティ検証**: ファンによるデータ確認システム
2. **予約連携**: 各サービスの予約システムとの連携
3. **位置情報連携**: GPSを使った近隣店舗推薦

## トラブルシューティング

### よくある問題

**Q: OpenAI APIエラーが発生する**
A: API キーの確認、使用量制限の確認を行ってください

**Q: YouTube API エラーが発生する**
A: 動画IDの形式、APIキーの権限を確認してください

**Q: 抽出精度が低い**
A: 概要欄の内容を確認し、住所情報が含まれているかチェックしてください

### ログの確認

```bash
# 詳細ログを確認
npm run process:equal-love 2>&1 | tee extraction.log
```

## API使用量の目安

- **OpenAI GPT-4**: 1動画あたり約0.01-0.05ドル
- **YouTube Data API**: 1動画あたり1ユニット
- **グルメサイトAPI**: 店舗検索1回あたり1リクエスト

## 開発者向け情報

### ファイル構成

```
src/scripts/data-collection/
├── youtube-description-extractor.ts    # YouTube抽出エンジン
├── enhanced-location-processor.ts      # DB統合処理
└── test-youtube-extraction.ts          # テストスイート
```

### カスタマイズ

新しい芸能人への対応：
1. `enhanced-location-processor.ts`の`processCelebrityEpisodes()`を使用
2. Celebrity IDを指定して実行

新しいグルメサイトへの対応：
1. `RestaurantLinkGenerator`クラスに新しいメソッドを追加
2. `generateServiceLinks()`にリンク生成ロジックを追加

## ライセンス

このシステムは推し活コレクションプロジェクトの一部として提供されます。