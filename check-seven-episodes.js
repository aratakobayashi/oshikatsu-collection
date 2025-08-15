import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getSevenEpisodeDetails() {
  const episodeIds = [
    'd0ed028df4e88ddf6b8332cc5f7feee0',
    'bfbcf27e1684d8edadbd4b8f08d0a2c5',
    'c4d049b0-e836-49fa-aff3-5177f74f6824',
    '5015d9a665716f5a8efd1ae6878649aa',
    'f37f990d-e427-46de-baff-9dbcd0ddfff8',
    '8ff4e5fb-77ef-44d5-bc2a-eab02286a3c2',
    '81401247-0937-4afe-9d6b-1841e3c1d6bd'
  ]
  
  for (let i = 0; i < episodeIds.length; i++) {
    const id = episodeIds[i]
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', id)
      .single()
    
    if (episode) {
      console.log('\n' + '='.repeat(60))
      console.log(`📺 エピソード ${i+1}:`, episode.title)
      console.log('ID:', episode.id)
      console.log('日付:', episode.date?.split('T')[0])
      console.log('説明:', episode.description || 'なし')
      console.log('URL:', episode.video_url)
    }
  }
}

getSevenEpisodeDetails().catch(console.error)