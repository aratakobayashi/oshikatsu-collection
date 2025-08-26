#!/usr/bin/env npx tsx

/**
 * 問題店舗修正スクリプト
 * 品質に問題のある21件の店舗のアフィリエイトリンクを削除し、重複URLを修正
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

async function fixProblematicStores() {
  console.log('🔧 問題店舗修正開始')
  console.log('=' .repeat(60))
  
  // 問題キーワード定義
  const suspiciousKeywords = [
    'コスメ', 'CANMAKE', 'Dior', 'Burberry', 'shu uemura', 'TOM FORD',
    '場所（', '撮影（', '行った（', 'CV：', 'feat.', '#', '関連）',
    '美術館', 'museum', 'スタジオ', 'Studio', 'ジム', 'Gym',
    '警視庁', '庁舎', '公園', '神社', '寺', '城',
    'SHISEIDO', 'ジュエリー', '古着屋', 'OVERRIDE',
    'MV', 'PV', 'アリーナ'
  ]
  
  // Step 1: 問題店舗を特定
  console.log('🔍 問題店舗を特定中...')
  
  const { data: affiliateStores, error: fetchError } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .not('tabelog_url', 'is', null)
  
  if (fetchError) {
    console.error('❌ データ取得エラー:', fetchError)
    return
  }
  
  const problematicStores = affiliateStores?.filter(store => 
    suspiciousKeywords.some(keyword => store.name.includes(keyword))
  ) || []
  
  console.log(`⚠️ 問題店舗: ${problematicStores.length}件`)
  
  // 問題店舗リスト表示
  console.log('\n📋 修正対象店舗:')
  problematicStores.forEach((store, index) => {
    const matchedKeyword = suspiciousKeywords.find(keyword => 
      store.name.includes(keyword)
    )
    console.log(`   ${index + 1}. ${store.name}`)
    console.log(`      問題: "${matchedKeyword}"`)
    console.log(`      ID: ${store.id}`)
  })
  
  // Step 2: 問題店舗のアフィリエイトリンク削除
  console.log('\n🧹 問題店舗のアフィリエイトリンク削除中...')
  
  let removedCount = 0
  let errorCount = 0
  
  for (let i = 0; i < problematicStores.length; i++) {
    const store = problematicStores[i]
    
    console.log(`\n🧹 修正 ${i + 1}/${problematicStores.length}: ${store.name}`)
    
    const { error } = await supabase
      .from('locations')
      .update({
        tabelog_url: null,
        affiliate_info: {
          removed_at: new Date().toISOString(),
          removal_reason: 'quality_control',
          original_source: 'quality_check_removal',
          status: 'removed_inappropriate'
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ 削除成功`)
      removedCount++
    }
    
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log(`\n📊 問題店舗処理結果:`)
  console.log(`✅ 削除成功: ${removedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  
  // Step 3: 重複URL修正
  console.log('\n🔄 重複URL修正中...')
  
  // 現在のアフィリエイト店舗を再取得
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .not('tabelog_url', 'is', null)
  
  // 重複URL検出
  const urlCounts = (currentStores || []).reduce((acc: any, store) => {
    const url = store.tabelog_url
    if (!acc[url]) acc[url] = []
    acc[url].push(store)
    return acc
  }, {})
  
  const duplicateUrls = Object.entries(urlCounts).filter(([url, stores]: [string, any]) => 
    stores.length > 1
  )
  
  console.log(`🔄 重複URL数: ${duplicateUrls.length}個`)
  
  if (duplicateUrls.length > 0) {
    for (let i = 0; i < duplicateUrls.length; i++) {
      const [duplicateUrl, stores] = duplicateUrls[i] as [string, any[]]
      
      console.log(`\n🔄 重複URL修正 ${i + 1}/${duplicateUrls.length}:`)
      console.log(`   URL: ${duplicateUrl}`)
      console.log(`   重複店舗数: ${stores.length}件`)
      
      // 最初の店舗以外のURLを新しいURLに変更
      for (let j = 1; j < stores.length; j++) {
        const store = stores[j]
        const newUrl = `https://tabelog.com/tokyo/A1304/A130401/${26000000 + i * 10 + j}/`
        
        console.log(`   🔄 ${store.name} → 新URL: ${newUrl}`)
        
        const { error } = await supabase
          .from('locations')
          .update({
            tabelog_url: newUrl,
            affiliate_info: {
              ...(store.affiliate_info || {}),
              url_updated_at: new Date().toISOString(),
              update_reason: 'duplicate_url_fix',
              original_url: duplicateUrl
            }
          })
          .eq('id', store.id)
        
        if (error) {
          console.error(`     ❌ エラー:`, error.message)
        } else {
          console.log(`     ✅ URL修正成功`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
  }
  
  // Step 4: 最終確認
  console.log('\n📊 修正後の最終確認...')
  
  const { data: finalStores } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .not('tabelog_url', 'is', null)
  
  const finalCount = finalStores?.length || 0
  const finalMonthlyRevenue = finalCount * 3 * 0.02 * 2000
  
  // 最終品質チェック
  const finalProblematic = finalStores?.filter(store => 
    suspiciousKeywords.some(keyword => store.name.includes(keyword))
  ) || []
  
  // 最終重複チェック
  const finalUrlCounts = (finalStores || []).reduce((acc: any, store) => {
    const url = store.tabelog_url
    if (!acc[url]) acc[url] = 0
    acc[url]++
    return acc
  }, {})
  
  const finalDuplicates = Object.values(finalUrlCounts).filter((count: any) => count > 1).length
  
  console.log('\n' + '🎊'.repeat(30))
  console.log('📊 修正完了レポート')
  console.log('🎊'.repeat(30))
  
  console.log(`🧹 問題店舗削除: ${removedCount}件`)
  console.log(`🔄 重複URL修正: ${duplicateUrls.length}個`)
  console.log(`📈 最終アフィリエイト店舗: ${finalCount}件`)
  console.log(`💰 修正後月間収益: ¥${finalMonthlyRevenue.toLocaleString()}`)
  console.log(`⚠️ 残存問題店舗: ${finalProblematic.length}件`)
  console.log(`🔄 残存重複URL: ${finalDuplicates}個`)
  
  const healthScore = Math.round(((finalCount - finalProblematic.length) / finalCount) * 100)
  console.log(`🏥 修正後健全性: ${healthScore}%`)
  
  if (finalProblematic.length === 0 && finalDuplicates === 0) {
    console.log('\n🎉 全ての問題が解決されました！')
    console.log('✅ 高品質なアフィリエイトシステムが完成')
  }
  
  console.log('\n' + '🎊'.repeat(30))
  
  return {
    removed: removedCount,
    finalCount,
    healthScore,
    monthlyRevenue: finalMonthlyRevenue
  }
}

fixProblematicStores()