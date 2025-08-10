const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag'
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg'

const crypto = require('crypto')

function generateId(title) {
  return crypto.createHash('md5').update(title).digest('hex')
}

function parseDuration(duration) {
  if (!duration) return 0
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  return hours * 3600 + minutes * 60 + seconds
}

async function collectLatestVideos() {
  console.log('🎬 最新動画を収集開始...\n')

  try {
    // 1. 既存のエピソードタイトルを取得
    const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=title`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const existingEpisodes = await existingResponse.json()
    const existingTitles = new Set(existingEpisodes.map(ep => ep.title))
    console.log(`📋 既存エピソード: ${existingTitles.size}件\n`)

    // 2. 最新動画50件を取得
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=50&order=date&type=video&key=${YOUTUBE_API_KEY}`
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()
    
    if (!searchData.items) {
      console.log('❌ 動画取得失敗')
      return
    }

    console.log(`🎥 最新動画${searchData.items.length}件を取得\n`)

    // 3. 新規動画のみ処理
    let savedCount = 0
    let skippedCount = 0

    for (const item of searchData.items) {
      const title = item.snippet.title
      
      // 既存チェック
      if (existingTitles.has(title)) {
        console.log(`   ⏭️ スキップ: "${title.substring(0, 40)}..."`)
        skippedCount++
        continue
      }

      // 詳細情報取得
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${item.id.videoId}&key=${YOUTUBE_API_KEY}`
      const detailsResponse = await fetch(detailsUrl)
      const detailsData = await detailsResponse.json()
      
      if (!detailsData.items || detailsData.items.length === 0) continue
      
      const video = detailsData.items[0]
      const viewCount = parseInt(video.statistics?.viewCount || '0')

      // エピソードデータ作成
      const episodeData = {
        id: generateId(title),
        title: title,
        description: video.snippet.description?.substring(0, 500) || '',
        date: video.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail_url: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
        view_count: viewCount,
        like_count: parseInt(video.statistics?.likeCount || '0'),
        comment_count: parseInt(video.statistics?.commentCount || '0'),
        duration: parseDuration(video.contentDetails?.duration),
        celebrity_id: '1239af4b-0a3d-4916-9965-04233f4efc7e'
      }

      // 保存
      const saveResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(episodeData)
      })

      if (saveResponse.ok) {
        savedCount++
        console.log(`   ✅ 保存: "${title.substring(0, 40)}..." (${(viewCount/1000000).toFixed(1)}M views)`)
      } else {
        console.log(`   ❌ エラー: "${title.substring(0, 40)}..."`)
      }
    }

    console.log(`\n📊 結果:`)
    console.log(`   ✅ 新規保存: ${savedCount}件`)
    console.log(`   ⏭️ スキップ: ${skippedCount}件`)

    // 4. 最終確認
    const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const finalEpisodes = await finalResponse.json()
    console.log(`\n🎯 合計エピソード数: ${finalEpisodes.length}件`)

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
collectLatestVideos()
  .then(() => {
    console.log('\n✨ 収集完了！')
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })