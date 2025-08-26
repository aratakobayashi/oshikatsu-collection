#!/usr/bin/env npx tsx

/**
 * 全アフィリエイトURL削除スクリプト
 * 実店舗と無関係なダミーURLを全て削除してシステムをリセット
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

async function resetAllAffiliateUrls() {
  console.log('🚨 重大な問題発見: 実店舗と無関係なダミーURL')
  console.log('🔄 全アフィリエイトURLリセット開始')
  console.log('=' .repeat(60))
  
  // 現在のアフィリエイト設定済み店舗を確認
  const { data: currentStores, error: fetchError } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, affiliate_info')
    .not('tabelog_url', 'is', null)
  
  if (fetchError) {
    console.error('❌ データ取得エラー:', fetchError)
    return
  }
  
  const totalToReset = currentStores?.length || 0
  console.log(`📊 リセット対象: ${totalToReset}件`)
  console.log(`🚨 問題: 全てダミーURLで実店舗と無関係`)
  
  if (totalToReset === 0) {
    console.log('✅ リセット対象がありません')
    return
  }
  
  // サンプル表示
  console.log('\n📋 リセット対象サンプル:')
  currentStores?.slice(0, 5).forEach((store, index) => {
    console.log(`   ${index + 1}. ${store.name}`)
    console.log(`      ダミーURL: ${store.tabelog_url}`)
  })
  
  console.log('\n⚠️ 重要な理由:')
  console.log('• 実店舗名と全く関係ないTabelog店舗にリンクしている')
  console.log('• ユーザーが混乱し、信頼性を損なう')
  console.log('• 正しいアプローチで再実装が必要')
  
  console.log('\n🔄 全てのダミーURLを削除中...')
  
  let resetCount = 0
  let errorCount = 0
  
  for (let i = 0; i < currentStores!.length; i++) {
    const store = currentStores![i]
    
    console.log(`\n🔄 リセット ${i + 1}/${totalToReset}: ${store.name}`)
    console.log(`   削除URL: ${store.tabelog_url}`)
    
    const { error } = await supabase
      .from('locations')
      .update({
        tabelog_url: null,
        affiliate_info: {
          reset_at: new Date().toISOString(),
          reset_reason: 'dummy_url_cleanup',
          original_info: store.affiliate_info,
          status: 'reset_for_proper_implementation',
          note: '実店舗と無関係なダミーURLのため削除'
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ リセット成功`)
      resetCount++
    }
    
    // 進捗表示
    if (resetCount % 50 === 0 && resetCount > 0) {
      console.log(`\n📈 進捗: ${resetCount}件リセット完了`)
    }
    
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  // 最終確認
  const { data: finalCheck } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const remainingCount = finalCheck?.length || 0
  
  console.log('\n' + '🎊'.repeat(30))
  console.log('📊 リセット完了レポート')
  console.log('🎊'.repeat(30))
  
  console.log(`✅ リセット成功: ${resetCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`📈 残存アフィリエイトURL: ${remainingCount}件`)
  
  if (remainingCount === 0) {
    console.log('\n🎉 全てのダミーURLが正常に削除されました！')
    console.log('✅ システムが清潔な状態にリセット完了')
  }
  
  console.log('\n📋 次のステップ（正しいアプローチ）:')
  console.log('1️⃣ 実店舗名で実際のTabelog検索')
  console.log('2️⃣ 手動で正しいTabelog店舗を特定')
  console.log('3️⃣ 実店舗に対応する正しいTabelogURLのみ設定')
  console.log('4️⃣ 品質重視で少数から開始')
  console.log('5️⃣ ユーザー体験を最優先に段階的拡大')
  
  console.log('\n🚨 重要な学び:')
  console.log('• ダミーURL生成は絶対にNG')
  console.log('• 実店舗との正確なマッチングが必須')
  console.log('• 品質 > 量の方針で進める')
  console.log('• ユーザー信頼性が最優先')
  
  console.log('\n' + '🎊'.repeat(30))
  
  return {
    reset: resetCount,
    errors: errorCount,
    remaining: remainingCount
  }
}

resetAllAffiliateUrls()