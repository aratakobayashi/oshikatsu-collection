# タレント画像取得ガイド

## 概要
このドキュメントは、推し活コレクションでタレント画像を正しく取得・設定する方法をまとめています。

## 画像取得の原則

### ❌ 避けるべき方法
- **他人の画像を流用する** → 絶対にしない
- **架空の画像URLを作成する** → 表示されない
- **適当なプレースホルダーを使う** → 不適切

### ✅ 正しい方法
- **YouTube Data API** でYouTuberの公式チャンネル画像を取得
- **TMDB API** で俳優・タレントの公式プロフィール画像を取得
- **公式サイト・SNS** から適切な画像URLを取得

## 実装方法

### 1. YouTuber系タレントの画像取得

#### 手順
1. **チャンネル検索**: YouTube Search APIで正確なチャンネルを特定
2. **画像取得**: Channels APIで公式チャンネル画像を取得
3. **データベース更新**: 取得した画像URLをcelebritiesテーブルに保存

#### コード例
```typescript
// チャンネル検索
const searchResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=5&key=${apiKey}`
)

// 画像取得
const channelResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`
)
const data = await channelResponse.json()
const imageUrl = data.items[0].snippet.thumbnails.high.url

// データベース更新
await supabase
  .from('celebrities')
  .update({ image_url: imageUrl })
  .eq('id', talentId)
```

#### 参考スクリプト
- `scripts/find-correct-channel-ids.ts`: チャンネル検索と画像取得の実装例
- `scripts/youtube-data-collector.ts`: YouTube Data APIの基本的な使い方

### 2. 俳優・タレント系の画像取得

#### 手順
1. **人物検索**: TMDB Search APIで人物を検索
2. **画像取得**: プロフィール画像URLを構築
3. **データベース更新**: 取得した画像URLを保存

#### コード例
```typescript
// 人物検索
const searchResponse = await fetch(
  `https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(personName)}&language=ja-JP`
)

// 画像URL構築
const searchData = await searchResponse.json()
const person = searchData.results[0]
const imageUrl = `https://image.tmdb.org/t/p/w500${person.profile_path}`
```

#### 参考スクリプト
- `scripts/update-matsushige-with-tmdb.ts`: TMDB APIの実装例
- `scripts/tmdb-api-explanation.ts`: TMDB APIの詳細説明

### 3. エピソード画像取得（YouTuber系）

#### 手順
1. **チャンネルの人気動画取得**: YouTube Search APIでチャンネルの人気動画を取得
2. **エピソード情報確認**: データベースのepisodesテーブルから対象タレントのエピソード一覧を取得
3. **画像マッチング**: 各エピソードに適切な動画サムネイルを割り当て
4. **データベース更新**: thumbnail_urlとvideo_urlを更新

#### コード例
```typescript
// 人気動画取得
const searchResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=20&key=${apiKey}`
)

// サムネイル取得
const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                   video.snippet.thumbnails.high?.url ||
                   video.snippet.thumbnails.medium?.url ||
                   video.snippet.thumbnails.default?.url

// エピソード更新
await supabase
  .from('episodes')
  .update({
    thumbnail_url: thumbnailUrl,
    video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    updated_at: new Date().toISOString()
  })
  .eq('id', episode.id)
```

#### 参考スクリプト
- `scripts/fix-hikakin-episode-thumbnails.ts`: ヒカキンのエピソード画像取得の実装例
- `scripts/fetch-hikakin-episode-images.ts`: エピソード画像取得の詳細実装

### 4. アイドルグループ・その他

#### 取得元
- 公式YouTubeチャンネル（存在する場合）
- 公式サイトのプロフィール画像
- 公式SNSアカウントのプロフィール画像

## 環境設定

### 必要なAPIキー
```env
# .env.production
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
```

### APIキー取得方法
1. **YouTube Data API**: [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成してAPIを有効化
2. **TMDB API**: [TMDB](https://www.themoviedb.org/settings/api) でアカウント作成してAPIキー取得

## チャンネルIDマッピング（2024年12月現在）

```typescript
const VERIFIED_YOUTUBER_CHANNELS = {
  'ヒカキン': 'UCZf__ehlCEBPop-_sldpBUQ',        // HikakinTV (1,950万人)
  'はじめしゃちょー': 'UCgMPP6RRjktV7krOfyUewqw', // はじめしゃちょー（hajime）(1,630万人)
  'きまぐれクック': 'UCaak9sggUeIBPOd8iK_BXcQ',   // きまぐれクックKimagure Cook (1,430万人)
  'コムドット': 'UCRxPrFmRHsXGWfAyE6oqrPQ',      // コムドット (411万人)
  '東海オンエア': 'UCutJqz56653xV2wwSvut_hQ',     // 東海オンエア (722万人)
  'フィッシャーズ': 'UCibEhpu5HP45-w7Bq1ZIulw',   // Fischer's-フィッシャーズ- (899万人)
  'NiziU': 'UCHp2q2i85qt_9nn2H7AvGOw',         // NiziU Official (229万人)
  '櫻坂46': 'UCmr9bYmymcBmQ1p2tLBRvwg',        // 櫻坂46 OFFICIAL YouTube CHANNEL (120万人)
}
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. 画像が表示されない
- **原因**: ブラウザキャッシュ
- **解決方法**: ハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）

#### 2. API呼び出しが失敗する
- **原因**: APIキー未設定またはレート制限
- **解決方法**: 環境変数確認、リクエスト間隔調整

#### 3. チャンネルが見つからない
- **原因**: チャンネルIDが間違っている
- **解決方法**: Search APIで再検索、登録者数で正しいチャンネルを特定

## ベストプラクティス

### 1. レート制限対策
```typescript
// リクエスト間に適切な間隔を設ける
await new Promise(resolve => setTimeout(resolve, 1000))
```

### 2. エラーハンドリング
```typescript
try {
  const response = await fetch(apiUrl)
  if (!response.ok) {
    console.error(`API Error: ${response.status}`)
    return null
  }
  // 処理継続
} catch (error) {
  console.error('Unexpected error:', error)
  return null
}
```

### 3. データ整合性確保
- 更新前に既存データの確認
- 複数候補がある場合は登録者数で判定
- 画像URLの有効性チェック

## 実行手順

### 新規タレント追加時
1. タレント情報をcelebritiesテーブルに追加
2. 適切な画像取得スクリプトを実行
3. エピソード情報をepisodesテーブルに追加
4. エピソード画像取得スクリプトを実行
5. 画像表示を確認

### 既存タレントの画像更新時
1. `scripts/find-correct-channel-ids.ts` でチャンネル検索
2. 正しいチャンネルIDで画像取得・更新
3. ブラウザで表示確認

### エピソード画像更新時
1. `scripts/fix-[talent-name]-episode-thumbnails.ts` でエピソード画像取得
2. YouTube Data APIで実際の動画サムネイルを取得・更新
3. ブラウザでハードリフレッシュして確認

## 参考リンク
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [TMDB API Documentation](https://developers.themoviedb.org/3)
- [Google Cloud Console](https://console.cloud.google.com/)
- [TMDB Account Settings](https://www.themoviedb.org/settings/api)

## 更新履歴
- 2024-12-XX: 初版作成、YouTuber8組の画像取得完了