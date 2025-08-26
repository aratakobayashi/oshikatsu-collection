#!/usr/bin/env npx tsx

/**
 * エピソード紐付きなしロケーション削除スクリプト
 * 安全に不要なロケーションを削除
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

async function cleanupOrphanLocations() {
  console.log('🧹 エピソード紐付きなしロケーション削除')
  console.log('📊 削除対象の詳細確認から開始')
  console.log('=' .repeat(60))
  
  // エピソード情報取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, location_id')
  
  const episodeLocationIds = new Set(
    episodes?.map(ep => ep.location_id).filter(id => id) || []
  )
  
  console.log(`📺 総エピソード数: ${episodes?.length || 0}件`)
  console.log(`📍 ロケーション紐付きエピソード: ${episodeLocationIds.size}件`)
  
  // 全ロケーション取得
  const { data: allLocations } = await supabase
    .from('locations')
    .select('*')
    .order('name')
  
  console.log(`📊 総ロケーション数: ${allLocations?.length || 0}件`)
  
  // エピソード紐付きなしロケーション特定
  const orphanLocations = allLocations?.filter(loc => 
    !episodeLocationIds.has(loc.id) && !loc.episode_id
  ) || []
  
  console.log(`\n⚠️ エピソード紐付きなしロケーション: ${orphanLocations.length}件`)
  
  // カテゴリー別に分類
  const withTabelog = orphanLocations.filter(loc => loc.tabelog_url)
  const withoutTabelog = orphanLocations.filter(loc => !loc.tabelog_url)
  
  console.log(`  💰 Tabelog URLあり: ${withTabelog.length}件`)
  console.log(`  📝 Tabelog URLなし: ${withoutTabelog.length}件`)
  
  // 削除対象詳細表示
  if (withTabelog.length > 0) {
    console.log('\n⚠️ Tabelog URLありの削除対象:')
    withTabelog.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}`)
      console.log(`     ID: ${loc.id}`)
      console.log(`     URL: ${loc.tabelog_url}`)
      console.log(`     住所: ${loc.address || '未設定'}`)
    })
  }
  
  console.log('\n📝 Tabelog URLなしの削除対象（一部表示）:')
  withoutTabelog.slice(0, 10).forEach((loc, idx) => {
    console.log(`  ${idx + 1}. ${loc.name}`)
    console.log(`     ID: ${loc.id}`)
    console.log(`     住所: ${loc.address || '未設定'}`)
  })
  
  if (withoutTabelog.length > 10) {
    console.log(`  ... 他 ${withoutTabelog.length - 10}件`)
  }
  
  // ユーザー確認（実際の削除実行）
  console.log('\n' + '=' .repeat(60))
  console.log('🗑️ 削除実行開始')
  console.log('=' .repeat(60))
  
  let deletedCount = 0
  let errorCount = 0
  
  // バッチ削除（100件ずつ）
  const batchSize = 100
  const totalBatches = Math.ceil(orphanLocations.length / batchSize)
  
  for (let i = 0; i < totalBatches; i++) {
    const batch = orphanLocations.slice(i * batchSize, (i + 1) * batchSize)
    const batchIds = batch.map(loc => loc.id)
    
    console.log(`\n🔄 バッチ ${i + 1}/${totalBatches} 処理中 (${batch.length}件)`)
    
    const { error } = await supabase
      .from('locations')
      .delete()
      .in('id', batchIds)
    
    if (error) {
      console.error(`❌ バッチ削除エラー:`, error.message)
      errorCount += batch.length
    } else {
      console.log(`✅ ${batch.length}件削除成功`)
      deletedCount += batch.length
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 削除後の確認
  const { data: remainingLocations } = await supabase
    .from('locations')
    .select('id')
  
  const { data: remainingWithTabelog } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .not('tabelog_url', 'is', null)
  
  // 最終レポート
  console.log('\n' + '=' .repeat(60))
  console.log('🎊 クリーンアップ完了レポート')
  console.log('=' .repeat(60))
  
  console.log(`\n📊 削除結果:`)
  console.log(`  ✅ 削除成功: ${deletedCount}件`)
  console.log(`  ❌ エラー: ${errorCount}件`)
  
  console.log(`\n📊 削除後の状態:`)
  console.log(`  📍 残存ロケーション: ${remainingLocations?.length || 0}件`)
  console.log(`  💰 Tabelog URL設定済み: ${remainingWithTabelog?.length || 0}件`)
  console.log(`  📺 エピソード紐付きあり: ${episodeLocationIds.size}件`)
  
  const cleanupRate = Math.round((deletedCount / (allLocations?.length || 1)) * 100)
  console.log(`\n🧹 クリーンアップ率: ${cleanupRate}%`)
  
  if (remainingWithTabelog && remainingWithTabelog.length > 0) {
    console.log('\n💰 残存アフィリエイト店舗:')
    remainingWithTabelog.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}`)
    })
  }
  
  console.log('\n✨ データベースがクリーンになりました！')
  
  return {
    deleted_count: deletedCount,
    error_count: errorCount,
    remaining_total: remainingLocations?.length || 0,
    remaining_affiliates: remainingWithTabelog?.length || 0
  }
}

cleanupOrphanLocations()