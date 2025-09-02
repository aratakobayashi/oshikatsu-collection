#!/usr/bin/env node

/**
 * 安全なロケーションデータクリーニング（バックアップ付き）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 削除対象の特定（前回スクリプトと同じロジック）
const getDeletionTargets = (locations: any[]) => {
  const definiteDeleteKeywords = [
    /^\d{2}:\d{2}/, // "04:42 JENNIFER LOPEZ" 形式
    /covered by|カバー/i,
    /おたより|募集|フォーム/,
    /world$|johnny's/i,
    /香水|perfume|fragrance/i,
    /駅$|ホーム$/,
    /公園$|海岸$|海水浴場$/,
    /神社$|寺$|教会$/,
    /学校$|病院$|役所$/
  ]

  return locations.filter(loc => {
    const episodeCount = loc.episode_locations?.length || 0
    
    // 明らかに削除対象
    if (definiteDeleteKeywords.some(pattern => 
      pattern.test(loc.name || '') || 
      pattern.test(loc.description || '')
    )) {
      return true
    }
    
    // エピソードがなく、疑わしい名前
    if (episodeCount === 0 && (
      !loc.name || loc.name.length < 3 || 
      loc.name.match(/^(場所|スポット|ロケ地|不明|未設定|テスト)/i)
    )) {
      return true
    }
    
    return false
  })
}

async function safeLocationCleanup() {
  console.log('🛡️ 安全なロケーションデータクリーニング')
  console.log('='.repeat(60))

  try {
    // 1. 削除対象データを特定
    console.log('📋 削除対象データを特定中...')
    
    const { data: allLocations, error } = await supabase
      .from('locations')
      .select(`
        id, name, address, description, tags,
        episode_locations(
          id, episode_id,
          episodes(id, title, celebrities(name))
        )
      `)

    if (error) {
      throw new Error(`データ取得エラー: ${error.message}`)
    }

    const deleteTargets = getDeletionTargets(allLocations)
    console.log(`✅ 削除対象: ${deleteTargets.length}件特定`)

    // 2. バックアップファイル作成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `backup-deleted-locations-${timestamp}.json`
    
    console.log('\n💾 バックアップファイル作成中...')
    const backupData = {
      timestamp: new Date().toISOString(),
      total_deleted: deleteTargets.length,
      locations: deleteTargets
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    console.log(`✅ バックアップ作成: ${backupFile}`)

    // 3. 削除対象の詳細表示
    console.log('\n🗑️ 削除予定のデータ（サンプル）:')
    console.log('='.repeat(50))
    deleteTargets.slice(0, 10).forEach((item, i) => {
      console.log(`${i+1}. ${item.name}`)
      console.log(`   住所: ${item.address || 'なし'}`)
      console.log(`   エピソード: ${item.episode_locations?.length || 0}件`)
      console.log('')
    })

    if (deleteTargets.length > 10) {
      console.log(`   ... 他${deleteTargets.length - 10}件`)
    }

    // 4. 実際の削除実行
    console.log('\n🚀 削除実行中...')
    
    const deleteIds = deleteTargets.map(t => t.id)
    let deletedEpisodeLinks = 0
    let deletedLocations = 0

    // Step 1: episode_locationsを削除
    console.log('Step 1: エピソードリンクを削除中...')
    const { error: episodeLinksError, count: episodeLinkCount } = await supabase
      .from('episode_locations')
      .delete({ count: 'exact' })
      .in('location_id', deleteIds)

    if (episodeLinksError) {
      throw new Error(`エピソードリンク削除エラー: ${episodeLinksError.message}`)
    }
    
    deletedEpisodeLinks = episodeLinkCount || 0
    console.log(`✅ エピソードリンク ${deletedEpisodeLinks}件削除`)

    // Step 2: locationsを削除
    console.log('Step 2: ロケーション本体を削除中...')
    const { error: locationsError, count: locationCount } = await supabase
      .from('locations')
      .delete({ count: 'exact' })
      .in('id', deleteIds)

    if (locationsError) {
      throw new Error(`ロケーション削除エラー: ${locationsError.message}`)
    }
    
    deletedLocations = locationCount || 0
    console.log(`✅ ロケーション ${deletedLocations}件削除`)

    // 5. 結果サマリー
    console.log('\n🎉 クリーニング完了!')
    console.log('='.repeat(40))
    console.log(`削除されたロケーション: ${deletedLocations}件`)
    console.log(`削除されたエピソードリンク: ${deletedEpisodeLinks}件`)
    console.log(`バックアップファイル: ${backupFile}`)
    console.log(`残存ロケーション: ${allLocations.length - deletedLocations}件`)

    // 6. 品質向上効果
    const qualityImprovement = Math.round((deletedLocations / allLocations.length) * 100)
    console.log(`\n💰 データ品質向上: ${qualityImprovement}%`)
    console.log('🎯 次ステップ: 残り639件の手動確認が推奨されます')

    return {
      success: true,
      deleted_locations: deletedLocations,
      deleted_episode_links: deletedEpisodeLinks,
      backup_file: backupFile,
      remaining_locations: allLocations.length - deletedLocations
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// 実行確認
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')

if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除します。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/safe-location-cleanup.ts --confirm')
  process.exit(0)
}

// 実際の実行
safeLocationCleanup()
  .then(result => {
    if (result.success) {
      console.log(`\n✅ 全工程完了!`)
      console.log(`削除: ${result.deleted_locations}件`)
      console.log(`残存: ${result.remaining_locations}件`)
    }
  })
  .catch(error => {
    console.error('❌ クリーニング失敗:', error)
    process.exit(1)
  })
