/**
 * ステージング環境から本番環境へのデータ移行
 * 段階的かつ安全な移行プロセス
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
import * as path from 'path'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

if (!stagingUrl || !stagingKey || !productionUrl || !productionKey) {
  console.error('❌ 環境変数が不足しています')
  process.exit(1)
}

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

// バックアップディレクトリ
const backupDir = './data-backup'

interface MigrationStats {
  table: string
  staging: number
  production: number
  migrated: number
  errors: number
}

// バックアップディレクトリ作成
function ensureBackupDir() {
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
}

// 本番環境データのバックアップ
async function backupProductionData() {
  console.log('💾 本番環境データのバックアップ開始...\n')
  
  const tables = ['celebrities', 'episodes', 'locations', 'items', 'episode_locations', 'episode_items', 'users', 'user_posts']
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table}テーブルをバックアップ中...`)
      
      const { data, error } = await productionSupabase
        .from(table)
        .select('*')
      
      if (error) {
        console.error(`   ❌ ${table} バックアップエラー:`, error.message)
        continue
      }
      
      const backupFile = path.join(backupDir, `production_${table}_backup_${new Date().toISOString().split('T')[0]}.json`)
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2))
      
      console.log(`   ✅ バックアップ完了: ${data?.length || 0}件 → ${backupFile}`)
      
    } catch (err) {
      console.error(`   ❌ ${table} 予期しないエラー:`, err)
    }
  }
  
  console.log('\n💾 バックアップ完了')
}

// ステージングデータのエクスポート
async function exportStagingData() {
  console.log('\n📤 ステージングデータのエクスポート開始...\n')
  
  const tables = ['celebrities', 'episodes', 'locations', 'items', 'episode_locations', 'episode_items']
  const exportData: Record<string, any[]> = {}
  
  for (const table of tables) {
    try {
      console.log(`📋 ${table}テーブルをエクスポート中...`)
      
      const { data, error } = await stagingSupabase
        .from(table)
        .select('*')
        .order('created_at', { ascending: true, nullsFirst: false })
      
      if (error) {
        console.error(`   ❌ ${table} エクスポートエラー:`, error.message)
        continue
      }
      
      exportData[table] = data || []
      console.log(`   ✅ エクスポート完了: ${data?.length || 0}件`)
      
    } catch (err) {
      console.error(`   ❌ ${table} 予期しないエラー:`, err)
    }
  }
  
  // エクスポートデータを保存
  const exportFile = path.join(backupDir, `staging_export_${new Date().toISOString().split('T')[0]}.json`)
  fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2))
  
  console.log(`\n📤 エクスポート完了: ${exportFile}`)
  return exportData
}

// 本番環境へのデータインポート
async function importToProduction(exportData: Record<string, any[]>) {
  console.log('\n📥 本番環境へのインポート開始...\n')
  
  // インポート順序（外部キー制約を考慮）
  const importOrder = ['celebrities', 'episodes', 'locations', 'items', 'episode_locations', 'episode_items']
  const stats: MigrationStats[] = []
  
  for (const table of importOrder) {
    const tableData = exportData[table] || []
    
    if (tableData.length === 0) {
      console.log(`⏭️ ${table}: データなし`)
      continue
    }
    
    console.log(`\n📋 ${table}テーブル インポート中... (${tableData.length}件)`)
    
    let migrated = 0
    let errors = 0
    
    // 本番の既存データ件数
    const { count: prodCount } = await productionSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    // バッチでインポート（100件ずつ）
    const batchSize = 100
    for (let i = 0; i < tableData.length; i += batchSize) {
      const batch = tableData.slice(i, i + batchSize)
      
      try {
        const { data, error } = await productionSupabase
          .from(table)
          .upsert(batch, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
        
        if (error) {
          console.error(`   ❌ バッチ ${Math.floor(i/batchSize) + 1} エラー:`, error.message)
          errors += batch.length
        } else {
          migrated += data?.length || 0
          console.log(`   ✅ バッチ ${Math.floor(i/batchSize) + 1}/${Math.ceil(tableData.length/batchSize)} 完了`)
        }
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (err) {
        console.error(`   ❌ バッチ ${Math.floor(i/batchSize) + 1} 予期しないエラー:`, err)
        errors += batch.length
      }
    }
    
    stats.push({
      table,
      staging: tableData.length,
      production: prodCount || 0,
      migrated,
      errors
    })
    
    console.log(`   📊 ${table}: ${migrated}件移行成功, ${errors}件エラー`)
  }
  
  return stats
}

// データ整合性の検証
async function validateDataIntegrity() {
  console.log('\n🔍 データ整合性検証開始...\n')
  
  const tables = ['celebrities', 'episodes', 'locations', 'items', 'episode_locations', 'episode_items']
  
  for (const table of tables) {
    try {
      // ステージングと本番の件数比較
      const { count: stagingCount } = await stagingSupabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        
      const { count: productionCount } = await productionSupabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      const match = stagingCount === productionCount ? '✅' : '⚠️'
      console.log(`${match} ${table}: ステージング(${stagingCount}) vs 本番(${productionCount})`)
      
    } catch (err) {
      console.error(`❌ ${table} 整合性チェックエラー:`, err)
    }
  }
}

// 移行結果サマリー
function displayMigrationSummary(stats: MigrationStats[]) {
  console.log('\n' + '='.repeat(70))
  console.log('📊 データ移行完了サマリー')
  console.log('='.repeat(70))
  
  console.log('テーブル名'.padEnd(20) + 'ステージング'.padEnd(12) + '本番(前)'.padEnd(10) + '移行済み'.padEnd(10) + 'エラー')
  console.log('-'.repeat(70))
  
  let totalMigrated = 0
  let totalErrors = 0
  
  stats.forEach(stat => {
    console.log(
      stat.table.padEnd(20) +
      stat.staging.toString().padEnd(12) +
      stat.production.toString().padEnd(10) +
      stat.migrated.toString().padEnd(10) +
      stat.errors.toString()
    )
    
    totalMigrated += stat.migrated
    totalErrors += stat.errors
  })
  
  console.log('-'.repeat(70))
  console.log(`📈 総移行数: ${totalMigrated}件`)
  console.log(`❌ 総エラー数: ${totalErrors}件`)
  console.log(`📊 成功率: ${totalMigrated > 0 ? Math.round(totalMigrated/(totalMigrated + totalErrors)*100) : 0}%`)
  
  if (totalErrors === 0) {
    console.log('\n🎉 データ移行が完全に成功しました！')
    console.log('🚀 本番サービスの開始準備が完了です。')
  } else {
    console.log(`\n⚠️ ${totalErrors}件のエラーがありました。`)
    console.log('🔍 ログを確認して手動で修正が必要です。')
  }
}

// メイン実行
async function main() {
  console.log('🚀 本番環境データ移行開始')
  console.log('='.repeat(50))
  
  try {
    // 1. バックアップディレクトリ作成
    ensureBackupDir()
    
    // 2. 本番データバックアップ
    await backupProductionData()
    
    // 3. ステージングデータエクスポート
    const exportData = await exportStagingData()
    
    // 4. 本番環境にインポート
    const stats = await importToProduction(exportData)
    
    // 5. データ整合性検証
    await validateDataIntegrity()
    
    // 6. サマリー表示
    displayMigrationSummary(stats)
    
  } catch (error) {
    console.error('❌ 移行プロセスでエラー発生:', error)
    process.exit(1)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}