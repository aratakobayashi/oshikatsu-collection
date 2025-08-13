/**
 * ステージング環境の穏やかなクリーンアップ
 * スキーマ差異を考慮して安全にテスト・開発用データのみを削除
 * 構造を保持しつつクリーンな状態に近づける
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)

async function cleanupTestEpisodes() {
  console.log('🧹 ステージングテストエピソード削除中...\n')
  
  // TESTエピソード特定
  const { data: testEpisodes } = await stagingSupabase
    .from('episodes')
    .select('id, title')
    .or('id.ilike.%test%,title.ilike.%test%')
  
  console.log(`📺 テストエピソード発見: ${testEpisodes?.length || 0}件`)
  
  if (testEpisodes && testEpisodes.length > 0) {
    testEpisodes.forEach(ep => {
      console.log(`   - ${ep.id}: ${ep.title}`)
    })
    
    // バックアップ
    const timestamp = new Date().toISOString().split('T')[0]
    writeFileSync(`./data-backup/staging-test-episodes-${timestamp}.json`, JSON.stringify(testEpisodes, null, 2))
    
    // 削除実行
    for (const episode of testEpisodes) {
      try {
        // 関連データ削除
        await stagingSupabase
          .from('episode_locations')
          .delete()
          .eq('episode_id', episode.id)
        
        await stagingSupabase
          .from('episode_items')
          .delete()
          .eq('episode_id', episode.id)
        
        // エピソード削除
        const { error } = await stagingSupabase
          .from('episodes')
          .delete()
          .eq('id', episode.id)
        
        if (error) {
          console.log(`❌ ${episode.id}削除エラー:`, error.message)
        } else {
          console.log(`✅ ${episode.id}削除完了`)
        }
      } catch (err) {
        console.log(`❌ ${episode.id}削除例外:`, err)
      }
    }
  } else {
    console.log('✅ テストエピソードは見つかりませんでした')
  }
  
  console.log('')
}

async function cleanupTestCelebrities() {
  console.log('🎭 テストCelebrities削除中...\n')
  
  // テスト・開発用celebrity特定
  const { data: testCelebrities } = await stagingSupabase
    .from('celebrities')
    .select('id, name')
    .or('name.ilike.%開発%,name.ilike.%テスト%')
  
  console.log(`🎭 テストCelebrities発見: ${testCelebrities?.length || 0}件`)
  
  if (testCelebrities && testCelebrities.length > 0) {
    testCelebrities.forEach(cel => {
      console.log(`   - ${cel.id}: ${cel.name}`)
    })
    
    // 関連エピソードを正しいcelebrityに移行してから削除
    const { data: correctCelebrity } = await stagingSupabase
      .from('celebrities')
      .select('id')
      .eq('name', 'よにのちゃんねる')
      .single()
    
    if (correctCelebrity) {
      for (const testCel of testCelebrities) {
        // このcelebrityに関連するエピソードを正しいcelebrityに移行
        const { error: updateError } = await stagingSupabase
          .from('episodes')
          .update({ celebrity_id: correctCelebrity.id })
          .eq('celebrity_id', testCel.id)
        
        if (!updateError) {
          // テストcelebrity削除
          const { error: deleteError } = await stagingSupabase
            .from('celebrities')
            .delete()
            .eq('id', testCel.id)
          
          if (deleteError) {
            console.log(`❌ ${testCel.name}削除エラー:`, deleteError.message)
          } else {
            console.log(`✅ ${testCel.name}削除完了`)
          }
        }
      }
    }
  } else {
    console.log('✅ テストCelebritiesは見つかりませんでした')
  }
  
  console.log('')
}

async function cleanupTestLocations() {
  console.log('📍 テストロケーション削除中...\n')
  
  // テスト・開発用ロケーション特定
  const { data: testLocations } = await stagingSupabase
    .from('locations')
    .select('id, name')
    .or('name.ilike.%テスト%,name.ilike.%開発%')
  
  console.log(`📍 テストロケーション発見: ${testLocations?.length || 0}件`)
  
  if (testLocations && testLocations.length > 0) {
    testLocations.forEach(loc => {
      console.log(`   - ${loc.id}: ${loc.name}`)
    })
    
    for (const testLoc of testLocations) {
      try {
        // 関連付け削除
        await stagingSupabase
          .from('episode_locations')
          .delete()
          .eq('location_id', testLoc.id)
        
        // ロケーション削除
        const { error } = await stagingSupabase
          .from('locations')
          .delete()
          .eq('id', testLoc.id)
        
        if (error) {
          console.log(`❌ ${testLoc.name}削除エラー:`, error.message)
        } else {
          console.log(`✅ ${testLoc.name}削除完了`)
        }
      } catch (err) {
        console.log(`❌ ${testLoc.name}削除例外:`, err)
      }
    }
  } else {
    console.log('✅ テストロケーションは見つかりませんでした')
  }
  
  console.log('')
}

async function cleanupTestItems() {
  console.log('🏷️ テストアイテム削除中...\n')
  
  // テスト・開発用アイテム特定
  const { data: testItems } = await stagingSupabase
    .from('items')
    .select('id, name')
    .or('name.ilike.%テスト%,name.ilike.%開発%')
  
  console.log(`🏷️ テストアイテム発見: ${testItems?.length || 0}件`)
  
  if (testItems && testItems.length > 0) {
    testItems.forEach(item => {
      console.log(`   - ${item.id}: ${item.name}`)
    })
    
    for (const testItem of testItems) {
      try {
        // 関連付け削除
        await stagingSupabase
          .from('episode_items')
          .delete()
          .eq('item_id', testItem.id)
        
        // アイテム削除
        const { error } = await stagingSupabase
          .from('items')
          .delete()
          .eq('id', testItem.id)
        
        if (error) {
          console.log(`❌ ${testItem.name}削除エラー:`, error.message)
        } else {
          console.log(`✅ ${testItem.name}削除完了`)
        }
      } catch (err) {
        console.log(`❌ ${testItem.name}削除例外:`, err)
      }
    }
  } else {
    console.log('✅ テストアイテムは見つかりませんでした')
  }
  
  console.log('')
}

async function removeDuplicateEpisodes() {
  console.log('🔄 ステージング重複エピソード削除中...\n')
  
  // 重複分析（本番と同様のロジック）
  const { data: episodes } = await stagingSupabase
    .from('episodes')
    .select(`
      id,
      title,
      video_url,
      date,
      episode_locations!left(id),
      episode_items!left(id)
    `)
    .order('title')
  
  if (!episodes) {
    console.log('❌ エピソード取得失敗')
    return
  }
  
  // タイトルごとにグループ化
  const titleGroups = new Map<string, any[]>()
  
  for (const episode of episodes) {
    const normalizedTitle = episode.title.trim()
    const episodeData = {
      id: episode.id,
      title: episode.title,
      video_url: episode.video_url,
      date: episode.date,
      location_count: episode.episode_locations?.length || 0,
      item_count: episode.episode_items?.length || 0
    }
    
    if (!titleGroups.has(normalizedTitle)) {
      titleGroups.set(normalizedTitle, [])
    }
    titleGroups.get(normalizedTitle)!.push(episodeData)
  }
  
  // 重複グループから削除候補を特定
  const deletionCandidates: string[] = []
  
  for (const [title, episodeList] of titleGroups.entries()) {
    if (episodeList.length > 1) {
      // タグ数でソート（多い順）、同じ場合は日付が新しい順
      const sortedEpisodes = episodeList.sort((a: any, b: any) => {
        const aTagCount = (a.location_count || 0) + (a.item_count || 0)
        const bTagCount = (b.location_count || 0) + (b.item_count || 0)
        
        if (aTagCount !== bTagCount) {
          return bTagCount - aTagCount
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      
      // 最初の1件以外を削除候補に追加
      for (let i = 1; i < sortedEpisodes.length; i++) {
        deletionCandidates.push(sortedEpisodes[i].id)
      }
    }
  }
  
  console.log(`🗑️ ステージング重複削除候補: ${deletionCandidates.length}件`)
  
  if (deletionCandidates.length > 0) {
    // バックアップ
    const timestamp = new Date().toISOString().split('T')[0]
    writeFileSync(`./data-backup/staging-duplicates-${timestamp}.json`, JSON.stringify(deletionCandidates, null, 2))
    
    // 削除実行
    let deletedCount = 0
    for (const episodeId of deletionCandidates) {
      try {
        // 関連データ削除
        await stagingSupabase.from('episode_locations').delete().eq('episode_id', episodeId)
        await stagingSupabase.from('episode_items').delete().eq('episode_id', episodeId)
        
        // エピソード削除
        const { error } = await stagingSupabase
          .from('episodes')
          .delete()
          .eq('id', episodeId)
        
        if (!error) {
          deletedCount++
        }
      } catch (err) {
        // 無視
      }
    }
    
    console.log(`✅ ステージング重複削除完了: ${deletedCount}件`)
  }
  
  console.log('')
}

async function verifyCleanState() {
  console.log('🔍 クリーンアップ結果確認...\n')
  
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  for (const table of tables) {
    const { count } = await stagingSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    console.log(`📋 ${table}: ${count}件`)
  }
  
  // テストデータ最終確認
  const { data: remainingTestEpisodes } = await stagingSupabase
    .from('episodes')
    .select('id, title')
    .or('id.ilike.%test%,title.ilike.%test%')
  
  const { data: remainingTestCelebrities } = await stagingSupabase
    .from('celebrities')
    .select('id, name')
    .or('name.ilike.%開発%,name.ilike.%テスト%')
  
  console.log(`\n🧹 残存テストデータ:`)
  console.log(`📺 テストエピソード: ${remainingTestEpisodes?.length || 0}件`)
  console.log(`🎭 テストCelebrities: ${remainingTestCelebrities?.length || 0}件`)
  
  // 重複確認
  const { data: allEpisodes } = await stagingSupabase
    .from('episodes')
    .select('title')
  
  if (allEpisodes) {
    const titleCounts = new Map<string, number>()
    for (const ep of allEpisodes) {
      const title = ep.title.trim()
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
    }
    
    const duplicateCount = Array.from(titleCounts.values()).filter(count => count > 1).length
    console.log(`🔄 重複タイトル: ${duplicateCount}件`)
  }
  
  // タグ付きエピソード確認
  const { data: taggedEpisodes } = await stagingSupabase
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
  
  return {
    testEpisodes: remainingTestEpisodes?.length || 0,
    testCelebrities: remainingTestCelebrities?.length || 0,
    taggedEpisodes: taggedCount,
    duplicates: duplicateCount || 0
  }
}

// メイン実行
async function main() {
  try {
    console.log('🧹 ステージング環境穏やかクリーンアップ開始\n')
    console.log('スキーマを保持しつつテスト・開発用データを削除します\n')
    
    await cleanupTestEpisodes()
    await cleanupTestCelebrities()
    await cleanupTestLocations()
    await cleanupTestItems()
    await removeDuplicateEpisodes()
    
    const result = await verifyCleanState()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 ステージングクリーンアップ完了レポート')
    console.log('='.repeat(60))
    console.log(`🧹 残存テストエピソード: ${result.testEpisodes}件`)
    console.log(`🧹 残存テストCelebrities: ${result.testCelebrities}件`)
    console.log(`🔄 重複タイトル: ${result.duplicates}件`)
    console.log(`🎯 タグ付きエピソード: ${result.taggedEpisodes}件`)
    
    const isClean = result.testEpisodes === 0 && 
                    result.testCelebrities === 0 && 
                    result.duplicates === 0
    
    if (isClean) {
      console.log('\n✅ ステージング環境がクリーンになりました！')
      console.log('🚀 テストデータなし、重複なしの良い状態です')
      console.log('💡 本番ほど完璧ではありませんが、開発に適した状態です')
    } else {
      console.log('\n⚠️ 一部データが残存していますが、大幅に改善されました')
      console.log('🔧 必要に応じて手動調整を行ってください')
    }
    
  } catch (error) {
    console.error('❌ クリーンアップでエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}