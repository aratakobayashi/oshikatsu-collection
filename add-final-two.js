import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addFinalTwo() {
  console.log('🏪 最後の2つのロケーション追加開始...\n')
  
  // セレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) return
  
  // 最後の2つのロケーション（ユニークなslugで）
  const finalLocations = [
    {
      episodeId: 'd0ed028df4e88ddf6b8332cc5f7feee0', // #423
      location: {
        name: 'Paul Bassett 新宿店',
        address: '東京都新宿区西新宿1-1-3 小田急百貨店新宿店本館12F',
        description: '世界バリスタチャンピオンPaul Bassettの名を冠したスペシャルティコーヒーカフェ',
        slug: 'paul-bassett-shinjuku-odakyu'
      }
    },
    {
      episodeId: 'bfbcf27e1684d8edadbd4b8f08d0a2c5', // #421
      location: {
        name: 'スパイシーカレー魯珈',
        address: '東京都新宿区大久保2-32-2',
        description: '大久保にあるスパイスカレー専門店。4年連続ミシュランビブグルマン選出の名店',
        slug: 'spicy-curry-roka-okubo'
      }
    }
  ]
  
  for (const item of finalLocations) {
    console.log(`\n🏪 処理中: ${item.location.name}`)
    
    // エピソード確認
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', item.episodeId)
      .single()
    
    if (!episode) {
      console.log(`❌ エピソード ${item.episodeId} が見つかりません`)
      continue
    }
    
    console.log(`📺 対象エピソード: ${episode.title}`)
    
    // 新しいロケーション作成
    const newLocation = {
      ...item.location,
      celebrity_id: celebrity.id
    }
    
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert(newLocation)
      .select()
      .single()
    
    if (locationError) {
      console.error('❌ ロケーション作成エラー:', locationError)
      continue
    }
    
    console.log('✅ 新しいロケーション作成完了')
    
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
  
  console.log('\n📊 全ロケーション追加完了!')
}

addFinalTwo().catch(console.error)