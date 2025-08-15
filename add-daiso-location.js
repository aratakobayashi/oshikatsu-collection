import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addDaisoLocation() {
  console.log('🛍️ ダイソーロケーション追加開始...\n')
  
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
    .eq('id', '98ID88V1qnQ')
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
    .eq('name', 'ダイソー')
    .eq('celebrity_id', celebrity.id)
    .single()
  
  let locationId
  
  if (existingLocation) {
    console.log('✅ 既存ロケーション見つかりました:', existingLocation.name)
    locationId = existingLocation.id
  } else {
    // 新しいロケーション作成
    const newLocation = {
      name: 'ダイソー',
      address: '全国チェーン店',
      description: '100円ショップチェーン店。日用品、雑貨、文具などが豊富',
      celebrity_id: celebrity.id,
      slug: 'daiso'
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
  console.log(`ロケーション: ダイソー`)
  console.log(`関連付けID: ${relation.id}`)
}

addDaisoLocation().catch(console.error)