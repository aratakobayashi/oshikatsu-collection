#!/usr/bin/env npx tsx

/**
 * 大量店舗検索スクリプト
 * あらゆるカテゴリから25店舗を発掘
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

async function findMoreStores() {
  console.log('🔍 大量店舗検索開始！')
  console.log('🎯 目標: 25店舗発掘')
  console.log('=' .repeat(60))
  
  const categories = [
    // 和食系
    { keywords: ['寿司', '鮨', 'すし', 'スシ'], name: '寿司' },
    { keywords: ['天ぷら', 'てんぷら'], name: '天ぷら' },
    { keywords: ['そば', '蕎麦', 'うどん'], name: 'そば・うどん' },
    { keywords: ['居酒屋', '酒場', 'bar', 'Bar', 'BAR'], name: '居酒屋・バー' },
    { keywords: ['焼鳥', '焼き鳥', 'やきとり'], name: '焼鳥' },
    
    // 洋食・イタリアン
    { keywords: ['イタリアン', 'Italian', 'パスタ', 'ピザ', 'Pizza'], name: 'イタリアン' },
    { keywords: ['フレンチ', 'French', 'ビストロ', 'Bistro'], name: 'フレンチ' },
    { keywords: ['ハンバーガー', 'バーガー', 'Burger'], name: 'ハンバーガー' },
    { keywords: ['ステーキ', 'steak', 'Steak'], name: 'ステーキ' },
    
    // アジア系
    { keywords: ['中華', '中国料理', 'Chinese'], name: '中華' },
    { keywords: ['韓国', '韓国料理', 'Korean'], name: '韓国料理' },
    { keywords: ['タイ', 'Thai', 'タイ料理'], name: 'タイ料理' },
    { keywords: ['インド', 'India', 'インド料理'], name: 'インド料理' },
    
    // スイーツ・パン
    { keywords: ['パン', 'Bread', 'ベーカリー', 'Bakery'], name: 'パン・ベーカリー' },
    { keywords: ['スイーツ', 'Sweet', 'ケーキ', 'Cake'], name: 'スイーツ' },
    { keywords: ['アイス', 'Ice', 'ジェラート'], name: 'アイス' },
    
    // カフェ・ドリンク
    { keywords: ['Tea', 'tea', '紅茶', 'お茶'], name: 'お茶・紅茶' },
    { keywords: ['Bar', 'bar', 'バー', 'Pub'], name: 'バー・パブ' },
    
    // その他
    { keywords: ['Dining', 'dining', 'ダイニング'], name: 'ダイニング' },
    { keywords: ['Restaurant', 'restaurant', 'レストラン'], name: 'レストラン' },
    { keywords: ['Grill', 'grill', 'グリル'], name: 'グリル' }
  ]
  
  const foundStores: Array<{id: string, name: string, category: string}> = []
  
  for (const category of categories) {
    console.log(`\n🔎 ${category.name}カテゴリを検索...`)
    
    for (const keyword of category.keywords) {
      const { data: stores, error } = await supabase
        .from('locations')
        .select('id, name')
        .ilike('name', `%${keyword}%`)
        .is('tabelog_url', null)
        .limit(3)
      
      if (error) continue
      
      if (stores && stores.length > 0) {
        console.log(`   ✅ "${keyword}": ${stores.length}件`)
        stores.forEach((store, index) => {
          console.log(`      ${index + 1}. ${store.name}`)
          foundStores.push({
            id: store.id,
            name: store.name,
            category: category.name
          })
        })
        
        if (foundStores.length >= 25) break
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (foundStores.length >= 25) break
  }
  
  console.log('\n' + '=' .repeat(80))
  console.log('📊 大量検索結果')
  console.log(`合計発見店舗: ${foundStores.length}件`)
  
  // カテゴリ別でグループ化
  const groupedStores: Record<string, Array<{id: string, name: string}>> = {}
  foundStores.slice(0, 25).forEach(store => {
    if (!groupedStores[store.category]) {
      groupedStores[store.category] = []
    }
    groupedStores[store.category].push({
      id: store.id,
      name: store.name
    })
  })
  
  console.log('\n🏪 カテゴリ別発見店舗')
  Object.entries(groupedStores).forEach(([category, stores]) => {
    console.log(`\n📂 ${category} (${stores.length}件):`)
    stores.forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      ID: ${store.id}`)
    })
  })
  
  // バッチ4用のデータを出力
  const batch4Data = foundStores.slice(0, 25).map((store, index) => {
    return {
      id: store.id,
      name: store.name,
      category: store.category
    }
  })
  
  console.log('\n' + '=' .repeat(80))
  console.log('📋 バッチ4用データ準備完了')
  console.log(`対象店舗: ${batch4Data.length}件`)
  
  return batch4Data
}

findMoreStores()