import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getThreeEpisodeDetails() {
  const episodeIds = [
    '61b27b5def5549d2e59d027dcc1b4ebc',
    '49ff9eca4d62ce40ed0c2e6b9f3951b6', 
    'f9cf0e8978dae134b5d2b9de2b2cfd3c'
  ]
  
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

getThreeEpisodeDetails().catch(console.error)