require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// より実用的なロケーション検出システム（参考サイトの手法を参考に）
const PRACTICAL_LOCATION_DETECTION = {
  // 実際の有名チェーン店（確実に場所が特定できるもの）
  definiteStores: [
    // 回転寿司
    { name: 'スシロー', category: '回転寿司', confidence: 95 },
    { name: 'はま寿司', category: '回転寿司', confidence: 95 },
    { name: 'かっぱ寿司', category: '回転寿司', confidence: 95 },
    
    // ファストフード
    { name: 'マクドナルド', category: 'ファストフード', confidence: 95 },
    { name: 'マック', category: 'ファストフード', confidence: 90 },
    { name: 'すき家', category: '牛丼チェーン', confidence: 95 },
    { name: '松屋', category: '牛丼チェーン', confidence: 95 },
    { name: '吉野家', category: '牛丼チェーン', confidence: 95 },
    
    // カフェ
    { name: 'スターバックス', category: 'カフェ', confidence: 95 },
    { name: 'スタバ', category: 'カフェ', confidence: 90 },
    { name: 'ドトール', category: 'カフェ', confidence: 95 },
    { name: 'コメダ珈琲', category: 'カフェ', confidence: 95 },
    
    // ファミレス
    { name: 'ガスト', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'サイゼリヤ', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'ジョナサン', category: 'ファミリーレストラン', confidence: 95 },
    { name: 'デニーズ', category: 'ファミリーレストラン', confidence: 95 }
  ],

  // 地域・エリア（よにのちゃんねるで頻出）
  areas: [
    { name: '東京', type: '都道府県', confidence: 85 },
    { name: '渋谷', type: '区域', confidence: 90 },
    { name: '新宿', type: '区域', confidence: 90 },
    { name: '原宿', type: '区域', confidence: 90 },
    { name: '六本木', type: '区域', confidence: 90 },
    { name: '福岡', type: '都道府県', confidence: 85 },
    { name: '鎌倉', type: '市', confidence: 85 }
  ],

  // 食事系キーワード（コンテキスト判定用）
  mealContext: [
    '朝食', '朝飯', '朝ごはん', 'モーニング',
    'ランチ', '昼食', '昼飯',
    '夕食', '夜飯', '晩飯', 'ディナー'
  ],

  // 購入・訪問キーワード
  visitContext: [
    '行った', '行って', '食べに', '買いに', '訪問', '来店'
  ]
}

// シンプルで精度の高いロケーション検出
function detectPracticalLocation(title, description) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    detectedStores: [],
    detectedAreas: [],
    mealContext: null,
    hasVisitContext: false,
    overallConfidence: 0,
    investigationValue: 0,
    practicalInfo: {
      likelyStore: null,
      likelyArea: null,
      searchRecommendations: []
    }
  }

  // 1. 確実な店舗名検出
  PRACTICAL_LOCATION_DETECTION.definiteStores.forEach(store => {
    if (combinedText.includes(store.name.toLowerCase())) {
      results.detectedStores.push({
        ...store,
        originalText: store.name,
        contextMatch: true
      })
    }
  })

  // 2. エリア検出
  PRACTICAL_LOCATION_DETECTION.areas.forEach(area => {
    if (combinedText.includes(area.name.toLowerCase())) {
      results.detectedAreas.push({
        ...area,
        originalText: area.name
      })
    }
  })

  // 3. 食事コンテキスト検出
  const mealMatch = PRACTICAL_LOCATION_DETECTION.mealContext.find(meal =>
    combinedText.includes(meal.toLowerCase())
  )
  if (mealMatch) {
    results.mealContext = mealMatch
  }

  // 4. 訪問コンテキスト検出
  results.hasVisitContext = PRACTICAL_LOCATION_DETECTION.visitContext.some(visit =>
    combinedText.includes(visit.toLowerCase())
  )

  // 5. 最も可能性の高い店舗・エリアを特定
  if (results.detectedStores.length > 0) {
    results.practicalInfo.likelyStore = results.detectedStores
      .sort((a, b) => b.confidence - a.confidence)[0]
  }

  if (results.detectedAreas.length > 0) {
    results.practicalInfo.likelyArea = results.detectedAreas
      .sort((a, b) => b.confidence - a.confidence)[0]
  }

  // 6. 検索推奨事項生成
  results.practicalInfo.searchRecommendations = generatePracticalSearches(
    results, title, description
  )

  // 7. 総合評価
  results.overallConfidence = calculatePracticalConfidence(results)
  results.investigationValue = calculateInvestigationValue(results, title)

  return results
}

