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

async function analyzeCurrentData() {
  console.log('📊 現在のデータベース構造とデータを分析中...\n')

  try {
    // 1. 各テーブルのデータ件数
    console.log('1️⃣ テーブル別データ件数:')
    
    const tables = ['celebrities', 'episodes', 'locations', 'items', 'celebrity_locations', 'episode_locations', 'episode_items']
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`   ❌ ${table}: エラー (${error.message})`)
        } else {
          console.log(`   📊 ${table}: ${count || 0}件`)
        }
      } catch (err: any) {
        console.log(`   ❌ ${table}: アクセスエラー`)
      }
    }

    console.log('')

    // 2. Celebrities テーブルのサンプルデータ
    console.log('2️⃣ Celebrities テーブル構造 (最新3件):')
    const { data: celebrities, error: celebError } = await supabase
      .from('celebrities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (celebError) {
      console.log(`   ❌ エラー: ${celebError.message}`)
    } else if (celebrities && celebrities.length > 0) {
      console.log(`   ✅ カラム構造:`)
      Object.keys(celebrities[0]).forEach(key => {
        console.log(`      - ${key}: ${typeof celebrities[0][key]}`)
      })
      console.log('')
      console.log('   📋 サンプルデータ:')
      celebrities.forEach((celeb, i) => {
        console.log(`      ${i + 1}. ${celeb.name} (${celeb.slug})`)
        console.log(`         画像: ${celeb.image_url ? '有り' : '無し'}`)
        console.log(`         タイプ: ${celeb.type}`)
        console.log(`         登録者数: ${celeb.subscriber_count?.toLocaleString() || 'N/A'}`)
      })
    }

    console.log('')

    // 3. Episodes テーブルのサンプルデータ
    console.log('3️⃣ Episodes テーブル構造 (最新3件):')
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (epError) {
      console.log(`   ❌ エラー: ${epError.message}`)
    } else if (episodes && episodes.length > 0) {
      console.log(`   ✅ カラム構造:`)
      Object.keys(episodes[0]).forEach(key => {
        console.log(`      - ${key}: ${typeof episodes[0][key]}`)
      })
      console.log('')
      console.log('   📋 サンプルデータ:')
      episodes.forEach((ep, i) => {
        console.log(`      ${i + 1}. ${ep.title}`)
        console.log(`         日付: ${ep.date}`)
        console.log(`         視聴回数: ${ep.view_count?.toLocaleString() || 'N/A'}`)
      })
    }

    console.log('')

    // 4. Locations テーブルのサンプルデータ
    console.log('4️⃣ Locations テーブル構造 (最新3件):')
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    if (locError) {
      console.log(`   ❌ エラー: ${locError.message}`)
    } else if (locations && locations.length > 0) {
      console.log(`   ✅ カラム構造:`)
      Object.keys(locations[0]).forEach(key => {
        console.log(`      - ${key}: ${typeof locations[0][key]}`)
      })
      console.log('')
      console.log('   📋 サンプルデータ:')
      locations.forEach((loc, i) => {
        console.log(`      ${i + 1}. ${loc.name}`)
        console.log(`         住所: ${loc.address || 'N/A'}`)
        console.log(`         食べログ: ${loc.tabelog_url ? '有り' : '無し'}`)
        console.log(`         タグ: ${loc.tags?.length || 0}個`)
      })
    }

    console.log('')

    // 5. 関連テーブルの確認
    console.log('5️⃣ 関連テーブル確認:')
    
    // celebrity_locations の確認
    try {
      const { data: celebLocs } = await supabase
        .from('celebrity_locations')
        .select('*')
        .limit(1)
      
      if (celebLocs && celebLocs.length > 0) {
        console.log('   ✅ celebrity_locations テーブル存在:')
        Object.keys(celebLocs[0]).forEach(key => {
          console.log(`      - ${key}: ${typeof celebLocs[0][key]}`)
        })
      } else {
        console.log('   ⚠️ celebrity_locations テーブル: データなしまたは存在しない')
      }
    } catch (err) {
      console.log('   ❌ celebrity_locations テーブル: アクセスエラー')
    }

    console.log('')
    
    console.log('✅ 現在のデータベース構造分析完了!')

  } catch (error: any) {
    console.error('❌ 分析エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCurrentData()
    .then(() => {
      console.log('\n✅ 分析完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { analyzeCurrentData }