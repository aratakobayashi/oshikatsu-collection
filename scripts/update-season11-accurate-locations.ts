#!/usr/bin/env node

/**
 * Season11ロケーション情報の正確な店舗名・詳細情報での更新
 * 調査結果に基づく正確な情報への修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface AccurateLocationUpdate {
  oldName: string
  newData: {
    name: string
    slug: string
    address: string
    description: string
    tags: string[]
    tabelog_url: string
    phone?: string
    opening_hours?: string
  }
}

async function updateSeason11AccurateLocations() {
  console.log('🔄 Season11ロケーション情報を正確な情報で更新中...\n')

  // 調査結果に基づく正確な情報での修正データ
  const locationUpdates: AccurateLocationUpdate[] = [
    {
      oldName: 'キッチンオニオン',
      newData: {
        name: 'キッチンオニオン',
        slug: 'kitchen-onion-kawaguchi-season11-episode4',
        address: '埼玉県川口市幸町2-2-16 クレールマルシェ川口 1階',
        description: '川口の洋食店。目玉焼きハンバーグと雲丹クリームコロッケが名物。ユースケ・サンタマリアがゲスト出演。それぞれの孤独のグルメ第4話の舞台。',
        tags: ['洋食', 'ハンバーグ', 'クリームコロッケ', '川口市', '幸町', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/saitama/A1102/A110201/11051211/',
        phone: '048-299-9093',
        opening_hours: '10:00-17:00（月・火・木・金・土・日）、水曜休み'
      }
    },
    {
      oldName: 'サウナセンター稲荷町',
      newData: {
        name: 'サウナセンター稲荷町',
        slug: 'sauna-center-inarimachi-season11-episode5',
        address: '東京都台東区東上野6-2-8',
        description: 'サウナ施設内の食堂。サウナ後の豚生姜焼き定食が絶品。玉井詩織がゲスト出演。それぞれの孤独のグルメ第5話の舞台。',
        tags: ['サウナ', 'サウナ飯', '豚生姜焼き定食', '台東区', '東上野', '稲荷町', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: '', // サウナ施設のため一般的なタベログなし
        phone: '03-3841-2555',
        opening_hours: '24時間営業'
      }
    },
    {
      oldName: '子ども食堂（教会）',
      newData: {
        name: '平塚バプテスト教会 こひつじ食堂',
        slug: 'kodomo-shokudo-hiratsuka-baptist-church-season11-episode6',
        address: '神奈川県平塚市豊原町4-5',
        description: '平塚バプテスト教会の子ども食堂「こひつじ食堂」。豚バラ大根とシイラのフライを提供。平田満がゲスト出演。それぞれの孤独のグルメ第6話の舞台。',
        tags: ['子ども食堂', '教会', '豚バラ大根', 'シイラのフライ', '平塚市', 'バプテスト教会', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: '', // 子ども食堂のため一般的なタベログなし
        phone: '0463-33-2320',
        opening_hours: '毎月第3・第4金曜日開催'
      }
    },
    {
      oldName: '餃子屋（出雲）',
      newData: {
        name: '餃子屋',
        slug: 'gyoza-ya-izumo-season11-episode7',
        address: '島根県出雲市今市町1268-6',
        description: '出雲市の餃子専門店。手作り餃子とライスが名物。比嘉愛未がゲスト出演。それぞれの孤独のグルメ第7話の舞台。',
        tags: ['餃子', 'ライス', '出雲市', '島根県', '電鉄出雲市駅', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/shimane/A3202/A320201/32002948/',
        phone: '0853-22-5053',
        opening_hours: '17:00-（日曜休み）'
      }
    },
    {
      oldName: 'やすいみ～と',
      newData: {
        name: 'とんかつ割烹 やすいみ～と',
        slug: 'tonkatsu-kappou-yasuimito-fuchu-season11-episode8',
        address: '東京都府中市白糸台1-23-3',
        description: '府中の肉屋直営とんかつ店。特大わらじとんかつが名物。渋川清彦がゲスト出演。それぞれの孤独のグルメ第8話の舞台。',
        tags: ['とんかつ', 'わらじとんかつ', '肉屋直営', '府中市', '白糸台', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/tokyo/A1326/A132602/13081142/',
        phone: '042-363-8601',
        opening_hours: 'ランチ11:30-14:30、ディナー17:00-22:00（日祝休み）'
      }
    },
    {
      oldName: '与倉ドライブイン',
      newData: {
        name: '与倉ドライブイン',
        slug: 'yokura-drive-in-katori-season11-episode9',
        address: '千葉県香取市与倉831',
        description: 'ドライブインの食堂。豚肉キムチ卵炒め定食が名物。黒木華がゲスト出演。それぞれの孤独のグルメ第9話の舞台。',
        tags: ['ドライブイン', '豚肉キムチ卵炒め', '定食', '香取市', '与倉', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/chiba/A1204/A120404/12007437/',
        phone: '0478-58-1837',
        opening_hours: '11:00-19:30（日曜休み）'
      }
    },
    {
      oldName: '南印度ダイニング',
      newData: {
        name: '南印度ダイニング',
        slug: 'minami-indo-dining-nakano-season11-episode10',
        address: '東京都中野区新井1-23-23',
        description: '中野区の本格南インド料理店。カレーランチが絶品。結木滉星、肥後克広がゲスト出演。それぞれの孤独のグルメ第10話の舞台。',
        tags: ['南インド料理', 'カレー', 'ランチ', '中野区', '新井', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/tokyo/A1319/A131902/13049750/',
        phone: '03-3388-0373',
        opening_hours: '11:30-15:00, 17:30-23:00（第2・第4月曜休み）'
      }
    },
    {
      oldName: 'きっちん大浪',
      newData: {
        name: 'きっちん大浪',
        slug: 'kitchen-onami-kichijoji-season11-episode11',
        address: '東京都武蔵野市吉祥寺南町2-13-13 原ビル102',
        description: '吉祥寺のヘルシー定食店。チキンてりやきと惣菜盛り合わせ定食が名物。平祐奈がゲスト出演。それぞれの孤独のグルメ第11話の舞台。',
        tags: ['定食', 'ヘルシー', 'チキンてりやき', '惣菜', '吉祥寺', '武蔵野市', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13198969/',
        phone: '0422-26-9283',
        opening_hours: '18:00-24:00（不定休）'
      }
    },
    {
      oldName: '鳥獣菜魚 あい川',
      newData: {
        name: '鳥獣菜魚 あい川',
        slug: 'choju-saigyo-aikawa-kannai-season11-episode12',
        address: '神奈川県横浜市中区福富町東通り3-11',
        description: '関内の和食店。大トロ頭肉と鶏の水炊きが名物。川原和久がゲスト出演。それぞれの孤独のグルメ第12話（最終回）の舞台。',
        tags: ['和食', '水炊き', '大トロ頭肉', '関内', '横浜市', '福富町', 'それぞれの孤独のグルメ', 'Season11'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140104/14007991/',
        phone: '050-5592-4313',
        opening_hours: '17:00-23:00（日曜休み）'
      }
    }
  ]

  console.log(`🔄 ${locationUpdates.length}店舗の情報を正確な情報に更新します...`)

  let successCount = 0

  for (const locationUpdate of locationUpdates) {
    console.log(`\n🏪 ${locationUpdate.oldName}を更新中...`)

    // 対応するロケーションを検索
    const { data: location, error: findError } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url, phone, opening_hours')
      .eq('name', locationUpdate.oldName)
      .single()

    if (findError || !location) {
      console.error(`❌ ${locationUpdate.oldName}が見つかりません:`, findError)
      continue
    }

    console.log(`📝 店舗名: ${location.name} → ${locationUpdate.newData.name}`)
    console.log(`📍 住所: ${location.address}`)
    console.log(`📍 更新後: ${locationUpdate.newData.address}`)
    console.log(`🔗 タベログURL: ${location.tabelog_url || '未設定'} → ${locationUpdate.newData.tabelog_url || '未設定'}`)

    // データベースを更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        name: locationUpdate.newData.name,
        slug: locationUpdate.newData.slug,
        address: locationUpdate.newData.address,
        description: locationUpdate.newData.description,
        tags: locationUpdate.newData.tags,
        tabelog_url: locationUpdate.newData.tabelog_url || null,
        phone: locationUpdate.newData.phone || null,
        opening_hours: locationUpdate.newData.opening_hours || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (updateError) {
      console.error(`❌ ${locationUpdate.oldName}の更新エラー:`, updateError.message)
      continue
    }

    console.log(`✅ ${locationUpdate.newData.name}更新完了`)
    successCount++
  }

  console.log(`\n🎉 ${successCount}/${locationUpdates.length}店舗の情報更新完了！`)

  // 現在のSeason11ロケーションの状況を表示
  console.log('\n📊 Season11ロケーション更新後の状況:')
  const { data: allSeason11Locations } = await supabase
    .from('locations')
    .select('name, tabelog_url')
    .like('slug', '%season11%')
    .order('name')

  if (allSeason11Locations) {
    allSeason11Locations.forEach((loc, index) => {
      const hasTabelog = loc.tabelog_url && loc.tabelog_url.trim() !== ''
      const status = hasTabelog ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${loc.name} ${hasTabelog ? '(タベログあり)' : '(タベログなし)'}`)
    })

    const withTabelog = allSeason11Locations.filter(loc => loc.tabelog_url && loc.tabelog_url.trim() !== '').length
    console.log(`\n📊 タベログURL設定済み: ${withTabelog}/${allSeason11Locations.length}店舗`)
    
    if (withTabelog === allSeason11Locations.length) {
      console.log('\n🎉 全店舗のタベログURL設定完了！LinkSwitch対応準備完了')
      console.log('\n📋 次のステップ:')
      console.log('1. ValueCommerceでのLinkSwitchタベログURL対応確認')
      console.log('2. フロントエンドでの表示確認')
      console.log('3. Season11の完全なデータ整備完了')
    }
  }
}

updateSeason11AccurateLocations()