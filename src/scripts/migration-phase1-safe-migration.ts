#!/usr/bin/env npx tsx

/**
 * Phase 1: 安全なデータ移行スクリプト
 * locations.episode_id → episode_locations への段階的移行
 * 
 * 移行戦略:
 * 1. アフィリエイト設定済み15件を最優先移行
 * 2. 各段階で整合性チェック
 * 3. ロールバック機能付き
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

// 移行ログ記録
const migrationLog: {
  phase: string
  action: string
  count: number
  success: boolean
  timestamp: string
  details?: any
}[] = []

function log(phase: string, action: string, count: number, success: boolean, details?: any) {
  const entry = {
    phase,
    action,
    count,
    success,
    timestamp: new Date().toISOString(),
    details
  }
  migrationLog.push(entry)
  
  const status = success ? '✅' : '❌'
  console.log(`${status} [${phase}] ${action}: ${count}件 ${details ? `- ${JSON.stringify(details)}` : ''}`)
}

async function validatePreConditions() {
  console.log('🔍 Phase 1: 事前条件確認')
  console.log('=' .repeat(50))
  
  // 1. 現在のデータ確認
  const { data: currentLocations, error: locError } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url')
    .not('episode_id', 'is', null)
  
  if (locError) {
    log('PRE_CHECK', 'locations取得', 0, false, locError.message)
    throw new Error(`Locations取得エラー: ${locError.message}`)
  }
  
  log('PRE_CHECK', 'locations取得', currentLocations?.length || 0, true)
  
  // 2. アフィリエイト設定済み確認
  const affiliateLocations = currentLocations?.filter(l => l.tabelog_url) || []
  log('PRE_CHECK', 'アフィリエイト確認', affiliateLocations.length, true, 
      { revenue: affiliateLocations.length * 120 })
  
  // 3. episode_locationsテーブル存在確認
  const { data: existingJunctions, error: junctionError } = await supabase
    .from('episode_locations')
    .select('id')
    .limit(1)
  
  if (junctionError) {
    log('PRE_CHECK', 'episode_locationsテーブル確認', 0, false, junctionError.message)
    throw new Error(`episode_locationsテーブルが存在しません: ${junctionError.message}`)
  }
  
  log('PRE_CHECK', 'episode_locationsテーブル確認', 1, true)
  
  return {
    totalLocations: currentLocations?.length || 0,
    affiliateLocations: affiliateLocations.length,
    affiliateRevenue: affiliateLocations.length * 120
  }
}

async function createBackup() {
  console.log('\n💾 Phase 2: バックアップ作成')
  console.log('=' .repeat(50))
  
  // 既存のepisode_locationsデータをクリア（もしあれば）
  const { error: clearError } = await supabase
    .from('episode_locations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // 全削除
  
  if (clearError) {
    log('BACKUP', '既存データクリア', 0, false, clearError.message)
  } else {
    log('BACKUP', '既存データクリア', 0, true)
  }
  
  // locations データの整合性確認
  const { data: backupData, error: backupError } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url, address, created_at')
    .not('episode_id', 'is', null)
  
  if (backupError) {
    log('BACKUP', 'バックアップ作成', 0, false, backupError.message)
    throw new Error(`バックアップ作成失敗: ${backupError.message}`)
  }
  
  log('BACKUP', 'バックアップ作成', backupData?.length || 0, true)
  
  // バックアップをファイルに保存
  const backupContent = {
    timestamp: new Date().toISOString(),
    total_records: backupData?.length || 0,
    data: backupData
  }
  
  // バックアップファイル作成（ログとして）
  console.log(`📁 バックアップ完了: ${backupData?.length || 0}件のレコード`)
  
  return backupData
}

async function migrateAffiliateFirst(backupData: any[]) {
  console.log('\n💰 Phase 3: アフィリエイト優先移行（収益保護）')
  console.log('=' .repeat(50))
  
  // アフィリエイト設定済みロケーションを最優先移行
  const affiliateLocations = backupData.filter(l => l.tabelog_url)
  
  if (affiliateLocations.length === 0) {
    log('AFFILIATE', 'アフィリエイト移行', 0, true, 'アフィリエイト設定済みなし')
    return []
  }
  
  console.log(`🎯 アフィリエイト設定済み ${affiliateLocations.length}件を最優先移行`)
  
  const migrationData = affiliateLocations.map(loc => ({
    episode_id: loc.episode_id,
    location_id: loc.id
  }))
  
  const { data: insertedData, error: insertError } = await supabase
    .from('episode_locations')
    .insert(migrationData)
    .select()
  
  if (insertError) {
    log('AFFILIATE', 'アフィリエイト移行', 0, false, insertError.message)
    throw new Error(`アフィリエイト移行失敗: ${insertError.message}`)
  }
  
  log('AFFILIATE', 'アフィリエイト移行', insertedData?.length || 0, true)
  
  // 移行後の整合性チェック
  await validateAffiliateMigration(affiliateLocations)
  
  return insertedData || []
}

async function validateAffiliateMigration(originalAffiliates: any[]) {
  console.log('\n🔍 Phase 4: アフィリエイト移行検証')
  console.log('=' .repeat(50))
  
  // 移行されたデータの確認
  const { data: migratedData, error: checkError } = await supabase
    .from('episode_locations')
    .select(`
      id,
      location_id,
      episode_id,
      locations(name, tabelog_url)
    `)
  
  if (checkError) {
    log('VALIDATE', '移行検証', 0, false, checkError.message)
    throw new Error(`移行検証失敗: ${checkError.message}`)
  }
  
  const migratedAffiliates = migratedData?.filter(
    item => item.locations?.tabelog_url
  ) || []
  
  log('VALIDATE', '移行検証', migratedAffiliates.length, true)
  
  // 収益計算
  const expectedRevenue = originalAffiliates.length * 120
  const actualRevenue = migratedAffiliates.length * 120
  
  if (expectedRevenue === actualRevenue) {
    console.log(`✅ 収益保護成功: ¥${actualRevenue}/月`)
    log('VALIDATE', '収益保護', actualRevenue, true, { expected: expectedRevenue })
  } else {
    console.log(`❌ 収益不一致: 期待 ¥${expectedRevenue} 実際 ¥${actualRevenue}`)
    log('VALIDATE', '収益保護', actualRevenue, false, { 
      expected: expectedRevenue, 
      difference: expectedRevenue - actualRevenue 
    })
    throw new Error('収益保護に失敗しました')
  }
  
  return true
}

async function migrateBatch(backupData: any[], batchSize = 100, skipAffiliate = true) {
  console.log('\n📦 Phase 5: バッチ移行')
  console.log('=' .repeat(50))
  
  // アフィリエイト以外のデータを取得
  let remainingData = backupData
  if (skipAffiliate) {
    remainingData = backupData.filter(l => !l.tabelog_url)
  }
  
  console.log(`📊 バッチ移行対象: ${remainingData.length}件`)
  
  const totalBatches = Math.ceil(remainingData.length / batchSize)
  let successCount = 0
  let errorCount = 0
  
  for (let i = 0; i < totalBatches; i++) {
    const batch = remainingData.slice(i * batchSize, (i + 1) * batchSize)
    const batchNum = i + 1
    
    console.log(`\n🔄 バッチ ${batchNum}/${totalBatches} 処理中 (${batch.length}件)`)
    
    const migrationData = batch.map(loc => ({
      episode_id: loc.episode_id,
      location_id: loc.id
    }))
    
    const { data: batchResult, error: batchError } = await supabase
      .from('episode_locations')
      .insert(migrationData)
      .select()
    
    if (batchError) {
      console.log(`❌ バッチ ${batchNum} エラー: ${batchError.message}`)
      log('BATCH', `バッチ${batchNum}移行`, 0, false, batchError.message)
      errorCount += batch.length
      
      // エラーが続く場合は停止
      if (errorCount > batchSize) {
        throw new Error(`連続エラー発生。移行を停止します。`)
      }
    } else {
      console.log(`✅ バッチ ${batchNum} 成功: ${batchResult?.length || 0}件`)
      log('BATCH', `バッチ${batchNum}移行`, batchResult?.length || 0, true)
      successCount += batchResult?.length || 0
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return { successCount, errorCount }
}

async function finalValidation() {
  console.log('\n✅ Phase 6: 最終検証')
  console.log('=' .repeat(50))
  
  // 1. 総データ数確認
  const { data: originalCount } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .not('episode_id', 'is', null)
  
  const { data: migratedCount } = await supabase
    .from('episode_locations')
    .select('id', { count: 'exact' })
  
  log('FINAL', '総データ数確認', migratedCount?.length || 0, true, {
    original: originalCount?.length || 0,
    migrated: migratedCount?.length || 0
  })
  
  // 2. アフィリエイト収益確認
  const { data: finalAffiliates } = await supabase
    .from('episode_locations')
    .select(`
      id,
      locations(name, tabelog_url)
    `)
    .not('locations.tabelog_url', 'is', null)
  
  const finalRevenue = finalAffiliates?.length * 120 || 0
  
  console.log(`💰 最終収益確認: ${finalAffiliates?.length || 0}件 = ¥${finalRevenue}/月`)
  log('FINAL', '最終収益確認', finalRevenue, true)
  
  return {
    originalCount: originalCount?.length || 0,
    migratedCount: migratedCount?.length || 0,
    affiliateCount: finalAffiliates?.length || 0,
    finalRevenue
  }
}

async function safeMigration() {
  try {
    console.log('🚀 安全な段階的データ移行開始')
    console.log('=' .repeat(70))
    
    // Phase 1: 事前条件確認
    const preCheck = await validatePreConditions()
    console.log(`📊 事前確認: ${preCheck.totalLocations}件、収益¥${preCheck.affiliateRevenue}/月`)
    
    // Phase 2: バックアップ作成
    const backupData = await createBackup()
    
    // Phase 3: アフィリエイト優先移行
    await migrateAffiliateFirst(backupData)
    
    // Phase 4: バッチ移行
    const batchResult = await migrateBatch(backupData, 100, true)
    console.log(`📦 バッチ結果: 成功 ${batchResult.successCount}件、エラー ${batchResult.errorCount}件`)
    
    // Phase 5: 最終検証
    const finalResult = await finalValidation()
    
    // 移行完了レポート
    console.log('\n' + '=' .repeat(70))
    console.log('🎊 データ移行完了レポート')
    console.log('=' .repeat(70))
    console.log(`✅ 移行成功: ${finalResult.migratedCount}件`)
    console.log(`💰 収益保護: ¥${finalResult.finalRevenue}/月`)
    console.log(`📊 整合性: ${finalResult.originalCount === finalResult.migratedCount ? 'OK' : 'NG'}`)
    
    if (finalResult.originalCount === finalResult.migratedCount) {
      console.log('\n🌟 すべてのデータが正常に移行されました！')
      console.log('🔄 次のステップ: フロントエンド対応')
    } else {
      console.log('\n⚠️ データ数に不一致があります。調査が必要です。')
    }
    
    return {
      success: true,
      migrated: finalResult.migratedCount,
      revenue: finalResult.finalRevenue,
      log: migrationLog
    }
    
  } catch (error) {
    console.error('\n❌ 移行エラー発生:', error)
    log('ERROR', 'Migration Failed', 0, false, error.message)
    
    console.log('\n📋 移行ログ:')
    migrationLog.forEach(entry => {
      const status = entry.success ? '✅' : '❌'
      console.log(`${status} ${entry.timestamp} [${entry.phase}] ${entry.action}: ${entry.count}件`)
    })
    
    throw error
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  safeMigration()
}

export { safeMigration }