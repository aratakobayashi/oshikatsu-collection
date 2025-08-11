require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkYoniEpisodes() {
  try {
    // よにのチャンネルのタレントを取得
    const { data: celebrity, error: celError } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', 'yonino-channel')
      .single()
    
    if (celError) {
      console.error('Error fetching celebrity:', celError)
      return
    }
    
    console.log('Celebrity found:', celebrity)
    
    // このタレントのエピソードを取得
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .eq('celebrity_id', celebrity.id)
      .limit(5)
    
    if (epError) {
      console.error('Error fetching episodes:', epError)
      return
    }
    
    console.log(`\nFound ${episodes?.length || 0} episodes for ${celebrity.name}:`)
    
    // 各エピソードのリンクを確認
    for (const episode of episodes || []) {
      console.log(`\nEpisode: ${episode.title}`)
      console.log(`ID: ${episode.id}`)
      
      // ロケーションリンク
      const { data: locLinks } = await supabase
        .from('episode_locations')
        .select('*')
        .eq('episode_id', episode.id)
      
      // アイテムリンク
      const { data: itemLinks } = await supabase
        .from('episode_items')
        .select('*')
        .eq('episode_id', episode.id)
      
      console.log(`- Locations: ${locLinks?.length || 0}`)
      console.log(`- Items: ${itemLinks?.length || 0}`)
    }
    
    // 全体のepisode_locationsとepisode_itemsのカウント
    const { count: totalLocLinks } = await supabase
      .from('episode_locations')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalItemLinks } = await supabase
      .from('episode_items')
      .select('*', { count: 'exact', head: true })
    
    console.log(`\n=== Total in database ===`)
    console.log(`Total episode_locations records: ${totalLocLinks}`)
    console.log(`Total episode_items records: ${totalItemLinks}`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkYoniEpisodes()