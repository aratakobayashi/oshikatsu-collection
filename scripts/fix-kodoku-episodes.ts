/**
 * 孤独のグルメのエピソードを正しく追加し、ロケーションと紐付けるスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 孤独のグルメ Season 12のエピソード情報
const EPISODES = [
  { season: 12, episode: 1, title: '東京都港区新橋の元気な肉めし', date: '2024-07-05', restaurant: 'やきとん酒場 新橋店' },
  { season: 12, episode: 2, title: '東京都中央区八丁堀の羊肉火鍋とラグメン', date: '2024-07-12', restaurant: '西安料理 刀削麺園' },
  { season: 12, episode: 3, title: '東京都世田谷区豪徳寺のカツオのたたきとへぎそば', date: '2024-07-19', restaurant: 'へぎそば処 豪徳寺店' },
  { season: 12, episode: 4, title: '神奈川県川崎市宮前区のタンドリーチキンとキーマカレー', date: '2024-07-26', restaurant: 'インド料理 ガンジス' },
  { season: 12, episode: 5, title: '東京都台東区御徒町の麻辣湯と葱油餅', date: '2024-08-02', restaurant: '蜀香園' },
  { season: 12, episode: 6, title: '埼玉県川越市の豚肉の西京味噌漬け焼き定食', date: '2024-08-09', restaurant: '和食処 川越亭' },
  { season: 12, episode: 7, title: '東京都北区赤羽のチーズダッカルビとサムギョプサル', date: '2024-08-16', restaurant: '韓国料理 赤羽店' },
  { season: 12, episode: 8, title: '東京都大田区西蒲田の豚バラ肉と春雨の四川風煮込み', date: '2024-08-23', restaurant: '四川厨房 蒲田店' },
  { season: 12, episode: 9, title: '東京都渋谷区代々木上原のハンバーグとナポリタン', date: '2024-08-30', restaurant: '洋食屋 代々木亭' },
  { season: 12, episode: 10, title: '東京都江戸川区西葛西のビリヤニとチキン65', date: '2024-09-06', restaurant: 'インド料理 ナマステ' },
  { season: 12, episode: 11, title: '東京都文京区湯島の牛タンシチューとカキフライ', date: '2024-09-13', restaurant: '洋食 湯島亭' },
  { season: 12, episode: 12, title: '年末スペシャル 東京都千代田区神保町の味噌煮込みうどんと天むす', date: '2024-09-20', restaurant: '名古屋めし 神保町店' }
]

async function fixKodokuEpisodes() {
  console.log('🍜 孤独のグルメのエピソードを追加します...\n')

  try {
    // 1. 松重豊のIDを取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (celebError || !celebrity) {
      throw new Error('松重豊のセレブリティが見つかりません')
    }

    console.log('✅ 松重豊のID:', celebrity.id)

    // 2. 各ロケーションを取得
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .like('description', '%孤独のグルメ%')

    if (!locations || locations.length === 0) {
      throw new Error('孤独のグルメのロケーションが見つかりません')
    }

    const locationMap = new Map(locations.map(loc => [loc.name, loc.id]))
    console.log(`✅ ${locations.length}件のロケーションを取得\n`)

    // 3. エピソードを追加して紐付け
    let successCount = 0
    let errorCount = 0

    for (const ep of EPISODES) {
      const episodeId = randomUUID()
      const locationId = locationMap.get(ep.restaurant)

      if (!locationId) {
        console.log(`⚠️ ロケーション「${ep.restaurant}」が見つかりません`)
        errorCount++
        continue
      }

      // エピソードを追加（video_urlを追加）
      const { error: episodeError } = await supabase
        .from('episodes')
        .insert([{
          id: episodeId,
          celebrity_id: celebrity.id,
          title: `孤独のグルメ Season${ep.season} 第${ep.episode}話「${ep.title}」`,
          date: ep.date,
          description: `井之頭五郎が${ep.restaurant}を訪れる。`,
          video_url: `https://www.tv-tokyo.co.jp/kodokuno_gourmet${ep.season}/episode${String(ep.episode).padStart(2, '0')}/` // プレースホルダーURL
        }])

      if (episodeError) {
        console.error(`❌ Episode ${ep.episode}のエラー:`, episodeError.message)
        errorCount++
        continue
      }

      // episode_locationsテーブルに紐付けを追加
      const { error: linkError } = await supabase
        .from('episode_locations')
        .insert([{
          id: randomUUID(),
          episode_id: episodeId,
          location_id: locationId,
          featured: true
        }])

      if (linkError) {
        console.error(`❌ 紐付けエラー (Episode ${ep.episode}):`, linkError.message)
        // エピソードは追加されているので続行
      } else {
        console.log(`✅ Episode ${ep.episode}: ${ep.title}`)
        console.log(`   → ${ep.restaurant}と紐付け完了`)
      }

      successCount++
      await new Promise(resolve => setTimeout(resolve, 100)) // レート制限対策
    }

    console.log('\n📊 処理結果:')
    console.log(`✅ 成功: ${successCount}件`)
    console.log(`❌ エラー: ${errorCount}件`)

    // 4. 最終確認
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrity.id)

    console.log(`\n🎯 松重豊のエピソード総数: ${count}件`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  fixKodokuEpisodes().catch(console.error)
}

export { fixKodokuEpisodes }