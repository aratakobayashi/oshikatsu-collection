/**
 * 正確なYouTubeチャンネルIDを検索して取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)

class ChannelIdFinder {
  private youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3'

  // YouTube検索APIでチャンネルを検索
  async searchChannelByName(channelName: string) {
    try {
      console.log(`🔍 "${channelName}" を検索中...`)

      const response = await fetch(
        `${this.youtubeBaseUrl}/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=5&key=${youtubeApiKey}`
      )

      if (!response.ok) {
        console.log(`❌ 検索エラー: ${response.status}`)
        return []
      }

      const data = await response.json()
      const results = data.items?.map((item: any) => ({
        channelId: item.id.channelId,
        title: item.snippet.title,
        description: item.snippet.description?.substring(0, 100) + '...',
        thumbnailUrl: item.snippet.thumbnails.high?.url
      })) || []

      console.log(`   見つかったチャンネル: ${results.length}件`)
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.title}`)
        console.log(`      ID: ${result.channelId}`)
        console.log(`      説明: ${result.description}`)
      })

      return results
    } catch (error) {
      console.error(`❌ "${channelName}" 検索エラー:`, error)
      return []
    }
  }

  // チャンネル情報を詳細取得
  async getChannelDetails(channelId: string) {
    try {
      const response = await fetch(
        `${this.youtubeBaseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      )

      if (!response.ok) return null

      const data = await response.json()
      const channel = data.items?.[0]

      if (!channel) return null

      return {
        id: channelId,
        title: channel.snippet.title,
        subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
        videoCount: parseInt(channel.statistics.videoCount || '0'),
        thumbnailUrl: channel.snippet.thumbnails.high?.url
      }
    } catch (error) {
      return null
    }
  }
}

async function findCorrectChannelIds() {
  console.log('🔍 YouTuberの正確なチャンネルIDを検索')
  console.log('==================================\n')

  const finder = new ChannelIdFinder()

  const youtubers = [
    'ヒカキン HikakinTV',
    'はじめしゃちょー',
    'きまぐれクック',
    'コムドット',
    '東海オンエア',
    'フィッシャーズ',
    'NiziU',
    '櫻坂46'
  ]

  const correctChannelIds: Record<string, string> = {}

  for (const youtuber of youtubers) {
    console.log(`\n${'='.repeat(50)}`)
    const results = await finder.searchChannelByName(youtuber)

    if (results.length > 0) {
      // 最も登録者数が多いチャンネルを選択
      let bestChannel = null
      let maxSubscribers = 0

      for (const result of results) {
        const details = await finder.getChannelDetails(result.channelId)
        if (details && details.subscriberCount > maxSubscribers) {
          maxSubscribers = details.subscriberCount
          bestChannel = {
            ...result,
            subscriberCount: details.subscriberCount,
            videoCount: details.videoCount
          }
        }
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (bestChannel) {
        console.log(`\n✅ "${youtuber}" の推奨チャンネル:`)
        console.log(`   チャンネル名: ${bestChannel.title}`)
        console.log(`   チャンネルID: ${bestChannel.channelId}`)
        console.log(`   登録者数: ${bestChannel.subscriberCount.toLocaleString()}人`)
        console.log(`   動画数: ${bestChannel.videoCount}本`)

        const cleanName = youtuber.replace(' HikakinTV', '').replace('ヒカキン', 'ヒカキン')
        correctChannelIds[cleanName] = bestChannel.channelId
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 検索結果まとめ')
  console.log('='.repeat(50))

  console.log('\n// 正確なチャンネルIDマッピング')
  console.log('const CORRECT_YOUTUBER_CHANNELS = {')
  for (const [name, channelId] of Object.entries(correctChannelIds)) {
    console.log(`  '${name}': '${channelId}',`)
  }
  console.log('}\n')

  // 実際に画像を取得してテスト
  console.log('🧪 画像取得テスト')
  console.log('================')

  for (const [name, channelId] of Object.entries(correctChannelIds)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${youtubeApiKey}`
      )

      if (response.ok) {
        const data = await response.json()
        const imageUrl = data.items?.[0]?.snippet?.thumbnails?.high?.url

        if (imageUrl) {
          console.log(`✅ ${name}: 画像取得成功`)
          console.log(`   ${imageUrl.substring(0, 60)}...`)

          // データベースに更新
          const { data: talent } = await supabase
            .from('celebrities')
            .select('id')
            .eq('name', name)
            .single()

          if (talent) {
            await supabase
              .from('celebrities')
              .update({
                image_url: imageUrl,
                updated_at: new Date().toISOString()
              })
              .eq('id', talent.id)
            console.log(`   ✅ データベース更新完了`)
          }
        } else {
          console.log(`⚠️ ${name}: 画像URLなし`)
        }
      } else {
        console.log(`❌ ${name}: API呼び出し失敗`)
      }

      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.log(`❌ ${name}: エラー`)
    }
  }
}

// 実行
findCorrectChannelIds().catch(console.error)