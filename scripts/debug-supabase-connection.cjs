// Supabaseへの接続テストスクリプト
const crypto = require('crypto')

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function testSupabaseConnection() {
  console.log('🔍 Supabase接続テストを開始...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
  
  try {
    // 1. エピソードテーブル読み取りテスト
    console.log('\n1. エピソードテーブル読み取りテスト...')
    const episodesResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    
    if (episodesResponse.ok) {
      const episodes = await episodesResponse.json()
      console.log(`✅ エピソード読み取り成功: ${episodes.length}件`)
    } else {
      console.log(`❌ エピソード読み取り失敗: ${episodesResponse.status}`)
      console.log(await episodesResponse.text())
    }
    
    // 2. アイテムテーブル読み取りテスト
    console.log('\n2. アイテムテーブル読み取りテスト...')
    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    
    if (itemsResponse.ok) {
      const items = await itemsResponse.json()
      console.log(`✅ アイテム読み取り成功: ${items.length}件`)
    } else {
      console.log(`❌ アイテム読み取り失敗: ${itemsResponse.status}`)
      console.log(await itemsResponse.text())
    }
    
    // 3. アイテム作成テスト
    console.log('\n3. アイテム作成テスト...')
    const testItem = {
      id: crypto.randomUUID(),
      name: 'テスト用アイテム',
      slug: `test-item-${Date.now()}`,
      description: '接続テスト用のアイテムです',
      brand: 'テストブランド',
      category: 'テスト',
      price: 1000,
      currency: 'JPY',
      image_url: null,
      affiliate_url: null,
      color: null,
      size: null,
      material: null,
      is_available: true,
      tags: ['テスト']
    }
    
    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testItem)
    })
    
    if (createResponse.ok) {
      console.log('✅ アイテム作成成功')
      
      // 作成したテストアイテムを削除
      console.log('🗑️ テストアイテムを削除中...')
      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${testItem.id}`, {
        method: 'DELETE',
        headers: headers
      })
      
      if (deleteResponse.ok) {
        console.log('✅ テストアイテム削除成功')
      }
    } else {
      console.log(`❌ アイテム作成失敗: ${createResponse.status}`)
      const errorText = await createResponse.text()
      console.log('エラー詳細:', errorText)
    }
    
    // 4. episode_itemsテーブルの確認
    console.log('\n4. episode_itemsテーブル確認...')
    const relationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    
    if (relationsResponse.ok) {
      const relations = await relationsResponse.json()
      console.log(`✅ episode_items読み取り成功: ${relations.length}件`)
    } else {
      console.log(`❌ episode_items読み取り失敗: ${relationsResponse.status}`)
      console.log(await relationsResponse.text())
    }
    
  } catch (error) {
    console.error('❌ 接続テストエラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  testSupabaseConnection()
    .then(() => {
      console.log('\n🏁 接続テスト完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { testSupabaseConnection }