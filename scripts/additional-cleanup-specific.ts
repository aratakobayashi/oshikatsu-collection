#!/usr/bin/env node

/**
 * ユーザー指摘の追加削除対象データクリーニング
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function executeAdditionalCleanup() {
  console.log('🧹 ユーザー指摘の追加データクリーニング')
  console.log('='.repeat(60))

  const targetIds = [
    '94078027-58e0-4eb1-862c-c2ad0c2029f4', // マクドナルド
    'fb0adf88-858e-416c-84f9-08ec14017a1f', // 川中子 奈月心
    'bbe8ec56-0482-4dd7-a119-d411460fe4c4', // 焼き鳥店
    'b91ab2b5-e36b-4f1c-ab06-e983aed22144', // 冨田＆櫻井で釣りが楽しめるお店
    '0ffca7df-2951-4c29-bc65-c891ef267dec', // 取り扱い店
    '702bf87b-1e0b-4e70-9e49-016c35bd313e', // 📖楽天限定版
    'b39b6280-6ffb-47a0-b36a-7f6af2d90a14', // 冨田 菜々風
    'a91ead51-2f91-42dd-8c6f-1917e5530379'  // 📖TSUTAYA限定版
  ]

  // 削除前にデータを確認
  const { data: deleteTargets, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
    .in('id', targetIds)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 追加削除対象: ${deleteTargets.length}件`)
  
  deleteTargets.forEach((loc, i) => {
    console.log(`${i+1}. "${loc.name}" (ID: ${loc.id.slice(0, 8)}...)`)
    console.log(`   住所: ${loc.address || 'なし'}`)
    console.log(`   エピソード: ${loc.episode_locations?.length || 0}件`)
    console.log('')
  })

  // バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup-additional-cleanup-${timestamp}.json`
  
  const backupData = {
    timestamp: new Date().toISOString(),
    phase: 'user-requested-additional-cleanup',
    reason: '人名データ・曖昧データの追加削除',
    deleted_locations: deleteTargets.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      description: loc.description,
      episode_count: loc.episode_locations?.length || 0
    }))
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
  console.log(`💾 バックアップ作成: ${backupFile}`)

  let deletedEpisodeLinks = 0
  let deletedLocations = 0

  // Step 1: エピソードリンクを削除
  console.log('\n🚀 Step 1: エピソードリンクを削除中...')
  const { error: episodeLinksError, count: episodeLinkCount } = await supabase
    .from('episode_locations')
    .delete({ count: 'exact' })
    .in('location_id', targetIds)

  if (episodeLinksError) {
    throw new Error(`エピソードリンク削除エラー: ${episodeLinksError.message}`)
  }
  
  deletedEpisodeLinks = episodeLinkCount || 0
  console.log(`✅ エピソードリンク ${deletedEpisodeLinks}件削除`)

  // Step 2: ロケーション本体を削除
  console.log('\n🚀 Step 2: ロケーション本体を削除中...')
  const { error: locationsError, count: locationCount } = await supabase
    .from('locations')
    .delete({ count: 'exact' })
    .in('id', targetIds)

  if (locationsError) {
    throw new Error(`ロケーション削除エラー: ${locationsError.message}`)
  }
  
  deletedLocations = locationCount || 0
  console.log(`✅ ロケーション ${deletedLocations}件削除`)

  // 最終結果
  console.log('\n🎉 追加クリーニング完了!')
  console.log('='.repeat(40))
  console.log(`削除されたロケーション: ${deletedLocations}件`)
  console.log(`削除されたエピソードリンク: ${deletedEpisodeLinks}件`)
  console.log(`バックアップファイル: ${backupFile}`)
  
  // 現在の残存数を確認
  const { count: remainingCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  console.log(`最新残存ロケーション数: ${remainingCount}件`)
  console.log(`データ品質: さらに向上！`)

  return {
    success: true,
    deleted_locations: deletedLocations,
    deleted_episode_links: deletedEpisodeLinks,
    backup_file: backupFile,
    remaining_count: remainingCount
  }
}

// 実行確認
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')

if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除します。')
  console.log('ユーザー指摘の8件の問題データ（人名・曖昧データ）を削除します。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/additional-cleanup-specific.ts --confirm')
  process.exit(0)
}

// 実際の削除実行
executeAdditionalCleanup()
  .then(result => {
    if (result.success) {
      console.log(`\n✅ 追加クリーニング完了!`)
      console.log(`削除: ${result.deleted_locations}件`)
      console.log(`最新残存: ${result.remaining_count}件`)
    }
  })
  .catch(error => {
    console.error('❌ 追加クリーニング失敗:', error)
    process.exit(1)
  })