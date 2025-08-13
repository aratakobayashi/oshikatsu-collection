require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YONINO_CHANNEL_ID = process.env.VITE_YONI_CHANNEL_ID
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function getAllChannelVideos(channelId, maxTotalResults = 1000) {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY が設定されていません')
    return []
  }

  console.log(`🔍 チャンネル ${channelId} の全動画を取得中...`)
  
  let allVideos = []
  let nextPageToken = ''
  let pageCount = 0
  const maxResultsPerPage = 50

  try {
    while (pageCount < Math.ceil(maxTotalResults / maxResultsPerPage)) {
      pageCount++
      console.log(`📄 ページ ${pageCount} を取得中...`)
      
      // 検索APIで動画IDリストを取得
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=${maxResultsPerPage}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (searchData.error) {
        console.error(`❌ 検索API エラー (ページ ${pageCount}):`, searchData.error.message)
        break
      }
      
      if (!searchData.items || searchData.items.length === 0) {
        console.log(`✅ ページ ${pageCount}: 動画が見つかりませんでした。取得完了。`)
        break
      }
      
      console.log(`📺 ページ ${pageCount}: ${searchData.items.length}件の動画ID取得`)
      
      // 動画IDリストから詳細情報を取得
      const videoIds = searchData.items.map(item => item.id.videoId).join(',')
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`
      
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()
      
      if (detailsData.error) {
        console.error(`❌ 詳細API エラー (ページ ${pageCount}):`, detailsData.error.message)
        break
      }
      
      // データを整形して配列に追加
      const pageVideos = detailsData.items.map(video => ({
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
      
      allVideos = allVideos.concat(pageVideos)
      console.log(`✅ ページ ${pageCount}: ${pageVideos.length}件処理完了 (累計: ${allVideos.length}件)`)
      
      // 次のページトークンを確認
      nextPageToken = searchData.nextPageToken
      if (!nextPageToken) {
        console.log(`🎉 全ページ取得完了！総動画数: ${allVideos.length}件`)
        break
      }
      
      // API制限対策: 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    return allVideos
    
  } catch (error) {
    console.error('❌ API取得エラー:', error)
    return allVideos // 取得できた分だけでも返す
  }
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

async function saveAllToDatabase(videos, celebrityId) {
  console.log(`\n💾 ${videos.length}件の動画をデータベースに保存中...`)
  
  let savedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]
    
    try {
      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('video_url', video.videoUrl)
        .single()
      
      if (existing) {
        skippedCount++
        if (i % 10 === 0) console.log(`⏭️  進行状況: ${i + 1}/${videos.length} (スキップ: ${video.title.substring(0, 50)}...)`)
        continue
      }
      
      // 新規エピソードを挿入
      const { error } = await supabase
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
      
      if (error) {
        console.error(`❌ 保存エラー (${video.title.substring(0, 30)}...):`, error.message)
        errorCount++
      } else {
        savedCount++
        console.log(`✅ 保存 (${savedCount}件目): ${video.title}`)
      }
      
    } catch (error) {
      console.error(`❌ 処理エラー (${video.title.substring(0, 30)}...):`, error)
      errorCount++
    }
    
    // 進行状況表示
    if (i % 50 === 0 && i > 0) {
      console.log(`📊 進行状況: ${i}/${videos.length} 完了 (保存: ${savedCount}, スキップ: ${skippedCount}, エラー: ${errorCount})`)
    }
  }
  
  console.log(`\n📊 最終結果:`)
  console.log(`  💾 新規保存: ${savedCount}件`)
  console.log(`  ⏭️  スキップ: ${skippedCount}件`)
  console.log(`  ❌ エラー: ${errorCount}件`)
  console.log(`  📺 総処理: ${videos.length}件`)
}

async function main() {
  console.log('🎬 よにのちゃんねる 全動画取得開始\n')
  
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
  
  // 全YouTube動画データを取得（最大605本）
  const videos = await getAllChannelVideos(YONINO_CHANNEL_ID, 700)
  
  if (videos.length === 0) {
    console.log('📺 取得できる動画がありませんでした')
    return
  }
  
  console.log(`\n📊 取得結果:`)
  console.log(`  📺 動画数: ${videos.length}件`)
  console.log(`  📅 期間: ${new Date(videos[videos.length - 1]?.publishedAt).toLocaleDateString('ja-JP')} ～ ${new Date(videos[0]?.publishedAt).toLocaleDateString('ja-JP')}`)
  
  // データベースに保存
  await saveAllToDatabase(videos, celebrity.id)
  
  console.log('\n🎉 よにのちゃんねる全動画取得完了！')
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error)
}