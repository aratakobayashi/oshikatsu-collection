require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 高精度アイテム検出用の詳細カテゴリ定義
const ADVANCED_ITEM_CATEGORIES = {
  // ファッション - トップス
  'トップス': {
    'Tシャツ': ['Tシャツ', 'T-シャツ', 'ティーシャツ', '半袖', 'カットソー'],
    'シャツ': ['シャツ', 'ブラウス', 'ワイシャツ', '長袖シャツ', 'デニムシャツ'],
    'パーカー': ['パーカー', 'フーディー', 'フード', 'スウェット'],
    'ジャケット': ['ジャケット', 'アウター', 'ブレザー', 'カーディガン'],
    'コート': ['コート', 'トレンチ', 'ダウン', 'モッズコート', 'ピーコート']
  },

  // ファッション - ボトムス
  'ボトムス': {
    'パンツ': ['パンツ', 'ズボン', 'スラックス', 'チノパン'],
    'ジーンズ': ['ジーンズ', 'デニム', 'ジーパン'],
    'スカート': ['スカート', 'ミニスカ', 'ロングスカート'],
    'ショーツ': ['ショーツ', '短パン', 'ハーフパンツ']
  },

  // シューズ
  'シューズ': {
    'スニーカー': ['スニーカー', 'ランニングシューズ', 'バスケットシューズ'],
    'ブーツ': ['ブーツ', 'ロングブーツ', 'ショートブーツ', 'ワークブーツ'],
    'サンダル': ['サンダル', 'ビーチサンダル', 'スポーツサンダル'],
    '革靴': ['革靴', 'ビジネスシューズ', 'ドレスシューズ'],
    'その他靴': ['靴', 'シューズ', 'フラットシューズ', 'ハイヒール']
  },

  // バッグ・小物
  'バッグ': {
    'リュック': ['リュック', 'バックパック', 'リュックサック'],
    'ショルダーバッグ': ['ショルダーバッグ', '斜めがけバッグ', 'メッセンジャーバッグ'],
    'トートバッグ': ['トートバッグ', '手提げバッグ'],
    'ハンドバッグ': ['ハンドバッグ', 'バッグ', 'かばん', 'カバン'],
    '財布': ['財布', 'ウォレット', '長財布', '二つ折り財布']
  },

  // アクセサリー
  'アクセサリー': {
    '帽子': ['帽子', 'キャップ', 'ハット', 'ニット帽', 'ベレー帽'],
    'サングラス': ['サングラス', 'グラス', 'メガネ', '眼鏡'],
    'ネックレス': ['ネックレス', 'チェーン', 'ペンダント'],
    'ピアス': ['ピアス', 'イヤリング', 'イヤーカフ'],
    '指輪': ['指輪', 'リング'],
    'ブレスレット': ['ブレスレット', 'バングル'],
    '時計': ['時計', 'ウォッチ', '腕時計']
  }
}

// ブランド名の詳細マッピング
const BRAND_MAPPING = {
  // ハイブランド
  'ハイブランド': [
    'GUCCI', 'グッチ', 'CHANEL', 'シャネル', 
    'LOUIS VUITTON', 'ルイヴィトン', 'LV',
    'HERMES', 'エルメス', 'PRADA', 'プラダ',
    'DIOR', 'ディオール', 'BALENCIAGA', 'バレンシアガ'
  ],
  
  // スポーツブランド
  'スポーツブランド': [
    'Nike', 'NIKE', 'ナイキ', 'adidas', 'アディダス',
    'PUMA', 'プーマ', 'New Balance', 'ニューバランス',
    'CONVERSE', 'コンバース', 'VANS', 'バンズ'
  ],

  // ファストファッション
  'ファストファッション': [
    'UNIQLO', 'ユニクロ', 'GU', 'ジーユー',
    'ZARA', 'ザラ', 'H&M', 'エイチアンドエム',
    'Forever21', 'フォーエバー21'
  ],

  // ストリートブランド
  'ストリートブランド': [
    'Supreme', 'シュプリーム', 'BAPE', 'ベイプ',
    'OFF-WHITE', 'オフホワイト', 'STUSSY', 'ステューシー'
  ]
}

// コンテキスト分析用パターン
const CONTEXT_PATTERNS = {
  '着用シーン': {
    'お出かけ': ['お出かけ', 'デート', '遊び', '外出'],
    '仕事': ['仕事', '撮影', '収録', 'オフィス'],
    'プライベート': ['プライベート', 'オフ', '家', '自宅'],
    '特別': ['特別', 'イベント', 'パーティー', 'お祝い']
  },
  
  '購入行動': {
    '買い物': ['買い物', '購入', '買った', 'ショッピング', 'GET'],
    'プレゼント': ['プレゼント', 'もらった', 'いただいた', 'ギフト'],
    'お揃い': ['お揃い', 'ペア', 'マッチング', 'リンクコーデ']
  },

  '感想・評価': {
    'お気に入り': ['お気に入り', '気に入った', '愛用', '最高'],
    '新調': ['新調', '新しく', '初めて', 'デビュー'],
    'コーデ': ['コーデ', 'コーディネート', 'ファッション', 'スタイル']
  }
}

