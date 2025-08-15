import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addHotelLocation() {
  console.log('🏨 ホテルニューオータニ東京を追加中...\n')
  
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
  
  // ホテルニューオータニが既に存在するかチェック
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('id, name')
    .ilike('name', '%ニューオータニ%')
    .single()
  
  let locationId
  
  if (existingLocation) {
    console.log('✅ 既存のロケーションを使用:', existingLocation.name)
    locationId = existingLocation.id
  } else {
    // 新しいロケーションを作成
    const newLocation = {
      name: 'ホテルニューオータニ東京 ガーデンラウンジ',
      address: '東京都千代田区紀尾井町4-1 ホテルニューオータニ東京 ザ・メイン ロビィ階',
      description: '日本庭園を望む老舗ホテルの優雅なビュッフェレストラン。四季折々の景色とともに楽しめる上質な料理の数々。',
      category: 'hotel_restaurant',
      phone: '03-3265-1111',
      website: 'https://www.newotani.co.jp/tokyo/restaurant/gardenlounge/',
      price_range: '¥6,000-10,000',
      opening_hours: JSON.stringify({
        lunch: '11:30-14:30',
        dinner: '17:30-21:30'
      }),
      tags: ['ホテルビュッフェ', '老舗ホテル', '日本庭園', '高級レストラン', 'バイキング'],
      celebrity_id: celebrity.id,
      slug: 'hotel-new-otani-tokyo-garden-lounge'
    }
    
    const { data: location, error } = await supabase
      .from('locations')
      .insert([newLocation])
      .select('id, name')
      .single()
    
    if (error) {
      console.log('❌ ロケーション追加エラー:', error)
      return
    }
    
    console.log('✅ 新しいロケーションを追加:', location.name)
    locationId = location.id
  }
  
  // エピソードとロケーションを関連付け
  const episodeId = 'br-iF9GUpIE'
  
  // 既存の関連付けをチェック
  const { data: existingRelation } = await supabase
    .from('episode_locations')
    .select('id')
    .eq('episode_id', episodeId)
    .eq('location_id', locationId)
    .single()
  
  if (existingRelation) {
    console.log('✅ 既に関連付け済み')
  } else {
    const { error: relationError } = await supabase
      .from('episode_locations')
      .insert([{
        episode_id: episodeId,
        location_id: locationId
      }])
    
    if (relationError) {
      console.log('❌ 関連付けエラー:', relationError)
      return
    }
    
    console.log('✅ エピソードとロケーションを関連付けました')
  }
  
  // 確認
  const { data: verification } = await supabase
    .from('episode_locations')
    .select(`
      episodes(title),
      locations(name, address)
    `)
    .eq('episode_id', episodeId)
    .eq('location_id', locationId)
    .single()
  
  console.log('\n🎉 追加完了:')
  console.log('=====================================')
  console.log('エピソード:', verification?.episodes.title)
  console.log('ロケーション:', verification?.locations.name)
  console.log('住所:', verification?.locations.address)
  console.log('\n本番環境に反映済みです！')
}

addHotelLocation().catch(console.error)