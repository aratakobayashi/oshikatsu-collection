#!/usr/bin/env npx tsx

/**
 * 100店舗達成のためのメガ検索！
 * 最後の25店舗を一気に発掘
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

async function megaSearchFinal25() {
  console.log('🚀 100店舗達成のためのメガ検索開始！')
  console.log('🎯 目標：最後の25店舗を一気に発掘')
  console.log('💎 達成時：月間¥12,000収益！')
  console.log('=' .repeat(60))
  
  // 超広範囲検索キーワード
  const megaKeywords = [
    // 基本単語
    '店', 'Shop', 'SHOP', '館', 'Hall', 'HALL',
    'House', 'HOUSE', 'Room', 'ROOM', 'Place', 'PLACE',
    
    // 料理ジャンル
    'Food', 'FOOD', 'Eat', 'EAT', 'Meal', 'MEAL',
    'Kitchen', 'KITCHEN', 'Cook', 'COOK', 'Chef', 'CHEF',
    
    // 地域・場所
    'Tokyo', 'TOKYO', 'Shibuya', 'SHIBUYA', 'Ginza', 'GINZA',
    'Shinjuku', 'SHINJUKU', 'Harajuku', 'HARAJUKU',
    
    // 業態
    'Market', 'MARKET', 'Stand', 'STAND', 'Counter', 'COUNTER',
    'Garden', 'GARDEN', 'Park', 'PARK', 'Center', 'CENTER',
    
    // 文字・記号
    'Co', 'CO', '&', 'and', 'AND', 'The', 'THE',
    'New', 'NEW', 'Old', 'OLD', 'Big', 'BIG',
    
    // 数字
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    
    // 日本語一文字
    '味', '食', '美', '心', '愛', '夢', '希', '光', '風', '海'
  ]
  
  const foundStores: Array<{id: string, name: string, keyword: string}> = []
  
  console.log('🔍 メガ検索実行中...')
  
  for (const keyword of megaKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null)
      .limit(1)
    
    if (stores && stores.length > 0) {
      console.log(`   ✅ "${keyword}": ${stores.length}件`)
      stores.forEach(store => {
        foundStores.push({
          id: store.id,
          name: store.name,
          keyword
        })
      })
      
      if (foundStores.length >= 30) break // 余裕を持って30件
    }
    
    await new Promise(resolve => setTimeout(resolve, 50)) // 高速処理
  }
  
  console.log(`\n📊 メガ検索結果: ${foundStores.length}件発見`)
  
  // 重複を除去
  const uniqueStores = foundStores.filter((store, index, self) => 
    self.findIndex(s => s.id === store.id) === index
  ).slice(0, 25)
  
  console.log(`📋 重複除去後: ${uniqueStores.length}件`)
  
  console.log('\n🎯 100店舗達成候補リスト:')
  uniqueStores.forEach((store, index) => {
    console.log(`   ${index + 1}. ${store.name}`)
    console.log(`      ID: ${store.id}`)
    console.log(`      キーワード: "${store.keyword}"`)
  })
  
  return uniqueStores
}

megaSearchFinal25()