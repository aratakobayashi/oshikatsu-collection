#!/usr/bin/env npx tsx

/**
 * チェーン店検索スクリプト
 * 人気チェーン店の実際のIDを取得
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

async function findChainStores() {
  console.log('🔍 人気チェーン店を検索中...')
  
  const chainKeywords = [
    'スターバックス', 'ドトール', 'タリーズ', 'コメダ珈琲',
    '一蘭', '一風堂', 'らーめん', 'ラーメン',
    'マクドナルド', 'ケンタッキー', 'モスバーガー', 'ロッテリア',
    'サイゼリヤ', 'ガスト', 'バーミヤン', 'ジョナサン',
    'すしざんまい', '回転寿司', 'スシロー', 'くら寿司',
    'CoCo壱番屋', 'カレーハウス', 'ゴーゴーカレー',
    '牛角', '安楽亭', '焼肉', 'カルビ',
    'ミスタードーナツ', 'クリスピー', 'コージーコーナー'
  ]
  
  const foundStores: Array<{id: string, name: string, keyword: string}> = []
  
  for (const keyword of chainKeywords) {
    console.log(`\n🔎 "${keyword}" で検索中...`)
    
    const { data: stores, error } = await supabase
      .from('locations')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null)
      .limit(5)
    
    if (error) {
      console.error(`❌ エラー: ${error.message}`)
      continue
    }
    
    if (stores && stores.length > 0) {
      console.log(`   ✅ ${stores.length}件見つかりました`)
      stores.forEach((store, index) => {
        console.log(`   ${index + 1}. ${store.name} (ID: ${store.id})`)
        foundStores.push({
          id: store.id,
          name: store.name,
          keyword
        })
      })
    } else {
      console.log(`   ⚪ 見つかりませんでした`)
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  console.log('\n' + '=' .repeat(80))
  console.log('📊 検索結果サマリー')
  console.log(`合計発見店舗: ${foundStores.length}件`)
  
  // 結果をグループ化
  const groupedStores: Record<string, Array<{id: string, name: string}>> = {}
  foundStores.forEach(store => {
    if (!groupedStores[store.keyword]) {
      groupedStores[store.keyword] = []
    }
    groupedStores[store.keyword].push({
      id: store.id,
      name: store.name
    })
  })
  
  console.log('\n🏪 カテゴリ別店舗リスト')
  Object.entries(groupedStores).forEach(([keyword, stores]) => {
    console.log(`\n${keyword} (${stores.length}件):`)
    stores.forEach((store, index) => {
      console.log(`  ${index + 1}. ${store.name}`)
      console.log(`     ID: ${store.id}`)
    })
  })
  
  return foundStores.slice(0, 25) // 最大25店舗
}

findChainStores()