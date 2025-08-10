const crypto = require('crypto')

// Supabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

function generateId() {
  return crypto.randomUUID()
}

async function cleanupAndFixItems() {
  console.log('🧹 テストデータのクリーンアップ & キャップ紐づけを実行中...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
  
  try {
    const episodeId = '5af068026f46542dbc432385cd565cfa'
    
    // 1. 現在の関連データを確認
    console.log('📋 現在の関連データを確認中...')
    
    const currentRelationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episodeId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const currentRelations = await currentRelationsResponse.json()
    console.log(`   現在の関連データ: ${currentRelations.length}件`)
    
    // 2. テスト用関連データを削除
    console.log('🗑️ テスト用関連データを削除中...')
    
    for (const relation of currentRelations) {
      // テスト用アイテムID（テストTシャツ）を削除
      if (relation.item_id === '8711c03f-6df0-4b67-bc01-b22930222a8c') {
        const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?id=eq.${relation.id}`, {
          method: 'DELETE',
          headers: headers
        })
        
        if (deleteResponse.ok) {
          console.log('   ✅ テスト用関連データを削除')
        } else {
          console.log('   ⚠️ テスト用関連データ削除失敗')
        }
      }
    }
    
    // 3. SixTONESキャップの情報を取得
    console.log('🔍 SixTONESキャップ情報を検索中...')
    
    const capItemResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?select=id,name&name=ilike.%キャップ%`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    let capItems = []
    try {
      capItems = await capItemResponse.json()
    } catch (e) {
      // JSONパースエラーの場合は別の方法で検索
      console.log('   別の方法で検索中...')
      const allItemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?select=id,name,slug`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })
      const allItems = await allItemsResponse.json()
      capItems = allItems.filter(item => 
        item.name.includes('キャップ') || 
        item.name.includes('帽子') || 
        item.slug.includes('cap')
      )
    }
    
    console.log(`   キャップ関連アイテム: ${capItems.length}件`)
    capItems.forEach(item => console.log(`     - ${item.name}`))
    
    // 4. SixTONESキャップをエピソードに紐づけ
    if (capItems.length > 0) {
      console.log('🔗 SixTONESキャップをエピソードに紐づけ中...')
      
      const capItem = capItems[0] // 最初のキャップアイテムを使用
      
      const relationData = {
        id: generateId(),
        episode_id: episodeId,
        item_id: capItem.id
      }
      
      const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(relationData)
      })
      
      if (relationResponse.ok) {
        console.log(`   ✅ キャップ紐づけ成功: ${capItem.name}`)
      } else {
        const error = await relationResponse.text()
        console.log(`   ⚠️ キャップ紐づけ失敗: ${error}`)
      }
    } else {
      console.log('   ⚠️ キャップアイテムが見つかりません')
    }
    
    // 5. 最終結果の確認
    console.log('📊 最終結果を確認中...')
    
    const finalRelationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episodeId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const finalRelations = await finalRelationsResponse.json()
    
    console.log(`✅ エピソード-アイテム関連データ: ${finalRelations.length}件`)
    
    // 関連データの詳細表示
    for (const relation of finalRelations) {
      const itemResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?select=name&id=eq.${relation.item_id}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      })
      const itemData = await itemResponse.json()
      if (itemData.length > 0) {
        console.log(`   - ${itemData[0].name}`)
      }
    }
    
    console.log('\n🎉 クリーンアップ & 修正完了！')
    console.log('📋 staging環境で確認してください:')
    console.log(`   https://develop--oshikatsu-collection.netlify.app/episodes/${episodeId}`)
    
  } catch (error) {
    console.error('❌ クリーンアップエラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  console.log('🧹 アイテムデータクリーンアップ & 修正ツール v1.0')
  console.log('==========================================\n')
  
  cleanupAndFixItems()
    .then(() => {
      console.log('\n✅ クリーンアップ処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { cleanupAndFixItems }