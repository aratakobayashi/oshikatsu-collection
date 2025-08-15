import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addMincedMeatAndRice() {
  console.log('🍖 挽肉と米ロケーション追加開始...\n')
  
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
  
  // 対象エピソード
  const episodeIds = [
    '5015d9a665716f5a8efd1ae6878649aa', // #408 大森元貴ハンバーグ
    'f37f990d-e427-46de-baff-9dbcd0ddfff8'  // #404 挽肉と米朝メシアワード
  ]
  
  // 既存のロケーション確認
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('*')
    .eq('name', '挽肉と米')
    .eq('celebrity_id', celebrity.id)
    .single()
  
  let locationId
  
  if (existingLocation) {
    console.log('✅ 既存ロケーション見つかりました:', existingLocation.name)
    locationId = existingLocation.id
  } else {
    // 新しいロケーション作成
    const newLocation = {
      name: '挽肉と米',
      address: '東京都渋谷区宇田川町36-6 ワールド宇田川ビル 4F',
      description: '渋谷にあるハンバーグ専門店。挽きたて肉と米にこだわった人気店',
      celebrity_id: celebrity.id,
      slug: 'minced-meat-and-rice'
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
  
  // 各エピソードに関連付け
  for (const episodeId of episodeIds) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single()
    
    if (!episode) {
      console.log(`❌ エピソード ${episodeId} が見つかりません`)
      continue
    }
    
    console.log(`\n📺 対象エピソード: ${episode.title}`)
    
    // 既存の関連付け確認
    const { data: existingRelation } = await supabase
      .from('episode_locations')
      .select('*')
      .eq('episode_id', episode.id)
      .eq('location_id', locationId)
      .single()
    
    if (existingRelation) {
      console.log('⚠️ 既に関連付けされています')
      continue
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
      continue
    }
    
    console.log('✅ エピソード-ロケーション関連付け完了!')
    console.log(`関連付けID: ${relation.id}`)
  }
  
  console.log('\n📊 追加完了:')
  console.log('ロケーション: 挽肉と米')
  console.log('関連付けエピソード: 2件')
}

addMincedMeatAndRice().catch(console.error)