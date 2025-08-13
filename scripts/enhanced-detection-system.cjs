require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// ファンコミュニティとの比較で判明した改善点を反映
const ENHANCED_LOCATION_DETECTION = {
  // 1. 直接的店舗名（確実性重視）
  definiteStores: [
    // 回転寿司（実績あり）
    { name: 'スシロー', category: '回転寿司', confidence: 95 },
    { name: 'くら寿司', category: '回転寿司', confidence: 95 },
    { name: 'はま寿司', category: '回転寿司', confidence: 95 },
    
    // ファミレス（ハンバーグで言及）
    { name: 'びっくりドンキー', category: 'ファミレス', confidence: 90 },
    { name: 'ガスト', category: 'ファミレス', confidence: 90 },
    { name: 'サイゼリヤ', category: 'ファミレス', confidence: 90 },
    
    // カレー（見逃し対策）
    { name: 'CoCo壱番屋', category: 'カレー', confidence: 90 },
    { name: 'ココイチ', category: 'カレー', confidence: 85 },
    
    // そば・うどん（見逃し対策）
    { name: '富士そば', category: 'そば', confidence: 90 },
    { name: 'ゆで太郎', category: 'そば', confidence: 85 },
    { name: 'はなまるうどん', category: 'うどん', confidence: 85 },
    
    // 焼肉（朝焼肉で頻出）
    { name: '焼肉ライク', category: '焼肉', confidence: 85 },
    { name: '牛角', category: '焼肉', confidence: 85 },
    
    // その他
    { name: 'マクドナルド', category: 'ファストフード', confidence: 95 },
    { name: 'スターバックス', category: 'カフェ', confidence: 95 }
  ],

  // 2. 料理名パターン（見逃し対策で重要）
  foodPatterns: [
    { pattern: /もつ鍋/i, category: 'もつ鍋', confidence: 80, hint: 'もつ鍋専門店' },
    { pattern: /唐揚げ|からあげ/i, category: '唐揚げ', confidence: 75, hint: '唐揚げ専門店' },
    { pattern: /ハンバーグ/i, category: 'ハンバーグ', confidence: 80, hint: 'びっくりドンキーなど' },
    { pattern: /そば|蕎麦/i, category: 'そば', confidence: 70, hint: '富士そばなど' },
    { pattern: /うどん/i, category: 'うどん', confidence: 70, hint: 'はなまるうどんなど' },
    { pattern: /カレー/i, category: 'カレー', confidence: 75, hint: 'CoCo壱番屋など' },
    { pattern: /ラーメン|らーめん|ラー/i, category: 'ラーメン', confidence: 70, hint: '日高屋など' },
    { pattern: /焼肉|肉.*肉/i, category: '焼肉', confidence: 75, hint: '焼肉ライクなど' },
    { pattern: /寿司|すし/i, category: '寿司', confidence: 80, hint: 'スシローなど' }
  ],

  // 3. 場所・施設パターン（新規強化）
  placePatterns: [
    { pattern: /SA|サービスエリア/i, category: 'SA', confidence: 85, hint: '高速道路SA内' },
    { pattern: /カフェ/i, category: 'カフェ', confidence: 60, hint: '都内カフェ' },
    { pattern: /ホテル/i, category: 'ホテル', confidence: 70, hint: 'ホテル内レストラン' },
    { pattern: /デパート|百貨店/i, category: 'デパート', confidence: 65, hint: 'デパ地下など' }
  ],

  // 4. コンテキスト分析（新機能）
  contextClues: [
    { keywords: ['RIKACO', 'ゲスト'], implication: 'ゲスト対応可能な店舗', confidence: 50 },
    { keywords: ['静か', '朝'], implication: '朝営業の静かな店', confidence: 45 },
    { keywords: ['新しい', '食べ物'], implication: '新メニューまたは新店舗', confidence: 40 },
    { keywords: ['旅', 'ドライブ'], implication: '旅行先・SA・ドライブスルー', confidence: 55 }
  ]
}

