// 🧪 修正されたlocations APIのテスト
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function testFixedLocationsAPI() {
  console.log('🧪 修正されたLocations APIテスト')
  console.log('==============================')
  
  // 修正されたuseProgressiveHomeDataと同じクエリをテスト
  console.log('\n✅ 修正されたfeaturedLocationsクエリ:')
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, address, image_url, website_url, tags')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('❌ 修正されたクエリエラー:', error)
    } else {
      console.log(`✅ 修正されたクエリ成功: ${locations?.length || 0}件`)
      
      locations?.forEach((location, index) => {
        console.log(`\n${index + 1}. ${location.name}`)
        console.log(`   📍 Address: ${location.address || '未設定'}`)
        console.log(`   🖼️ Image URL: ${location.image_url || '未設定'}`)
        console.log(`   🌐 Website: ${location.website_url || '未設定'}`)
        console.log(`   🏷️ Tags: ${location.tags ? JSON.stringify(location.tags) : '未設定'}`)
        
        // HomeBalanced.tsxでのタグ表示をシミュレート
        const displayTag = location.tags?.[0] || '飲食店'
        console.log(`   📱 表示タグ: "${displayTag}"`)
      })
      
      // データ品質確認
      const locationsWithImages = locations?.filter(loc => loc.image_url) || []
      const locationsWithTags = locations?.filter(loc => loc.tags && loc.tags.length > 0) || []
      
      console.log('\n📊 データ品質確認:')
      console.log(`   🖼️ 画像あり: ${locationsWithImages.length}/${locations?.length || 0}件`)
      console.log(`   🏷️ タグあり: ${locationsWithTags.length}/${locations?.length || 0}件`)
    }
    
  } catch (error) {
    console.error('❌ テスト例外:', error)
  }
  
  // HomeBalanced.tsxでの実際の表示をシミュレート
  console.log('\n🎨 HomeBalanced.tsx表示シミュレーション:')
  console.log('===========================================')
  
  try {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, address, image_url, website_url, tags')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (locations && locations.length > 0) {
      console.log('✅ 「注目スポット」セクションが表示されます:')
      
      locations.slice(0, 3).forEach((location, index) => {
        console.log(`\n📍 カード${index + 1}:`)
        console.log(`   タイトル: ${location.name}`)
        console.log(`   住所: ${location.address || '住所未設定'}`)
        console.log(`   タグ: ${location.tags?.[0] || '飲食店'}`)
        console.log(`   アイコン: MapPin (画像は実装されていません)`)
      })
    } else {
      console.log('⚠️  「注目スポット」セクションは非表示になります')
    }
    
  } catch (error) {
    console.error('❌ 表示シミュレーションエラー:', error)
  }
}

testFixedLocationsAPI().then(() => {
  console.log('\n🏁 修正されたLocations APIテスト完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ テストでエラー発生:', error)
  process.exit(1)
})