const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

const crypto = require('crypto')

function generateId() {
  return crypto.randomUUID()
}

async function addSampleRelations() {
  console.log('🎯 サンプル関連データを追加...\n')

  try {
    // 1. 既存データを取得
    console.log('📋 既存データを確認中...')
    
    // 人気エピソード5つを取得
    const episodesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/episodes?select=id,title&order=view_count.desc&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const episodes = await episodesRes.json()
    
    // アイテムを取得
    const itemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/items?select=id,name`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const items = await itemsRes.json()
    
    // ロケーションを取得
    const locationsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/locations?select=id,name`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const locations = await locationsRes.json()

    console.log(`✅ エピソード: ${episodes.length}件`)
    console.log(`✅ アイテム: ${items.length}件`)
    console.log(`✅ ロケーション: ${locations.length}件\n`)

    if (episodes.length === 0 || items.length === 0 || locations.length === 0) {
      console.log('❌ 十分なデータがありません。先にマスターデータを追加してください。')
      return
    }

    // 2. エピソード-アイテムの関連を追加
    console.log('👗 エピソード-アイテム関連を追加中...')
    
    const episodeItems = [
      {
        id: generateId(),
        episode_id: episodes[0]?.id, // 最も人気のエピソード
        item_id: items[0]?.id, // 最初のアイテム
        timestamp_seconds: 30,
        scene_description: 'オープニングシーンで着用',
        is_featured: true,
        confidence_level: 'confirmed'
      },
      {
        id: generateId(),
        episode_id: episodes[0]?.id,
        item_id: items[1]?.id, // 2番目のアイテム（存在する場合）
        timestamp_seconds: 180,
        scene_description: 'メインシーンで使用',
        is_featured: false,
        confidence_level: 'likely'
      }
    ]

    // items[1]が存在する場合のみ2番目の関連を追加
    const validEpisodeItems = episodeItems.filter(item => item.item_id)

    for (const relation of validEpisodeItems) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_items`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(relation)
      })

      if (response.ok) {
        console.log(`   ✅ 関連追加: ${episodes[0]?.title.substring(0, 30)}... ← ${items.find(i => i.id === relation.item_id)?.name}`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️  関連追加失敗: ${error}`)
      }
    }

    // 3. エピソード-ロケーションの関連を追加
    console.log('\n📍 エピソード-ロケーション関連を追加中...')
    
    const episodeLocations = [
      {
        id: generateId(),
        episode_id: episodes[0]?.id, // 最も人気のエピソード
        location_id: locations[0]?.id, // 最初のロケーション
        scene_description: '朝食シーンで訪問',
        is_main_location: true
      },
      {
        id: generateId(),
        episode_id: episodes[1]?.id || episodes[0]?.id, // 2番目のエピソード
        location_id: locations[1]?.id || locations[0]?.id, // 2番目のロケーション
        scene_description: 'ドライブ先として訪問',
        is_main_location: false
      }
    ]

    for (const relation of episodeLocations) {
      if (!relation.episode_id || !relation.location_id) continue

      const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(relation)
      })

      if (response.ok) {
        const episode = episodes.find(e => e.id === relation.episode_id)
        const location = locations.find(l => l.id === relation.location_id)
        console.log(`   ✅ 関連追加: ${episode?.title.substring(0, 30)}... ← ${location?.name}`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️  関連追加失敗: ${error}`)
      }
    }

    // 4. 結果確認
    console.log('\n📊 追加結果を確認中...')
    
    const itemRelationsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_items?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const itemRelations = await itemRelationsRes.json()

    const locationRelationsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_locations?select=*`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const locationRelations = await locationRelationsRes.json()

    console.log(`✅ episode_items: ${itemRelations.length}件`)
    console.log(`✅ episode_locations: ${locationRelations.length}件`)

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
addSampleRelations()
  .then(() => {
    console.log('\n🎉 サンプル関連データの追加完了！')
    console.log('\n📋 次のステップ:')
    console.log('1. エピソード詳細ページで関連アイテム・ロケーションが表示されるか確認')
    console.log('2. 人気エピソードのページをチェック')
    console.log('3. https://develop--oshikatsu-collection.netlify.app/episodes/[ID]')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })