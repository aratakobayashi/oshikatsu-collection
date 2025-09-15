/**
 * BE:FIRSTメンバーの顔写真を追加
 * YouTube Data API、画像検索を使用してプロフィール画像を取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// BE:FIRSTメンバー情報
const BEFIRST_MEMBERS = [
  'SOTA',
  'SHUNTO',
  'MANATO',
  'RYUHEI',
  'JUNON'
]

async function searchYouTubeForMemberImage(memberName: string) {
  try {
    // BE:FIRSTメンバーの動画を検索
    const query = `BE:FIRST ${memberName}`
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return null

    const searchData = await searchResponse.json()
    const videos = searchData.items || []

    // 各動画から高品質なサムネイルを探す
    for (const video of videos) {
      const thumbnail = video.snippet.thumbnails.maxres?.url ||
                       video.snippet.thumbnails.high?.url ||
                       video.snippet.thumbnails.medium?.url

      if (thumbnail && video.snippet.title.toLowerCase().includes(memberName.toLowerCase())) {
        return {
          image_url: thumbnail,
          source: `YouTube動画「${video.snippet.title}」のサムネイル`,
          video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`
        }
      }
    }

    // メンバー名が含まれていない場合でも、BE:FIRST関連動画の最初のサムネイルを使用
    if (videos.length > 0) {
      const video = videos[0]
      return {
        image_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url,
        source: `BE:FIRST関連動画「${video.snippet.title}」のサムネイル`,
        video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`
      }
    }

    return null
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return null
  }
}

async function searchBEFIRSTOfficialChannel() {
  try {
    // BE:FIRST公式チャンネルを検索
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent('BE:FIRST official')}&type=channel&maxResults=5&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return null

    const searchData = await searchResponse.json()
    const channels = searchData.items || []

    // 最も登録者数が多いチャンネルを選択
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

        if (channelInfo && channelInfo.snippet.title.includes('BE:FIRST')) {
          const subscriberCount = parseInt(channelInfo.statistics.subscriberCount || '0')
          if (subscriberCount > maxSubscribers) {
            maxSubscribers = subscriberCount
            bestChannel = channelInfo
          }
        }
      }
    }

    return bestChannel
  } catch (error) {
    console.log(`   ❌ チャンネル検索エラー:`, error)
    return null
  }
}

async function fixBEFIRSTImages() {
  console.log('📸 BE:FIRSTメンバーの顔写真追加開始')
  console.log('====================================\n')

  // BE:FIRST公式チャンネル情報を取得
  const officialChannel = await searchBEFIRSTOfficialChannel()
  const groupImage = officialChannel?.snippet?.thumbnails?.high?.url

  console.log('👥 BE:FIRST公式情報:')
  if (officialChannel) {
    console.log(`   チャンネル名: ${officialChannel.snippet.title}`)
    console.log(`   登録者数: ${parseInt(officialChannel.statistics.subscriberCount).toLocaleString()}人`)
    console.log(`   グループ画像: ${groupImage ? '取得済み' : '未取得'}`)
  }
  console.log('')

  let updatedCount = 0

  for (const memberName of BEFIRST_MEMBERS) {
    console.log(`👤 ${memberName} の画像を検索中...`)

    // 現在の情報を取得
    const { data: member } = await supabase
      .from('celebrities')
      .select('id, name, image_url, group_name')
      .eq('name', memberName)
      .single()

    if (!member) {
      console.log(`   ❌ ${memberName} が見つかりません`)
      continue
    }

    if (member.image_url && !member.image_url.includes('placeholder')) {
      console.log(`   ⏭️ 既に画像設定済み: ${member.image_url}`)
      continue
    }

    console.log(`   🔍 YouTubeで${memberName}の画像を検索中...`)

    // YouTube検索で画像を取得
    const imageResult = await searchYouTubeForMemberImage(memberName)

    if (imageResult) {
      console.log(`   ✅ 画像見つかりました: ${imageResult.source}`)
      console.log(`   🖼️ 画像URL: ${imageResult.image_url}`)

      // データベース更新
      const { error: updateError } = await supabase
        .from('celebrities')
        .update({
          image_url: imageResult.image_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id)

      if (updateError) {
        console.log(`   ❌ 更新エラー: ${updateError.message}`)
      } else {
        console.log(`   ✅ プロフィール画像更新完了`)
        updatedCount++
      }
    } else {
      console.log(`   ⚠️ 適切な画像が見つかりませんでした`)

      // フォールバック: グループ画像を使用
      if (groupImage) {
        console.log(`   💡 フォールバック: グループ画像を使用`)

        const { error: updateError } = await supabase
          .from('celebrities')
          .update({
            image_url: groupImage,
            updated_at: new Date().toISOString()
          })
          .eq('id', member.id)

        if (!updateError) {
          console.log(`   ✅ グループ画像でプロフィール更新完了`)
          updatedCount++
        }
      }
    }

    console.log('')
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('='.repeat(50))
  console.log('🎉 BE:FIRSTメンバー画像追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果: ${updatedCount}人のプロフィール画像を更新`)

  // 更新後確認
  console.log('\n📸 更新後の画像確認:')
  for (const memberName of BEFIRST_MEMBERS) {
    const { data: member } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', memberName)
      .single()

    if (member) {
      const hasImage = member.image_url && !member.image_url.includes('placeholder')
      const status = hasImage ? '✅' : '❌'
      console.log(`${status} ${member.name}: ${hasImage ? '画像あり' : '画像なし'}`)
      if (hasImage) {
        console.log(`   📸 ${member.image_url.substring(0, 60)}...`)
      }
    }
  }

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページでBE:FIRSTメンバーを確認')
  console.log('• 各メンバーのプロフィールページで画像を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
fixBEFIRSTImages().catch(console.error)