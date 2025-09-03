// 🔍 /celebritiesページのデータ重複と表示問題の調査
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
)

async function debugCelebritiesPage() {
  console.log('🔍 Celebrities Page データ重複・表示問題の調査')
  console.log('=============================================')
  
  try {
    // 1. 全推しの総数を確認
    console.log('\n1️⃣ 推しデータの基本統計:')
    const { count: totalCount, error: countError } = await supabase
      .from('celebrities')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (countError) {
      console.error('❌ 総数取得エラー:', countError)
    } else {
      console.log(`✅ 総推し数: ${totalCount}人`)
    }

    // 2. useCelebritiesListと同じクエリを段階的にテスト
    console.log('\n2️⃣ 無限スクロールクエリの動作確認:')
    
    const LIMIT = 12
    const pages = [0, 12, 24] // Page 1, 2, 3のオフセット
    
    for (let i = 0; i < pages.length; i++) {
      const offset = pages[i]
      console.log(`\n📄 Page ${i + 1} (offset: ${offset}, limit: ${LIMIT}):`)
      
      const { data, count, error } = await supabase
        .from('celebrities')
        .select('id, name, slug, bio, image_url, view_count, group_name, type, created_at', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + LIMIT - 1)
      
      if (error) {
        console.error(`❌ Page ${i + 1} エラー:`, error)
        continue
      }
      
      console.log(`   取得件数: ${data?.length || 0}件`)
      console.log(`   総数: ${count}`)
      console.log(`   hasMore: ${count ? (offset + LIMIT) < count : false}`)
      
      // 各ページの推しリスト
      data?.forEach((celeb, idx) => {
        const globalIndex = offset + idx + 1
        console.log(`   ${globalIndex}. ${celeb.name} (${celeb.created_at?.substring(0, 10)})`)
      })
      
      // 重複チェック用に最初の数人のIDを記録
      if (i === 0) {
        console.log('\n🔍 Page 1のIDリスト (重複チェック用):')
        const page1Ids = data?.slice(0, 5).map(c => ({ id: c.id, name: c.name })) || []
        console.log('   ', page1Ids)
      }
    }

    // 3. 松重豊と伊藤かりんの検索
    console.log('\n3️⃣ 特定推しの検索:')
    
    const targetNames = ['松重豊', '伊藤かりん']
    
    for (const name of targetNames) {
      console.log(`\n🔍 "${name}" の検索:`)
      
      const { data: searchResult, error: searchError } = await supabase
        .from('celebrities')
        .select('id, name, slug, created_at, view_count')
        .eq('status', 'active')
        .ilike('name', `%${name}%`)
      
      if (searchError) {
        console.error(`❌ ${name} 検索エラー:`, searchError)
        continue
      }
      
      if (searchResult && searchResult.length > 0) {
        searchResult.forEach((celeb, idx) => {
          console.log(`   ${idx + 1}. ${celeb.name}`)
          console.log(`      ID: ${celeb.id}`)
          console.log(`      作成日: ${celeb.created_at}`)
          console.log(`      View Count: ${celeb.view_count || 0}`)
        })
        
        // created_at順での位置を確認
        const { data: allByDate } = await supabase
          .from('celebrities')
          .select('id, name, created_at')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        const position = allByDate?.findIndex(c => c.name.includes(name)) + 1
        console.log(`   📍 created_at順での位置: ${position}番目 (${Math.ceil(position / 12)}ページ目)`)
        
      } else {
        console.log(`   ❌ "${name}" は見つかりませんでした`)
      }
    }

    // 4. 重複の可能性検証
    console.log('\n4️⃣ データ重複の検証:')
    
    // 同じクエリを2回実行して結果を比較
    const query1 = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(0, 11)
    
    const query2 = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(0, 11)
    
    const ids1 = query1.data?.map(c => c.id).sort() || []
    const ids2 = query2.data?.map(c => c.id).sort() || []
    
    const isIdentical = JSON.stringify(ids1) === JSON.stringify(ids2)
    console.log(`   同一クエリの一貫性: ${isIdentical ? '✅ 一致' : '❌ 不一致'}`)
    
    if (!isIdentical) {
      console.log('   📋 Query 1 IDs:', ids1)
      console.log('   📋 Query 2 IDs:', ids2)
    }

  } catch (error) {
    console.error('💥 調査中にエラー:', error)
  }
}

debugCelebritiesPage().then(() => {
  console.log('\n🏁 Celebrities Page調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})