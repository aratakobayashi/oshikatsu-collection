import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function analyzeMissingLocations() {
  console.log('🔍 ロケーション未設定エピソード分析開始...\n')
  
  // よにのちゃんねるのID取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // 全エピソード取得
  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('id, title, description, date, video_url')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
  
  // ロケーション設定済みエピソード取得
  const { data: episodesWithLocations } = await supabase
    .from('episode_locations')
    .select('episode_id')
    .in('episode_id', allEpisodes?.map(ep => ep.id) || [])
  
  const episodeIdsWithLocations = new Set(
    episodesWithLocations?.map(el => el.episode_id) || []
  )
  
  // ロケーション未設定エピソードをフィルタリング
  const episodesWithoutLocations = allEpisodes?.filter(ep => 
    !episodeIdsWithLocations.has(ep.id)
  ) || []
  
  console.log('📊 エピソード統計:')
  console.log('=====================================')
  console.log(`全エピソード数: ${allEpisodes?.length || 0}`)
  console.log(`ロケーション設定済み: ${episodesWithLocations?.length || 0}`)
  console.log(`ロケーション未設定: ${episodesWithoutLocations.length}`)
  console.log(`カバー率: ${Math.round(((episodesWithLocations?.length || 0) / (allEpisodes?.length || 1)) * 100)}%`)
  
  // 飲食店・ホテル系エピソードのキーワード定義
  const locationKeywords = {
    restaurants: [
      '朝食', '朝ごはん', '朝メシ', '昼食', '昼ごはん', '夜ごはん', '夕食', '晩ごはん',
      'ランチ', 'ディナー', 'モーニング', 'ブランチ',
      'レストラン', '食堂', '定食', 'カフェ', 'コーヒー', '喫茶',
      'ラーメン', 'うどん', 'そば', '寿司', '焼肉', '居酒屋', 'イタリアン', 'フレンチ',
      '中華', '韓国', 'タイ料理', 'インド', 'メキシカン',
      'ファミレス', 'ファーストフード', 'マクド', 'ケンタッキー', 'スタバ', 'ドトール',
      'デート飯', 'グルメ', '食べ歩き', '美味しい', 'うまい'
    ],
    hotels: [
      'ホテル', 'ビュッフェ', 'ブッフェ', 'ブッヘ', 'バイキング', 'セレブ',
      'リゾート', '温泉', '宿泊', 'ステイ', 'ラウンジ'
    ],
    cafes: [
      'カフェ', 'コーヒー', '喫茶', 'スタバ', 'ドトール', 'タリーズ', 'エクセルシオール',
      'カフェラテ', 'エスプレッソ', 'フラペチーノ', 'パンケーキ', 'ワッフル',
      'スイーツ', 'ケーキ', 'パフェ', 'アイス'
    ],
    shops: [
      'ショッピング', '買い物', 'デパート', '百貨店', 'モール', 'アウトレット',
      '伊勢丹', '高島屋', '三越', 'そごう', '西武', '東急', 'ルミネ', 'パルコ',
      'ららぽーと', 'イオン', 'ヨドバシ', 'ビックカメラ'
    ]
  }
  
  // エピソードを分類
  const categorizedEpisodes = {
    restaurants: [],
    hotels: [],
    cafes: [],
    shops: [],
    other: []
  }
  
  episodesWithoutLocations.forEach(episode => {
    const title = episode.title.toLowerCase()
    const description = (episode.description || '').toLowerCase()
    const text = title + ' ' + description
    
    let matched = false
    
    for (const [category, keywords] of Object.entries(locationKeywords)) {
      if (keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
        categorizedEpisodes[category].push({
          ...episode,
          matchedKeywords: keywords.filter(k => text.includes(k.toLowerCase()))
        })
        matched = true
        break
      }
    }
    
    if (!matched) {
      categorizedEpisodes.other.push(episode)
    }
  })
  
  console.log('\n🍽️ ロケーション追加候補（カテゴリ別）:')
  console.log('=====================================')
  
  Object.entries(categorizedEpisodes).forEach(([category, episodes]) => {
    if (episodes.length === 0) return
    
    const categoryNames = {
      restaurants: '🍽️ レストラン・食事系',
      hotels: '🏨 ホテル・高級施設系', 
      cafes: '☕ カフェ・スイーツ系',
      shops: '🛍️ ショッピング系',
      other: '❓ その他'
    }
    
    console.log(`\n${categoryNames[category]} (${episodes.length}件):`)
    console.log('─'.repeat(50))
    
    episodes.slice(0, 10).forEach((ep, i) => {
      console.log(`${i+1}. ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   日付: ${ep.date.split('T')[0]}`)
      if (ep.matchedKeywords) {
        console.log(`   キーワード: ${ep.matchedKeywords.join(', ')}`)
      }
      if (ep.description && ep.description.length > 0) {
        console.log(`   説明: ${ep.description.substring(0, 80)}...`)
      }
      console.log('')
    })
    
    if (episodes.length > 10) {
      console.log(`   ... 他${episodes.length - 10}件`)
    }
  })
  
  // 優先度付きサマリー
  console.log('\n🎯 推奨処理順序:')
  console.log('=====================================')
  console.log(`1. ホテル系 (${categorizedEpisodes.hotels.length}件) - 特定しやすく高価値`)
  console.log(`2. カフェ系 (${categorizedEpisodes.cafes.length}件) - チェーン店で特定容易`)
  console.log(`3. レストラン系 (${categorizedEpisodes.restaurants.length}件) - 最も多数、段階的処理`)
  console.log(`4. ショッピング系 (${categorizedEpisodes.shops.length}件) - 店舗特定が困難な場合あり`)
  
  return {
    total: allEpisodes?.length || 0,
    withLocations: episodesWithLocations?.length || 0,
    withoutLocations: episodesWithoutLocations.length,
    categorized: categorizedEpisodes
  }
}

analyzeMissingLocations().catch(console.error)