#!/usr/bin/env npx tsx

/**
 * LinkSwitch対応: 既存のアフィリエイトリンクを直接リンクに変換
 * 
 * このスクリプトは：
 * 1. 既存の複雑なバリューコマースアフィリエイトURLを直接リンクに変換
 * 2. LinkSwitchが自動で変換できるようにする
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Location {
  id: string
  name: string
  tabelog_url: string | null
  affiliate_info: any
}

/**
 * バリューコマースのアフィリエイトURLから元のURLを抽出
 */
function extractOriginalUrl(affiliateUrl: string): string | null {
  try {
    const url = new URL(affiliateUrl)
    
    // vc_url パラメータを取得
    const vcUrl = url.searchParams.get('vc_url')
    if (vcUrl) {
      return decodeURIComponent(vcUrl)
    }
    
    console.log(`⚠️ vc_urlパラメータが見つかりません: ${affiliateUrl}`)
    return null
  } catch (error) {
    console.error(`❌ URL解析エラー: ${affiliateUrl}`, error)
    return null
  }
}

async function convertToDirectLinks() {
  console.log('🔄 LinkSwitch対応: アフィリエイトリンクを直接リンクに変換中...')
  
  try {
    // アフィリエイトリンクが設定されている店舗を取得
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, tabelog_url, affiliate_info')
      .not('tabelog_url', 'is', null)
    
    if (error) {
      console.error('❌ データベースエラー:', error)
      return
    }
    
    console.log(`📊 アフィリエイトリンクが設定されている店舗: ${locations?.length}件`)
    
    if (!locations || locations.length === 0) {
      console.log('✅ 変換対象のリンクがありません')
      return
    }
    
    let convertedCount = 0
    
    for (const location of locations) {
      const originalUrl = extractOriginalUrl(location.tabelog_url)
      
      if (originalUrl && originalUrl !== location.tabelog_url) {
        console.log(`🔄 変換中: ${location.name}`)
        console.log(`   FROM: ${location.tabelog_url}`)
        console.log(`   TO:   ${originalUrl}`)
        
        // データベースを更新
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            tabelog_url: originalUrl,
            affiliate_info: {
              ...location.affiliate_info,
              linkswitch_enabled: true,
              original_affiliate_url: location.tabelog_url,
              converted_at: new Date().toISOString()
            }
          })
          .eq('id', location.id)
        
        if (updateError) {
          console.error(`❌ 更新エラー (${location.name}):`, updateError)
        } else {
          convertedCount++
          console.log(`✅ 変換完了: ${location.name}`)
        }
      } else {
        console.log(`⚠️ スキップ: ${location.name} (既に直接リンクまたは変換不可)`)
      }
    }
    
    console.log(`\n🎉 変換完了!`)
    console.log(`📊 変換した店舗数: ${convertedCount}件`)
    console.log(`\n🔧 次のステップ:`)
    console.log(`1. サイトをリロードしてLinkSwitchの動作確認`)
    console.log(`2. 食べログリンクにマウスオーバーして "aml.valuecommerce.com" に変換されるか確認`)
    console.log(`3. クリックして正しいページに遷移するか確認`)
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// テスト用関数
async function testCurrentLinks() {
  console.log('🔍 現在のリンク状況を確認中...')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, affiliate_info')
    .not('tabelog_url', 'is', null)
  
  if (error) {
    console.error('❌ データベースエラー:', error)
    return
  }
  
  console.log(`\n📋 現在の設定状況:`)
  locations?.forEach((location, index) => {
    console.log(`${index + 1}. ${location.name}`)
    console.log(`   URL: ${location.tabelog_url}`)
    
    const isAffiliate = location.tabelog_url?.includes('valuecommerce.com')
    const isDirect = location.tabelog_url?.includes('tabelog.com') && !location.tabelog_url?.includes('valuecommerce.com')
    
    console.log(`   タイプ: ${isAffiliate ? '🔗 アフィリエイトリンク' : isDirect ? '🌐 直接リンク' : '❓ 不明'}`)
    console.log('')
  })
}

// コマンドライン引数で動作を切り替え
const action = process.argv[2]

switch (action) {
  case 'test':
  case 'check':
    testCurrentLinks()
    break
  case 'convert':
  default:
    convertToDirectLinks()
    break
}