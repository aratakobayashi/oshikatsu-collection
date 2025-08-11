const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// staging環境のSupabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

function generateId() {
  return crypto.randomUUID()
}

function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// ファッションアイテムのカテゴリマッピング（有効なアイテムのみ）
const itemCategories = {
  '帽子': { category: 'アクセサリー', subcategory: '帽子' },
  'キャップ': { category: 'アクセサリー', subcategory: '帽子' },
  'ハット': { category: 'アクセサリー', subcategory: '帽子' },
  'シャツ': { category: 'トップス', subcategory: 'シャツ' },
  'Tシャツ': { category: 'トップス', subcategory: 'Tシャツ' },
  'ジャケット': { category: 'アウター', subcategory: 'ジャケット' },
  'パンツ': { category: 'ボトムス', subcategory: 'パンツ' },
  'スニーカー': { category: 'シューズ', subcategory: 'スニーカー' },
  '靴': { category: 'シューズ', subcategory: 'その他' },
  'バッグ': { category: 'バッグ', subcategory: 'その他' },
  'ネックレス': { category: 'アクセサリー', subcategory: 'ネックレス' },
  'ピアス': { category: 'アクセサリー', subcategory: 'ピアス' },
  '腕時計': { category: 'アクセサリー', subcategory: '腕時計' }
}

// 無効なキーワードの除外リスト
const invalidItemKeywords = [
  '可愛い', 'かわいい', 'かっこいい', 'カッコいい', '素敵', '欲しい', 
  '同じ', 'いい', '良い', 'すごい', 'おしゃれ', 'きれい', '綺麗'
]

const invalidLocationKeywords = [
  'ここ', 'そこ', 'あそこ', 'どこ', 'いつも', 'みんな'
]

// ロケーションのカテゴリマッピング
const locationCategories = {
  'レストラン': 'restaurant',
  'カフェ': 'cafe',
  'ショップ': 'shop',
  '会場': 'venue',
  'スタジオ': 'venue',
  'ホテル': 'hotel',
  '観光地': 'tourist_spot',
  '公園': 'tourist_spot',
  '商業施設': 'shop',
  'デパート': 'shop'
}

// 分析結果から動的にアイテムデータを生成
function generateItemsFromAnalysis(analysis, episode) {
  const items = []
  
  // 高信頼度・中信頼度のアイテムキーワードを抽出（無効キーワード除外）
  const highConfidenceItems = analysis.keywords.items.filter(item => 
    (item.confidence === 'high' || item.confidence === 'medium') &&
    !invalidItemKeywords.includes(item.keyword) &&
    itemCategories[item.keyword] // 有効なカテゴリがあるもののみ
  )
  
  console.log(`🔍 信頼度の高いアイテムキーワード: ${highConfidenceItems.length}件`)
  
  // 重複除去とスコアリング
  const itemMap = new Map()
  
  highConfidenceItems.forEach(item => {
    const key = item.keyword.toLowerCase()
    if (itemMap.has(key)) {
      // 既存データがあれば信頼度を更新
      const existing = itemMap.get(key)
      if (item.confidence === 'high' && existing.confidence === 'medium') {
        existing.confidence = 'high'
      }
      existing.mentions++
    } else {
      itemMap.set(key, {
        keyword: item.keyword,
        confidence: item.confidence,
        mentions: 1,
        context: item.context || []
      })
    }
  })
  
  // 上位5件のアイテムを選択
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => {
      if (a.confidence === 'high' && b.confidence !== 'high') return -1
      if (b.confidence === 'high' && a.confidence !== 'high') return 1
      return b.mentions - a.mentions
    })
    .slice(0, 5)
  
  console.log('🛍️ 選択されたアイテム:')
  topItems.forEach(item => {
    console.log(`   - ${item.keyword} (信頼度: ${item.confidence}, 言及数: ${item.mentions})`)
  })
  
  // アイテムデータの生成（最小限のスキーマ）
  topItems.forEach((item, index) => {
    const itemData = {
      name: `${item.keyword}（${episode.celebrity?.name || 'よにの'}着用）`,
      slug: `${generateSlug(item.keyword)}-${Date.now()}-${index}`
    }
    
    items.push(itemData)
  })
  
  return items
}

