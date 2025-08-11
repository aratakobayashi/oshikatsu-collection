const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

async function checkEpisodeData() {
  console.log('🔍 Checking episode data in staging database...')
  
  const episodeId = '2980be96c4233ace51ce1be96b48f5e0'
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    // 1. エピソードの確認
    console.log('📺 Checking episode...')
    const episodeResponse = await fetch(`${SUPABASE_URL}/rest/v1/episodes?id=eq.${episodeId}`, { headers })
    const episodes = await episodeResponse.json()
    console.log(`   Episodes found: ${episodes.length}`)
    if (episodes.length > 0) {
      console.log(`   Episode: ${episodes[0].title}`)
    }
    
    // 2. アイテムの確認
    console.log('\n🛍️ Checking items...')
    const itemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/items?name=ilike.*よにの着用*`, { headers })
    const items = await itemsResponse.json()
    console.log(`   Items found: ${items.length}`)
    items.forEach(item => {
      console.log(`   - ${item.name} (slug: ${item.slug})`)
    })
    
    // 3. ロケーションの確認
    console.log('\n📍 Checking locations...')
    const locationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations?name=ilike.*#277*`, { headers })
    const locations = await locationsResponse.json()
    console.log(`   Locations found: ${locations.length}`)
    locations.forEach(location => {
      console.log(`   - ${location.name} (slug: ${location.slug})`)
    })
    
    // 4. episode_itemsテーブルの確認
    console.log('\n🔗 Checking episode_items relations...')
    const episodeItemsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episodeId}`, { headers })
    const episodeItems = await episodeItemsResponse.json()
    console.log(`   Episode-item relations found: ${episodeItems.length}`)
    episodeItems.forEach(relation => {
      console.log(`   - Episode: ${relation.episode_id} -> Item: ${relation.item_id}`)
    })
    
    // 5. episode_locationsテーブルの確認
    console.log('\n🔗 Checking episode_locations relations...')
    const episodeLocationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episodeId}`, { headers })
    const episodeLocations = await episodeLocationsResponse.json()
    console.log(`   Episode-location relations found: ${episodeLocations.length}`)
    episodeLocations.forEach(relation => {
      console.log(`   - Episode: ${relation.episode_id} -> Location: ${relation.location_id}`)
    })
    
    // 6. JOINクエリのテスト（フロントエンドと同じクエリ）
    console.log('\n🔍 Testing JOIN queries (same as frontend)...')
    
    // ロケーションJOINクエリ
    const locationJoinResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episodeId}&select=locations!inner(id,name,slug,address,description,website_url,phone,tags,image_url)`,
      { headers }
    )
    const locationLinks = await locationJoinResponse.json()
    console.log(`   Location JOIN results: ${locationLinks.length}`)
    locationLinks.forEach(link => {
      console.log(`   - ${link.locations.name}`)
    })
    
    // アイテムJOINクエリ
    const itemJoinResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episodeId}&select=items!inner(id,name,slug,brand,description,category,price,purchase_url,image_url,tags)`,
      { headers }
    )
    const itemLinks = await itemJoinResponse.json()
    console.log(`   Item JOIN results: ${itemLinks.length}`)
    itemLinks.forEach(link => {
      console.log(`   - ${link.items.name}`)
    })
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  }
}

checkEpisodeData()