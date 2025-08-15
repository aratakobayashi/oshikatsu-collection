import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function analyzeTimeline() {
  console.log('📅 同時期の動画分析...\n')
  
  const targetDate = '2025-07-13' // ホテルブッヘ動画の日付
  const targetEpisodeId = 'br-iF9GUpIE'
  
  // よにのちゃんねるのID取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) return
  
  // 前後1週間のエピソードを取得
  const { data: nearbyEpisodes } = await supabase
    .from('episodes')
    .select('id, title, date, video_url')
    .eq('celebrity_id', celebrity.id)
    .gte('date', '2025-07-06')
    .lte('date', '2025-07-20')
    .order('date', { ascending: true })
  
  console.log('🎬 同時期のエピソード:')
  console.log('=====================================')
  
  nearbyEpisodes?.forEach(ep => {
    const isTarget = ep.id === targetEpisodeId
    const marker = isTarget ? '👑 [TARGET]' : '  '
    
    console.log(`${marker} ${ep.date.split('T')[0]} - ${ep.title}`)
    if (isTarget) {
      console.log(`    ID: ${ep.id}`)
      console.log(`    URL: ${ep.video_url}`)
    }
  })
  
  // ロケーション付きエピソードの地理的パターン分析
  console.log('\n🗺️ 同時期のロケーション付きエピソード:')
  console.log('=====================================')
  
  const { data: locationEpisodes } = await supabase
    .from('episode_locations')
    .select(`
      episodes!inner(id, title, date),
      locations!inner(name, address)
    `)
    .eq('episodes.celebrity_id', celebrity.id)
    .gte('episodes.date', '2025-07-01')
    .lte('episodes.date', '2025-07-31')
    .order('episodes.date', { ascending: true })
  
  if (locationEpisodes?.length) {
    locationEpisodes.forEach(item => {
      console.log(`📍 ${item.episodes.date.split('T')[0]} - ${item.episodes.title}`)
      console.log(`   → ${item.locations.name}`)
      console.log(`     ${item.locations.address}`)
      console.log()
    })
    
    // 地域分析
    const areas = locationEpisodes.map(item => {
      const address = item.locations.address
      if (address.includes('千代田区')) return '千代田区（皇居周辺）'
      if (address.includes('港区')) return '港区（六本木・赤坂）'
      if (address.includes('新宿区')) return '新宿区'
      if (address.includes('渋谷区')) return '渋谷区'
      if (address.includes('中央区')) return '中央区（銀座・築地）'
      return '東京都内'
    })
    
    const areaCount = areas.reduce((acc, area) => {
      acc[area] = (acc[area] || 0) + 1
      return acc
    }, {})
    
    console.log('📊 活動エリア分析:')
    Object.entries(areaCount).forEach(([area, count]) => {
      console.log(`   ${area}: ${count}回`)
    })
    
    console.log('\n💡 推測:')
    console.log('同時期の活動パターンから、以下のホテルが有力:')
    if (areaCount['千代田区（皇居周辺）']) {
      console.log('• 帝国ホテル東京（千代田区内幸町）← 最有力！')
    }
    if (areaCount['千代田区（皇居周辺）'] || areaCount['港区（六本木・赤坂）']) {
      console.log('• ホテルニューオータニ東京（千代田区紀尾井町）')
    }
    if (areaCount['港区（六本木・赤坂）']) {
      console.log('• グランドハイアット東京（港区六本木）')
    }
  } else {
    console.log('同時期のロケーション情報なし')
  }
}

analyzeTimeline().catch(console.error)