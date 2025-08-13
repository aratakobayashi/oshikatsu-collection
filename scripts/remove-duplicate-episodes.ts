/**
 * 重複エピソード削除実行
 * - タグなし重複エピソードを削除
 * - 関連データも適切にクリーンアップ
 * - バックアップ機能付き
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 分析結果から得られた削除候補リスト
const duplicateEpisodeIds = [
  'MhywL4XUk80',
  '55d8d7eea02326bde8e1f23d18ff91e1',
  '87jUa1JOxiA',
  '11DMZFsQuaE',
  '572ba61f88db1c6145df84705bc2903f',
  'SdyhEef9a98',
  'ab1638a9b2edc462b6e9ac59e4d084e9',
  'AsbV0ZAiFMQ',
  'T9Uh--HWON4',
  'H6u-az9wkmE',
  '0-BzQux_iIg',
  'R3gwcKe8gb8',
  'c857bf21d2a88a09a33701918550be4d',
  '11kw4E_bXUg',
  'IW6S61tn3T0',
  '5c5e53180cb615b6cdd6deef64a3d13a',
  'dd9f12f8839d693e913bff26d34e2209',
  'e12ef07e85306681b140569ca6d3a152',
  'f6fbdaf782086799e7e17afd6f9d14b7',
  '8eee7517f4e9e53068f03f309d00c101',
  'd8385d5fef6c57beeea77781f9e66a40',
  '1eb89b425f1a53e4fe979793859b5b7f',
  '29b4d5ae2aa006ea10c03b2e20ad2035',
  '8eb0ab6b-d31b-406e-a5cd-a9724bc6cae7',
  'QZOe5tcdTF8',
  'N51b4FhuHDM',
  'gccW1PRPNtY',
  'ujFW8N8c_Iw',
  '0093c609ab543ae3ee1403bfe4015c78',
  'Dl7ktDs6T6E',
  '442113511a09b3e9c29f2008eb84c65f',
  'pSQPVDgvzUc',
  'Bzj12yToBdY',
  'x04QPISeV6g',
  'd66f374feeff9759a4b8f8ecaa145916',
  'tYzc_00fF1w',
  'pB05p0bPSBE',
  '8f9a2bad77c580efcff19196a6b9bb2a',
  'QMzaUa9EtH0',
  '7Tdz6peCdko',
  'shighBuAXf8',
  'dc43ed83951956eae37ea91acc443980',
  '9db2bed14c49c067296803b4fbd775fe'
]

async function backupDuplicateEpisodes() {
  console.log('💾 重複エピソードをバックアップ中...\n')
  
  const backup: any[] = []
  
  for (const episodeId of duplicateEpisodeIds) {
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
    }
  }
  
  // バックアップファイル保存
  const timestamp = new Date().toISOString().split('T')[0]
  const backupPath = `./data-backup/duplicate-episodes-backup-${timestamp}.json`
  
  writeFileSync(backupPath, JSON.stringify(backup, null, 2))
  console.log(`✅ バックアップ完了: ${backupPath}`)
  console.log(`📊 バックアップ対象: ${backup.length}件のエピソード\n`)
  
  return backup.length
}

async function removeDuplicateEpisodes() {
  console.log('🗑️ 重複エピソード削除開始...\n')
  
  let deletedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const [index, episodeId] of duplicateEpisodeIds.entries()) {
    console.log(`\n${index + 1}/${duplicateEpisodeIds.length}. エピソード ${episodeId} の削除中...`)
    
    try {
      // エピソード存在確認
      const { data: episode, error: fetchError } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('id', episodeId)
        .single()
      
      if (fetchError || !episode) {
        console.log(`   ⚠️ エピソードが見つかりません: ${episodeId}`)
        skippedCount++
        continue
      }
      
      console.log(`   📺 "${episode.title}"`)
      
      // 関連データが本当にないかタグ確認（安全チェック）
      const { count: locationCount } = await supabase
        .from('episode_locations')
        .select('*', { count: 'exact', head: true })
        .eq('episode_id', episodeId)
      
      const { count: itemCount } = await supabase
        .from('episode_items')
        .select('*', { count: 'exact', head: true })
        .eq('episode_id', episodeId)
      
      if ((locationCount && locationCount > 0) || (itemCount && itemCount > 0)) {
        console.log(`   ⚠️ SKIP: このエピソードにはタグが付いています (📍${locationCount} 🏷️${itemCount})`)
        skippedCount++
        continue
      }
      
      // episode_locationsから削除
      const { error: locationDeleteError } = await supabase
        .from('episode_locations')
        .delete()
        .eq('episode_id', episodeId)
      
      if (locationDeleteError) {
        console.log(`   ⚠️ episode_locations削除エラー: ${locationDeleteError.message}`)
      }
      
      // episode_itemsから削除
      const { error: itemDeleteError } = await supabase
        .from('episode_items')
        .delete()
        .eq('episode_id', episodeId)
      
      if (itemDeleteError) {
        console.log(`   ⚠️ episode_items削除エラー: ${itemDeleteError.message}`)
      }
      
      // メインエピソードを削除
      const { error: deleteError } = await supabase
        .from('episodes')
        .delete()
        .eq('id', episodeId)
      
      if (deleteError) {
        console.error(`   ❌ エピソード削除エラー: ${deleteError.message}`)
        errorCount++
      } else {
        console.log(`   ✅ 削除完了: ${episodeId}`)
        deletedCount++
      }
      
    } catch (err) {
      console.error(`   ❌ 予期しないエラー (${episodeId}):`, err)
      errorCount++
    }
    
    // レート制限対策
    if (index > 0 && index % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  return { deletedCount, skippedCount, errorCount }
}

async function verifyDuplication() {
  console.log('\n🔍 重複削除後の検証...\n')
  
  // 再度重複チェック
  const { data: episodes } = await supabase
    .from('episodes')
    .select('title, id')
    .order('title')
  
  if (!episodes) {
    console.log('❌ エピソード取得失敗')
    return
  }
  
  const titleCounts = new Map<string, number>()
  
  for (const episode of episodes) {
    const title = episode.title.trim()
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1)
  }
  
  const remainingDuplicates = Array.from(titleCounts.entries())
    .filter(([_, count]) => count > 1)
  
  if (remainingDuplicates.length === 0) {
    console.log('✅ エピソード重複は完全に解消されました')
  } else {
    console.log(`⚠️ まだ重複が残っています: ${remainingDuplicates.length}件`)
    remainingDuplicates.forEach(([title, count]) => {
      console.log(`   - "${title}": ${count}件`)
    })
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
    console.log('🧹 重複エピソード削除処理開始')
    console.log(`🎯 削除対象: ${duplicateEpisodeIds.length}件\n`)
    
    // バックアップ
    const backupCount = await backupDuplicateEpisodes()
    
    // 削除実行
    const result = await removeDuplicateEpisodes()
    
    // 検証
    await verifyDuplication()
    
    // 結果サマリー
    console.log('\n' + '='.repeat(50))
    console.log('📊 重複削除完了レポート')
    console.log('='.repeat(50))
    console.log(`💾 バックアップ: ${backupCount}件`)
    console.log(`✅ 削除成功: ${result.deletedCount}件`)
    console.log(`⚠️ スキップ: ${result.skippedCount}件`)
    console.log(`❌ エラー: ${result.errorCount}件`)
    
    if (result.deletedCount > 35) {
      console.log('\n🎉 重複エピソードの削除が完了しました！')
      console.log('✨ データベースがクリーンになりました')
    }
    
  } catch (error) {
    console.error('❌ 削除処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}