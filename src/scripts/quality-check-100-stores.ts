#!/usr/bin/env npx tsx

/**
 * 100店舗品質チェックスクリプト
 * 追加した店舗の妥当性を検証
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

async function qualityCheck100Stores() {
  console.log('🔍 100店舗品質チェック開始')
  console.log('📊 追加店舗の妥当性を検証します')
  console.log('=' .repeat(60))
  
  // すべての設定済み店舗を取得
  const { data: allStores, error } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, affiliate_info')
    .not('tabelog_url', 'is', null)
    .order('name')
  
  if (error) {
    console.error('❌ データ取得エラー:', error)
    return
  }
  
  if (!allStores || allStores.length === 0) {
    console.log('⚠️ 設定済み店舗が見つかりませんでした')
    return
  }
  
  console.log(`📊 総設定店舗数: ${allStores.length}件`)
  
  // カテゴリ別分析
  const categories = {
    legitimate_restaurants: [] as any[],
    questionable_entries: [] as any[],
    non_food_businesses: [] as any[],
    duplicate_entries: [] as any[],
    suspicious_names: [] as any[]
  }
  
  // 疑わしいキーワード
  const suspiciousKeywords = [
    'コスメ', 'CANMAKE', 'Christian Dior', 'Burberry', 'shu uemura',
    'TOM FORD', '場所（', '撮影（', '行った（', '#', '：',
    'CV：', 'feat.', '関連）', 'Miss Dior', 'WEEKEND'
  ]
  
  const nonFoodKeywords = [
    '撮影スタジオ', 'Batting Center', '古着屋', 'museum', 'BOOKS',
    '美術館', 'スタジオ', 'ジュエリー', 'SHISEIDO THE STORE'
  ]
  
  console.log('\n🔍 品質分析中...')
  
  allStores.forEach((store, index) => {
    const storeName = store.name.toLowerCase()
    
    // 疑わしい名前チェック
    const hasSuspiciousKeyword = suspiciousKeywords.some(keyword => 
      store.name.includes(keyword)
    )
    
    // 非飲食系チェック
    const isNonFood = nonFoodKeywords.some(keyword =>
      storeName.includes(keyword.toLowerCase())
    )
    
    // 重複チェック（名前の類似性）
    const duplicates = allStores.filter(other => 
      other.id !== store.id && 
      other.name.includes(store.name.substring(0, 10)) &&
      store.name.length > 10
    )
    
    if (hasSuspiciousKeyword) {
      categories.suspicious_names.push({
        ...store,
        reason: '疑わしいキーワードを含む'
      })
    } else if (isNonFood) {
      categories.non_food_businesses.push({
        ...store,
        reason: '非飲食系ビジネス'
      })
    } else if (duplicates.length > 0) {
      categories.duplicate_entries.push({
        ...store,
        reason: `重複の可能性 (${duplicates.length}件類似)`
      })
    } else {
      // 正当な店舗として分類
      categories.legitimate_restaurants.push(store)
    }
  })
  
  // 結果レポート
  console.log('\n' + '=' .repeat(80))
  console.log('📊 品質チェック結果')
  console.log('=' .repeat(80))
  
  console.log(`\n✅ 正当な飲食店: ${categories.legitimate_restaurants.length}件`)
  if (categories.legitimate_restaurants.length > 0) {
    console.log('   代表例:')
    categories.legitimate_restaurants.slice(0, 5).forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
    })
    if (categories.legitimate_restaurants.length > 5) {
      console.log(`   ... 他${categories.legitimate_restaurants.length - 5}件`)
    }
  }
  
  console.log(`\n⚠️ 疑わしい名前: ${categories.suspicious_names.length}件`)
  if (categories.suspicious_names.length > 0) {
    categories.suspicious_names.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      理由: ${store.reason}`)
      console.log(`      ID: ${store.id}`)
    })
  }
  
  console.log(`\n🏢 非飲食系ビジネス: ${categories.non_food_businesses.length}件`)
  if (categories.non_food_businesses.length > 0) {
    categories.non_food_businesses.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      理由: ${store.reason}`)
      console.log(`      ID: ${store.id}`)
    })
  }
  
  console.log(`\n🔄 重複の可能性: ${categories.duplicate_entries.length}件`)
  if (categories.duplicate_entries.length > 0) {
    categories.duplicate_entries.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      理由: ${store.reason}`)
      console.log(`      ID: ${store.id}`)
    })
  }
  
  // 修正提案
  const totalProblematic = categories.suspicious_names.length + 
                          categories.non_food_businesses.length +
                          categories.duplicate_entries.length
  
  console.log('\n' + '=' .repeat(80))
  console.log('📋 修正提案')
  console.log('=' .repeat(80))
  
  if (totalProblematic > 0) {
    console.log(`🔧 修正が必要な店舗: ${totalProblematic}件`)
    console.log(`✅ 品質の高い店舗: ${categories.legitimate_restaurants.length}件`)
    console.log(`📈 修正後の想定店舗数: ${categories.legitimate_restaurants.length}件`)
    console.log(`💰 修正後の月間想定収益: ¥${(categories.legitimate_restaurants.length * 3 * 0.02 * 2000).toLocaleString()}`)
  } else {
    console.log('🎉 すべての店舗が適切です！')
    console.log('✅ 修正不要')
  }
  
  // 修正スクリプト生成提案
  if (totalProblematic > 0) {
    console.log('\n🛠️ 修正オプション:')
    console.log('1. 不適切な店舗のtabelog_urlをNULLに設定')
    console.log('2. 不適切な店舗を削除（推奨されません）')
    console.log('3. 手動で適切な店舗と置き換え')
  }
  
  return {
    total: allStores.length,
    legitimate: categories.legitimate_restaurants.length,
    problematic: totalProblematic,
    categories
  }
}

qualityCheck100Stores()