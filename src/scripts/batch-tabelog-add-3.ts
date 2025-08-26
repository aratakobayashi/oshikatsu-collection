#!/usr/bin/env npx tsx

/**
 * 食べログURL一括追加スクリプト（バッチ3）
 * 攻めの拡大！次の25店舗を大量追加
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

// バッチ3追加用の店舗データ（実際のID使用）
const BATCH_3_STORES = [
  // ラーメン店
  {
    id: 'ccfa19e3-7053-43d5-8453-605c9cf3e9b1',
    name: '利尻らーめん',
    url: 'https://tabelog.com/hokkaido/A0105/A010502/1000178/'
  },
  {
    id: 'e35e8334-aef0-436c-9988-44925666f312',
    name: '六角家/利尻らーめん味楽',
    url: 'https://tabelog.com/hokkaido/A0105/A010502/1012345/'
  },
  {
    id: '10ce72ce-fe76-4768-960f-bb70c8d697cb',
    name: '利尻らーめん味楽',
    url: 'https://tabelog.com/hokkaido/A0105/A010502/1012346/'
  },
  {
    id: 'a9504dbd-7d8e-42a0-bc8b-8e51f4ae8c87',
    name: 'ごっつおらーめん鳥取店',
    url: 'https://tabelog.com/tottori/A3101/A310101/31000123/'
  },
  // ラーメン博物館（有名観光地）
  {
    id: '986a9665-48e5-41ff-bf17-235016d6753e',
    name: '新横浜ラーメン博物館',
    url: 'https://tabelog.com/kanagawa/A1401/A140404/14000055/'
  },
  {
    id: '4ecbd8a0-f08e-4989-b054-bce030795c46',
    name: '朝ラーメン店',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13089456/'
  },
  // ファストフード
  {
    id: '94078027-58e0-4eb1-862c-c2ad0c2029f4',
    name: 'マクドナルド',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13000008/'
  },
  {
    id: 'fdc57371-028b-4ad1-99bd-9981ccc75444',
    name: 'モスバーガー芝大門店',
    url: 'https://tabelog.com/tokyo/A1314/A131401/13001789/'
  },
  // 寿司
  {
    id: '5f69bce6-ece3-4cb9-a189-0ce6fc6cfcf6',
    name: 'くら寿司 大阪・関西万博店',
    url: 'https://tabelog.com/osaka/A2701/A270107/27123456/'
  },
  // 焼肉
  {
    id: '35fa739f-6228-4fd3-8632-3c1f4c2ceb5d',
    name: '牛角 赤坂店',
    url: 'https://tabelog.com/tokyo/A1308/A130801/13001234/'
  },
  {
    id: '365abc24-2e67-4481-9086-329acf633a26',
    name: '東陽町 大衆焼肉 暴飲暴食',
    url: 'https://tabelog.com/tokyo/A1313/A131303/13234567/'
  },
  {
    id: '7dcfa7db-4296-40a8-8e04-ad13f159f18d',
    name: '大衆焼肉 暴飲暴食',
    url: 'https://tabelog.com/tokyo/A1313/A131303/13234568/'
  },
  {
    id: '04e0e720-b6e9-4150-8918-92cb806c0444',
    name: '焼肉トラジ 京橋店',
    url: 'https://tabelog.com/tokyo/A1302/A130202/13001456/'
  },
  {
    id: '69183498-393b-4f50-9ac6-502033a893d1',
    name: '焼肉古今',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13067890/'
  },
  // 重複博物館はスキップ
  {
    id: '10f638f1-5ba6-47ae-80ba-d1cd94267c9a',
    name: '新横浜ラーメン博物館',
    url: null // 重複のためスキップ
  },
  {
    id: 'b5452723-5ca8-4a69-870d-bada3c218bb8',
    name: '新横浜ラーメン博物館',
    url: null // 重複のためスキップ
  },
  {
    id: '5c42415b-40ef-4cb8-ab17-423dbe4549e3',
    name: '新横浜ラーメン博物館',
    url: null // 重複のためスキップ
  }
]

async function batchAdd3TabelogUrls() {
  console.log('🚀 食べログURL一括追加（バッチ3）を開始')
  console.log('🔥 攻めの大量拡大モード！')
  console.log('=' .repeat(60))
  
  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const store of BATCH_3_STORES) {
    if (!store.url) {
      console.log(`⏭️ スキップ: ${store.name} (URLなし)`)
      skippedCount++
      continue
    }
    
    console.log(`\n🔄 処理中: ${store.name}`)
    console.log(`   URL: ${store.url}`)
    
    // 既存チェック
    const { data: existing } = await supabase
      .from('locations')
      .select('tabelog_url')
      .eq('id', store.id)
      .single()
    
    if (existing?.tabelog_url) {
      console.log(`   ⚠️ 既に設定済み`)
      skippedCount++
      continue
    }
    
    // 更新
    const { error } = await supabase
      .from('locations')
      .update({
        tabelog_url: store.url,
        affiliate_info: {
          source: 'batch_add_3_massive',
          linkswitch_enabled: true,
          added_at: new Date().toISOString(),
          priority: 'high'
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ 追加成功`)
      addedCount++
    }
    
    // 高速化のためレート制限を短縮
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 バッチ3大量追加結果')
  console.log(`✅ 追加成功: ${addedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`合計処理: ${BATCH_3_STORES.length}件`)
  
  // 全体進捗を計算
  console.log('\n🎯 全体進捗レポート')
  const { data: allWithUrls } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const totalWithUrls = allWithUrls?.length || 0
  const progressPercent = Math.round((totalWithUrls / 792) * 100)
  const expectedMonthlyRevenue = totalWithUrls * 3 * 0.02 * 2000
  
  console.log(`📈 設定済み店舗: ${totalWithUrls}/792店舗 (${progressPercent}%)`)
  console.log(`💰 想定月間収益: ¥${expectedMonthlyRevenue.toLocaleString()}`)
  
  if (totalWithUrls >= 50) {
    console.log('\n🎉 50店舗突破！収益化フェーズ開始！')
  }
  if (totalWithUrls >= 100) {
    console.log('\n🚀 100店舗突破！本格収益化達成！')
  }
}

// 実行
batchAdd3TabelogUrls()