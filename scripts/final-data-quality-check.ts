#!/usr/bin/env node

/**
 * 最終データ品質チェック
 * 残存データの品質確認とさらなるクリーニング必要性の判定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function finalDataQualityCheck() {
  console.log('🔍 最終データ品質チェック')
  console.log('='.repeat(60))

  // 現在の残存データを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        episodes(id, title, celebrities(name))
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 現在の残存ロケーション数: ${locations.length}件`)

  // 1. 基本統計
  const stats = {
    total: locations.length,
    withTabelog: locations.filter(loc => loc.tabelog_url).length,
    withPhone: locations.filter(loc => loc.phone).length,
    withHours: locations.filter(loc => loc.opening_hours).length,
    withAddress: locations.filter(loc => loc.address && loc.address.length > 5).length,
    withEpisodes: locations.filter(loc => loc.episode_locations && loc.episode_locations.length > 0).length
  }

  console.log('\n📈 【現在のデータ品質統計】')
  console.log('='.repeat(40))
  console.log(`総ロケーション数: ${stats.total}件`)
  console.log(`タベログURL: ${stats.withTabelog}件 (${Math.round(stats.withTabelog/stats.total*100)}%)`)
  console.log(`電話番号: ${stats.withPhone}件 (${Math.round(stats.withPhone/stats.total*100)}%)`)
  console.log(`営業時間: ${stats.withHours}件 (${Math.round(stats.withHours/stats.total*100)}%)`)
  console.log(`住所情報: ${stats.withAddress}件 (${Math.round(stats.withAddress/stats.total*100)}%)`)
  console.log(`エピソード紐付け: ${stats.withEpisodes}件 (${Math.round(stats.withEpisodes/stats.total*100)}%)`)

  // 2. 疑わしいデータの特定
  const suspiciousLocations = locations.filter(loc => {
    const name = loc.name?.toLowerCase() || ''
    const address = loc.address?.toLowerCase() || ''
    
    // 疑わしいパターン
    const suspiciousPatterns = [
      // 明らかに店舗ではないもの
      /駅|ホーム|公園|神社|寺|教会|学校|病院|役所|図書館|美術館|博物館/,
      // 施設系
      /ビル$|マンション|アパート|住宅|スタジオ|会場|ホール/,
      // あいまいなもの
      /^場所|^スポット|^ロケ地|^不明|^未設定|^テスト|test$/i,
      // 長すぎる名前（説明文っぽい）
      /[。！？]/,
      // 時間表記（楽曲名の可能性）
      /^\d{1,2}:\d{2}/
    ]
    
    return suspiciousPatterns.some(pattern => 
      pattern.test(name) || pattern.test(address)
    )
  })

  console.log('\n⚠️  【要確認データ】')
  console.log('='.repeat(40))
  console.log(`疑わしいデータ: ${suspiciousLocations.length}件`)

  if (suspiciousLocations.length > 0) {
    console.log('\n疑わしいデータ一覧:')
    suspiciousLocations.slice(0, 15).forEach((loc, i) => {
      console.log(`${i+1}. ${loc.name}`)
      console.log(`   📍 ${loc.address || '住所不明'}`)
      console.log(`   🎬 ${loc.episode_locations?.length || 0}エピソード`)
      console.log('')
    })
    
    if (suspiciousLocations.length > 15) {
      console.log(`   ... 他${suspiciousLocations.length - 15}件`)
    }
  }

  // 3. 重複データのチェック
  const nameGroups = locations.reduce((acc, loc) => {
    const name = loc.name?.trim()
    if (name) {
      if (!acc[name]) acc[name] = []
      acc[name].push(loc)
    }
    return acc
  }, {} as Record<string, any[]>)

  const duplicates = Object.entries(nameGroups)
    .filter(([name, locs]) => locs.length > 1)
    .map(([name, locs]) => ({ name, count: locs.length, items: locs }))

  console.log('\n🔄 【重複データチェック】')
  console.log('='.repeat(40))
  console.log(`重複する名前: ${duplicates.length}種類`)

  if (duplicates.length > 0) {
    console.log('\n重複データ一覧:')
    duplicates.slice(0, 10).forEach((dup, i) => {
      console.log(`${i+1}. "${dup.name}" - ${dup.count}件`)
      dup.items.forEach((item, j) => {
        console.log(`   ${j+1}) ${item.address || '住所不明'} (ID: ${item.id.slice(0, 8)})`)
      })
      console.log('')
    })
  }

  // 4. 高品質データの抽出
  const highQualityLocations = locations.filter(loc => {
    const name = loc.name?.toLowerCase() || ''
    
    // 高品質の条件
    const qualityKeywords = [
      'レストラン', 'カフェ', '喫茶', 'バー', '居酒屋', 'ラーメン', 
      'うどん', 'そば', '寿司', '焼肉', '焼鳥', 'ピザ', 'ハンバーガー',
      '定食', '弁当', '中華', 'イタリアン', 'フレンチ', '和食', '洋食'
    ]
    
    const hasQualityKeyword = qualityKeywords.some(keyword => 
      name.includes(keyword) || loc.description?.toLowerCase().includes(keyword)
    )
    
    const hasGoodData = loc.address && loc.address.length > 10 && 
                       !loc.address.includes('東京都内') && 
                       !loc.address.includes('各店舗')
    
    return hasQualityKeyword || loc.tabelog_url || hasGoodData
  })

  console.log('\n✅ 【高品質データ】')
  console.log('='.repeat(40))
  console.log(`高品質店舗データ: ${highQualityLocations.length}件`)
  console.log(`品質率: ${Math.round(highQualityLocations.length/stats.total*100)}%`)

  // 5. タベログURL対応の優先度リスト
  const tabelogCandidates = highQualityLocations
    .filter(loc => !loc.tabelog_url)
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      episode_count: loc.episode_locations?.length || 0,
      celebrities: [...new Set(loc.episode_locations?.map(el => 
        el.episodes?.celebrities?.name).filter(Boolean) || [])],
      priority_score: (loc.episode_locations?.length || 0) * 10 + 
                     (loc.phone ? 5 : 0) + 
                     (loc.address && loc.address.length > 10 ? 3 : 0)
    }))
    .sort((a, b) => b.priority_score - a.priority_score)

  console.log('\n🎯 【タベログURL対応優先リスト TOP10】')
  console.log('='.repeat(50))
  tabelogCandidates.slice(0, 10).forEach((loc, i) => {
    console.log(`${i+1}. ${loc.name}`)
    console.log(`   📍 ${loc.address || '住所不明'}`)
    console.log(`   🎬 ${loc.episode_count}エピソード`)
    console.log(`   ⭐ ${loc.celebrities.slice(0, 2).join(', ')}`)
    console.log(`   💰 優先度: ${loc.priority_score}`)
    console.log('')
  })

  // 6. 最終推奨事項
  console.log('\n💡 【最終推奨事項】')
  console.log('='.repeat(40))
  
  if (suspiciousLocations.length > 10) {
    console.log(`⚠️  追加クリーニング推奨: ${suspiciousLocations.length}件の疑わしいデータあり`)
  } else {
    console.log('✅ データ品質良好: 大規模なクリーニングは不要')
  }
  
  if (duplicates.length > 0) {
    console.log(`🔄 重複データの整理推奨: ${duplicates.length}種類`)
  }
  
  console.log(`🎯 タベログURL対応候補: ${tabelogCandidates.length}件`)
  console.log(`📈 SEO強化準備完了: 高品質データ${highQualityLocations.length}件で開始可能`)

  return {
    total_locations: stats.total,
    suspicious_count: suspiciousLocations.length,
    duplicate_count: duplicates.length,
    high_quality_count: highQualityLocations.length,
    tabelog_candidates: tabelogCandidates.length,
    quality_percentage: Math.round(highQualityLocations.length/stats.total*100),
    suspicious_data: suspiciousLocations,
    tabelog_priority_list: tabelogCandidates.slice(0, 20)
  }
}

// 実行
finalDataQualityCheck()
  .then(result => {
    console.log(`\n✅ 最終品質チェック完了!`)
    console.log(`   総データ数: ${result.total_locations}件`)
    console.log(`   高品質データ: ${result.high_quality_count}件 (${result.quality_percentage}%)`)
    console.log(`   疑わしいデータ: ${result.suspicious_count}件`)
    console.log(`   重複データ: ${result.duplicate_count}種類`)
    console.log(`   タベログ候補: ${result.tabelog_candidates}件`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })
