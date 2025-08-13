require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

// 高精度ロケーション抽出システム
const LOCATION_DATABASE = {
  // 都道府県・主要都市
  '都道府県・都市': {
    '東京': {
      keywords: ['東京', '首都', '渋谷', '新宿', '池袋', '原宿', '表参道', '六本木', '銀座', '代官山', '恵比寿'],
      type: '都道府県',
      region: '関東',
      coordinate: { lat: 35.6762, lng: 139.6503 }
    },
    '大阪': {
      keywords: ['大阪', '関西', '梅田', '難波', '心斎橋', '天王寺'],
      type: '都道府県',
      region: '関西',
      coordinate: { lat: 34.6937, lng: 135.5023 }
    },
    '福岡': {
      keywords: ['福岡', '九州', '天神', '博多', '中洲'],
      type: '都道府県',
      region: '九州',
      coordinate: { lat: 33.5904, lng: 130.4017 }
    },
    '横浜': {
      keywords: ['横浜', 'みなとみらい', '中華街', '赤レンガ'],
      type: '市',
      region: '関東',
      coordinate: { lat: 35.4437, lng: 139.6380 }
    },
    '鎌倉': {
      keywords: ['鎌倉', '江の島', '湘南'],
      type: '市',
      region: '関東',
      coordinate: { lat: 35.3195, lng: 139.5484 }
    },
    '軽井沢': {
      keywords: ['軽井沢', 'リゾート'],
      type: '町',
      region: '甲信越',
      coordinate: { lat: 36.3576, lng: 138.6329 }
    }
  },

  // 特定スポット・施設
  '観光スポット': {
    'スカイツリー': {
      keywords: ['スカイツリー', '東京スカイツリー', 'SKYTREE'],
      type: '観光地',
      region: '関東',
      address: '東京都墨田区',
      coordinate: { lat: 35.7101, lng: 139.8107 }
    },
    '東京ドーム': {
      keywords: ['東京ドーム', 'ドーム', '後楽園'],
      type: 'エンターテインメント',
      region: '関東',
      address: '東京都文京区',
      coordinate: { lat: 35.7056, lng: 139.7519 }
    },
    'ディズニーランド': {
      keywords: ['ディズニー', 'ディズニーランド', 'TDL', '舞浜'],
      type: 'テーマパーク',
      region: '関東',
      address: '千葉県浦安市',
      coordinate: { lat: 35.6327, lng: 139.8804 }
    },
    'USJ': {
      keywords: ['USJ', 'ユニバ', 'ユニバーサル', 'ユニバーサルスタジオ'],
      type: 'テーマパーク',
      region: '関西',
      address: '大阪府大阪市',
      coordinate: { lat: 34.6658, lng: 135.4348 }
    },
    '築地': {
      keywords: ['築地', '豊洲', '市場'],
      type: '市場・グルメスポット',
      region: '関東',
      address: '東京都中央区',
      coordinate: { lat: 35.6654, lng: 139.7706 }
    }
  },

  // 店舗タイプ
  '店舗・施設': {
    'カフェ': {
      keywords: ['カフェ', 'コーヒー', 'スタバ', 'スターバックス', 'ドトール', 'タリーズ'],
      type: '飲食店',
      category: 'カフェ・喫茶店'
    },
    'レストラン': {
      keywords: ['レストラン', 'ファミレス', 'ガスト', 'サイゼ', 'ジョナサン'],
      type: '飲食店',
      category: 'レストラン'
    },
    'ファストフード': {
      keywords: ['マック', 'マクドナルド', 'バーガーキング', 'モス', 'ロッテリア'],
      type: '飲食店',
      category: 'ファストフード'
    },
    'コンビニ': {
      keywords: ['コンビニ', 'セブン', 'ローソン', 'ファミマ', 'ファミリーマート'],
      type: '小売店',
      category: 'コンビニエンスストア'
    },
    'ホテル': {
      keywords: ['ホテル', '宿泊', 'リゾート', '温泉'],
      type: '宿泊施設',
      category: 'ホテル・旅館'
    },
    'ショッピング': {
      keywords: ['デパート', 'モール', 'ショッピングセンター', '百貨店', 'イオン'],
      type: '商業施設',
      category: 'ショッピング'
    },
    'スタジオ': {
      keywords: ['スタジオ', '撮影', '収録', 'テレビ局'],
      type: '業務施設',
      category: 'メディア・撮影'
    }
  }
}

