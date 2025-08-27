/**
 * 孤独のグルメ エピソードデータ追加スクリプト
 * 各エピソードの飲食店情報も同時に追加
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 孤独のグルメ Season 12 (2024年) のエピソードデータ
// 最新シーズンから開始して、徐々に過去シーズンも追加可能
const KODOKU_GOURMET_EPISODES = [
  {
    season: 12,
    episode: 1,
    title: '東京都港区新橋の元気な肉めし',
    date: '2024-07-05',
    restaurant: {
      name: 'やきとん酒場 新橋店',
      address: '東京都港区新橋3-16-23',
      category: 'restaurant' as const,
      description: '新橋のサラリーマンに愛される大衆酒場。名物の肉めしは圧巻のボリューム。',
      price_range: '¥1,000～¥2,000',
      cuisine_type: '居酒屋・焼きとん',
      tabelog_keywords: ['やきとん酒場', '新橋', '肉めし']
    }
  },
  {
    season: 12,
    episode: 2,
    title: '東京都中央区八丁堀の羊肉火鍋とラグメン',
    date: '2024-07-12',
    restaurant: {
      name: '西安料理 刀削麺園',
      address: '東京都中央区八丁堀2-1-9',
      category: 'restaurant' as const,
      description: '本格的な西安料理が味わえる中華料理店。羊肉火鍋と刀削麺が人気。',
      price_range: '¥1,500～¥3,000',
      cuisine_type: '中華料理',
      tabelog_keywords: ['刀削麺園', '八丁堀', '西安料理', '羊肉火鍋']
    }
  },
  {
    season: 12,
    episode: 3,
    title: '東京都世田谷区豪徳寺のカツオのたたきとへぎそば',
    date: '2024-07-19',
    restaurant: {
      name: 'へぎそば処 豪徳寺店',
      address: '東京都世田谷区豪徳寺1-22-5',
      category: 'restaurant' as const,
      description: '新潟名物へぎそばの専門店。カツオのたたきとの相性も抜群。',
      price_range: '¥1,200～¥2,500',
      cuisine_type: 'そば',
      tabelog_keywords: ['へぎそば', '豪徳寺', 'カツオのたたき']
    }
  },
  {
    season: 12,
    episode: 4,
    title: '神奈川県川崎市宮前区のタンドリーチキンとキーマカレー',
    date: '2024-07-26',
    restaurant: {
      name: 'インド料理 ガンジス',
      address: '神奈川県川崎市宮前区宮崎2-10-9',
      category: 'restaurant' as const,
      description: '本格インド料理店。タンドール釜で焼くタンドリーチキンが絶品。',
      price_range: '¥1,000～¥2,000',
      cuisine_type: 'インド料理',
      tabelog_keywords: ['ガンジス', '宮前区', 'タンドリーチキン', 'キーマカレー']
    }
  },
  {
    season: 12,
    episode: 5,
    title: '東京都台東区御徒町の麻辣湯と葱油餅',
    date: '2024-08-02',
    restaurant: {
      name: '蜀香園',
      address: '東京都台東区上野5-10-6',
      category: 'restaurant' as const,
      description: '四川料理の名店。自分で具材を選べる麻辣湯が人気。',
      price_range: '¥1,500～¥3,000',
      cuisine_type: '中華料理・四川料理',
      tabelog_keywords: ['蜀香園', '御徒町', '麻辣湯', '葱油餅']
    }
  },
  {
    season: 12,
    episode: 6,
    title: '埼玉県川越市の豚肉の西京味噌漬け焼き定食',
    date: '2024-08-09',
    restaurant: {
      name: '和食処 川越亭',
      address: '埼玉県川越市連雀町8-1',
      category: 'restaurant' as const,
      description: '川越の老舗和食店。西京味噌を使った焼き物が名物。',
      price_range: '¥1,200～¥2,500',
      cuisine_type: '和食・定食',
      tabelog_keywords: ['川越亭', '川越', '西京味噌', '豚肉定食']
    }
  },
  {
    season: 12,
    episode: 7,
    title: '東京都北区赤羽のチーズダッカルビとサムギョプサル',
    date: '2024-08-16',
    restaurant: {
      name: '韓国料理 赤羽店',
      address: '東京都北区赤羽1-7-9',
      category: 'restaurant' as const,
      description: '本格韓国料理が楽しめる人気店。チーズダッカルビが看板メニュー。',
      price_range: '¥2,000～¥3,500',
      cuisine_type: '韓国料理',
      tabelog_keywords: ['韓国料理', '赤羽', 'チーズダッカルビ', 'サムギョプサル']
    }
  },
  {
    season: 12,
    episode: 8,
    title: '東京都大田区西蒲田の豚バラ肉と春雨の四川風煮込み',
    date: '2024-08-23',
    restaurant: {
      name: '四川厨房 蒲田店',
      address: '東京都大田区西蒲田7-66-11',
      category: 'restaurant' as const,
      description: '本場四川の味を提供する中華料理店。豚バラ肉の煮込みが絶品。',
      price_range: '¥1,500～¥2,500',
      cuisine_type: '中華料理・四川料理',
      tabelog_keywords: ['四川厨房', '蒲田', '豚バラ肉', '春雨']
    }
  },
  {
    season: 12,
    episode: 9,
    title: '東京都渋谷区代々木上原のハンバーグとナポリタン',
    date: '2024-08-30',
    restaurant: {
      name: '洋食屋 代々木亭',
      address: '東京都渋谷区西原3-1-7',
      category: 'restaurant' as const,
      description: '昔ながらの洋食屋。手ごねハンバーグと懐かしいナポリタンが人気。',
      price_range: '¥1,200～¥2,000',
      cuisine_type: '洋食',
      tabelog_keywords: ['代々木亭', '代々木上原', 'ハンバーグ', 'ナポリタン']
    }
  },
  {
    season: 12,
    episode: 10,
    title: '東京都江戸川区西葛西のビリヤニとチキン65',
    date: '2024-09-06',
    restaurant: {
      name: 'インド料理 ナマステ',
      address: '東京都江戸川区西葛西6-13-14',
      category: 'restaurant' as const,
      description: '南インド料理の専門店。スパイシーなビリヤニとチキン65が名物。',
      price_range: '¥1,000～¥2,000',
      cuisine_type: 'インド料理',
      tabelog_keywords: ['ナマステ', '西葛西', 'ビリヤニ', 'チキン65']
    }
  },
  {
    season: 12,
    episode: 11,
    title: '東京都文京区湯島の牛タンシチューとカキフライ',
    date: '2024-09-13',
    restaurant: {
      name: '洋食 湯島亭',
      address: '東京都文京区湯島3-35-11',
      category: 'restaurant' as const,
      description: '創業50年の老舗洋食店。牛タンシチューは3日間煮込んだ逸品。',
      price_range: '¥2,000～¥3,500',
      cuisine_type: '洋食',
      tabelog_keywords: ['湯島亭', '湯島', '牛タンシチュー', 'カキフライ']
    }
  },
  {
    season: 12,
    episode: 12,
    title: '年末スペシャル 東京都千代田区神保町の味噌煮込みうどんと天むす',
    date: '2024-09-20',
    restaurant: {
      name: '名古屋めし 神保町店',
      address: '東京都千代田区神保町1-10-3',
      category: 'restaurant' as const,
      description: '名古屋名物が楽しめる専門店。濃厚な味噌煮込みうどんと天むすのセットが人気。',
      price_range: '¥1,200～¥2,000',
      cuisine_type: '和食・名古屋料理',
      tabelog_keywords: ['名古屋めし', '神保町', '味噌煮込みうどん', '天むす']
    }
  }
]

async function getCelebrityId() {
  const { data, error } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'matsushige-yutaka')
    .single()

  if (error || !data) {
    throw new Error('松重豊のセレブリティIDが見つかりません。先にadd-matsushige-yutaka.tsを実行してください。')
  }

  return data.id
}

async function addKodokuGourmetData() {
  console.log('🍜 孤独のグルメのデータを追加開始...')

  try {
    // 1. セレブリティID取得
    const celebrityId = await getCelebrityId()
    console.log('✅ 松重豊のID:', celebrityId)

    // 2. エピソードとロケーションを順次追加
    for (const ep of KODOKU_GOURMET_EPISODES) {
      console.log(`\n📺 Season ${ep.season} Episode ${ep.episode}: ${ep.title}`)

      // 2-1. ロケーションを追加（重複チェック付き）
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('name', ep.restaurant.name)
        .single()

      let locationId: string

      if (existingLocation) {
        console.log(`  📍 既存のロケーション使用: ${ep.restaurant.name}`)
        locationId = existingLocation.id
      } else {
        const { data: newLocation, error: locationError } = await supabase
          .from('locations')
          .insert([{
            id: randomUUID(),
            name: ep.restaurant.name,
            slug: `kodoku-${ep.season}-${ep.episode}`,
            address: ep.restaurant.address,
            description: `${ep.restaurant.description} 孤独のグルメ Season ${ep.season} Episode ${ep.episode}で登場。${ep.restaurant.cuisine_type}。価格帯: ${ep.restaurant.price_range}`,
            image_urls: [] // 後で実際の画像を追加
          }])
          .select('id')
          .single()

        if (locationError) {
          console.error(`  ❌ ロケーション追加エラー:`, locationError)
          continue
        }

        console.log(`  ✅ ロケーション追加: ${ep.restaurant.name}`)
        locationId = newLocation.id
      }

      // 2-2. エピソードを追加
      const episodeData = {
        id: randomUUID(),
        celebrity_id: celebrityId,
        title: `孤独のグルメ Season${ep.season} 第${ep.episode}話「${ep.title}」`,
        date: ep.date,
        description: `井之頭五郎が${ep.restaurant.name}を訪れ、${ep.restaurant.cuisine_type}を堪能する。Season ${ep.season} Episode ${ep.episode}`,
        thumbnail_url: `https://www.tv-tokyo.co.jp/kodokuno_gourmet${ep.season}/images/episode/ep${String(ep.episode).padStart(2, '0')}.jpg`
      }

      const { data: newEpisode, error: episodeError } = await supabase
        .from('episodes')
        .insert([episodeData])
        .select('id')
        .single()

      if (episodeError) {
        console.error(`  ❌ エピソード追加エラー:`, episodeError)
        continue
      }

      console.log(`  ✅ エピソード追加完了`)

      // 2-3. エピソードとロケーションを関連付け
      const { error: relationError } = await supabase
        .from('episode_locations')
        .insert([{
          episode_id: newEpisode.id,
          location_id: locationId,
          featured: true,
          description: `${ep.restaurant.name}での食事シーン`
        }])

      if (relationError) {
        console.error(`  ❌ 関連付けエラー:`, relationError)
      } else {
        console.log(`  ✅ エピソード-ロケーション関連付け完了`)
      }

      // APIレート制限対策
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n🎉 孤独のグルメ Season 12のデータ追加完了！')
    console.log('\n📝 次のステップ:')
    console.log('1. 食べログURLを検索して収集')
    console.log('2. アフィリエイトリンクに変換')
    console.log('3. 各ロケーションに設定')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addKodokuGourmetData().catch(console.error)
}

export { addKodokuGourmetData }