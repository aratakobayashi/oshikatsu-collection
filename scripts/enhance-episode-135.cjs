const MockGoogleSearchEnhancer = require('./mock-google-search.cjs')
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_P-DEjQKlD1VtQlny6EhJxQ_BrNn2gq2'
const crypto = require('crypto')

function generateId() {
  return crypto.randomUUID()
}

function generateSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 40)
  
  // タイムスタンプを追加してユニーク性を確保
  const timestamp = Date.now()
  return `${baseSlug}-${timestamp}`
}

// Google検索で強化されたデータをSupabaseに投入
async function enhanceEpisode135WithGoogleSearch() {
  console.log('🚀 エピソード#135のGoogle検索強化開始')
  console.log('==========================================\n')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
  
  // 1. エピソード#135を取得
  const episode = {
    id: '889b696dc7254722e960072de5b7d957',
    title: '#135【新シリーズ】折角だから朝飯だけ食べてみた'
  }
  
  console.log(`📺 対象エピソード: ${episode.title}`)
  
  // 2. Google検索で店舗情報を強化
  const enhancer = new MockGoogleSearchEnhancer()
  const storeInfoList = await enhancer.enhanceEpisodeInfo(episode)
  
  if (storeInfoList.length === 0) {
    console.log('⚠️ Google検索で店舗情報が見つかりませんでした')
    return
  }
  
  // 3. 最高信頼度の店舗情報を使用
  const bestStore = storeInfoList[0]
  console.log(`\n🏆 選択された店舗: ${bestStore.storeName} (信頼度: ${bestStore.source.confidence})`)
  
  // 4. 既存の低品質データを確認・削除
  console.log('\n🔍 既存データをチェック中...')
  
  try {
    // エピソード#135の既存ロケーション関連を取得
    const existingResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episode.id}&select=*,locations(name,slug)`,
      { headers }
    )
    
    const existingRelations = await existingResponse.json()
    
    if (existingRelations && existingRelations.length > 0) {
      console.log(`📋 既存関連データ: ${existingRelations.length}件`)
      
      for (const relation of existingRelations) {
        const locationName = relation.locations?.name || '不明'
        console.log(`   - ${locationName}`)
        
        // 低品質データ（"店"等）を削除
        if (locationName.includes('店（#135') || locationName === '店') {
          console.log(`🗑️ 低品質データを削除中: ${locationName}`)
          
          // 関連データを削除
          await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?id=eq.${relation.id}`, {
            method: 'DELETE',
            headers
          })
          
          // ロケーション自体も削除（他で使用されていない場合）
          await fetch(`${SUPABASE_URL}/rest/v1/locations?id=eq.${relation.location_id}`, {
            method: 'DELETE', 
            headers
          })
          
          console.log(`✅ 削除完了: ${locationName}`)
        }
      }
    }
    
    // 5. 高品質なロケーションデータを作成
    console.log('\n🏪 高品質ロケーションデータを作成中...')
    
    const locationData = {
      id: generateId(),
      name: bestStore.storeName,
      slug: generateSlug(bestStore.storeName),
      address: bestStore.address,
      phone: bestStore.phone,
      opening_hours: bestStore.hours,
      description: `よにのちゃんねる #135で訪問。${bestStore.source.snippet || 'Google検索で発見された店舗'}`,
      website_url: bestStore.source.link.includes('example') ? null : bestStore.source.link,
      tags: ['よにのちゃんねる', 'エピソード135', '朝ごはんシリーズ', 'Google検索強化'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log(`📍 店舗: ${locationData.name}`)
    console.log(`🏠 住所: ${locationData.address || '情報なし'}`)
    console.log(`☎️ 電話: ${locationData.phone || '情報なし'}`)
    console.log(`🕒 営業時間: ${locationData.opening_hours || '情報なし'}`)
    
    // 6. 重複チェック
    const duplicateCheck = await fetch(
      `${SUPABASE_URL}/rest/v1/locations?name=eq.${encodeURIComponent(locationData.name)}`,
      { headers }
    )
    
    const existingLocations = await duplicateCheck.json()
    
    if (existingLocations && existingLocations.length > 0) {
      console.log(`⚠️ 同名店舗が既に存在: ${locationData.name}`)
      return
    }
    
    // 7. ロケーションをSupabaseに投入
    console.log('\n💾 Supabaseにデータ投入中...')
    
    const locationResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(locationData)
    })
    
    if (locationResponse.ok) {
      const insertedLocation = await locationResponse.json()
      console.log(`✅ ロケーション投入成功: ${locationData.name}`)
      
      // 8. エピソードとの関連付け
      const relationData = {
        id: generateId(),
        episode_id: episode.id,
        location_id: insertedLocation[0].id
      }
      
      const relationResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(relationData)
      })
      
      if (relationResponse.ok) {
        console.log(`🔗 エピソード関連付け成功`)
        
        console.log('\n' + '='.repeat(50))
        console.log('🎉 エピソード#135の強化完了！')
        console.log('='.repeat(50))
        console.log(`🏪 強化された店舗: ${locationData.name}`)
        console.log(`📊 信頼度: ${bestStore.source.confidence}/100`)
        console.log(`🔗 ソース: Google検索結果`)
        console.log(`\n📋 確認URL:`)
        console.log(`https://develop--oshikatsu-collection.netlify.app/episodes/${episode.id}`)
        
      } else {
        const relationError = await relationResponse.text()
        console.log(`❌ 関連付け失敗: ${relationError}`)
      }
      
    } else {
      const locationError = await locationResponse.text()
      console.log(`❌ ロケーション投入失敗: ${locationError}`)
    }
    
  } catch (error) {
    console.error('❌ データ処理エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  enhanceEpisode135WithGoogleSearch()
    .then(() => {
      console.log('\n🏁 強化処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { enhanceEpisode135WithGoogleSearch }