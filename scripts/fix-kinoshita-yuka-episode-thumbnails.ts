/**
 * 木下ゆうかのエピソード画像をYouTube Data APIで取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixKinoshitaYukaEpisodeThumbnails() {
  console.log('🍔 木下ゆうかのエピソード画像取得開始')
  console.log('========================================\n')

  // 1. 木下ゆうかのcelebrity_idを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id, name')
    .eq('name', '木下ゆうか')
    .single()

  if (!celebrity) {
    console.log('❌ 木下ゆうかが見つかりません')
    return
  }

  console.log(`✅ 木下ゆうか ID: ${celebrity.id}`)

  // 2. 木下ゆうかのYouTubeチャンネルを検索
  console.log('\n🔍 YouTubeチャンネル検索中...')

  const searchResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent('木下ゆうか')}&type=channel&maxResults=5&key=${youtubeApiKey}`
  )

  if (!searchResponse.ok) {
    console.log(`❌ YouTube検索エラー: ${searchResponse.status}`)
    return
  }

  const searchData = await searchResponse.json()
  const channels = searchData.items || []

  console.log(`見つかったチャンネル: ${channels.length}件`)

  // 木下ゆうかのチャンネルを特定（登録者数が多いものを選択）
  let bestChannel = null
  let maxSubscribers = 0

  for (const channel of channels) {
    const channelId = channel.id.channelId
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
    )

    if (channelResponse.ok) {
      const channelData = await channelResponse.json()
      const channelInfo = channelData.items?.[0]

      if (channelInfo) {
        const subscriberCount = parseInt(channelInfo.statistics.subscriberCount || '0')
        console.log(`  ${channelInfo.snippet.title}: ${subscriberCount.toLocaleString()}人`)

        if (subscriberCount > maxSubscribers) {
          maxSubscribers = subscriberCount
          bestChannel = channelInfo
        }
      }
    }
  }

  if (!bestChannel) {
    console.log('❌ 木下ゆうかのチャンネルが見つかりません')
    return
  }

  const channelId = bestChannel.id
  console.log(`\n✅ 選択チャンネル: ${bestChannel.snippet.title}`)
  console.log(`   チャンネルID: ${channelId}`)
  console.log(`   登録者数: ${maxSubscribers.toLocaleString()}人`)

  // 3. チャンネルのアップロードプレイリストから動画を取得
  console.log('\n🎬 チャンネル動画を取得中...')

  // チャンネルのアップロードプレイリストIDを取得
  const channelResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
  )

  if (!channelResponse.ok) {
    console.log(`❌ チャンネル情報取得エラー: ${channelResponse.status}`)
    return
  }

  const channelData = await channelResponse.json()
  const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

  if (!uploadsPlaylistId) {
    console.log('❌ アップロードプレイリストが見つかりません')
    return
  }

  console.log(`✅ アップロードプレイリストID: ${uploadsPlaylistId}`)

  // プレイリストから動画を取得
  const videosResponse = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20&key=${youtubeApiKey}`
  )

  if (!videosResponse.ok) {
    console.log(`❌ 動画取得エラー: ${videosResponse.status}`)
    return
  }

  const videosData = await videosResponse.json()
  const videos = videosData.items || []

  console.log(`✅ 取得動画数: ${videos.length}本`)

  // 4. エピソードを取得して画像を更新
  const { data: episodes, error: episodeError } = await supabase
    .from('episodes')
    .select('id, title, thumbnail_url')
    .eq('celebrity_id', celebrity.id)
    .order('created_at', { ascending: false })

  if (episodeError || !episodes) {
    console.log(`❌ エピソード取得エラー: ${episodeError?.message}`)
    return
  }

  console.log(`📋 エピソード数: ${episodes.length}本\n`)

  // 5. 各エピソードに動画サムネイルを割り当て
  let updatedCount = 0

  for (let i = 0; i < episodes.length && i < videos.length; i++) {
    const episode = episodes[i]
    const video = videos[i]

    console.log(`🔄 "${episode.title.substring(0, 40)}..." を更新中...`)

    // サムネイル画像URL取得（高品質優先）
    const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                        video.snippet.thumbnails.high?.url ||
                        video.snippet.thumbnails.medium?.url ||
                        video.snippet.thumbnails.default?.url

    const videoUrl = `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`

    if (thumbnailUrl) {
      console.log(`   📹 動画: ${video.snippet.title.substring(0, 40)}...`)
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
        updatedCount++
      }
    } else {
      console.log(`   ⚠️ サムネイルが見つかりません`)
    }

    console.log('')

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 300))
  }

  console.log('='.repeat(50))
  console.log('🎉 木下ゆうかのエピソード画像取得完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果: ${updatedCount}本のエピソード画像を更新`)

  // 6. 更新結果確認
  console.log('\n🔍 更新後のエピソード確認:')
  const { data: updatedEpisodes } = await supabase
    .from('episodes')
    .select('title, thumbnail_url, video_url')
    .eq('celebrity_id', celebrity.id)
    .limit(5)

  if (updatedEpisodes) {
    updatedEpisodes.forEach((ep, index) => {
      const hasRealThumbnail = ep.thumbnail_url && ep.thumbnail_url.includes('i.ytimg.com')
      const hasRealVideo = ep.video_url && ep.video_url.includes('youtube.com/watch')
      const status = hasRealThumbnail && hasRealVideo ? '✅' : '⚠️'

      console.log(`${status} ${ep.title.substring(0, 50)}...`)
      if (hasRealThumbnail) {
        console.log(`   📸 ${ep.thumbnail_url.substring(0, 70)}...`)
      }
      if (hasRealVideo) {
        console.log(`   🎬 ${ep.video_url}`)
      }
      console.log('')
    })
  }

  console.log('💡 確認方法:')
  console.log('• 木下ゆうかのプロフィールページを開いてエピソード画像を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
  console.log('• 各エピソードに実際のYouTube動画サムネイルが表示されます')
}

// 実行
fixKinoshitaYukaEpisodeThumbnails().catch(console.error)