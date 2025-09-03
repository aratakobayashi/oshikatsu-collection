// 🔍 注目スポットの画像データ詳細調査
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugLocationsImages() {
  console.log('🔍 注目スポット画像データ調査')
  console.log('===========================')
  
  // 1. 全locationsの画像関連カラム調査
  console.log('\n1️⃣ 全locationsの画像関連カラム調査:')
  
  try {
    const { data: allLocations, error } = await supabase
      .from('locations')
      .select('id, name, image_url, image_urls')
      .limit(10)
    
    if (error) {
      console.error('❌ 画像調査エラー:', error)
      return
    }
    
    console.log(`📍 調査対象: ${allLocations?.length || 0}件`)
    
    let imageUrlCount = 0
    let imageUrlsCount = 0
    
    allLocations?.forEach((location, index) => {
      console.log(`\n${index + 1}. ${location.name}`)
      console.log(`   image_url: ${location.image_url || 'NULL'}`)
      console.log(`   image_urls: ${location.image_urls ? JSON.stringify(location.image_urls) : 'NULL'}`)
      
      if (location.image_url) imageUrlCount++
      if (location.image_urls) imageUrlsCount++
    })
    
    console.log('\n📊 画像データ統計:')
    console.log(`   image_url 有り: ${imageUrlCount}/${allLocations?.length || 0}件`)
    console.log(`   image_urls 有り: ${imageUrlsCount}/${allLocations?.length || 0}件`)
    
  } catch (error) {
    console.error('❌ 画像調査例外:', error)
  }
  
  // 2. HomeのfeaturedLocationsと同じクエリで画像確認
  console.log('\n2️⃣ Home featuredLocationsの画像データ:')
  
  try {
    const { data: featuredLocations, error } = await supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, website_url, tags')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('❌ Featured locations エラー:', error)
      return
    }
    
    console.log('🏠 Home表示対象の3店舗:')
    
    featuredLocations?.forEach((location, index) => {
      console.log(`\n📍 ${index + 1}. ${location.name}`)
      console.log(`   image_url: ${location.image_url || 'なし'}`)
      console.log(`   image_urls: ${location.image_urls ? JSON.stringify(location.image_urls) : 'なし'}`)
      
      // 利用可能な画像URLをチェック
      const availableImageUrl = location.image_url || (location.image_urls?.[0])
      
      if (availableImageUrl) {
        console.log(`   ✅ 利用可能な画像: ${availableImageUrl}`)
      } else {
        console.log(`   ❌ 画像なし → MapPinアイコンのみ表示`)
      }
    })
    
  } catch (error) {
    console.error('❌ Featured locations例外:', error)
  }
  
  // 3. 画像のあるlocationsを検索
  console.log('\n3️⃣ 画像のあるlocationsを検索:')
  
  try {
    // image_urlがNULLでない場合
    const { data: withImageUrl, error: imageUrlError } = await supabase
      .from('locations')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .limit(5)
    
    if (!imageUrlError && withImageUrl && withImageUrl.length > 0) {
      console.log('\n🖼️ image_urlのあるlocations:')
      withImageUrl.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name} - ${location.image_url}`)
      })
    } else {
      console.log('❌ image_urlのあるlocationsが見つかりません')
    }
    
    // image_urlsがNULLでない場合
    const { data: withImageUrls, error: imageUrlsError } = await supabase
      .from('locations')
      .select('id, name, image_urls')
      .not('image_urls', 'is', null)
      .limit(5)
    
    if (!imageUrlsError && withImageUrls && withImageUrls.length > 0) {
      console.log('\n🖼️ image_urlsのあるlocations:')
      withImageUrls.forEach((location, index) => {
        console.log(`   ${index + 1}. ${location.name} - ${JSON.stringify(location.image_urls)}`)
      })
    } else {
      console.log('❌ image_urlsのあるlocationsが見つかりません')
    }
    
  } catch (error) {
    console.error('❌ 画像検索例外:', error)
  }
  
  // 4. 改善案の提示
  console.log('\n4️⃣ 改善案:')
  console.log('============')
  console.log('A. 画像データが存在しない場合:')
  console.log('   → 現在の実装（MapPinアイコンのみ）が適切')
  console.log('')
  console.log('B. 画像データが存在する場合:')
  console.log('   → HomeBalanced.tsxに画像表示ロジックを追加')
  console.log('   → エピソードサムネイルと同様の実装')
}

debugLocationsImages().then(() => {
  console.log('\n🏁 注目スポット画像データ調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})