// コンテキスト分析パターン
const LOCATION_CONTEXT_PATTERNS = {
  '訪問目的': {
    '食事': ['朝食', '朝飯', 'ランチ', '昼食', '夕食', '夜飯', '食事', '飯'],
    '買い物': ['買い物', 'ショッピング', '購入'],
    '遊び': ['遊び', 'デート', 'お出かけ'],
    '仕事': ['仕事', '撮影', '収録', '会議'],
    '旅行': ['旅行', '旅', '観光', 'ドライブ']
  },
  
  '移動手段': {
    'ドライブ': ['ドライブ', '車', '運転', '移動'],
    '電車': ['電車', '地下鉄', 'JR', '私鉄'],
    '徒歩': ['歩き', '散歩', 'ウォーキング']
  },
  
  '時間帯': {
    '朝': ['朝', '朝食', 'モーニング'],
    '昼': ['昼', 'ランチ', '午後'],
    '夜': ['夜', '夕方', 'ディナー', '夜飯']
  }
}

// 高精度ロケーション検出関数
function detectLocationInfo(title, description) {
  const combinedText = `${title} ${description}`.toLowerCase()
  const results = {
    detectedLocations: [],
    contexts: [],
    visitPurpose: null,
    transportMethod: null,
    timeOfDay: null,
    confidence: 0,
    locationDetails: {}
  }

  // 1. 基本ロケーション検出
  Object.entries(LOCATION_DATABASE).forEach(([categoryName, locations]) => {
    Object.entries(locations).forEach(([locationName, locationData]) => {
      const matches = locationData.keywords.filter(keyword =>
        combinedText.includes(keyword.toLowerCase())
      )

      if (matches.length > 0) {
        results.detectedLocations.push({
          name: locationName,
          category: categoryName,
          type: locationData.type,
          region: locationData.region,
          keywords: matches,
          confidence: calculateLocationConfidence(matches, combinedText, locationName),
          coordinate: locationData.coordinate,
          address: locationData.address
        })
      }
    })
  })

  // 2. コンテキスト分析
  Object.entries(LOCATION_CONTEXT_PATTERNS).forEach(([contextType, patterns]) => {
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

        // 特定のコンテキストを抽出
        if (contextType === '訪問目的' && !results.visitPurpose) {
          results.visitPurpose = contextName
        } else if (contextType === '移動手段' && !results.transportMethod) {
          results.transportMethod = contextName
        } else if (contextType === '時間帯' && !results.timeOfDay) {
          results.timeOfDay = contextName
        }
      }
    })
  })

  // 3. 特別パターン検出
  results.detectedLocations = results.detectedLocations.concat(
    detectSpecialLocationPatterns(title, description)
  )

  // 4. 総合信頼度計算
  results.confidence = calculateLocationOverallConfidence(results)

  // 5. 詳細情報構築
  results.locationDetails = buildLocationDetails(results, title, description)

  return results
}

// ロケーション信頼度計算
function calculateLocationConfidence(matches, text, locationName) {
  let confidence = matches.length * 25 // 基礎スコア

  // 複数キーワードがマッチした場合はボーナス
  if (matches.length > 1) {
    confidence += 20
  }

  // タイトルに含まれている場合は大幅ボーナス
  const titleLower = text.substring(0, 100).toLowerCase()
  if (matches.some(match => titleLower.includes(match.toLowerCase()))) {
    confidence += 30
  }

  // 具体的な地名の場合はボーナス
  if (['東京', '大阪', '福岡', '横浜'].includes(locationName)) {
    confidence += 15
  }

  return Math.min(confidence, 100)
}

