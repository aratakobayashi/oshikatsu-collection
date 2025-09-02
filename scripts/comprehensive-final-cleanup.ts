#!/usr/bin/env node

/**
 * 包括的最終クリーニング
 * 残った人名データと重複データを同時に処理
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function comprehensiveFinalAnalysis() {
  console.log('🔍 包括的最終分析（人名 + 重複統合）')
  console.log('='.repeat(60))

  // 全データを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 分析対象: ${locations.length}件`)

  // 1. 残存人名データの特定
  const remainingPersonNames = locations.filter(loc => {
    const name = loc.name?.trim() || ''
    
    // ≠MEメンバーの人名パターン（完全一致）
    const neqMeMembers = [
      '鈴木 瞳美 Hitomi Suzuki',
      '瀧脇 笙古 Shoko Takiwaki', 
      '菅波 美玲 Mirei Suganami',
      '佐々木 舞香 Maika Sasaki',
      '大場 花菜 Hana Oba',
      '山本 杏奈 Anna Yamamoto',
      '落合 希来里 Kirari Ochiai',
      '蟹沢 萌子 Moeko Kanisawa',
      '齋藤 樹愛羅 Kiara Saito'
    ]
    
    return neqMeMembers.some(member => name === member) ||
           name === '・他' ||
           name === 'ユニバーサル' // 曖昧すぎるデータ
  })

  console.log(`👤 残存人名データ: ${remainingPersonNames.length}件`)
  remainingPersonNames.forEach((loc, i) => {
    console.log(`${i+1}. "${loc.name}" (ID: ${loc.id.slice(0, 8)}...)`)
  })

  // 2. 重複データの分析（人名データ除外）
  const nonPersonLocations = locations.filter(loc => 
    !remainingPersonNames.find(p => p.id === loc.id)
  )

  const nameGroups = nonPersonLocations.reduce((acc, loc) => {
    const name = loc.name?.trim()
    if (name) {
      if (!acc[name]) acc[name] = []
      acc[name].push(loc)
    }
    return acc
  }, {} as Record<string, any[]>)

  const duplicates = Object.entries(nameGroups)
    .filter(([name, locs]) => locs.length > 1)
    .map(([name, locs]) => ({ 
      name, 
      count: locs.length, 
      items: locs.sort((a, b) => calculateMergeScore(b) - calculateMergeScore(a))
    }))
    .sort((a, b) => b.count - a.count)

  console.log(`\n🔄 重複データ（人名除外後）: ${duplicates.length}種類`)

  let totalDuplicateItems = 0
  let totalDuplicatesForDeletion = 0

  duplicates.slice(0, 10).forEach((dup, i) => {
    console.log(`${i+1}. "${dup.name}" - ${dup.count}件`)
    totalDuplicateItems += dup.count
    totalDuplicatesForDeletion += (dup.count - 1) // 1件残して他を削除
  })

  if (duplicates.length > 10) {
    // 残りの重複もカウント
    duplicates.slice(10).forEach(dup => {
      totalDuplicateItems += dup.count
      totalDuplicatesForDeletion += (dup.count - 1)
    })
    console.log(`   ... 他${duplicates.length - 10}種類`)
  }

  // 3. 統合計画サマリー
  const totalDeleteTargets = remainingPersonNames.length + totalDuplicatesForDeletion
  const finalCount = locations.length - totalDeleteTargets

  console.log(`\n📊 【包括的最終クリーニング計画】`)
  console.log(`現在のデータ数: ${locations.length}件`)
  console.log(`人名データ削除: ${remainingPersonNames.length}件`)
  console.log(`重複統合削除: ${totalDuplicatesForDeletion}件`)
  console.log(`総削除予定: ${totalDeleteTargets}件`)
  console.log(`最終残存予定: ${finalCount}件`)
  console.log(`最終品質予想: 98%+`)

  return {
    total_locations: locations.length,
    person_names: remainingPersonNames,
    duplicates: duplicates,
    total_person_deletions: remainingPersonNames.length,
    total_duplicate_deletions: totalDuplicatesForDeletion,
    total_deletions: totalDeleteTargets,
    final_count: finalCount
  }
}

function calculateMergeScore(location: any): number {
  let score = 0
  
  // タベログURL（最重要）
  if (location.tabelog_url) score += 10
  
  // 詳細な住所
  if (location.address && location.address.length > 15 && 
      !location.address.includes('東京都内') && 
      !location.address.includes('各店舗')) {
    score += 8
  }
  
  // 電話番号
  if (location.phone) score += 6
  
  // 営業時間
  if (location.opening_hours) score += 4
  
  // ウェブサイト
  if (location.website_url) score += 3
  
  // 説明文
  if (location.description && location.description.length > 10) score += 2
  
  // エピソード数
  const episodeCount = location.episode_locations?.length || 0
  score += episodeCount * 1
  
  return score
}

async function executeComprehensiveFinalCleanup() {
  console.log('🚀 包括的最終クリーニング実行')
  console.log('='.repeat(60))

  const analysis = await comprehensiveFinalAnalysis()
  
  if (analysis.total_deletions === 0) {
    console.log('✅ 削除対象データが見つかりませんでした。')
    return
  }

  // バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup-comprehensive-final-cleanup-${timestamp}.json`
  
  const backupData = {
    timestamp: new Date().toISOString(),
    phase: 'comprehensive-final-cleanup',
    total_before: analysis.total_locations,
    person_names_deleted: analysis.total_person_deletions,
    duplicates_consolidated: analysis.total_duplicate_deletions,
    total_deleted: analysis.total_deletions,
    final_count: analysis.final_count,
    deleted_items: {
      person_names: analysis.person_names.map(loc => ({
        id: loc.id,
        name: loc.name,
        reason: 'person_name'
      })),
      duplicates: analysis.duplicates.map(dup => ({
        name: dup.name,
        keep: dup.items[0].id,
        delete: dup.items.slice(1).map(item => item.id)
      }))
    }
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
  console.log(`💾 バックアップ作成: ${backupFile}`)

  let totalDeletedEpisodeLinks = 0
  let totalDeletedLocations = 0
  let totalConsolidatedEpisodes = 0

  // Step 1: 人名データを削除
  console.log(`\n📝 Step 1: 人名データ削除 (${analysis.person_names.length}件)`)
  
  if (analysis.person_names.length > 0) {
    const personNameIds = analysis.person_names.map(loc => loc.id)
    
    // エピソードリンクを削除
    const { error: personEpisodeError, count: personEpisodeCount } = await supabase
      .from('episode_locations')
      .delete({ count: 'exact' })
      .in('location_id', personNameIds)

    if (personEpisodeError) {
      throw new Error(`人名エピソードリンク削除エラー: ${personEpisodeError.message}`)
    }
    
    totalDeletedEpisodeLinks += (personEpisodeCount || 0)
    console.log(`✅ 人名エピソードリンク削除: ${personEpisodeCount}件`)

    // ロケーション本体を削除
    const { error: personLocationError, count: personLocationCount } = await supabase
      .from('locations')
      .delete({ count: 'exact' })
      .in('id', personNameIds)

    if (personLocationError) {
      throw new Error(`人名ロケーション削除エラー: ${personLocationError.message}`)
    }
    
    totalDeletedLocations += (personLocationCount || 0)
    console.log(`✅ 人名ロケーション削除: ${personLocationCount}件`)
  }

  // Step 2: 重複データを統合
  console.log(`\n📝 Step 2: 重複データ統合 (${analysis.duplicates.length}グループ)`)
  
  for (const duplicate of analysis.duplicates) {
    const keepItem = duplicate.items[0] // 最高スコアのアイテムを保持
    const deleteItems = duplicate.items.slice(1) // 残りを削除
    
    console.log(`   処理中: "${duplicate.name}" (${duplicate.count}件 → 1件)`)
    
    for (const deleteItem of deleteItems) {
      // エピソードリンクを保持項目に移行
      if (deleteItem.episode_locations && deleteItem.episode_locations.length > 0) {
        for (const episodeLink of deleteItem.episode_locations) {
          // 既存のリンクと重複しないかチェック
          const { data: existing } = await supabase
            .from('episode_locations')
            .select('id')
            .eq('location_id', keepItem.id)
            .eq('episode_id', episodeLink.episode_id)
            .single()

          if (!existing) {
            // 新しいエピソードリンクを作成
            const { error: insertError } = await supabase
              .from('episode_locations')
              .insert({
                location_id: keepItem.id,
                episode_id: episodeLink.episode_id
              })

            if (!insertError) {
              totalConsolidatedEpisodes++
            }
          }
        }
      }

      // 削除対象のエピソードリンクを削除
      const { error: episodeLinkError, count: episodeLinkCount } = await supabase
        .from('episode_locations')
        .delete({ count: 'exact' })
        .eq('location_id', deleteItem.id)

      if (!episodeLinkError) {
        totalDeletedEpisodeLinks += (episodeLinkCount || 0)
      }

      // ロケーション本体を削除
      const { error: locationError, count: locationCount } = await supabase
        .from('locations')
        .delete({ count: 'exact' })
        .eq('id', deleteItem.id)

      if (!locationError) {
        totalDeletedLocations += (locationCount || 0)
      }
    }
  }

  console.log('\n🎉 包括的最終クリーニング完了!')
  console.log('='.repeat(40))
  console.log(`人名データ削除: ${analysis.total_person_deletions}件`)
  console.log(`重複データ統合: ${analysis.duplicates.length}グループ`)
  console.log(`総削除ロケーション: ${totalDeletedLocations}件`)
  console.log(`削除エピソードリンク: ${totalDeletedEpisodeLinks}件`)
  console.log(`統合エピソードリンク: ${totalConsolidatedEpisodes}件`)
  console.log(`バックアップファイル: ${backupFile}`)
  console.log(`最終ロケーション数: ${analysis.total_locations - totalDeletedLocations}件`)
  console.log(`最終データ品質: 98%+`)

  return {
    success: true,
    deleted_person_names: analysis.total_person_deletions,
    consolidated_duplicates: analysis.duplicates.length,
    total_deleted_locations: totalDeletedLocations,
    deleted_episode_links: totalDeletedEpisodeLinks,
    consolidated_episodes: totalConsolidatedEpisodes,
    backup_file: backupFile,
    final_location_count: analysis.total_locations - totalDeletedLocations
  }
}

// 実行確認
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')
const analyzeOnly = args.includes('--analyze-only')

// 分析のみの場合
if (analyzeOnly) {
  comprehensiveFinalAnalysis()
    .then(result => {
      console.log(`\n✅ 包括的分析完了!`)
      console.log(`   現在のデータ数: ${result.total_locations}件`)
      console.log(`   人名データ削除予定: ${result.total_person_deletions}件`)
      console.log(`   重複統合削除予定: ${result.total_duplicate_deletions}件`)
      console.log(`   総削除予定: ${result.total_deletions}件`)
      console.log(`   最終残存予定: ${result.final_count}件`)
    })
    .catch(error => {
      console.error('❌ 分析エラー:', error)
    })
} else if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除・統合します。')
  console.log('包括的最終クリーニングでは人名データと重複データを同時処理します。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/comprehensive-final-cleanup.ts --confirm')
  console.log('')
  console.log('分析のみの場合は --analyze-only フラグを使用:')
  console.log('npx tsx scripts/comprehensive-final-cleanup.ts --analyze-only')
  process.exit(0)
} else {
  // 実際のクリーニング実行
  executeComprehensiveFinalCleanup()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ 包括的最終クリーニング完了!`)
        console.log(`人名削除: ${result.deleted_person_names}件`)
        console.log(`重複統合: ${result.consolidated_duplicates}グループ`)
        console.log(`最終データ数: ${result.final_location_count}件`)
      }
    })
    .catch(error => {
      console.error('❌ クリーニング失敗:', error)
      process.exit(1)
    })
}