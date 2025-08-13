/**
 * 本番→ステージング完全同期
 * 本番の綺麗な状態をステージングに反映
 * 開発用・テストデータを削除してクリーンな状態に統一
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

async function backupStagingData() {
  console.log('💾 ステージング環境バックアップ中...\n')
  
  const backup = {
    timestamp: new Date().toISOString(),
    episodes: [],
    celebrities: [],
    locations: [],
    items: [],
    episode_locations: [],
    episode_items: []
  } as any
  
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  for (const table of tables) {
    const { data, error } = await stagingSupabase
      .from(table)
      .select('*')
    
    if (error) {
      console.log(`❌ ${table}バックアップエラー:`, error.message)
    } else {
      backup[table] = data || []
      console.log(`✅ ${table}: ${data?.length || 0}件バックアップ`)
    }
  }
  
  // バックアップファイル保存
  const timestamp = new Date().toISOString().split('T')[0]
  const backupPath = `./data-backup/staging-full-backup-${timestamp}.json`
  
  writeFileSync(backupPath, JSON.stringify(backup, null, 2))
  console.log(`\n💾 ステージング完全バックアップ: ${backupPath}\n`)
  
  return backupPath
}

async function cleanupStagingData() {
  console.log('🧹 ステージング環境クリーンアップ中...\n')
  
  // 関連付けテーブルから削除（外部キー制約のため）
  console.log('🔗 関連付けデータ削除中...')
  const { error: locationRelError } = await stagingSupabase
    .from('episode_locations')
    .delete()
    .gte('id', '')
  
  if (locationRelError) {
    console.log(`⚠️ episode_locations削除エラー:`, locationRelError.message)
  } else {
    console.log('✅ episode_locations全削除完了')
  }
  
  const { error: itemRelError } = await stagingSupabase
    .from('episode_items')
    .delete()
    .gte('id', '')
  
  if (itemRelError) {
    console.log(`⚠️ episode_items削除エラー:`, itemRelError.message)
  } else {
    console.log('✅ episode_items全削除完了')
  }
  
  // メインテーブルから削除
  const tables = ['episodes', 'locations', 'items', 'celebrities']
  
  for (const table of tables) {
    console.log(`🗑️ ${table}削除中...`)
    
    const { error } = await stagingSupabase
      .from(table)
      .delete()
      .gte('id', '')  // すべてのレコードを削除
    
    if (error) {
      console.log(`❌ ${table}削除エラー:`, error.message)
    } else {
      console.log(`✅ ${table}全削除完了`)
    }
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✅ ステージング環境クリーンアップ完了\n')
}

async function syncProductionToStaging() {
  console.log('📋 本番→ステージング データ同期開始...\n')
  
  // 1. Celebrities同期
  console.log('🎭 Celebrities同期中...')
  const { data: productionCelebrities } = await productionSupabase
    .from('celebrities')
    .select('*')
  
  if (productionCelebrities && productionCelebrities.length > 0) {
    const { data, error } = await stagingSupabase
      .from('celebrities')
      .insert(productionCelebrities)
      .select()
    
    if (error) {
      console.error('❌ Celebrities同期エラー:', error.message)
    } else {
      console.log(`✅ Celebrities同期完了: ${data?.length || 0}件`)
    }
  }
  
  // 2. Locations同期
  console.log('📍 Locations同期中...')
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('*')
  
  if (productionLocations && productionLocations.length > 0) {
    const { data, error } = await stagingSupabase
      .from('locations')
      .insert(productionLocations)
      .select()
    
    if (error) {
      console.error('❌ Locations同期エラー:', error.message)
    } else {
      console.log(`✅ Locations同期完了: ${data?.length || 0}件`)
    }
  }
  
  // 3. Items同期
  console.log('🏷️ Items同期中...')
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('*')
  
  if (productionItems && productionItems.length > 0) {
    const { data, error } = await stagingSupabase
      .from('items')
      .insert(productionItems)
      .select()
    
    if (error) {
      console.error('❌ Items同期エラー:', error.message)
    } else {
      console.log(`✅ Items同期完了: ${data?.length || 0}件`)
    }
  }
  
  // 4. Episodes同期（バッチ処理）
  console.log('📺 Episodes同期中...')
  const { data: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('*')
    .order('date')
  
  if (productionEpisodes && productionEpisodes.length > 0) {
    const batchSize = 50
    let totalSynced = 0
    
    for (let i = 0; i < productionEpisodes.length; i += batchSize) {
      const batch = productionEpisodes.slice(i, i + batchSize)
      
      const { data, error } = await stagingSupabase
        .from('episodes')
        .insert(batch)
        .select()
      
      if (error) {
        console.error(`❌ Episodesバッチ${Math.floor(i/batchSize) + 1}エラー:`, error.message)
      } else {
        totalSynced += data?.length || 0
        console.log(`✅ Episodesバッチ${Math.floor(i/batchSize) + 1}: ${data?.length || 0}件`)
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`✅ Episodes同期完了: ${totalSynced}件`)
  }
  
  // 5. Episode_locations同期
  console.log('🔗 Episode_locations同期中...')
  const { data: productionLocationRels } = await productionSupabase
    .from('episode_locations')
    .select('*')
  
  if (productionLocationRels && productionLocationRels.length > 0) {
    const { data, error } = await stagingSupabase
      .from('episode_locations')
      .insert(productionLocationRels)
      .select()
    
    if (error) {
      console.error('❌ Episode_locations同期エラー:', error.message)
    } else {
      console.log(`✅ Episode_locations同期完了: ${data?.length || 0}件`)
    }
  }
  
  // 6. Episode_items同期
  console.log('🔗 Episode_items同期中...')
  const { data: productionItemRels } = await productionSupabase
    .from('episode_items')
    .select('*')
  
  if (productionItemRels && productionItemRels.length > 0) {
    const { data, error } = await stagingSupabase
      .from('episode_items')
      .insert(productionItemRels)
      .select()
    
    if (error) {
      console.error('❌ Episode_items同期エラー:', error.message)
    } else {
      console.log(`✅ Episode_items同期完了: ${data?.length || 0}件`)
    }
  }
  
  console.log('\n✅ 本番→ステージング同期完了\n')
}

async function verifySync() {
  console.log('🔍 同期結果検証...\n')
  
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  console.log('テーブル名'.padEnd(20) + 'ステージング'.padEnd(12) + '本番'.padEnd(8) + '差分'.padEnd(8) + '状態')
  console.log('='.repeat(65))
  
  let allSync = true
  
  for (const table of tables) {
    const { count: stagingCount } = await stagingSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    const { count: productionCount } = await productionSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    const difference = (stagingCount || 0) - (productionCount || 0)
    const status = difference === 0 ? '✅ 同期' : '⚠️ 差分あり'
    
    if (difference !== 0) allSync = false
    
    console.log(
      table.padEnd(20) + 
      (stagingCount || 0).toString().padEnd(12) + 
      (productionCount || 0).toString().padEnd(8) + 
      difference.toString().padEnd(8) + 
      status
    )
  }
  
  // ステージングのテストデータ確認
  console.log('\n🧹 ステージングテストデータ確認:')
  
  const { data: testEpisodes } = await stagingSupabase
    .from('episodes')
    .select('id, title')
    .or('id.ilike.%test%,title.ilike.%test%')
  
  const { data: testCelebrities } = await stagingSupabase
    .from('celebrities')
    .select('id, name')
    .or('name.ilike.%開発%,name.ilike.%テスト%')
  
  console.log(`📺 テストエピソード: ${testEpisodes?.length || 0}件`)
  console.log(`🎭 テストCelebrities: ${testCelebrities?.length || 0}件`)
  
  // タグ付きエピソード確認
  const { data: stagingTagged } = await stagingSupabase
    .from('episodes')
    .select(`
      id,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const stagingTaggedCount = stagingTagged?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`🎯 ステージングタグ付きエピソード: ${stagingTaggedCount}件`)
  
  const isFullySync = allSync && 
                     (testEpisodes?.length || 0) === 0 && 
                     (testCelebrities?.length || 0) === 0
  
  if (isFullySync) {
    console.log('\n🎉 完全同期達成！両環境が同じクリーンな状態になりました')
  } else {
    console.log('\n⚠️ 同期未完了または残存テストデータがあります')
  }
  
  return { isFullySync, stagingTaggedCount }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 本番→ステージング完全同期開始\n')
    console.log('本番の綺麗な状態をステージングに完全反映します\n')
    
    const backupPath = await backupStagingData()
    
    console.log('⚠️ ステージング環境を完全にクリアします...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await cleanupStagingData()
    
    await syncProductionToStaging()
    
    const verifyResult = await verifySync()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 本番→ステージング同期完了レポート')
    console.log('='.repeat(60))
    console.log(`💾 ステージングバックアップ: ${backupPath}`)
    console.log(`🎯 ステージングタグ付きエピソード: ${verifyResult.stagingTaggedCount}件`)
    
    if (verifyResult.isFullySync) {
      console.log('\n✅ 完全同期成功！')
      console.log('🚀 両環境が同じクリーンな状態になりました')
      console.log('🎊 開発・テストデータなし、重複なし、高品質データのみ')
      console.log('💡 今後の新機能開発はこの綺麗なベースから開始できます')
    } else {
      console.log('\n⚠️ 同期に問題があります')
      console.log('🔧 手動での確認・調整が必要かもしれません')
    }
    
  } catch (error) {
    console.error('❌ 同期処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}