// 特別パターン検出（住所、駅名など）
function detectSpecialLocationPatterns(title, description) {
  const specialLocations = []
  const combinedText = `${title} ${description}`

  // 駅名パターン（○○駅）
  const stationPattern = /([あ-ん一-龯]{1,10}?)駅/g
  let stationMatch
  while ((stationMatch = stationPattern.exec(combinedText)) !== null) {
    specialLocations.push({
      name: stationMatch[1] + '駅',
      category: '交通機関',
      type: '駅',
      keywords: [stationMatch[0]],
      confidence: 60,
      detectedFrom: 'pattern'
    })
  }

  // ○○店、○○館パターン
  const storePattern = /([あ-ん一-龯A-Za-z]{2,15}?)[店館]/g
  let storeMatch
  while ((storeMatch = storePattern.exec(combinedText)) !== null) {
    specialLocations.push({
      name: storeMatch[0],
      category: '店舗・施設',
      type: '店舗',
      keywords: [storeMatch[0]],
      confidence: 45,
      detectedFrom: 'pattern'
    })
  }

  return specialLocations
}

// 総合信頼度計算
function calculateLocationOverallConfidence(results) {
  if (results.detectedLocations.length === 0) return 0

  let totalScore = results.detectedLocations.reduce((sum, loc) => sum + loc.confidence, 0)
  let avgConfidence = totalScore / results.detectedLocations.length

  // コンテキスト情報があれば信頼度アップ
  if (results.contexts.length > 0) {
    avgConfidence += results.contexts.length * 5
  }

  // 明確な目的があれば信頼度アップ
  if (results.visitPurpose) {
    avgConfidence += 10
  }

  return Math.min(Math.round(avgConfidence), 100)
}

// ロケーション詳細情報構築
function buildLocationDetails(results, title, description) {
  const details = {
    primaryLocation: null,
    locationTypes: [],
    visitSummary: '',
    recommendedItems: [],
    mapCoordinates: []
  }

  if (results.detectedLocations.length === 0) return details

  // 最も信頼度の高いロケーションをプライマリに
  details.primaryLocation = results.detectedLocations
    .sort((a, b) => b.confidence - a.confidence)[0]

  // ロケーションタイプ集計
  const typeCount = {}
  results.detectedLocations.forEach(loc => {
    if (loc.type) {
      typeCount[loc.type] = (typeCount[loc.type] || 0) + 1
      if (!details.locationTypes.includes(loc.type)) {
        details.locationTypes.push(loc.type)
      }
    }
  })

  // 座標情報収集
  results.detectedLocations
    .filter(loc => loc.coordinate)
    .forEach(loc => {
      details.mapCoordinates.push({
        name: loc.name,
        lat: loc.coordinate.lat,
        lng: loc.coordinate.lng
      })
    })

  // 訪問サマリー生成
  let summary = ''
  if (details.primaryLocation) {
    summary = `${details.primaryLocation.name}`
    
    if (results.visitPurpose) {
      summary += `で${results.visitPurpose}`
    }
    
    if (results.transportMethod) {
      summary += `（${results.transportMethod}）`
    }
  }
  details.visitSummary = summary

  // おすすめアイテム推定
  if (results.visitPurpose === '食事') {
    details.recommendedItems = ['料理写真', 'メニュー', '店内の様子']
  } else if (results.visitPurpose === '買い物') {
    details.recommendedItems = ['購入品', 'ショッピングバッグ', 'ファッション']
  } else if (results.visitPurpose === '旅行') {
    details.recommendedItems = ['風景写真', '観光地', 'お土産']
  }

  return details
}

