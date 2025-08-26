#!/usr/bin/env npx tsx

/**
 * Phase 6実装結果詳細確認
 * 最新追加5店舗のDB保存状況とTabelog URL確認
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

async function verifyPhase6Implementation() {
  console.log('🔍 Phase 6実装結果詳細確認')
  console.log('📊 最新追加5店舗のDB保存状況確認')
  console.log('=' .repeat(60))
  
  // Phase 6で実装した店舗のキーワード
  const phase6Keywords = [
    '牛角',
    '挽肉と米',
    'えんとつ屋',
    '更科堀井', 
    'やま中'
  ]
  
  // 全アフィリエイト店舗取得
  const { data: allStores, error } = await supabase
    .from('locations')
    .select('*')
    .not('tabelog_url', 'is', null)
    .order('name')
  
  if (error) {
    console.error('❌ データベースエラー:', error.message)
    return
  }
  
  console.log(`📊 現在のアフィリエイト設定済み店舗: ${allStores?.length || 0}件`)
  
  // Phase 6店舗特定
  const phase6Stores = allStores?.filter(store => 
    store.affiliate_info?.source === 'phase6_20stores_achievement'
  ) || []
  
  console.log(`🚀 Phase 6実装店舗: ${phase6Stores.length}件`)
  console.log()
  
  // Phase 6店舗詳細確認
  phase6Stores.forEach((store, index) => {
    console.log(`${index + 1}. 【${store.name}】`)
    console.log(`   📍 住所: ${store.address || '未設定'}`)
    console.log(`   🔗 Tabelog URL: ${store.tabelog_url}`)
    console.log(`   🆔 Store ID: ${store.id}`)
    console.log(`   📅 実装日: ${store.affiliate_info?.verification_date || '未設定'}`)
    console.log(`   ⏰ 営業時間: ${store.affiliate_info?.operating_hours || '未設定'}`)
    console.log(`   📝 検証メモ: ${store.affiliate_info?.verification_notes || '未設定'}`)
    console.log(`   ✅ 品質保証: ${store.affiliate_info?.quality_assured ? '✅' : '❌'}`)
    console.log()
  })
  
  // 各キーワードで実際に検索確認
  console.log('🔍 キーワード別検索確認:')
  for (const keyword of phase6Keywords) {
    const matchingStores = allStores?.filter(store => 
      store.name.includes(keyword) && store.tabelog_url
    ) || []
    
    console.log(`\n🔍 "${keyword}"検索結果: ${matchingStores.length}件`)
    matchingStores.forEach((store, idx) => {
      console.log(`   ${idx + 1}. ${store.name}`)
      console.log(`      URL: ${store.tabelog_url}`)
      console.log(`      Phase: ${store.affiliate_info?.source || '不明'}`)
    })
  }
  
  // URL有効性チェック
  console.log('\n' + '=' .repeat(60))
  console.log('🔗 Tabelog URL有効性確認')
  console.log('=' .repeat(60))
  
  const urlValidationResults = []
  
  for (const store of phase6Stores) {
    const urlValid = store.tabelog_url && store.tabelog_url.startsWith('https://tabelog.com/')
    const urlPattern = /^https:\/\/tabelog\.com\/[a-z]+\/[A-Z0-9]+\/[A-Z0-9]+\/[0-9]+\/$/
    const urlFormatValid = urlPattern.test(store.tabelog_url || '')
    
    urlValidationResults.push({
      name: store.name,
      url: store.tabelog_url,
      valid: urlValid,
      formatValid: urlFormatValid
    })
    
    console.log(`${urlValid && urlFormatValid ? '✅' : '❌'} ${store.name}`)
    console.log(`   URL: ${store.tabelog_url}`)
    console.log(`   有効性: ${urlValid ? '✅' : '❌'} | 形式: ${urlFormatValid ? '✅' : '❌'}`)
    console.log()
  }
  
  // 総合確認結果
  const validUrls = urlValidationResults.filter(r => r.valid && r.formatValid).length
  const totalPhase6 = phase6Stores.length
  
  console.log('=' .repeat(60))
  console.log('📊 Phase 6実装確認結果')
  console.log('=' .repeat(60))
  console.log(`🚀 Phase 6実装済み: ${totalPhase6}件`)
  console.log(`✅ URL有効: ${validUrls}/${totalPhase6}件`)
  console.log(`💰 ValueCommerce対応: ${totalPhase6}件（全てtabelog.com）`)
  console.log()
  
  if (totalPhase6 === 5 && validUrls === 5) {
    console.log('🎉 Phase 6実装完璧！全て正常にDB保存済み！')
  } else {
    console.log('⚠️ 実装に問題があります。確認が必要です。')
  }
  
  console.log('\n📋 食べログ予約について:')
  console.log('• 食べログの予約ボタンは店舗によって表示が異なります')
  console.log('• 一部店舗は電話予約のみの場合があります')  
  console.log('• URLが正しければValueCommerceアフィリエイトは機能します')
  console.log('• LinkSwitchが自動でアフィリエイトリンクに変換します')
  
  return {
    phase6_stores_count: totalPhase6,
    valid_urls_count: validUrls,
    implementation_success: totalPhase6 === 5 && validUrls === 5
  }
}

verifyPhase6Implementation()