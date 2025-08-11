const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Supabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

function generateId() {
  return crypto.randomUUID()
}

// 分析結果から実データを抽出・構造化
function processAnalysisResults(analysisFilePath) {
  console.log('📋 分析結果を読み込み中...')
  
  try {
    const data = JSON.parse(fs.readFileSync(analysisFilePath, 'utf8'))
    const episode = data.episode
    const analysis = data.analysis
    
    console.log(`📺 対象エピソード: ${episode.title}`)
    
    // 実データの構造化
    const realData = {
      episode: episode,
      items: [],
      locations: [],
      relations: {
        episode_items: [],
        episode_locations: []
      }
    }
    
    // アイテムデータの作成
    console.log('🛍️ アイテムデータを作成中...')
    
    // 分析結果から高信頼度のアイテム情報を抽出
    const hatItems = analysis.keywords.items.filter(item => 
      item.keyword === '帽子' && 
      (item.confidence === 'high' || item.confidence === 'medium')
    )
    
    if (hatItems.length > 0) {
      const hatItem = {
        id: generateId(),
        name: 'キャップ・帽子（SixTONES着用）',
        slug: 'sixtones-cap-janifes2022',
        description: 'ジャニフェス2022でSixTONESメンバーが着用していたキャップ。挨拶時に礼儀正しく脱帽する姿が印象的。',
        brand: '不明',
        category: 'アクセサリー',
        price: null,
        image_url: null,
        purchase_url: null,
        tags: ['帽子', 'キャップ', 'SixTONES', 'ジャニフェス']
      }
      
      realData.items.push(hatItem)
      
      // エピソード-アイテム関連データ
      realData.relations.episode_items.push({
        id: generateId(),
        episode_id: episode.id,
        item_id: hatItem.id,
        timestamp_seconds: 540, // 9:00 = 540秒
        scene_description: 'SixTONESメンバーが挨拶時に帽子を脱ぐシーン'
      })
      
      console.log(`   ✅ アイテム追加: ${hatItem.name}`)
    }
    
    // ロケーションデータの作成
    console.log('📍 ロケーションデータを作成中...')
    
    // ジャニフェス会場の情報
    const janifesVenue = {
      id: generateId(),
      name: 'ジャニフェス2022 会場',
      slug: 'janifes-2022-venue',
      description: 'ジャニフェス2022が開催された会場。よにのちゃんねるが裏側潜入取材を行った。',
      address: null,
      website_url: null,
      phone: null,
      opening_hours: null,
      latitude: null,
      longitude: null,
      image_url: null,
      tags: ['イベント会場', 'ジャニフェス', 'コンサート', 'ジャニーズ']
    }
    
    realData.locations.push(janifesVenue)
    
    // エピソード-ロケーション関連データ
    realData.relations.episode_locations.push({
      id: generateId(),
      episode_id: episode.id,
      location_id: janifesVenue.id,
      scene_description: 'ジャニフェス会場の楽屋・控室エリアでの撮影'
    })
    
    console.log(`   ✅ ロケーション追加: ${janifesVenue.name}`)
    
    // 楽屋・控室の情報
    const backstageArea = {
      id: generateId(),
      name: 'ジャニフェス楽屋・控室エリア',
      slug: 'janifes-backstage-area',
      description: 'ジャニフェス2022の楽屋・控室エリア。各アーティストの待機場所として使用された。',
      address: null,
      website_url: null,
      phone: null,
      opening_hours: null,
      latitude: null,
      longitude: null,
      image_url: null,
      tags: ['楽屋', '控室', 'バックステージ', 'イベント施設']
    }
    
    realData.locations.push(backstageArea)
    
    // エピソード-ロケーション関連データ
    realData.relations.episode_locations.push({
      id: generateId(),
      episode_id: episode.id,
      location_id: backstageArea.id,
      scene_description: '各アーティストとの交流シーン。宮田くんの挨拶シーンなど'
    })
    
    console.log(`   ✅ ロケーション追加: ${backstageArea.name}`)
    
    return realData
    
  } catch (error) {
    console.error('❌ 分析結果の処理エラー:', error.message)
    return null
  }
}