// 強化版検出エンジン
function enhancedLocationDetection(episode) {
  const title = episode.title || ''
  const description = episode.description || ''
  const combinedText = `${title} ${description}`.toLowerCase()
  
  const results = {
    episode: {
      id: episode.id,
      title: title,
      number: title.match(/#(\d+)/)?.[1]
    },
    detectedStores: [],
    detectedCategories: [],
    contextClues: [],
    overallConfidence: 0,
    detectionMethod: [],
    estimatedStore: null
  }

  // 1. 直接的な店舗名検出
  ENHANCED_LOCATION_DETECTION.definiteStores.forEach(store => {
    if (combinedText.includes(store.name.toLowerCase())) {
      results.detectedStores.push({
        name: store.name,
        category: store.category,
        confidence: store.confidence,
        method: 'direct_mention'
      })
      results.overallConfidence = Math.max(results.overallConfidence, store.confidence)
      results.detectionMethod.push('direct')
    }
  })

  // 2. 料理名パターン検出
  ENHANCED_LOCATION_DETECTION.foodPatterns.forEach(pattern => {
    if (pattern.pattern.test(combinedText)) {
      results.detectedCategories.push({
        category: pattern.category,
        confidence: pattern.confidence,
        hint: pattern.hint,
        method: 'food_pattern'
      })
      results.overallConfidence = Math.max(results.overallConfidence, pattern.confidence)
      results.detectionMethod.push('food_pattern')
    }
  })

  // 3. 場所パターン検出
  ENHANCED_LOCATION_DETECTION.placePatterns.forEach(pattern => {
    if (pattern.pattern.test(combinedText)) {
      results.detectedCategories.push({
        category: pattern.category,
        confidence: pattern.confidence,
        hint: pattern.hint,
        method: 'place_pattern'
      })
      results.overallConfidence = Math.max(results.overallConfidence, pattern.confidence)
      results.detectionMethod.push('place_pattern')
    }
  })

  // 4. コンテキスト分析
  ENHANCED_LOCATION_DETECTION.contextClues.forEach(clue => {
    const hasKeywords = clue.keywords.some(keyword => 
      combinedText.includes(keyword.toLowerCase())
    )
    if (hasKeywords) {
      results.contextClues.push({
        implication: clue.implication,
        confidence: clue.confidence,
        keywords: clue.keywords.filter(k => combinedText.includes(k.toLowerCase()))
      })
      results.detectionMethod.push('context')
    }
  })

  // 5. 最も可能性の高い店舗を推定
  if (results.detectedStores.length > 0) {
    results.estimatedStore = results.detectedStores
      .sort((a, b) => b.confidence - a.confidence)[0]
  } else if (results.detectedCategories.length > 0) {
    const bestCategory = results.detectedCategories
      .sort((a, b) => b.confidence - a.confidence)[0]
    
    // カテゴリから具体的な店舗を推測
    const storeGuess = guessStoreFromCategory(bestCategory.category)
    if (storeGuess) {
      results.estimatedStore = {
        name: storeGuess,
        category: bestCategory.category,
        confidence: Math.max(50, bestCategory.confidence - 10),
        method: 'category_inference'
      }
    }
  }

  return results
}

// カテゴリから店舗推測
function guessStoreFromCategory(category) {
  const categoryMapping = {
    'ハンバーグ': 'びっくりドンキー',
    'もつ鍋': 'もつ鍋専門店',
    '唐揚げ': '唐揚げ専門店',
    'そば': '富士そば',
    'うどん': 'はなまるうどん',
    'カレー': 'CoCo壱番屋',
    'ラーメン': '日高屋',
    '焼肉': '焼肉ライク',
    '寿司': 'スシロー',
    'SA': 'サービスエリア内レストラン',
    'カフェ': '都内カフェ'
  }
  
  return categoryMapping[category] || null
}

// テスト実行
async function testEnhancedSystem() {
  console.log('🚀 強化版ロケーション検出システムのテスト\n')
  console.log('=' * 60)

  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  const { data: testEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .or('title.ilike.%朝食%,title.ilike.%朝飯%,title.ilike.%昼食%,title.ilike.%夕食%')
    .order('date', { ascending: false })
    .limit(20)

  const testResults = {
    totalTested: testEpisodes.length,
    detected: 0,
    improved: 0,
    categories: {}
  }

  console.log('📊 エピソード別検出結果:\n')

  testEpisodes.forEach((episode, index) => {
    const result = enhancedLocationDetection(episode)
    const episodeNum = result.episode.number || (index + 1)
    
    console.log(`#${episodeNum} ${episode.title.substring(0, 40)}...`)
    
    if (result.estimatedStore) {
      testResults.detected++
      console.log(`  🎯 推定店舗: ${result.estimatedStore.name} (${result.estimatedStore.confidence}%)`)
      console.log(`  📍 検出方法: ${result.detectionMethod.join(', ')}`)
      
      // カテゴリ統計
      const category = result.estimatedStore.category
      testResults.categories[category] = (testResults.categories[category] || 0) + 1
      
    } else if (result.detectedCategories.length > 0) {
      console.log(`  🔍 カテゴリ: ${result.detectedCategories.map(c => c.category).join(', ')}`)
    } else {
      console.log(`  ❌ 検出なし`)
    }
    
    if (result.contextClues.length > 0) {
      console.log(`  💡 コンテキスト: ${result.contextClues[0].implication}`)
    }
    
    console.log()
  })

  // 統計表示
  console.log('=' * 60)
  console.log('📈 強化版システムの成果:\n')
  
  const detectionRate = ((testResults.detected / testResults.totalTested) * 100).toFixed(1)
  console.log(`検出率: ${testResults.detected}/${testResults.totalTested} (${detectionRate}%)`)
  console.log(`前回比: 10.0% → ${detectionRate}% (${(parseFloat(detectionRate) - 10).toFixed(1)}% 改善)`)

  console.log('\n🏪 検出カテゴリ分布:')
  Object.entries(testResults.categories).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}件`)
  })

  console.log('\n💡 主な改善点:')
  console.log('1. ✅ 料理名パターンの追加（ハンバーグ、もつ鍋、唐揚げ）')
  console.log('2. ✅ SA（サービスエリア）の検出')
  console.log('3. ✅ コンテキスト分析（ゲスト情報、雰囲気）')
  console.log('4. ✅ カテゴリから店舗推定ロジック')

  return testResults
}

// メイン実行
async function main() {
  try {
    await testEnhancedSystem()
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  enhancedLocationDetection,
  testEnhancedSystem,
  ENHANCED_LOCATION_DETECTION
}