// エピソード分析実行
async function analyzeEpisodeLocations() {
  console.log('📍 高精度ロケーション抽出システム実行開始\n')

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
    .limit(100) // 最新100件を分析

  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }

  console.log(`📺 分析対象: 最新${episodes.length}件のエピソード\n`)

  const analysisResults = {
    totalAnalyzed: episodes.length,
    locationsDetected: 0,
    highConfidenceLocations: 0,
    locationDistribution: {},
    regionDistribution: {},
    purposeDistribution: {},
    detailedResults: []
  }

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    
    console.log(`\n📍 分析中 (${i + 1}/${episodes.length}): ${episode.title}`)

    // ロケーション検出実行
    const locationAnalysis = detectLocationInfo(
      episode.title || '',
      episode.description || ''
    )

    if (locationAnalysis.detectedLocations.length > 0) {
      analysisResults.locationsDetected++

      if (locationAnalysis.confidence >= 70) {
        analysisResults.highConfidenceLocations++
      }

      // 分布集計
      locationAnalysis.detectedLocations.forEach(loc => {
        // ロケーション分布
        analysisResults.locationDistribution[loc.name] = 
          (analysisResults.locationDistribution[loc.name] || 0) + 1

        // 地域分布
        if (loc.region) {
          analysisResults.regionDistribution[loc.region] = 
            (analysisResults.regionDistribution[loc.region] || 0) + 1
        }
      })

      // 目的分布
      if (locationAnalysis.visitPurpose) {
        analysisResults.purposeDistribution[locationAnalysis.visitPurpose] = 
          (analysisResults.purposeDistribution[locationAnalysis.visitPurpose] || 0) + 1
      }

      // 詳細結果保存
      analysisResults.detailedResults.push({
        episodeId: episode.id,
        title: episode.title,
        date: episode.date,
        analysis: locationAnalysis
      })

      console.log(`  ✅ ロケーション検出: ${locationAnalysis.detectedLocations.length}件 (信頼度: ${locationAnalysis.confidence}%)`)
      locationAnalysis.detectedLocations.forEach(loc => {
        console.log(`    - ${loc.name} (${loc.type}) ${loc.confidence}%`)
      })

      if (locationAnalysis.visitPurpose) {
        console.log(`  🎯 訪問目的: ${locationAnalysis.visitPurpose}`)
      }

      if (locationAnalysis.locationDetails.visitSummary) {
        console.log(`  📝 サマリー: ${locationAnalysis.locationDetails.visitSummary}`)
      }

    } else {
      console.log('  ⚪ ロケーション検出なし')
    }
  }

  return analysisResults
}

// 結果レポート生成
function generateLocationReport(results) {
  console.log('\n📊 高精度ロケーション抽出 分析レポート')
  console.log('=' * 60)

  console.log(`\n📈 検出統計:`)
  console.log(`  総分析エピソード数: ${results.totalAnalyzed}件`)
  console.log(`  ロケーション検出エピソード: ${results.locationsDetected}件 (${((results.locationsDetected / results.totalAnalyzed) * 100).toFixed(1)}%)`)
  console.log(`  高信頼度検出: ${results.highConfidenceLocations}件 (${((results.highConfidenceLocations / results.totalAnalyzed) * 100).toFixed(1)}%)`)

  console.log(`\n📍 人気ロケーション TOP10:`)
  const sortedLocations = Object.entries(results.locationDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)

  sortedLocations.forEach(([location, count], index) => {
    console.log(`  ${index + 1}. ${location}: ${count}回`)
  })

  console.log(`\n🗾 地域別分布:`)
  const sortedRegions = Object.entries(results.regionDistribution)
    .sort(([,a], [,b]) => b - a)

  sortedRegions.forEach(([region, count]) => {
    console.log(`  ${region}: ${count}件`)
  })

  console.log(`\n🎯 訪問目的別分布:`)
  const sortedPurposes = Object.entries(results.purposeDistribution)
    .sort(([,a], [,b]) => b - a)

  sortedPurposes.forEach(([purpose, count]) => {
    console.log(`  ${purpose}: ${count}件`)
  })

  console.log(`\n🌟 高信頼度検出例:`)
  const highConfidenceExamples = results.detailedResults
    .filter(result => result.analysis.confidence >= 70)
    .slice(0, 5)

  highConfidenceExamples.forEach((example, index) => {
    console.log(`\n${index + 1}. ${example.title}`)
    console.log(`   信頼度: ${example.analysis.confidence}%`)
    console.log(`   検出ロケーション: ${example.analysis.detectedLocations.map(loc => loc.name).join(', ')}`)
    if (example.analysis.visitPurpose) {
      console.log(`   訪問目的: ${example.analysis.visitPurpose}`)
    }
    if (example.analysis.locationDetails.visitSummary) {
      console.log(`   サマリー: ${example.analysis.locationDetails.visitSummary}`)
    }
  })
}

// メイン実行
async function main() {
  try {
    const results = await analyzeEpisodeLocations()
    generateLocationReport(results)

    console.log('\n🎉 高精度ロケーション抽出システム分析完了!')

  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = { 
  detectLocationInfo, 
  analyzeEpisodeLocations,
  LOCATION_DATABASE,
  LOCATION_CONTEXT_PATTERNS
}