// 実用的な検索推奨生成
function generatePracticalSearches(results, title, description) {
  const searches = []

  // 確実な店舗がある場合
  if (results.practicalInfo.likelyStore) {
    const store = results.practicalInfo.likelyStore
    searches.push({
      query: `よにのちゃんねる ${title.replace(/[#\[\]【】!!]/g, '').trim()} ${store.name}`,
      priority: 'high',
      type: '動画特定',
      expectedResult: `${store.name}の具体的な店舗場所`
    })

    // エリアと組み合わせ
    if (results.practicalInfo.likelyArea) {
      searches.push({
        query: `${results.practicalInfo.likelyArea.name} ${store.name} 店舗`,
        priority: 'medium',
        type: '店舗絞り込み',
        expectedResult: '該当エリアの店舗リスト'
      })
    }
  }

  // ファン調査系検索
  if (results.mealContext) {
    searches.push({
      query: `よにのちゃんねる ${results.mealContext} 店舗 聖地`,
      priority: 'medium',
      type: 'ファン情報',
      expectedResult: 'ファンによる店舗特定情報'
    })
  }

  // 一般的な検索（ブログなど）
  const cleanTitle = title.replace(/[#\[\]【】!!]/g, '').trim()
  if (cleanTitle.length > 10) {
    searches.push({
      query: `"${cleanTitle}" 店舗 場所 ロケ地`,
      priority: 'low',
      type: '一般検索',
      expectedResult: 'ブログやまとめサイトの情報'
    })
  }

  return searches.slice(0, 3) // 上位3件
}

// 実用的信頼度計算
function calculatePracticalConfidence(results) {
  let confidence = 0

  // 確実な店舗名がある = 高信頼度
  if (results.detectedStores.length > 0) {
    const maxStoreConfidence = Math.max(...results.detectedStores.map(s => s.confidence))
    confidence += maxStoreConfidence * 0.6
  }

  // エリア情報がある
  if (results.detectedAreas.length > 0) {
    const maxAreaConfidence = Math.max(...results.detectedAreas.map(a => a.confidence))
    confidence += maxAreaConfidence * 0.3
  }

  // 食事コンテキストがある
  if (results.mealContext) {
    confidence += 15
  }

  // 訪問コンテキストがある
  if (results.hasVisitContext) {
    confidence += 10
  }

  return Math.min(Math.round(confidence), 100)
}

// 調査価値計算
function calculateInvestigationValue(results, title) {
  let value = 0

  // 朝食・昼食・夕食系は高価値
  if (results.mealContext) {
    value += 40
  }

  // 確実な店舗名がある
  if (results.detectedStores.length > 0) {
    value += 30
  }

  // エリア情報がある
  if (results.detectedAreas.length > 0) {
    value += 20
  }

  // タイトルに食事関連キーワード
  if (/朝食|昼食|夕食|ランチ|朝飯|夜飯/.test(title)) {
    value += 15
  }

  return Math.min(value, 100)
}

// メイン分析関数
async function runPracticalLocationAnalysis() {
  console.log('🎯 実用的ロケーション検出システム実行開始\n')

  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  // 食事関連エピソードを優先取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .or('title.ilike.%朝食%,title.ilike.%朝飯%,title.ilike.%ランチ%,title.ilike.%昼食%,title.ilike.%夕食%,title.ilike.%夜飯%')
    .order('date', { ascending: false })
    .limit(30)

  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }

  console.log(`📺 食事関連エピソード分析: ${episodes.length}件\n`)

  const results = []
  const detectionSummary = {
    totalAnalyzed: episodes.length,
    storeDetected: 0,
    areaDetected: 0,
    highValueCases: 0,
    storeTypes: {}
  }

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    console.log(`\n🔍 分析中 (${i + 1}/${episodes.length}): ${episode.title}`)

    const analysis = detectPracticalLocation(
      episode.title || '',
      episode.description || ''
    )

    // 結果表示
    console.log(`  📊 信頼度: ${analysis.overallConfidence}% | 調査価値: ${analysis.investigationValue}`)

    if (analysis.practicalInfo.likelyStore) {
      const store = analysis.practicalInfo.likelyStore
      console.log(`  🏪 確実な店舗: ${store.name} (${store.category})`)
      detectionSummary.storeDetected++
      detectionSummary.storeTypes[store.category] = 
        (detectionSummary.storeTypes[store.category] || 0) + 1
    }

    if (analysis.practicalInfo.likelyArea) {
      console.log(`  📍 エリア: ${analysis.practicalInfo.likelyArea.name}`)
      detectionSummary.areaDetected++
    }

    if (analysis.mealContext) {
      console.log(`  🍽️  食事種別: ${analysis.mealContext}`)
    }

    if (analysis.investigationValue >= 70) {
      detectionSummary.highValueCases++
      console.log(`  🎯 高価値案件: 調査推奨`)
    }

    results.push({
      episode: episode,
      analysis: analysis
    })
  }

  // サマリー表示
  console.log('\n📈 実用的ロケーション検出 サマリー')
  console.log('=' * 50)
  console.log(`総分析件数: ${detectionSummary.totalAnalyzed}件`)
  console.log(`店舗検出: ${detectionSummary.storeDetected}件 (${((detectionSummary.storeDetected / detectionSummary.totalAnalyzed) * 100).toFixed(1)}%)`)
  console.log(`エリア検出: ${detectionSummary.areaDetected}件 (${((detectionSummary.areaDetected / detectionSummary.totalAnalyzed) * 100).toFixed(1)}%)`)
  console.log(`高価値案件: ${detectionSummary.highValueCases}件`)

  // 店舗タイプ別統計
  if (Object.keys(detectionSummary.storeTypes).length > 0) {
    console.log('\n🏪 検出店舗タイプ:')
    Object.entries(detectionSummary.storeTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}件`)
    })
  }

  // 調査推奨案件
  const highValueCases = results
    .filter(r => r.analysis.investigationValue >= 70)
    .sort((a, b) => b.analysis.investigationValue - a.analysis.investigationValue)

  if (highValueCases.length > 0) {
    console.log('\n🎯 調査推奨案件 TOP5:')
    highValueCases.slice(0, 5).forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.episode.title}`)
      console.log(`   価値: ${result.analysis.investigationValue} | 信頼度: ${result.analysis.overallConfidence}%`)
      
      if (result.analysis.practicalInfo.likelyStore) {
        console.log(`   確実店舗: ${result.analysis.practicalInfo.likelyStore.name}`)
      }
      
      if (result.analysis.practicalInfo.searchRecommendations.length > 0) {
        const topSearch = result.analysis.practicalInfo.searchRecommendations[0]
        console.log(`   推奨検索: "${topSearch.query}"`)
        console.log(`   期待結果: ${topSearch.expectedResult}`)
      }
    })
  }

  return results
}

// メイン実行
async function main() {
  try {
    const results = await runPracticalLocationAnalysis()
    console.log('\n🎉 実用的ロケーション検出完了!')
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  detectPracticalLocation,
  runPracticalLocationAnalysis,
  PRACTICAL_LOCATION_DETECTION
}