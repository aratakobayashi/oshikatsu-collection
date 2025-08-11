// 修正されたSupabase接続テスト
const crypto = require('crypto')

// 本番環境の正しい設定
const SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

async function testFixedConnection() {
  console.log('🔧 修正されたSupabase接続テスト')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json'
  }
  
  try {
    // 1. 読み取りテスト
    console.log('\n1. episodes読み取りテスト:')
    const readResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?limit=1`, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    })
    
    if (readResponse.ok) {
      const data = await readResponse.json()
      console.log(`   ✅ 読み取り成功: ${data.length}件`)
    } else {
      console.log(`   ❌ 読み取り失敗: ${readResponse.status} - ${await readResponse.text()}`)
    }
    
    // 2. 挿入テスト
    console.log('\n2. アイテム挿入テスト:')
    const testItem = {
      name: '修正テストアイテム',
      slug: `fixed-test-${Date.now()}`
    }
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testItem)
    })
    
    if (insertResponse.ok) {
      console.log('   ✅ 挿入成功!')
      
      // 3. エピソード-アイテム関連テスト
      console.log('\n3. episode_items関連テスト:')
      
      // 最初のエピソードIDを取得
      const episodesResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      })
      
      if (episodesResponse.ok) {
        const episodes = await episodesResponse.json()
        if (episodes.length > 0) {
          const episodeId = episodes[0].id
          
          const relationData = {
            id: crypto.randomUUID(),
            episode_id: episodeId,
            item_id: testItem.id
          }
          
          const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(relationData)
          })
          
          if (relationResponse.ok) {
            console.log('   ✅ episode_items関連挿入成功!')
            
            // クリーンアップ
            console.log('\n4. クリーンアップ中...')
            
            // 関連レコードを削除
            await fetch(`${SUPABASE_URL}/rest/v1/episode_items?id=eq.${relationData.id}`, {
              method: 'DELETE',
              headers: headers
            })
            
            // アイテムを削除
            await fetch(`${SUPABASE_URL}/rest/v1/items?id=eq.${testItem.id}`, {
              method: 'DELETE',
              headers: headers
            })
            
            console.log('   ✅ クリーンアップ完了')
            console.log('\n🎉 全ての接続テストが成功しました！')
            
          } else {
            console.log(`   ❌ episode_items関連挿入失敗: ${relationResponse.status} - ${await relationResponse.text()}`)
          }
        }
      }
      
    } else {
      console.log(`   ❌ 挿入失敗: ${insertResponse.status} - ${await insertResponse.text()}`)
    }
    
  } catch (error) {
    console.error('❌ 接続エラー:', error.message)
  }
}

testFixedConnection()