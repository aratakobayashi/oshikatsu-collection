require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkEpisodeLinks() {
  try {
    // エピソードデータを取得
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title')
      .limit(10)
    
    if (epError) {
      console.error('Error fetching episodes:', epError)
      return
    }
    
    console.log(`Found ${episodes?.length || 0} episodes`)
    
    // episode_locations テーブルのデータを確認
    const { data: locationLinks, error: locError } = await supabase
      .from('episode_locations')
      .select('*')
      .limit(10)
    
    if (locError) {
      console.error('Error fetching episode_locations:', locError)
    } else {
      console.log(`\nepisode_locations table has ${locationLinks?.length || 0} records:`)
      if (locationLinks && locationLinks.length > 0) {
        console.log('Sample:', locationLinks[0])
      }
    }
    
    // episode_items テーブルのデータを確認
    const { data: itemLinks, error: itemError } = await supabase
      .from('episode_items')
      .select('*')
      .limit(10)
    
    if (itemError) {
      console.error('Error fetching episode_items:', itemError)
    } else {
      console.log(`\nepisode_items table has ${itemLinks?.length || 0} records:`)
      if (itemLinks && itemLinks.length > 0) {
        console.log('Sample:', itemLinks[0])
      }
    }
    
    // 特定のエピソードIDでリンクをチェック
    if (episodes && episodes.length > 0) {
      const testEpisodeId = episodes[0].id
      console.log(`\nChecking links for episode: ${testEpisodeId}`)
      
      const { data: locForEpisode } = await supabase
        .from('episode_locations')
        .select('*')
        .eq('episode_id', testEpisodeId)
      
      const { data: itemsForEpisode } = await supabase
        .from('episode_items')
        .select('*')
        .eq('episode_id', testEpisodeId)
      
      console.log(`- Locations: ${locForEpisode?.length || 0}`)
      console.log(`- Items: ${itemsForEpisode?.length || 0}`)
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkEpisodeLinks()