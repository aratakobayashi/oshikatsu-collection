import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function fixRemainingTwo() {
  console.log('🔧 残り2つの関連付け修正開始...\n')
  
  // セレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) return
  
  // 残り2つのエピソード
  const remaining = [
    {
      episodeId: 'd0ed028df4e88ddf6b8332cc5f7feee0', // #423
      locationName: 'Paul Bassett 新宿店'
    },
    {
      episodeId: 'bfbcf27e1684d8edadbd4b8f08d0a2c5', // #421  
      locationName: 'スパイシーカレー魯珈'
    }
  ]
  
  for (const item of remaining) {
    console.log(`\n🔧 処理中: ${item.locationName}`)
    
    // 既存ロケーション検索（部分一致）
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .eq('celebrity_id', celebrity.id)
      .ilike('name', `%${item.locationName.split(' ')[0]}%`)
    
    if (!locations || locations.length === 0) {
      console.log('❌ 対応するロケーションが見つかりません')
      continue
    }
    
    const location = locations[0]
    console.log(`✅ 既存ロケーション見つかりました: ${location.name}`)
    
    // エピソード取得
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', item.episodeId)
      .single()
    
    if (!episode) {
      console.log('❌ エピソードが見つかりません')
      continue
    }
    
    console.log(`📺 対象エピソード: ${episode.title}`)
    
    // 既存の関連付け確認
    const { data: existingRelation } = await supabase
      .from('episode_locations')
      .select('*')
      .eq('episode_id', episode.id)
      .eq('location_id', location.id)
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
        location_id: location.id
      })
      .select()
      .single()
    
    if (relationError) {
      console.error('❌ 関連付けエラー:', relationError)
      continue
    }
    
    console.log('✅ エピソード-ロケーション関連付け完了!')
  }
  
  console.log('\n📊 修正完了!')
}

fixRemainingTwo().catch(console.error)