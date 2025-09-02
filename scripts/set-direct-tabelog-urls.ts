#!/usr/bin/env node

/**
 * 食べログの直接URLを設定するスクリプト
 * （MyLink設定前の暫定対応）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 食べログ直接URL（アフィリエイトなし）
const DIRECT_TABELOG_URLS = [
  {
    location_name: '庄や 門前仲町店',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13019733/'
  },
  {
    location_name: '中国家庭料理 楊 2号店',
    tabelog_url: 'https://tabelog.com/tokyo/A1305/A130501/13001651/'
  },
  {
    location_name: '佐藤養助 銀座店',
    tabelog_url: 'https://tabelog.com/tokyo/A1301/A130101/13002765/'
  },
  {
    location_name: 'みんみん',
    tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13003625/'
  },
  {
    location_name: 'だるま 東陽店',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13043871/'
  },
  {
    location_name: '中国家庭料理 山楽',
    tabelog_url: 'https://tabelog.com/tokyo/A1311/A131106/13003634/'
  },
  {
    location_name: 'ザクロ',
    tabelog_url: 'https://tabelog.com/tokyo/A1311/A131105/13003732/'
  },
  {
    location_name: '阿佐',
    tabelog_url: 'https://tabelog.com/tokyo/A1321/A132105/13094693/'
  },
  {
    location_name: 'もつ焼き ばん',
    tabelog_url: 'https://tabelog.com/tokyo/A1328/A132807/13125904/'
  },
  {
    location_name: '玉泉亭',
    tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140212/14002891/'
  }
]

async function setDirectTabelogUrls() {
  console.log('🍜 食べログ直接URLを設定（暫定対応）\n')
  console.log('=' .repeat(60))
  console.log('\n⚠️ 注意: これは暫定対応です。')
  console.log('MyLink設定完了後、正式なアフィリエイトリンクに更新してください。\n')
  
  let successCount = 0
  let errorCount = 0
  
  for (const location of DIRECT_TABELOG_URLS) {
    console.log(`\n📍 処理中: ${location.location_name}`)
    console.log(`   URL: ${location.tabelog_url}`)
    
    try {
      // 店舗名でロケーションを検索
      const { data, error } = await supabase
        .from('locations')
        .update({
          tabelog_url: location.tabelog_url,
          affiliate_info: {
            tabelog: {
              original_url: location.tabelog_url,
              affiliate_url: null,
              status: 'pending_mylink',
              note: 'MyLink設定待ち',
              last_updated: new Date().toISOString()
            }
          }
        })
        .eq('name', location.location_name)
        .select()
        .single()
      
      if (error) {
        console.error(`   ❌ エラー: ${error.message}`)
        errorCount++
      } else if (data) {
        console.log(`   ✅ 更新成功`)
        successCount++
      } else {
        console.log(`   ⚠️ 店舗が見つかりません`)
        errorCount++
      }
      
    } catch (error) {
      console.error(`   ❌ 予期しないエラー: ${error}`)
      errorCount++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 更新結果:')
  console.log(`   ✅ 成功: ${successCount}件`)
  console.log(`   ❌ エラー: ${errorCount}件`)
  
  if (successCount > 0) {
    console.log('\n📝 次のステップ:')
    console.log('1. バリューコマース管理画面でMyLinkを設定')
    console.log('2. 正しいアフィリエイトURLを取得')
    console.log('3. update-tabelog-affiliate-urls.ts で再更新')
    console.log('\n💡 当面の効果:')
    console.log('- ユーザーは食べログで店舗情報を確認可能')
    console.log('- 聖地巡礼に必要な情報提供は実現')
    console.log('- アフィリエイト収益化は後日対応')
  }
}

// 実行
setDirectTabelogUrls().catch(console.error)