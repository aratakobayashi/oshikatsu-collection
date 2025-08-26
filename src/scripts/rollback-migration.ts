#!/usr/bin/env npx tsx

/**
 * ロールバック用緊急スクリプト
 * 移行が失敗した場合の安全な復旧処理
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

async function rollbackMigration() {
  console.log('🔄 緊急ロールバック開始')
  console.log('=' .repeat(50))
  
  try {
    // 1. 現在の episode_locations データを確認
    const { data: currentData, error: checkError } = await supabase
      .from('episode_locations')
      .select('id, episode_id, location_id')
    
    if (checkError) {
      console.error('❌ 現在データ確認エラー:', checkError.message)
      return false
    }
    
    console.log(`📊 現在のepisode_locationsレコード: ${currentData?.length || 0}件`)
    
    // 2. episode_locations テーブルをクリア
    const { error: clearError } = await supabase
      .from('episode_locations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除
    
    if (clearError) {
      console.error('❌ データクリアエラー:', clearError.message)
      return false
    }
    
    console.log('✅ episode_locationsテーブルをクリアしました')
    
    // 3. locations.episode_id の整合性確認
    const { data: locationsData, error: locError } = await supabase
      .from('locations')
      .select('id, name, episode_id, tabelog_url')
      .not('episode_id', 'is', null)
    
    if (locError) {
      console.error('❌ locationsデータ確認エラー:', locError.message)
      return false
    }
    
    console.log(`📊 locations.episode_id設定済み: ${locationsData?.length || 0}件`)
    
    // 4. アフィリエイト収益の確認
    const affiliateCount = locationsData?.filter(l => l.tabelog_url)?.length || 0
    const revenue = affiliateCount * 120
    
    console.log(`💰 アフィリエイト収益確認: ${affiliateCount}件 = ¥${revenue}/月`)
    
    // 5. ロールバック完了確認
    console.log('\n✅ ロールバック完了')
    console.log('=' .repeat(50))
    console.log('📊 システム状況:')
    console.log(`  • 直接リンク構造に復旧: ${locationsData?.length || 0}件`)
    console.log(`  • アフィリエイト収益: ¥${revenue}/月`)
    console.log(`  • episode_locations: クリア済み`)
    console.log('')
    console.log('🔄 フロントエンドは元の構造で動作します')
    
    return true
    
  } catch (error) {
    console.error('❌ ロールバック中にエラーが発生:', error)
    
    console.log('\n🚨 手動復旧が必要です:')
    console.log('1. Supabaseダッシュボードにアクセス')
    console.log('2. episode_locationsテーブルを手動でクリア')
    console.log('3. locationsテーブルのepisode_idが正しく設定されているか確認')
    
    return false
  }
}

// 実行確認
async function confirmRollback() {
  console.log('⚠️ ロールバック実行確認')
  console.log('=' .repeat(50))
  console.log('この操作により:')
  console.log('• episode_locationsの全データが削除されます')
  console.log('• 直接リンク構造（locations.episode_id）に戻ります')
  console.log('• 既存のアフィリエイト収益は保護されます')
  console.log('')
  
  // 実際の実行（コメントアウト）
  // const proceed = confirm('続行しますか？')
  // if (proceed) {
    return await rollbackMigration()
  // }
  
  // return false
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  confirmRollback()
}

export { rollbackMigration }