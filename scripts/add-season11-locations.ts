#!/usr/bin/env node

/**
 * Season11のロケーション情報をデータベースに追加
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LocationData {
  name: string
  slug: string
  address: string
  description: string
  tags: string[]
  tabelog_url: string
  phone?: string
  opening_hours?: string
}

async function addSeason11Locations() {
  console.log('🏪 Season11のロケーション情報をデータベースに追加中...\n')

  // Season11のロケーションデータ
  const locations: LocationData[] = [
    {
      name: '中華飯店 一番',
      slug: 'chuka-hanten-ichiban-higashiogucho-season11-episode1',
      address: '東京都荒川区東尾久2-17-14',
      description: '東尾久の老舗町中華。海老チャーハンと海鮮春巻が名物。太田光がゲスト出演。それぞれの孤独のグルメ第1話の舞台。',
      tags: ['中華料理', '町中華', '海老チャーハン', '海鮮春巻', '荒川区', '東尾久', '老舗', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: 'https://tabelog.com/tokyo/A1324/A132401/13062699/',
      phone: '03-3892-7090',
      opening_hours: '11:00-14:30, 17:30-21:00（月曜休み）'
    },
    {
      name: 'みたけ食堂',
      slug: 'mitake-shokudo-yanezaika-season11-episode2',
      address: '東京都足立区谷在家1-20-7',
      description: 'セルフ式の食堂。朝から営業し、豊富なおかずが並ぶ。マキタスポーツがゲスト出演。それぞれの孤独のグルメ第2話の舞台。',
      tags: ['食堂', 'セルフ式', '朝ご飯', '定食', '足立区', '谷在家', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報が未確認
      phone: '',
      opening_hours: '早朝〜（営業時間要確認）'
    },
    {
      name: '京城園',
      slug: 'keijoen-jimbocho-season11-episode3',
      address: '東京都千代田区神田神保町1-35-16',
      description: '1967年創業の老舗焼肉店。厚切り上タン塩とゲタカルビが名物。板谷由夏がゲスト出演。それぞれの孤独のグルメ第3話の舞台。',
      tags: ['焼肉', '上タン塩', 'ゲタカルビ', '神保町', '老舗', '1967年創業', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: 'https://tabelog.com/tokyo/A1310/A131003/13011592/',
      phone: '03-3295-2378',
      opening_hours: '11:30-14:00, 17:00-21:30（日曜休み）'
    },
    {
      name: 'キッチンオニオン',
      slug: 'kitchen-onion-kawaguchi-season11-episode4',
      address: '埼玉県川口市西川口1-19-6',
      description: '地元で愛される洋食店。目玉焼きハンバーグと雲丹クリームコロッケが名物。中山裕介がゲスト出演。それぞれの孤独のグルメ第4話の舞台。',
      tags: ['洋食', 'ハンバーグ', 'クリームコロッケ', '川口市', '西川口', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報が未確認
      phone: '',
      opening_hours: ''
    },
    {
      name: 'サウナセンター稲荷町',
      slug: 'sauna-center-inarimachi-season11-episode5',
      address: '東京都台東区東上野5-1-2',
      description: 'サウナ施設内の食堂。サウナ後の生姜焼き定食が絶品。玉井詩織がゲスト出演。それぞれの孤独のグルメ第5話の舞台。',
      tags: ['サウナ', 'サウナ飯', '生姜焼き定食', '台東区', '東上野', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // サウナ施設のため一般的なタベログなし
      phone: '03-3834-7700',
      opening_hours: 'サウナ営業時間内'
    },
    {
      name: '子ども食堂（教会）',
      slug: 'kodomo-shokudo-church-hiratsuka-season11-episode6',
      address: '神奈川県平塚市内（詳細非公開）',
      description: '教会の子ども食堂。豚バラ大根とシイラのフライを提供。平田満がゲスト出演。それぞれの孤独のグルメ第6話の舞台。',
      tags: ['子ども食堂', '教会', '豚バラ大根', 'シイラのフライ', '平塚市', 'コミュニティ', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // 子ども食堂のため一般的なタベログなし
      phone: '',
      opening_hours: ''
    },
    {
      name: '餃子屋（出雲）',
      slug: 'gyoza-ya-izumo-season11-episode7',
      address: '島根県出雲市内',
      description: '出雲市の餃子専門店。地元で愛される餃子とライスが名物。比嘉愛未がゲスト出演。それぞれの孤独のグルメ第7話の舞台。',
      tags: ['餃子', 'ライス', '出雲市', '島根県', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // 詳細情報要確認
      phone: '',
      opening_hours: ''
    },
    {
      name: 'やすいみ～と',
      slug: 'yasuimito-fuchu-season11-episode8',
      address: '東京都府中市白糸台6-31-11',
      description: '府中の洋食店。特大わらじとんかつが名物。渋川清彦がゲスト出演。それぞれの孤独のグルメ第8話の舞台。',
      tags: ['洋食', 'とんかつ', 'わらじとんかつ', '府中市', '白糸台', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報要確認
      phone: '',
      opening_hours: ''
    },
    {
      name: '与倉ドライブイン',
      slug: 'yokura-drive-in-katori-season11-episode9',
      address: '千葉県香取市小見川2870-1',
      description: 'ドライブインの食堂。豚肉キムチ卵炒め定食が名物。黒木華がゲスト出演。それぞれの孤独のグルメ第9話の舞台。',
      tags: ['ドライブイン', '豚肉キムチ卵炒め', '定食', '香取市', '小見川', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報要確認
      phone: '',
      opening_hours: ''
    },
    {
      name: '南印度ダイニング',
      slug: 'minami-indo-dining-nakano-season11-episode10',
      address: '東京都中野区新井1-17-1',
      description: '中野区の本格南インド料理店。カレーランチが絶品。結木滉星、肥後克広がゲスト出演。それぞれの孤独のグルメ第10話の舞台。',
      tags: ['南インド料理', 'カレー', 'ランチ', '中野区', '新井', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報要確認
      phone: '',
      opening_hours: ''
    },
    {
      name: 'きっちん大浪',
      slug: 'kitchen-onami-kichijoji-season11-episode11',
      address: '東京都武蔵野市吉祥寺本町1-20-16',
      description: '吉祥寺のヘルシー定食店。チキンてりやきと惣菜盛り合わせ定食が名物。平祐奈がゲスト出演。それぞれの孤独のグルメ第11話の舞台。',
      tags: ['定食', 'ヘルシー', 'チキンてりやき', '惣菜', '吉祥寺', '武蔵野市', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報要確認
      phone: '',
      opening_hours: ''
    },
    {
      name: '鳥獣菜魚 あい川',
      slug: 'choju-saigyo-aikawa-kannai-season11-episode12',
      address: '神奈川県横浜市中区住吉町6-68-1',
      description: '関内の和食店。大トロ頭肉と鶏の水炊きが名物。川原和久がゲスト出演。それぞれの孤独のグルメ第12話（最終回）の舞台。',
      tags: ['和食', '水炊き', '大トロ頭肉', '関内', '横浜市', 'それぞれの孤独のグルメ', 'Season11'],
      tabelog_url: '', // タベログ情報要確認
      phone: '',
      opening_hours: ''
    }
  ]

  console.log(`🏪 ${locations.length}店舗のロケーション情報を追加します...`)

  let successCount = 0

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i]
    const locationId = randomUUID()
    
    console.log(`\n🏪 第${i + 1}話店舗を追加中: ${location.name}`)
    console.log(`🆔 UUID: ${locationId}`)
    console.log(`📍 住所: ${location.address}`)

    const { data, error } = await supabase
      .from('locations')
      .insert({
        id: locationId,
        name: location.name,
        slug: location.slug,
        address: location.address,
        description: location.description,
        tags: location.tags,
        tabelog_url: location.tabelog_url || null,
        phone: location.phone || null,
        opening_hours: location.opening_hours || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error(`❌ 第${i + 1}話店舗の追加エラー:`, error.message)
      continue
    }

    console.log(`✅ 第${i + 1}話店舗追加完了: ${location.name}`)
    successCount++
  }

  console.log(`\n🎉 Season11ロケーション${successCount}/${locations.length}店舗を追加完了！`)
  
  if (successCount === locations.length) {
    console.log('\n📋 次のステップ:')
    console.log('1. 各エピソードとロケーションの関連付け')
    console.log('2. 未確認店舗のタベログURL調査・追加')
    console.log('3. LinkSwitch対応確認')
    console.log('\n💡 注意: 一部店舗はタベログURL未設定（調査が必要）')
  }
}

addSeason11Locations()