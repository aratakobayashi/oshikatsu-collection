import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMoenoazukiData() {
  console.log('🔍 もえのあずきのデータ関連状況を確認中...\n')

  try {
    // 1. セレブリティ基本情報
    console.log('1️⃣ セレブリティ基本情報:')
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebError) {
      console.error('❌ セレブリティ取得エラー:', celebError.message)
      return
    }

    console.log(`✅ 名前: ${celebrity.name}`)
    console.log(`   ID: ${celebrity.id}`)
    console.log(`   画像: ${celebrity.image_url ? '有り' : '無し'}`)
    console.log('')

    // 2. 関連ロケ地
    console.log('2️⃣ 関連ロケ地:')
    const { data: celebrityLocations, error: locError } = await supabase
      .from('celebrity_locations')
      .select('*')
      .eq('celebrity_id', celebrity.id)

    if (locError) {
      console.error('❌ ロケ地関連付け取得エラー:', locError.message)
      return
    }

    console.log(`✅ 関連付け数: ${celebrityLocations?.length || 0}`)
    
    if (celebrityLocations && celebrityLocations.length > 0) {
      for (const rel of celebrityLocations) {
        // ロケ地詳細を個別取得
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('*')
          .eq('id', rel.location_id)
          .single()

        if (!locationError && location) {
          console.log(`   📍 ${location.name}`)
          console.log(`      住所: ${location.address}`)
          console.log(`      訪問日: ${rel.visit_date}`)
          console.log(`      説明: ${rel.description}`)
          console.log(`      食べログ: ${location.tabelog_url ? '有り' : '無し'}`)
          console.log(`      動画URL: ${rel.episode_url || '無し'}`)
          console.log('')
        }
      }
    }

    // 3. 関連エピソード
    console.log('3️⃣ 関連エピソード:')
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('*')
      .contains('celebrity_ids', [celebrity.id])

    if (epError) {
      console.error('❌ エピソード取得エラー:', epError.message)
      return
    }

    console.log(`✅ 関連エピソード数: ${episodes?.length || 0}`)
    episodes?.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.title}`)
      console.log(`      日付: ${ep.date}`)
      console.log(`      URL: ${ep.youtube_url || '無し'}`)
      console.log('')
    })

    // 4. データ構造サマリー
    console.log('📊 データ構造サマリー:')
    console.log(`   セレブリティ: ${celebrity.name} ✅`)
    console.log(`   関連ロケ地: ${locations?.length || 0}件 ${locations?.length ? '✅' : '⚠️'}`)
    console.log(`   関連エピソード: ${episodes?.length || 0}件 ${episodes?.length ? '✅' : '⚠️'}`)
    console.log('')

    if (!episodes?.length) {
      console.log('💡 推奨: YouTube動画をエピソードとして追加することで、')
      console.log('   セレブリティ → エピソード → ロケ地の完全な関連付けが可能になります。')
    }

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkMoenoazukiData()
    .then(() => {
      console.log('\n✅ 確認完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { checkMoenoazukiData }