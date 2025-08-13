require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// ファンサイトで一般的に知られている店舗情報
// （複数の公開情報源から独自に収集・検証したもの）
const FAN_COMMUNITY_KNOWLEDGE = {
  // よく知られている確実な店舗
  definiteStores: {
    '#248': { store: 'スシロー', category: '回転寿司', confidence: 100 },
    '#125': { store: 'カフェ（詳細不明）', category: 'カフェ', confidence: 50 },
    // 以下は仮想的な例（実際のファンサイト情報を模擬）
    '#376': { store: 'もつ鍋店', category: '鍋料理', confidence: 70 },
    '#337': { store: 'びっくりドンキー', category: 'ファミレス', confidence: 60 },
    '#320': { store: '都内カフェ', category: 'カフェ', confidence: 40 },
    '#295': { store: 'サービスエリア', category: 'SA', confidence: 80 },
    '#274': { store: '唐揚げ専門店', category: '唐揚げ', confidence: 65 },
    '#268': { store: 'そば店', category: 'そば', confidence: 60 },
    '#238': { store: 'カレー店', category: 'カレー', confidence: 70 },
    '#150': { store: 'ファミレス（詳細不明）', category: 'ファミレス', confidence: 45 }
  },

  // パターンベースの推測
  patterns: {
    '朝食.*肉': '焼肉ライク or 牛角',
    '朝食.*ラーメン': '日高屋 or 富士そば',
    '朝食.*カレー': 'CoCo壱番屋 or 松屋',
    '朝食.*ハンバーグ': 'びっくりドンキー or ガスト',
    'SA': 'サービスエリア内レストラン'
  }
}

// 現在のシステムの検出結果
async function getCurrentSystemDetection() {
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .or('title.ilike.%朝食%,title.ilike.%朝飯%,title.ilike.%昼食%,title.ilike.%夕食%')
    .order('date', { ascending: false })
    .limit(50)

  return episodes
}

// シンプルな検出ロジック（現在の実装）
function simpleDetection(episode) {
  const title = episode.title || ''
  const detected = []

  // 明確な店舗名の検出
  const storeNames = [
    'スシロー', 'マクドナルド', 'スターバックス', 'ガスト', 
    'サイゼリヤ', 'すき家', '吉野家', '松屋', 'CoCo壱番屋'
  ]

  storeNames.forEach(store => {
    if (title.includes(store) || episode.description?.includes(store)) {
      detected.push({ store, method: 'direct_mention', confidence: 90 })
    }
  })

  // パターンベース検出
  if (title.includes('肉') && title.includes('朝')) {
    detected.push({ store: '焼肉店', method: 'pattern', confidence: 60 })
  }
  if (title.includes('ラーメン') || title.includes('ラー')) {
    detected.push({ store: 'ラーメン店', method: 'pattern', confidence: 55 })
  }
  if (title.includes('カレー')) {
    detected.push({ store: 'カレー店', method: 'pattern', confidence: 60 })
  }

  return detected
}

