require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// より具体的な店舗名・ロケーション検出システム
const ENHANCED_LOCATION_PATTERNS = {
  // 朝食系の店舗名パターン（参考サイトから）
  '朝食・カフェ系': {
    patterns: [
      /([あ-ん一-龯A-Za-z\s]+?)[カフェCAFE]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[コーヒー]([^\s]{0,5})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[ベーカリー|パン屋]([^\s]{0,5})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[モーニング]([^\s]{0,5})/gi
    ],
    keywords: [
      'スターバックス', 'スタバ', 'ドトール', 'タリーズ', 'プロント',
      'サンマルクカフェ', 'コメダ珈琲', 'ベローチェ', 'カフェ・ド・クリエ',
      'ルノアール', 'エクセルシオール', 'カフェ・ベローチェ'
    ]
  },

  // 和食・ラーメン系
  'ラーメン・和食系': {
    patterns: [
      /([あ-ん一-龯A-Za-z\s]+?)[ラーメン|らーめん]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[うどん|そば]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[寿司|すし]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[焼肉|やきにく]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[定食|弁当]([^\s]{0,10})/gi
    ],
    keywords: [
      '一蘭', 'すき家', '吉野家', '松屋', 'なか卯', 'はなまるうどん',
      '丸亀製麺', 'かっぱ寿司', 'スシロー', 'はま寿司', '銀だこ'
    ]
  },

  // 洋食・ファストフード系
  '洋食・ファストフード系': {
    patterns: [
      /([あ-ん一-龯A-Za-z\s]+?)[ハンバーガー|バーガー]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[ピザ|PIZZA]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[パスタ|PASTA]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[レストラン|RESTAURANT]([^\s]{0,10})/gi
    ],
    keywords: [
      'マクドナルド', 'マック', 'バーガーキング', 'モスバーガー', 'ロッテリア',
      'ケンタッキー', 'KFC', 'サブウェイ', 'ピザハット', 'ドミノピザ',
      'ガスト', 'サイゼリヤ', 'ジョナサン', 'ロイヤルホスト', 'デニーズ'
    ]
  },

  // コンビニ・小売
  'コンビニ・小売系': {
    patterns: [
      /([あ-ん一-龯A-Za-z\s]+?)[コンビニ|CVS]([^\s]{0,10})/gi,
      /([あ-ん一-龯A-Za-z\s]+?)[スーパー|マーケット]([^\s]{0,10})/gi
    ],
    keywords: [
      'セブンイレブン', '7-Eleven', 'ローソン', 'ファミリーマート', 'ファミマ',
      'ミニストップ', 'セイコーマート', 'イオン', '西友', 'ライフ'
    ]
  }
}

// 地域・エリア特定パターン
const AREA_DETECTION_PATTERNS = {
  // 東京都内の詳細エリア
  '東京23区': {
    '渋谷区': ['渋谷', '原宿', '表参道', '代官山', '恵比寿', '広尾', '松濤'],
    '新宿区': ['新宿', '歌舞伎町', '高田馬場', '四谷', '市ヶ谷', '飯田橋'],
    '港区': ['六本木', '赤坂', '青山', '虎ノ門', '新橋', '田町', '麻布'],
    '中央区': ['銀座', '築地', '月島', '日本橋', '八重洲', '京橋'],
    '千代田区': ['丸の内', '有楽町', '秋葉原', '神田', '大手町', '霞が関'],
    '品川区': ['品川', '五反田', '大崎', '蒲田', '中延'],
    '目黒区': ['恵比寿', '中目黒', '自由が丘', '学芸大学'],
    '世田谷区': ['下北沢', '三軒茶屋', '二子玉川', '成城', '用賀'],
    '豊島区': ['池袋', '巣鴨', '大塚', '駒込'],
    '文京区': ['本郷', '湯島', '後楽園', '茗荷谷']
  },

  // 駅名パターン
  '主要駅': [
    '新宿駅', '渋谷駅', '池袋駅', '東京駅', '品川駅', '上野駅', '秋葉原駅',
    '六本木駅', '表参道駅', '原宿駅', '恵比寿駅', '中目黒駅', '自由が丘駅'
  ],

  // ランドマーク
  'ランドマーク': [
    '東京スカイツリー', '東京タワー', '東京ドーム', 'お台場', '築地市場',
    '豊洲市場', 'アメ横', '上野動物園', '浅草寺', '明治神宮', '皇居',
    'レインボーブリッジ', 'フジテレビ', '国立競技場'
  ]
}

