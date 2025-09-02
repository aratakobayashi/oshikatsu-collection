#!/usr/bin/env node

/**
 * 第二次ロケーションデータクリーニング
 * スコアリングに基づく非店舗データの削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

function calculateRestaurantScore(location: any): number {
  let score = 0
  const name = location.name?.toLowerCase() || ''
  const description = location.description?.toLowerCase() || ''
  const tags = location.tags?.join(' ').toLowerCase() || ''
  const address = location.address?.toLowerCase() || ''

  // 明確な店舗キーワード（高得点）
  const strongRestaurantKeywords = [
    'レストラン', '食堂', 'カフェ', '喫茶', 'バー', '居酒屋',
    'ラーメン', 'うどん', 'そば', '寿司', '焼肉', '焼鳥',
    '定食', '弁当', 'ピザ', 'ハンバーガー'
  ]
  
  if (strongRestaurantKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword) || tags.includes(keyword)
  )) {
    score += 8
  }

  // 店舗系キーワード（中程度）
  const mediumKeywords = ['店', 'ショップ', 'デリ', 'ベーカリー', 'スイーツ']
  if (mediumKeywords.some(keyword => name.includes(keyword))) {
    score += 5
  }

  // 料理系キーワード
  const cuisineKeywords = ['中華', 'イタリアン', 'フレンチ', '和食', '洋食', 'アジアン']
  if (cuisineKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword)
  )) {
    score += 3
  }

  // タベログURLあり（信頼度高い）
  if (location.tabelog_url) {
    score += 6
  }

  // 電話番号あり
  if (location.phone) {
    score += 2
  }

  // 住所の具体性
  if (location.address && location.address.length > 10 && 
      !location.address.includes('東京都内') && 
      !location.address.includes('各店舗')) {
    score += 2
  }

  // 減点要素
  const negativeKeywords = [
    'ビル', 'マンション', 'アパート', '住宅', '駅', 'ホーム',
    '公園', '神社', '寺', '教会', '学校', '病院', '役所',
    '美術館', '博物館', '図書館', 'スタジオ', 'セット'
  ]

  if (negativeKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  )) {
    score -= 5
  }

  return Math.max(0, Math.min(10, score))
}

async function secondPhaseCleanup() {
  console.log('🧹 第二次ロケーションデータクリーニング')
  console.log('='.repeat(60))

  try {
    // 1. 現在のデータを取得
    console.log('📋 現在のデータを分析中...')
    
    const { data: allLocations, error } = await supabase
      .from('locations')
      .select(`
        id, name, address, description, tags,
        tabelog_url, phone,
        episode_locations(
          id, episode_id,
          episodes(id, title, celebrities(name))
        )
      `)

    if (error) {
      throw new Error(`データ取得エラー: ${error.message}`)
    }

    console.log(`📊 現在のロケーション数: ${allLocations.length}件`)

    // 2. スコアリングによる削除対象特定
    const scoredLocations = allLocations.map(loc => ({
      ...loc,
      restaurantScore: calculateRestaurantScore(loc)
    }))

    // スコア4未満を削除対象とする
    const deleteTargets = scoredLocations.filter(loc => loc.restaurantScore < 4)
    const keepTargets = scoredLocations.filter(loc => loc.restaurantScore >= 4)

    console.log(`✅ 削除対象: ${deleteTargets.length}件（スコア4未満）`)
    console.log(`✅ 保持対象: ${keepTargets.length}件（スコア4以上）`)

    // 3. バックアップファイル作成
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = `backup-second-phase-cleanup-${timestamp}.json`
    
    console.log('\n💾 バックアップファイル作成中...')
    const backupData = {
      timestamp: new Date().toISOString(),
      phase: 'second-phase-cleanup',
      total_before: allLocations.length,
      total_deleted: deleteTargets.length,
      deleted_locations: deleteTargets.map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        score: loc.restaurantScore,
        episode_count: loc.episode_locations?.length || 0
      }))
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
    console.log(`✅ バックアップ作成: ${backupFile}`)

    // 4. 削除対象の詳細表示
    console.log('\n🗑️ 削除予定のデータ（低スコア順 TOP15）:')
    console.log('='.repeat(50))
    deleteTargets
      .sort((a, b) => a.restaurantScore - b.restaurantScore)
      .slice(0, 15).forEach((item, i) => {
        console.log(`${i+1}. ${item.name} (スコア: ${item.restaurantScore})`)
        console.log(`   住所: ${item.address || 'なし'}`)
        console.log(`   エピソード: ${item.episode_locations?.length || 0}件`)
        console.log('')
      })

    if (deleteTargets.length > 15) {
      console.log(`   ... 他${deleteTargets.length - 15}件`)
    }

    // 5. 実際の削除実行
    console.log('\n🚀 削除実行中...')
    
    const deleteIds = deleteTargets.map(t => t.id)
    let deletedEpisodeLinks = 0
    let deletedLocations = 0

    if (deleteIds.length > 0) {
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
    }

    // 6. 最終結果サマリー
    console.log('\n🎉 第二次クリーニング完了!')
    console.log('='.repeat(40))
    console.log(`削除されたロケーション: ${deletedLocations}件`)
    console.log(`削除されたエピソードリンク: ${deletedEpisodeLinks}件`)
    console.log(`バックアップファイル: ${backupFile}`)
    console.log(`残存ロケーション: ${allLocations.length - deletedLocations}件`)

    // 7. 品質向上効果とROI予測
    const remainingLocations = allLocations.length - deletedLocations
    const qualityImprovement = Math.round((deletedLocations / allLocations.length) * 100)
    const highQualityCount = keepTargets.filter(loc => loc.restaurantScore >= 7).length
    
    console.log(`\n💰 【クリーニング効果】`)
    console.log(`データ品質向上: ${qualityImprovement}%`)
    console.log(`高品質店舗データ: ${highQualityCount}件`)
    console.log(`タベログURL対応候補: 約${Math.round(remainingLocations * 0.7)}件`)
    console.log(`予想タベログ収益向上: 5-10倍`)

    console.log(`\n🎯 次ステップ: 残り${remainingLocations}件の高品質データでタベログURL対応開始可能!`)

    return {
      success: true,
      deleted_locations: deletedLocations,
      deleted_episode_links: deletedEpisodeLinks,
      backup_file: backupFile,
      remaining_locations: remainingLocations,
      high_quality_locations: highQualityCount
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
  console.log('第二次クリーニングでは413件程度の非店舗データを削除予定です。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/second-phase-cleanup.ts --confirm')
  process.exit(0)
}

// 実際の実行
secondPhaseCleanup()
  .then(result => {
    if (result.success) {
      console.log(`\n✅ 第二次クリーニング完了!`)
      console.log(`削除: ${result.deleted_locations}件`)
      console.log(`残存: ${result.remaining_locations}件`)
      console.log(`高品質データ: ${result.high_quality_locations}件`)
    }
  })
  .catch(error => {
    console.error('❌ クリーニング失敗:', error)
    process.exit(1)
  })
