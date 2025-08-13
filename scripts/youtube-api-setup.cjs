require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

// YouTube API設定
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY // 環境変数に設定必要
const YONINO_CHANNEL_ID = process.env.VITE_YONI_CHANNEL_ID || 'UC2alHD2WkakOiTxCxF-uMAg' // よにのちゃんねるID

// Supabase設定
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getChannelVideos(channelId, maxResults = 50) {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY が設定されていません')
    console.log('📝 YouTube Data API v3のAPIキーを取得して、.env.stagingに追加してください')
    console.log('   https://console.cloud.google.com/apis/api/youtube.googleapis.com/')
    return []
  }

  try {
    console.log(`🔍 チャンネル ${channelId} の動画を取得中...`)
    
    // チャンネルの動画リストを取得
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=${maxResults}`
    
    const response = await fetch(searchUrl)
    const data = await response.json()
    
    if (data.error) {
      console.error('❌ YouTube API エラー:', data.error.message)
      return []
    }
    
    console.log(`✅ ${data.items.length}件の動画を発見`)
    
    // 各動画の詳細統計を取得
    const videoIds = data.items.map(item => item.id.videoId).join(',')
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`
    
    const statsResponse = await fetch(statsUrl)
    const statsData = await statsResponse.json()
    
    if (statsData.error) {
      console.error('❌ YouTube統計取得エラー:', statsData.error.message)
      return []
    }
    
    // データを整形
    const videos = statsData.items.map(video => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      viewCount: parseInt(video.statistics.viewCount || 0),
      likeCount: parseInt(video.statistics.likeCount || 0),
      commentCount: parseInt(video.statistics.commentCount || 0),
      duration: video.contentDetails.duration
    }))
    
    return videos
    
  } catch (error) {
    console.error('❌ APIリクエストエラー:', error)
    return []
  }
}

async function saveToDatabase(videos, celebrityId) {
  console.log(`💾 ${videos.length}件の動画をデータベースに保存中...`)
  
  let savedCount = 0
  let skippedCount = 0
  
  for (const video of videos) {
    try {
      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('video_url', video.videoUrl)
        .single()
      
      if (existing) {
        console.log(`⏭️  スキップ: ${video.title}（既存）`)
        skippedCount++
        continue
      }
      
      // 新規エピソードを挿入
      const { data, error } = await supabase
        .from('episodes')
        .insert({
          id: randomUUID(),
          title: video.title,
          description: video.description,
          date: video.publishedAt,
          celebrity_id: celebrityId,
          video_url: video.videoUrl,
          thumbnail_url: video.thumbnailUrl,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          duration: parseDuration(video.duration)
        })
        .select()
      
      if (error) {
        console.error(`❌ 保存エラー (${video.title}):`, error.message)
      } else {
        console.log(`✅ 保存: ${video.title}`)
        savedCount++
      }
      
    } catch (error) {
      console.error(`❌ 処理エラー (${video.title}):`, error)
    }
  }
  
  console.log(`\n📊 処理完了: ${savedCount}件保存、${skippedCount}件スキップ`)
}

// YouTube duration (PT4M13S) を分に変換
function parseDuration(duration) {
  if (!duration) return null
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return null
  
  const hours = parseInt(match[1] || 0)
  const minutes = parseInt(match[2] || 0)
  const seconds = parseInt(match[3] || 0)
  
  return hours * 60 + minutes + Math.round(seconds / 60)
}

async function main() {
  console.log('🎬 よにのちゃんねる データ取得開始\n')
  
  // よにのちゃんねるの推しIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.error('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  console.log(`👤 対象推し: ${celebrity.name} (ID: ${celebrity.id})`)
  
  // YouTube動画データを取得
  const videos = await getChannelVideos(YONINO_CHANNEL_ID, 100)
  
  if (videos.length === 0) {
    console.log('📺 取得できる動画がありませんでした')
    return
  }
  
  // データベースに保存
  await saveToDatabase(videos, celebrity.id)
  
  console.log('\n🎉 よにのちゃんねるデータ取得完了！')
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
}

module.exports = { getChannelVideos, saveToDatabase }