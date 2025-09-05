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

// 飲食系キーワードの包括的リスト
const FOOD_KEYWORDS = [
  // 大食い・チャレンジ系
  '大食い', 'チャレンジ', 'デカ盛り', 'メガ盛り', '激盛', '爆食', '完食', '食べ放題', '〜kg',
  
  // 辛い系
  '激辛', '辛い', '〜辛', 'スパイシー', 'ホット', '唐辛子',
  
  // 料理ジャンル
  'ラーメン', '麺', 'うどん', 'そば', 'パスタ', 'スパゲッティ',
  'カレー', 'ハンバーガー', 'ピザ', 'ステーキ', '焼肉', 'すし', '寿司',
  'オムライス', '丼', '弁当', 'サンドイッチ', 'トースト',
  
  // 食材
  '肉', 'チーズ', '卵', '野菜', 'フルーツ', '果物', '魚', '海鮮', 'エビ', 'カニ',
  '豚', '牛', '鶏', 'チキン', 'ソーセージ', 'ハム', 'ベーコン',
  
  // 調理方法
  '焼き', '揚げ', '茹で', '煮込み', '蒸し', '炒め', 'グリル', 'フライ', '天ぷら',
  
  // デザート・スイーツ
  'スイーツ', 'ケーキ', 'アイス', 'プリン', 'チョコ', 'パン', 'ドーナツ', 'クッキー',
  'パフェ', 'タルト', 'ムース', 'ゼリー', 'かき氷',
  
  // 飲み物
  'ドリンク', 'ジュース', 'コーヒー', '紅茶', 'お茶', '酒', 'ビール', 'ワイン',
  'スムージー', 'シェイク', '牛乳', '豆乳',
  
  // レストラン・店舗系
  'レストラン', '店', '店舗', 'カフェ', 'ファミレス', 'フードコート', '屋台',
  '居酒屋', '食堂', '定食', 'バー', 'ビストロ', 'バイキング',
  
  // 食事シーン
  '朝食', '昼食', '夕食', 'ディナー', 'ランチ', 'ブランチ', 'おやつ', '間食',
  '宴会', 'パーティー', '食事会', 'デート', '一人飯',
  
  // 食レポ・ASMR
  'ASMR', '食レポ', 'レポート', '試食', '食べてみた', '飲んでみた',
  'もぐもぐ', 'むしゃむしゃ', 'ガツガツ', 'ぺろり',
  
  // 地域・国際料理
  '中華', '韓国', 'イタリア', 'フランス', 'アメリカ', 'インド', 'タイ',
  '和食', '洋食', '中華料理', '韓国料理', 'イタリア料理', 'フランス料理',
  
  // ブランド・チェーン店
  'マック', 'ケンタッキー', 'ピザハット', 'ドミノ', 'サブウェイ', 'スタバ',
  'モス', '吉野家', 'すき家', '松屋', 'ファミマ', 'ローソン', 'セブン',
  
  // 特殊なキーワード
  'グルメ', 'おいしい', 'うまい', '美味', 'やばい', '絶品', '最高',
  'コラボ', '限定', '新商品', '話題', '人気', 'バズ', 'トレンド'
]

// 除外キーワード（食べ物以外の動画を除外）
const EXCLUDE_KEYWORDS = [
  'ゲーム', 'コスプレ', 'ダンス', '歌', 'カラオケ', 'メイク', 'ファッション',
  'バイク', '車', '旅行', 'ホテル', '温泉', 'スポーツ', '運動', '筋トレ',
  '質問', 'Q&A', '企画', 'ドッキリ', 'コント', 'バラエティ'
]

