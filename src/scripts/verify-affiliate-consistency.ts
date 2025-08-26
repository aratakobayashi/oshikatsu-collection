#!/usr/bin/env npx tsx

/**
 * アフィリエイトリンク一致性調査スクリプト
 * locationテーブルの店舗とアフィリエイトリンクが正しく設定されているかを調査
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

async function verifyAffiliateConsistency() {
  console.log('🔍 アフィリエイトリンク一致性調査開始')
  console.log('=' .repeat(60))
  
  try {
    // 全店舗データを取得
    const { data: allLocations, error: allError } = await supabase
      .from('locations')
      .select('id, name, tabelog_url, affiliate_info')
      .order('name')
    
    if (allError) {
      console.error('❌ データ取得エラー:', allError)
      return
    }
    
    const totalStores = allLocations?.length || 0
    console.log(`📊 総店舗数: ${totalStores}件`)
    
    // アフィリエイトリンク設定済み店舗
    const withAffiliateLink = allLocations?.filter(store => 
      store.tabelog_url && store.tabelog_url.trim() !== ''
    ) || []
    
    // アフィリエイトリンク未設定店舗
    const withoutAffiliateLink = allLocations?.filter(store => 
      !store.tabelog_url || store.tabelog_url.trim() === ''
    ) || []
    
    console.log(`✅ アフィリエイトリンク設定済み: ${withAffiliateLink.length}件`)
    console.log(`❌ アフィリエイトリンク未設定: ${withoutAffiliateLink.length}件`)
    console.log(`📈 設定率: ${Math.round((withAffiliateLink.length / totalStores) * 100)}%`)
    
    // affiliate_info の状況確認
    console.log('\n' + '=' .repeat(60))
    console.log('📋 affiliate_info 詳細分析')
    console.log('=' .repeat(60))
    
    const withAffiliateInfo = withAffiliateLink.filter(store => 
      store.affiliate_info && typeof store.affiliate_info === 'object'
    )
    
    const withoutAffiliateInfo = withAffiliateLink.filter(store => 
      !store.affiliate_info || typeof store.affiliate_info !== 'object'
    )
    
    console.log(`✅ affiliate_info有り: ${withAffiliateInfo.length}件`)
    console.log(`❌ affiliate_info無し: ${withoutAffiliateInfo.length}件`)
    
    // フェーズ別集計
    if (withAffiliateInfo.length > 0) {
      console.log('\n📊 フェーズ別集計:')
      const phaseStats = withAffiliateInfo.reduce((acc: any, store) => {
        const info = store.affiliate_info as any
        const source = info?.source || 'unknown'
        const phase = info?.phase || 'unknown'
        
        if (!acc[source]) acc[source] = 0
        acc[source]++
        
        return acc
      }, {})
      
      Object.entries(phaseStats).forEach(([source, count]) => {
        console.log(`   ${source}: ${count}件`)
      })
    }
    
    // URL形式チェック
    console.log('\n' + '=' .repeat(60))
    console.log('🔗 URL形式チェック')
    console.log('=' .repeat(60))
    
    const validTabelog = withAffiliateLink.filter(store => 
      store.tabelog_url?.includes('tabelog.com')
    )
    
    const invalidUrls = withAffiliateLink.filter(store => 
      !store.tabelog_url?.includes('tabelog.com')
    )
    
    console.log(`✅ 正しいTabelog URL: ${validTabelog.length}件`)
    console.log(`❌ 不正なURL: ${invalidUrls.length}件`)
    
    if (invalidUrls.length > 0) {
      console.log('\n❌ 不正なURL店舗:')
      invalidUrls.slice(0, 5).forEach((store, index) => {
        console.log(`   ${index + 1}. ${store.name}`)
        console.log(`      URL: ${store.tabelog_url}`)
      })
    }
    
    // 重複URL チェック
    console.log('\n' + '=' .repeat(60))
    console.log('🔄 重複URLチェック')
    console.log('=' .repeat(60))
    
    const urlCounts = withAffiliateLink.reduce((acc: any, store) => {
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
      console.log('\n重複URL詳細:')
      duplicateUrls.slice(0, 5).forEach(([url, stores]: [string, any]) => {
        console.log(`   URL: ${url}`)
        console.log(`   重複店舗: ${stores.length}件`)
        stores.forEach((store: any, index: number) => {
          console.log(`     ${index + 1}. ${store.name} (ID: ${store.id})`)
        })
        console.log()
      })
    }
    
    // 品質チェック
    console.log('\n' + '=' .repeat(60))
    console.log('🏪 店舗品質チェック')
    console.log('=' .repeat(60))
    
    const suspiciousKeywords = [
      'コスメ', 'CANMAKE', 'Dior', 'Burberry', 'shu uemura', 'TOM FORD',
      '場所（', '撮影（', '行った（', 'CV：', 'feat.', '#', '関連）',
      '美術館', 'museum', 'スタジオ', 'Studio', 'ジム', 'Gym',
      '警視庁', '庁舎', '公園', '神社', '寺', '城',
      'SHISEIDO', 'ジュエリー', '古着屋', 'OVERRIDE',
      'MV', 'PV', 'アリーナ'
    ]
    
    const suspiciousStores = withAffiliateLink.filter(store => 
      suspiciousKeywords.some(keyword => store.name.includes(keyword))
    )
    
    console.log(`⚠️ 要確認店舗: ${suspiciousStores.length}件`)
    
    if (suspiciousStores.length > 0) {
      console.log('\n要確認店舗サンプル:')
      suspiciousStores.slice(0, 10).forEach((store, index) => {
        const matchedKeyword = suspiciousKeywords.find(keyword => 
          store.name.includes(keyword)
        )
        console.log(`   ${index + 1}. ${store.name}`)
        console.log(`      問題キーワード: "${matchedKeyword}"`)
        console.log(`      URL: ${store.tabelog_url}`)
      })
    }
    
    // 収益計算
    console.log('\n' + '=' .repeat(60))
    console.log('💰 収益計算')
    console.log('=' .repeat(60))
    
    const validAffiliateStores = validTabelog.length - suspiciousStores.length
    const monthlyRevenue = validAffiliateStores * 3 * 0.02 * 2000
    const yearlyRevenue = monthlyRevenue * 12
    
    console.log(`✅ 有効アフィリエイト店舗: ${validAffiliateStores}件`)
    console.log(`💰 予想月間収益: ¥${monthlyRevenue.toLocaleString()}`)
    console.log(`💎 予想年間収益: ¥${yearlyRevenue.toLocaleString()}`)
    
    // サマリー
    console.log('\n' + '🎊'.repeat(30))
    console.log('📊 調査結果サマリー')
    console.log('🎊'.repeat(30))
    
    console.log(`📈 総店舗数: ${totalStores}件`)
    console.log(`✅ アフィリエイト設定済み: ${withAffiliateLink.length}件 (${Math.round((withAffiliateLink.length / totalStores) * 100)}%)`)
    console.log(`✅ 正しいURL: ${validTabelog.length}件`)
    console.log(`⚠️ 要確認: ${suspiciousStores.length}件`)
    console.log(`🔄 重複URL: ${duplicateUrls.length}個`)
    console.log(`💰 予想月間収益: ¥${monthlyRevenue.toLocaleString()}`)
    
    const healthScore = Math.round(((validTabelog.length - suspiciousStores.length) / withAffiliateLink.length) * 100)
    console.log(`🏥 システム健全性: ${healthScore}%`)
    
    console.log('\n' + '🎊'.repeat(30))
    
    return {
      total: totalStores,
      withAffiliate: withAffiliateLink.length,
      validUrls: validTabelog.length,
      suspicious: suspiciousStores.length,
      duplicates: duplicateUrls.length,
      healthScore,
      monthlyRevenue
    }
    
  } catch (error) {
    console.error('❌ 調査中にエラーが発生しました:', error)
  }
}

verifyAffiliateConsistency()