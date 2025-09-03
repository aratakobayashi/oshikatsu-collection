// 🔍 フロントエンド状態デバッグ - 重複・松重豊問題調査
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFrontendState() {
  console.log('🔍 フロントエンド状態デバッグ')
  console.log('===========================')

  try {
    // 1. 無限スクロールシミュレーション（実際のフロントエンドロジック）
    console.log('\n1️⃣ 無限スクロール動作シミュレーション...')
    
    let allCelebrities = []
    const ITEMS_PER_PAGE = 12
    
    // Page 1 (offset 0)
    console.log('📄 Page 1 取得 (offset: 0, limit: 12)')
    const { data: page1, error: page1Error } = await supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, view_count, group_name, type, created_at')
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(0, ITEMS_PER_PAGE - 1)
    
    if (page1Error) {
      console.error('❌ Page 1 エラー:', page1Error)
      return
    }
    
    console.log(`✅ Page 1: ${page1.length}件取得`)
    allCelebrities = [...page1]
    
    console.log('📋 Page 1 内容:')
    page1.forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
      console.log(`  ${idx + 1}. ${celeb.name} (${celeb.id.substring(0, 8)}...)${highlight}`)
    })

    // Page 2 (offset 12)  
    console.log('\n📄 Page 2 取得 (offset: 12, limit: 12)')
    const { data: page2, error: page2Error } = await supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, view_count, group_name, type, created_at')
      .eq('status', 'active')
      .order('view_count', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(ITEMS_PER_PAGE, (ITEMS_PER_PAGE * 2) - 1)
    
    if (page2Error) {
      console.error('❌ Page 2 エラー:', page2Error)
      return
    }
    
    console.log(`✅ Page 2: ${page2.length}件取得`)
    allCelebrities = [...allCelebrities, ...page2]
    
    console.log('📋 Page 2 内容:')
    page2.forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
      console.log(`  ${idx + 13}. ${celeb.name} (${celeb.id.substring(0, 8)}...)${highlight}`)
    })

    // 2. 重複チェック
    console.log('\n2️⃣ 重複チェック...')
    const idMap = new Map()
    const nameMap = new Map()
    
    allCelebrities.forEach((celeb, index) => {
      // ID重複
      if (idMap.has(celeb.id)) {
        console.log(`⚠️ ID重複発見: ${celeb.name} (${celeb.id})`)
        console.log(`  既存: index ${idMap.get(celeb.id)}, 新規: index ${index}`)
      } else {
        idMap.set(celeb.id, index)
      }
      
      // 名前重複
      if (nameMap.has(celeb.name)) {
        console.log(`⚠️ 名前重複発見: ${celeb.name}`)
        console.log(`  既存ID: ${nameMap.get(celeb.name)}, 新規ID: ${celeb.id}`)
      } else {
        nameMap.set(celeb.name, celeb.id)
      }
    })

    // 3. 松重豊チェック
    console.log('\n3️⃣ 松重豊存在チェック...')
    const matsushigeInResults = allCelebrities.find(celeb => celeb.name.includes('松重'))
    
    if (matsushigeInResults) {
      console.log(`✅ 松重豊発見: ${matsushigeInResults.name}`)
      console.log(`   ID: ${matsushigeInResults.id}`)
      console.log(`   位置: ${allCelebrities.findIndex(c => c.id === matsushigeInResults.id) + 1}番目`)
      console.log(`   view_count: ${matsushigeInResults.view_count}`)
      console.log(`   created_at: ${matsushigeInResults.created_at}`)
    } else {
      console.log('❌ 松重豊が見つかりません')
      
      // 全データから松重豊を検索
      console.log('\n🔍 全データから松重豊を再検索...')
      const { data: allData, error: allError } = await supabase
        .from('celebrities')
        .select('id, name, created_at, view_count, status')
        .ilike('name', '%松重%')
      
      if (allError) {
        console.error('❌ 全検索エラー:', allError)
      } else {
        console.log(`📊 全データ松重検索結果: ${allData.length}件`)
        allData.forEach(celeb => {
          console.log(`  - ${celeb.name} (${celeb.status}) created: ${celeb.created_at?.substring(0, 10)}`)
        })
      }
    }

    // 4. 統計情報
    console.log('\n4️⃣ 統計情報...')
    console.log(`📊 合計取得件数: ${allCelebrities.length}件`)
    console.log(`📊 ユニークID数: ${idMap.size}件`)
    console.log(`📊 ユニーク名前数: ${nameMap.size}件`)
    
    if (allCelebrities.length !== idMap.size) {
      console.log('⚠️ ID重複が存在します')
    }
    
    if (allCelebrities.length !== nameMap.size) {
      console.log('⚠️ 名前重複が存在します')
    }

    // 5. 実際のUIに表示される順序
    console.log('\n5️⃣ UI表示順序（最初の15件）...')
    allCelebrities.slice(0, 15).forEach((celeb, idx) => {
      const highlight = celeb.name.includes('松重') ? ' 🎯' : ''
      console.log(`  ${idx + 1}. ${celeb.name}${highlight}`)
    })

  } catch (error) {
    console.error('❌ デバッグ中にエラー:', error)
  }
}

debugFrontendState().then(() => {
  console.log('\n🏁 フロントエンド状態デバッグ完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ デバッグでエラー発生:', error)
  process.exit(1)
})