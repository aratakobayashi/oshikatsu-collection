/**
 * 孤独のグルメ店舗の食べログURL手動更新
 * 実在確認済み店舗のみ更新
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 実在確認済み店舗の食べログURL
const VERIFIED_TABELOG_URLS = [
  {
    name: '天ぷら 中山',
    tabelog_url: 'https://tabelog.com/tokyo/A1302/A130204/13018093/',
    notes: 'Season2第2話登場、黒天丼で有名な老舗天ぷら店'
  },
  {
    name: 'やきとり 庄助',
    tabelog_url: 'https://tabelog.com/tokyo/A1317/A131705/13000057/',
    notes: 'Season1第1話・2025劇場版登場の老舗やきとり店'
  },
  {
    name: '中華料理 味楽',
    tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140502/14000107/',
    notes: 'Season2第1話登場、川崎新丸子の中華料理店'
  }
]

async function updateTabelogUrls(): Promise<void> {
  console.log('🍽️ 実在店舗の食べログURL更新開始...')
  
  let updatedCount = 0
  let errors = 0

  for (const restaurant of VERIFIED_TABELOG_URLS) {
    try {
      console.log(`\n📍 ${restaurant.name}`)
      console.log(`🔗 ${restaurant.tabelog_url}`)
      
      // 店舗を検索
      const { data: location, error: searchError } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('name', restaurant.name)
        .like('description', '%Season%Episode%')
        .single()

      if (searchError || !location) {
        console.log(`⚠️ 店舗が見つかりません: ${restaurant.name}`)
        continue
      }

      // 食べログURL更新
      const { error: updateError } = await supabase
        .from('locations')
        .update({ 
          tabelog_url: restaurant.tabelog_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', location.id)

      if (updateError) {
        throw updateError
      }

      console.log(`✅ 更新完了: ${location.name}`)
      console.log(`   住所: ${location.address}`)
      updatedCount++

      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500))

    } catch (error) {
      console.error(`❌ エラー: ${restaurant.name} - ${error}`)
      errors++
    }
  }

  console.log('\n🎉 食べログURL更新完了!')
  console.log('='.repeat(40))
  console.log(`✅ 更新完了: ${updatedCount}件`)
  console.log(`❌ エラー: ${errors}件`)

  // 現在の設定状況確認
  const { data: totalWithUrls } = await supabase
    .from('locations')
    .select('name, tabelog_url')
    .like('description', '%Season%Episode%')
    .not('tabelog_url', 'is', null)
    .order('name')

  if (totalWithUrls && totalWithUrls.length > 0) {
    console.log(`\n📊 食べログURL設定済み店舗: ${totalWithUrls.length}件`)
    totalWithUrls.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.name}`)
    })
  }
}

// 個別店舗URL追加関数（今後の追加用）
export async function addSingleTabelogUrl(locationName: string, tabelogUrl: string): Promise<void> {
  try {
    const { data: location, error: searchError } = await supabase
      .from('locations')
      .select('id, name')
      .eq('name', locationName)
      .like('description', '%Season%Episode%')
      .single()

    if (searchError || !location) {
      console.log(`⚠️ 店舗が見つかりません: ${locationName}`)
      return
    }

    const { error: updateError } = await supabase
      .from('locations')
      .update({ 
        tabelog_url: tabelogUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (updateError) {
      throw updateError
    }

    console.log(`✅ ${locationName} の食べログURL設定完了`)
    console.log(`   URL: ${tabelogUrl}`)

  } catch (error) {
    console.error(`❌ エラー: ${locationName} - ${error}`)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  updateTabelogUrls().catch(console.error)
}

export { updateTabelogUrls }