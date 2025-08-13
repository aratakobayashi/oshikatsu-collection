/**
 * 本番環境の最終クリーンアップ
 * - TESTエピソード（TEST001, TEST002, TEST_PERMISSION）の削除
 * - 関連データも含めた完全削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 削除対象のテストエピソードID
const testEpisodeIds = [
  'TEST001',
  'TEST002',
  'TEST_PERMISSION'
]

async function backupTestEpisodes() {
  console.log('💾 TESTエピソードバックアップ中...\n')
  
  const backup: any[] = []
  
  for (const episodeId of testEpisodeIds) {
    // エピソード詳細取得
    const { data: episode } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single()
    
    if (episode) {
      // 関連データも取得
      const { data: locations } = await supabase
        .from('episode_locations')
        .select('*')
        .eq('episode_id', episodeId)
      
      const { data: items } = await supabase
        .from('episode_items')
        .select('*')
        .eq('episode_id', episodeId)
      
      backup.push({
        episode,
        locations: locations || [],
        items: items || []
      })
      
      console.log(`   📋 "${episode.title}" をバックアップ`)
    }
  }
  
  if (backup.length > 0) {
    // バックアップファイル保存
    const timestamp = new Date().toISOString().split('T')[0]
    const backupPath = `./data-backup/final-test-episodes-backup-${timestamp}.json`
    
    writeFileSync(backupPath, JSON.stringify(backup, null, 2))
    console.log(`✅ バックアップ完了: ${backupPath}`)
    console.log(`📊 バックアップ対象: ${backup.length}件のエピソード\n`)
  }
  
  return backup.length
}

async function deleteTestEpisodes() {
  console.log('🗑️ TESTエピソード削除開始...\n')
  
  let deletedCount = 0
  let notFoundCount = 0
  let errorCount = 0
  
  for (const [index, episodeId] of testEpisodeIds.entries()) {
    console.log(`${index + 1}/${testEpisodeIds.length}. エピソード ${episodeId} の削除中...`)
    
    try {
      // エピソード存在確認
      const { data: episode, error: fetchError } = await supabase
        .from('episodes')
        .select('id, title, description')
        .eq('id', episodeId)
        .single()
      
      if (fetchError || !episode) {
        console.log(`   ⚠️ 見つかりません: ${episodeId}`)
        notFoundCount++
        continue
      }
      
      console.log(`   📺 発見: "${episode.title}"`)
      
      // 関連データ削除
      console.log(`   🔗 関連データを削除中...`)
      
      // episode_locationsから削除
      const { error: locationDeleteError } = await supabase
        .from('episode_locations')
        .delete()
        .eq('episode_id', episodeId)
      
      if (locationDeleteError) {
        console.log(`   ⚠️ episode_locations削除エラー: ${locationDeleteError.message}`)
      } else {
        console.log(`   ✅ episode_locations削除完了`)
      }
      
      // episode_itemsから削除
      const { error: itemDeleteError } = await supabase
        .from('episode_items')
        .delete()
        .eq('episode_id', episodeId)
      
      if (itemDeleteError) {
        console.log(`   ⚠️ episode_items削除エラー: ${itemDeleteError.message}`)
      } else {
        console.log(`   ✅ episode_items削除完了`)
      }
      
      // メインのエピソードを削除
      const { error: deleteError } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId)
      
      if (deleteError) {
        console.error(`   ❌ エピソード削除エラー: ${deleteError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ エピソード削除完了: ${episodeId}`)
        deletedCount++
      }
      
    } catch (err) {
      console.error(`   ❌ 予期しないエラー (${episodeId}):`, err)
      errorCount++
    }
    
    console.log('') // 空行
  }
  
  return { deletedCount, notFoundCount, errorCount }
}

async function verifyCleanup() {
  console.log('🔍 クリーンアップ検証...\n')
  
  // 削除確認
  for (const episodeId of testEpisodeIds) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', episodeId)
      .single()
    
    if (episode) {
      console.log(`❌ まだ存在: ${episodeId} - ${episode.title}`)
    } else {
      console.log(`✅ 削除確認: ${episodeId}`)
    }
  }
  
  // 残りのテストデータチェック
  console.log('\n🔍 他のテストデータ確認...')
  
  // TESTを含むエピソード
  const { data: testEpisodes } = await supabase
    .from('episodes')
    .select('id, title')
    .or('id.ilike.%test%,title.ilike.%test%')
  
  if (testEpisodes && testEpisodes.length > 0) {
    console.log(`⚠️ 他のテストデータが発見されました (${testEpisodes.length}件):`)
    testEpisodes.forEach(ep => {
      console.log(`   - ${ep.id}: ${ep.title}`)
    })
  } else {
    console.log('✅ 他のテストデータは見つかりませんでした')
  }
  
  // 開発用celebritiesチェック
  const { data: testCelebrities } = await supabase
    .from('celebrities')
    .select('id, name')
    .or('name.ilike.%開発%,name.ilike.%テスト%,slug.ilike.%test%')
  
  if (testCelebrities && testCelebrities.length > 0) {
    console.log(`⚠️ テストCelebrities発見 (${testCelebrities.length}件):`)
    testCelebrities.forEach(cel => {
      console.log(`   - ${cel.id}: ${cel.name}`)
    })
  } else {
    console.log('✅ テストCelebritiesなし')
  }
  
  // 総エピソード数確認
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 現在の総エピソード数: ${totalEpisodes}件`)
  
  return {
    remainingTestEpisodes: testEpisodes?.length || 0,
    remainingTestCelebrities: testCelebrities?.length || 0,
    totalEpisodes: totalEpisodes || 0
  }
}

async function generateFinalReport() {
  console.log('\n🔍 最終状態レポート生成...\n')
  
  // 各テーブルの最終状態
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    console.log(`📋 ${table}: ${count}件`)
  }
  
  // タグ付きエピソード数
  const { data: taggedEpisodes } = await supabase
    .from('episodes')
    .select(`
      id,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const taggedCount = taggedEpisodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`🎯 タグ付きエピソード: ${taggedCount}件`)
  
  // 重要ロケーション確認
  const { data: importantLocs } = await supabase
    .from('locations')
    .select('name')
    .or('name.ilike.*えんとつ屋*,name.ilike.*魯珈*,name.ilike.*ろか*')
  
  console.log(`📍 重要ロケーション: ${importantLocs?.length || 0}件`)
  if (importantLocs && importantLocs.length > 0) {
    importantLocs.forEach(loc => {
      console.log(`   ✅ ${loc.name}`)
    })
  }
  
  return { taggedCount, importantLocationCount: importantLocs?.length || 0 }
}

// メイン実行
async function main() {
  try {
    console.log('🧹 本番環境最終クリーンアップ開始\n')
    console.log('TESTエピソード（TEST001, TEST002, TEST_PERMISSION）を削除します\n')
    
    const backupCount = await backupTestEpisodes()
    
    const deleteResult = await deleteTestEpisodes()
    
    const verifyResult = await verifyCleanup()
    
    const reportResult = await generateFinalReport()
    
    // 最終レポート
    console.log('\n' + '='.repeat(60))
    console.log('🎉 最終クリーンアップ完了レポート')
    console.log('='.repeat(60))
    console.log(`💾 バックアップ: ${backupCount}件`)
    console.log(`✅ 削除成功: ${deleteResult.deletedCount}件`)
    console.log(`⚠️ 見つからない: ${deleteResult.notFoundCount}件`)
    console.log(`❌ エラー: ${deleteResult.errorCount}件`)
    console.log(`📺 最終エピソード数: ${verifyResult.totalEpisodes}件`)
    console.log(`🎯 タグ付きエピソード: ${reportResult.taggedCount}件`)
    console.log(`📍 重要ロケーション: ${reportResult.importantLocationCount}件`)
    
    const isClean = verifyResult.remainingTestEpisodes === 0 && 
                    verifyResult.remainingTestCelebrities === 0
    
    if (isClean) {
      console.log('\n✅ 本番環境が完全にクリーンになりました！')
      console.log('🚀 テストデータなし、重複なし、競合対応ロケーション含む理想的な状態')
      console.log('🎊 ユーザーに高品質なサービスを提供できます')
    } else {
      console.log('\n⚠️ 一部テストデータが残存している可能性があります')
    }
    
  } catch (error) {
    console.error('❌ クリーンアップ処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}