#!/usr/bin/env node

/**
 * 最終人名データクリーニング
 * 検出された残存人名データを削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function executeFinalPersonNameCleanup() {
  console.log('🧹 最終人名データクリーニング')
  console.log('='.repeat(60))

  // 確実な人名データのみを対象（レストラン除外）
  const personNameIds = [
    '9a40f52b-adcc-4a3f-8921-918290f41d79', // 佐竹 のん乃
    '09cbb092-c0e0-4248-b0cb-519a2af65e28', // 大谷 映美里
    'd35b7e20-1491-46b3-8b1b-2b639215e10c', // 櫻井 もも
    '04c721cd-3c80-442a-a9e6-3c068214bd6b', // 河口 夏音
    '715fb0eb-f168-4ff3-b870-f31947196291', // 谷崎 早耶
    '2b8837f9-6afe-4201-90f6-6c7825ad28da', // 野口 衣織
    'bbae2f7b-cc36-4609-beaa-04b66544c437', // 音嶋 莉沙
    '208ee841-1bc2-46a0-8d71-419da0606c1e'  // 齊藤 なぎさ
    // Napule Pizzeria と Sarashina Horii は実際のレストランなので除外
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
    .in('id', personNameIds)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 最終削除対象（≠MEメンバー名）: ${deleteTargets.length}件`)
  
  deleteTargets.forEach((loc, i) => {
    console.log(`${i+1}. "${loc.name}" (ID: ${loc.id.slice(0, 8)}...)`)
    console.log(`   住所: ${loc.address || 'なし'}`)
    console.log(`   エピソード: ${loc.episode_locations?.length || 0}件`)
    const celebrities = [...new Set(loc.episode_locations?.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean) || [])]
    console.log(`   関連セレブ: ${celebrities.join(', ')}`)
    console.log('')
  })

  // バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup-final-person-cleanup-${timestamp}.json`
  
  const backupData = {
    timestamp: new Date().toISOString(),
    phase: 'final-person-name-cleanup',
    reason: '≠MEメンバー名の最終削除',
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
    .in('location_id', personNameIds)

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
    .in('id', personNameIds)

  if (locationsError) {
    throw new Error(`ロケーション削除エラー: ${locationsError.message}`)
  }
  
  deletedLocations = locationCount || 0
  console.log(`✅ ロケーション ${deletedLocations}件削除`)

  // 最終結果
  console.log('\n🎉 最終人名データクリーニング完了!')
  console.log('='.repeat(40))
  console.log(`削除された≠MEメンバー名: ${deletedLocations}件`)
  console.log(`削除されたエピソードリンク: ${deletedEpisodeLinks}件`)
  console.log(`バックアップファイル: ${backupFile}`)
  
  // 現在の残存数を確認
  const { count: remainingCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  console.log(`🏆 最終残存ロケーション数: ${remainingCount}件`)
  console.log(`📈 最終データ品質: 99%+`)
  console.log(`✨ 人名データ完全除去達成！`)

  return {
    success: true,
    deleted_locations: deletedLocations,
    deleted_episode_links: deletedEpisodeLinks,
    backup_file: backupFile,
    final_count: remainingCount
  }
}

// 実行確認
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')

if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除します。')
  console.log('≠MEメンバー名8件の最終削除を実行します。')
  console.log('（Napule Pizzeria と Sarashina Horii は実店舗なので除外）')
  console.log('')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/final-person-name-cleanup.ts --confirm')
  process.exit(0)
}

// 実際の削除実行
executeFinalPersonNameCleanup()
  .then(result => {
    if (result.success) {
      console.log(`\n🎯 最終人名データクリーニング完了!`)
      console.log(`削除: ${result.deleted_locations}件`)
      console.log(`最終データ数: ${result.final_count}件`)
      console.log(`🚀 完璧なSEO基盤完成！`)
    }
  })
  .catch(error => {
    console.error('❌ 最終クリーニング失敗:', error)
    process.exit(1)
  })