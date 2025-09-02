#!/usr/bin/env node

/**
 * 改良版：人名データの特定と第三次クリーニング
 * 誤判定を減らして正確な人名データのみを削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as fs from 'fs'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function refinedPersonNameCleanup() {
  console.log('🔧 改良版：人名データの精密クリーニング')
  console.log('='.repeat(60))

  // 1. 全データを取得
  const { data: allLocations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone,
      episode_locations(
        episodes(id, title, celebrities(name))
      )
    `)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 分析対象: ${allLocations.length}件`)

  // 2. 改良されたレストラン除外リスト
  const knownRestaurants = [
    '亀澤堂', '山源', '銀座風香', '花風', '山雅', '花月', '花香',
    '和風', '洋風', '中華風', '風味', '風雅', '雅風', '銀座', '新宿', '渋谷',
    'Napule Pizzeria', 'Sarashina Horii'
  ]

  const restaurantKeywords = [
    '店', 'レストラン', 'カフェ', '喫茶', 'バー', '居酒屋',
    'ラーメン', 'うどん', 'そば', '寿司', '焼肉', '定食',
    '中華', 'イタリアン', 'フレンチ', '和食', '洋食',
    '堂', '亭', '庵', '軒', '館', '屋', 'Pizzeria'
  ]

  // 3. 改良された人名判定関数
  const isActualPersonName = (name: string, location: any) => {
    if (!name) return { isPerson: false, reason: 'no_name' }
    
    const trimmedName = name.trim()
    
    // レストラン除外チェック
    if (knownRestaurants.some(restaurant => trimmedName.includes(restaurant))) {
      return { isPerson: false, reason: 'known_restaurant' }
    }
    
    if (restaurantKeywords.some(keyword => trimmedName.includes(keyword))) {
      return { isPerson: false, reason: 'restaurant_keyword' }
    }

    // タベログURLがある場合は確実に店舗
    if (location.tabelog_url) {
      return { isPerson: false, reason: 'has_tabelog' }
    }

    // 電話番号がある場合は店舗の可能性高い
    if (location.phone) {
      return { isPerson: false, reason: 'has_phone' }
    }

    // 具体的な住所がある場合は店舗の可能性
    if (location.address && location.address.length > 15 && 
        !location.address.includes('東京都内') && 
        !location.address.includes('各店舗')) {
      return { isPerson: false, reason: 'specific_address' }
    }

    // 明確な人名パターン（より厳格）
    const actualPersonPatterns = [
      // フルネーム形式（姓名がスペースで区切られている）
      /^[一-龯]{1,4}\s+[一-龯]{1,4}$/,
      /^[ア-ン]{2,4}\s+[ア-ン]{2,4}$/,
      /^[ぁ-ん]{2,4}\s+[ぁ-ん]{2,4}$/,
      /^[A-Za-z]+\s+[A-Za-z]+$/,
      
      // 特定のセレブリティ名（確実なもののみ）
      /諸橋\s*沙夏|髙松\s*瞳|Sana\s+Morohashi|Hitomi\s+Takamatsu/,
      /菊池風磨|山田涼介|松重豊|亀梨和也/,
      /Snow Man|SixTONES|Travis Japan/,
      /≠ME|よにのちゃんねる/,
      
      // Covered by パターン
      /Covered by\s+[ぁ-んア-ン一-龯A-Za-z\s]+/,
      /featuring\s+[A-Za-z\s]+/,
      /feat\.\s*[A-Za-z\s]+/
    ]

    for (const pattern of actualPersonPatterns) {
      if (pattern.test(trimmedName)) {
        return { isPerson: true, reason: 'definite_person_pattern', pattern: pattern.toString() }
      }
    }

    // 英語の人名（より厳格）
    const englishNamePattern = /^[A-Z][a-z]+ [A-Z][a-z]+$/
    if (englishNamePattern.test(trimmedName) && !trimmedName.includes('Restaurant') && !trimmedName.includes('Cafe')) {
      return { isPerson: true, reason: 'english_full_name' }
    }

    return { isPerson: false, reason: 'no_clear_match' }
  }

  // 4. その他の問題データパターン
  const isOtherProblem = (name: string, address: string) => {
    const problemPatterns = [
      // 楽曲のタイムスタンプ
      /^\d{1,2}:\d{2}/,
      // 説明文っぽいもの
      /[。！？]/,
      // 長すぎる名前（説明文の可能性）
      /^.{30,}/,
      // URLや記号
      /http|www|#|@/,
      // フォーム関連
      /フォーム|form|申し込み|応募/i,
      // 明らかに場所ではないもの
      /香水|perfume|フレグランス/i
    ]
    
    return problemPatterns.some(pattern => 
      pattern.test(name) || pattern.test(address)
    )
  }

  // 5. 削除対象の特定
  const personNameLocations = allLocations.filter(loc => {
    const analysis = isActualPersonName(loc.name, loc)
    return analysis.isPerson
  }).map(loc => ({
    ...loc,
    analysis: isActualPersonName(loc.name, loc)
  }))

  const otherProblemsLocations = allLocations.filter(loc => {
    if (personNameLocations.find(p => p.id === loc.id)) return false // 既に人名判定済み
    return isOtherProblem(loc.name || '', loc.address || '')
  })

  console.log('\n👤 【確実な人名データ】')
  console.log('='.repeat(40))
  console.log(`検出数: ${personNameLocations.length}件`)

  personNameLocations.forEach((loc, i) => {
    console.log(`${i+1}. "${loc.name}" (ID: ${loc.id.slice(0, 8)}...)`)
    console.log(`   住所: ${loc.address || 'なし'}`)
    console.log(`   判定理由: ${loc.analysis.reason}`)
    console.log(`   エピソード: ${loc.episode_locations?.length || 0}件`)
    console.log('')
  })

  console.log('\n⚠️ 【その他問題データ】')
  console.log('='.repeat(40))
  console.log(`検出数: ${otherProblemsLocations.length}件`)

  otherProblemsLocations.slice(0, 10).forEach((loc, i) => {
    console.log(`${i+1}. "${loc.name}"`)
    console.log(`   住所: ${loc.address || 'なし'}`)
    console.log('')
  })

  // 6. 削除対象の統合
  const allDeleteTargets = [...personNameLocations, ...otherProblemsLocations]
  const uniqueDeleteTargets = allDeleteTargets.filter((item, index, arr) => 
    arr.findIndex(i => i.id === item.id) === index
  )

  console.log('\n🗑️ 【改良版第三次クリーニング削除対象】')
  console.log('='.repeat(50))
  console.log(`確実な人名データ: ${personNameLocations.length}件`)
  console.log(`その他問題データ: ${otherProblemsLocations.length}件`)
  console.log(`削除対象合計: ${uniqueDeleteTargets.length}件`)
  console.log(`残存予定: ${allLocations.length - uniqueDeleteTargets.length}件`)

  return {
    total_locations: allLocations.length,
    person_name_locations: personNameLocations,
    other_problems: otherProblemsLocations,
    delete_targets: uniqueDeleteTargets
  }
}

async function executeRefinedCleanup() {
  console.log('🚀 改良版第三次クリーニング実行')
  console.log('='.repeat(60))

  const analysis = await refinedPersonNameCleanup()
  
  if (analysis.delete_targets.length === 0) {
    console.log('✅ 削除対象データが見つかりませんでした。')
    return
  }

  // バックアップ作成
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `backup-refined-cleanup-${timestamp}.json`
  
  const backupData = {
    timestamp: new Date().toISOString(),
    phase: 'refined-third-phase-cleanup',
    total_before: analysis.total_locations,
    total_deleted: analysis.delete_targets.length,
    deleted_locations: analysis.delete_targets.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      reason: loc.analysis?.reason || 'other_problem',
      episode_count: loc.episode_locations?.length || 0
    }))
  }
  
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))
  console.log(`💾 バックアップ作成: ${backupFile}`)

  // 実際の削除実行
  const deleteIds = analysis.delete_targets.map(t => t.id)
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

  console.log('\n🎉 改良版第三次クリーニング完了!')
  console.log('='.repeat(40))
  console.log(`確実な人名データ削除: ${analysis.person_name_locations.length}件`)
  console.log(`その他問題データ削除: ${analysis.other_problems.length}件`)
  console.log(`削除されたロケーション: ${deletedLocations}件`)
  console.log(`削除されたエピソードリンク: ${deletedEpisodeLinks}件`)
  console.log(`バックアップファイル: ${backupFile}`)
  console.log(`最終残存ロケーション: ${analysis.total_locations - deletedLocations}件`)

  return {
    success: true,
    deleted_locations: deletedLocations,
    deleted_episode_links: deletedEpisodeLinks,
    backup_file: backupFile,
    remaining_locations: analysis.total_locations - deletedLocations
  }
}

// 実行確認
const args = process.argv.slice(2)
const confirmFlag = args.includes('--confirm')
const analyzeOnly = args.includes('--analyze-only')

// 分析のみの場合
if (analyzeOnly) {
  refinedPersonNameCleanup()
    .then(result => {
      console.log(`\n✅ 分析完了!`)
      console.log(`   人名データ: ${result.person_name_locations.length}件`)
      console.log(`   その他問題: ${result.other_problems.length}件`)
      console.log(`   削除対象合計: ${result.delete_targets.length}件`)
    })
    .catch(error => {
      console.error('❌ 分析エラー:', error)
    })
} else if (!confirmFlag) {
  console.log('⚠️  このスクリプトは実際にデータを削除します。')
  console.log('改良版第三次クリーニングでは確実な人名データと問題データのみを削除します。')
  console.log('実行するには --confirm フラグを付けてください:')
  console.log('npx tsx scripts/refined-person-name-cleanup.ts --confirm')
  console.log('')
  console.log('分析のみの場合は --analyze-only フラグを使用:')
  console.log('npx tsx scripts/refined-person-name-cleanup.ts --analyze-only')
  process.exit(0)
} else {
  // 実際の削除実行
  executeRefinedCleanup()
    .then(result => {
      if (result.success) {
        console.log(`\n✅ 改良版第三次クリーニング完了!`)
        console.log(`削除: ${result.deleted_locations}件`)
        console.log(`残存: ${result.remaining_locations}件`)
      }
    })
    .catch(error => {
      console.error('❌ クリーニング失敗:', error)
      process.exit(1)
    })
}