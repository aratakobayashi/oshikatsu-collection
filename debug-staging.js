import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.staging' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkData() {
  console.log('🔍 Checking staging data...')
  
  // よにのちゃんねるのセレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id, name, slug')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  console.log('Celebrity:', celebrity)
  
  if (!celebrity) {
    console.log('❌ Celebrity not found')
    return
  }
  
  // エピソード取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title')
    .eq('celebrity_id', celebrity.id)
    .limit(3)
  
  console.log('Episodes count:', episodes?.length)
  console.log('Episodes:', episodes?.map(e => ({ id: e.id, title: e.title.slice(0, 50) })))
  
  // 全てのエピソードの関連付け確認
  for (const episode of episodes || []) {
    console.log(`\n📺 Episode: ${episode.title}`)
    
    const { data: locations, error } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        locations(name, address)
      `)
      .eq('episode_id', episode.id)
    
    console.log(`Locations: ${locations?.length || 0}件`)
    locations?.forEach((loc, i) => {
      console.log(`  ${i+1}. ${loc.locations?.name} (${loc.locations?.address})`)
    })
  }
}

checkData().catch(console.error)