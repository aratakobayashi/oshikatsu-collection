import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkSchema() {
  console.log('🔍 locationsテーブルのスキーマ確認...\n')
  
  // 既存のロケーションサンプルを取得してカラム構造を確認
  const { data: sample, error } = await supabase
    .from('locations')
    .select('*')
    .limit(1)
    .single()
  
  if (error) {
    console.log('❌ エラー:', error)
    return
  }
  
  console.log('📋 利用可能なカラム:')
  console.log('=====================================')
  Object.keys(sample).forEach(key => {
    console.log(`• ${key}: ${typeof sample[key]} = ${sample[key]}`)
  })
  
  // 必要最小限のフィールドでロケーション作成を試みる
  console.log('\n🏨 簡略版でロケーション追加を試行...')
  
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) return
  
  const minimalLocation = {
    name: 'ホテルニューオータニ東京 ガーデンラウンジ',
    address: '東京都千代田区紀尾井町4-1 ホテルニューオータニ東京',
    description: '日本庭園を望む老舗ホテルの優雅なビュッフェレストラン',
    celebrity_id: celebrity.id,
    slug: 'hotel-new-otani-tokyo-garden-lounge'
  }
  
  const { data: newLocation, error: insertError } = await supabase
    .from('locations')
    .insert([minimalLocation])
    .select('*')
    .single()
  
  if (insertError) {
    console.log('❌ 挿入エラー:', insertError)
  } else {
    console.log('✅ ロケーション追加成功:')
    console.log('ID:', newLocation.id)
    console.log('名前:', newLocation.name)
    
    // エピソードと関連付け
    const episodeId = 'br-iF9GUpIE'
    const { error: relationError } = await supabase
      .from('episode_locations')
      .insert([{
        episode_id: episodeId,
        location_id: newLocation.id
      }])
    
    if (relationError) {
      console.log('❌ 関連付けエラー:', relationError)
    } else {
      console.log('✅ エピソードとの関連付け完了')
    }
  }
}

checkSchema().catch(console.error)