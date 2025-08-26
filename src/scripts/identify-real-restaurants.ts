#!/usr/bin/env npx tsx

/**
 * 実在飲食店特定スクリプト
 * 品質重視で確実に実在する有名チェーン店から特定
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

async function identifyRealRestaurants() {
  console.log('🔍 実在飲食店特定開始 - 品質重視アプローチ')
  console.log('=' .repeat(60))
  
  // 確実に実在する有名チェーン店キーワード
  const realChainKeywords = [
    // ファストフード系
    'マクドナルド', 'McDonald',
    'スターバックス', 'Starbucks',
    'ケンタッキー', 'KFC',
    'モスバーガー',
    'フレッシュネスバーガー',
    '吉野家', '松屋', 'すき家',
    
    // ファミレス・チェーン
    'サイゼリヤ',
    'ガスト', 'バーミヤン', 'ジョナサン',
    'デニーズ', 'ココス',
    
    // 専門チェーン
    'はなまるうどん',
    '丸亀製麺',
    'CoCo壱番屋', 'ココイチ',
    '餃子の王将',
    'リンガーハット',
    
    // カフェチェーン
    'ドトール', 'エクセルシオール',
    'タリーズ', 'コメダ珈琲',
    
    // 高級・有名店
    'ヒルトン',
    'リッツカールトン', 'リッツ・カールトン'
  ]
  
  const foundRestaurants: Array<{
    id: string,
    name: string,
    address?: string,
    matched_keyword: string,
    confidence: 'very_high' | 'high'
  }> = []
  
  console.log('🔍 有名チェーン店検索中...')
  
  for (const keyword of realChainKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null) // アフィリエイト未設定のもののみ
      .limit(3)
    
    if (stores && stores.length > 0) {
      stores.forEach(store => {
        // 除外すべきキーワードをチェック
        const excludeKeywords = [
          '場所（', '撮影（', 'CV：', '#', 'feat.',
          'コスメ', 'ジュエリー', 'スタジオ', 'MV', 'PV'
        ]
        
        const shouldExclude = excludeKeywords.some(exclude => 
          store.name.includes(exclude)
        )
        
        if (!shouldExclude) {
          // 信頼度判定
          const confidence = realChainKeywords.slice(0, 12).includes(keyword) ? 'very_high' : 'high'
          
          foundRestaurants.push({
            id: store.id,
            name: store.name,
            address: store.address,
            matched_keyword: keyword,
            confidence
          })
        }
      })
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  // 重複除去
  const uniqueRestaurants = foundRestaurants.filter((restaurant, index, self) => 
    self.findIndex(r => r.id === restaurant.id) === index
  )
  
  // 信頼度順でソート
  uniqueRestaurants.sort((a, b) => {
    if (a.confidence === 'very_high' && b.confidence === 'high') return -1
    if (a.confidence === 'high' && b.confidence === 'very_high') return 1
    return 0
  })
  
  console.log(`✅ 実在飲食店候補: ${uniqueRestaurants.length}件発見`)
  
  // 信頼度別集計
  const veryHigh = uniqueRestaurants.filter(r => r.confidence === 'very_high')
  const high = uniqueRestaurants.filter(r => r.confidence === 'high')
  
  console.log(`🌟 最高信頼度: ${veryHigh.length}件`)
  console.log(`⭐ 高信頼度: ${high.length}件`)
  
  console.log('\n📋 最高信頼度店舗 (Phase 1候補):')
  veryHigh.slice(0, 10).forEach((restaurant, index) => {
    console.log(`   ${index + 1}. ${restaurant.name}`)
    console.log(`      住所: ${restaurant.address || '未設定'}`)
    console.log(`      マッチ: "${restaurant.matched_keyword}"`)
    console.log(`      信頼度: ${restaurant.confidence}`)
    console.log()
  })
  
  if (high.length > 0) {
    console.log('📋 高信頼度店舗 (Phase 2候補):')
    high.slice(0, 5).forEach((restaurant, index) => {
      console.log(`   ${index + 1}. ${restaurant.name}`)
      console.log(`      住所: ${restaurant.address || '未設定'}`)
      console.log(`      マッチ: "${restaurant.matched_keyword}"`)
      console.log()
    })
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 実装推奨プラン')
  console.log('=' .repeat(60))
  
  console.log(`🎯 Phase 1: 最高信頼度 ${Math.min(veryHigh.length, 5)}件から開始`)
  console.log('• 手動でTabelog検索')
  console.log('• 正確なURL確認')
  console.log('• 1件ずつ丁寧に実装')
  console.log('• ユーザー体験テスト')
  
  console.log(`\n🎯 Phase 2: 高信頼度 ${Math.min(high.length, 5)}件追加`)
  console.log('• Phase 1成功後に実施')
  console.log('• 同様の手動確認プロセス')
  
  console.log('\n✨ 品質保証:')
  console.log('• 全て手動検証')
  console.log('• ユーザーが実際にクリックしてテスト')
  console.log('• 店舗情報の完全一致確認')
  console.log('• 段階的な信頼性構築')
  
  console.log('\n' + '=' .repeat(60))
  
  return {
    total: uniqueRestaurants.length,
    veryHigh: veryHigh.slice(0, 5), // Phase 1候補
    high: high.slice(0, 5), // Phase 2候補
    recommended_start: Math.min(veryHigh.length, 3) // 最初は3件から
  }
}

identifyRealRestaurants()