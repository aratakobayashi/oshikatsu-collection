#!/usr/bin/env node

/**
 * LinkSwitch活用状況の分析スクリプト
 * 全ロケーションデータでLinkSwitchを活用できているか確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeLinkSwitchCompatibility() {
  console.log('🔍 LinkSwitch活用状況分析開始...\n')
  console.log('=' .repeat(60))
  
  try {
    // 全ロケーションデータを取得
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, tabelog_url, website_url, affiliate_info')
      .order('name')
    
    if (error) throw error
    
    if (!locations || locations.length === 0) {
      console.log('⚠️ ロケーションデータが見つかりません')
      return
    }
    
    console.log(`📊 分析対象: ${locations.length}件のロケーション\n`)
    
    // 分類
    const compatible = []      // LinkSwitch活用可能（食べログ直接URL）
    const needsConversion = [] // 変換が必要（複雑なアフィリエイトURL）
    const noUrl = []          // URL未設定
    const nonTabelog = []     // 食べログ以外のURL
    
    for (const location of locations) {
      const { tabelog_url, website_url } = location
      
      if (!tabelog_url) {
        noUrl.push(location)
      } else if (tabelog_url.includes('tabelog.com') && !tabelog_url.includes('valuecommerce.com')) {
        // 食べログの直接URL = LinkSwitch活用可能
        compatible.push(location)
      } else if (tabelog_url.includes('valuecommerce.com') || tabelog_url.includes('ck.jp.ap.valuecommerce.com')) {
        // 複雑なアフィリエイトURL = 変換が必要
        needsConversion.push(location)
      } else {
        // その他のURL
        nonTabelog.push(location)
      }
    }
    
    // 結果表示
    console.log('📈 分析結果:\n')
    
    console.log(`✅ LinkSwitch活用可能: ${compatible.length}件`)
    if (compatible.length > 0) {
      console.log('   例:')
      compatible.slice(0, 3).forEach(loc => {
        console.log(`   - ${loc.name}`)
        console.log(`     URL: ${loc.tabelog_url?.substring(0, 60)}...`)
      })
    }
    
    console.log(`\n🔄 変換が必要: ${needsConversion.length}件`)
    if (needsConversion.length > 0) {
      console.log('   例（複雑なアフィリエイトURL）:')
      needsConversion.slice(0, 3).forEach(loc => {
        console.log(`   - ${loc.name}`)
        console.log(`     現在: ${loc.tabelog_url?.substring(0, 60)}...`)
        
        // 元のURL抽出を試行
        if (loc.tabelog_url?.includes('vc_url=')) {
          const match = loc.tabelog_url.match(/vc_url=([^&]+)/)
          if (match) {
            const originalUrl = decodeURIComponent(match[1])
            console.log(`     変換後: ${originalUrl.substring(0, 60)}...`)
          }
        }
      })
    }
    
    console.log(`\n❌ URL未設定: ${noUrl.length}件`)
    if (noUrl.length > 0) {
      console.log('   例:')
      noUrl.slice(0, 3).forEach(loc => {
        console.log(`   - ${loc.name}`)
      })
    }
    
    console.log(`\n⚠️ 食べログ以外: ${nonTabelog.length}件`)
    if (nonTabelog.length > 0) {
      console.log('   例:')
      nonTabelog.slice(0, 3).forEach(loc => {
        console.log(`   - ${loc.name}`)
        console.log(`     URL: ${loc.tabelog_url?.substring(0, 60)}...`)
      })
    }
    
    // 統計情報
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 統計:')
    const total = locations.length
    console.log(`   総ロケーション数: ${total}件`)
    console.log(`   LinkSwitch活用率: ${Math.round((compatible.length / total) * 100)}%`)
    console.log(`   改善余地: ${needsConversion.length + noUrl.length}件`)
    
    // 推奨アクション
    console.log('\n💡 推奨アクション:')
    
    if (needsConversion.length > 0) {
      console.log(`\n1. 複雑なアフィリエイトURL変換 (${needsConversion.length}件)`)
      console.log('   npx tsx scripts/convert-complex-urls-to-direct.ts')
    }
    
    if (noUrl.length > 0) {
      console.log(`\n2. 食べログURL調査・追加 (${noUrl.length}件)`)
      console.log('   - 手動調査が必要')
      console.log('   - 実在店舗のみ登録')
    }
    
    if (nonTabelog.length > 0) {
      console.log(`\n3. 非対応URL確認 (${nonTabelog.length}件)`)
      console.log('   - 食べログがない店舗は現状維持')
      console.log('   - 可能なら食べログURLを併記')
    }
    
    // 効果予測
    console.log('\n🎯 改善効果予測:')
    const improvableCount = needsConversion.length + (noUrl.length * 0.7) // 70%が食べログ対応と仮定
    console.log(`   改善可能件数: 約${Math.round(improvableCount)}件`)
    console.log(`   最終活用率: 約${Math.round(((compatible.length + improvableCount) / total) * 100)}%`)
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeLinkSwitchCompatibility().catch(console.error)