// 分析結果から動的にロケーションデータを生成
function generateLocationsFromAnalysis(analysis, episode) {
  const locations = []
  
  // 高信頼度・中信頼度のロケーションキーワードを抽出（無効キーワード除外）
  const highConfidenceLocations = analysis.keywords.locations.filter(location => 
    (location.confidence === 'high' || location.confidence === 'medium') &&
    !invalidLocationKeywords.includes(location.keyword)
  )
  
  console.log(`🔍 信頼度の高いロケーションキーワード: ${highConfidenceLocations.length}件`)
  
  // 重複除去とスコアリング
  const locationMap = new Map()
  
  highConfidenceLocations.forEach(location => {
    const key = location.keyword.toLowerCase()
    if (locationMap.has(key)) {
      const existing = locationMap.get(key)
      if (location.confidence === 'high' && existing.confidence === 'medium') {
        existing.confidence = 'high'
      }
      existing.mentions++
    } else {
      locationMap.set(key, {
        keyword: location.keyword,
        confidence: location.confidence,
        mentions: 1,
        context: location.context || []
      })
    }
  })
  
  // 上位3件のロケーションを選択
  const topLocations = Array.from(locationMap.values())
    .sort((a, b) => {
      if (a.confidence === 'high' && b.confidence !== 'high') return -1
      if (b.confidence === 'high' && a.confidence !== 'high') return 1
      return b.mentions - a.mentions
    })
    .slice(0, 3)
  
  console.log('📍 選択されたロケーション:')
  topLocations.forEach(location => {
    console.log(`   - ${location.keyword} (信頼度: ${location.confidence}, 言及数: ${location.mentions})`)
  })
  
  // ロケーションデータの生成（最小限のスキーマ）
  topLocations.forEach((location, index) => {
    const locationData = {
      name: `${location.keyword}（${episode.title}関連）`,
      slug: `${generateSlug(location.keyword)}-${Date.now()}-${index}`
    }
    
    locations.push(locationData)
  })
  
  return locations
}

// 動的な実データ生成
function processAnalysisResultsDynamic(analysisFilePath) {
  console.log('📋 分析結果を読み込み中...')
  
  try {
    const data = JSON.parse(fs.readFileSync(analysisFilePath, 'utf8'))
    const episode = data.episode
    const analysis = data.analysis
    
    console.log(`📺 対象エピソード: ${episode.title}`)
    console.log(`📊 分析データ: アイテム${analysis.keywords.items.length}件、ロケーション${analysis.keywords.locations.length}件`)
    
    // 動的データ生成
    const items = generateItemsFromAnalysis(analysis, episode)
    const locations = generateLocationsFromAnalysis(analysis, episode)
    
    // 関連データの生成
    const relations = {
      episode_items: [],
      episode_locations: []
    }
    
    // エピソード-アイテム関連の生成
    items.forEach(item => {
      relations.episode_items.push({
        episode_id: episode.id,
        item_id: null // 後で実際のIDに置き換え
      })
    })
    
    // エピソード-ロケーション関連の生成
    locations.forEach(location => {
      relations.episode_locations.push({
        episode_id: episode.id,
        location_id: null // 後で実際のIDに置き換え
      })
    })
    
    const realData = {
      episode: episode,
      items: items,
      locations: locations,
      relations: relations
    }
    
    console.log(`\n📋 生成データサマリー:`)
    console.log(`   🛍️ アイテム: ${realData.items.length}件`)
    console.log(`   📍 ロケーション: ${realData.locations.length}件`)
    console.log(`   🔗 エピソード-アイテム関連: ${realData.relations.episode_items.length}件`)
    console.log(`   🔗 エピソード-ロケーション関連: ${realData.relations.episode_locations.length}件`)
    
    return realData
    
  } catch (error) {
    console.error('❌ 分析結果の処理エラー:', error.message)
    return null
  }
}