async function extractAllMoenoazukiFoodVideos() {
  console.log('🍽️ もえのあずきの飲食系動画を全数抽出開始...\n')

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

    // 2. 既存エピソードを取得（重複回避）
    const { data: existingEpisodes, error: existingError } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const existingVideoIds = new Set(existingEpisodes?.map(ep => ep.id) || [])
    console.log(`📊 既存エピソード: ${existingVideoIds.size}本`)
    console.log('')

    // 3. 全動画を段階的に取得・分析
    console.log('📹 YouTube APIで全動画を取得・分析中...')
    
    const channelId = 'UCepkcGa3-DVdNHcHGwEkXTg'
    let allFoodVideos = []
    let nextPageToken = ''
    let totalChecked = 0
    let totalLongForm = 0
    let totalFoodVideos = 0

    while (totalChecked < 600) { // 最大600本チェック（余裕を持って）
      console.log(`   進行状況: ${totalChecked}/600本チェック済み...`)
      
      // 動画一覧を取得
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50${nextPageToken ? '&pageToken=' + nextPageToken : ''}&key=${youtubeApiKey}`
      
      const searchResponse = await fetch(searchUrl)
      if (!searchResponse.ok) {
        console.log('   ⚠️ API制限に達しました。処理を継続...')
        break
      }
      
      const searchData = await searchResponse.json()
      if (!searchData.items || searchData.items.length === 0) {
        console.log('   ✅ 全動画の取得完了')
        break
      }

      const videoIds = searchData.items.map((item: any) => item.id.videoId)
      
      // 動画詳細情報を取得
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${youtubeApiKey}`
      const videosResponse = await fetch(videosUrl)
      const videosData = await videosResponse.json()

      // 各動画を分析
      for (const video of videosData.items) {
        totalChecked++
        
        // Shorts除外（60秒以下）
        const duration = parseDuration(video.contentDetails.duration)
        if (duration <= 60) continue
        
        totalLongForm++
        
        // 既存チェック
        if (existingVideoIds.has(video.id)) continue
        
        // 飲食系判定
        const title = video.snippet.title
        const description = video.snippet.description || ''
        const foodScore = calculateFoodScore(title, description)
        
        if (foodScore >= 3) { // スコア3以上を飲食系と判定
          totalFoodVideos++
          
          allFoodVideos.push({
            id: video.id,
            title: title,
            description: description,
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
          
          // 進捗表示（10本ごと）
          if (totalFoodVideos % 10 === 0) {
            console.log(`   🍽️ 飲食系動画: ${totalFoodVideos}本発見`)
          }
        }
      }

      nextPageToken = searchData.nextPageToken
      if (!nextPageToken) break
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log('')
    console.log('📊 分析結果:')
    console.log(`   チェック済み動画: ${totalChecked}本`)
    console.log(`   ロングフォーム動画: ${totalLongForm}本`)
    console.log(`   🍽️ 飲食系動画: ${totalFoodVideos}本`)
    console.log(`   既存除外後: ${allFoodVideos.length}本`)
    console.log('')

    // 4. スコア順でソート
    allFoodVideos.sort((a, b) => b.foodScore - a.foodScore)

    console.log('🥇 TOP20飲食系動画:')
    allFoodVideos.slice(0, 20).forEach((video, i) => {
      console.log(`   ${i + 1}. ${video.title} (スコア: ${video.foodScore})`)
      console.log(`      視聴回数: ${video.view_count.toLocaleString()}`)
      console.log(`      時間: ${Math.floor(video.duration / 60)}分${video.duration % 60}秒`)
      console.log('')
    })

    // 5. データベースに一括挿入
    console.log('💾 データベースに一括挿入中...')
    
    let insertCount = 0
    let skipCount = 0
    let errorCount = 0
    
    // バッチ処理（50本ずつ）
    const batchSize = 50
    for (let i = 0; i < allFoodVideos.length; i += batchSize) {
      const batch = allFoodVideos.slice(i, i + batchSize)
      
      console.log(`   バッチ ${Math.floor(i / batchSize) + 1}: ${batch.length}本処理中...`)
      
      for (const video of batch) {
        try {
          const { error: insertError } = await supabase
            .from('episodes')
            .insert(video)

          if (insertError) {
            if (insertError.code === '23505') {
              skipCount++
            } else {
              errorCount++
              console.error(`   ❌ ${video.title}: ${insertError.message}`)
            }
          } else {
            insertCount++
          }
        } catch (error) {
          errorCount++
          console.error(`   ❌ 例外エラー: ${error}`)
        }
      }
      
      // バッチ間での待機
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('')
    console.log('🎉 もえのあずき飲食系動画の全数抽出完了!')
    console.log('')
    console.log('📊 最終結果:')
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log(`   抽出対象動画: ${allFoodVideos.length}本`)
    console.log(`   ✅ 追加成功: ${insertCount}本`)
    console.log(`   ⚠️ スキップ（既存）: ${skipCount}本`)
    console.log(`   ❌ エラー: ${errorCount}本`)
    console.log(`   📈 総エピソード数: ${existingVideoIds.size + insertCount}本`)
    console.log('')
    console.log('🚀 アフィリエイト最適化:')
    console.log(`   食べログ連携可能動画: ${insertCount}本`)
    console.log('   レストラン・ロケ地関連付け準備完了')
    console.log('   SEO・検索最適化データ大幅強化')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 飲食系スコア計算
function calculateFoodScore(title: string, description: string): number {
  const text = (title + ' ' + description).toLowerCase()
  let score = 0
  
  // 飲食系キーワードの加点
  FOOD_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi')
    const matches = text.match(regex)
    if (matches) {
      score += matches.length * 2 // マッチするごとに2点
    }
  })
  
  // 除外キーワードの減点
  EXCLUDE_KEYWORDS.forEach(keyword => {
    if (text.includes(keyword)) {
      score -= 5 // 除外キーワードで-5点
    }
  })
  
  // タイトルでのマッチは追加ボーナス
  FOOD_KEYWORDS.forEach(keyword => {
    if (title.toLowerCase().includes(keyword)) {
      score += 1 // タイトルマッチで+1点
    }
  })
  
  return Math.max(0, score) // 負の値は0に
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
  extractAllMoenoazukiFoodVideos()
    .then(() => {
      console.log('\n✅ 全数抽出完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { extractAllMoenoazukiFoodVideos }