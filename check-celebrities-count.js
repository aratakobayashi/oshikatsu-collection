// 📊 celebritiesテーブルの正確な状態確認
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function checkCelebritiesCount() {
  console.log('📊 celebritiesテーブル詳細確認')
  console.log('================================')
  
  // 1. 全体の行数（statusに関係なく）
  const { count: totalCount, error: totalError } = await supabase
    .from('celebrities')
    .select('id', { count: 'exact', head: true })
  
  console.log('\n1️⃣ 全行数（status関係なし）:')
  console.log(`   合計: ${totalCount}行`)
  
  // 2. アクティブな行数
  const { count: activeCount, error: activeError } = await supabase
    .from('celebrities')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  
  console.log('\n2️⃣ アクティブな行数:')
  console.log(`   active: ${activeCount}行`)
  
  // 3. status別の内訳
  const { data: statusBreakdown, error: statusError } = await supabase
    .from('celebrities')
    .select('status')
  
  if (statusBreakdown) {
    const statusMap = {}
    statusBreakdown.forEach(row => {
      statusMap[row.status || 'null'] = (statusMap[row.status || 'null'] || 0) + 1
    })
    
    console.log('\n3️⃣ status別内訳:')
    Object.entries(statusMap).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}行`)
    })
  }
  
  // 4. ユニークID確認
  const { data: allIds, error: idError } = await supabase
    .from('celebrities')
    .select('id')
  
  if (allIds) {
    const uniqueIds = new Set(allIds.map(row => row.id))
    console.log('\n4️⃣ ユニークID確認:')
    console.log(`   取得行数: ${allIds.length}行`)
    console.log(`   ユニークID数: ${uniqueIds.size}個`)
    console.log(`   重複: ${allIds.length === uniqueIds.size ? 'なし ✅' : 'あり ⚠️'}`)
  }
  
  // 5. 最新5件のサンプル
  const { data: samples, error: sampleError } = await supabase
    .from('celebrities')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (samples) {
    console.log('\n5️⃣ 最新5件:')
    samples.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.name} (${row.status}) - ${row.created_at?.substring(0, 10)}`)
    })
  }
  
  // 6. 松重豊の確認
  const { data: matsushige, error: matsushigeError } = await supabase
    .from('celebrities')
    .select('id, name, status, created_at')
    .ilike('name', '%松重%')
  
  console.log('\n6️⃣ 松重豊の存在確認:')
  if (matsushige && matsushige.length > 0) {
    matsushige.forEach(row => {
      console.log(`   ✅ ${row.name} (${row.status}) - ID: ${row.id}`)
    })
  } else {
    console.log('   ❌ 松重豊は見つかりません')
  }
}

checkCelebritiesCount().then(() => {
  console.log('\n✅ 確認完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ エラー:', error)
  process.exit(1)
})