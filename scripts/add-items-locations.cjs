const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

const crypto = require('crypto')

function generateId(name) {
  return crypto.createHash('md5').update(name + Date.now()).digest('hex')
}

async function addItemsAndLocations() {
  console.log('🎯 アイテム・ロケーション情報を追加...\n')

  try {
    // 1. 人気エピソードを取得
    const episodesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episodes?select=id,title&order=view_count.desc.nullslast&limit=10`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    )
    const episodes = await episodesResponse.json()
    console.log(`📋 人気エピソードTOP10を取得\n`)

    // 2. ロケーション情報を追加（朝食シリーズなど）
    const locations = [
      {
        id: generateId('スシロー'),
        name: 'スシロー',
        description: '#248【朝食シリーズ】で訪問。朝からお寿司を楽しむよにのメンバーの定番スポット',
        category: 'restaurant',
        address: '東京都内各店舗',
        google_place_id: null,
        lat: 35.6762,
        lng: 139.6503,
        episode_ids: episodes.filter(ep => ep.title.includes('スシロー')).map(ep => ep.id)
      },
      {
        id: generateId('焼肉店（朝焼肉）'),
        name: '焼肉店（朝焼肉）',
        description: '#446【朝食!!】肉肉肉肉肉肉肉日で訪問。朝から焼肉を楽しむ贅沢な時間',
        category: 'restaurant',
        address: '東京都内',
        google_place_id: null,
        lat: 35.6812,
        lng: 139.7671,
        episode_ids: episodes.filter(ep => ep.title.includes('肉')).map(ep => ep.id)
      },
      {
        id: generateId('ドライブスポット'),
        name: 'お台場・レインボーブリッジ',
        description: 'ドライブシリーズでよく通るルート。夜景が美しい定番コース',
        category: 'landmark',
        address: '東京都港区台場',
        google_place_id: null,
        lat: 35.6309,
        lng: 139.7772,
        episode_ids: episodes.filter(ep => ep.title.includes('ドライブ')).map(ep => ep.id)
      },
      {
        id: generateId('カフェ'),
        name: 'おしゃれカフェ（都内）',
        description: 'メンバーがよく集まって話をするカフェ。落ち着いた雰囲気',
        category: 'cafe',
        address: '東京都渋谷区',
        google_place_id: null,
        lat: 35.6580,
        lng: 139.7016,
        episode_ids: []
      },
      {
        id: generateId('イケ丸水産'),
        name: 'イケ丸水産',
        description: '【これが四男だ】イケ丸水産🐟 で訪問。海鮮を楽しむスポット',
        category: 'restaurant',
        address: '東京都内',
        google_place_id: null,
        lat: 35.6895,
        lng: 139.6917,
        episode_ids: episodes.filter(ep => ep.title.includes('イケ丸')).map(ep => ep.id)
      }
    ]

    console.log('📍 ロケーション情報を追加中...')
    for (const location of locations) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(location)
      })
      
      if (response.ok) {
        console.log(`   ✅ ${location.name}`)
      } else {
        const error = await response.text()
        console.log(`   ❌ ${location.name}: ${error}`)
      }
    }

    // 3. アイテム情報を追加
    const items = [
      {
        id: generateId('白いコート'),
        name: '白いロングコート',
        description: '山田涼介さんがよく着用している白いロングコート。エレガントな印象',
        category: 'fashion',
        brand: '不明（調査中）',
        price: null,
        url: null,
        image_url: null,
        episode_ids: []
      },
      {
        id: generateId('黒キャップ'),
        name: '黒のキャップ',
        description: '経理さんがよく被っている黒いキャップ。#438で話題に',
        category: 'fashion',
        brand: 'NEW ERA（推定）',
        price: 6000,
        url: null,
        image_url: null,
        episode_ids: episodes.filter(ep => ep.title.includes('経理')).map(ep => ep.id)
      },
      {
        id: generateId('サングラス'),
        name: 'サングラス（ドライブ用）',
        description: 'ドライブシリーズでよく着用しているサングラス',
        category: 'fashion',
        brand: 'Ray-Ban（推定）',
        price: 20000,
        url: null,
        image_url: null,
        episode_ids: episodes.filter(ep => ep.title.includes('ドライブ')).map(ep => ep.id)
      },
      {
        id: generateId('Tシャツ'),
        name: 'ロゴTシャツ',
        description: 'カジュアルな撮影でよく着用しているTシャツ',
        category: 'fashion',
        brand: '不明',
        price: null,
        url: null,
        image_url: null,
        episode_ids: []
      },
      {
        id: generateId('腕時計'),
        name: '高級腕時計',
        description: 'セレブ回で着用していた高級腕時計',
        category: 'accessories',
        brand: 'ROLEX（推定）',
        price: null,
        url: null,
        image_url: null,
        episode_ids: episodes.filter(ep => ep.title.includes('セレブ')).map(ep => ep.id)
      }
    ]

    console.log('\n👗 アイテム情報を追加中...')
    for (const item of items) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/items`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(item)
      })
      
      if (response.ok) {
        console.log(`   ✅ ${item.name}`)
      } else {
        const error = await response.text()
        console.log(`   ❌ ${item.name}: ${error}`)
      }
    }

    // 4. 結果確認
    const locationsCount = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const locationsData = await locationsCount.json()

    const itemsCount = await fetch(`${SUPABASE_URL}/rest/v1/items?select=id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const itemsData = await itemsCount.json()

    console.log('\n📊 データ追加完了:')
    console.log(`   📍 ロケーション: ${locationsData.length}件`)
    console.log(`   👗 アイテム: ${itemsData.length}件`)

  } catch (error) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
addItemsAndLocations()
  .then(() => {
    console.log('\n✨ 追加完了！')
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app')
    console.log('\n📝 次のステップ:')
    console.log('   1. サイトでアイテム・ロケーションページを確認')
    console.log('   2. エピソード詳細ページで関連情報表示を確認')
    console.log('   3. さらに詳細な情報を追加')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })