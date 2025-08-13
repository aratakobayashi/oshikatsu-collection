/**
 * 本番環境からテスト用エピソードを削除
 * 対象: TEST002, TEST001, TEST_PERMISSION
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 削除対象のテストエピソードID
const testEpisodeIds = [
  'TEST002',
  'TEST001', 
  'TEST_PERMISSION'
]

async function findAndDeleteTestEpisodes() {
  console.log('🗑️ テスト用エピソードの削除開始...\n')
  
  let deletedCount = 0
  let notFoundCount = 0
  
  for (const episodeId of testEpisodeIds) {
    console.log(`🔍 エピソード ${episodeId} を検索中...`)
    
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
      
      console.log(`   ✅ 発見: "${episode.title}"`)
      
      // 関連データ（episode_locations, episode_items）も削除
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
      } else {
        console.log(`   ✅ エピソード削除完了: ${episodeId}`)
        deletedCount++
      }
      
    } catch (err) {
      console.error(`   ❌ 予期しないエラー (${episodeId}):`, err)
    }
    
    console.log('') // 空行
  }
  
  // 結果サマリー
  console.log('='.repeat(50))
  console.log('📊 テストエピソード削除結果')
  console.log('='.repeat(50))
  console.log(`✅ 削除成功: ${deletedCount}件`)
  console.log(`⚠️ 見つからない: ${notFoundCount}件`)
  console.log(`📋 処理対象: ${testEpisodeIds.length}件`)
  
  return { deletedCount, notFoundCount }
}

async function verifyDeletion() {
  console.log('\n🔍 削除確認...\n')
  
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
}

async function checkRemainingTestData() {
  console.log('\n🔍 残りのテストデータをチェック...\n')
  
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
  
  // 総エピソード数確認
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  console.log(`\n📊 現在の総エピソード数: ${totalEpisodes}件`)
}

// メイン実行
async function main() {
  try {
    console.log('🗑️ 本番環境テストデータクリーンアップ開始')
    console.log('対象エピソード:', testEpisodeIds.join(', '))
    console.log('')
    
    const result = await findAndDeleteTestEpisodes()
    await verifyDeletion()
    await checkRemainingTestData()
    
    if (result.deletedCount > 0) {
      console.log('\n🎉 テストエピソードの削除が完了しました！')
      console.log('✅ 本番環境からテストデータが除去されました')
    } else {
      console.log('\n💡 削除対象のテストエピソードは見つかりませんでした')
    }
    
  } catch (error) {
    console.error('❌ 削除処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}