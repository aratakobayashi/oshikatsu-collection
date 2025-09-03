// 🔍 無限スクロールの重複問題詳細調査
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugInfiniteScrollIssue() {
  console.log('🔍 無限スクロール重複問題の調査')
  console.log('===========================')
  
  const ITEMS_PER_PAGE = 12
  
  try {
    // 1. 無限スクロールのシナリオを再現
    console.log('\n1️⃣ 無限スクロールシナリオの再現:')
    
    let allCelebrities = []  // フロントエンドの状態をシミュレート
    const seenIds = new Set() // 重複検出用
    let duplicatesFound = []
    
    // ページ1 (offset: 0)
    console.log('\n📄 ページ1読み込み (offset: 0):')
    const page1 = await supabase
      .from('celebrities')
      .select('id, name, slug, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(0, ITEMS_PER_PAGE - 1)
    
    if (page1.error) {
      console.error('❌ Page 1エラー:', page1.error)
      return
    }
    
    // 初回は直接セット（CelebritiesVirtualized.tsx line 211と同じ）
    allCelebrities = page1.data || []
    console.log(`   取得: ${page1.data?.length}件`)
    console.log(`   累計: ${allCelebrities.length}件`)
    
    // IDを記録
    page1.data?.forEach(celeb => {
      seenIds.add(celeb.id)
    })
    
    // ページ2 (offset: 12) 
    console.log('\n📄 ページ2読み込み (offset: 12):')
    const page2 = await supabase
      .from('celebrities')
      .select('id, name, slug, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(12, 12 + ITEMS_PER_PAGE - 1)
    
    if (page2.error) {
      console.error('❌ Page 2エラー:', page2.error)
      return
    }
    
    // データをマージ（CelebritiesVirtualized.tsx line 213と同じ）
    const beforeLength = allCelebrities.length
    allCelebrities = [...allCelebrities, ...(page2.data || [])]
    console.log(`   取得: ${page2.data?.length}件`)
    console.log(`   累計: ${allCelebrities.length}件 (${beforeLength} + ${page2.data?.length})`)
    
    // 重複チェック
    page2.data?.forEach(celeb => {
      if (seenIds.has(celeb.id)) {
        duplicatesFound.push(celeb)
        console.log(`   🚨 重複発見: ${celeb.name} (ID: ${celeb.id})`)
      } else {
        seenIds.add(celeb.id)
      }
    })
    
    // 2. 重複の詳細分析
    console.log('\n2️⃣ 重複パターンの分析:')
    
    if (duplicatesFound.length > 0) {
      console.log(`❌ 重複検出: ${duplicatesFound.length}件`)
      duplicatesFound.forEach(dup => {
        console.log(`   - ${dup.name} (${dup.created_at})`)
      })
    } else {
      console.log('✅ データレベルでは重複なし')
    }
    
    // 3. 境界値テスト（12件の境界）
    console.log('\n3️⃣ 境界値テスト（ITEMS_PER_PAGE=12の境界）:')
    
    // 11-12境界
    const boundary1 = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(10, 13) // 11番目から14番目
    
    console.log('📍 11番目-14番目:')
    boundary1.data?.forEach((celeb, idx) => {
      console.log(`   ${10 + idx + 1}. ${celeb.name}`)
    })
    
    // 4. 同時実行による競合状態のテスト
    console.log('\n4️⃣ 同時実行テスト (競合状態の確認):')
    
    const queries = [
      supabase.from('celebrities').select('id, name').eq('status', 'active').order('created_at', { ascending: false }).range(0, 11),
      supabase.from('celebrities').select('id, name').eq('status', 'active').order('created_at', { ascending: false }).range(0, 11),
      supabase.from('celebrities').select('id, name').eq('status', 'active').order('created_at', { ascending: false }).range(0, 11)
    ]
    
    const results = await Promise.all(queries)
    
    console.log('同じクエリを3回同時実行:')
    results.forEach((result, idx) => {
      console.log(`   Query ${idx + 1}: ${result.data?.length}件`)
      console.log(`   最初の3人: ${result.data?.slice(0, 3).map(c => c.name).join(', ')}`)
    })
    
    // 結果が全て同じかチェック
    const firstResult = JSON.stringify(results[0].data?.map(c => c.id))
    const allSame = results.every(r => JSON.stringify(r.data?.map(c => c.id)) === firstResult)
    console.log(`   一貫性: ${allSame ? '✅ 全て同じ' : '❌ 結果が異なる'}`)
    
    // 5. 実際のページ表示での推奨対策
    console.log('\n5️⃣ 推奨対策:')
    console.log('=============')
    console.log('A. 重複防止ロジック追加:')
    console.log('   setAllCelebrities(prev => {')
    console.log('     const existingIds = new Set(prev.map(c => c.id))')
    console.log('     const newItems = listData.data.filter(c => !existingIds.has(c.id))')
    console.log('     return [...prev, ...newItems]')
    console.log('   })')
    console.log('')
    console.log('B. キャッシュキー確認:')
    console.log('   useOptimizedFetch のキャッシュが正しく機能しているか確認')
    console.log('')
    console.log('C. React Strict Mode:')
    console.log('   開発モードでuseEffectが2回実行される問題の確認')
    
  } catch (error) {
    console.error('💥 調査中にエラー:', error)
  }
}

debugInfiniteScrollIssue().then(() => {
  console.log('\n🏁 無限スクロール調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})