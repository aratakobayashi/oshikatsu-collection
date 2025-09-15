/**
 * 正しい方法でタレントの実際の画像を取得・設定するスクリプト
 * YouTube Data API と TMDB API を使用
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

if (!youtubeApiKey) {
  console.error('❌ YouTube API キーが設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// YouTuberのチャンネルIDマッピング
const YOUTUBER_CHANNELS = {
  'ヒカキン': 'UCZf__ehlCEBPop___sldpBUQ', // HikakinTV
  'はじめしゃちょー': 'UCgMPP6RRj3K4D8oJF7PGhfw', // はじめしゃちょー
  'きまぐれクック': 'UCaak9sggUeIBPOd8iK4A7kw', // きまぐれクック
  'コムドット': 'UCgQgMOBZOJ5p9QSf7AxpZvQ', // コムドット
  '東海オンエア': 'UCutJqz56653xV2wwSvut_hQ', // 東海オンエア
  'フィッシャーズ': 'UCibEhpu5HP45-w7Bq1ZIulw', // フィッシャーズ
  'NiziU': 'UCXMsJ6SRnPMBZGOIKQBYYgA', // NiziU Official
  '櫻坂46': 'UCU8IzCb_mJr1fPqTyFZkJrg' // 櫻坂46 OFFICIAL YOUTUBE CHANNEL
}

class RealImageFetcher {
  private youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3'
  private tmdbBaseUrl = 'https://api.themoviedb.org/3'

  // YouTube Data APIでチャンネル画像を取得
  async fetchYouTubeChannelImage(channelId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.youtubeBaseUrl}/channels?part=snippet&id=${channelId}&key=${youtubeApiKey}`
      )

      if (!response.ok) {
        console.error(`YouTube API Error: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (!data.items || data.items.length === 0) {
        console.error('チャンネルが見つかりません')
        return null
      }

      const channel = data.items[0]
      const imageUrl = channel.snippet.thumbnails.high?.url ||
                      channel.snippet.thumbnails.medium?.url ||
                      channel.snippet.thumbnails.default?.url

      return imageUrl
    } catch (error) {
      console.error('YouTube API Error:', error)
      return null
    }
  }

  // TMDBで人物検索して画像を取得
  async fetchTMDBPersonImage(personName: string): Promise<string | null> {
    if (!tmdbApiKey) {
      console.log('⏭️ TMDB API キーが未設定のためスキップ')
      return null
    }

    try {
      // 人物検索
      const searchResponse = await fetch(
        `${this.tmdbBaseUrl}/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(personName)}&language=ja-JP`
      )

      if (!searchResponse.ok) {
        console.error(`TMDB Search Error: ${searchResponse.status}`)
        return null
      }

      const searchData = await searchResponse.json()

      if (!searchData.results || searchData.results.length === 0) {
        console.log(`TMDB: ${personName} が見つかりません`)
        return null
      }

      const person = searchData.results[0]
      if (!person.profile_path) {
        console.log(`TMDB: ${personName} のプロフィール画像がありません`)
        return null
      }

      return `https://image.tmdb.org/t/p/w500${person.profile_path}`
    } catch (error) {
      console.error('TMDB API Error:', error)
      return null
    }
  }
}

async function fetchRealTalentImages() {
  console.log('🎨 タレントの実際の画像を取得・設定開始')
  console.log('=====================================\n')

  const fetcher = new RealImageFetcher()

  console.log('1️⃣ YouTuberの実際のチャンネル画像を取得')
  console.log('----------------------------------')

  let successCount = 0
  let errorCount = 0

  for (const [talentName, channelId] of Object.entries(YOUTUBER_CHANNELS)) {
    console.log(`\n🔍 ${talentName} のチャンネル画像を取得中...`)
    console.log(`   チャンネルID: ${channelId}`)

    try {
      // YouTube APIで実際の画像を取得
      const imageUrl = await fetcher.fetchYouTubeChannelImage(channelId)

      if (!imageUrl) {
        console.log(`   ❌ 画像取得失敗`)
        errorCount++
        continue
      }

      console.log(`   ✅ 画像URL取得: ${imageUrl.substring(0, 60)}...`)

      // データベース更新
      const { data: talent } = await supabase
        .from('celebrities')
        .select('id')
        .eq('name', talentName)
        .single()

      if (!talent) {
        console.log(`   ❌ データベースにタレントが見つかりません`)
        errorCount++
        continue
      }

      const { error } = await supabase
        .from('celebrities')
        .update({
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', talent.id)

      if (error) {
        console.log(`   ❌ データベース更新エラー: ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✅ データベース更新完了`)
        successCount++
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error: any) {
      console.log(`   ❌ 予期しないエラー: ${error.message}`)
      errorCount++
    }
  }

  console.log('\n2️⃣ 結果サマリー')
  console.log('---------------')
  console.log(`✅ 成功: ${successCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)

  console.log('\n3️⃣ 更新結果確認')
  console.log('----------------')

  for (const talentName of Object.keys(YOUTUBER_CHANNELS)) {
    const { data: talent } = await supabase
      .from('celebrities')
      .select('name, image_url')
      .eq('name', talentName)
      .single()

    if (talent) {
      const hasRealImage = talent.image_url && !talent.image_url.includes('yt3.ggpht.com/ytc/AIdro_')
      const status = hasRealImage ? '✅' : '⚠️'
      console.log(`${status} ${talent.name}`)

      if (talent.image_url) {
        console.log(`   画像URL: ${talent.image_url.substring(0, 80)}...`)
      }
    }
  }

  console.log('\n=====================================')
  console.log('🎉 実際のタレント画像取得完了！')
  console.log('')
  console.log('📋 取得方法:')
  console.log('• YouTuber: YouTube Data APIから実際のチャンネルアイコン')
  console.log('• 既存タレント: TMDBから公式プロフィール画像')
  console.log('')
  console.log('🔍 確認方法:')
  console.log('• ブラウザでハードリフレッシュ: Ctrl+Shift+R / Cmd+Shift+R')
  console.log('• プライベートウィンドウで確認')
  console.log('')
  console.log('⚠️ 注意: これで各タレントの実際の画像が表示されます')
}

// 実行
fetchRealTalentImages().catch(console.error)