const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcWJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function validateDataConsistency() {
  console.log('🔍 データ整合性チェックツール v1.0')
  console.log('==================================\n')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    console.log('📊 データ整合性チェック開始...')
    
    // 1. アイテムデータの検証
    console.log('\n🛍️ アイテムデータの検証...')
    
    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?select=id,name,slug`, {
      headers: headers
    })
    const items = await itemsResponse.json()
    
    console.log(`   総アイテム数: ${items.length}件`)
    
    const itemIssues = []
    
    // slug重複チェック
    const slugCounts = {}
    items.forEach(item => {
      if (item.slug) {
        slugCounts[item.slug] = (slugCounts[item.slug] || 0) + 1
      }
    })
    
    Object.entries(slugCounts).forEach(([slug, count]) => {
      if (count > 1) {
        itemIssues.push(`重複slug: ${slug} (${count}件)`)
      }
    })
    
    // 空slug/名前チェック
    items.forEach(item => {
      if (!item.slug) {
        itemIssues.push(`アイテム "${item.name}" にslugがありません (ID: ${item.id})`)
      }
      if (!item.name) {
        itemIssues.push(`アイテム ID:${item.id} に名前がありません`)
      }
    })
    
    // 2. ロケーションデータの検証
    console.log('\n📍 ロケーションデータの検証...')
    
    const locationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=id,name,slug`, {
      headers: headers
    })
    const locations = await locationsResponse.json()
    
    console.log(`   総ロケーション数: ${locations.length}件`)
    
    const locationIssues = []
    
    // slug重複チェック
    const locationSlugCounts = {}
    locations.forEach(location => {
      if (location.slug) {
        locationSlugCounts[location.slug] = (locationSlugCounts[location.slug] || 0) + 1
      }
    })
    
    Object.entries(locationSlugCounts).forEach(([slug, count]) => {
      if (count > 1) {
        locationIssues.push(`重複slug: ${slug} (${count}件)`)
      }
    })
    
    // 3. 関連データの整合性チェック
    console.log('\n🔗 関連データの整合性チェック...')
    
    // エピソード-アイテム関連
    const episodeItemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?select=episode_id,item_id`, {
      headers: headers
    })
    const episodeItems = await episodeItemsResponse.json()
    
    // エピソード-ロケーション関連
    const episodeLocationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?select=episode_id,location_id`, {
      headers: headers
    })
    const episodeLocations = await episodeLocationsResponse.json()
    
    console.log(`   エピソード-アイテム関連: ${episodeItems.length}件`)
    console.log(`   エピソード-ロケーション関連: ${episodeLocations.length}件`)
    
    // 孤立した関連データチェック
    const relationIssues = []
    
    for (const relation of episodeItems) {
      const itemExists = items.find(item => item.id === relation.item_id)
      if (!itemExists) {
        relationIssues.push(`存在しないアイテムへの関連: ${relation.item_id}`)
      }
    }
    
    for (const relation of episodeLocations) {
      const locationExists = locations.find(location => location.id === relation.location_id)
      if (!locationExists) {
        relationIssues.push(`存在しないロケーションへの関連: ${relation.location_id}`)
      }
    }
    
    // 4. 結果レポート
    console.log('\n📋 検証結果レポート')
    console.log('==================')
    
    if (itemIssues.length === 0) {
      console.log('✅ アイテムデータ: 問題なし')
    } else {
      console.log('⚠️ アイテムデータの問題:')
      itemIssues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    if (locationIssues.length === 0) {
      console.log('✅ ロケーションデータ: 問題なし')
    } else {
      console.log('⚠️ ロケーションデータの問題:')
      locationIssues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    if (relationIssues.length === 0) {
      console.log('✅ 関連データ: 問題なし')
    } else {
      console.log('⚠️ 関連データの問題:')
      relationIssues.forEach(issue => console.log(`   - ${issue}`))
    }
    
    const totalIssues = itemIssues.length + locationIssues.length + relationIssues.length
    
    if (totalIssues === 0) {
      console.log('\n🎉 データ整合性チェック完了: すべて正常!')
    } else {
      console.log(`\n⚠️ ${totalIssues}件の問題が見つかりました。修正を推奨します。`)
    }
    
    return {
      items: items.length,
      locations: locations.length,
      episodeItems: episodeItems.length,
      episodeLocations: episodeLocations.length,
      issues: totalIssues
    }
    
  } catch (error) {
    console.error('❌ 検証エラー:', error.message)
    return null
  }
}

// 実行
if (require.main === module) {
  validateDataConsistency()
    .then((result) => {
      if (result) {
        console.log('\n📊 検証統計:')
        console.log(`   アイテム: ${result.items}件`)
        console.log(`   ロケーション: ${result.locations}件`) 
        console.log(`   エピソード-アイテム関連: ${result.episodeItems}件`)
        console.log(`   エピソード-ロケーション関連: ${result.episodeLocations}件`)
        console.log(`   発見された問題: ${result.issues}件`)
      }
      console.log('\n✅ 検証完了')
      process.exit(result && result.issues === 0 ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { validateDataConsistency }