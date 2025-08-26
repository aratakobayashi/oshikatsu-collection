#!/usr/bin/env npx tsx

/**
 * 全10店舗アフィリエイトリンク精査スクリプト
 * 各店舗のTabelog URLとアフィリエイト設定を詳細確認
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

async function verifyAllAffiliateLinks() {
  console.log('🔍 全10店舗アフィリエイトリンク精査開始')
  console.log('🎯 URL正確性・ValueCommerce設定・品質確認')
  console.log('=' .repeat(60))
  
  // 全アフィリエイト設定済み店舗取得
  const { data: affiliateStores, error } = await supabase
    .from('locations')
    .select('id, name, address, tabelog_url, affiliate_info')
    .not('tabelog_url', 'is', null)
    .order('name')
  
  if (error) {
    console.error('❌ データベースエラー:', error.message)
    return
  }
  
  if (!affiliateStores || affiliateStores.length === 0) {
    console.log('⚠️ アフィリエイト設定済み店舗が見つかりません')
    return
  }
  
  console.log(`📊 検証対象: ${affiliateStores.length}件`)
  console.log()
  
  const verificationResults = []
  
  for (let i = 0; i < affiliateStores.length; i++) {
    const store = affiliateStores[i]
    console.log(`🔍 ${i + 1}/${affiliateStores.length}: ${store.name}`)
    
    // URL形式確認
    const urlValid = store.tabelog_url && store.tabelog_url.startsWith('https://tabelog.com/')
    const urlPattern = /^https:\/\/tabelog\.com\/[a-z]+\/[A-Z0-9]+\/[A-Z0-9]+\/[0-9]+\/$/
    const urlFormatValid = urlPattern.test(store.tabelog_url || '')
    
    // ValueCommerce対応確認（tabelog.comドメインなのでLinkSwitchで自動変換）
    const isValueCommerceCompatible = store.tabelog_url?.includes('tabelog.com')
    
    // アフィリエイト情報確認
    const hasAffiliateInfo = store.affiliate_info && typeof store.affiliate_info === 'object'
    const isManuallyVerified = hasAffiliateInfo && store.affiliate_info.tabelog_verified === true
    const hasQualityAssurance = hasAffiliateInfo && store.affiliate_info.quality_assured === true
    
    const result = {
      store_name: store.name,
      store_id: store.id,
      database_address: store.address,
      tabelog_url: store.tabelog_url,
      url_valid: urlValid,
      url_format_valid: urlFormatValid,
      valuecommerce_compatible: isValueCommerceCompatible,
      manually_verified: isManuallyVerified,
      quality_assured: hasQualityAssurance,
      verification_date: hasAffiliateInfo ? store.affiliate_info.verification_date : null,
      confidence: hasAffiliateInfo ? store.affiliate_info.confidence : null,
      operating_hours: hasAffiliateInfo ? store.affiliate_info.operating_hours : null,
      verification_notes: hasAffiliateInfo ? store.affiliate_info.verification_notes : null
    }
    
    verificationResults.push(result)
    
    console.log(`   📍 データベース住所: ${store.address || '未設定'}`)
    console.log(`   🔗 Tabelog URL: ${store.tabelog_url}`)
    console.log(`   ✅ URL有効性: ${urlValid ? '✅' : '❌'}`)
    console.log(`   ✅ URL形式: ${urlFormatValid ? '✅' : '❌'}`)
    console.log(`   💰 ValueCommerce対応: ${isValueCommerceCompatible ? '✅' : '❌'}`)
    console.log(`   🔍 手動検証済み: ${isManuallyVerified ? '✅' : '❌'}`)
    console.log(`   🏆 品質保証: ${hasQualityAssurance ? '✅' : '❌'}`)
    
    if (hasAffiliateInfo) {
      console.log(`   📅 検証日: ${store.affiliate_info.verification_date || '未設定'}`)
      console.log(`   ⭐ 信頼度: ${store.affiliate_info.confidence || '未設定'}`)
      console.log(`   🕐 営業時間: ${store.affiliate_info.operating_hours || '未設定'}`)
      if (store.affiliate_info.verification_notes) {
        console.log(`   📝 検証メモ: ${store.affiliate_info.verification_notes}`)
      }
    }
    
    console.log()
  }
  
  // 集計レポート
  const totalStores = verificationResults.length
  const validUrls = verificationResults.filter(r => r.url_valid).length
  const validFormats = verificationResults.filter(r => r.url_format_valid).length
  const valuecommerceCompatible = verificationResults.filter(r => r.valuecommerce_compatible).length
  const manuallyVerified = verificationResults.filter(r => r.manually_verified).length
  const qualityAssured = verificationResults.filter(r => r.quality_assured).length
  
  console.log('🎊'.repeat(60))
  console.log('📊 アフィリエイトリンク精査結果レポート')
  console.log('🎊'.repeat(60))
  
  console.log(`\n🏆 総合品質スコア:`)
  console.log(`✅ URL有効性: ${validUrls}/${totalStores} (${Math.round(validUrls/totalStores*100)}%)`)
  console.log(`✅ URL形式正確性: ${validFormats}/${totalStores} (${Math.round(validFormats/totalStores*100)}%)`)
  console.log(`💰 ValueCommerce対応: ${valuecommerceCompatible}/${totalStores} (${Math.round(valuecommerceCompatible/totalStores*100)}%)`)
  console.log(`🔍 手動検証済み: ${manuallyVerified}/${totalStores} (${Math.round(manuallyVerified/totalStores*100)}%)`)
  console.log(`🏆 品質保証: ${qualityAssured}/${totalStores} (${Math.round(qualityAssured/totalStores*100)}%)`)
  
  // 問題のある店舗特定
  const problemStores = verificationResults.filter(r => 
    !r.url_valid || !r.url_format_valid || !r.valuecommerce_compatible || !r.manually_verified
  )
  
  if (problemStores.length > 0) {
    console.log(`\n⚠️ 要確認店舗: ${problemStores.length}件`)
    problemStores.forEach((store, index) => {
      console.log(`\n${index + 1}. ${store.store_name}`)
      if (!store.url_valid) console.log('   ❌ URL無効')
      if (!store.url_format_valid) console.log('   ❌ URL形式不正')
      if (!store.valuecommerce_compatible) console.log('   ❌ ValueCommerce非対応')
      if (!store.manually_verified) console.log('   ❌ 手動検証未実施')
    })
  } else {
    console.log(`\n✅ 全店舗問題なし！完璧な品質です！`)
  }
  
  console.log(`\n💰 収益設定確認:`)
  console.log(`• ValueCommerce Program ID: 891908080`)
  console.log(`• Site ID: 3750604`) 
  console.log(`• LinkSwitch自動変換: 有効`)
  console.log(`• 月間収益見込み: ¥${totalStores * 120}`)
  
  console.log(`\n📋 全店舗詳細一覧:`)
  verificationResults.forEach((store, index) => {
    const status = store.url_valid && store.valuecommerce_compatible && store.manually_verified ? '✅' : '⚠️'
    console.log(`   ${status} ${index + 1}. ${store.store_name}`)
    console.log(`      URL: ${store.tabelog_url}`)
  })
  
  console.log('\n' + '🎊'.repeat(60))
  
  return {
    total_stores: totalStores,
    perfect_quality_score: problemStores.length === 0,
    problem_stores: problemStores.length,
    monthly_revenue_potential: totalStores * 120
  }
}

verifyAllAffiliateLinks()