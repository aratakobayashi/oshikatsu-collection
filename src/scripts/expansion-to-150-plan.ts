#!/usr/bin/env npx tsx

/**
 * 150店舗拡大プランスクリプト
 * 70店舗追加で月間¥18,000達成戦略
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

async function expansionTo150Plan() {
  console.log('🚀 150店舗拡大プラン策定開始')
  console.log('💰 目標: 月間¥18,000達成 (87.5%収益増)')
  console.log('📊 必要: 70店舗追加')
  console.log('=' .repeat(60))
  
  // 現在の状況確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const currentCount = currentStores?.length || 0
  const targetCount = 150
  const needToAdd = targetCount - currentCount
  
  console.log(`📈 現在の設定店舗: ${currentCount}店舗`)
  console.log(`🎯 目標店舗数: ${targetCount}店舗`)
  console.log(`➕ 追加必要数: ${needToAdd}店舗`)
  
  // 利用可能な店舗を検索
  console.log('\n🔍 追加可能店舗を検索中...')
  
  // 高品質な飲食店キーワードで検索
  const qualityKeywords = [
    // 日本料理
    '寿司', '鮨', 'すし', '天ぷら', 'てんぷら', '蕎麦', 'そば', 'うどん',
    '和食', '料亭', '割烹', '小料理', '居酒屋',
    
    // 洋食・イタリアン・フレンチ
    'イタリアン', 'Italian', 'フレンチ', 'French', 'ビストロ', 'Bistro',
    'パスタ', 'ピザ', 'Pizza', 'ステーキ', 'Steak',
    
    // 中華・アジア
    '中華', '中国料理', '韓国料理', 'タイ料理', 'ベトナム料理',
    
    // カフェ・軽食
    'カフェ', 'Cafe', 'Coffee', 'コーヒー', '珈琲',
    'パン', 'Bread', 'ベーカリー', 'Bakery',
    
    // ファストフード・チェーン
    'ハンバーガー', 'バーガー', 'Burger', 'サンドイッチ',
    
    // その他
    'レストラン', 'Restaurant', 'ダイニング', 'Dining',
    'グリル', 'Grill', 'キッチン', 'Kitchen'
  ]
  
  const foundStores: Array<{id: string, name: string, keyword: string}> = []
  
  for (const keyword of qualityKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null)
      .limit(3)
    
    if (stores && stores.length > 0) {
      console.log(`   ✅ "${keyword}": ${stores.length}件`)
      stores.forEach(store => {
        foundStores.push({
          id: store.id,
          name: store.name,
          keyword
        })
      })
      
      if (foundStores.length >= needToAdd + 20) break // 余裕を持って
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 重複除去
  const uniqueStores = foundStores.filter((store, index, self) => 
    self.findIndex(s => s.id === store.id) === index
  )
  
  console.log(`\n📊 検索結果: ${uniqueStores.length}件の追加候補発見`)
  
  // カテゴリ別分析
  const categories: Record<string, number> = {}
  uniqueStores.forEach(store => {
    categories[store.keyword] = (categories[store.keyword] || 0) + 1
  })
  
  console.log('\n📋 カテゴリ別内訳:')
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([keyword, count]) => {
      console.log(`   ${keyword}: ${count}件`)
    })
  
  // 実行プラン提案
  console.log('\n' + '=' .repeat(80))
  console.log('🎯 150店舗達成実行プラン')
  console.log('=' .repeat(80))
  
  const phase1Target = Math.min(needToAdd, uniqueStores.length)
  const monthlyRevenue150 = 150 * 3 * 0.02 * 2000
  const currentRevenue = currentCount * 3 * 0.02 * 2000
  const revenueIncrease = monthlyRevenue150 - currentRevenue
  const increasePercent = Math.round((revenueIncrease / currentRevenue) * 100)
  
  console.log(`\n📈 収益予測:`)
  console.log(`• 現在収益: ¥${currentRevenue.toLocaleString()}/月`)
  console.log(`• 150店舗時: ¥${monthlyRevenue150.toLocaleString()}/月`)
  console.log(`• 収益増加: +¥${revenueIncrease.toLocaleString()}/月 (+${increasePercent}%)`)
  console.log(`• 年間収益: ¥${(monthlyRevenue150 * 12).toLocaleString()}/年`)
  
  console.log(`\n🚀 実行ステップ:`)
  console.log(`1️⃣ フェーズ1: ${Math.min(25, phase1Target)}店舗追加`)
  console.log(`2️⃣ フェーズ2: ${Math.min(25, Math.max(0, phase1Target - 25))}店舗追加`)
  console.log(`3️⃣ フェーズ3: ${Math.max(0, phase1Target - 50)}店舗追加`)
  console.log(`🎯 目標達成: 150店舗 → 月間¥18,000`)
  
  if (uniqueStores.length >= needToAdd) {
    console.log('\n✅ 150店舗達成可能！')
    console.log('🚀 実行準備完了')
  } else {
    console.log(`\n⚠️ 追加候補不足: ${uniqueStores.length}件 (必要: ${needToAdd}件)`)
    console.log('🔍 追加検索が必要')
  }
  
  return {
    currentCount,
    targetCount,
    needToAdd,
    availableStores: uniqueStores.length,
    feasible: uniqueStores.length >= needToAdd,
    stores: uniqueStores.slice(0, needToAdd)
  }
}

expansionTo150Plan()