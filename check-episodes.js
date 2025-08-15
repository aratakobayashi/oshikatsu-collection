import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getEpisodeDetails() {
  const episodeIds = ['K_MkrrYFgR0', '98ID88V1qnQ']
  
  for (const id of episodeIds) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (episode) {
      console.log('\n' + '='.repeat(60))
      console.log('📺 エピソード:', episode.title)
      console.log('ID:', episode.id)
      console.log('日付:', episode.date?.split('T')[0])
      console.log('説明:', episode.description || 'なし')
      console.log('URL:', episode.video_url)
    }
  }
}

getEpisodeDetails().catch(console.error)