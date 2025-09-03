// 🔧 ソート条件テスト - 松重豊さんが表示されるか確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSortMethods() {
  console.log('🧪 ソート方法テスト')
  console.log('===================')

  // 方法1: 現在のソート（問題あり）
  console.log('\n❌ 現在のソート (view_count DESC):')
  const { data: current } = await supabase
    .from('celebrities')
    .select('id, name, view_count')
    .eq('status', 'active')
    .order('view_count', { ascending: false })
    .limit(15)

  current?.forEach((celeb, idx) => {
    const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
    console.log(`  ${idx + 1}. ${celeb.name} (${celeb.view_count})${highlight}`)
  })

  // 方法2: COALESCE使用（推奨）
  console.log('\n✅ 改良版ソート (COALESCE + name):')
  const { data: improved } = await supabase
    .rpc('get_celebrities_sorted', {})
    .limit(15)
  
  if (!improved) {
    // RPCが使えない場合の代替方法
    console.log('RPC使用不可、代替ソートを使用...')
    const { data: alternative } = await supabase
      .from('celebrities')
      .select('id, name, view_count, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false }) // 作成日時順
      .limit(15)

    alternative?.forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
      console.log(`  ${idx + 1}. ${celeb.name} (created: ${celeb.created_at?.substring(0, 10)})${highlight}`)
    })
  } else {
    improved?.forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
      console.log(`  ${idx + 1}. ${celeb.name} (${celeb.view_count})${highlight}`)
    })
  }

  // 方法3: 名前順ソート（松重さんが確実に表示される）
  console.log('\n📝 名前順ソート (松重さん確認用):')
  const { data: byName } = await supabase
    .from('celebrities')
    .select('id, name, view_count')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(15)

  byName?.forEach((celeb, idx) => {
    const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
    console.log(`  ${idx + 1}. ${celeb.name} (${celeb.view_count})${highlight}`)
  })

  console.log('\n🎯 推奨解決策:')
  console.log('1. created_at順 (新しい順) - 最新の推しが上位に')
  console.log('2. name順 (五十音順) - すべての推しが平等に表示')
  console.log('3. view_countのデフォルト値設定 - 長期的な解決')
}

testSortMethods().then(() => {
  process.exit(0)
}).catch(error => {
  console.error('エラー:', error)
  process.exit(1)
})