import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMoenoazukiLocations() {
  console.log('🍎 もえのあずき関連ロケ地をデータベースに追加中...\n')

  try {
    // まず、もえのあずきのIDを取得
    console.log('🔍 もえのあずきの情報を取得中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ確認: ${celebrity.name} (ID: ${celebrity.id})`)
    console.log('')

    // 追加するロケ地データ
    const locations = [
      {
        id: randomUUID(),
        name: '幸福麺処 もっちりや',
        slug: 'koufuku-mensho-mottchiriya',
        address: '東京都大田区平和島1-1-1 ビッグファン平和島 B棟1Fフードコート',
        description: 'もえのあずきがデカ盛りチャレンジ「特製肉盛り麻婆茄子丼2.3kg」に挑戦した人気ラーメン店。BIGFUN平和島のフードコート内にあり、担々麺が人気。30分以内に完食すれば無料になるチャレンジメニューでも有名。',
        website_url: 'https://www.big-fun.jp/restaurant/motchiriya/',
        tabelog_url: 'https://tabelog.com/tokyo/A1315/A131502/13105084/',
        phone: '03-3768-9099',
        image_url: null, // 後で追加
        image_urls: [],
        tags: ['ラーメン', '大食い', 'チャレンジメニュー', '平和島', 'フードコート', '担々麺', 'もえのあずき'],
        prefecture: '東京都',
        city: '大田区',
        latitude: null, // 後で調査
        longitude: null,
        google_maps_url: 'https://maps.google.com/?q=東京都大田区平和島1-1-1',
        opening_hours: '11:00-21:00',
        closed_days: null,
        price_range: '～999円',
        genre: 'ラーメン',
        status: 'active',
        view_count: 0,
        featured: true, // もえのあずき関連で特集対象
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    // ロケ地データを挿入
    console.log('📍 ロケ地データを挿入中...')
    for (const location of locations) {
      console.log(`   追加中: ${location.name}`)
      
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert(location)
        .select()
        .single()

      if (locationError) {
        console.error(`   ❌ エラー: ${locationError.message}`)
        continue
      }

      console.log(`   ✅ ロケ地追加完了: ${location.name}`)
      
      // celebrity_locationsテーブルに関連付けを追加
      console.log(`   🔗 もえのあずきとの関連付け設定中...`)
      
      const { error: relationError } = await supabase
        .from('celebrity_locations')
        .insert({
          id: randomUUID(),
          celebrity_id: celebrity.id,
          location_id: locationData.id,
          visit_date: '2023-11-03', // コラボチャレンジ開始日
          description: '特製肉盛り麻婆茄子丼2.3kgのデカ盛りチャレンジに成功。約20分で完食し、チャレンジ動画もYouTubeで公開。',
          episode_url: null, // YouTube動画URL（後で追加）
          featured: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (relationError) {
        console.error(`   ❌ 関連付けエラー: ${relationError.message}`)
      } else {
        console.log(`   ✅ 関連付け完了`)
      }
      
      console.log('')
    }

    // 結果サマリー
    console.log('🎉 もえのあずき関連ロケ地追加完了!')
    console.log('')
    console.log('📊 追加したデータ:')
    console.log(`   ロケ地数: ${locations.length}`)
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log('')
    console.log('💰 アフィリエイト効果:')
    console.log('✅ 食べログURL設定済み')
    console.log('✅ 人気YouTuber関連で検索流入増加見込み')
    console.log('✅ デカ盛りチャレンジで話題性高い')
    console.log('')
    console.log('🚀 次のステップ:')
    console.log('1. 画像追加（店舗外観・料理写真）')
    console.log('2. 位置情報追加（緯度経度）')
    console.log('3. YouTube動画URLの関連付け')
    console.log('4. 他の高収益YouTuberの追加')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// 実行 (ES Modules対応)
if (import.meta.url === `file://${process.argv[1]}`) {
  addMoenoazukiLocations()
    .then(() => {
      console.log('\n✅ 実行完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { addMoenoazukiLocations }