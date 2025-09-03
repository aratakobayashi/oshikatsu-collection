// 🔍 画像フィルタリングクエリのデバッグ
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugImageFilter() {
  console.log('🔍 画像フィルタリングクエリのデバッグ')
  console.log('=================================')
  
  // 1. 現在のクエリの問題を確認
  console.log('\n1️⃣ 現在のORクエリの動作確認:')
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, image_url, image_urls')
      .or('image_url.not.is.null,image_urls.not.is.null')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('❌ ORクエリエラー:', error)
    } else {
      console.log(`✅ ORクエリ結果: ${data?.length || 0}件`)
      
      data?.forEach((loc, index) => {
        console.log(`\n${index + 1}. ${loc.name}`)
        console.log(`   image_url: ${loc.image_url || 'NULL'}`)
        console.log(`   image_urls: ${loc.image_urls ? JSON.stringify(loc.image_urls) : 'NULL'}`)
        
        // 判定ロジックをテスト
        const hasImageUrl = !!loc.image_url
        const hasImageUrls = !!(loc.image_urls && loc.image_urls.length > 0)
        const hasAnyImage = hasImageUrl || hasImageUrls
        
        console.log(`   → image_url有り: ${hasImageUrl}`)
        console.log(`   → image_urls有り: ${hasImageUrls}`)
        console.log(`   → いずれか有り: ${hasAnyImage}`)
      })
    }
    
  } catch (error) {
    console.error('❌ ORクエリ例外:', error)
  }
  
  // 2. 明確に画像のある店舗を検索
  console.log('\n2️⃣ 明確に画像のある店舗を検索:')
  
  try {
    // image_urlのあるもの
    const { data: withImageUrl } = await supabase
      .from('locations')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .limit(3)
    
    console.log(`\n🖼️ image_url有りの店舗: ${withImageUrl?.length || 0}件`)
    withImageUrl?.forEach((loc, i) => {
      console.log(`   ${i+1}. ${loc.name} - ${loc.image_url}`)
    })
    
    // image_urlsのあるもの
    const { data: withImageUrls } = await supabase
      .from('locations')
      .select('id, name, image_urls')
      .not('image_urls', 'is', null)
      .limit(3)
    
    console.log(`\n🖼️ image_urls有りの店舗: ${withImageUrls?.length || 0}件`)
    withImageUrls?.forEach((loc, i) => {
      console.log(`   ${i+1}. ${loc.name} - ${JSON.stringify(loc.image_urls)}`)
    })
    
  } catch (error) {
    console.error('❌ 画像検索例外:', error)
  }
  
  // 3. 正しいクエリの提案とテスト
  console.log('\n3️⃣ 正しいクエリの提案:')
  
  try {
    // Option A: image_urlのある店舗のみ
    const { data: optionA } = await supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, tags')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
    
    console.log(`\n🅰️ Option A (image_url優先): ${optionA?.length || 0}件`)
    optionA?.forEach((loc, i) => {
      console.log(`   ${i+1}. ${loc.name}`)
      console.log(`      画像: ${loc.image_url}`)
      console.log(`      タグ: ${loc.tags?.[0] || '飲食店'}`)
    })
    
    // Option B: image_urlsのある店舗のみ
    const { data: optionB } = await supabase
      .from('locations')
      .select('id, name, address, image_url, image_urls, tags')
      .not('image_urls', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
    
    console.log(`\n🅱️ Option B (image_urls優先): ${optionB?.length || 0}件`)
    optionB?.forEach((loc, i) => {
      console.log(`   ${i+1}. ${loc.name}`)
      console.log(`      画像: ${loc.image_urls?.[0] || 'なし'}`)
      console.log(`      タグ: ${loc.tags?.[0] || '飲食店'}`)
    })
    
    // Option C: 混在クエリ（image_url優先、なければimage_urls）
    console.log(`\n🅲 Option C推奨: より多くの画像のある店舗`)
    
    const allWithImages = [...(optionA || []), ...(optionB || [])]
      .filter((loc, index, arr) => 
        arr.findIndex(l => l.id === loc.id) === index // 重複除去
      )
      .slice(0, 3)
    
    console.log(`   画像のある店舗統合: ${allWithImages.length}件`)
    allWithImages.forEach((loc, i) => {
      const displayImage = loc.image_url || loc.image_urls?.[0]
      console.log(`   ${i+1}. ${loc.name}`)
      console.log(`      表示画像: ${displayImage}`)
      console.log(`      画像ソース: ${loc.image_url ? 'image_url' : 'image_urls'}`)
    })
    
  } catch (error) {
    console.error('❌ 提案クエリ例外:', error)
  }
}

debugImageFilter().then(() => {
  console.log('\n🏁 画像フィルタリングデバッグ完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ デバッグでエラー発生:', error)
  process.exit(1)
})