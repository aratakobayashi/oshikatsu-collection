// 🔍 Locations API 400エラーの調査
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugLocationsAPI() {
  console.log('🔍 Locations API 400エラー調査')
  console.log('============================')
  
  // 1. locationsテーブルのスキーマ確認
  console.log('\n1️⃣ locationsテーブルのスキーマ確認:')
  try {
    const { data: schemaTest, error: schemaError } = await supabase
      .from('locations')
      .select('*')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ スキーマ取得エラー:', schemaError)
    } else if (schemaTest && schemaTest.length > 0) {
      console.log('✅ 利用可能なカラム:')
      Object.keys(schemaTest[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof schemaTest[0][column]}`)
      })
    }
  } catch (error) {
    console.error('❌ スキーマ確認エラー:', error)
  }
  
  // 2. 問題のクエリを段階的にテスト
  console.log('\n2️⃣ 問題のクエリを段階的にテスト:')
  
  // 基本的なselect
  console.log('\n🔹 基本select...')
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name')
      .limit(3)
    
    if (error) {
      console.error('❌ 基本selectエラー:', error)
    } else {
      console.log(`✅ 基本select成功: ${data?.length || 0}件`)
    }
  } catch (error) {
    console.error('❌ 基本select例外:', error)
  }
  
  // is_featured カラムの確認
  console.log('\n🔹 is_featuredカラム確認...')
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, is_featured')
      .limit(3)
    
    if (error) {
      console.error('❌ is_featuredエラー:', error.message)
      console.log('   → is_featuredカラムが存在しない可能性')
    } else {
      console.log('✅ is_featured確認成功')
      data?.forEach(loc => {
        console.log(`   - ${loc.name}: is_featured = ${loc.is_featured}`)
      })
    }
  } catch (error) {
    console.error('❌ is_featured例外:', error)
  }
  
  // view_count カラムの確認
  console.log('\n🔹 view_countカラム確認...')
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, view_count')
      .limit(3)
    
    if (error) {
      console.error('❌ view_countエラー:', error.message)
      console.log('   → view_countカラムが存在しない可能性')
    } else {
      console.log('✅ view_count確認成功')
      data?.forEach(loc => {
        console.log(`   - ${loc.name}: view_count = ${loc.view_count}`)
      })
    }
  } catch (error) {
    console.error('❌ view_count例外:', error)
  }
  
  // images カラムの確認
  console.log('\n🔹 imagesカラム確認...')
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, images')
      .limit(3)
    
    if (error) {
      console.error('❌ imagesエラー:', error.message)
      console.log('   → imagesカラムの構造に問題がある可能性')
    } else {
      console.log('✅ images確認成功')
      data?.forEach(loc => {
        console.log(`   - ${loc.name}: images = ${JSON.stringify(loc.images)}`)
      })
    }
  } catch (error) {
    console.error('❌ images例外:', error)
  }
  
  // 3. 元の問題クエリを再現
  console.log('\n3️⃣ 元の問題クエリを再現:')
  const problematicQuery = supabase
    .from('locations')
    .select('id,name,address,prefecture,images,category')
    .eq('is_featured', true)
    .order('view_count', { ascending: false })
    .limit(3)
  
  console.log('🔗 クエリURL:', problematicQuery.toString())
  
  try {
    const { data, error } = await problematicQuery
    
    if (error) {
      console.error('❌ 問題クエリエラー:', error)
      console.error('   詳細:', error.details)
      console.error('   ヒント:', error.hint)
    } else {
      console.log('✅ 問題クエリ成功:', data?.length || 0, '件')
    }
  } catch (error) {
    console.error('❌ 問題クエリ例外:', error)
  }
  
  // 4. 代替クエリの提案
  console.log('\n4️⃣ 代替クエリの提案:')
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, address, prefecture, category')
      .order('created_at', { ascending: false })
      .limit(3)
    
    if (error) {
      console.error('❌ 代替クエリエラー:', error)
    } else {
      console.log('✅ 代替クエリ成功:', data?.length || 0, '件')
      console.log('   → is_featuredとview_countなしでも動作')
    }
  } catch (error) {
    console.error('❌ 代替クエリ例外:', error)
  }
}

debugLocationsAPI().then(() => {
  console.log('\n🏁 Locations API 調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})