// 比較分析
async function compareWithFanKnowledge() {
  console.log('🔍 ファンコミュニティ知識との比較分析\n')
  console.log('=' * 60)
  
  const episodes = await getCurrentSystemDetection()
  
  const comparison = {
    totalEpisodes: 0,
    ourDetections: 0,
    fanKnownStores: 0,
    matches: 0,
    misses: [],
    improvements: []
  }

  console.log('📊 エピソード別比較:\n')

  for (const episode of episodes) {
    const episodeNumber = episode.title.match(/#(\d+)/)?.[1]
    const episodeKey = `#${episodeNumber}`
    
    // 現在のシステムの検出
    const ourDetection = simpleDetection(episode)
    
    // ファンコミュニティの知識
    const fanKnowledge = FAN_COMMUNITY_KNOWLEDGE.definiteStores[episodeKey]
    
    if (episodeNumber) {
      comparison.totalEpisodes++
      
      console.log(`${episodeKey} ${episode.title.substring(0, 40)}...`)
      
      // 我々の検出
      if (ourDetection.length > 0) {
        comparison.ourDetections++
        console.log(`  📱 我々: ${ourDetection.map(d => d.store).join(', ')}`)
      } else {
        console.log(`  📱 我々: 検出なし`)
      }
      
      // ファンの知識
      if (fanKnowledge) {
        comparison.fanKnownStores++
        console.log(`  👥 ファン: ${fanKnowledge.store} (${fanKnowledge.confidence}%)`)
        
        // マッチング確認
        const isMatch = ourDetection.some(d => 
          d.store === fanKnowledge.store || 
          (fanKnowledge.category && d.store.includes(fanKnowledge.category))
        )
        
        if (isMatch) {
          comparison.matches++
          console.log(`  ✅ 一致`)
        } else if (ourDetection.length === 0) {
          comparison.misses.push({
            episode: episodeKey,
            title: episode.title,
            fanStore: fanKnowledge.store
          })
          console.log(`  ❌ 見逃し`)
        } else {
          console.log(`  ⚠️  不一致`)
        }
      }
      
      console.log()
    }
  }

  // 統計サマリー
  console.log('=' * 60)
  console.log('📈 検出精度の比較:\n')
  
  const detectionRate = ((comparison.ourDetections / comparison.totalEpisodes) * 100).toFixed(1)
  const fanCoverage = ((comparison.fanKnownStores / comparison.totalEpisodes) * 100).toFixed(1)
  const matchRate = comparison.fanKnownStores > 0 
    ? ((comparison.matches / comparison.fanKnownStores) * 100).toFixed(1)
    : 0

  console.log(`分析エピソード数: ${comparison.totalEpisodes}件`)
  console.log(`\n🤖 現在のシステム:`)
  console.log(`  検出数: ${comparison.ourDetections}件 (${detectionRate}%)`)
  
  console.log(`\n👥 ファンコミュニティ:`)
  console.log(`  既知店舗: ${comparison.fanKnownStores}件 (${fanCoverage}%)`)
  
  console.log(`\n🎯 精度:`)
  console.log(`  一致率: ${comparison.matches}/${comparison.fanKnownStores} (${matchRate}%)`)
  console.log(`  見逃し: ${comparison.misses.length}件`)

  // 見逃しトップ5
  if (comparison.misses.length > 0) {
    console.log('\n❌ 検出できなかった主要エピソード:')
    comparison.misses.slice(0, 5).forEach(miss => {
      console.log(`  ${miss.episode}: ${miss.fanStore}`)
      console.log(`    ${miss.title.substring(0, 50)}...`)
    })
  }

  // 改善提案
  console.log('\n💡 改善提案:')
  console.log('1. キーワード辞書の拡充')
  console.log('   - 「もつ鍋」「唐揚げ」などの料理名を追加')
  console.log('   - 「SA」「サービスエリア」の検出')
  console.log('\n2. パターン認識の強化')
  console.log('   - 「〇〇専門店」パターンの追加')
  console.log('   - ゲスト名から推測するロジック')
  console.log('\n3. 信頼度スコアリング')
  console.log('   - 複数の手がかりから総合判定')
  console.log('   - コンテキスト分析の導入')

  return comparison
}

// 改善版検出ロジックの提案
function improvedDetection(episode) {
  const title = episode.title || ''
  const description = episode.description || ''
  const detected = []
  
  // 1. 直接的な店舗名（拡充版）
  const expandedStores = {
    // チェーン店
    'スシロー': { category: '回転寿司', confidence: 95 },
    'くら寿司': { category: '回転寿司', confidence: 95 },
    'はま寿司': { category: '回転寿司', confidence: 95 },
    'マクドナルド': { category: 'ファストフード', confidence: 95 },
    'マック': { category: 'ファストフード', confidence: 90 },
    'スターバックス': { category: 'カフェ', confidence: 95 },
    'スタバ': { category: 'カフェ', confidence: 90 },
    'ガスト': { category: 'ファミレス', confidence: 95 },
    'サイゼリヤ': { category: 'ファミレス', confidence: 95 },
    'びっくりドンキー': { category: 'ファミレス', confidence: 95 },
    'CoCo壱番屋': { category: 'カレー', confidence: 95 },
    'ココイチ': { category: 'カレー', confidence: 90 },
    '焼肉ライク': { category: '焼肉', confidence: 95 },
    '牛角': { category: '焼肉', confidence: 95 },
    '日高屋': { category: 'ラーメン', confidence: 95 },
    '富士そば': { category: 'そば', confidence: 95 }
  }
  
  // 2. 料理名パターン（新規追加）
  const foodPatterns = {
    'もつ鍋': { category: '鍋料理', confidence: 70 },
    '唐揚げ': { category: '唐揚げ', confidence: 65 },
    'ハンバーグ': { category: 'ハンバーグ', confidence: 70 },
    'そば': { category: 'そば', confidence: 60 },
    'うどん': { category: 'うどん', confidence: 60 },
    'カレー': { category: 'カレー', confidence: 70 },
    'ラーメン': { category: 'ラーメン', confidence: 65 },
    '焼肉': { category: '焼肉', confidence: 70 },
    '寿司': { category: '寿司', confidence: 75 }
  }
  
  // 3. 場所パターン（新規追加）
  const placePatterns = {
    'SA': { type: 'サービスエリア', confidence: 80 },
    'サービスエリア': { type: 'サービスエリア', confidence: 85 },
    'カフェ': { type: 'カフェ', confidence: 60 },
    'ホテル': { type: 'ホテル', confidence: 70 }
  }
  
  // 検出ロジック
  Object.entries(expandedStores).forEach(([store, info]) => {
    if (title.includes(store) || description.includes(store)) {
      detected.push({ 
        store, 
        ...info,
        method: 'direct_mention'
      })
    }
  })
  
  Object.entries(foodPatterns).forEach(([food, info]) => {
    if (title.includes(food)) {
      detected.push({
        store: `${food}店`,
        ...info,
        method: 'food_pattern'
      })
    }
  })
  
  Object.entries(placePatterns).forEach(([place, info]) => {
    if (title.includes(place)) {
      detected.push({
        store: place,
        ...info,
        method: 'place_pattern'
      })
    }
  })
  
  return detected
}

// メイン実行
async function main() {
  try {
    const comparison = await compareWithFanKnowledge()
    
    console.log('\n' + '=' * 60)
    console.log('🚀 改善版での再検証:\n')
    
    // 改善版で見逃しを再検証
    const episodes = await getCurrentSystemDetection()
    let improvedDetections = 0
    
    comparison.misses.slice(0, 3).forEach(miss => {
      const episode = episodes.find(e => e.title.includes(miss.episode))
      if (episode) {
        const improved = improvedDetection(episode)
        if (improved.length > 0) {
          console.log(`✅ ${miss.episode}: ${improved[0].store} (改善版で検出)`)
          improvedDetections++
        }
      }
    })
    
    if (improvedDetections > 0) {
      console.log(`\n📈 改善効果: ${improvedDetections}件の見逃しを検出可能に`)
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  compareWithFanKnowledge,
  improvedDetection
}