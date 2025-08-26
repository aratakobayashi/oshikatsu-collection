#!/usr/bin/env npx tsx

/**
 * 築地人気店舗 → 食べログアフィリエイト追加スクリプト
 * 
 * 伊藤かりん「築地まるごと全部食べ！」エピソードから
 * 確実に特定された築地の人気店舗を追加
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TsukijiRestaurant {
  name: string
  address: string
  description: string
  tabelog_url: string
  specialty: string
}

// 築地の確実に特定された人気店舗
const TSUKIJI_RESTAURANTS: TsukijiRestaurant[] = [
  {
    name: '丸武 本店',
    address: '東京都中央区築地4-10-10 築地センタービル1F',
    description: '築地の老舗卵焼き店。テリー伊藤さんの実家としても有名。甘い出汁が特徴の伝統的な卵焼きが人気。',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131301/13020932/',
    specialty: '卵焼き'
  },
  {
    name: '築地すし大 本館',
    address: '東京都中央区築地4-13-9',
    description: '築地の人気寿司店。新鮮なネタを使った江戸前寿司を手頃な価格で楽しめる。観光客にも地元客にも愛される名店。',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131301/13002314/',
    specialty: '寿司・海鮮'
  },
  {
    name: '築地 どんぶり市場',
    address: '東京都中央区築地4-10-14',
    description: '築地場外市場の海鮮丼専門店。新鮮なまぐろやうにを使った海鮮丼が人気。早朝から営業している。',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131301/13020376/',
    specialty: '海鮮丼'
  }
]

/**
 * 伊藤かりんのセレブリティIDを取得
 */
async function getItoKarinCelebrityId(): Promise<string | null> {
  const { data } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', '伊藤かりん')
    .single()
  
  return data?.id || null
}

/**
 * 築地エピソードのIDを取得
 */
async function getTsukijiEpisodeId(): Promise<string | null> {
  const { data } = await supabase
    .from('episodes')
    .select('id')
    .ilike('title', '%築地まるごと全部食べ%')
    .single()
  
  return data?.id || null
}

/**
 * ロケーションを作成
 */
async function createLocation(restaurant: TsukijiRestaurant, celebrityId: string): Promise<string | null> {
  // 重複チェック
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', restaurant.name)
    .single()
  
  if (existing) {
    console.log(`⏭️ スキップ（既存）: ${restaurant.name}`)
    return existing.id
  }
  
  const locationId = randomUUID()
  const slug = `tsukiji-${restaurant.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/本店|店舗/g, '')
    .replace(/築地/g, '')}-${locationId.substring(0, 8)}`
  
  const { data, error } = await supabase
    .from('locations')
    .insert({
      id: locationId,
      name: restaurant.name,
      slug: slug,
      address: restaurant.address,
      description: restaurant.description,
      tabelog_url: restaurant.tabelog_url,
      celebrity_id: celebrityId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    console.error(`❌ ロケーション作成エラー (${restaurant.name}):`, error.message)
    return null
  }
  
  console.log(`✅ ロケーション作成: ${restaurant.name}`)
  console.log(`   🏷️ 特徴: ${restaurant.specialty}`)
  console.log(`   📍 住所: ${restaurant.address}`)
  console.log(`   🔗 食べログ: ${restaurant.tabelog_url}`)
  return locationId
}

/**
 * エピソードとロケーションをリンク
 */
async function linkEpisodeLocation(episodeId: string, locationId: string, restaurantName: string): Promise<void> {
  // 重複チェック
  const { data: existing } = await supabase
    .from('episode_locations')
    .select('id')
    .eq('episode_id', episodeId)
    .eq('location_id', locationId)
    .single()
  
  if (existing) {
    console.log(`⏭️ エピソードリンク既存: ${restaurantName}`)
    return
  }
  
  const { error } = await supabase
    .from('episode_locations')
    .insert({
      id: randomUUID(),
      episode_id: episodeId,
      location_id: locationId,
      created_at: new Date().toISOString()
    })
  
  if (error) {
    console.error(`❌ エピソードリンクエラー (${restaurantName}):`, error.message)
  } else {
    console.log(`🔗 エピソードリンク作成: ${restaurantName}`)
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🏪 築地人気店舗 → 食べログアフィリエイト追加開始')
  console.log('=' .repeat(60))
  console.log('📺 対象エピソード: 伊藤かりん「築地まるごと全部食べ！」')
  console.log('')

  try {
    // 1. 伊藤かりんのセレブリティIDを取得
    const celebrityId = await getItoKarinCelebrityId()
    if (!celebrityId) {
      console.error('❌ 伊藤かりんが見つかりません')
      return
    }
    console.log(`✅ セレブリティ: 伊藤かりん (${celebrityId})`)

    // 2. 築地エピソードIDを取得
    const episodeId = await getTsukijiEpisodeId()
    if (!episodeId) {
      console.error('❌ 築地エピソードが見つかりません')
      return
    }
    console.log(`✅ エピソード: 築地まるごと全部食べ！ (${episodeId})`)
    console.log('')

    // 3. 各店舗を処理
    let addedCount = 0
    let linkedCount = 0

    for (const restaurant of TSUKIJI_RESTAURANTS) {
      console.log(`🏪 処理中: ${restaurant.name}`)
      
      // ロケーション作成
      const locationId = await createLocation(restaurant, celebrityId)
      if (locationId) {
        addedCount++
        
        // エピソードとリンク
        await linkEpisodeLocation(episodeId, locationId, restaurant.name)
        linkedCount++
      }
      
      console.log('')
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // 4. 結果サマリー
    console.log('🎉 築地店舗追加完了!')
    console.log('=' .repeat(60))
    console.log(`✅ 新規ロケーション: ${addedCount}件`)
    console.log(`🔗 エピソードリンク: ${linkedCount}件`)
    console.log(`💰 収益ポテンシャル: ¥${addedCount * 120}/月`)
    console.log('')

    // 現在のアフィリエイト状況
    const { count: totalStores } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('tabelog_url', 'is', null)

    console.log('📊 更新後のアフィリエイト状況:')
    console.log(`   総店舗数: ${totalStores}件`)
    console.log(`   予想月間収益: ¥${(totalStores || 0) * 120}`)
    console.log('')

    console.log('📋 次のステップ:')
    console.log('- エピソード詳細ページでの表示確認')
    console.log('- 「📍 ロケ地あり」タグの表示')
    console.log('- 「食べログで予約する」ボタンの動作確認')
    console.log('- 他の高価値エピソード（新大久保、浅草）の分析')

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}