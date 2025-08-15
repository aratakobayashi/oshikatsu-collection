import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function getSevenNewEpisodeDetails() {
  const episodeIds = [
    '86799d4f-1920-4127-acc9-42d407e42ec9',
    'ce3da578-2d47-4dfc-b6ca-6ca1879e738f',
    '2408c30454006f447141bd6716a86fe1',
    '0b730e4b-9d9f-46f2-980a-7a2c6e9e4b2f',
    '6e421778-47ef-4e2f-ab75-0d1491904c97',
    '5379e158-84e9-4ff6-bc5a-655b75c5e4c7',
    'b50e1f53-8083-49ca-8382-31293b68a142'
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

getSevenNewEpisodeDetails().catch(console.error)