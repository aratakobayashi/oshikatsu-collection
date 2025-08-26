#!/usr/bin/env npx tsx

/**
 * 次の拡大候補検索スクリプト
 * データベースに存在する実店舗から、確実な有名チェーン店を特定
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

async function findNextExpansionCandidates() {
  console.log('🔍 次の拡大候補検索開始')
  console.log('🎯 データベースに実在する有名チェーン店を特定')
  console.log('=' .repeat(60))
  
  // 現在の設定済み店舗確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id, name')
    .not('tabelog_url', 'is', null)
  
  console.log(`📊 現在の設定済み: ${currentStores?.length || 0}件`)
  
  // より多様な有名チェーンキーワード
  const chainKeywords = [
    // ファストフード・牛丼系（確実性高）
    'CoCo壱番屋', 'ココイチ', 'サブウェイ', 'SUBWAY', 
    'バーガーキング', 'Burger King',
    
    // ファミレス系
    'ガスト', 'バーミヤン', 'ジョナサン', 'デニーズ', 
    'ココス', 'COCO\'S',
    
    // カフェ・コーヒー系
    'ドトール', 'エクセルシオール', 'タリーズ', 'コメダ珈琲',
    'ベローチェ', 'プロント',
    
    // うどん・そば系
    'はなまるうどん', '丸亀製麺', 'なか卯',
    
    // ラーメン系
    'リンガーハット', '幸楽苑', '天下一品',
    
    // 回転寿司系
    'スシロー', 'はま寿司', 'くら寿司', 'かっぱ寿司',
    
    // 居酒屋系
    'ワタミ', '白木屋', '魚民', '笑笑',
    
    // パン・ベーカリー
    'ヴィ・ド・フランス', 'アンデルセン', 'サンマルクカフェ'
  ]
  
  const foundCandidates: Array<{
    keyword: string,
    stores: Array<{id: string, name: string, address?: string}>
  }> = []
  
  console.log('🔍 チェーン店候補検索中...')
  
  for (const keyword of chainKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null) // 未設定のみ
      .limit(3)
    
    if (stores && stores.length > 0) {
      // 除外チェック
      const validStores = stores.filter(store => {
        const excludeKeywords = [
          '場所（', '撮影（', 'CV：', '#', 'feat.',
          'コスメ', 'ジュエリー', 'スタジオ', 'MV', 'PV',
          '美術館', 'museum', 'ジム', 'Gym', 'アリーナ'
        ]
        
        return !excludeKeywords.some(exclude => store.name.includes(exclude))
      })
      
      if (validStores.length > 0) {
        foundCandidates.push({
          keyword,
          stores: validStores
        })
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  console.log(`✅ 拡大候補発見: ${foundCandidates.length}チェーン`)
  
  // 優先度順で表示
  console.log('\\n📋 拡大候補一覧:')
  foundCandidates.forEach((candidate, index) => {
    console.log(`\\n${index + 1}. 【${candidate.keyword}】チェーン (${candidate.stores.length}件)`)
    candidate.stores.forEach((store, storeIndex) => {
      console.log(`   ${storeIndex + 1}. ${store.name}`)
      console.log(`      住所: ${store.address || '未設定'}`)
      console.log(`      ID: ${store.id}`)
    })
  })
  
  // 実装推奨ランキング
  console.log('\\n' + '=' .repeat(60))
  console.log('🏆 実装推奨ランキング（次の3-5店舗）')
  console.log('=' .repeat(60))
  
  const topCandidates = foundCandidates.slice(0, 5)
  topCandidates.forEach((candidate, index) => {
    console.log(`${index + 1}. ${candidate.keyword}`)
    console.log(`   候補店舗: ${candidate.stores[0]?.name}`)
    console.log(`   信頼度: 高（有名チェーン）`)
    console.log(`   次アクション: Tabelog手動検索`)
    console.log()
  })
  
  console.log('✨ 次のステップ:')
  console.log('1️⃣ 上位3-5チェーンを選択')
  console.log('2️⃣ 各店舗をTabelog.comで手動検索')
  console.log('3️⃣ 営業状況・正確なURL確認')
  console.log('4️⃣ 品質保証プロセスで実装')
  console.log('5️⃣ ユーザー体験テスト')
  
  return {
    total_candidates: foundCandidates.length,
    top_recommendations: topCandidates.slice(0, 3).map(c => ({
      keyword: c.keyword,
      store_name: c.stores[0]?.name,
      store_id: c.stores[0]?.id
    }))
  }
}

findNextExpansionCandidates()