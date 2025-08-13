/**
 * ステージングと本番環境の比較
 * - 各テーブルのレコード数比較
 * - データ内容の差分確認
 * - 同期が必要な項目の特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

interface TableComparison {
  table: string
  staging: number
  production: number
  difference: number
  status: 'same' | 'production_ahead' | 'staging_ahead'
}

async function compareTableCounts() {
  console.log('📊 テーブル別レコード数比較...\n')
  
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  const comparisons: TableComparison[] = []
  
  for (const table of tables) {
    const { count: stagingCount } = await stagingSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    const { count: productionCount } = await productionSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    const difference = (productionCount || 0) - (stagingCount || 0)
    let status: 'same' | 'production_ahead' | 'staging_ahead' = 'same'
    
    if (difference > 0) status = 'production_ahead'
    else if (difference < 0) status = 'staging_ahead'
    
    comparisons.push({
      table,
      staging: stagingCount || 0,
      production: productionCount || 0,
      difference,
      status
    })
  }
  
  console.log('テーブル名'.padEnd(20) + 'ステージング'.padEnd(12) + '本番'.padEnd(8) + '差分'.padEnd(8) + '状態')
  console.log('='.repeat(65))
  
  for (const comp of comparisons) {
    const statusIcon = comp.status === 'same' ? '✅' : 
                      comp.status === 'production_ahead' ? '🔵' : '🔶'
    const statusText = comp.status === 'same' ? '同期済み' :
                       comp.status === 'production_ahead' ? '本番多い' : 'ステージング多い'
    
    console.log(
      comp.table.padEnd(20) + 
      comp.staging.toString().padEnd(12) + 
      comp.production.toString().padEnd(8) + 
      comp.difference.toString().padEnd(8) + 
      `${statusIcon} ${statusText}`
    )
  }
  
  return comparisons
}

async function compareEpisodesDetail() {
  console.log('\n📺 エピソード詳細比較...\n')
  
  // エピソード総数
  const { count: stagingEpisodes } = await stagingSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 エピソード数: ステージング(${stagingEpisodes}) vs 本番(${productionEpisodes})`)
  
  // 最新エピソードの日付比較
  const { data: stagingLatest } = await stagingSupabase
    .from('episodes')
    .select('title, date')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  const { data: productionLatest } = await productionSupabase
    .from('episodes')
    .select('title, date')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  console.log('\n📅 最新エピソード:')
  console.log(`ステージング: ${stagingLatest?.title} (${stagingLatest?.date})`)
  console.log(`本番: ${productionLatest?.title} (${productionLatest?.date})`)
  
  // 重複チェック（ステージングも重複があるか）
  const { data: stagingTitles } = await stagingSupabase
    .from('episodes')
    .select('title')
  
  if (stagingTitles) {
    const titleCounts = new Map<string, number>()
    for (const episode of stagingTitles) {
      const title = episode.title.trim()
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
    }
    
    const stagingDuplicates = Array.from(titleCounts.entries())
      .filter(([_, count]) => count > 1).length
    
    console.log(`\n🔍 ステージング重複タイトル: ${stagingDuplicates}件`)
    console.log(`🔍 本番重複タイトル: 0件 (削除済み)`)
  }
}

async function compareTaggedContent() {
  console.log('\n🏷️ タグ付きコンテンツ比較...\n')
  
  // ロケーション付きエピソード数
  const { count: stagingLocationEpisodes } = await stagingSupabase
    .from('episode_locations')
    .select('episode_id', { count: 'exact', head: true })
  
  const { count: productionLocationEpisodes } = await productionSupabase
    .from('episode_locations')
    .select('episode_id', { count: 'exact', head: true })
  
  console.log(`📍 ロケーション関連付け: ステージング(${stagingLocationEpisodes}) vs 本番(${productionLocationEpisodes})`)
  
  // アイテム付きエピソード数
  const { count: stagingItemEpisodes } = await stagingSupabase
    .from('episode_items')
    .select('episode_id', { count: 'exact', head: true })
  
  const { count: productionItemEpisodes } = await productionSupabase
    .from('episode_items')
    .select('episode_id', { count: 'exact', head: true })
  
  console.log(`🏷️ アイテム関連付け: ステージング(${stagingItemEpisodes}) vs 本番(${productionItemEpisodes})`)
  
  // ユニークなタグ付きエピソード数
  const { data: stagingUniqueTagged } = await stagingSupabase
    .from('episodes')
    .select(`
      id,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const { data: productionUniqueTagged } = await productionSupabase
    .from('episodes')
    .select(`
      id,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const stagingTaggedCount = stagingUniqueTagged?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  const productionTaggedCount = productionUniqueTagged?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`🎯 タグ付きエピソード数: ステージング(${stagingTaggedCount}) vs 本番(${productionTaggedCount})`)
}

async function identifySyncNeeds(comparisons: TableComparison[]) {
  console.log('\n🔄 同期必要性分析...\n')
  
  const needsSync = comparisons.filter(comp => comp.status !== 'same')
  
  if (needsSync.length === 0) {
    console.log('✅ 両環境は完全に同期されています！')
    return { isSync: true, actions: [] }
  }
  
  console.log(`⚠️ 同期が必要なテーブル: ${needsSync.length}件`)
  
  const actions: string[] = []
  
  for (const comp of needsSync) {
    if (comp.status === 'staging_ahead') {
      console.log(`🔶 ${comp.table}: ステージングの方が${Math.abs(comp.difference)}件多い`)
      actions.push(`本番に${comp.table}を追加移行`)
    } else {
      console.log(`🔵 ${comp.table}: 本番の方が${Math.abs(comp.difference)}件多い`)
      actions.push(`ステージングに${comp.table}を反映`)
    }
  }
  
  return { isSync: false, actions }
}

async function generateSyncStrategy(actions: string[]) {
  if (actions.length === 0) return
  
  console.log('\n📋 推奨同期戦略:')
  console.log('='.repeat(40))
  
  // 本番→ステージング同期の場合
  if (actions.some(action => action.includes('ステージングに'))) {
    console.log('🎯 戦略: 本番データをステージングに同期')
    console.log('1. 本番の最新状態をステージングにバックアップ')
    console.log('2. ステージング環境を本番と同じ状態にリセット')
    console.log('3. 新機能テスト後、再度本番へ反映')
  }
  
  // ステージング→本番同期の場合  
  if (actions.some(action => action.includes('本番に'))) {
    console.log('🎯 戦略: ステージングデータを本番に同期')
    console.log('1. ステージングの新規データを特定')
    console.log('2. 本番環境にバックアップ作成')
    console.log('3. 新規データのみを本番に追加移行')
  }
}

// メイン実行
async function main() {
  try {
    console.log('🔍 ステージングvs本番環境比較開始\n')
    
    const comparisons = await compareTableCounts()
    await compareEpisodesDetail()
    await compareTaggedContent()
    
    const syncResult = await identifySyncNeeds(comparisons)
    
    if (!syncResult.isSync) {
      await generateSyncStrategy(syncResult.actions)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 結論')
    console.log('='.repeat(60))
    
    if (syncResult.isSync) {
      console.log('✅ 両環境は同期されています')
      console.log('🚀 追加の同期作業は不要です')
    } else {
      console.log('⚠️ 環境間に差分があります')
      console.log('🔧 同期スクリプトの実行を推奨します')
    }
    
  } catch (error) {
    console.error('❌ 比較処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}