// Supabaseにデータを投入（staging環境版）
async function insertDataToSupabaseStaging(realData) {
  console.log('💾 staging環境へのデータ投入開始...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
  
  const insertedItems = []
  const insertedLocations = []
  
  try {
    // 1. アイテムデータ投入
    console.log('🛍️ アイテムデータを投入中...')
    for (const item of realData.items) {
      try {
        // 重複チェック
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?slug=eq.${item.slug}`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        })
        const existingItems = await checkResponse.json()
        
        if (existingItems.length > 0) {
          console.log(`   ⚠️ アイテム既存のためスキップ: ${item.name}`)
          insertedItems.push(existingItems[0])
          continue
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(item)
        })
        
        if (response.ok) {
          const insertedItem = await response.json()
          console.log(`   ✅ アイテム投入成功: ${item.name}`)
          insertedItems.push(insertedItem[0])
        } else {
          console.log(`   ❌ アイテム投入失敗: ${item.name} - ${await response.text()}`)
        }
      } catch (error) {
        console.log(`   ⚠️ アイテム投入エラー: ${item.name} - ${error.message}`)
      }
    }
    
    // 2. ロケーションデータ投入
    console.log('📍 ロケーションデータを投入中...')
    for (const location of realData.locations) {
      try {
        // 重複チェック
        const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations?slug=eq.${location.slug}`, {
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        })
        const existingLocations = await checkResponse.json()
        
        if (existingLocations.length > 0) {
          console.log(`   ⚠️ ロケーション既存のためスキップ: ${location.name}`)
          insertedLocations.push(existingLocations[0])
          continue
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(location)
        })
        
        if (response.ok) {
          const insertedLocation = await response.json()
          console.log(`   ✅ ロケーション投入成功: ${location.name}`)
          insertedLocations.push(insertedLocation[0])
        } else {
          console.log(`   ❌ ロケーション投入失敗: ${location.name} - ${await response.text()}`)
        }
      } catch (error) {
        console.log(`   ⚠️ ロケーション投入エラー: ${location.name} - ${error.message}`)
      }
    }
    
    // 3. エピソード-アイテム関連データ投入
    console.log('🔗 エピソード-アイテム関連データを投入中...')
    for (let i = 0; i < Math.min(insertedItems.length, realData.relations.episode_items.length); i++) {
      try {
        const relation = {
          id: generateId(),
          episode_id: realData.relations.episode_items[i].episode_id,
          item_id: insertedItems[i].id
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_items`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(relation)
        })
        
        if (response.ok) {
          console.log(`   ✅ エピソード-アイテム関連投入成功`)
        } else {
          console.log(`   ❌ エピソード-アイテム関連投入失敗: ${await response.text()}`)
        }
      } catch (error) {
        console.log(`   ⚠️ エピソード-アイテム関連投入エラー: ${error.message}`)
      }
    }
    
    // 4. エピソード-ロケーション関連データ投入
    console.log('🔗 エピソード-ロケーション関連データを投入中...')
    for (let i = 0; i < Math.min(insertedLocations.length, realData.relations.episode_locations.length); i++) {
      try {
        const relation = {
          id: generateId(),
          episode_id: realData.relations.episode_locations[i].episode_id,
          location_id: insertedLocations[i].id
        }
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(relation)
        })
        
        if (response.ok) {
          console.log(`   ✅ エピソード-ロケーション関連投入成功`)
        } else {
          console.log(`   ❌ エピソード-ロケーション関連投入失敗: ${await response.text()}`)
        }
      } catch (error) {
        console.log(`   ⚠️ エピソード-ロケーション関連投入エラー: ${error.message}`)
      }
    }
    
    console.log('\n✅ staging環境データ投入完了')
    console.log(`📊 結果: アイテム${insertedItems.length}件、ロケーション${insertedLocations.length}件`)
    
  } catch (error) {
    console.error('❌ データ投入エラー:', error.message)
  }
}

// メイン処理
async function main() {
  console.log('🚀 staging環境動的データ生成システム v3.0')
  console.log('===============================\n')
  
  const analysisFile = process.argv[2]
  
  if (!analysisFile) {
    console.error('❌ 分析結果ファイルを指定してください')
    console.log('💡 使用方法: node dynamic-data-generator-staging.cjs <分析結果ファイル>')
    process.exit(1)
  }
  
  if (!fs.existsSync(analysisFile)) {
    console.error('❌ 分析結果ファイルが見つかりません:', analysisFile)
    process.exit(1)
  }
  
  // 1. 動的分析結果の処理
  const realData = processAnalysisResultsDynamic(analysisFile)
  if (!realData) {
    process.exit(1)
  }
  
  // 2. 処理結果をファイルに保存
  const outputFile = path.join(path.dirname(analysisFile), `staging-dynamic-data-${Date.now()}.json`)
  fs.writeFileSync(outputFile, JSON.stringify(realData, null, 2), 'utf8')
  console.log(`📄 staging版データファイル作成: ${outputFile}`)
  
  // 3. staging Supabaseへのデータ投入
  console.log('\n💾 staging Supabaseへのデータ投入を開始...')
  await insertDataToSupabaseStaging(realData)
  
  console.log('\n🎉 staging環境データ生成・投入完了！')
  console.log('\n📋 次のステップ:')
  console.log('1. staging環境でエピソード詳細ページを確認')
  console.log('2. staging環境で生成されたデータが正しく表示されるかテスト')
  console.log(`3. https://develop--oshikatsu-collection.netlify.app/episodes/${realData.episode.id}`)
}

// 実行
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { processAnalysisResultsDynamic, insertDataToSupabaseStaging }