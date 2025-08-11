require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getCategories() {
  try {
    console.log('🏷️ アイテムのカテゴリ情報を取得中...\n')
    
    // アイテムの実際のカテゴリ情報を取得
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('category, brand, name')
      .limit(20)
    
    if (itemsError) {
      console.error('アイテム取得エラー:', itemsError)
      return
    }
    
    console.log('📦 アイテムサンプル:')
    items?.forEach((item, i) => {
      if (i < 5) {
        console.log(`  ${item.name} - ${item.brand || 'ブランド不明'} (${item.category || 'カテゴリ不明'})`)
      }
    })
    
    // ユニークなカテゴリを取得
    const uniqueCategories = [...new Set(items?.map(item => item.category).filter(Boolean))]
    console.log('\n📋 実際のアイテムカテゴリ:', uniqueCategories)
    
    // ユニークなブランドを取得
    const uniqueBrands = [...new Set(items?.map(item => item.brand).filter(Boolean))]
    console.log('\n🏪 実際のブランド:', uniqueBrands.slice(0, 10))
    
    console.log('\n🗺️ ロケーションのカテゴリ情報を取得中...\n')
    
    // ロケーションの実際のカテゴリ情報を取得
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('name, address, tags')
      .limit(20)
    
    if (locationsError) {
      console.error('ロケーション取得エラー:', locationsError)
      return
    }
    
    console.log('📍 ロケーションサンプル:')
    locations?.forEach((location, i) => {
      if (i < 5) {
        console.log(`  ${location.name} - ${location.address || '住所不明'} (${location.tags?.join(', ') || 'タグなし'})`)
      }
    })
    
    // ユニークなタグを取得
    const allTags = locations?.flatMap(loc => loc.tags || []) || []
    const uniqueTags = [...new Set(allTags)]
    console.log('\n🏷️ 実際のロケーションタグ:', uniqueTags)
    
  } catch (error) {
    console.error('エラー:', error)
  }
}

getCategories()