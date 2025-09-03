// 🔍 推し一覧の重複問題調査
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugDuplicateCelebrities() {
  console.log('🔍 推し一覧重複問題調査')
  console.log('========================')

  try {
    // 1. 総数確認（ユニーク）
    console.log('\n1️⃣ 総数確認...')
    const { count: totalCount, error: countError } = await supabase
      .from('celebrities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    if (countError) {
      console.error('❌ 総数取得エラー:', countError)
    } else {
      console.log(`✅ アクティブな推し総数: ${totalCount}人`)
    }

    // 2. 重複チェック（name基準）
    console.log('\n2️⃣ 名前による重複チェック...')
    const { data: allCelebs, error: allError } = await supabase
      .from('celebrities')
      .select('name, id')
      .eq('status', 'active')

    if (allError) {
      console.error('❌ 全データ取得エラー:', allError)
    } else {
      const nameMap = new Map()
      allCelebs?.forEach(celeb => {
        const existing = nameMap.get(celeb.name) || []
        existing.push(celeb.id)
        nameMap.set(celeb.name, existing)
      })
      
      const duplicates = Array.from(nameMap.entries()).filter(([name, ids]) => ids.length > 1)
      if (duplicates.length > 0) {
        console.log('⚠️ 名前が重複している推し:')
        duplicates.forEach(([name, ids]) => {
          console.log(`  - ${name}: ${ids.length}回 (IDs: ${ids.join(', ')})`)
        })
      } else {
        console.log('✅ 名前による重複はありません')
      }
    }

    // 3. 実際のクエリ結果チェック（現在の表示）
    console.log('\n3️⃣ 現在のクエリ結果（上位20件）...')
    const { data: currentResults, error: queryError, count: queryCount } = await supabase
      .from('celebrities')
      .select('id, name, slug, created_at', { count: 'exact' })
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(0, 19)

    if (queryError) {
      console.error('❌ クエリエラー:', queryError)
    } else {
      console.log(`✅ クエリ結果: ${currentResults?.length}件表示 (全${queryCount}件中)`)
      console.log('\n📋 現在の表示順:')
      currentResults?.forEach((celeb, idx) => {
        console.log(`  ${idx + 1}. ${celeb.name} (${celeb.slug}) [${celeb.created_at?.substring(0, 10)}]`)
      })
      
      // 名前重複チェック
      const nameMap = new Map()
      currentResults?.forEach(celeb => {
        const count = nameMap.get(celeb.name) || 0
        nameMap.set(celeb.name, count + 1)
      })
      
      const duplicates = Array.from(nameMap.entries()).filter(([name, count]) => count > 1)
      if (duplicates.length > 0) {
        console.log('\n⚠️ 現在の表示内で重複している名前:')
        duplicates.forEach(([name, count]) => {
          console.log(`  - ${name}: ${count}回`)
        })
      } else {
        console.log('\n✅ 現在の表示内に重複はありません')
      }
    }

    // 4. ID重複チェック
    console.log('\n4️⃣ ID重複チェック...')
    const { data: allIds, error: idError } = await supabase
      .from('celebrities')
      .select('id')
      .eq('status', 'active')

    if (idError) {
      console.error('❌ ID取得エラー:', idError)
    } else {
      const idSet = new Set()
      const duplicateIds = []
      
      allIds?.forEach(item => {
        if (idSet.has(item.id)) {
          duplicateIds.push(item.id)
        } else {
          idSet.add(item.id)
        }
      })
      
      if (duplicateIds.length > 0) {
        console.log('⚠️ 重複しているID:')
        duplicateIds.forEach(id => console.log(`  - ${id}`))
      } else {
        console.log('✅ IDの重複はありません（データ整合性OK）')
      }
    }

    // 5. ページング問題チェック
    console.log('\n5️⃣ ページング動作チェック...')
    
    // 1ページ目
    const { data: page1, count: p1Count } = await supabase
      .from('celebrities')
      .select('id, name', { count: 'exact' })
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(0, 11)

    // 2ページ目  
    const { data: page2, count: p2Count } = await supabase
      .from('celebrities')
      .select('id, name', { count: 'exact' })
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(12, 23)

    console.log(`✅ 1ページ目: ${page1?.length}件 (全${p1Count}件中)`)
    console.log(`✅ 2ページ目: ${page2?.length}件 (全${p2Count}件中)`)
    
    // 重複チェック
    const page1Ids = new Set(page1?.map(c => c.id) || [])
    const page2Overlapping = page2?.filter(c => page1Ids.has(c.id)) || []
    
    if (page2Overlapping.length > 0) {
      console.log('⚠️ ページ間で重複している推し:')
      page2Overlapping.forEach(celeb => {
        console.log(`  - ${celeb.name} (${celeb.id})`)
      })
    } else {
      console.log('✅ ページ間の重複はありません')
    }

  } catch (error) {
    console.error('❌ 調査中にエラー:', error)
  }
}

debugDuplicateCelebrities().then(() => {
  console.log('\n🏁 重複問題調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})