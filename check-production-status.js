import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkProductionStatus() {
  console.log('🔍 本番環境の状態を確認中...\n')
  
  // Check multiple patterns for shorts
  const { data: shorts1 } = await supabase
    .from('episodes')
    .select('id, title')
    .ilike('title', '%shorts%')
    
  const { data: shorts2 } = await supabase
    .from('episodes')
    .select('id, title')
    .ilike('title', '%#shorts%')
    
  const { data: shorts3 } = await supabase
    .from('episodes')
    .select('id, title')
    .or('title.ilike.%ショート%,title.ilike.%Short%')
  
  const allShorts = [...(shorts1 || []), ...(shorts2 || []), ...(shorts3 || [])]
  const uniqueShorts = Array.from(new Map(allShorts.map(s => [s.id, s])).values())
  
  console.log('📱 Shorts検索結果:')
  console.log('  - "shorts"を含む:', shorts1?.length || 0)
  console.log('  - "#shorts"を含む:', shorts2?.length || 0)
  console.log('  - "ショート/Short"を含む:', shorts3?.length || 0)
  console.log('  - 合計ユニーク数:', uniqueShorts.length)
  
  if (uniqueShorts.length > 0) {
    console.log('\n  ⚠️ まだShortsが残っています:')
    uniqueShorts.slice(0, 10).forEach(s => console.log(`    - ${s.title}`))
    if (uniqueShorts.length > 10) {
      console.log(`    ... 他${uniqueShorts.length - 10}件`)
    }
  } else {
    console.log('  ✅ Shortsはすべて削除済み')
  }
  
  // Check specific duplicate
  const { data: dup } = await supabase
    .from('episodes')
    .select('id, title')
    .eq('id', '7b98f022368ab29d1c36a39f2fc644a4')
  
  console.log('\n🔄 重複エピソード確認:')
  console.log('  ID: 7b98f022368ab29d1c36a39f2fc644a4')
  console.log('  存在:', dup && dup.length > 0 ? '❌ まだ存在' : '✅ 削除済み')
  
  // Count total episodes
  const { count } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  console.log('\n📊 本番環境の統計:')
  console.log('  総エピソード数:', count)
  
  // Check recent episodes
  const { data: recent } = await supabase
    .from('episodes')
    .select('title, created_at')
    .order('created_at', { ascending: false })
    .limit(5)
  
  console.log('\n📅 最近のエピソード:')
  recent?.forEach(ep => {
    console.log(`  - ${ep.title}`)
  })
}

checkProductionStatus().catch(console.error)