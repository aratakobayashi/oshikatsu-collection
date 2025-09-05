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

// 実在が確認された新規飲食系動画ID
const VERIFIED_FOOD_VIDEO_IDS = [
  'zfQUNhrEX9c', 
  '_mgftFpAnxo', 
  'SIost7tPnk4', 
  '-76bc9010WI', 
  '31_jnm2fzkw', 
  'gu3g9yOdgYY', 
  '4Qmkh-o2eoo', 
  'KHKKUFXNHDE', 
  '9AfKPyLixfA', 
  'eKY6rWlNZVw', 
  'Leeubp5Tssc', 
  'TfXvgsd2qjY', 
  'JYQtxZQr0LM', 
  'F7-aalm8UHE',
  'R8JdEjy5PF4', // すき焼き食べ放題で大食い♡
  '_3R0bpPHKIg', // 【大食い】たらこバタークリームパスタ【もえあず】
  'hoDooJUn7nQ', // 【大食い】サーモン明太子ホタテいくら【ASMR】
  'J9N666jR3Po', // 【大食い】韓国チキンバーガー【ASMR】
]

async function addVerifiedFoodVideos() {
  console.log('✅ 実在確認済み飲食系動画を追加中...\n')

  try {
    // 1. セレブリティ情報確認
    console.log('🔍 もえのあずきの情報を確認中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ確認: ${celebrity.name}`)

    // 2. 既存エピソードをチェック
    const { data: existingEpisodes, error: existingError } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const existingVideoIds = new Set(existingEpisodes?.map(ep => ep.id) || [])
    console.log(`📊 既存エピソード: ${existingVideoIds.size}本`)

    // 3. 新規追加対象を絞り込み
    const newVideoIds = VERIFIED_FOOD_VIDEO_IDS.filter(id => !existingVideoIds.has(id))
    console.log(`🆕 新規追加対象: ${newVideoIds.length}本`)
    console.log('')

    if (newVideoIds.length === 0) {
      console.log('✅ すべての動画が既に追加済みです')
      return
    }

    // 4. 動画詳細情報をYouTube APIで取得
    console.log('📺 YouTube APIで動画詳細を取得中...')
    
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${newVideoIds.join(',')}&key=${youtubeApiKey}`
    
    const response = await fetch(videosUrl)
    if (!response.ok) {
      throw new Error(`YouTube API エラー: ${response.status}`)
    }
    
    const videosData = await response.json()
    const allVideos = videosData.items || []

    console.log(`✅ ${allVideos.length}本の詳細情報を取得完了`)
    console.log('')

    // 5. エピソードデータを準備
    console.log('📝 エピソードデータを準備中...')
    const episodes = []
    
    for (const video of allVideos) {
      const duration = parseDuration(video.contentDetails.duration)
      
      // Shorts（60秒以下）は除外
      if (duration <= 60) {
        console.log(`   ⚠️ Shortsのため除外: ${video.snippet.title}`)
        continue
      }
      
      episodes.push({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description || '',
        date: new Date(video.snippet.publishedAt).toISOString(),
        duration: duration,
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

    // 視聴回数順でソート
    episodes.sort((a, b) => b.view_count - a.view_count)

    console.log('🏆 追加予定エピソード:')
    episodes.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.title}`)
      console.log(`      視聴回数: ${ep.view_count.toLocaleString()}`)
      console.log(`      時間: ${Math.floor(ep.duration / 60)}分${ep.duration % 60}秒`)
      console.log(`      公開日: ${new Date(ep.date).toLocaleDateString('ja-JP')}`)
      console.log('')
    })

    // 6. データベースに一括挿入
    console.log('💾 エピソードをデータベースに一括挿入中...')
    
    let insertCount = 0
    let skipCount = 0
    let errorCount = 0
    
    for (const episode of episodes) {
      try {
        const { error: insertError } = await supabase
          .from('episodes')
          .insert(episode)

        if (insertError) {
          if (insertError.code === '23505') {
            skipCount++
            console.log(`   ⚠️ スキップ（既存）: ${episode.title.slice(0, 40)}...`)
          } else {
            errorCount++
            console.error(`   ❌ エラー: ${insertError.message}`)
          }
        } else {
          insertCount++
          console.log(`   ✅ 追加完了: ${episode.title.slice(0, 40)}...`)
        }
      } catch (error) {
        errorCount++
        console.error(`   ❌ 例外エラー: ${error}`)
      }
    }

    console.log('')
    console.log('🎉 実在確認済み飲食系動画追加完了!')
    console.log('')
    console.log('📊 最終結果:')
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log(`   処理対象動画: ${episodes.length}本`)
    console.log(`   ✅ 追加成功: ${insertCount}本`)
    console.log(`   ⚠️ スキップ（既存）: ${skipCount}本`)
    console.log(`   ❌ エラー: ${errorCount}本`)
    console.log(`   📈 総エピソード数: ${existingVideoIds.size + insertCount}本`)
    console.log('')
    console.log('🚀 コンテンツ拡充効果:')
    console.log(`   21本 → ${existingVideoIds.size + insertCount}本 (${Math.round(((insertCount) / 21) * 100)}%拡充)`)
    console.log('   飲食系動画コンテンツの大幅強化完了')
    console.log('   食べログアフィリエイト収益機会拡大')

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
  addVerifiedFoodVideos()
    .then(() => {
      console.log('\n✅ 実在動画追加完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { addVerifiedFoodVideos }