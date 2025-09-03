// 🧪 総推し数カウント機能テスト
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testTotalCount() {
  console.log('🧪 総推し数カウント機能テスト')
  console.log('=========================')

  try {
    // 1. 新しいuseTotalCelebritiesCountと同じロジック
    console.log('\n1️⃣ 新機能: 総推し数取得...')
    const { count: totalCount, error: countError } = await supabase
      .from('celebrities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (countError) {
      console.error('❌ 総数取得エラー:', countError)
    } else {
      console.log(`✅ 総推し数: ${totalCount}人`)
    }

    // 2. 従来のロジック（無限スクロール初期読み込み）
    console.log('\n2️⃣ 従来: 初期読み込み数...')
    const { data: initialData, error: initialError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(0, 11) // 初期12件
    
    if (initialError) {
      console.error('❌ 初期データ取得エラー:', initialError)
    } else {
      console.log(`✅ 初期表示数: ${initialData?.length}件`)
      console.log('📋 初期表示される推し:')
      initialData?.forEach((celeb, idx) => {
        console.log(`  ${idx + 1}. ${celeb.name}`)
      })
    }

    // 3. 比較結果
    console.log('\n3️⃣ 修正前後の比較...')
    console.log(`修正前: 「全${initialData?.length}人の推し」`)
    console.log(`修正後: 「全${totalCount}人の推し」`)
    
    if (totalCount && initialData) {
      const difference = totalCount - initialData.length
      console.log(`✅ 改善: ${difference}人分のカウントが正確に表示される`)
      console.log(`📈 表示率: ${((initialData.length / totalCount) * 100).toFixed(1)}% → 100%`)
    }

    // 4. パフォーマンス確認
    console.log('\n4️⃣ パフォーマンスチェック...')
    
    const start = Date.now()
    const { count: perfCount } = await supabase
      .from('celebrities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    const end = Date.now()
    
    console.log(`✅ カウント取得時間: ${end - start}ms`)
    console.log(`✅ HEAD requestで高速化済み（データ本体は取得しない）`)

  } catch (error) {
    console.error('❌ テスト中にエラー:', error)
  }
}

testTotalCount().then(() => {
  console.log('\n🏁 総推し数カウント機能テスト完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ テストでエラー発生:', error)
  process.exit(1)
})