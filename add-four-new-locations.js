import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function addFourNewLocations() {
  console.log('🏪 4つの新しいロケーション追加開始...\n')
  
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
  
  // 追加する4つのロケーション情報
  const locationsToAdd = [
    {
      episodeId: '86799d4f-1920-4127-acc9-42d407e42ec9', // #376
      location: {
        name: '博多もつ鍋 やま中 銀座店',
        address: '東京都中央区銀座3-2-15 ギンザ・グラッセ B1F・1F',
        description: 'みそもつ鍋発祥の店として有名な博多もつ鍋専門店。銀座にある老舗の味',
        slug: 'hakata-motsunabe-yamanaka-ginza'
      }
    },
    {
      episodeId: 'ce3da578-2d47-4dfc-b6ca-6ca1879e738f', // #367
      location: {
        name: '浅草今半 国際通り本店',
        address: '東京都台東区西浅草3-1-12',
        description: '明治28年創業の老舗すき焼き店。2024年食べログ百名店に選出された名店',
        slug: 'asakusa-imahan-kokusaidori-honten'
      }
    },
    {
      episodeId: '2408c30454006f447141bd6716a86fe1', // #361
      location: {
        name: '胡同 西麻布店',
        address: '東京都港区西麻布1-15-19',
        description: '西麻布にある韓国料理・焼肉店。特に牛タンが有名でリーズナブルな価格で本格焼肉が楽しめる',
        slug: 'hutong-nishi-azabu'
      }
    },
    {
      episodeId: 'b50e1f53-8083-49ca-8382-31293b68a142', // #314
      location: {
        name: '中華料理 十八番',
        address: '東京都千代田区神田',
        description: '神田にある中華料理店。ラーメン、チャーハン、中華丼などが1000円以下で楽しめる庶民的な店',
        slug: 'chinese-juhachiban-kanda'
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
  
  console.log('\n📊 4つのロケーション追加完了!')
  console.log('追加したロケーション:')
  locationsToAdd.forEach(item => {
    console.log(`• ${item.location.name}`)
  })
}

addFourNewLocations().catch(console.error)