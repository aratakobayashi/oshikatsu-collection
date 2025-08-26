#!/usr/bin/env npx tsx

/**
 * 残り642店舗分析スクリプト
 * 正当な飲食店を特定してアフィリエイト対象を抽出
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

async function analyzeRemaining642Stores() {
  console.log('🔍 残り642店舗の大量分析開始')
  console.log('🎯 目標: 正当な飲食店を最大限発掘')
  console.log('💰 最終目標: 収益最大化')
  console.log('=' .repeat(60))
  
  // 現在の設定済み店舗数確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const currentCount = currentStores?.length || 0
  console.log(`📊 現在の設定済み店舗: ${currentCount}件`)
  
  // 未設定店舗を取得
  const { data: remainingStores, error } = await supabase
    .from('locations')
    .select('id, name')
    .is('tabelog_url', null)
    .order('name')
  
  if (error) {
    console.error('❌ データ取得エラー:', error)
    return
  }
  
  const remainingCount = remainingStores?.length || 0
  console.log(`📋 未設定店舗: ${remainingCount}件`)
  console.log(`📈 総店舗数: ${currentCount + remainingCount}件`)
  
  if (!remainingStores || remainingStores.length === 0) {
    console.log('✅ 全店舗に設定済みです！')
    return
  }
  
  // 飲食店判定キーワード（ポジティブ）
  const foodKeywords = [
    // 和食
    '寿司', '鮨', 'すし', 'スシ', '天ぷら', 'てんぷら', '蕎麦', 'そば', 'うどん',
    '和食', '料亭', '割烹', '居酒屋', '酒場', '食堂', '定食',
    
    // 洋食・イタリアン・フレンチ
    'イタリアン', 'Italian', 'フレンチ', 'French', 'ビストロ', 'Bistro',
    'パスタ', 'ピザ', 'Pizza', 'ステーキ', 'Steak', 'ハンバーガー', 'バーガー',
    
    // 中華・アジア
    '中華', '中国料理', '韓国料理', 'タイ料理', 'ベトナム料理', 'アジア料理',
    '餃子', 'ラーメン', 'らーめん',
    
    // カフェ・軽食
    'カフェ', 'Cafe', 'Coffee', 'コーヒー', '珈琲', 'カフェテリア',
    'パン', 'Bread', 'ベーカリー', 'Bakery', 'パン屋',
    
    // 一般飲食
    'レストラン', 'Restaurant', 'ダイニング', 'Dining', 'グリル', 'Grill',
    'キッチン', 'Kitchen', 'フード', 'Food', 'バー', 'Bar',
    
    // 日本語の飲食関連
    '食', '店', '屋', '亭', '庵', '家', '処', '館', '味',
    
    // チェーン店・ブランド
    'マクドナルド', 'スターバックス', 'ドトール', 'タリーズ', 'サイゼリヤ',
    'すき家', '松屋', '吉野家', 'ケンタッキー', 'モスバーガー'
  ]
  
  // 非飲食店キーワード（除外対象）
  const excludeKeywords = [
    // エンタメ・メディア
    'コスメ', 'CANMAKE', 'Dior', 'Burberry', 'shu uemura', 'TOM FORD',
    '場所（', '撮影（', '行った（', 'CV：', 'feat.', '#', '関連）',
    
    // ファッション・アパレル
    'SHISEIDO', 'ジュエリー', '古着屋', 'OVERRIDE',
    
    // 施設・インフラ
    '美術館', 'museum', 'スタジオ', 'Batting Center', 'ジム',
    '警視庁', '庁舎', '公園', '神社', '寺', '城', 'ホテル',
    
    // その他
    'MV', 'PV', 'スタイリング', 'ヘアメイク', '撮影スタジオ'
  ]
  
  console.log('\n🔍 飲食店判定分析中...')
  
  const categories = {
    definite_restaurants: [] as any[],
    likely_restaurants: [] as any[],
    questionable: [] as any[],
    exclude: [] as any[]
  }
  
  remainingStores.forEach((store, index) => {
    const name = store.name.toLowerCase()
    
    // 除外対象チェック
    const shouldExclude = excludeKeywords.some(keyword =>
      store.name.includes(keyword)
    )
    
    if (shouldExclude) {
      categories.exclude.push(store)
      return
    }
    
    // 飲食店キーワードマッチ
    const matchedKeywords = foodKeywords.filter(keyword =>
      name.includes(keyword.toLowerCase()) || store.name.includes(keyword)
    )
    
    if (matchedKeywords.length >= 2) {
      categories.definite_restaurants.push({
        ...store,
        matchedKeywords,
        confidence: 'high'
      })
    } else if (matchedKeywords.length === 1) {
      categories.likely_restaurants.push({
        ...store,
        matchedKeywords,
        confidence: 'medium'
      })
    } else {
      categories.questionable.push({
        ...store,
        matchedKeywords: [],
        confidence: 'low'
      })
    }
    
    // 進捗表示
    if (index % 100 === 0) {
      console.log(`   進捗: ${index}/${remainingStores.length} (${Math.round(index/remainingStores.length*100)}%)`)
    }
  })
  
  console.log('\n' + '=' .repeat(80))
  console.log('📊 分析結果')
  console.log('=' .repeat(80))
  
  console.log(`\n🍽️ 確実な飲食店: ${categories.definite_restaurants.length}件`)
  console.log(`🤔 可能性の高い飲食店: ${categories.likely_restaurants.length}件`)
  console.log(`❓ 要検討: ${categories.questionable.length}件`)
  console.log(`❌ 除外対象: ${categories.exclude.length}件`)
  
  // 合計アフィリエイト対象候補
  const totalCandidates = categories.definite_restaurants.length + categories.likely_restaurants.length
  console.log(`\n🎯 アフィリエイト対象候補: ${totalCandidates}件`)
  
  // 収益予測
  const potentialStores = currentCount + totalCandidates
  const potentialMonthlyRevenue = potentialStores * 3 * 0.02 * 2000
  const currentRevenue = currentCount * 3 * 0.02 * 2000
  const additionalRevenue = potentialMonthlyRevenue - currentRevenue
  
  console.log(`\n💰 収益予測:`)
  console.log(`• 現在収益: ¥${currentRevenue.toLocaleString()}/月`)
  console.log(`• 追加後収益: ¥${potentialMonthlyRevenue.toLocaleString()}/月`)
  console.log(`• 収益増加: +¥${additionalRevenue.toLocaleString()}/月`)
  console.log(`• 増加率: +${Math.round((additionalRevenue/currentRevenue)*100)}%`)
  
  // サンプル表示
  if (categories.definite_restaurants.length > 0) {
    console.log(`\n📋 確実な飲食店サンプル (最初の10件):`)
    categories.definite_restaurants.slice(0, 10).forEach((store, index) => {
      console.log(`   ${index + 1}. ${store.name}`)
      console.log(`      マッチキーワード: ${store.matchedKeywords.join(', ')}`)
    })
  }
  
  console.log(`\n🚀 実行プラン:`)
  console.log(`1️⃣ フェーズ1: 確実な飲食店 ${categories.definite_restaurants.length}件を一括追加`)
  console.log(`2️⃣ フェーズ2: 可能性の高い飲食店 ${categories.likely_restaurants.length}件を検証後追加`)
  console.log(`3️⃣ フェーズ3: 要検討 ${categories.questionable.length}件を個別判定`)
  
  return {
    current: currentCount,
    remaining: remainingCount,
    candidates: totalCandidates,
    definite: categories.definite_restaurants,
    likely: categories.likely_restaurants,
    questionable: categories.questionable,
    exclude: categories.exclude
  }
}

analyzeRemaining642Stores()