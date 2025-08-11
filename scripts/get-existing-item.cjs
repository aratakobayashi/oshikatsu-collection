// 既存アイテムの構造確認
require('dotenv').config({ path: '.env.production' })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

console.log('URL:', SUPABASE_URL)
console.log('Key exists:', !!SUPABASE_ANON_KEY)

async function getExistingItems() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    
    if (response.ok) {
      const items = await response.json()
      console.log(`📋 総アイテム数: ${items.length}件`)
      if (items.length > 0) {
        console.log('\n最初のアイテム構造:')
        console.log(JSON.stringify(items[0], null, 2))
      }
    } else {
      console.log('読み取り失敗:', await response.text())
    }
  } catch (error) {
    console.error('エラー:', error)
  }
}

getExistingItems()