// Supabaseにデータを投入
async function insertDataToSupabase(realData) {
  console.log('💾 Supabaseにデータを投入中...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
  
  try {
    // 1. アイテムデータ投入
    console.log('🛍️ アイテムデータを投入中...')
    for (const item of realData.items) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(item)
      })
      
      if (response.ok) {
        console.log(`   ✅ アイテム投入成功: ${item.name}`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ アイテム投入失敗: ${error}`)
      }
    }
    
    // 2. ロケーションデータ投入
    console.log('📍 ロケーションデータを投入中...')
    for (const location of realData.locations) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(location)
      })
      
      if (response.ok) {
        console.log(`   ✅ ロケーション投入成功: ${location.name}`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ ロケーション投入失敗: ${error}`)
      }
    }
    
    // 3. エピソード-アイテム関連データ投入
    console.log('🔗 エピソード-アイテム関連データを投入中...')
    for (const relation of realData.relations.episode_items) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(relation)
      })
      
      if (response.ok) {
        console.log(`   ✅ エピソード-アイテム関連投入成功`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ エピソード-アイテム関連投入失敗: ${error}`)
      }
    }
    
    // 4. エピソード-ロケーション関連データ投入
    console.log('🔗 エピソード-ロケーション関連データを投入中...')
    for (const relation of realData.relations.episode_locations) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(relation)
      })
      
      if (response.ok) {
        console.log(`   ✅ エピソード-ロケーション関連投入成功`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ エピソード-ロケーション関連投入失敗: ${error}`)
      }
    }
    
    // 5. 投入結果の確認
    console.log('📊 投入結果を確認中...')
    
    const itemsCount = await fetch(`${SUPABASE_URL}/rest/v1/items?select=count`, {
      headers: { ...headers, 'Prefer': 'count=exact' }
    }).then(res => res.json())
    
    const locationsCount = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=count`, {
      headers: { ...headers, 'Prefer': 'count=exact' }
    }).then(res => res.json())
    
    const itemRelationsCount = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?select=count`, {
      headers: { ...headers, 'Prefer': 'count=exact' }
    }).then(res => res.json())
    
    const locationRelationsCount = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?select=count`, {
      headers: { ...headers, 'Prefer': 'count=exact' }
    }).then(res => res.json())
    
    console.log(`\n📈 データベース更新後の状況:`)
    console.log(`   🛍️ 総アイテム数: ${itemsCount[0]?.count || 0}件`)
    console.log(`   📍 総ロケーション数: ${locationsCount[0]?.count || 0}件`)
    console.log(`   🔗 エピソード-アイテム関連: ${itemRelationsCount[0]?.count || 0}件`)
    console.log(`   🔗 エピソード-ロケーション関連: ${locationRelationsCount[0]?.count || 0}件`)
    
  } catch (error) {
    console.error('❌ データ投入エラー:', error.message)
  }
}

// メイン処理
async function main() {
  console.log('🏭 実データ作成・投入システム v1.0')
  console.log('======================================\n')
  
  const analysisFile = process.argv[2] || 'scripts/analysis-results-5af068026f46542dbc432385cd565cfa.json'
  
  if (!fs.existsSync(analysisFile)) {
    console.error('❌ 分析結果ファイルが見つかりません:', analysisFile)
    console.log('💡 まず analyze-episode-data.cjs を実行してください')
    process.exit(1)
  }
  
  // 1. 分析結果の処理
  const realData = processAnalysisResults(analysisFile)
  if (!realData) {
    process.exit(1)
  }
  
  // 2. 処理結果をファイルに保存
  const outputFile = path.join(path.dirname(analysisFile), `real-data-${Date.now()}.json`)
  fs.writeFileSync(outputFile, JSON.stringify(realData, null, 2), 'utf8')
  console.log(`📄 実データファイル作成: ${outputFile}`)
  
  console.log(`\n📋 作成データサマリー:`)
  console.log(`   🛍️ アイテム: ${realData.items.length}件`)
  console.log(`   📍 ロケーション: ${realData.locations.length}件`)
  console.log(`   🔗 エピソード-アイテム関連: ${realData.relations.episode_items.length}件`)
  console.log(`   🔗 エピソード-ロケーション関連: ${realData.relations.episode_locations.length}件`)
  
  // 3. Supabaseへのデータ投入
  console.log('\n💾 Supabaseへのデータ投入を開始...')
  await insertDataToSupabase(realData)
  
  console.log('\n🎉 実データ作成・投入完了！')
  console.log('\n📋 次のステップ:')
  console.log('1. staging環境でエピソード詳細ページを確認')
  console.log('2. 実データが正しく表示されるかテスト')
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

module.exports = { processAnalysisResults, insertDataToSupabase }