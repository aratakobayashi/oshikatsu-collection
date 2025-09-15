/**
 * 新規YouTuber（コムドット、東海オンエア、フィッシャーズ、NiziU、櫻坂46）の
 * エピソード画像をYouTube Data APIで取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// YouTube チャンネルIDマッピング
const YOUTUBE_CHANNELS = {
  'コムドット': 'UCRxPrFmRHsXGWfAyE6oqrPQ',
  '東海オンエア': 'UCutJqz56653xV2wwSvut_hQ',
  'フィッシャーズ': 'UCibEhpu5HP45-w7Bq1ZIulw',
  'NiziU': 'UCHp2q2i85qt_9nn2H7AvGOw',
  '櫻坂46': 'UCmr9bYmymcBmQ1p2tLBRvwg'
}

// celebrity_idマッピング
const CELEBRITY_IDS = {
  'コムドット': 'f1e2d3c4-b5a6-9870-1234-567890abcdef',
  '東海オンエア': 'a2b3c4d5-e6f7-8901-2345-678901bcdefg',
  'フィッシャーズ': 'b3c4d5e6-f7g8-9012-3456-789012cdefgh',
  'NiziU': 'c4d5e6f7-g8h9-0123-4567-890123defghi',
  '櫻坂46': 'd5e6f7g8-h9i0-1234-5678-901234efghij'
}

async function fixNewYoutubersEpisodeThumbnails() {
  console.log('🖼️ 新規YouTuberのエピソード画像取得開始')
  console.log('==========================================\n')

  let totalUpdated = 0

  for (const [talentName, channelId] of Object.entries(YOUTUBE_CHANNELS)) {
    console.log(`📺 ${talentName} の画像取得中...`)
    console.log(`チャンネルID: ${channelId}`)

    try {
      // 1. YouTubeから人気動画を取得
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=viewCount&type=video&maxResults=20&key=${youtubeApiKey}`
      )

      if (!searchResponse.ok) {
        console.log(`   ❌ YouTube API呼び出しエラー: ${searchResponse.status}`)
        continue
      }

      const searchData = await searchResponse.json()
      const videos = searchData.items || []
      console.log(`   ✅ 取得動画数: ${videos.length}本`)

      // 2. データベースからエピソード一覧取得
      const { data: episodes, error: episodeError } = await supabase
        .from('episodes')
        .select('id, title, thumbnail_url, video_url')
        .eq('celebrity_id', CELEBRITY_IDS[talentName])
        .order('created_at', { ascending: false })

      if (episodeError || !episodes) {
        console.log(`   ❌ エピソード取得エラー: ${episodeError?.message}`)
        continue
      }

      console.log(`   📋 エピソード数: ${episodes.length}本`)

      // 3. 各エピソードに画像を割り当て
      let updatedCount = 0
      for (let i = 0; i < episodes.length && i < videos.length; i++) {
        const episode = episodes[i]
        const video = videos[i]

        console.log(`   🔄 "${episode.title}" を更新中...`)

        // サムネイル画像URL取得（高品質優先）
        const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                            video.snippet.thumbnails.high?.url ||
                            video.snippet.thumbnails.medium?.url ||
                            video.snippet.thumbnails.default?.url

        const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`

        if (thumbnailUrl) {
          console.log(`      📹 動画: ${video.snippet.title.substring(0, 40)}...`)
          console.log(`      🖼️ サムネイル: ${thumbnailUrl.substring(0, 60)}...`)

          // データベース更新
          const { error: updateError } = await supabase
            .from('episodes')
            .update({
              thumbnail_url: thumbnailUrl,
              video_url: videoUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', episode.id)

          if (updateError) {
            console.log(`      ❌ 更新エラー: ${updateError.message}`)
          } else {
            console.log(`      ✅ 更新完了`)
            updatedCount++
            totalUpdated++
          }
        } else {
          console.log(`      ⚠️ サムネイルが見つかりません`)
        }

        console.log('')

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      console.log(`   📊 ${talentName}: ${updatedCount}本のエピソード画像を更新\n`)

    } catch (error) {
      console.log(`   ❌ ${talentName} 処理エラー:`, error)
      continue
    }

    // タレント間のレート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('='.repeat(50))
  console.log('🎉 新規YouTuberエピソード画像取得完了！')
  console.log('='.repeat(50))
  console.log(`📊 全体結果: ${totalUpdated}本のエピソード画像を更新`)
  console.log('')

  // 4. 更新結果確認
  console.log('🔍 更新後のエピソード確認:')
  for (const [talentName, celebrityId] of Object.entries(CELEBRITY_IDS)) {
    const { data: updatedEpisodes } = await supabase
      .from('episodes')
      .select('title, thumbnail_url, video_url')
      .eq('celebrity_id', celebrityId)
      .limit(3)

    console.log(`\n📺 ${talentName}:`)
    if (updatedEpisodes) {
      updatedEpisodes.forEach((ep, index) => {
        const hasRealThumbnail = ep.thumbnail_url && ep.thumbnail_url.includes('i.ytimg.com')
        const hasRealVideo = ep.video_url && ep.video_url.includes('youtube.com/watch')
        const status = hasRealThumbnail && hasRealVideo ? '✅' : '⚠️'

        console.log(`   ${status} ${ep.title}`)
        if (hasRealThumbnail) {
          console.log(`      📸 ${ep.thumbnail_url.substring(0, 70)}...`)
        }
        if (hasRealVideo) {
          console.log(`      🎬 ${ep.video_url}`)
        }
      })
    }
  }

  console.log('\n💡 確認方法:')
  console.log('• 各タレントのプロフィールページを開いてエピソード画像を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
  console.log('• 各エピソードに実際のYouTube動画サムネイルが表示されます')
}

// 実行
fixNewYoutubersEpisodeThumbnails().catch(console.error)