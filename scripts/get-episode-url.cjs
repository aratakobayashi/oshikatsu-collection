require('dotenv').config({ path: '.env.staging' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getEpisodeUrl() {
  try {
    // よにのチャンネルのエピソードを1つ取得
    const { data: episodes, error } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id, video_url, thumbnail_url, view_count, duration_minutes')
      .limit(3)
    
    if (error) {
      console.error('Error:', error)
      return
    }
    
    if (episodes && episodes.length > 0) {
      console.log('📺 エピソード詳細ページのURL例:\n')
      episodes.forEach(ep => {
        console.log(`タイトル: ${ep.title}`)
        console.log(`Staging: https://develop--oshikatsu-collection.netlify.app/episodes/${ep.id}`)
        console.log(`Production: https://oshikatsu-collection.netlify.app/episodes/${ep.id}`)
        console.log(`Video URL: ${ep.video_url || 'なし'}`)
        console.log(`Thumbnail: ${ep.thumbnail_url || 'なし'}`)
        console.log(`Views: ${ep.view_count || 0}`)
        console.log(`Duration: ${ep.duration_minutes || 0}分`)
        console.log('---')
      })
    } else {
      console.log('エピソードが見つかりません')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

getEpisodeUrl()