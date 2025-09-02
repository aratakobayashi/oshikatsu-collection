#!/usr/bin/env node

/**
 * 重複ロケーションデータの統合処理
 * エピソードリンクを保持しながら重複を解消
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeDuplicates() {
  console.log('🔍 重複データの詳細分析')
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

  // 名前でグルーピング
  const nameGroups = locations.reduce((acc, loc) => {
    const name = loc.name?.trim()
    if (name) {
      if (!acc[name]) acc[name] = []
      acc[name].push(loc)
    }
    return acc
  }, {} as Record<string, any[]>)

  // 重複のみを抽出
  const duplicates = Object.entries(nameGroups)
    .filter(([name, locs]) => locs.length > 1)
    .map(([name, locs]) => ({ 
      name, 
      count: locs.length, 
      items: locs.sort((a, b) => {
        // 統合優先度でソート
        const scoreA = calculateMergeScore(a)
        const scoreB = calculateMergeScore(b)
        return scoreB - scoreA
      })
    }))
    .sort((a, b) => b.count - a.count) // 重複数でソート

  console.log(`\n🔄 重複データ詳細分析: ${duplicates.length}種類`)
  
  let totalDuplicateItems = 0
  let totalConsolidationPlan = 0

  duplicates.forEach((dup, i) => {
    console.log(`\n${i+1}. "${dup.name}" - ${dup.count}件`)
    
    totalDuplicateItems += dup.count
    totalConsolidationPlan += (dup.count - 1) // 1件残して他を削除
    
    dup.items.forEach((item, j) => {
      const score = calculateMergeScore(item)
      const episodeCount = item.episode_locations?.length || 0
      const celebrities = [...new Set(item.episode_locations?.map(el => 
        el.episodes?.celebrities?.name).filter(Boolean) || [])]
      
      console.log(`   ${j+1}) [スコア:${score}] ${item.address || '住所不明'}`)
      console.log(`       ID: ${item.id.slice(0, 8)}... | ${episodeCount}エピソード`)
      if (celebrities.length > 0) {
        console.log(`       セレブ: ${celebrities.slice(0, 2).join(', ')}`)
      }
      if (item.tabelog_url) console.log(`       📱 タベログURL: あり`)
      if (item.phone) console.log(`       📞 電話: ${item.phone}`)
    })
  })

  console.log(`\n📊 【統合計画サマリー】`)
  console.log(`重複データ総数: ${totalDuplicateItems}件`)
  console.log(`削除予定: ${totalConsolidationPlan}件`)
  console.log(`統合後残存: ${locations.length - totalConsolidationPlan}件`)
  
  return {
    total_locations: locations.length,
    duplicate_groups: duplicates.length,
    total_duplicates: totalDuplicateItems,
    planned_deletions: totalConsolidationPlan,
    final_count: locations.length - totalConsolidationPlan,
    duplicates: duplicates
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

async function executeDuplicateConsolidation() {
  console.log('🚀 重複データ統合実行')
  console.log('='.repeat(60))

  const analysis = await analyzeDuplicates()
  
  if (analysis.planned_deletions === 0) {
    console.log('✅ 統合対象の重複データが見つかりませんでした。')
    return
  }

  // バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup-duplicate-consolidation-${timestamp}.json`
  
  const backupData = {
    timestamp: new Date().toISOString(),
    phase: 'duplicate-consolidation',
    total_before: analysis.total_locations,
    duplicate_groups: analysis.duplicate_groups,
    planned_deletions: analysis.planned_deletions,
    duplicate_details: analysis.duplicates.map(dup => ({
      name: dup.name,
      count: dup.count,
      keep_item: {
        id: dup.items[0].id,
        score: calculateMergeScore(dup.items[0]),
        address: dup.items[0].address
      },
      delete_items: dup.items.slice(1).map(item => ({
        id: item.id,
        score: calculateMergeScore(item),
        address: item.address,
        episode_count: item.episode_locations?.length || 0
      }))
    }))
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
  console.log(`💾 バックアップ作成: ${backupFile}`)

  let totalDeletedEpisodeLinks = 0
  let totalDeletedLocations = 0
  let totalConsolidatedEpisodes = 0

  // 重複グループごとに処理
  for (const duplicate of analysis.duplicates) {
    const keepItem = duplicate.items[0] // 最高スコアのアイテムを保持
    const deleteItems = duplicate.items.slice(1) // 残りを削除
    
    console.log(`\n📝 処理中: "${duplicate.name}" (${duplicate.count}件 → 1件)`)
    console.log(`   保持: ${keepItem.id.slice(0, 8)}... (スコア: ${calculateMergeScore(keepItem)})`)
    
    for (const deleteItem of deleteItems) {
      console.log(`   削除: ${deleteItem.id.slice(0, 8)}... (スコア: ${calculateMergeScore(deleteItem)})`)
      
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

            if (insertError) {
              console.error(`   ❌ エピソードリンク移行エラー: ${insertError.message}`)
            } else {
              totalConsolidatedEpisodes++
              console.log(`   ✅ エピソードリンク移行: ${episodeLink.episode_id}`)
            }
          }
        }
      }

      // 削除対象のエピソードリンクを削除
      const { error: episodeLinkError, count: episodeLinkCount } = await supabase
        .from('episode_locations')
        .delete({ count: 'exact' })
        .eq('location_id', deleteItem.id)

      if (episodeLinkError) {
        console.error(`   ❌ エピソードリンク削除エラー: ${episodeLinkError.message}`)
        continue
      }

      totalDeletedEpisodeLinks += (episodeLinkCount || 0)

      // ロケーション本体を削除
      const { error: locationError, count: locationCount } = await supabase
        .from('locations')
        .delete({ count: 'exact' })
        .eq('id', deleteItem.id)

      if (locationError) {
        console.error(`   ❌ ロケーション削除エラー: ${locationError.message}`)
        continue
      }

      totalDeletedLocations += (locationCount || 0)
    }
  }

  console.log('\n🎉 重複データ統合完了!')
  console.log('='.repeat(40))
  console.log(`統合されたグループ: ${analysis.duplicate_groups}種類`)
  console.log(`削除されたロケーション: ${totalDeletedLocations}件`)
  console.log(`削除されたエピソードリンク: ${totalDeletedEpisodeLinks}件`)
  console.log(`移行されたエピソード: ${totalConsolidatedEpisodes}件`)
  console.log(`バックアップファイル: ${backupFile}`)
  console.log(`最終ロケーション数: ${analysis.total_locations - totalDeletedLocations}件`)

  return {
    success: true,
    consolidated_groups: analysis.duplicate_groups,
    deleted_locations: totalDeletedLocations,
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
  analyzeDuplicates()
    .then(result => {
      console.log(`\n✅ 重複分析完了!`)
      console.log(`   重複グループ: ${result.duplicate_groups}種類`)
      console.log(`   重複データ総数: ${result.total_duplicates}件`)
      console.log(`   削除予定: ${result.planned_deletions}件`)
      console.log(`   統合後残存: ${result.final_count}件`)
    })
    .catch(error => {
      console.error('❌ 分析エラー:', error)
    })
} else if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除・統合します。')
  console.log('重複データ統合では約27グループの重複を解消予定です。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/duplicate-data-consolidation.ts --confirm')
  console.log('')
  console.log('分析のみの場合は --analyze-only フラグを使用:')
  console.log('npx tsx scripts/duplicate-data-consolidation.ts --analyze-only')
  process.exit(0)
} else {
  // 実際の統合実行
  executeDuplicateConsolidation()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ 重複データ統合完了!`)
        console.log(`統合グループ: ${result.consolidated_groups}種類`)
        console.log(`削除: ${result.deleted_locations}件`)
        console.log(`最終データ数: ${result.final_location_count}件`)
      }
    })
    .catch(error => {
      console.error('❌ 統合失敗:', error)
      process.exit(1)
    })
}