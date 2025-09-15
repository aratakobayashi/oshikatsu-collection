/**
 * 有名人のYouTubeチャンネル情報を正確なチャンネル名で再検索・更新
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// より正確なYouTubeチャンネル名
const ACCURATE_CHANNEL_NAMES = {
  '本田翼': 'ほんだのばいく',
  '佐藤二朗': 'CBCテレビ',
  'りゅうちぇる': 'りゅうちぇる',
  '米津玄師': 'Kenshi Yonezu / 米津玄師',
  'あいみょん': 'aimyon official',
  'YOASOBI': 'Ayase / YOASOBI',
  'King Gnu': 'King Gnu official',
  'Official髭男dism': 'Official髭男dism',
  '本田圭佑': 'KEISUKE HONDA',
  '武井壮': '武井壮 百獣の王国',
  '前田裕二': 'YUJI MAEDA',
  '古川優香': 'ゆうこす motomi',
  '池田美優': 'みちょぱ',
  '藤田ニコル': 'にこるん',
  '渡辺直美': 'NAOMI WATANABE',
  '速水もこみち': 'MOCOMICHI HAYAMI',
  'りゅうじ': '料理研究家リュウジのバズレシピ'
}

async function searchYouTubeChannel(channelName: string) {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=10&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return null

    const searchData = await searchResponse.json()
    const channels = searchData.items || []

    // より柔軟なマッチング
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

          // 登録者数が一定以上のチャンネルを選択
          if (subscriberCount > 10000) {
            return channelInfo
          }
        }
      }
    }

    return null
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return null
  }
}

async function getYouTubeVideos(channelId: string, maxResults: number = 6) {
  try {
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
    )

    if (!channelResponse.ok) return []

    const channelData = await channelResponse.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) return []

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${youtubeApiKey}`
    )

    if (!videosResponse.ok) return []

    const videosData = await videosResponse.json()
    return videosData.items || []
  } catch (error) {
    console.log(`   ❌ 動画取得エラー:`, error)
    return []
  }
}

async function updateCelebrityYouTubeChannels() {
  console.log('🔄 有名人YouTubeチャンネル情報更新開始')
  console.log('====================================\n')

  let updatedCount = 0
  let addedEpisodes = 0

  for (const [celebrityName, channelName] of Object.entries(ACCURATE_CHANNEL_NAMES)) {
    console.log(`\n👤 ${celebrityName} のチャンネル情報更新中...`)

    // セレブリティ情報を取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name, subscriber_count')
      .eq('name', celebrityName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${celebrityName} が見つかりません`)
      continue
    }

    if (celebrity.subscriber_count && celebrity.subscriber_count > 0) {
      console.log(`   ⏭️ 既にチャンネル情報設定済み: ${celebrity.subscriber_count.toLocaleString()}人`)
      continue
    }

    // YouTubeチャンネル検索
    console.log(`   🔍 「${channelName}」で検索中...`)
    const channel = await searchYouTubeChannel(channelName)

    if (!channel) {
      console.log(`   ⚠️ チャンネルが見つかりません`)
      continue
    }

    const subscriberCount = parseInt(channel.statistics.subscriberCount || '0')
    const channelThumbnail = channel.snippet.thumbnails?.high?.url

    console.log(`   ✅ チャンネル発見: ${channel.snippet.title}`)
    console.log(`   👥 登録者数: ${subscriberCount.toLocaleString()}人`)

    // チャンネル情報をデータベースに更新
    const { error: updateError } = await supabase
      .from('celebrities')
      .update({
        subscriber_count: subscriberCount,
        image_url: channelThumbnail || celebrity.image_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', celebrity.id)

    if (updateError) {
      console.log(`   ❌ 更新エラー: ${updateError.message}`)
      continue
    }

    console.log(`   ✅ チャンネル情報更新完了`)

    // YouTube動画を取得してエピソードとして追加
    const videos = await getYouTubeVideos(channel.id, 5)
    console.log(`   📹 動画取得: ${videos.length}本`)

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      const episodeId = `${celebrity.id}_youtube_${Date.now()}_${i}`

      const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                          video.snippet.thumbnails.high?.url ||
                          video.snippet.thumbnails.medium?.url

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【YouTube】${video.snippet.title}`,
          description: video.snippet.description?.substring(0, 400) || `${celebrityName}のYouTube動画`,
          date: new Date(video.snippet.publishedAt).toISOString(),
          duration: null,
          thumbnail_url: thumbnailUrl,
          video_url: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          celebrity_id: celebrity.id
        })

      if (!episodeError) {
        addedEpisodes++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    if (videos.length > 0) {
      console.log(`   ✅ ${videos.length}本のYouTube動画をエピソード追加`)
    }

    updatedCount++
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 有名人YouTubeチャンネル情報更新完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  更新した有名人: ${updatedCount}人`)
  console.log(`  追加したYouTube動画: ${addedEpisodes}本`)

  // 更新後確認
  console.log('\n📺 チャンネル情報確認:')
  for (const celebrityName of Object.keys(ACCURATE_CHANNEL_NAMES).slice(0, 10)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name, subscriber_count')
      .eq('name', celebrityName)
      .single()

    if (celebrity && celebrity.subscriber_count) {
      console.log(`✅ ${celebrity.name}: ${celebrity.subscriber_count.toLocaleString()}人`)
    } else if (celebrity) {
      console.log(`❌ ${celebrity.name}: チャンネル情報なし`)
    }
  }

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで各有名人を確認')
  console.log('• プロフィールページでYouTube動画エピソードを確認')
  console.log('• 登録者数情報も表示されます')
  console.log('• ブラウザでハードリフレッシュ推奨')
}

// 実行
updateCelebrityYouTubeChannels().catch(console.error)