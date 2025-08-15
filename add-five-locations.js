import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addFiveLocations() {
  console.log('🏪 5つのロケーション追加開始...\n')
  
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
  
  // 追加するロケーション情報
  const locationsToAdd = [
    {
      episodeId: 'd0ed028df4e88ddf6b8332cc5f7feee0', // #423
      location: {
        name: 'Paul Bassett 新宿店',
        address: '東京都新宿区西新宿1-1-3 小田急百貨店新宿店本館12F',
        description: '世界バリスタチャンピオンPaul Bassettの名を冠したスペシャルティコーヒーカフェ',
        slug: 'paul-bassett-shinjuku'
      }
    },
    {
      episodeId: 'bfbcf27e1684d8edadbd4b8f08d0a2c5', // #421
      location: {
        name: 'スパイシーカレー魯珈',
        address: '東京都新宿区大久保2-32-2',
        description: '大久保にあるスパイスカレー専門店。4年連続ミシュランビブグルマン選出の名店',
        slug: 'spicy-curry-roka'
      }
    },
    {
      episodeId: 'c4d049b0-e836-49fa-aff3-5177f74f6824', // #409
      location: {
        name: 'BLUE SIX COFFEE',
        address: '東京都新宿区霞ヶ丘町5-7 都立明治公園D棟',
        description: '国立競技場前の明治公園にあるコーヒーショップ。自家焙煎の高品質コーヒーを提供',
        slug: 'blue-six-coffee'
      }
    },
    {
      episodeId: '8ff4e5fb-77ef-44d5-bc2a-eab02286a3c2', // #398
      location: {
        name: '熟豚三代目蔵司',
        address: '東京都港区赤坂4-2-2',
        description: '赤坂にあるとんかつ専門店。低温熟成豚を使用した極上のとんかつが自慢',
        slug: 'jukuton-sandaime-kuraji'
      }
    },
    {
      episodeId: '81401247-0937-4afe-9d6b-1841e3c1d6bd', // #387
      location: {
        name: 'かおたんラーメンえんとつ屋 南青山店',
        address: '東京都港区南青山2-27-18 パサージュ青山2F',
        description: '南青山にあるラーメン店。朝から深夜まで営業する老舗中華料理店',
        slug: 'kaotan-ramen-entotsuya-minamiaoyama'
      }
    }
  ]
  
  for (const item of locationsToAdd) {
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
    
    // 既存のロケーション確認
    const { data: existingLocation } = await supabase
      .from('locations')
      .select('*')
      .eq('name', item.location.name)
      .eq('celebrity_id', celebrity.id)
      .single()
    
    let locationId
    
    if (existingLocation) {
      console.log('✅ 既存ロケーション見つかりました')
      locationId = existingLocation.id
    } else {
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
  }
  
  console.log('\n📊 全ロケーション追加完了!')
  console.log('追加したロケーション:')
  locationsToAdd.forEach(item => {
    console.log(`• ${item.location.name}`)
  })
}

addFiveLocations().catch(console.error)