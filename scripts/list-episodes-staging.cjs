const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

async function listEpisodes() {
  console.log('📺 staging環境のエピソード一覧を取得中...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    // 全エピソードを取得
    const response = await fetch(`${SUPABASE_URL}/rest/v1/episodes?order=date.desc&limit=100`, { headers })
    const episodes = await response.json()
    
    console.log(`\n📊 総エピソード数: ${episodes.length}件\n`)
    
    // 各エピソードのデータ関連状況を確認
    for (let i = 0; i < Math.min(episodes.length, 10); i++) {
      const episode = episodes[i]
      console.log(`${i + 1}. ${episode.title}`)
      console.log(`   ID: ${episode.id}`)
      console.log(`   日付: ${new Date(episode.date).toLocaleDateString()}`)
      
      // アイテム数をチェック
      const itemsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episode.id}`,
        { headers }
      )
      const items = await itemsResponse.json()
      
      // ロケーション数をチェック
      const locationsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episode.id}`,
        { headers }
      )
      const locations = await locationsResponse.json()
      
      console.log(`   🛍️ アイテム: ${items.length}件 📍 ロケーション: ${locations.length}件`)
      
      if (items.length === 0 && locations.length === 0) {
        console.log(`   ⚠️  未処理エピソード`)
      } else {
        console.log(`   ✅ 処理済みエピソード`)
      }
      console.log('')
    }
    
    // 未処理エピソード数をカウント
    let unprocessedCount = 0
    for (const episode of episodes) {
      const itemsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episode.id}`,
        { headers }
      )
      const items = await itemsResponse.json()
      
      if (items.length === 0) {
        unprocessedCount++
      }
    }
    
    console.log(`📋 サマリー:`)
    console.log(`   総エピソード: ${episodes.length}件`)
    console.log(`   未処理エピソード: ${unprocessedCount}件`)
    console.log(`   処理済みエピソード: ${episodes.length - unprocessedCount}件`)
    
    return episodes
    
  } catch (error) {
    console.error('❌ エピソード取得エラー:', error)
    return []
  }
}

listEpisodes()