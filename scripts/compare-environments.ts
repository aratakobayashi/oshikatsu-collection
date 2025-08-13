/**
 * 本番とステージング環境のデータ量を比較
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数読み込み
const productionEnv = dotenv.config({ path: '.env.production' })
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingEnv = dotenv.config({ path: '.env.staging' })
const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!

if (!productionUrl || !productionKey || !stagingUrl || !stagingKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const productionSupabase = createClient(productionUrl, productionKey)
const stagingSupabase = createClient(stagingUrl, stagingKey)

interface DataStats {
  table: string
  production: number
  staging: number
  difference: number
}

async function getTableCount(supabase: any, tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.warn(`⚠️ テーブル ${tableName} の取得でエラー:`, error.message)
      return 0
    }
    
    return count || 0
  } catch (error) {
    return 0
  }
}

async function compareEnvironments() {
  console.log('🔍 環境間のデータ量を比較しています...\n')
  
  const tables = [
    'celebrities',
    'episodes', 
    'items',
    'locations',
    'users',
    'user_posts',
    'episode_items',
    'episode_locations'
  ]

  const results: DataStats[] = []

  for (const table of tables) {
    console.log(`📊 ${table}テーブルを比較中...`)
    
    const prodCount = await getTableCount(productionSupabase, table)
    const stagingCount = await getTableCount(stagingSupabase, table)
    
    results.push({
      table,
      production: prodCount,
      staging: stagingCount,
      difference: stagingCount - prodCount
    })
  }

  // 結果を表示
  console.log('\n' + '='.repeat(80))
  console.log('📈 環境比較結果')
  console.log('='.repeat(80))
  console.log('テーブル名'.padEnd(20) + '本番'.padEnd(15) + 'ステージング'.padEnd(15) + '差分')
  console.log('-'.repeat(80))

  let totalProd = 0
  let totalStaging = 0

  results.forEach(stat => {
    const diff = stat.difference > 0 ? `+${stat.difference}` : stat.difference.toString()
    const diffEmoji = stat.difference > 0 ? '📈' : stat.difference < 0 ? '📉' : '➡️'
    
    console.log(
      stat.table.padEnd(20) +
      stat.production.toString().padEnd(15) +
      stat.staging.toString().padEnd(15) +
      `${diffEmoji} ${diff}`
    )
    
    totalProd += stat.production
    totalStaging += stat.staging
  })

  console.log('-'.repeat(80))
  console.log(
    '合計'.padEnd(20) +
    totalProd.toString().padEnd(15) +
    totalStaging.toString().padEnd(15) +
    `${totalStaging > totalProd ? '📈' : totalStaging < totalProd ? '📉' : '➡️'} ${totalStaging - totalProd > 0 ? '+' : ''}${totalStaging - totalProd}`
  )
  console.log('='.repeat(80))

  // 分析結果
  console.log('\n📝 分析結果:')
  
  const stagingEpisodes = results.find(r => r.table === 'episodes')?.staging || 0
  const prodEpisodes = results.find(r => r.table === 'episodes')?.production || 0
  
  if (stagingEpisodes > prodEpisodes) {
    console.log(`✅ ステージングは本番より${stagingEpisodes - prodEpisodes}件多いエピソードがあります`)
  } else if (stagingEpisodes < prodEpisodes) {
    console.log(`⚠️ ステージングは本番より${prodEpisodes - stagingEpisodes}件少ないエピソードです`)
  }
  
  const stagingLocations = results.find(r => r.table === 'locations')?.staging || 0
  const prodLocations = results.find(r => r.table === 'locations')?.production || 0
  
  if (stagingLocations > prodLocations) {
    console.log(`✅ ステージングは本番より${stagingLocations - prodLocations}件多いロケーションがあります`)
  }
  
  const stagingItems = results.find(r => r.table === 'items')?.staging || 0
  const prodItems = results.find(r => r.table === 'items')?.production || 0
  
  if (stagingItems > prodItems) {
    console.log(`✅ ステージングは本番より${stagingItems - prodItems}件多いアイテムがあります`)
  }

  console.log('\n🎯 推奨アクション:')
  if (totalStaging > totalProd) {
    console.log('1. ステージングには追加データがあります')
    console.log('2. データ品質を確認後、本番への移行を検討')
  } else {
    console.log('1. ステージングと本番のデータを同期')
    console.log('2. 新しいデータ収集はステージングで先行実施')
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  compareEnvironments().catch(console.error)
}