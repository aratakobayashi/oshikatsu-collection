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

async function expandMoenoazukiEpisodes() {
  console.log('🚀 もえのあずきのエピソードを10-20本に大幅拡充中...\n')

  try {
    // 1. もえのあずきの情報を取得
    console.log('🔍 もえのあずきの情報を取得中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ確認: ${celebrity.name} (ID: ${celebrity.id})`)

    // 2. 既存エピソードをチェック
    const { data: existingEpisodes, error: existingError } = await supabase
      .from('episodes')
      .select('*')
      .eq('celebrity_id', celebrity.id)

    console.log(`📊 既存エピソード: ${existingEpisodes?.length || 0}本`)
    console.log('')

    // 3. YouTube APIで多様なキーワードで検索（食べ物関連を重視）
    console.log('🔍 YouTube APIで多様な動画を検索中...')
    
    const channelId = 'UCepkcGa3-DVdNHcHGwEkXTg'
    const searchQueries = [
      '大食い',
      'チャレンジ', 
      '店舗',
      'レストラン',
      '食べ放題',
      'デカ盛り',
      '激辛',
      'ラーメン',
      'スイーツ',
      '料理',
      'グルメ',
      'ASMR',
      '食レポ',
      '激盛',
      'メガ盛り'
    ]

    const allVideoData = new Set() // 重複除去用
    const existingVideoIds = new Set(existingEpisodes?.map(ep => ep.id) || [])

    for (const query of searchQueries.slice(0, 8)) { // 8つのクエリで検索
      console.log(`   検索キーワード: "${query}"`)
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&q=${encodeURIComponent(query)}&order=relevance&maxResults=5&key=${youtubeApiKey}`
      
      try {
        const response = await fetch(searchUrl)
        if (!response.ok) continue
        
        const searchData = await response.json()
        searchData.items.forEach((item: any) => {
          if (!existingVideoIds.has(item.id.videoId)) {
            allVideoData.add(item.id.videoId)
          }
        })
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.log(`   ⚠️ キーワード "${query}" の検索でエラー`)
      }
    }

    // 最新動画も追加取得
    console.log('   最新動画も追加取得中...')
    const latestUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&key=${youtubeApiKey}`
    
    try {
      const latestResponse = await fetch(latestUrl)
      if (latestResponse.ok) {
        const latestData = await latestResponse.json()
        latestData.items.forEach((item: any) => {
          if (!existingVideoIds.has(item.id.videoId)) {
            allVideoData.add(item.id.videoId)
          }
        })
      }
    } catch (error) {
      console.log('   ⚠️ 最新動画取得でエラー')
    }

    const videoIds = Array.from(allVideoData).slice(0, 20) // 最大20本
    console.log(`🎥 ${videoIds.length}本の新規候補動画を発見`)

    if (videoIds.length === 0) {
      console.log('⚠️ 新規追加可能な動画が見つかりませんでした')
      return
    }

    // 4. 動画詳細情報を一括取得
    console.log('📊 動画詳細情報を取得中...')
    const batchSize = 50 // YouTube API制限
    const allVideos = []

    for (let i = 0; i < videoIds.length; i += batchSize) {
      const batch = videoIds.slice(i, i + batchSize)
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${youtubeApiKey}`
      
      try {
        const videosResponse = await fetch(videosUrl)
        if (videosResponse.ok) {
          const videosData = await videosResponse.json()
          allVideos.push(...videosData.items)
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.log(`   ⚠️ バッチ ${i}-${i + batchSize} の取得でエラー`)
      }
    }

    console.log(`✅ ${allVideos.length}本の詳細情報を取得完了`)
    console.log('')

    // 5. 食べ物関連動画を優先的に選定
    console.log('🍽️ 食べ物・グルメ関連動画を優先選定中...')
    
    // 食べ物関連キーワードでスコアリング
    const foodKeywords = [
      '大食い', 'チャレンジ', 'デカ盛り', '激辛', 'ラーメン', 'スイーツ',
      '食べ放題', 'グルメ', '料理', 'レストラン', '店舗', 'ASMR',
      '激盛', 'メガ盛り', '食レポ', 'ハンバーガー', 'ピザ', 'カレー',
      '寿司', '焼肉', '中華', 'イタリアン', 'フレンチ', '和食'
    ]

    const scoredVideos = allVideos.map(video => {
      const title = video.snippet.title.toLowerCase()
      const description = (video.snippet.description || '').toLowerCase()
      let score = 0
      
      // タイトルでのキーワードマッチ（高得点）
      foodKeywords.forEach(keyword => {
        if (title.includes(keyword)) score += 3
        if (description.includes(keyword)) score += 1
      })
      
      // 視聴回数による加点
      const viewCount = parseInt(video.statistics.viewCount || '0')
      if (viewCount > 100000) score += 2
      if (viewCount > 500000) score += 3
      
      // 動画の長さ（10分以上が理想的）
      const duration = parseDuration(video.contentDetails.duration)
      if (duration >= 600) score += 2
      
      return { ...video, score, duration }
    }).sort((a, b) => b.score - a.score)

    // 上位15-18本を選択
    const selectedVideos = scoredVideos.slice(0, Math.min(18, scoredVideos.length))
    console.log(`✅ ${selectedVideos.length}本を選定完了`)

    // 6. エピソードデータを準備
    console.log('📝 エピソードデータを準備中...')
    const episodes = []
    
    for (const video of selectedVideos) {
      episodes.push({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description || '',
        date: new Date(video.snippet.publishedAt).toISOString(),
        duration: video.duration,
        thumbnail_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
        comment_count: parseInt(video.statistics.commentCount || '0'),
        celebrity_id: celebrity.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    console.log('📋 追加予定のエピソード:')
    episodes.forEach((ep, i) => {
      const score = selectedVideos[i].score
      console.log(`   ${i + 1}. ${ep.title} (スコア: ${score})`)
      console.log(`      公開日: ${new Date(ep.date).toLocaleDateString('ja-JP')}`)
      console.log(`      視聴回数: ${ep.view_count.toLocaleString()}`)
      console.log(`      時間: ${Math.floor(ep.duration / 60)}分${ep.duration % 60}秒`)
      console.log(`      動画URL: ${ep.video_url}`)
      console.log('')
    })

    // 7. データベースに一括挿入
    console.log('💾 エピソードをデータベースに一括挿入中...')
    
    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const episode of episodes) {
      try {
        const { error: episodeError } = await supabase
          .from('episodes')
          .insert(episode)

        if (episodeError) {
          if (episodeError.code === '23505') { // 重複キー
            skipCount++
            console.log(`   ⚠️ スキップ（既存）: ${episode.title.slice(0, 50)}...`)
          } else {
            errorCount++
            console.error(`   ❌ エラー: ${episodeError.message}`)
          }
        } else {
          successCount++
          console.log(`   ✅ 追加完了: ${episode.title.slice(0, 50)}...`)
        }
      } catch (error) {
        errorCount++
        console.error(`   ❌ 例外エラー: ${error}`)
      }
    }

    console.log('')
    console.log('🎉 もえのあずきエピソード大幅拡充完了!')
    console.log('')
    console.log('📊 処理結果:')
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log(`   処理対象動画: ${episodes.length}本`)
    console.log(`   追加成功: ${successCount}本`)
    console.log(`   スキップ（既存）: ${skipCount}本`)
    console.log(`   エラー: ${errorCount}本`)
    console.log(`   既存 + 新規 = ${(existingEpisodes?.length || 0) + successCount}本`)
    console.log('')
    console.log('🚀 次のステップ:')
    console.log('1. ロケ地との関連付け拡充')
    console.log('2. 食べログアフィリエイト最適化')
    console.log('3. SEO向けメタデータ強化')
    console.log('4. サイト表示確認')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// YouTube動画の時間文字列をパース（PT15M33S -> 933秒）
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  expandMoenoazukiEpisodes()
    .then(() => {
      console.log('\n✅ 拡充実行完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { expandMoenoazukiEpisodes }