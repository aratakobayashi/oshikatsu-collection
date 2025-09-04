import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

interface YouTubeChannelResponse {
  items: {
    snippet: {
      title: string
      description: string
      thumbnails: {
        default: { url: string }
        medium: { url: string }
        high: { url: string }
      }
    }
    statistics: {
      subscriberCount: string
      videoCount: string
      viewCount: string
    }
  }[]
}

async function updateMoenoazukiImage() {
  console.log('🍎 もえのあずきのYouTube公式画像を取得・更新中...\n')

  try {
    // もえのあずきのYouTubeチャンネル情報を取得
    const channelId = 'UCepkcGa3-DVdNHcHGwEkXTg' // もえのあずき公式チャンネル
    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
    
    console.log('🔍 YouTube APIでチャンネル情報取得中...')
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`YouTube API エラー: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data: YouTubeChannelResponse = await response.json()
    
    if (!data.items || data.items.length === 0) {
      throw new Error('チャンネルが見つかりませんでした')
    }

    const channel = data.items[0]
    const highResImage = channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.medium?.url

    if (!highResImage) {
      throw new Error('チャンネル画像が見つかりませんでした')
    }

    console.log('✅ YouTube チャンネル情報取得成功!')
    console.log(`   チャンネル名: ${channel.snippet.title}`)
    console.log(`   登録者数: ${parseInt(channel.statistics.subscriberCount || '0').toLocaleString()}`)
    console.log(`   動画数: ${channel.statistics.videoCount}`)
    console.log(`   画像URL: ${highResImage}\n`)

    // データベース更新
    console.log('📝 データベース更新中...')
    const { data: updateData, error } = await supabase
      .from('celebrities')
      .update({
        image_url: highResImage,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'moenoazuki')
      .select()

    if (error) {
      throw new Error(`データベース更新エラー: ${error.message}`)
    }

    if (!updateData || updateData.length === 0) {
      throw new Error('もえのあずきのレコードが見つかりませんでした (slug: moenoazuki)')
    }

    console.log('🎉 もえのあずきの画像更新完了!')
    console.log(`   更新されたレコード: ${updateData.length}件`)
    console.log(`   新しい画像URL: ${highResImage}`)
    console.log('')
    console.log('🌟 メリット:')
    console.log('✅ YouTube公式チャンネルの高解像度画像')
    console.log('✅ 著作権的に安全')
    console.log('✅ 自動更新可能な仕組み')
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    process.exit(1)
  }
}

// 実行 (ES Modules対応)
if (import.meta.url === `file://${process.argv[1]}`) {
  updateMoenoazukiImage()
}

export { updateMoenoazukiImage }