// 高精度アイテム検出関数
function detectAdvancedItems(title, description, thumbnailAnalysis = null) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    detectedItems: [],
    brands: [],
    contexts: [],
    confidence: 0,
    itemDetails: {}
  }

  // 1. カテゴリ別アイテム検出
  Object.entries(ADVANCED_ITEM_CATEGORIES).forEach(([mainCategory, subCategories]) => {
    Object.entries(subCategories).forEach(([itemType, keywords]) => {
      const matches = keywords.filter(keyword => 
        combinedText.includes(keyword.toLowerCase())
      )
      
      if (matches.length > 0) {
        results.detectedItems.push({
          mainCategory,
          itemType,
          keywords: matches,
          confidence: calculateItemConfidence(matches, combinedText)
        })
      }
    })
  })

  // 2. ブランド検出
  Object.entries(BRAND_MAPPING).forEach(([brandCategory, brands]) => {
    const matchedBrands = brands.filter(brand =>
      combinedText.includes(brand.toLowerCase())
    )
    
    if (matchedBrands.length > 0) {
      results.brands.push({
        category: brandCategory,
        brands: matchedBrands,
        confidence: calculateBrandConfidence(matchedBrands, combinedText)
      })
    }
  })

  // 3. コンテキスト分析
  Object.entries(CONTEXT_PATTERNS).forEach(([contextType, patterns]) => {
    Object.entries(patterns).forEach(([contextName, keywords]) => {
      const matches = keywords.filter(keyword =>
        combinedText.includes(keyword.toLowerCase())
      )
      
      if (matches.length > 0) {
        results.contexts.push({
          type: contextType,
          context: contextName,
          keywords: matches
        })
      }
    })
  })

  // 4. 総合信頼度計算
  results.confidence = calculateOverallConfidence(results)

  // 5. 詳細情報構築
  results.itemDetails = buildItemDetails(results, title, description)

  return results
}

// アイテム信頼度計算
function calculateItemConfidence(matches, text) {
  let confidence = matches.length * 20 // 基礎スコア
  
  // 複数回言及されている場合はボーナス
  matches.forEach(match => {
    const occurrences = (text.toLowerCase().split(match.toLowerCase()).length - 1)
    confidence += occurrences * 5
  })
  
  // タイトルに含まれている場合はボーナス
  if (text.substring(0, 50).includes(matches[0]?.toLowerCase())) {
    confidence += 15
  }
  
  return Math.min(confidence, 100)
}

// ブランド信頼度計算
function calculateBrandConfidence(brands, text) {
  let confidence = brands.length * 25
  
  brands.forEach(brand => {
    // ブランド名が正確に記載されている場合
    if (text.includes(brand.toLowerCase())) {
      confidence += 20
    }
  })
  
  return Math.min(confidence, 100)
}

// 総合信頼度計算
function calculateOverallConfidence(results) {
  let totalScore = 0
  let factors = 0
  
  if (results.detectedItems.length > 0) {
    totalScore += results.detectedItems.reduce((sum, item) => sum + item.confidence, 0) / results.detectedItems.length
    factors++
  }
  
  if (results.brands.length > 0) {
    totalScore += results.brands.reduce((sum, brand) => sum + brand.confidence, 0) / results.brands.length
    factors++
  }
  
  if (results.contexts.length > 0) {
    totalScore += results.contexts.length * 10
    factors++
  }
  
  return factors > 0 ? Math.round(totalScore / factors) : 0
}

// アイテム詳細情報構築
function buildItemDetails(results, title, description) {
  const details = {
    summary: '',
    categories: [],
    estimatedItems: [],
    shoppingContext: null,
    fashionStyle: null
  }

  // カテゴリ情報整理
  results.detectedItems.forEach(item => {
    if (!details.categories.includes(item.mainCategory)) {
      details.categories.push(item.mainCategory)
    }
    
    details.estimatedItems.push({
      type: item.itemType,
      category: item.mainCategory,
      confidence: item.confidence
    })
  })

  // ショッピングコンテキスト判定
  const shoppingContext = results.contexts.find(ctx => ctx.type === '購入行動')
  if (shoppingContext) {
    details.shoppingContext = shoppingContext.context
  }

  // ファッションスタイル推定
  if (results.brands.length > 0) {
    details.fashionStyle = results.brands[0].category
  }

  // サマリー生成
  if (details.estimatedItems.length > 0) {
    const itemTypes = details.estimatedItems.map(item => item.type).join(', ')
    details.summary = `${itemTypes}に関する内容`
    
    if (details.shoppingContext) {
      details.summary += `（${details.shoppingContext}）`
    }
  }

  return details
}

