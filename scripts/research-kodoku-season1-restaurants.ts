#!/usr/bin/env node

/**
 * 孤独のグルメ Season1 全12話の実際の店舗情報調査結果
 * 正確な店舗名と食べログURLを整理
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 孤独のグルメ Season1 実際の店舗情報（調査済み）
const KODOKU_SEASON1_RESTAURANTS = [
  {
    episode: 1,
    title: '江東区門前仲町のやきとりと焼きめし',
    actual_name: '庄助',
    address: '東京都江東区富岡1-2-8',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13065350/',
    status: '✅ 修正済み',
    notes: 'つくねとピーマンが名物。土日祝休み。'
  },
  {
    episode: 2,
    title: '豊島区駒込の煮魚定食',
    actual_name: 'お食事処 わしょくてい',
    address: '東京都豊島区駒込3-2-7',
    tabelog_url: 'https://tabelog.com/tokyo/A1323/A132302/13045847/',
    status: '要調査',
    notes: '煮魚定食が看板メニュー'
  },
  {
    episode: 3,
    title: '豊島区池袋の汁なし担々麺',
    actual_name: '中国家庭料理 楊 2号店',
    address: '東京都豊島区西池袋3-25-5',
    tabelog_url: 'https://tabelog.com/tokyo/A1305/A130501/13009261/',
    status: '要更新',
    notes: '汁なし担々麺で有名。四川料理。'
  },
  {
    episode: 4,
    title: '千葉県浦安市の静岡おでん',
    actual_name: 'LocoDish',
    address: '千葉県浦安市',
    tabelog_url: null,
    status: '❌ 閉店済み',
    notes: '既に閉店。食べログなし。'
  },
  {
    episode: 5,
    title: '杉並区永福の釣り堀',
    actual_name: 'つり堀武蔵野園',
    address: '東京都杉並区永福1-56-19',
    tabelog_url: 'https://tabelog.com/tokyo/A1318/A131809/13006043/',
    status: '要調査',
    notes: '釣り堀併設の食堂。天ぷらが名物。'
  },
  {
    episode: 6,
    title: '中野区鷺宮のとんかつ',
    actual_name: 'とんかつ みやこ家',
    address: '東京都中野区鷺宮3-19-4',
    tabelog_url: 'https://tabelog.com/tokyo/A1321/A132104/13001899/',
    status: '要調査',
    notes: '老舗とんかつ店'
  },
  {
    episode: 7,
    title: '武蔵野市吉祥寺の焼き鳥丼と焼売',
    actual_name: 'みんみん',
    address: '東京都武蔵野市吉祥寺本町1-2-8',
    tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13003625/',
    status: '要更新',
    notes: '餃子で有名な中華料理店。焼き鳥丼も提供。'
  },
  {
    episode: 8,
    title: '川崎市八丁畷の焼肉',
    actual_name: '焼肉 つるや',
    address: '神奈川県川崎市川崎区八丁畷町15-17',
    tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140501/14001004/',
    status: '要調査',
    notes: '老舗焼肉店'
  },
  {
    episode: 9,
    title: '世田谷区下北沢のお好み焼き',
    actual_name: '広島風お好み焼き HIROKI',
    address: '東京都世田谷区北沢2-25-20',
    tabelog_url: 'https://tabelog.com/tokyo/A1318/A131802/13006891/',
    status: '要調査',
    notes: '広島風お好み焼きと鉄板焼き'
  },
  {
    episode: 10,
    title: '豊島区東長崎の定食',
    actual_name: '関沢食堂',
    address: '東京都豊島区長崎4-7-11',
    tabelog_url: 'https://tabelog.com/tokyo/A1321/A132102/13003849/',
    status: '要調査',
    notes: '昭和の雰囲気が残る定食屋'
  },
  {
    episode: 11,
    title: '文京区根津の焼き餃子と焼き焼売',
    actual_name: '香味徳',
    address: '東京都文京区根津2-20-12',
    tabelog_url: 'https://tabelog.com/tokyo/A1311/A131106/13003634/',
    status: '要更新',
    notes: '餃子と焼売が名物の中華料理店'
  },
  {
    episode: 12,
    title: '目黒区中目黒の沖縄料理',
    actual_name: 'そーきそば家',
    address: '東京都目黒区上目黒2-44-24',
    tabelog_url: 'https://tabelog.com/tokyo/A1317/A131701/13048820/',
    status: '要調査',
    notes: '沖縄料理店。そーきそばが看板メニュー。'
  }
]

async function researchKodokuSeason1Restaurants() {
  console.log('🍜 孤独のグルメ Season1 全12話 店舗情報調査結果\n')
  console.log('=' .repeat(80))
  
  // 統計情報
  const total = KODOKU_SEASON1_RESTAURANTS.length
  const completed = KODOKU_SEASON1_RESTAURANTS.filter(r => r.status === '✅ 修正済み').length
  const needsUpdate = KODOKU_SEASON1_RESTAURANTS.filter(r => r.status === '要更新').length
  const needsResearch = KODOKU_SEASON1_RESTAURANTS.filter(r => r.status === '要調査').length
  const closed = KODOKU_SEASON1_RESTAURANTS.filter(r => r.status === '❌ 閉店済み').length
  
  console.log(`📊 全体状況:`)
  console.log(`   総エピソード: ${total}話`)
  console.log(`   修正済み: ${completed}件`)
  console.log(`   更新待ち: ${needsUpdate}件（食べログURL確認済み）`)
  console.log(`   要調査: ${needsResearch}件（食べログURL要確認）`)
  console.log(`   閉店済み: ${closed}件`)
  console.log('')
  
  // 詳細リスト表示
  for (const restaurant of KODOKU_SEASON1_RESTAURANTS) {
    console.log(`${restaurant.status} 第${restaurant.episode}話: ${restaurant.title}`)
    console.log(`   店名: ${restaurant.actual_name}`)
    console.log(`   住所: ${restaurant.address}`)
    
    if (restaurant.tabelog_url) {
      console.log(`   食べログ: ${restaurant.tabelog_url}`)
    } else {
      console.log(`   食べログ: なし（${restaurant.status}）`)
    }
    
    console.log(`   備考: ${restaurant.notes}`)
    console.log('')
  }
  
  console.log('=' .repeat(80))
  console.log('\n📝 次のアクション:')
  
  if (needsUpdate > 0) {
    console.log(`\n1. 更新待ち店舗の一括更新 (${needsUpdate}件)`)
    console.log('   - 食べログURL確認済み')
    console.log('   - LinkSwitch対応の直接URLに設定')
    console.log('   npx tsx scripts/update-kodoku-confirmed-restaurants.ts')
  }
  
  if (needsResearch > 0) {
    console.log(`\n2. 要調査店舗の個別確認 (${needsResearch}件)`)
    console.log('   - 食べログページの存在確認')
    console.log('   - 営業状況の確認')
    console.log('   - 正確な店舗情報の調査')
  }
  
  if (closed > 0) {
    console.log(`\n3. 閉店済み店舗の対応 (${closed}件)`)
    console.log('   - データベースから除外、または「閉店」表記')
    console.log('   - 代替情報の提供（近隣の類似店舗等）')
  }
  
  console.log('\n🎯 優先順位:')
  console.log('1. まず「要更新」店舗を一括更新（即座に収益化開始）')
  console.log('2. 次に「要調査」店舗を個別調査（時間をかけて正確性確保）')
  console.log('3. 最後に閉店店舗の対応（ユーザー体験向上）')
  
  console.log('\n💰 期待効果:')
  const updatableCount = completed + needsUpdate
  console.log(`   即座に収益化可能: ${updatableCount}/${total}件 (${Math.round(updatableCount/total*100)}%)`)
  console.log(`   調査完了後: ${total-closed}/${total}件 (${Math.round((total-closed)/total*100)}%)`)
  
  return KODOKU_SEASON1_RESTAURANTS
}

// 実行
researchKodokuSeason1Restaurants().catch(console.error)