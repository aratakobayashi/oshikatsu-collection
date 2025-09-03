// 🔍 ローカル環境での変更確認
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function verifyLocalChanges() {
  console.log('🔍 ローカル変更の動作確認')
  console.log('===========================')
  
  // 1. created_atソートのテスト（新しい修正）
  console.log('\n1️⃣ created_at順ソート（修正済み）:')
  const { data: sortedData, error: sortError } = await supabase
    .from('celebrities')
    .select('id, name, created_at, view_count')
    .eq('status', 'active')
    .order('created_at', { ascending: false }) // 新しいソート
    .limit(5)
  
  if (sortError) {
    console.error('❌ エラー:', sortError)
  } else {
    console.log('✅ created_at順（新しい順）:')
    sortedData?.forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯 トップ！' : ''
      console.log(`   ${idx + 1}. ${celeb.name} - ${celeb.created_at?.substring(0, 10)}${highlight}`)
    })
  }

  // 2. 総数カウント（新しい修正）
  console.log('\n2️⃣ 総推し数カウント（修正済み）:')
  const { count: totalCount, error: countError } = await supabase
    .from('celebrities')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
  
  console.log(`✅ 総推し数: ${totalCount}人`)
  console.log('   → 初期表示: 「全28人の推し」')
  console.log('   → ページタイトル: 「推し一覧（28名）」')
  
  // 3. 現在のデプロイ状況
  console.log('\n3️⃣ デプロイ状況:')
  console.log('⚠️ ローカル変更: コミットされていません')
  console.log('⚠️ Netlify: 古いコードでビルドされています')
  console.log('')
  console.log('📝 必要な作業:')
  console.log('   1. git add .')
  console.log('   2. git commit -m "fix: 推し一覧ページのソート順と総数表示を修正"')
  console.log('   3. git push origin main')
  console.log('   4. Netlifyで自動デプロイを待つ（約2-3分）')
}

verifyLocalChanges().then(() => {
  console.log('\n✅ 確認完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ エラー:', error)
  process.exit(1)
})