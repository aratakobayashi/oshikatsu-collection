#!/usr/bin/env npx tsx

/**
 * 優先度の高い店舗への食べログURL追加ツール
 * 
 * 明らかに飲食店で、人気が高そうな店舗から先に設定する
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 優先度の高い店舗のマッピング
 * 実際の食べログURLは後で手動調査または自動検索で取得
 */
const PRIORITY_RESTAURANTS = [
  {
    id: 'ff64c19e-e7d9-440a-88f7-0c97c358a8fb',
    name: '400℃ Pizza Tokyo 神楽坂店',
    search_keywords: '400度 400℃ Pizza Tokyo 神楽坂',
    expected_url: 'https://tabelog.com/tokyo/A1309/A130905/' // 仮のURL
  },
  {
    id: 'c214c0a2-00cd-48f9-9172-bf7b9e46580f',  
    name: '400°C 神楽坂',
    search_keywords: '400度 400℃ 神楽坂',
    expected_url: 'https://tabelog.com/tokyo/A1309/A130905/' // 仮のURL
  },
  {
    id: '81c7c76c-e80c-4ebe-aa5e-da201eff1f55',
    name: 'BLUE SIX COFFEE',
    search_keywords: 'BLUE SIX COFFEE 新宿 霞ヶ丘',
    expected_url: 'https://tabelog.com/tokyo/A1318/' // 仮のURL
  },
  {
    id: '5cb387b6-efea-42fa-9164-888d0258e948',
    name: 'Clover\'s Pancake Cafe',
    search_keywords: 'Clover Pancake Cafe 恵比寿',
    expected_url: 'https://tabelog.com/tokyo/A1303/' // 仮のURL
  },
  {
    id: '0eba79ff-1e8f-4890-94ac-6cf77a6c55d1',
    name: 'dancyu食堂',
    search_keywords: 'dancyu食堂 グランスタ 八重洲',
    expected_url: 'https://tabelog.com/tokyo/A1302/' // 仮のURL
  },
  {
    id: '791c5726-cb6b-4659-a773-61e7eb5a8ed1',
    name: 'Donish Coffee Company 神楽坂',
    search_keywords: 'Donish Coffee 神楽坂',
    expected_url: 'https://tabelog.com/tokyo/A1309/' // 仮のURL
  }
]

/**
 * Google検索クエリ生成
 */
function generateSearchQueries(restaurant: typeof PRIORITY_RESTAURANTS[0]) {
  return [
    `"${restaurant.name}" 食べログ site:tabelog.com`,
    `${restaurant.search_keywords} 食べログ site:tabelog.com`,
    `"${restaurant.name.replace(/[（）()]/g, '')}" tabelog`,
  ]
}

/**
 * 優先店舗の情報表示
 */
async function showPriorityRestaurants() {
  console.log('🎯 優先度の高い店舗リスト')
  console.log('=' .repeat(80))
  
  for (let i = 0; i < PRIORITY_RESTAURANTS.length; i++) {
    const restaurant = PRIORITY_RESTAURANTS[i]
    console.log(`\n${i + 1}. ${restaurant.name}`)
    console.log(`   ID: ${restaurant.id}`)
    console.log(`   検索クエリ例:`)
    
    const queries = generateSearchQueries(restaurant)
    queries.forEach((query, idx) => {
      console.log(`     ${idx + 1}) ${query}`)
    })
    
    // データベースから現在の情報を取得
    const { data: location } = await supabase
      .from('locations')
      .select('name, address, tabelog_url')
      .eq('id', restaurant.id)
      .single()
    
    if (location) {
      console.log(`   住所: ${location.address || '未設定'}`)
      console.log(`   食べログURL: ${location.tabelog_url || '❌ 未設定'}`)
    } else {
      console.log(`   ⚠️ データベースで見つかりませんでした`)
    }
  }
  
  console.log('\n🔍 次のステップ:')
  console.log('1. 上記の検索クエリでGoogle検索')
  console.log('2. 見つかった食べログURLをaddコマンドで追加:')
  console.log('   npx tsx src/scripts/priority-tabelog-setup.ts add <location_id> <tabelog_url>')
}

/**
 * 個別店舗への食べログURL追加
 */
async function addTabelogUrl(locationId: string, tabelogUrl: string) {
  console.log(`🔄 食べログURL追加中...`)
  console.log(`ID: ${locationId}`)
  console.log(`URL: ${tabelogUrl}`)
  
  // URLの検証
  if (!tabelogUrl.includes('tabelog.com')) {
    console.error('❌ 有効な食べログURLではありません')
    return
  }
  
  const { data: location, error: fetchError } = await supabase
    .from('locations')
    .select('name, tabelog_url')
    .eq('id', locationId)
    .single()
  
  if (fetchError || !location) {
    console.error('❌ 店舗が見つかりません:', fetchError)
    return
  }
  
  if (location.tabelog_url) {
    console.log(`⚠️ 既に食べログURLが設定されています: ${location.tabelog_url}`)
    console.log(`上書きしますか？ (今回はスキップします)`)
    return
  }
  
  const { error } = await supabase
    .from('locations')
    .update({
      tabelog_url: tabelogUrl,
      affiliate_info: {
        source: 'priority_manual',
        linkswitch_enabled: true,
        added_at: new Date().toISOString(),
        added_by: 'manual_priority_setup'
      }
    })
    .eq('id', locationId)
  
  if (error) {
    console.error('❌ 更新エラー:', error)
  } else {
    console.log(`✅ ${location.name} に食べログURLを追加しました`)
    console.log(`🔗 LinkSwitchが自動でアフィリエイト変換します`)
  }
}

/**
 * 一括設定用のテンプレート生成
 */
function generateBulkTemplate() {
  console.log('📝 一括設定用テンプレート')
  console.log('=' .repeat(50))
  
  PRIORITY_RESTAURANTS.forEach(restaurant => {
    console.log(`# ${restaurant.name}`)
    console.log(`npx tsx src/scripts/priority-tabelog-setup.ts add ${restaurant.id} "TABELOG_URLをここに入力"`)
    console.log('')
  })
  
  console.log('💡 使用方法:')
  console.log('1. 上記の店舗名でGoogle検索')
  console.log('2. 食べログURLを見つける')
  console.log('3. "TABELOG_URLをここに入力"を実際のURLに置き換えて実行')
}

// コマンドライン引数での実行
const action = process.argv[2]
const locationId = process.argv[3]
const tabelogUrl = process.argv[4]

switch (action) {
  case 'add':
    if (!locationId || !tabelogUrl) {
      console.error('❌ 使用方法: npx tsx script.ts add <location_id> <tabelog_url>')
      process.exit(1)
    }
    addTabelogUrl(locationId, tabelogUrl)
    break
    
  case 'template':
    generateBulkTemplate()
    break
    
  case 'list':
  default:
    showPriorityRestaurants()
    break
}