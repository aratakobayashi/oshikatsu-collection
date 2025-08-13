require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YONINO_CHANNEL_ID = process.env.VITE_YONI_CHANNEL_ID

async function getChannelStats() {
  try {
    console.log('🔍 よにのちゃんねるの統計情報を取得中...\n')
    
    // チャンネル統計情報を取得
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&id=${YONINO_CHANNEL_ID}&part=statistics,snippet`
    const response = await fetch(channelUrl)
    const data = await response.json()
    
    if (data.error) {
      console.error('❌ YouTube API エラー:', data.error.message)
      return null
    }
    
    const channel = data.items[0]
    const stats = channel.statistics
    const snippet = channel.snippet
    
    console.log('📺 よにのちゃんねる YouTube統計:')
    console.log(`  チャンネル名: ${snippet.title}`)
    console.log(`  総動画数: ${parseInt(stats.videoCount).toLocaleString()}本`)
    console.log(`  チャンネル登録者数: ${parseInt(stats.subscriberCount).toLocaleString()}人`)
    console.log(`  総再生回数: ${parseInt(stats.viewCount).toLocaleString()}回`)
    console.log(`  チャンネル開設日: ${new Date(snippet.publishedAt).toLocaleDateString('ja-JP')}`)
    
    return {
      totalVideos: parseInt(stats.videoCount),
      title: snippet.title,
      subscribers: parseInt(stats.subscriberCount),
      totalViews: parseInt(stats.viewCount)
    }
    
  } catch (error) {
    console.error('❌ APIリクエストエラー:', error)
    return null
  }
}

async function getDatabaseStats() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  const { data: episodes, count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact' })
    .eq('celebrity_id', celebrity.id)
  
  console.log('\n💾 推し活コレクション データベース統計:')
  console.log(`  よにの関連エピソード: ${count}件`)
  
  // 最新と最古のエピソード日付を確認
  if (episodes && episodes.length > 0) {
    const sortedEpisodes = episodes.sort((a, b) => new Date(b.date) - new Date(a.date))
    const newest = sortedEpisodes[0]
    const oldest = sortedEpisodes[sortedEpisodes.length - 1]
    
    console.log(`  最新エピソード: ${newest.title} (${new Date(newest.date).toLocaleDateString('ja-JP')})`)
    console.log(`  最古エピソード: ${oldest.title} (${new Date(oldest.date).toLocaleDateString('ja-JP')})`)
  }
  
  return count
}

async function analyzeDifference() {
  const youtubeStats = await getChannelStats()
  const dbCount = await getDatabaseStats()
  
  if (youtubeStats && dbCount !== null) {
    const difference = youtubeStats.totalVideos - dbCount
    
    console.log('\n📊 比較分析:')
    console.log(`  YouTube総動画数: ${youtubeStats.totalVideos.toLocaleString()}本`)
    console.log(`  DB保存済み数: ${dbCount}件`)
    console.log(`  差分: ${difference}本`)
    console.log(`  取得率: ${((dbCount / youtubeStats.totalVideos) * 100).toFixed(1)}%`)
    
    console.log('\n🤔 差分の考えられる理由:')
    console.log('  1. 📄 ページネーション制限: YouTube APIは1回50件まで')
    console.log('  2. 🔒 非公開動画: プライベート・限定公開・削除済み動画')
    console.log('  3. 🎬 ショート動画: YouTube Shortsの取得設定')
    console.log('  4. 📅 古い動画: APIでアクセスできない過去の動画')
    console.log('  5. ⚙️  API制限: クォータ制限やアクセス権限')
    console.log('  6. 🚫 コミュニティ投稿: 動画以外のコンテンツ')
    
    if (difference > 0) {
      console.log('\n💡 改善提案:')
      console.log('  • ページネーション実装で全動画取得')
      console.log('  • 定期的な自動更新スクリプト設定')
      console.log('  • ショート動画も含めた取得設定変更')
    }
  }
}

analyzeDifference().catch(console.error)