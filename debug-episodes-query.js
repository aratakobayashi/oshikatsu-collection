import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function debugQuery() {
  console.log('🔍 エピソードクエリのデバッグ...\n')
  
  // 1. セレブリティの確認
  const { data: celebrities, error: celebError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('name', 'よにのちゃんねる')
  
  console.log('👤 セレブリティ検索結果:')
  console.log('Error:', celebError)
  console.log('Data:', celebrities)
  
  if (!celebrities || celebrities.length === 0) {
    console.log('\n❌ よにのちゃんねるが見つかりません')
    
    // 全セレブリティを確認
    const { data: allCelebs } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .limit(10)
    
    console.log('\n📋 存在するセレブリティ:')
    allCelebs?.forEach(celeb => {
      console.log(`- ${celeb.name} (${celeb.slug})`)
    })
    return
  }
  
  const celebrity = celebrities[0]
  console.log(`\n✅ セレブリティ取得成功: ${celebrity.name}`)
  console.log(`ID: ${celebrity.id}`)
  
  // 2. エピソードの確認
  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('id, title, date, celebrity_id')
    .eq('celebrity_id', celebrity.id)
    .limit(10)
  
  console.log('\n📺 エピソード検索結果:')
  console.log('Error:', episodesError)
  console.log('Count:', episodes?.length || 0)
  
  if (episodes && episodes.length > 0) {
    console.log('\n最新5件:')
    episodes.slice(0, 5).forEach((ep, i) => {
      console.log(`${i+1}. ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   日付: ${ep.date}`)
      console.log('')
    })
  }
  
  // 3. 全エピソード数カウント
  const { count, error: countError } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .eq('celebrity_id', celebrity.id)
  
  console.log('\n📊 エピソード総数:')
  console.log('Error:', countError)
  console.log('Count:', count)
  
  // 4. 重複の可能性を直接確認
  console.log('\n🔄 タイトル重複チェック:')
  
  const { data: allTitles } = await supabase
    .from('episodes')
    .select('id, title, date')
    .eq('celebrity_id', celebrity.id)
    .order('title')
  
  if (allTitles) {
    const titleCounts = {}
    allTitles.forEach(ep => {
      const baseTitle = ep.title.replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '').trim()
      titleCounts[baseTitle] = (titleCounts[baseTitle] || 0) + 1
    })
    
    const duplicates = Object.entries(titleCounts).filter(([title, count]) => count > 1)
    console.log(`重複タイトル数: ${duplicates.length}`)
    
    duplicates.slice(0, 5).forEach(([title, count]) => {
      console.log(`• "${title}" - ${count}件`)
    })
  }
}

debugQuery().catch(console.error)