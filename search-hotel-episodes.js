import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function searchHotelEpisodes() {
  console.log('🏨 ホテル関連エピソードを検索中...\n')
  
  // よにのちゃんねるのID取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // ホテル関連のキーワードで検索
  const hotelKeywords = ['ホテル', 'ビュッフェ', 'ブッヘ', 'セレブ', 'buffet']
  
  for (const keyword of hotelKeywords) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, description, video_url')
      .eq('celebrity_id', celebrity.id)
      .ilike('title', `%${keyword}%`)
      .order('date', { ascending: false })
      .limit(10)
    
    if (episodes && episodes.length > 0) {
      console.log(`📺 "${keyword}"を含むエピソード:`)
      episodes.forEach(ep => {
        console.log(`  • ${ep.title}`)
        console.log(`    ID: ${ep.id}`)
        if (ep.description && ep.description.length > 0) {
          console.log(`    説明: ${ep.description.substring(0, 100)}...`)
        }
        console.log('')
      })
    }
  }
  
  // ロケーション付きのエピソードからホテル系を探す
  console.log('\n🗺️ ロケーション付きエピソードからホテル系を検索:')
  const { data: locationEpisodes } = await supabase
    .from('episode_locations')
    .select(`
      episodes!inner(id, title),
      locations!inner(name, address)
    `)
    .eq('episodes.celebrity_id', celebrity.id)
  
  if (locationEpisodes) {
    const hotelLocations = locationEpisodes.filter(item => {
      const locationName = item.locations.name.toLowerCase()
      const episodeTitle = item.episodes.title.toLowerCase()
      return locationName.includes('ホテル') || 
             locationName.includes('hotel') ||
             episodeTitle.includes('ホテル') ||
             episodeTitle.includes('ブッヘ') ||
             episodeTitle.includes('ビュッフェ')
    })
    
    if (hotelLocations.length > 0) {
      console.log('既存のホテル系ロケーション:')
      hotelLocations.forEach(item => {
        console.log(`  • ${item.locations.name}`)
        console.log(`    住所: ${item.locations.address}`)
        console.log(`    エピソード: ${item.episodes.title}`)
        console.log('')
      })
    } else {
      console.log('  ホテル系のロケーションはまだ登録されていません')
    }
  }
}

searchHotelEpisodes().catch(console.error)