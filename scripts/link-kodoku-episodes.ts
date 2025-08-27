/**
 * 既存の孤独のグルメのエピソードとロケーションを紐付けるスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function linkKodokuEpisodes() {
  console.log('🔗 孤独のグルメのエピソードとロケーションを紐付けます...\n')

  try {
    // 1. 松重豊のエピソードを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()

    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrity.id)

    // 2. 孤独のグルメのロケーションを取得
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .like('description', '%孤独のグルメ%')

    if (!episodes || !locations) {
      throw new Error('データが見つかりません')
    }

    console.log(`📺 エピソード: ${episodes.length}件`)
    console.log(`📍 ロケーション: ${locations.length}件\n`)

    // 3. エピソードタイトルからロケーションを推測して紐付け
    const restaurantMapping = [
      { episode: '新橋の元気な肉めし', restaurant: 'やきとん酒場 新橋店' },
      { episode: '八丁堀の羊肉火鍋とラグメン', restaurant: '西安料理 刀削麺園' },
      { episode: '豪徳寺のカツオのたたきとへぎそば', restaurant: 'へぎそば処 豪徳寺店' },
      { episode: 'タンドリーチキンとキーマカレー', restaurant: 'インド料理 ガンジス' },
      { episode: '御徒町の麻辣湯と葱油餅', restaurant: '蜀香園' },
      { episode: '豚肉の西京味噌漬け焼き定食', restaurant: '和食処 川越亭' },
      { episode: 'チーズダッカルビとサムギョプサル', restaurant: '韓国料理 赤羽店' },
      { episode: '四川風煮込み', restaurant: '四川厨房 蒲田店' },
      { episode: 'ハンバーグとナポリタン', restaurant: '洋食屋 代々木亭' },
      { episode: 'ビリヤニとチキン65', restaurant: 'インド料理 ナマステ' },
      { episode: '牛タンシチューとカキフライ', restaurant: '洋食 湯島亭' },
      { episode: '味噌煮込みうどんと天むす', restaurant: '名古屋めし 神保町店' }
    ]

    let linkCount = 0

    for (const mapping of restaurantMapping) {
      // エピソードを探す
      const episode = episodes.find(ep => ep.title.includes(mapping.episode))
      // ロケーションを探す
      const location = locations.find(loc => loc.name === mapping.restaurant)

      if (episode && location) {
        // 既存の紐付けをチェック
        const { data: existing } = await supabase
          .from('episode_locations')
          .select('id')
          .eq('episode_id', episode.id)
          .eq('location_id', location.id)
          .single()

        if (existing) {
          console.log(`✅ 既存の紐付け: ${mapping.episode} → ${mapping.restaurant}`)
        } else {
          // 新規紐付けを追加
          const { error } = await supabase
            .from('episode_locations')
            .insert([{
              episode_id: episode.id,
              location_id: location.id
            }])

          if (error) {
            console.error(`❌ 紐付けエラー: ${error.message}`)
          } else {
            console.log(`✅ 新規紐付け: ${mapping.episode} → ${mapping.restaurant}`)
            linkCount++
          }
        }
      } else {
        console.log(`⚠️ マッチング失敗: ${mapping.episode} → ${mapping.restaurant}`)
      }
    }

    console.log(`\n🎯 紐付け完了: ${linkCount}件`)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  linkKodokuEpisodes().catch(console.error)
}

export { linkKodokuEpisodes }