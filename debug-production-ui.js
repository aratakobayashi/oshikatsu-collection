import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function debugProductionUI() {
  console.log('🔍 本番環境UI確認...')
  
  // よにのちゃんねるのセレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id, name, slug')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ Celebrity not found')
    return
  }
  
  console.log('Celebrity:', celebrity)
  
  // エピソード取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, video_url')
    .eq('celebrity_id', celebrity.id)
    .limit(3)
  
  console.log('Episodes:', episodes?.length)
  
  if (episodes && episodes[0]) {
    console.log('\n📺 First Episode:', episodes[0].title)
    console.log('Video URL:', episodes[0].video_url)
    
    // YouTube thumbnail test
    const videoUrl = episodes[0].video_url
    if (videoUrl) {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/
      ]
      
      for (const pattern of patterns) {
        const match = videoUrl.match(pattern)
        if (match && match[1]) {
          const thumbnailUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
          console.log('Generated Thumbnail URL:', thumbnailUrl)
          break
        }
      }
    }
    
    // Episode-Location関係を詳しく確認
    const { data: locationLinks, error } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        location_id,
        locations(
          id,
          name,
          address
        )
      `)
      .eq('episode_id', episodes[0].id)
    
    console.log('\nLocation Links Query:')
    console.log('Error:', error)
    console.log('Data structure:', JSON.stringify(locationLinks, null, 2))
    
    // フロントエンド側と同じデータ処理をシミュレート
    const episodeLinksMap = {}
    episodeLinksMap[episodes[0].id] = { locations: 0, items: 0, locationDetails: [] }
    
    locationLinks?.forEach(link => {
      if (episodeLinksMap[link.episode_id]) {
        episodeLinksMap[link.episode_id].locations++
        if (link.locations) {
          episodeLinksMap[link.episode_id].locationDetails.push(link.locations)
        }
      }
    })
    
    console.log('\nProcessed Episode Links Map:')
    console.log(JSON.stringify(episodeLinksMap, null, 2))
    
    const episodeLinks = episodeLinksMap[episodes[0].id]
    console.log('\nUI Should Show:')
    console.log('- YouTube Thumbnail: ✓')
    console.log(`- Location Details Section: ${episodeLinks.locationDetails && episodeLinks.locationDetails.length > 0 ? '✓' : '❌'}`)
    console.log(`- Store Count: ${episodeLinks.locationDetails?.length || 0}件`)
    
    if (episodeLinks.locationDetails) {
      episodeLinks.locationDetails.slice(0, 3).forEach((location, idx) => {
        console.log(`  ${idx + 1}. ${location.name}`)
        console.log(`     Address: ${location.address}`)
      })
    }
  }
}

debugProductionUI().catch(console.error)