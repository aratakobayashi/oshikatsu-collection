import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function add400CLocation() {
  console.log('🍕 400°C神楽坂ロケーション追加開始...\n')
  
  // セレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // エピソード確認
  const { data: episode } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', '61b27b5def5549d2e59d027dcc1b4ebc')
    .single()
  
  if (!episode) {
    console.log('❌ エピソードが見つかりません')
    return
  }
  
  console.log('📺 対象エピソード:', episode.title)
  
  // 既存のロケーション確認
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('*')
    .eq('name', '400°C 神楽坂')
    .eq('celebrity_id', celebrity.id)
    .single()
  
  let locationId
  
  if (existingLocation) {
    console.log('✅ 既存ロケーション見つかりました:', existingLocation.name)
    locationId = existingLocation.id
  } else {
    // 新しいロケーション作成
    const newLocation = {
      name: '400°C 神楽坂',
      address: '東京都新宿区神楽坂3-2 Kagurazaka Terrace B1F',
      description: '神楽坂にあるナポリピザ専門店。400度の高温窯で焼く本格ピザが自慢',
      celebrity_id: celebrity.id,
      slug: '400c-kagurazaka'
    }
    
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert(newLocation)
      .select()
      .single()
    
    if (locationError) {
      console.error('❌ ロケーション作成エラー:', locationError)
      return
    }
    
    console.log('✅ 新しいロケーション作成:', location.name)
    locationId = location.id
  }
  
  // エピソード-ロケーション関連付け確認
  const { data: existingRelation } = await supabase
    .from('episode_locations')
    .select('*')
    .eq('episode_id', episode.id)
    .eq('location_id', locationId)
    .single()
  
  if (existingRelation) {
    console.log('⚠️ 既に関連付けされています')
    return
  }
  
  // エピソード-ロケーション関連付け作成
  const { data: relation, error: relationError } = await supabase
    .from('episode_locations')
    .insert({
      episode_id: episode.id,
      location_id: locationId
    })
    .select()
    .single()
  
  if (relationError) {
    console.error('❌ 関連付けエラー:', relationError)
    return
  }
  
  console.log('✅ エピソード-ロケーション関連付け完了!')
  console.log('\n📊 追加結果:')
  console.log(`エピソード: ${episode.title}`)
  console.log(`ロケーション: 400°C 神楽坂`)
  console.log(`関連付けID: ${relation.id}`)
}

add400CLocation().catch(console.error)