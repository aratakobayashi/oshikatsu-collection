// テーブルスキーマ確認スクリプト
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcWJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function checkTableSchemas() {
  console.log('🔍 テーブルスキーマ確認中...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    // 1. itemsテーブルの既存レコードからスキーマを推定
    console.log('\n📋 itemsテーブルスキーマ確認...')
    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?limit=1`, { headers })
    
    if (itemsResponse.ok) {
      const items = await itemsResponse.json()
      if (items.length > 0) {
        console.log('✅ itemsテーブルの既存カラム:')
        Object.keys(items[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof items[0][key]}`)
        })
      }
    }
    
    // 2. locationsテーブルの既存レコードからスキーマを推定
    console.log('\n📍 locationsテーブルスキーマ確認...')
    const locationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations?limit=1`, { headers })
    
    if (locationsResponse.ok) {
      const locations = await locationsResponse.json()
      if (locations.length > 0) {
        console.log('✅ locationsテーブルの既存カラム:')
        Object.keys(locations[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof locations[0][key]}`)
        })
      }
    }
    
    // 3. episode_itemsテーブルのスキーマ確認
    console.log('\n🔗 episode_itemsテーブルスキーマ確認...')
    const episodeItemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?limit=1`, { headers })
    
    if (episodeItemsResponse.ok) {
      const episodeItems = await episodeItemsResponse.json()
      if (episodeItems.length > 0) {
        console.log('✅ episode_itemsテーブルの既存カラム:')
        Object.keys(episodeItems[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof episodeItems[0][key]}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ スキーマ確認エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  checkTableSchemas()
    .then(() => console.log('\n🏁 スキーマ確認完了'))
    .catch(console.error)
}

module.exports = { checkTableSchemas }