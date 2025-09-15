# コンテンツ拡充ガイド

## 概要
推し活コレクションでコンテンツ拡充を依頼された時の手順をまとめています。

## コンテンツ拡充の全体フロー

### 1. 現状分析・調査
- 既存のタレント・エピソードデータの確認
- データベース構造の理解（celebrities、episodesテーブル）
- 既存スクリプトの調査
- 環境設定の確認（.env.production）

### 2. タレント追加（新規タレント）
#### 手順
1. **データ収集**: タレント情報（名前、プロフィール、タイプ）
2. **スクリプト作成**: `scripts/add-new-[category].ts`
3. **データベース追加**: celebritiesテーブルにINSERT
4. **画像取得**: 適切なAPI（YouTube Data API / TMDB API）で画像取得
5. **確認**: フロントエンドでタレント表示確認

#### 参考スクリプト
- `scripts/add-new-youtubers.ts`
- `scripts/find-correct-channel-ids.ts`

### 3. エピソード追加
#### 手順
1. **エピソード企画**: 各タレントに合った魅力的なコンテンツを企画
2. **データ構造**: episodesテーブルの構造に合わせてデータ作成
3. **スクリプト作成**: `scripts/collect-[talent-name]-episodes.ts`
4. **データベース追加**: episodesテーブルにINSERT（celebrity_idで紐付け）
5. **画像取得**: YouTube Data APIで実際の動画サムネイル取得
6. **確認**: タレント詳細ページでエピソード表示確認

#### 参考スクリプト
- `scripts/collect-new-talents-episodes.ts`
- `scripts/expand-youtube-episodes.ts`
- `scripts/fix-hikakin-episode-thumbnails.ts`

### 4. 画像対応
#### タレント画像
- YouTuber: YouTube Data APIでチャンネル画像取得
- 俳優: TMDB APIでプロフィール画像取得

#### エピソード画像
- YouTube Data APIで実際の動画サムネイル取得
- maxres → high → medium → default の優先順位

### 5. 品質保証（QA）
1. **データ整合性**: celebrity_idの紐付け確認
2. **画像表示**: 全画像が正しく表示されるか確認
3. **レスポンシブ**: 各デバイスでの表示確認
4. **ブラウザキャッシュ**: ハードリフレッシュで確認

## コンテンツ拡充チェックリスト

### 新規タレント追加時
- [ ] タレント情報をcelebritiesテーブルに追加
- [ ] タレント画像を適切なAPIで取得
- [ ] フロントエンドでタレント表示確認
- [ ] エピソード情報をepisodesテーブルに追加
- [ ] エピソード画像をYouTube Data APIで取得
- [ ] タレント詳細ページでエピソード表示確認
- [ ] 全デバイスでレスポンシブ確認

### エピソード追加時
- [ ] 魅力的なエピソード内容を企画
- [ ] celebrity_idで正しいタレントに紐付け
- [ ] 実際のYouTube動画サムネイル取得
- [ ] タレント詳細ページで表示確認
- [ ] ブラウザキャッシュクリア後の確認

## 技術的ポイント

### データベース設計
```sql
-- celebritiesテーブル
id (uuid) | name (text) | bio (text) | type (text) | status (text) | image_url (text)

-- episodesテーブル
id (text) | title (text) | description (text) | date (text) | duration (text) |
thumbnail_url (text) | video_url (text) | view_count (int) | celebrity_id (uuid)
```

### 環境設定
```env
VITE_ENVIRONMENT=production
VITE_SUPABASE_URL=https://awaarykghpylggygkiyp.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_YOUTUBE_API_KEY=...
TMDB_API_KEY=...
```

### エラー対応
- **画像が表示されない**: ブラウザキャッシュクリア、環境変数確認
- **エピソードが表示されない**: celebrity_id紐付け確認、環境設定確認
- **API呼び出し失敗**: APIキー確認、レート制限対策

## ベストプラクティス

### 1. コンテンツ品質
- リアリティのあるエピソードタイトル・内容
- 各タレントの特徴を活かした企画
- 視聴回数などの数値もリアルに設定

### エピソードコンテンツガイドライン
#### ✅ 追加すべきコンテンツ
- **長編動画**: 10分以上のメイン動画（企画、チャレンジ、コラボなど）
- **特別企画**: 記念動画、季節限定企画
- **レギュラー企画**: そのタレントの定番シリーズ
- **コラボ動画**: 他のタレントとの共演動画

#### ❌ 追加しないコンテンツ
- **YouTube Shorts**: 1分未満の縦動画
- **切り抜き動画**: 他の動画からの短編切り抜き
- **日常vlog**: 短時間の日常動画
- **配信アーカイブ**: ライブ配信の録画

#### エピソード企画の考え方
- タレントの個性を活かした内容
- ファンが見たくなる魅力的なタイトル
- 再生回数は現実的な数値（100万〜500万再生程度）
- 動画時間は10〜30分程度を想定

### 2. 技術実装
- 適切なAPI使用（他人の画像流用禁止）
- レート制限対策（await setTimeout）
- エラーハンドリング実装
- データ整合性確保

### 3. 運用
- 実行前の既存データ確認
- 段階的な実装（タレント→エピソード→画像）
- 各ステップでの動作確認
- ドキュメント更新

## 今後のコンテンツ拡充依頼時の対応

### やるべきこと
1. **現状分析**: 既存データとスクリプトの確認
2. **企画**: 魅力的なコンテンツの企画
3. **技術実装**: 適切なAPIを使った正しい実装
4. **品質保証**: 全段階での動作確認
5. **ドキュメント更新**: 新しい知見の記録

### 避けるべきこと
- 他人の画像の無断使用
- 架空の画像URLの作成
- データ整合性を無視した実装
- 品質確認を怠ること

## 参考ドキュメント
- [TALENT_IMAGE_GUIDE.md](./TALENT_IMAGE_GUIDE.md): 画像取得の詳細手順
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [TMDB API Documentation](https://developers.themoviedb.org/3)

## 更新履歴
- 2024-12-XX: 初版作成、ヒカキン等8組のタレント・エピソード追加完了