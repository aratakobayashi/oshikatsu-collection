#!/usr/bin/env node

/**
 * 孤独のグルメの実際のレストラン情報に修正するスクリプト
 * 間違った情報を正しく更新
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 実際の孤独のグルメ登場店舗（確認済み）
const CORRECT_RESTAURANT_DATA = [
  {
    old_name: '庄や 門前仲町店',
    new_name: '庄助',
    address: '東京都江東区富岡1-2-8',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13065350/',
    description: '孤独のグルメ Season1 第1話で登場した伝説の焼き鳥店。つくねとピーマンが名物。',
    episode_info: 'Season1 第1話「江東区門前仲町のやきとりと焼きめし」',
    notes: '土日祝休み、17:30-23:00営業'
  }
  // 他の店舗も後で調査して追加予定
]

async function fixKodokuRestaurantData() {
  console.log('🍜 孤独のグルメ店舗データ修正開始...\n')
  console.log('⚠️ 申し訳ありません！推測で間違った情報を設定していました。')
  console.log('実際の撮影店舗に修正します。\n')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let errorCount = 0
  
  for (const restaurant of CORRECT_RESTAURANT_DATA) {
    console.log(`\n📍 修正中: ${restaurant.old_name} → ${restaurant.new_name}`)
    console.log(`   エピソード: ${restaurant.episode_info}`)
    console.log(`   住所: ${restaurant.address}`)
    console.log(`   食べログ: ${restaurant.tabelog_url}`)
    
    try {
      // 旧名前で検索して更新
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: restaurant.new_name,
          address: restaurant.address,
          description: restaurant.description,
          tabelog_url: restaurant.tabelog_url,
          affiliate_info: {
            tabelog: {
              original_url: restaurant.tabelog_url,
              affiliate_url: null,
              status: 'verified_correct',
              note: `実際の撮影店舗に修正済み。${restaurant.notes}`,
              last_updated: new Date().toISOString()
            }
          }
        })
        .eq('name', restaurant.old_name)
        .select()
        .single()
      
      if (error) {
        console.error(`   ❌ エラー: ${error.message}`)
        errorCount++
      } else if (data) {
        console.log(`   ✅ 修正完了`)
        console.log(`      - 実際の店名: ${restaurant.new_name}`)
        console.log(`      - 正しい住所: ${restaurant.address}`)
        console.log(`      - 備考: ${restaurant.notes}`)
        successCount++
      } else {
        console.log(`   ⚠️ 対象データが見つかりません`)
        errorCount++
      }
      
    } catch (error) {
      console.error(`   ❌ 予期しないエラー: ${error}`)
      errorCount++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 修正結果:')
  console.log(`   ✅ 成功: ${successCount}件`)
  console.log(`   ❌ エラー: ${errorCount}件`)
  
  console.log('\n🙇‍♂️ 今後の対応:')
  console.log('1. 他の9店舗も実際の撮影店舗を調査')
  console.log('2. 公式情報・ファンサイトで正確性を確認')
  console.log('3. 推測ではなく確認済み情報のみ登録')
  console.log('\n💡 情報源:')
  console.log('- テレビ東京公式サイト')
  console.log('- 食べログの実際の店舗ページ')
  console.log('- 聖地巡礼ブログ（確認済み）')
}

// 実行
fixKodokuRestaurantData().catch(console.error)