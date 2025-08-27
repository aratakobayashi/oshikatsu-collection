import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function findYoni() {
  // すべてのセレブリティを確認
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name, slug')
    .order('name')

  console.log('🔍 すべてのセレブリティ:')
  celebrities?.forEach(c => {
    if (c.name.includes('よに') || c.name.includes('チャンネル') || c.slug.includes('yoni')) {
      console.log(`✅ ${c.name} (${c.slug}) - ${c.id}`)
    }
  })

  // IDで直接確認
  const knownIds = [
    'UC2alHD2WkakOiTxCxF-uMAg', // YouTube Channel ID形式
    '325f9910-5de0-4eae-afe3-e2b688bdfe8b',
    'ed64611c-a6e5-4b84-a36b-7383b73913d5'
  ]

  for (const id of knownIds) {
    const { data } = await supabase
      .from('celebrities')
      .select('name, slug')
      .eq('id', id)
      .single()
    
    if (data) {
      console.log(`\n📺 ID ${id}:`)
      console.log(`  Name: ${data.name}`)
      console.log(`  Slug: ${data.slug}`)
      
      // このセレブリティのエピソード数確認
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', id)
      
      console.log(`  エピソード数: ${episodes?.length || 0}`)
      
      // episode_locationsの数確認
      if (episodes && episodes.length > 0) {
        const { data: links } = await supabase
          .from('episode_locations')
          .select('episode_id')
          .in('episode_id', episodes.map(e => e.id))
        
        console.log(`  ロケーション紐付け: ${links?.length || 0}件`)
      }
    }
  }
}

findYoni().catch(console.error)