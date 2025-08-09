/**
 * EpisodeDetail.tsx functionality test
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function testEpisodeDetail() {
  console.log('🔍 EpisodeDetail.tsx functionality test')
  console.log('='.repeat(50))
  
  const episodeId = 'T8i9WGaNkI8'
  
  try {
    console.log('📺 Target Episode ID:', episodeId)
    
    // Test the same queries as EpisodeDetail.tsx
    
    // 1. Episode data
    console.log('\n🔍 Episode basic fetch:')
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select(`
        *,
        celebrities!inner(
          id, name, slug
        )
      `)
      .eq('id', episodeId)
      .single()
      
    if (episodeError) {
      console.log('❌ Episode fetch error:', episodeError.message)
      return
    }
    
    console.log('✅ Episode found:')
    console.log('   Title:', episode.title)
    console.log('   Date:', episode.date)
    console.log('   Celebrity:', episode.celebrities?.name)
    
    // 2. Related locations
    console.log('\n🔍 Related locations fetch:')
    const { data: locationLinks, error: locationError } = await supabase
      .from('episode_locations')
      .select(`
        locations!inner(
          id,
          name,
          slug,
          address,
          description,
          website_url,
          phone,
          tags,
          image_url
        )
      `)
      .eq('episode_id', episodeId)
      
    if (locationError) {
      console.log('❌ Location fetch error:', locationError.message)
    } else {
      const locations = locationLinks?.map(link => link.locations) || []
      console.log('✅ Locations found:', locations.length)
      locations.forEach((location, idx) => {
        console.log(`   ${idx + 1}. ${location.name}`)
        console.log(`      Address: ${location.address || 'N/A'}`)
        console.log(`      Tags: ${location.tags?.join(', ') || 'None'}`)
      })
    }
    
    // 3. Related items
    console.log('\n🔍 Related items fetch:')
    const { data: itemLinks, error: itemError } = await supabase
      .from('episode_items')
      .select(`
        items!inner(
          id,
          name,
          slug,
          brand,
          description,
          category,
          price,
          purchase_url,
          image_url,
          tags
        )
      `)
      .eq('episode_id', episodeId)
      
    if (itemError) {
      console.log('❌ Item fetch error:', itemError.message)
    } else {
      const items = itemLinks?.map(link => link.items) || []
      console.log('✅ Items found:', items.length)
      items.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.name}`)
        console.log(`      Brand: ${item.brand || 'N/A'}`)
        console.log(`      Price: ${item.price ? `¥${item.price.toLocaleString()}` : 'N/A'}`)
        console.log(`      Purchase URL: ${item.purchase_url ? 'Available' : 'N/A'}`)
        console.log(`      Tags: ${item.tags?.join(', ') || 'None'}`)
      })
    }
    
    console.log('\n✅ Test completed successfully!')
    console.log(`📊 Summary: Episode "${episode.title}" has ${locationLinks?.length || 0} locations and ${itemLinks?.length || 0} items`)
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run test
if (import.meta.url === `file://${process.argv[1]}`) {
  testEpisodeDetail().catch(console.error)
}