// 画像解析用のヒント抽出
const VISUAL_CONTEXT_PATTERNS = {
  '店舗外観': [
    '外観', '入り口', '看板', 'サイン', 'のれん', '店頭', 'ファサード'
  ],
  '店内': [
    '店内', '内装', 'インテリア', '座席', 'カウンター', 'テーブル', '雰囲気'
  ],
  '料理': [
    'メニュー', '料理', '食べ物', 'ドリンク', '盛り付け', 'プレート', '皿'
  ],
  '周辺環境': [
    '駅前', '商店街', 'ビル', '住宅街', '公園', '川沿い', '海辺'
  ]
}

// 時間・季節コンテキスト
const TEMPORAL_CONTEXT = {
  '時間帯': {
    '朝': ['朝', 'モーニング', '朝食', '朝ごはん', '朝飯', 'AM', '午前'],
    '昼': ['昼', 'ランチ', '昼食', '昼飯', 'PM', '午後', 'デイタイム'],
    '夜': ['夜', 'ディナー', '夕食', '夜ご飯', '夜飯', '晩飯', '夜中']
  },
  '季節': {
    '春': ['春', '桜', '花見', '暖かい', 'さくら'],
    '夏': ['夏', '暑い', '海', 'プール', '祭り', 'かき氷'],
    '秋': ['秋', '紅葉', 'もみじ', '涼しい', '栗'],
    '冬': ['冬', '寒い', '雪', 'クリスマス', '年末', '正月']
  }
}

// 強化されたロケーション検出関数
function enhancedLocationDetection(title, description, videoUrl = '', thumbnailUrl = '') {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    detectedStores: [],
    detectedAreas: [],
    detectedLandmarks: [],
    visualHints: [],
    temporalContext: {},
    searchableQueries: [],
    confidence: 0,
    specificityLevel: 'low', // low, medium, high
    investigationPriority: 0 // 0-100
  }

  // 1. 具体的な店舗名検出
  Object.entries(ENHANCED_LOCATION_PATTERNS).forEach(([category, data]) => {
    // キーワードベース検出
    data.keywords.forEach(keyword => {
      if (combinedText.includes(keyword.toLowerCase())) {
        results.detectedStores.push({
          name: keyword,
          category: category,
          confidence: 85,
          detectionMethod: 'keyword',
          searchQuery: `${keyword} 店舗 場所`
        })
      }
    })

    // パターンベース検出
    data.patterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combinedText)) !== null) {
        const storeName = match[0].trim()
        if (storeName.length > 2) {
          results.detectedStores.push({
            name: storeName,
            category: category,
            confidence: 60,
            detectionMethod: 'pattern',
            searchQuery: `${storeName} ${category} 店舗`
          })
        }
      }
    })
  })

  // 2. エリア・地域検出
  Object.entries(AREA_DETECTION_PATTERNS['東京23区']).forEach(([ward, areas]) => {
    areas.forEach(area => {
      if (combinedText.includes(area)) {
        results.detectedAreas.push({
          area: area,
          ward: ward,
          type: '地域',
          confidence: 80,
          searchQuery: `${area} ${ward} グルメ レストラン`
        })
      }
    })
  })

  // 主要駅検出
  AREA_DETECTION_PATTERNS['主要駅'].forEach(station => {
    if (combinedText.includes(station.toLowerCase().replace('駅', ''))) {
      results.detectedAreas.push({
        area: station,
        type: '駅',
        confidence: 90,
        searchQuery: `${station} 周辺 グルメ`
      })
    }
  })

  // 3. ランドマーク検出
  AREA_DETECTION_PATTERNS['ランドマーク'].forEach(landmark => {
    if (combinedText.includes(landmark.toLowerCase())) {
      results.detectedLandmarks.push({
        name: landmark,
        type: 'ランドマーク',
        confidence: 95,
        searchQuery: `${landmark} 周辺 レストラン`
      })
    }
  })

  // 4. 視覚的コンテキスト検出
  Object.entries(VISUAL_CONTEXT_PATTERNS).forEach(([contextType, keywords]) => {
    keywords.forEach(keyword => {
      if (combinedText.includes(keyword)) {
        results.visualHints.push({
          type: contextType,
          keyword: keyword,
          hint: `動画内で${keyword}が映っている可能性`
        })
      }
    })
  })

  // 5. 時間・季節コンテキスト
  Object.entries(TEMPORAL_CONTEXT).forEach(([contextType, timeData]) => {
    Object.entries(timeData).forEach(([timeName, keywords]) => {
      keywords.forEach(keyword => {
        if (combinedText.includes(keyword)) {
          if (!results.temporalContext[contextType]) {
            results.temporalContext[contextType] = []
          }
          results.temporalContext[contextType].push(timeName)
        }
      })
    })
  })

  // 6. 検索可能クエリ生成
  results.searchableQueries = generateSearchQueries(results, title, description)

  // 7. 信頼度と特定度計算
  results.confidence = calculateEnhancedConfidence(results)
  results.specificityLevel = determineSpecificityLevel(results)
  results.investigationPriority = calculateInvestigationPriority(results, title)

  return results
}

