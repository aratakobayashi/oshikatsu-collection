#!/usr/bin/env node

/**
 * 複雑なアフィリエイトURLを食べログ直接URLに変換するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function convertComplexUrlsToDirected() {
  console.log('🔄 複雑なアフィリエイトURL → 食べログ直接URL変換開始...\n')
  
  try {
    // 複雑なアフィリエイトURLを持つロケーションを検索
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, tabelog_url, affiliate_info')
      .or('tabelog_url.ilike.%valuecommerce.com%,tabelog_url.ilike.%ck.jp.ap.valuecommerce.com%')
    
    if (error) throw error
    
    if (!locations || locations.length === 0) {
      console.log('✅ 変換が必要な複雑URLは見つかりませんでした')
      return
    }
    
    console.log(`🔍 変換対象: ${locations.length}件\n`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const location of locations) {
      console.log(`📍 処理中: ${location.name}`)
      console.log(`   現在URL: ${location.tabelog_url?.substring(0, 80)}...`)
      
      try {
        // 元の食べログURLを抽出
        let originalUrl = null
        
        if (location.tabelog_url?.includes('vc_url=')) {
          // vc_urlパラメータから抽出
          const match = location.tabelog_url.match(/vc_url=([^&]+)/)
          if (match) {
            originalUrl = decodeURIComponent(match[1])
          }
        } else if (location.tabelog_url?.includes('tabelog.com')) {
          // 既に食べログURLの場合はそのまま使用
          originalUrl = location.tabelog_url
        }
        
        if (!originalUrl) {
          console.log(`   ⚠️ 元URLを抽出できませんでした`)
          errorCount++
          continue
        }
        
        // 食べログの直接URLに変換
        const { data, error: updateError } = await supabase
          .from('locations')
          .update({
            tabelog_url: originalUrl,
            affiliate_info: {
              ...location.affiliate_info,
              conversion: {
                from: 'complex_affiliate',
                to: 'linkswitch_direct',
                original_complex_url: location.tabelog_url,
                converted_at: new Date().toISOString(),
                note: 'LinkSwitch対応のため直接URLに変換'
              }
            }
          })
          .eq('id', location.id)
          .select()
          .single()
        
        if (updateError) {
          console.error(`   ❌ 更新エラー: ${updateError.message}`)
          errorCount++
        } else {
          console.log(`   ✅ 変換成功`)
          console.log(`   新URL: ${originalUrl.substring(0, 80)}...`)
          successCount++
        }
        
      } catch (error) {
        console.error(`   ❌ 処理エラー: ${error}`)
        errorCount++
      }
      
      console.log('') // 空行
    }
    
    console.log('=' .repeat(60))
    console.log('\n📊 変換結果:')
    console.log(`   ✅ 成功: ${successCount}件`)
    console.log(`   ❌ エラー: ${errorCount}件`)
    
    if (successCount > 0) {
      console.log('\n🎉 変換完了！')
      console.log('\n💡 効果:')
      console.log('- LinkSwitchで自動アフィリエイト変換される')
      console.log('- URLがシンプルになり管理が容易')
      console.log('- 将来的な保守性が向上')
      
      console.log('\n📝 次のステップ:')
      console.log('1. フロントエンドで動作確認')
      console.log('2. リンクにマウスオーバーしてLinkSwitch変換を確認')
      console.log('3. バリューコマース管理画面でクリック数確認')
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
convertComplexUrlsToDirected().catch(console.error)