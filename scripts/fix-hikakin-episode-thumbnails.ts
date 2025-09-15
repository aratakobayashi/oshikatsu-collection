/**
 * ヒカキンのエピソードに実際のYouTube動画サムネイルを設定
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixHikakinEpisodeThumbnails() {
  console.log('🔧 ヒカキンのエピソードサムネイル修正')
  console.log('===================================\n')

  // HikakinTVの実際の人気動画から画像を取得
  const hikakinChannelId = 'UCZf__ehlCEBPop-_sldpBUQ'

  try {
    // 1. HikakinTVの人気動画を取得
    console.log('🔍 HikakinTVの人気動画を取得中...')

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${hikakinChannelId}&order=viewCount&type=video&maxResults=20&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      console.error('❌ YouTube検索エラー')
      return
    }

    const searchData = await searchResponse.json()
    const videos = searchData.items

    console.log(`✅ 取得した動画数: ${videos.length}本`)

    // 2. ヒカキンのエピソード一覧を取得
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .select('id, title, video_url, thumbnail_url')
      .eq('celebrity_id', '6fb76989-4379-45b2-9853-2fbe74362e35') // ヒカキンのID
      .order('created_at', { ascending: false })

    if (episodeError || !episodes) {
      console.error('❌ エピソード取得エラー:', episodeError)
      return
    }

    console.log(`📋 ヒカキンのエピソード数: ${episodes.length}本\n`)

    // 3. 各エピソードに適切な動画画像を割り当て
    let updateCount = 0

    for (let i = 0; i < episodes.length && i < videos.length; i++) {
      const episode = episodes[i]
      const video = videos[i]

      console.log(`🔄 "${episode.title}" を更新中...`)

      // サムネイル画像URL取得
      const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                          video.snippet.thumbnails.high?.url ||
                          video.snippet.thumbnails.medium?.url ||
                          video.snippet.thumbnails.default?.url

      const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`

      if (thumbnailUrl) {
        console.log(`   📹 動画: ${video.snippet.title}`)
        console.log(`   🖼️ サムネイル: ${thumbnailUrl.substring(0, 60)}...`)

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
          console.log(`   ❌ 更新エラー: ${updateError.message}`)
        } else {
          console.log(`   ✅ 更新完了`)
          updateCount++
        }
      } else {
        console.log(`   ⚠️ サムネイルが見つかりません`)
      }

      console.log('')

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    console.log('='.repeat(50))
    console.log('🎉 サムネイル更新完了！')
    console.log('='.repeat(50))
    console.log(`📊 結果:`)
    console.log(`  更新したエピソード: ${updateCount}本`)

    // 4. 更新結果確認
    console.log('\n🔍 更新後のエピソード確認:')
    const { data: updatedEpisodes } = await supabase
      .from('episodes')
      .select('title, thumbnail_url, video_url')
      .eq('celebrity_id', '6fb76989-4379-45b2-9853-2fbe74362e35')
      .limit(5)

    if (updatedEpisodes) {
      updatedEpisodes.forEach((ep, index) => {
        const hasRealThumbnail = ep.thumbnail_url && ep.thumbnail_url.includes('i.ytimg.com')
        const hasRealVideo = ep.video_url && ep.video_url.includes('youtube.com/watch')
        const status = hasRealThumbnail && hasRealVideo ? '✅' : '⚠️'

        console.log(`${status} ${ep.title}`)
        if (hasRealThumbnail) {
          console.log(`   📸 ${ep.thumbnail_url}`)
        }
        if (hasRealVideo) {
          console.log(`   🎬 ${ep.video_url}`)
        }
        console.log('')
      })
    }

    console.log('💡 確認方法:')
    console.log('• ヒカキンのプロフィールページを開いてエピソード画像を確認')
    console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
    console.log('• 各エピソードに実際のHikakinTVの動画サムネイルが表示されます')

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
fixHikakinEpisodeThumbnails().catch(console.error)