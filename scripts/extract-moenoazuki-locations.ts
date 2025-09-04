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

interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnails: {
    high: { url: string }
  }
}

interface ExtractedLocation {
  name: string
  address?: string
  description: string
  source_video: string
  video_title: string
  confidence: 'high' | 'medium' | 'low'
}

// 店舗名抽出用のパターン
const RESTAURANT_PATTERNS = [
  // 明確な店舗表記
  /([^\s]*(?:店|屋|亭|庵|堂|処|食堂|レストラン|ラーメン|うどん|そば|寿司|焼肉|居酒屋|カフェ|喫茶|バー)[^\s]*)/g,
  // 有名チェーン店
  /(マクドナルド|ケンタッキー|吉野家|松屋|すき家|ココイチ|サイゼリヤ|ガスト|デニーズ|ロイホ|びっくりドンキー)/g,
  // 地域性のある表記
  /([^\s]*(?:本店|支店|〇〇店|駅前店|本館|別館)[^\s]*)/g,
  // 食べ物系キーワード含む
  /([^\s]*(?:グリル|ビストロ|トラットリア|オステリア|タベルナ|ブラッスリー)[^\s]*)/g
]

async function extractLocationsFromMoenoazuki() {
  console.log('🍎 もえのあずきの最新動画からロケ地を抽出中...\n')

  try {
    // 1. YouTube APIで最新動画を取得
    console.log('📺 YouTube APIで最新動画取得中...')
    const channelId = 'UCepkcGa3-DVdNHcHGwEkXTg' // もえのあずき
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20&key=${youtubeApiKey}`
    
    const response = await fetch(videosUrl)
    if (!response.ok) {
      throw new Error(`YouTube API エラー: ${response.status}`)
    }

    const data = await response.json()
    const videos: YouTubeVideo[] = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }))

    console.log(`✅ ${videos.length}本の動画を取得`)
    console.log('')

    // 2. 各動画から店舗情報を抽出
    const extractedLocations: ExtractedLocation[] = []
    
    console.log('🔍 動画タイトル・説明文から店舗名を抽出中...')
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`)
      console.log(`   公開日: ${new Date(video.publishedAt).toLocaleDateString('ja-JP')}`)
      
      const textToAnalyze = `${video.title} ${video.description}`
      const foundLocations: string[] = []

      // パターンマッチングで店舗名抽出
      RESTAURANT_PATTERNS.forEach(pattern => {
        const matches = textToAnalyze.match(pattern)
        if (matches) {
          matches.forEach(match => {
            const cleanMatch = match.trim()
            if (cleanMatch.length > 1 && !foundLocations.includes(cleanMatch)) {
              foundLocations.push(cleanMatch)
            }
          })
        }
      })

      // 手動パターン: よく出てくる店舗
      const manualPatterns = [
        '回転寿司', 'ステーキ', 'ハンバーグ', 'パスタ', 'ピザ',
        '中華料理', '焼肉', 'しゃぶしゃぶ', 'すき焼き', 'お好み焼き',
        'たこ焼き', 'ラーメン', 'うどん', 'そば', 'カレー',
        '定食', '弁当', 'サンドイッチ', 'バーガー'
      ]

      manualPatterns.forEach(pattern => {
        if (textToAnalyze.includes(pattern)) {
          // より具体的な店舗名を探す
          const context = textToAnalyze.split(pattern)
          context.forEach(part => {
            const words = part.split(/[\s　、。！？()（）【】\[\]]/g)
            words.forEach(word => {
              if (word.length > 2 && word.length < 20 && 
                  (word.includes('店') || word.includes('屋') || word.includes('亭'))) {
                if (!foundLocations.includes(word)) {
                  foundLocations.push(word)
                }
              }
            })
          })
        }
      })

      // 結果を保存
      foundLocations.forEach(location => {
        extractedLocations.push({
          name: location,
          description: `もえのあずきが「${video.title}」で訪問`,
          source_video: `https://www.youtube.com/watch?v=${video.id}`,
          video_title: video.title,
          confidence: location.includes('店') || location.includes('屋') ? 'high' : 'medium'
        })
      })

      if (foundLocations.length > 0) {
        console.log(`   🏪 抽出店舗: ${foundLocations.join(', ')}`)
      } else {
        console.log(`   📝 店舗名なし`)
      }
      console.log('')
    })

    // 3. 結果サマリー
    console.log('📊 抽出結果サマリー:')
    console.log(`   総動画数: ${videos.length}`)
    console.log(`   抽出店舗数: ${extractedLocations.length}`)
    console.log('')

    // 信頼度別表示
    const highConfidence = extractedLocations.filter(l => l.confidence === 'high')
    const mediumConfidence = extractedLocations.filter(l => l.confidence === 'medium')

    console.log('🎯 高信頼度店舗 (食べログ調査推奨):')
    highConfidence.slice(0, 10).forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`)
      console.log(`   動画: ${loc.video_title}`)
      console.log(`   URL: ${loc.source_video}`)
      console.log('')
    })

    console.log('💡 次のステップ:')
    console.log('1. 高信頼度店舗の食べログURL調査')
    console.log('2. 店舗詳細情報の収集')
    console.log('3. データベース追加')
    console.log('4. もえのあずきとの関連付け設定')

    return {
      videos,
      extractedLocations,
      highConfidence,
      mediumConfidence
    }

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 実行 (ES Modules対応)
if (import.meta.url === `file://${process.argv[1]}`) {
  extractLocationsFromMoenoazuki()
    .then((result) => {
      console.log('\n✅ 抽出完了!')
      console.log(`📺 ${result.videos.length}本の動画から ${result.extractedLocations.length}店舗を抽出`)
      console.log(`🎯 高信頼度: ${result.highConfidence.length}店舗`)
      console.log(`💭 中信頼度: ${result.mediumConfidence.length}店舗`)
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { extractLocationsFromMoenoazuki }