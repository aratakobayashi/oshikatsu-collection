const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'
const crypto = require('crypto')

// 8888-infoから取得したデータをSupabaseにインポート
const fansiteData = [
  {
    episode: '446',
    date: '2025年8月6日',
    storeName: '大衆焼肉 暴飲暴食',
    address: '東京都江東区東陽3丁目24-19',
    hours: '17:00-23:00',
    phone: '070-6964-5518'
  },
  {
    episode: '444', 
    date: '2025年7月30日',
    storeName: 'ゴールドラッシュ渋谷本店',
    address: '東京都渋谷区宇田川町4-7',
    hours: '平日: 11:30-15:00, 17:30-22:45 / 土日祝: 11:30-22:45',
    phone: '03-3496-5971'
  },
  {
    episode: '442',
    date: '2025年7月23日', 
    storeName: 'KIZASU.COFFEE',
    address: '東京都港区新橋6-16',
    hours: '平日: 7:00-19:00 / 土: 7:00-17:00',
    phone: '03-6206-6145'
  }
  // 他の34店舗のデータも同様に追加
]

function generateId() {
  return crypto.randomUUID()
}

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50)
}

// エピソード番号からエピソードIDを取得
async function findEpisodeByNumber(episodeNumber) {
  console.log(`🔍 エピソード#${episodeNumber}をstaging環境で検索中...`)
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  }
  
  try {
    // タイトルに番号が含まれるエピソードを検索
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/episodes?title=like.*%23${episodeNumber}*&select=id,title`,
      { headers }
    )
    
    const episodes = await response.json()
    
    if (episodes && episodes.length > 0) {
      console.log(`✅ エピソード#${episodeNumber}を発見: ${episodes[0].title}`)
      return episodes[0]
    }
    
    console.log(`⚠️ エピソード#${episodeNumber}が見つかりませんでした`)
    return null
    
  } catch (error) {
    console.error(`❌ エピソード検索エラー: ${error.message}`)
    return null
  }
}

// 高品質なロケーションデータを作成
async function createHighQualityLocation(storeData, episodeData) {
  console.log(`🏪 高品質ロケーションデータを作成中: ${storeData.storeName}`)
  
  const locationData = {
    id: generateId(),
    name: storeData.storeName,
    slug: generateSlug(storeData.storeName),
    address: storeData.address,
    phone: storeData.phone,
    website_url: null, // 今後追加可能
    description: `よにのちゃんねる #${storeData.episode} で紹介された店舗`,
    tags: ['よにのちゃんねる', '朝ごはんシリーズ', `エピソード${storeData.episode}`],
    image_url: null, // 今後追加可能
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // 営業時間をopening_hoursカラムに保存
  if (storeData.hours) {
    locationData.opening_hours = storeData.hours
  }
  
  return locationData
}

// 営業時間のパース（簡易版）
function parseBusinessHours(hoursText) {
  // 今後より詳細な解析を追加予定
  return {
    raw: hoursText,
    parsed: null // 構造化データは今後実装
  }
}

// ファンサイトデータのインポート処理
async function importFansiteData() {
  console.log('🚀 8888-infoファンサイトデータインポート開始')
  console.log('==========================================\n')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
  
  const results = {
    processed: 0,
    imported: 0,
    linked: 0,
    errors: 0
  }
  
  for (const storeData of fansiteData) {
    console.log(`\n[${results.processed + 1}/${fansiteData.length}] 処理中: ${storeData.storeName}`)
    console.log('─'.repeat(50))
    
    try {
      // 1. 対応するエピソードを検索
      const episode = await findEpisodeByNumber(storeData.episode)
      
      // 2. 高品質ロケーションデータを作成
      const locationData = await createHighQualityLocation(storeData, episode)
      
      // 3. 重複チェック
      const duplicateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/locations?name=eq.${encodeURIComponent(storeData.storeName)}`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` } }
      )
      
      const existingLocations = await duplicateResponse.json()
      
      if (existingLocations && existingLocations.length > 0) {
        console.log(`⚠️ 重複スキップ: ${storeData.storeName} は既に存在`)
        continue
      }
      
      // 4. ロケーションをSupabaseに投入
      const locationResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(locationData)
      })
      
      if (locationResponse.ok) {
        const insertedLocation = await locationResponse.json()
        console.log(`✅ ロケーション投入成功: ${storeData.storeName}`)
        console.log(`   住所: ${storeData.address}`)
        console.log(`   電話: ${storeData.phone}`)
        console.log(`   営業時間: ${storeData.hours}`)
        
        results.imported++
        
        // 5. エピソードとの関連付け
        if (episode) {
          const relationData = {
            id: generateId(),
            episode_id: episode.id,
            location_id: insertedLocation[0].id
          }
          
          const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(relationData)
          })
          
          if (relationResponse.ok) {
            console.log(`🔗 エピソード関連付け成功`)
            results.linked++
          } else {
            console.log(`⚠️ エピソード関連付け失敗`)
          }
        }
        
      } else {
        const errorText = await locationResponse.text()
        console.log(`❌ ロケーション投入失敗: ${errorText}`)
        results.errors++
      }
      
      results.processed++
      
    } catch (error) {
      console.error(`❌ 処理エラー: ${error.message}`)
      results.errors++
    }
  }
  
  // 結果レポート
  console.log('\n' + '='.repeat(50))
  console.log('📊 ファンサイトデータインポート結果')
  console.log('='.repeat(50))
  console.log(`🏪 処理した店舗: ${results.processed}件`)
  console.log(`✅ インポート成功: ${results.imported}件`)
  console.log(`🔗 エピソード関連付け: ${results.linked}件`)
  console.log(`❌ エラー: ${results.errors}件`)
  
  if (results.imported > 0) {
    console.log('\n🎉 高品質なロケーションデータの追加完了！')
    console.log('📋 staging環境で確認してください:')
    console.log('   https://develop--oshikatsu-collection.netlify.app/')
  }
}

// 実行
if (require.main === module) {
  importFansiteData()
    .then(() => {
      console.log('\n🏁 インポート処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { importFansiteData, createHighQualityLocation }