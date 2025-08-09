# よにのチャンネル本番環境移行ガイド

## 概要
開発環境の「配信者テスト01」モックデータから、よにのチャンネルの実データを使った本番環境への移行手順です。

## フェーズ1: 本番Supabase環境セットアップ

### 1.1 Supabaseプロジェクト作成
1. [Supabase Dashboard](https://app.supabase.com/) にアクセス
2. 「New project」をクリック
3. プロジェクト設定:
   - **Project name**: `oshikatsu-collection-prod`
   - **Database password**: 強力なパスワードを設定
   - **Region**: `Northeast Asia (Tokyo)` (ap-northeast-1)

### 1.2 データベーススキーマ作成
1. Supabase Dashboard → SQL Editor
2. `scripts/supabase-production-schema.sql` の内容をコピー&ペースト
3. 「Run」をクリックしてスキーマ作成実行

### 1.3 環境変数設定
1. `.env.production.template` をコピーして `.env.production` を作成
2. Supabase Dashboard → Settings → API から以下を取得:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## フェーズ2: YouTube Data API設定

### 2.1 Google Cloud Consoleでプロジェクト作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成: `oshikatsu-youtube-api`
3. YouTube Data API v3を有効化
4. 認証情報を作成（APIキー）
5. APIキーに適切な制限を設定:
   - **Application restrictions**: None (または適切な制限)
   - **API restrictions**: YouTube Data API v3のみ

### 2.2 API使用量制限設定
```json
{
  "dailyQuotaLimit": 10000,
  "requestsPerSecond": 1,
  "maxConcurrentRequests": 1
}
```

### 2.3 環境変数に追加
```env
VITE_YOUTUBE_API_KEY=your-youtube-api-key
VITE_YONI_CHANNEL_ID=UC2alHD2WkakOiTxCxF-uMAg
VITE_YONI_CHANNEL_URL=https://www.youtube.com/channel/UC2alHD2WkakOiTxCxF-uMAg
```

## フェーズ3: データ収集システム実行

### 3.1 よにのチャンネル基本情報取得
```bash
npm run collect:yoni-basic
```

### 3.2 動画データ収集（段階的）
```bash
# 最新50本の動画データを収集
npm run collect:yoni-videos --max=50

# 人気動画TOP10を特定
npm run collect:yoni-popular --limit=10

# 全動画データ収集（APIクォータに注意）
npm run collect:yoni-all
```

### 3.3 データ品質チェック
```bash
npm run validate:production-data
```

## フェーズ4: 本番環境テスト

### 4.1 環境切り替え
```bash
# 本番環境に切り替え
export VITE_ENVIRONMENT=production
npm run build
npm run preview
```

### 4.2 機能テスト
1. ホームページ表示
2. よにのチャンネル検索
3. 動画エピソード詳細表示
4. アイテム・ロケーション情報表示
5. ユーザージャーニーテスト実行

### 4.3 パフォーマンステスト
- 初期読み込み時間
- 検索レスポンス時間
- 大量データ表示性能

## フェーズ5: デプロイ準備

### 5.1 Vercel/Netlifyデプロイ設定
```env
# Vercel/Netlify環境変数
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_YOUTUBE_API_KEY=your-youtube-api-key
VITE_YONI_CHANNEL_ID=UC2alHD2WkakOiTxCxF-uMAg
```

### 5.2 ビルド・デプロイテスト
```bash
npm run build
npm run start
```

## 注意事項

### API使用量管理
- YouTube Data API: 1日10,000リクエスト制限
- リクエスト間隔: 1秒以上空ける
- エラーハンドリング: 3回リトライ実装

### データプライバシー
- よにのチャンネル公開情報のみ収集
- 個人情報は一切保存しない
- YouTubeコミュニティガイドライン遵守

### セキュリティ
- APIキーをクライアントサイドで露出させない
- Supabase RLSポリシー適用
- 適切なCORS設定

## トラブルシューティング

### よくあるエラー
1. **YouTube API Quota Exceeded**: 翌日まで待機またはAPIキー追加
2. **Supabase Connection Error**: URL・キーの確認
3. **CORS Error**: Supabase設定確認
4. **Rate Limit**: リクエスト間隔調整

### ログ確認方法
```bash
# 本番ログ確認
npm run logs:production

# API使用量確認
npm run check:api-usage
```

## 成功基準

### Phase 1完了時
- [ ] Supabaseプロジェクト作成完了
- [ ] スキーマ作成成功
- [ ] 接続テスト成功

### Phase 2完了時
- [ ] YouTube API設定完了
- [ ] APIキーテスト成功
- [ ] レート制限設定適用

### Phase 3完了時
- [ ] よにのチャンネル情報取得成功
- [ ] 動画データ50本以上収集
- [ ] データ品質チェック合格

### Phase 4完了時
- [ ] 本番環境での表示確認
- [ ] 全機能動作確認
- [ ] パフォーマンス基準達成

### Phase 5完了時
- [ ] 本番デプロイ成功
- [ ] 外部アクセス確認
- [ ] モニタリング設定完了

---

## 緊急時連絡先
- Supabase Support: support@supabase.com
- YouTube API Support: Google Cloud Support
- 開発チーム: [開発者連絡先]