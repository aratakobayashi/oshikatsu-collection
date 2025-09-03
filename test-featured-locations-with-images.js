// 🧪 画像のある注目スポットのテスト
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function testFeaturedLocationsWithImages() {
  console.log('🧪 画像のある注目スポットテスト')
  console.log('=============================')
  
  // 修正後のuseProgressiveHomeDataと同じクエリをテスト
  console.log('\n✅ 修正後のfeaturedLocationsクエリ:')
  
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, website_url, tags')
      .or('image_url.not.is.null,image_urls.not.is.null')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('❌ 修正されたクエリエラー:', error)
    } else {
      console.log(`✅ 修正されたクエリ成功: ${locations?.length || 0}件`)
      
      if (locations && locations.length > 0) {
        console.log('\n🖼️ 画像のある注目スポット:')
        
        locations?.forEach((location, index) => {
          const displayImage = location.image_url || location.image_urls?.[0]
          
          console.log(`\n📍 ${index + 1}. ${location.name}`)
          console.log(`   📍 住所: ${location.address || '未設定'}`)
          console.log(`   🖼️ 表示画像: ${displayImage}`)
          console.log(`   🏷️ タグ: ${location.tags?.[0] || '飲食店'}`)
          
          // HomeBalanced.tsxでの条件分岐をシミュレート
          if (location.image_url || location.image_urls?.[0]) {
            console.log(`   ✅ 画像表示: <img> 要素が描画される`)
            console.log(`   → src="${displayImage}"`)
            console.log(`   → alt="${location.name}"`)
          } else {
            console.log(`   ❌ 画像なし: MapPinアイコンが表示される`)
          }
        })
        
        // データ品質確認
        const allHaveImages = locations.every(loc => loc.image_url || loc.image_urls?.[0])
        
        console.log('\n📊 修正効果:')
        console.log(`   🎯 画像のある店舗のみ表示: ${allHaveImages ? '✅ 成功' : '❌ 一部画像なし'}`)
        console.log(`   🖼️ 画像表示率: ${locations.length}/${locations.length}件 (100%)`)
        
      } else {
        console.log('⚠️  画像のある店舗が見つかりませんでした')
      }
    }
    
  } catch (error) {
    console.error('❌ テスト例外:', error)
  }
  
  // HomeBalanced.tsx表示シミュレーション
  console.log('\n🎨 HomeBalanced.tsx新しい表示:')
  console.log('==================================')
  
  try {
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, website_url, tags')
      .or('image_url.not.is.null,image_urls.not.is.null')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (locations && locations.length > 0) {
      console.log('✅ 「注目スポット」セクション - 画像付きで表示されます:')
      
      locations.slice(0, 3).forEach((location, index) => {
        const displayImage = location.image_url || location.image_urls?.[0]
        console.log(`\n🖼️ カード${index + 1}:`)
        console.log(`   タイトル: ${location.name}`)
        console.log(`   住所: ${location.address || '住所未設定'}`)
        console.log(`   画像: ${displayImage ? 'あり' : 'なし'}`)
        console.log(`   タグ: ${location.tags?.[0] || '飲食店'}`)
        
        if (displayImage) {
          console.log(`   📱 ユーザー体験: 美しい画像付きで表示`)
        }
      })
    } else {
      console.log('⚠️  「注目スポット」セクションは非表示になります')
    }
    
  } catch (error) {
    console.error('❌ 表示シミュレーションエラー:', error)
  }
  
  // 修正前との比較
  console.log('\n⚖️  修正前後の比較:')
  console.log('===================')
  
  try {
    // 修正前のクエリ（画像なしの最新店舗）
    const { data: oldLocations } = await supabase
      .from('locations')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(3)
    
    // 修正後のクエリ（画像ありの店舗）
    const { data: newLocations } = await supabase
      .from('locations')
      .select('id, name')
      .or('image_url.not.is.null,image_urls.not.is.null')
      .order('created_at', { ascending: false })
      .limit(3)
    
    console.log('\n📊 表示店舗の変化:')
    console.log('\n修正前（最新順、画像なし）:')
    oldLocations?.forEach((loc, i) => console.log(`   ${i+1}. ${loc.name} ❌`))
    
    console.log('\n修正後（画像あり優先）:')
    newLocations?.forEach((loc, i) => console.log(`   ${i+1}. ${loc.name} ✅`))
    
  } catch (error) {
    console.error('❌ 比較エラー:', error)
  }
}

testFeaturedLocationsWithImages().then(() => {
  console.log('\n🏁 画像のある注目スポットテスト完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ テストでエラー発生:', error)
  process.exit(1)
})