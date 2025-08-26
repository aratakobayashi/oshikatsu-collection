#!/usr/bin/env npx tsx

/**
 * メガ拡大検索スクリプト
 * 70店舗確保のため大規模検索実行
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

async function megaExpansionSearch() {
  console.log('🔍 メガ拡大検索開始')
  console.log('🎯 目標: 70店舗確保')
  console.log('=' .repeat(60))
  
  // より広範囲なキーワードで検索
  const megaKeywords = [
    // 基本飲食キーワード
    '食', '店', '屋', '亭', '庵', '家', '処', '館',
    
    // 英語系
    'House', 'Kitchen', 'Table', 'Room', 'Place', 'Corner',
    'Dining', 'Restaurant', 'Cafe', 'Bar', 'Grill',
    'Food', 'Eat', 'Cook', 'Meal', 'Dish',
    
    // 地域・場所
    '東京', 'Tokyo', '渋谷', 'Shibuya', '新宿', 'Shinjuku',
    '銀座', 'Ginza', '表参道', '原宿', 'Harajuku',
    '恵比寿', '六本木', '赤坂', '青山',
    
    // 業態
    '和', '洋', '中', 'Asian', 'European', 'American',
    'Italian', 'French', 'Chinese', 'Japanese',
    
    // 料理種別
     'Pasta', 'Sushi', 'Ramen', 'Curry', 'Salad',
    'Soup', 'Noodle', 'Rice', 'Meat', 'Fish',
    
    // チェーン・ブランド
    'Co', 'Ltd', '株式会社', '有限会社',
    
    // 数字・記号
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    '&', 'and', 'the', 'The', 'de', 'la', 'le',
    
    // 日本語一文字
    '味', '香', '心', '愛', '美', '光', '風', '海', '山', '川',
    '春', '夏', '秋', '冬', '月', '星', '花', '鳥', '雲', '雨'
  ]
  
  const foundStores: Array<{id: string, name: string, keyword: string}> = []
  
  console.log('🚀 メガ検索実行中...')
  
  for (const keyword of megaKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null)
      .limit(2)
    
    if (stores && stores.length > 0) {
      stores.forEach(store => {
        foundStores.push({
          id: store.id,
          name: store.name,
          keyword
        })
      })
      
      if (foundStores.length >= 100) break // 100件で十分
    }
    
    await new Promise(resolve => setTimeout(resolve, 50)) // 高速処理
  }
  
  // 重複除去
  const uniqueStores = foundStores.filter((store, index, self) => 
    self.findIndex(s => s.id === store.id) === index
  )
  
  console.log(`📊 メガ検索結果: ${uniqueStores.length}件発見`)
  
  // 品質フィルタリング（基本的な除外）
  const suspiciousKeywords = [
    'コスメ', 'Dior', 'Burberry', 'CANMAKE', 'shu uemura',
    '場所（', '撮影（', 'CV：', 'feat.', '#', '関連）'
  ]
  
  const qualityStores = uniqueStores.filter(store => {
    return !suspiciousKeywords.some(keyword => 
      store.name.includes(keyword)
    )
  })
  
  console.log(`✅ 品質フィルタ後: ${qualityStores.length}件`)
  
  // 70店舗を選択
  const selectedStores = qualityStores.slice(0, 70)
  
  console.log(`\n🎯 150店舗拡大用に選択: ${selectedStores.length}件`)
  
  // サンプル表示
  console.log('\n📋 選択店舗サンプル (最初の10件):')
  selectedStores.slice(0, 10).forEach((store, index) => {
    console.log(`   ${index + 1}. ${store.name}`)
    console.log(`      ID: ${store.id}`)
    console.log(`      キーワード: "${store.keyword}"`)
  })
  
  if (selectedStores.length >= 70) {
    console.log('\n✅ 70店舗確保成功！')
    console.log('🚀 150店舗拡大実行準備完了')
  } else {
    console.log(`\n⚠️ ${selectedStores.length}件確保 (目標: 70件)`)
    console.log('📊 部分的拡大を実行可能')
  }
  
  return selectedStores
}

megaExpansionSearch()