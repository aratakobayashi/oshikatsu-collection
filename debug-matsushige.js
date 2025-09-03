// 🔍 Debug: 松重豊さんのデータ確認
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://awaarykghpylggygkiyp.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMatsushige() {
  console.log('🔍 松重豊さんデータ調査')
  console.log('=======================')

  try {
    // 1. 名前での検索
    console.log('\n1️⃣ 名前「松重豊」で検索...')
    const { data: byName, error: nameError } = await supabase
      .from('celebrities')
      .select('*')
      .ilike('name', '%松重豊%')

    if (nameError) {
      console.error('❌ 名前検索エラー:', nameError)
    } else {
      console.log(`✅ 名前検索結果: ${byName?.length || 0}件`)
      byName?.forEach(celeb => {
        console.log(`  - ${celeb.name} (id: ${celeb.id}, status: ${celeb.status})`)
      })
    }

    // 2. 松重での部分検索  
    console.log('\n2️⃣ 「松重」で部分検索...')
    const { data: byPartial, error: partialError } = await supabase
      .from('celebrities')
      .select('*')
      .ilike('name', '%松重%')

    if (partialError) {
      console.error('❌ 部分検索エラー:', partialError)
    } else {
      console.log(`✅ 部分検索結果: ${byPartial?.length || 0}件`)
      byPartial?.forEach(celeb => {
        console.log(`  - ${celeb.name} (id: ${celeb.id}, slug: ${celeb.slug}, status: ${celeb.status})`)
      })
    }

    // 3. slugでの検索
    console.log('\n3️⃣ slug「matsushige」で検索...')
    const { data: bySlug, error: slugError } = await supabase
      .from('celebrities')
      .select('*')
      .ilike('slug', '%matsushige%')

    if (slugError) {
      console.error('❌ slug検索エラー:', slugError)
    } else {
      console.log(`✅ slug検索結果: ${bySlug?.length || 0}件`)
      bySlug?.forEach(celeb => {
        console.log(`  - ${celeb.name} (${celeb.slug})`)
      })
    }

    // 4. 全celebritiesの中で松重さんがいるか全件チェック
    console.log('\n4️⃣ 全データから松重さんを探索...')
    const { data: allCelebs, error: allError } = await supabase
      .from('celebrities')
      .select('id, name, slug, status')
      .order('name')

    if (allError) {
      console.error('❌ 全データ取得エラー:', allError)
    } else {
      console.log(`✅ 全データ取得: ${allCelebs?.length || 0}件`)
      
      const matsushigeData = allCelebs?.filter(celeb => 
        celeb.name.includes('松重') || 
        celeb.slug.includes('matsushige') ||
        celeb.name.includes('豊')
      )

      if (matsushigeData?.length) {
        console.log('🎯 松重さん関連データ発見:')
        matsushigeData.forEach(celeb => {
          console.log(`  - ${celeb.name} (${celeb.slug}) [${celeb.status}]`)
        })
      } else {
        console.log('❌ 松重さんのデータが見つかりません')
        console.log('📝 先頭10件のサンプル:')
        allCelebs?.slice(0, 10).forEach(celeb => {
          console.log(`  - ${celeb.name} (${celeb.slug})`)
        })
      }
    }

    // 5. 現在のクエリ条件での検索結果チェック
    console.log('\n5️⃣ 現在のクエリ条件での結果確認...')
    const { data: currentQuery, error: currentError } = await supabase
      .from('celebrities')
      .select('id, name, slug, bio, image_url, view_count, group_name, type')
      .order('view_count', { ascending: false })
      .range(0, 11)

    if (currentError) {
      console.error('❌ 現在クエリエラー:', currentError)
    } else {
      console.log(`✅ 現在クエリ結果: ${currentQuery?.length || 0}件`)
      console.log('上位12件:')
      currentQuery?.forEach((celeb, idx) => {
        console.log(`  ${idx + 1}. ${celeb.name} (view_count: ${celeb.view_count})`)
      })
      
      const hasMatsushige = currentQuery?.some(celeb => celeb.name.includes('松重'))
      console.log(`\n🎯 松重さんはTOP12に${hasMatsushige ? '含まれています' : '含まれていません'}`)
    }

  } catch (error) {
    console.error('❌ 調査中にエラー:', error)
  }
}

debugMatsushige().then(() => {
  console.log('\n🏁 調査完了')
  process.exit(0)
}).catch(error => {
  console.error('❌ 調査でエラー発生:', error)
  process.exit(1)
})