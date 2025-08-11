// 最小限のアイテム挿入テスト
const crypto = require('crypto')

// 直接ハードコード
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcWJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

async function testSimpleInsert() {
  console.log('🔧 最小限アイテム挿入テスト')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
  
  // 超シンプルなアイテム
  const testItem = {
    id: crypto.randomUUID(),
    name: 'テスト帽子',
    slug: `test-hat-${Date.now()}`
  }
  
  try {
    console.log('📤 投入データ:', JSON.stringify(testItem, null, 2))
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testItem)
    })
    
    console.log('📥 レスポンス状態:', response.status)
    
    if (response.ok) {
      console.log('✅ 投入成功!')
      
      // 確認
      const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${testItem.id}`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      })
      
      if (checkResponse.ok) {
        const items = await checkResponse.json()
        console.log('📋 作成されたアイテム:', items[0])
      }
    } else {
      const errorText = await response.text()
      console.log('❌ 投入失敗:', errorText)
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

testSimpleInsert()