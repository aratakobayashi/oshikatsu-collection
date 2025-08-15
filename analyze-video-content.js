// 動画分析のための複数アプローチ

const videoId = 'br-iF9GUpIE'
const videoUrl = `https://www.youtube.com/watch?v=${videoId}`

console.log('🎥 動画コンテンツ分析オプション:')
console.log('=====================================')

console.log('\n1. 【YouTube Data API】（要API Key）')
console.log('   • 動画のメタデータ、タグ、カテゴリを取得')
console.log('   • コメント欄から場所の手がかりを検索')
console.log('   • 字幕データの取得（自動生成含む）')
console.log('   → API Keyが必要')

console.log('\n2. 【サムネイル画像解析】')
console.log('   • YouTube自動生成サムネイル画像をダウンロード')
console.log('   • 画像から店内装飾、料理、テーブル設定を分析')
console.log('   • ホテルのロゴや特徴的な内装を識別')
console.log('   → 実装可能！')

console.log('\n3. 【動画タイトル・説明文の詳細解析】')
console.log('   • ハッシュタグ「#ホテ飯 #ベッフェ #ブッヘ」から推測')
console.log('   • 「セレブ」というキーワードから高級ホテル推定')
console.log('   • 投稿日時から季節メニューを考慮')
console.log('   → すでに実行済み')

console.log('\n4. 【関連動画・プレイリスト分析】')
console.log('   • 同時期の他の動画でヒントを探す')
console.log('   • よにのちゃんねるの行動パターン分析')
console.log('   • 地理的な移動パターンから推測')
console.log('   → 実装可能！')

console.log('\n5. 【Web検索による照合】')
console.log('   • 「よにのちゃんねる ホテル ビュッフェ」で検索')
console.log('   • ファンサイトやSNSでの言及を調査')
console.log('   • 動画の反応・コメントから場所特定')
console.log('   → 実装可能！')

console.log('\n推奨アプローチ: 2 + 4 + 5 の組み合わせ')
console.log('=====================================')
console.log('最も現実的で効果的な方法を組み合わせて実行します。')

// サムネイル画像のURL生成
const thumbnailUrls = [
  `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
]

console.log('\n📸 利用可能なサムネイル:')
thumbnailUrls.forEach((url, i) => {
  console.log(`${i+1}. ${url}`)
})

export { videoId, videoUrl, thumbnailUrls }