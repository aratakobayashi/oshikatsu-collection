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

// TOP252の高スコア飲食系動画（手動選定）
const TOP_FOOD_VIDEOS = [
  // 肉系・ステーキ
  'Nq8sALo-cTM', // 【大食い】肉寿司が食べ放題飲み放題！！【もえあず】
  'WJ2YqLLdHhM', // 【大食い】特大うなぎにかぶりつく!!!【もえあず】  
  'e0WYjHSsZ14', // 【大食い】肉盛りデカ盛りチャレンジ【もえあず】
  'JSdG6bKb84Q', // 【大食い】お肉爆盛り完食無料チャレンジ【デカ盛り】
  'FJNPxbTbVXM', // 【大食い】賞金チャレンジデカ盛りローストホース丼【もえあず】
  'zAhHjBK8_wM', // 【大食い】４kgステーキ完食無料チャレンジ【もえあず】
  'bvnHZgnZ-is', // 【大食い】３ポンド肉３０分間チャレンジメニュー完食無料【もえあず】
  'yhfA4n4W7YQ', // 【大食い】いきなりステーキ裏技でお肉1500g食べる【裏ワザ】【もえあず】
  
  // ラーメン・麺系
  '4PgXNjO8Lbg', // 【大食い】韓国チゲ極太麺【もえあず】
  'kGBb3H5mKoI', // 【大食い】韓国料理フライドチキン冷麺ピビン麺豚キムチ純豆腐牛テール純豆腐激辛【もえあず】
  '0c8bOw9kITQ', // 【大食い】松屋お肉どっさり牛めし【もえあず】
  'O8F4P3QzJyM', // 【大食い】デカ盛りらぁ麺カレー♪【もえあず】
  'BQEEz7HYVSQ', // 【大食い】子どもラーメン無料で食べ放題【もえあず】
  'XqbfgO1FtWM', // 【大食い】辛ラーメン豚【もえあず】
  'UdBrJ8G1KfU', // 【大食い】カルボプルダックポックンミョン激辛韓国麺【もえあず】
  'Fj6rao5WIMc', // 【大食い】赤から食べ放題&飲み放題☆10辛も挑戦☆食後のおなか大公開【もえあず】
  
  // 大食いチャレンジ系
  'eCpBnQNBh5I', // 【大食い】生牡蠣の食べ放題いくつ食べられるかチャレンジ☆【もえあず】
  'WJ2YqLLdHhM', // 【大食い】特大うなぎにかぶりつく!!!【もえあず】
  'Q8fhUZQIHSQ', // 【危険】完食したら無料チャレンジ激辛メニュー【もえあず】
  
  // 海鮮系
  'GLh257IrftQ', // 【大食い】回転寿司大食いチャレンジ【もえあず】
  'SKrxA7WQW1k', // 【大食い】韓国ビビン麺【ASMR】
  'fXd80r20OeI', // 【大食い】生えびシュリンプ【ASMR】
  
  // デザート・スイーツ系
  'q3IFDAChttQ', // 【大食い】豪快チーズがけ特大スフレオムレツ【もえあず】
  'FrgDeg5mo30', // 【大食い】揚げたこ焼きチーズ明太てりたまソースマヨおろしポン酢【もえあず】
  
  // 国際料理
  '3AVVkeSzp0w', // 【大食い】香港食べ放題【もえあず】
  'uQvpR9-o8Jc', // フランスのデカ盛りチャレンジ🥐
  
  // その他の人気動画
  'c78W7bxlX7s', // 【爆食】大食い女子新年会で飲んで食べる♡【もえあず】
  'gYLQ2NeSXx8', // 【大食い】あか牛ステーキ【もえあず】
  'DlbgYFSLN4o', // 【大食い】刀削麺全品完食【もえあず】
]

async function addTopMoenoazukiFoodVideos() {
  console.log('🥇 もえのあずきTOP飲食系動画を一括追加中...\n')

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
    const newVideoIds = TOP_FOOD_VIDEOS.filter(id => !existingVideoIds.has(id))
    console.log(`🆕 新規追加対象: ${newVideoIds.length}本`)
    console.log('')

    if (newVideoIds.length === 0) {
      console.log('✅ すべての動画が既に追加済みです')
      return
    }

    // 4. 動画詳細情報をYouTube APIで取得
    console.log('📺 YouTube APIで動画詳細を取得中...')
    
    const batchSize = 50
    const allVideos = []
    
    for (let i = 0; i < newVideoIds.length; i += batchSize) {
      const batch = newVideoIds.slice(i, i + batchSize)
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${batch.join(',')}&key=${youtubeApiKey}`
      
      const response = await fetch(videosUrl)
      if (!response.ok) {
        console.log(`⚠️ バッチ ${i + 1}-${i + batch.length} の取得でエラー`)
        continue
      }
      
      const videosData = await response.json()
      allVideos.push(...videosData.items)
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ ${allVideos.length}本の詳細情報を取得完了`)
    console.log('')

    // 5. エピソードデータを準備
    console.log('📝 エピソードデータを準備中...')
    const episodes = []
    
    for (const video of allVideos) {
      const duration = parseDuration(video.contentDetails.duration)
      
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

    console.log('🏆 TOP10追加予定エピソード:')
    episodes.slice(0, 10).forEach((ep, i) => {
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
    console.log('🎉 もえのあずきTOP飲食系動画追加完了!')
    console.log('')
    console.log('📊 最終結果:')
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log(`   処理対象動画: ${episodes.length}本`)
    console.log(`   ✅ 追加成功: ${insertCount}本`)
    console.log(`   ⚠️ スキップ（既存）: ${skipCount}本`)
    console.log(`   ❌ エラー: ${errorCount}本`)
    console.log(`   📈 総エピソード数: ${existingVideoIds.size + insertCount}本`)
    console.log('')
    console.log('🚀 飲食系コンテンツ強化完了:')
    console.log(`   大食い・チャレンジ系動画: 大幅拡充`)
    console.log('   ラーメン・肉料理・海鮮・スイーツバランス最適化')
    console.log('   食べログアフィリエイト最適化準備完了')

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
  addTopMoenoazukiFoodVideos()
    .then(() => {
      console.log('\n✅ TOP動画追加完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { addTopMoenoazukiFoodVideos }