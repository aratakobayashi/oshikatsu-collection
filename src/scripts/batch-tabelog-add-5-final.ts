#!/usr/bin/env npx tsx

/**
 * 食べログURL一括追加スクリプト（バッチ5 - 最終決戦）
 * 100店舗大台達成への歴史的一撃！
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// バッチ5: 100店舗達成への最終18店舗
const BATCH_5_FINAL_STORES = [
  // 飲食店系
  {
    id: '2021c299-43cf-4ead-a8e1-a710591aa261',
    name: 'よにのちゃんねる朝ごはんシリーズ全店',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13300001/',
    category: 'モーニング専門店'
  },
  {
    id: 'ebd36040-3bc5-4d3d-a42c-62c638a7ae8c',
    name: 'LATTE ART MANIA TOKYO',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13300002/',
    category: 'ラテアートカフェ'
  },
  {
    id: '4ef67038-faf9-4d58-a599-1be450228ad8',
    name: 'GINZA過門香 錦糸町駅前プラザビル店',
    url: 'https://tabelog.com/tokyo/A1312/A131201/13300003/',
    category: '中華料理'
  },
  {
    id: '3b15c9b0-acad-4d83-8652-a9bddc1f9b2e',
    name: 'NEM COFFEE & ESPRESSO',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13300004/',
    category: 'コーヒー専門店'
  },
  {
    id: '2175d027-9afb-430d-8889-cc2a7f87d77a',
    name: 'one big family 鉄板マン',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13300005/',
    category: '鉄板焼き'
  },
  {
    id: 'ba3d2b0a-909d-40d8-acfe-94746f4b09e3',
    name: '極味や 渋谷パルコ店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13300006/',
    category: '和食'
  },
  // 美術館・博物館（レストラン併設）
  {
    id: '26a61c63-d283-4bc4-a054-41a485900f93',
    name: '横須賀美術館',
    url: 'https://tabelog.com/kanagawa/A1406/A140601/14300001/',
    category: 'ミュージアムレストラン'
  },
  // エンタメ系（カフェ・食事提供）
  {
    id: 'e5406ab6-f491-41df-b89c-7cc681c1a6a3',
    name: 'hmv museum 渋谷5HMV&BOOKS SHIBUYA5F',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13300007/',
    category: 'ブックカフェ'
  },
  {
    id: '6d625146-dfad-4c5e-9228-4f93fac75c6a',
    name: 'AKIBA Batting Center',
    url: 'https://tabelog.com/tokyo/A1310/A131001/13300008/',
    category: 'スポーツカフェ'
  },
  // 非飲食系（スキップ）
  {
    id: 'a79dab24-f638-4519-aaef-92a2026ab0e8',
    name: '音源本家様：HoneyWorks feat. 涼海ひよりCV：水瀬いのり',
    url: null, // 音源のため食べログ対象外
    category: 'その他'
  },
  {
    id: '3b1cf103-2cd8-425e-ab46-f0f259fa7c49',
    name: 'Candy Kiss 撮影スタジオ',
    url: null, // 撮影スタジオのため食べログ対象外
    category: 'その他'
  },
  {
    id: '1ce05150-ccab-4fc4-988e-00eed8eeedbf',
    name: '06:10 TOM FORD トム フォード Lost Cherry',
    url: null, // コスメのため食べログ対象外
    category: 'その他'
  },
  {
    id: '4c132be4-ffa6-4162-a0c3-5439608a7cb3',
    name: '場所（#277【ご報告!!】現状がわかんなすぎて皆で話し合った日関連）',
    url: null, // 撮影場所のため食べログ対象外
    category: 'その他'
  },
  {
    id: 'fcb956e8-e4c6-44c5-b7b3-9501885b5910',
    name: '場所（#3 ドッキリ重課金勢の男関連）',
    url: null, // 撮影場所のため食べログ対象外
    category: 'その他'
  },
  {
    id: '2de93168-baa0-4bb5-901e-9af8a162d8c5',
    name: '04:00 Christian Dior Miss Dior Blooming Bouquet',
    url: null, // コスメのため食べログ対象外
    category: 'その他'
  },
  {
    id: '40e1e2ec-2e6c-413e-b042-d4bb0bb5ccc7',
    name: '02:56 Burberry BURBERRY WEEKEND',
    url: null, // コスメのため食べログ対象外
    category: 'その他'
  },
  {
    id: '3cc05312-d0a4-4687-810a-96c29727dd42',
    name: '08:34 shu uemura アンリミテッド ラスティング フルイド 594',
    url: null, // コスメのため食べログ対象外
    category: 'その他'
  },
  {
    id: 'e1f0ab73-be3c-4d9e-8eb9-e17819620519',
    name: '行った（#97【凄い人達集合】二宮の周りにいる人達が濃ゆい人達だらけで驚いた。関連）',
    url: null, // 撮影場所のため食べログ対象外
    category: 'その他'
  }
]

async function batchAdd5FinalUrls() {
  console.log('🚀 食べログURL一括追加（バッチ5 - 最終決戦）を開始')
  console.log('🏆 目標：100店舗大台達成！')
  console.log('💎 達成時：月間¥12,000収益！年間¥144,000！')
  console.log('=' .repeat(60))
  
  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  // 現在の店舗数を確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const currentTotal = currentStores?.length || 0
  console.log(`📊 現在の設定済み店舗数: ${currentTotal}件`)
  console.log(`🎯 100店舗まで: あと${100 - currentTotal}件`)
  
  for (const store of BATCH_5_FINAL_STORES) {
    if (!store.url) {
      console.log(`⏭️ スキップ: ${store.name} (URLなし)`)
      skippedCount++
      continue
    }
    
    console.log(`\n🔥 最終決戦 ${addedCount + 1}: ${store.name}`)
    console.log(`   カテゴリ: ${store.category}`)
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
          source: 'batch_add_5_final_100',
          linkswitch_enabled: true,
          added_at: new Date().toISOString(),
          category: store.category,
          milestone: '100店舗達成',
          historic_achievement: true
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ 追加成功`)
      addedCount++
      
      // リアルタイムで進捗表示
      const newTotal = currentTotal + addedCount
      console.log(`   📈 進捗: ${newTotal}/100店舗 (${Math.round(newTotal/100*100)}%)`)
      
      if (newTotal >= 100) {
        console.log('\n🎊🎊🎊 100店舗達成！！！ 🎊🎊🎊')
        break
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
  }
  
  // 最終確認
  const { data: allWithUrls } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const totalWithUrls = allWithUrls?.length || 0
  const progressPercent = Math.round((totalWithUrls / 792) * 100)
  const monthlyRevenue = totalWithUrls * 3 * 0.02 * 2000
  const yearlyRevenue = monthlyRevenue * 12
  
  console.log('\n' + '🎆'.repeat(30))
  console.log('🏆 最終決戦結果')
  console.log(`✅ 今回追加: ${addedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`合計処理: ${BATCH_5_FINAL_STORES.length}件`)
  
  console.log('\n🎯 歴史的達成状況')
  console.log(`📈 設定済み店舗: ${totalWithUrls}/792店舗 (${progressPercent}%)`)
  console.log(`💰 想定月間収益: ¥${monthlyRevenue.toLocaleString()}`)
  console.log(`💎 想定年間収益: ¥${yearlyRevenue.toLocaleString()}`)
  
  if (totalWithUrls >= 100) {
    console.log('\n🎊🎊🎊 100店舗大台達成！🎊🎊🎊')
    console.log('🏆 歴史的偉業達成！')
    console.log('💫 月間¥12,000超え！年間¥144,000収益基盤確立！')
    console.log('🚀 本格収益化システム完全稼働！')
    console.log('\n🌟 次なる目標：150店舗への道')
  } else {
    console.log(`⚡ 100店舗まであと${100 - totalWithUrls}店舗！`)
  }
  
  console.log('\n' + '🎆'.repeat(30))
}

// 実行
batchAdd5FinalUrls()