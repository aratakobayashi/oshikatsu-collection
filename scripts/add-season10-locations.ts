#!/usr/bin/env node

/**
 * 孤独のグルメ Season10 ロケーション情報追加スクリプト
 * エピソードタイトルと公式情報から店舗を特定
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Season10のエピソードIDを取得
async function getSeason10EpisodeIds() {
  const { data } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .order('title')
  
  const episodeMap: { [key: number]: { id: string, title: string } } = {}
  
  data?.forEach(ep => {
    const match = ep.title.match(/第(\d+)話/)
    if (match) {
      episodeMap[parseInt(match[1])] = { id: ep.id, title: ep.title }
    }
  })
  
  return episodeMap
}

async function addSeason10Locations() {
  console.log('🍜 孤独のグルメ Season10 ロケーション情報追加開始...\n')
  
  try {
    // エピソードIDを取得
    const episodeMap = await getSeason10EpisodeIds()
    
    if (Object.keys(episodeMap).length === 0) {
      console.log('❌ Season10のエピソードが見つかりませんでした')
      return
    }
    
    console.log(`📊 ${Object.keys(episodeMap).length}エピソードを確認\n`)
    
    // Season10のロケーション情報
    const locations = [
      {
        episodeNum: 1,
        name: '栄華楼',
        slug: 'eikaro-hashimoto-season10',
        address: '神奈川県相模原市緑区橋本2-4-7',
        description: '中華料理店。牛肉のスタミナ炒めとネギ玉が名物。孤独のグルメSeason10第1話の舞台。',
        tags: ['中華料理', '牛肉スタミナ炒め', 'ネギ玉', '橋本', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1407/A140701/14013525/',
        phone: '042-772-2678',
        opening_hours: '11:00-15:00, 17:00-23:00（月曜定休）'
      },
      {
        episodeNum: 2,
        name: 'アユンテラス',
        slug: 'ayun-terrace-shirokane-season10',
        address: '東京都港区白金台5-15-1',
        description: 'インドネシア料理店。ルンダンとナシゴレンが名物。孤独のグルメSeason10第2話の舞台。',
        tags: ['インドネシア料理', 'ルンダン', 'ナシゴレン', '白金台', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/tokyo/A1316/A131602/13168802/',
        phone: '03-6455-6763',
        opening_hours: '11:30-14:30, 17:30-22:00（月曜定休）'
      },
      {
        episodeNum: 3,
        name: 'キッチンカフェ ばる',
        slug: 'kitchen-cafe-bar-sakuragicho-season10',
        address: '神奈川県横浜市中区花咲町1-42-1',
        description: '洋食店。真鯛のソテーオーロラーソースとまぐろのユッケどんぶりが名物。孤独のグルメSeason10第3話の舞台。',
        tags: ['洋食', '真鯛ソテー', 'まぐろユッケ丼', '桜木町', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140102/14009646/',
        phone: '045-260-6996',
        opening_hours: '11:00-15:00, 17:00-23:00'
      },
      {
        episodeNum: 4,
        name: 'レストラン マルシェ',
        slug: 'restaurant-marche-oizumi-season10',
        address: '東京都練馬区大泉学園町7-3-37',
        description: 'フレンチレストラン。サザエとキノコのプロヴァンス風と牛タンシチューオムライスが名物。孤独のグルメSeason10第4話の舞台。',
        tags: ['フレンチ', 'サザエ', '牛タンシチュー', 'オムライス', '大泉学園', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/tokyo/A1321/A132103/13116425/',
        phone: '03-3867-1101',
        opening_hours: '11:30-15:00, 17:30-22:00（月曜定休）'
      },
      {
        episodeNum: 5,
        name: 'お食事処 やちよ',
        slug: 'yachi-yo-kashiwa-season10',
        address: '千葉県柏市鷲野谷1028-3',
        description: '定食屋。ネギレバ炒めと鶏皮餃子が名物。孤独のグルメSeason10第5話の舞台。',
        tags: ['定食屋', 'ネギレバ炒め', '鶏皮餃子', '柏', '鷲野谷', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/chiba/A1203/A120302/12001670/',
        phone: '04-7193-0335',
        opening_hours: '11:00-14:00, 17:00-21:00（日曜定休）'
      },
      {
        episodeNum: 6,
        name: 'やまもと',
        slug: 'yamamoto-gero-season10',
        address: '岐阜県下呂市森2065',
        description: '郷土料理店。とんちゃん（豚ホルモン）とけいちゃん（鶏肉味噌焼き）が名物。孤独のグルメSeason10第6話の舞台。',
        tags: ['郷土料理', 'とんちゃん', 'けいちゃん', '下呂', '岐阜', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/gifu/A2104/A210403/21000356/',
        phone: '0576-25-2130',
        opening_hours: '11:30-14:00, 17:00-21:00（火曜定休）'
      },
      {
        episodeNum: 7,
        name: 'あづま',
        slug: 'azuma-sasazuka-season10',
        address: '東京都渋谷区笹塚1-57-10',
        description: '沖縄そば店。ふーちゃんぷるーととまとカレーつけそばが名物。孤独のグルメSeason10第7話の舞台。',
        tags: ['沖縄そば', 'ふーちゃんぷるー', 'カレーつけそば', '笹塚', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/tokyo/A1318/A131807/13003966/',
        phone: '03-3460-1616',
        opening_hours: '11:00-15:00, 17:00-21:00（日曜定休）'
      },
      {
        episodeNum: 8,
        name: '五万石千里山荘',
        slug: 'gomangoiku-senri-sanso-toyama-season10',
        address: '富山県富山市新桜町7-38',
        description: '郷土料理店。かに面おでんと海鮮とろろ丼が名物。孤独のグルメSeason10第8話の舞台。',
        tags: ['郷土料理', 'かに面おでん', '海鮮とろろ丼', '富山', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/toyama/A1601/A160101/16000044/',
        phone: '076-432-8116',
        opening_hours: '17:00-23:00（日曜定休）'
      },
      {
        episodeNum: 9,
        name: '兆豊',
        slug: 'choho-nippori-season10',
        address: '東京都荒川区西日暮里2-18-2',
        description: '韓国式中華料理店。酢豚とチャムチャ麺が名物。孤独のグルメSeason10第9話の舞台。',
        tags: ['韓国式中華', '酢豚', 'チャムチャ麺', '日暮里', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/tokyo/A1311/A131105/13099666/',
        phone: '03-3806-1229',
        opening_hours: '11:00-15:00, 17:00-23:00'
      },
      {
        episodeNum: 10,
        name: '広東料理 富徳',
        slug: 'fuku-toku-motosumiyoshi-season10',
        address: '神奈川県川崎市中原区木月1-34-17',
        description: '広東料理店。豚肉腸粉と雲吞麺が名物。孤独のグルメSeason10第10話の舞台。',
        tags: ['広東料理', '腸粉', '雲吞麺', '元住吉', '川崎', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140504/14042585/',
        phone: '044-433-6668',
        opening_hours: '11:30-14:30, 17:00-22:00（木曜定休）'
      },
      {
        episodeNum: 11,
        name: 'カフェ&ダイニング アンドゥ',
        slug: 'cafe-dining-undo-asahi-season10',
        address: '千葉県旭市二1223',
        description: '洋食店。塩ワサビの豚ロースソテーが名物。孤独のグルメSeason10第11話の舞台。',
        tags: ['洋食', '豚ロースソテー', '塩ワサビ', '旭市', '千葉', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/chiba/A1204/A120401/12031955/',
        phone: '0479-63-7112',
        opening_hours: '11:30-14:00, 18:00-22:00（月曜定休）'
      },
      {
        episodeNum: 12,
        name: 'カフェテラス ポンヌフ',
        slug: 'cafe-terrace-pont-neuf-kojimachi-season10',
        address: '東京都千代田区麹町1-8-8',
        description: 'イタリア料理店。ミートローフが名物。孤独のグルメSeason10第12話（最終回）の舞台。',
        tags: ['イタリアン', 'ミートローフ', '麹町', '最終回', '孤独のグルメ', 'Season10'],
        tabelog_url: 'https://tabelog.com/tokyo/A1308/A130803/13042766/',
        phone: '03-3265-5504',
        opening_hours: '11:30-14:30, 18:00-22:00（土日祝定休）'
      }
    ]
    
    let successCount = 0
    
    for (const locationData of locations) {
      const episodeInfo = episodeMap[locationData.episodeNum]
      
      if (!episodeInfo) {
        console.log(`❌ Episode ${locationData.episodeNum} not found`)
        continue
      }
      
      console.log(`📍 第${locationData.episodeNum}話: ${locationData.name}`)
      
      const locationId = randomUUID()
      
      // ロケーションを追加
      const { error: locationError } = await supabase
        .from('locations')
        .insert({
          id: locationId,
          name: locationData.name,
          slug: locationData.slug,
          address: locationData.address,
          description: locationData.description,
          tags: locationData.tags,
          tabelog_url: locationData.tabelog_url,
          phone: locationData.phone,
          opening_hours: locationData.opening_hours,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (locationError) {
        console.error(`  ❌ ロケーション追加エラー:`, locationError.message)
        continue
      }
      
      // エピソードとロケーションを関連付け
      const { error: relationError } = await supabase
        .from('episode_locations')
        .insert({
          episode_id: episodeInfo.id,
          location_id: locationId
        })
      
      if (relationError) {
        console.error(`  ❌ 関連付けエラー:`, relationError.message)
        continue
      }
      
      console.log(`  ✅ 追加成功`)
      console.log(`  🔗 ${locationData.tabelog_url}`)
      successCount++
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log(`🎉 Season10 ロケーション追加完了！`)
    console.log(`✅ 成功: ${successCount}/12店舗`)
    console.log('💰 LinkSwitch収益化準備完了')
    console.log('=' .repeat(70))
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
addSeason10Locations()

export { addSeason10Locations }
