#!/usr/bin/env node

/**
 * 孤独のグルメ優先度高い店舗リストの作成と分析
 * 人気エピソード・予約可能店舗を優先的に選定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 優先度の高い店舗（ファン人気・聖地巡礼需要が高い）
const PRIORITY_RESTAURANTS = [
  {
    season: 1,
    episode: 1,
    title: '江東区門前仲町のやきとりと焼きめし',
    current_name: 'やきとり門前仲町店',
    actual_name: '庄や 門前仲町店',
    address: '東京都江東区門前仲町1-8-1',
    tabelog_search: '庄や 門前仲町',
    notes: 'シリーズ第1話の記念すべき店舗'
  },
  {
    season: 1,
    episode: 3,
    title: '豊島区池袋の汁なし担々麺',
    current_name: '池袋ラーメン 汁なし担々麺屋',
    actual_name: '中国家庭料理 楊 2号店',
    address: '東京都豊島区西池袋1-38-1',
    tabelog_search: '楊 2号店 池袋',
    notes: '汁なし担々麺の名店'
  },
  {
    season: 1,
    episode: 4,
    title: '中央区銀座の山形そばとずんだ餅',
    current_name: '銀座そば処',
    actual_name: '佐藤養助 銀座店',
    address: '東京都中央区銀座6-4-17',
    tabelog_search: '佐藤養助 銀座',
    notes: '稲庭うどんの名店'
  },
  {
    season: 1,
    episode: 7,
    title: '武蔵野市吉祥寺の焼き鳥丼と焼売',
    current_name: '吉祥寺中華料理店',
    actual_name: 'みんみん',
    address: '東京都武蔵野市吉祥寺本町1-2-8',
    tabelog_search: 'みんみん 吉祥寺',
    notes: '餃子で有名な中華料理店'
  },
  {
    season: 2,
    episode: 1,
    title: '江東区東陽のカツ丼と冷やし中華',
    current_name: '東陽町定食屋',
    actual_name: 'だるま',
    address: '東京都江東区東陽4-6-14',
    tabelog_search: 'だるま 東陽町',
    notes: 'Season2開始エピソード'
  },
  {
    season: 2,
    episode: 5,
    title: '文京区根津の焼き餃子と焼き焼売',
    current_name: '根津中華料理店',
    actual_name: '香味徳',
    address: '東京都文京区根津2-29-8',
    tabelog_search: '香味徳 根津',
    notes: '餃子が人気の老舗'
  },
  {
    season: 3,
    episode: 1,
    title: '荒川区東日暮里のケバブとラッシー',
    current_name: '日暮里インド料理店',
    actual_name: 'ザクロ',
    address: '東京都荒川区東日暮里5-51-11',
    tabelog_search: 'ザクロ 日暮里',
    notes: 'Season3開始、トルコ料理'
  },
  {
    season: 3,
    episode: 7,
    title: '中野区沼袋の麻婆豆腐と酸辣湯麺',
    current_name: '沼袋中華料理店',
    actual_name: '阿佐',
    address: '東京都中野区沼袋3-27-15',
    tabelog_search: '阿佐 沼袋',
    notes: '四川料理の名店'
  },
  {
    season: 4,
    episode: 1,
    title: '東京都清瀬市のもつ焼き',
    current_name: '清瀬もつ焼き店',
    actual_name: 'もつ焼き ばん',
    address: '東京都清瀬市松山1-15-1',
    tabelog_search: 'もつ焼き ばん 清瀬',
    notes: 'Season4開始エピソード'
  },
  {
    season: 5,
    episode: 1,
    title: '神奈川県横浜市白楽のサンマーメンとカツ丼',
    current_name: '白楽中華料理店',
    actual_name: '三陽',
    address: '神奈川県横浜市神奈川区白楽100',
    tabelog_search: '三陽 白楽',
    notes: 'Season5開始、サンマーメン発祥の店'
  }
]

async function analyzePriorityRestaurants() {
  console.log('🍜 孤独のグルメ 優先度高い店舗リスト分析\n')
  console.log('=' .repeat(60))
  
  // 松重豊のIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (!celebrity) {
    console.error('❌ 松重豊のデータが見つかりません')
    return
  }

  console.log(`\n📊 優先度TOP10店舗（聖地巡礼需要・予約可能性を考慮）\n`)
  
  for (const restaurant of PRIORITY_RESTAURANTS) {
    console.log(`\n【Season${restaurant.season} 第${restaurant.episode}話】`)
    console.log(`📺 ${restaurant.title}`)
    console.log(`❌ 現在の名前: ${restaurant.current_name}`)
    console.log(`✅ 実際の店名: ${restaurant.actual_name}`)
    console.log(`📍 住所: ${restaurant.address}`)
    console.log(`🔍 食べログ検索: "${restaurant.tabelog_search}"`)
    console.log(`💡 ${restaurant.notes}`)
    
    // 現在のデータベース状況を確認
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          locations(
            id,
            name,
            tabelog_url
          )
        )
      `)
      .eq('celebrity_id', celebrity.id)
      .like('title', `%Season${restaurant.season}%第${restaurant.episode}話%`)
      .single()
    
    if (episodes?.episode_locations?.[0]?.locations) {
      const location = episodes.episode_locations[0].locations
      console.log(`\n  📌 DB状況:`)
      console.log(`     - Location ID: ${location.id}`)
      console.log(`     - 食べログURL: ${location.tabelog_url ? '✅ 設定済み' : '❌ 未設定'}`)
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📝 次のステップ:')
  console.log('1. 各店舗の食べログURLを手動で確認')
  console.log('2. update-kodoku-priority-restaurants.ts で一括更新')
  console.log('3. バリューコマース経由でアフィリエイトリンク設定')
  console.log('4. フロントエンドで表示確認')
}

analyzePriorityRestaurants().catch(console.error)