// エピソード分析実行
async function analyzeEpisodeItems() {
  console.log('🔍 高精度アイテム検出システム実行開始\n')
  
  // よにのちゃんねるのエピソードを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
    .limit(50) // テスト用に最新50件に絞る
  
  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }

  console.log(`📺 分析対象: 最新${episodes.length}件のエピソード\n`)

  const analysisResults = {
    totalAnalyzed: episodes.length,
    itemsDetected: 0,
    highConfidenceItems: 0,
    categoryDistribution: {},
    brandDistribution: {},
    detailedResults: []
  }

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    
    console.log(`\n🔍 分析中 (${i + 1}/${episodes.length}): ${episode.title}`)
    
    // 高精度アイテム検出実行
    const itemAnalysis = detectAdvancedItems(
      episode.title || '', 
      episode.description || ''
    )
    
    if (itemAnalysis.detectedItems.length > 0) {
      analysisResults.itemsDetected++
      
      if (itemAnalysis.confidence >= 70) {
        analysisResults.highConfidenceItems++
      }
      
      // カテゴリ分布更新
      itemAnalysis.detectedItems.forEach(item => {
        const key = `${item.mainCategory}-${item.itemType}`
        analysisResults.categoryDistribution[key] = 
          (analysisResults.categoryDistribution[key] || 0) + 1
      })
      
      // ブランド分布更新
      itemAnalysis.brands.forEach(brand => {
        analysisResults.brandDistribution[brand.category] = 
          (analysisResults.brandDistribution[brand.category] || 0) + 1
      })
      
      // 詳細結果保存
      analysisResults.detailedResults.push({
        episodeId: episode.id,
        title: episode.title,
        date: episode.date,
        analysis: itemAnalysis
      })
      
      console.log(`  ✅ アイテム検出: ${itemAnalysis.detectedItems.length}件 (信頼度: ${itemAnalysis.confidence}%)`)
      itemAnalysis.detectedItems.forEach(item => {
        console.log(`    - ${item.mainCategory}/${item.itemType} (${item.confidence}%)`)
      })
      
      if (itemAnalysis.brands.length > 0) {
        console.log(`  🏷️  ブランド: ${itemAnalysis.brands.map(b => b.brands.join(', ')).join(', ')}`)
      }
    } else {
      console.log('  ⚪ アイテム検出なし')
    }
  }

  return analysisResults
}

// 結果レポート生成
function generateAnalysisReport(results) {
  console.log('\n📊 高精度アイテム検出 分析レポート')
  console.log('=' * 50)
  
  console.log(`\n📈 検出統計:`)
  console.log(`  総分析エピソード数: ${results.totalAnalyzed}件`)
  console.log(`  アイテム検出エピソード: ${results.itemsDetected}件 (${((results.itemsDetected / results.totalAnalyzed) * 100).toFixed(1)}%)`)
  console.log(`  高信頼度検出: ${results.highConfidenceItems}件 (${((results.highConfidenceItems / results.totalAnalyzed) * 100).toFixed(1)}%)`)
  
  console.log(`\n👕 カテゴリ別検出ランキング:`)
  const sortedCategories = Object.entries(results.categoryDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
  
  sortedCategories.forEach(([category, count], index) => {
    console.log(`  ${index + 1}. ${category}: ${count}件`)
  })
  
  console.log(`\n🏷️  ブランド分布:`)
  const sortedBrands = Object.entries(results.brandDistribution)
    .sort(([,a], [,b]) => b - a)
  
  sortedBrands.forEach(([brand, count]) => {
    console.log(`  ${brand}: ${count}件`)
  })
  
  console.log(`\n🎯 高信頼度検出例:`)
  const highConfidenceExamples = results.detailedResults
    .filter(result => result.analysis.confidence >= 70)
    .slice(0, 5)
  
  highConfidenceExamples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.title}`)
    console.log(`   信頼度: ${example.analysis.confidence}%`)
    console.log(`   検出アイテム: ${example.analysis.itemDetails.estimatedItems.map(item => item.type).join(', ')}`)
    if (example.analysis.brands.length > 0) {
      console.log(`   ブランド: ${example.analysis.brands.map(b => b.brands.join(', ')).join(', ')}`)
    }
    if (example.analysis.itemDetails.shoppingContext) {
      console.log(`   コンテキスト: ${example.analysis.itemDetails.shoppingContext}`)
    }
  })
}

// メイン実行
async function main() {
  try {
    const results = await analyzeEpisodeItems()
    generateAnalysisReport(results)
    
    console.log('\n🎉 高精度アイテム検出システム分析完了!')
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  detectAdvancedItems, 
  analyzeEpisodeItems,
  ADVANCED_ITEM_CATEGORIES,
  BRAND_MAPPING,
  CONTEXT_PATTERNS
}