// エピソードのタグ表示用データを確認
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'

async function checkEpisodeTagsData() {
  console.log('🏷️ エピソードタグ用データ確認')
  console.log('=' .repeat(50))

  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }

  try {
    // 1. よにのちゃんねるのエピソード取得
    console.log('\n📺 よにのちゃんねるエピソード取得中...')
    const episodesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episodes?select=id,title&order=created_at.desc&limit=10`,
      { headers }
    )
    
    const episodes = await episodesResponse.json()
    console.log(`✅ ${episodes.length}件のエピソードを取得`)

    // 2. 各エピソードの関連データを確認
    console.log('\n🔍 エピソード関連データ確認:')
    console.log('-'.repeat(70))

    for (const episode of episodes) {
      console.log(`\n📺 ${episode.title}`)
      
      // ロケーション関連を確認
      const locationsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episode.id}&select=location_id,locations(name)`,
        { headers }
      )
      const locations = await locationsResponse.json()
      
      // アイテム関連を確認
      const itemsResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episode.id}&select=item_id,items(name)`,
        { headers }
      )
      const items = await itemsResponse.json()
      
      const locationCount = locations?.length || 0
      const itemCount = items?.length || 0
      
      console.log(`   📍 ロケーション: ${locationCount}件`)
      if (locationCount > 0) {
        locations.slice(0, 2).forEach(rel => {
          const locationName = rel.locations?.name || '名前不明'
          console.log(`      - ${locationName}`)
        })
        if (locationCount > 2) console.log(`      ... +${locationCount - 2}件`)
      }
      
      console.log(`   🛍️ アイテム: ${itemCount}件`)
      if (itemCount > 0) {
        items.slice(0, 2).forEach(rel => {
          const itemName = rel.items?.name || '名前不明'
          console.log(`      - ${itemName}`)
        })
        if (itemCount > 2) console.log(`      ... +${itemCount - 2}件`)
      }

      // タグ表示予測
      const tags = []
      if (locationCount > 0) tags.push(`📍${locationCount}`)
      if (itemCount > 0) tags.push(`🛍️${itemCount}`)
      
      if (tags.length > 0) {
        console.log(`   🏷️ 表示予定タグ: ${tags.join(' ')}`)
      } else {
        console.log(`   🏷️ タグなし (関連データなし)`)
      }
    }

    // 3. 特にエピソード#135を詳細チェック
    console.log('\n🔍 エピソード#135 詳細チェック:')
    console.log('-'.repeat(50))
    
    const episode135Response = await fetch(
      `${SUPABASE_URL}/rest/v1/episodes?title=ilike.*135*&select=id,title`,
      { headers }
    )
    const episode135Data = await episode135Response.json()
    
    if (episode135Data && episode135Data.length > 0) {
      const episode135 = episode135Data[0]
      console.log(`✅ エピソード#135発見: ${episode135.title}`)
      
      const loc135Response = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episode135.id}&select=*,locations(*)`,
        { headers }
      )
      const locations135 = await loc135Response.json()
      
      console.log(`📍 #135のロケーション関連: ${locations135?.length || 0}件`)
      if (locations135 && locations135.length > 0) {
        locations135.forEach(rel => {
          const location = rel.locations
          console.log(`   - ${location?.name || '名前不明'}`)
          if (location?.address) console.log(`     住所: ${location.address}`)
          if (location?.phone) console.log(`     電話: ${location.phone}`)
        })
        console.log(`✅ #135にはタグが表示されるはずです！`)
      } else {
        console.log(`⚠️ #135に関連データがありません`)
      }
    } else {
      console.log(`⚠️ エピソード#135が見つかりません`)
    }

    // 4. 総合サマリー
    console.log('\n📊 タグ表示サマリー:')
    console.log('='.repeat(50))
    
    let totalEpisodes = 0
    let episodesWithLocations = 0
    let episodesWithItems = 0
    let episodesWithBoth = 0
    
    for (const episode of episodes) {
      totalEpisodes++
      
      const locResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episode.id}&select=count`,
        { headers: { ...headers, 'Prefer': 'count=exact' } }
      )
      const locResult = await locResponse.json()
      const hasLocations = (locResult[0]?.count || 0) > 0
      
      const itemResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/episode_items?episode_id=eq.${episode.id}&select=count`,
        { headers: { ...headers, 'Prefer': 'count=exact' } }
      )
      const itemResult = await itemResponse.json()
      const hasItems = (itemResult[0]?.count || 0) > 0
      
      if (hasLocations) episodesWithLocations++
      if (hasItems) episodesWithItems++
      if (hasLocations && hasItems) episodesWithBoth++
    }
    
    console.log(`📺 確認したエピソード: ${totalEpisodes}件`)
    console.log(`📍 ロケーションタグ付き: ${episodesWithLocations}件`)
    console.log(`🛍️ アイテムタグ付き: ${episodesWithItems}件`)
    console.log(`🏷️ 両方のタグ付き: ${episodesWithBoth}件`)
    console.log(`⚪ タグなし: ${totalEpisodes - Math.max(episodesWithLocations, episodesWithItems)}件`)
    
    if (episodesWithLocations > 0 || episodesWithItems > 0) {
      console.log('\n🎉 タグ表示システムは正常に動作するはずです！')
      console.log('📋 確認先: https://develop--oshikatsu-collection.netlify.app/celebrities/yonino-channel')
    } else {
      console.log('\n⚠️ 関連データが不足している可能性があります')
    }

  } catch (error) {
    console.error('❌ データ確認エラー:', error.message)
  }
}

if (require.main === module) {
  checkEpisodeTagsData()
    .then(() => {
      console.log('\n🏁 確認完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { checkEpisodeTagsData }