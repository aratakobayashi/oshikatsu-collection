const crypto = require('crypto')

// Supabase設定
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

function generateId() {
  return crypto.randomUUID()
}

async function fixLocationRelations() {
  console.log('🔧 ロケーション関連データを修正・投入中...')
  
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  }
  
  try {
    // 1. エピソードIDを確認
    const episodeId = '5af068026f46542dbc432385cd565cfa'
    
    // 2. 追加されたロケーションIDを取得
    console.log('📍 追加されたロケーション情報を確認中...')
    
    const locationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/locations?select=id,name,slug&slug=in.(janifes-2022-venue,janifes-backstage-area)`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const locations = await locationsResponse.json()
    
    console.log(`✅ ${locations.length}件のロケーションを発見:`)
    locations.forEach(loc => console.log(`   - ${loc.name} (${loc.slug})`))
    
    // 3. シンプルなスキーマでロケーション関連データを投入
    console.log('🔗 ロケーション関連データを投入中...')
    
    for (const location of locations) {
      const relationData = {
        id: generateId(),
        episode_id: episodeId,
        location_id: location.id
      }
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(relationData)
      })
      
      if (response.ok) {
        console.log(`   ✅ 関連投入成功: ${location.name}`)
      } else {
        const error = await response.text()
        console.log(`   ⚠️ 関連投入失敗: ${error}`)
      }
    }
    
    // 4. 投入結果の確認
    console.log('📊 投入結果を確認中...')
    
    const relationsResponse = await fetch(`${SUPABASE_URL}/rest/v1/episode_locations?episode_id=eq.${episodeId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    const relations = await relationsResponse.json()
    
    console.log(`✅ エピソード-ロケーション関連データ: ${relations.length}件`)
    
    console.log('\n🎉 修正完了！')
    console.log('📋 staging環境で確認してください:')
    console.log(`   https://develop--oshikatsu-collection.netlify.app/episodes/${episodeId}`)
    
  } catch (error) {
    console.error('❌ 修正エラー:', error.message)
  }
}

// 実行
if (require.main === module) {
  console.log('🔧 ロケーション関連データ修正ツール v1.0')
  console.log('=======================================\n')
  
  fixLocationRelations()
    .then(() => {
      console.log('\n✅ 修正処理完了')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 致命的エラー:', error)
      process.exit(1)
    })
}

module.exports = { fixLocationRelations }