// 検索クエリ生成
function generateSearchQueries(results, title, description) {
  const queries = []

  // 基本クエリ
  if (results.detectedStores.length > 0) {
    results.detectedStores.forEach(store => {
      queries.push({
        query: store.searchQuery,
        type: '店舗特定',
        priority: 'high',
        expectedResults: '店舗住所、営業時間、メニュー'
      })
    })
  }

  // エリアベースクエリ
  if (results.detectedAreas.length > 0) {
    results.detectedAreas.forEach(area => {
      queries.push({
        query: area.searchQuery,
        type: 'エリア特定',
        priority: 'medium',
        expectedResults: '周辺店舗リスト'
      })
    })
  }

  // 動画特定クエリ
  const videoTitle = title.replace(/[#\[\]【】!!]/g, '').trim()
  if (videoTitle.length > 5) {
    queries.push({
      query: `よにのちゃんねる "${videoTitle}" 店舗 場所`,
      type: '動画特定',
      priority: 'high',
      expectedResults: 'ファンによる店舗特定情報'
    })
  }

  return queries.slice(0, 5) // 上位5件に限定
}

// 強化された信頼度計算
function calculateEnhancedConfidence(results) {
  let baseScore = 0

  // 店舗検出スコア
  if (results.detectedStores.length > 0) {
    const avgStoreConfidence = results.detectedStores.reduce((sum, store) => sum + store.confidence, 0) / results.detectedStores.length
    baseScore += avgStoreConfidence * 0.5
  }

  // エリア検出スコア
  if (results.detectedAreas.length > 0) {
    const avgAreaConfidence = results.detectedAreas.reduce((sum, area) => sum + area.confidence, 0) / results.detectedAreas.length
    baseScore += avgAreaConfidence * 0.3
  }

  // ランドマーク検出スコア
  if (results.detectedLandmarks.length > 0) {
    baseScore += 20
  }

  // 視覚的ヒントスコア
  baseScore += Math.min(results.visualHints.length * 3, 15)

  // 時間コンテキストスコア
  Object.keys(results.temporalContext).forEach(() => {
    baseScore += 5
  })

  return Math.min(Math.round(baseScore), 100)
}

// 特定度レベル判定
function determineSpecificityLevel(results) {
  const storeCount = results.detectedStores.length
  const areaCount = results.detectedAreas.length
  const landmarkCount = results.detectedLandmarks.length

  if (storeCount >= 2 || (storeCount >= 1 && areaCount >= 1)) {
    return 'high'
  } else if (storeCount >= 1 || areaCount >= 2 || landmarkCount >= 1) {
    return 'medium'
  } else {
    return 'low'
  }
}

// 調査優先度計算
function calculateInvestigationPriority(results, title) {
  let priority = 0

  // 朝食・昼食・夕食キーワードがある場合は高優先度
  if (/朝食|昼食|夕食|朝飯|昼飯|夜飯|ランチ/.test(title)) {
    priority += 40
  }

  // 具体的な店舗名がある場合
  priority += results.detectedStores.length * 20

  // エリア情報がある場合
  priority += results.detectedAreas.length * 10

  // 視覚的ヒントがある場合
  priority += results.visualHints.length * 5

  return Math.min(priority, 100)
}

// エピソード分析実行
async function runEnhancedLocationAnalysis() {
  console.log('🔍 強化ロケーション検出システム実行開始\n')

  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
    .single()

  // 朝食・食事関連エピソードを優先的に取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .or('title.ilike.%朝食%,title.ilike.%朝飯%,title.ilike.%ランチ%,title.ilike.%夕食%,title.ilike.%食事%')
    .order('date', { ascending: false })
    .limit(20)

  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }

  console.log(`📺 食事関連エピソード分析: ${episodes.length}件\n`)

  const analysisResults = []

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    console.log(`\n🔍 分析中 (${i + 1}/${episodes.length}): ${episode.title}`)

    const analysis = enhancedLocationDetection(
      episode.title || '',
      episode.description || '',
      episode.video_url || '',
      episode.thumbnail_url || ''
    )

    console.log(`  📊 信頼度: ${analysis.confidence}% | 特定度: ${analysis.specificityLevel} | 調査優先度: ${analysis.investigationPriority}`)

    if (analysis.detectedStores.length > 0) {
      console.log(`  🏪 検出店舗 (${analysis.detectedStores.length}件):`)
      analysis.detectedStores.forEach(store => {
        console.log(`    - ${store.name} (${store.category}) [${store.confidence}%]`)
      })
    }

    if (analysis.detectedAreas.length > 0) {
      console.log(`  📍 検出エリア (${analysis.detectedAreas.length}件):`)
      analysis.detectedAreas.forEach(area => {
        console.log(`    - ${area.area} (${area.type}) [${area.confidence}%]`)
      })
    }

    if (analysis.searchableQueries.length > 0) {
      console.log(`  🔎 推奨検索クエリ:`)
      analysis.searchableQueries.slice(0, 2).forEach(query => {
        console.log(`    - "${query.query}" (${query.type})`)
      })
    }

    analysisResults.push({
      episode: episode,
      analysis: analysis
    })
  }

  // 高優先度案件の表示
  console.log('\n📋 調査優先度 HIGH 案件:')
  const highPriorityResults = analysisResults
    .filter(result => result.analysis.investigationPriority >= 70)
    .sort((a, b) => b.analysis.investigationPriority - a.analysis.investigationPriority)

  highPriorityResults.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.episode.title}`)
    console.log(`   優先度: ${result.analysis.investigationPriority} | 信頼度: ${result.analysis.confidence}%`)
    console.log(`   検出内容: ${result.analysis.detectedStores.map(s => s.name).join(', ')}`)
    if (result.analysis.searchableQueries.length > 0) {
      console.log(`   推奨調査: "${result.analysis.searchableQueries[0].query}"`)
    }
  })

  return analysisResults
}

// メイン実行
async function main() {
  try {
    const results = await runEnhancedLocationAnalysis()
    console.log('\n🎉 強化ロケーション検出システム分析完了!')
    console.log(`📊 総分析件数: ${results.length}件`)
    console.log(`🎯 高優先度案件: ${results.filter(r => r.analysis.investigationPriority >= 70).length}件`)
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  enhancedLocationDetection,
  runEnhancedLocationAnalysis,
  ENHANCED_LOCATION_PATTERNS,
  generateSearchQueries
}