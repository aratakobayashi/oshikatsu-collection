#!/usr/bin/env node

/**
 * コンテンツSEO強化のための現状分析
 * ロケーションデータの詳細分析とコンテンツ強化ポイントの特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeContentSEOOpportunities() {
  console.log('📊 コンテンツSEO強化分析')
  console.log('='.repeat(60))

  // 全データを詳細取得
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

  // 1. コンテンツ品質分析
  const contentAnalysis = locations.map(loc => {
    const name = loc.name || ''
    const description = loc.description || ''
    const address = loc.address || ''
    const episodeCount = loc.episode_locations?.length || 0
    const celebrities = [...new Set(loc.episode_locations?.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean) || [])]
    
    // コンテンツスコア算出
    let contentScore = 0
    let improvementAreas = []
    
    // 基本情報の充実度
    if (name.length > 5) contentScore += 2
    if (description && description.length > 20) {
      contentScore += 3
    } else {
      improvementAreas.push('詳細説明不足')
    }
    
    if (address && address.length > 15 && !address.includes('東京都内')) {
      contentScore += 3
    } else {
      improvementAreas.push('具体的住所不足')
    }
    
    // 店舗情報の充実度
    if (loc.tabelog_url) contentScore += 4
    if (loc.phone) contentScore += 2
    if (loc.opening_hours) contentScore += 2
    
    // エンターテイメント価値
    if (episodeCount > 0) contentScore += episodeCount * 2
    if (celebrities.length > 0) contentScore += celebrities.length
    
    // タグの充実度
    if (loc.tags && loc.tags.length > 2) {
      contentScore += 2
    } else {
      improvementAreas.push('タグ不足')
    }
    
    // コンテンツ強化ポテンシャル判定
    let enhancementPotential = 'low'
    if (episodeCount >= 2 || celebrities.length >= 2) {
      enhancementPotential = 'high'
    } else if (episodeCount === 1 && celebrities.length === 1) {
      enhancementPotential = 'medium'
    }
    
    return {
      id: loc.id,
      name: loc.name,
      contentScore,
      episodeCount,
      celebrities,
      enhancementPotential,
      improvementAreas,
      hasTabelog: !!loc.tabelog_url,
      currentDescription: description,
      currentTags: loc.tags || []
    }
  }).sort((a, b) => b.contentScore - a.contentScore)

  // 2. カテゴリ別分析
  const highPotential = contentAnalysis.filter(loc => loc.enhancementPotential === 'high')
  const mediumPotential = contentAnalysis.filter(loc => loc.enhancementPotential === 'medium')
  const lowPotential = contentAnalysis.filter(loc => loc.enhancementPotential === 'low')

  console.log('\n🎯 【コンテンツ強化ポテンシャル分析】')
  console.log('='.repeat(50))
  console.log(`高ポテンシャル: ${highPotential.length}件（複数エピソード/セレブ）`)
  console.log(`中ポテンシャル: ${mediumPotential.length}件（1エピソード/セレブ）`)
  console.log(`低ポテンシャル: ${lowPotential.length}件`)

  // 3. セレブリティ別分析
  const celebrityMap = new Map()
  locations.forEach(loc => {
    const celebrities = [...new Set(loc.episode_locations?.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean) || [])]
    celebrities.forEach(celeb => {
      if (!celebrityMap.has(celeb)) {
        celebrityMap.set(celeb, { count: 0, locations: [] })
      }
      const data = celebrityMap.get(celeb)
      data.count++
      data.locations.push({
        name: loc.name,
        id: loc.id,
        hasTabelog: !!loc.tabelog_url
      })
    })
  })

  const topCelebrities = Array.from(celebrityMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)

  console.log('\n⭐ 【TOP10セレブリティ（ロケーション数）】')
  console.log('='.repeat(50))
  topCelebrities.forEach(([celeb, data], i) => {
    const tabelogCount = data.locations.filter(loc => loc.hasTabelog).length
    console.log(`${i+1}. ${celeb}: ${data.count}件（タベログ: ${tabelogCount}件）`)
  })

  // 4. コンテンツ強化優先リスト（TOP20）
  console.log('\n🚀 【コンテンツ強化優先リスト TOP20】')
  console.log('='.repeat(50))
  
  highPotential.slice(0, 20).forEach((loc, i) => {
    console.log(`${i+1}. ${loc.name} (スコア: ${loc.contentScore})`)
    console.log(`   エピソード: ${loc.episodeCount}件 | セレブ: ${loc.celebrities.slice(0, 2).join(', ')}`)
    console.log(`   改善点: ${loc.improvementAreas.join(', ') || 'なし'}`)
    console.log(`   タベログ: ${loc.hasTabelog ? 'あり' : 'なし'}`)
    console.log('')
  })

  // 5. タグ分析
  const allTags = new Map()
  locations.forEach(loc => {
    if (loc.tags) {
      loc.tags.forEach(tag => {
        allTags.set(tag, (allTags.get(tag) || 0) + 1)
      })
    }
  })

  const topTags = Array.from(allTags.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)

  console.log('\n🏷️ 【現在のタグ使用状況 TOP15】')
  console.log('='.repeat(40))
  topTags.forEach(([tag, count], i) => {
    console.log(`${i+1}. "${tag}": ${count}件`)
  })

  // 6. 改善提案サマリー
  console.log('\n💡 【コンテンツSEO強化 実装提案】')
  console.log('='.repeat(50))
  
  const descriptionMissing = locations.filter(loc => !loc.description || loc.description.length < 20).length
  const tagsMissing = locations.filter(loc => !loc.tags || loc.tags.length < 3).length
  const addressVague = locations.filter(loc => !loc.address || loc.address.includes('東京都内')).length
  
  console.log(`1. 【詳細説明自動生成】`)
  console.log(`   対象: ${descriptionMissing}件の説明不足データ`)
  console.log(`   効果: 各ページの独自コンテンツ充実`)
  console.log('')
  
  console.log(`2. 【セマンティックタグ強化】`)
  console.log(`   対象: ${tagsMissing}件のタグ不足データ`)
  console.log(`   効果: カテゴリ別検索対応、内部リンク強化`)
  console.log('')
  
  console.log(`3. 【高ポテンシャル店舗の重点強化】`)
  console.log(`   対象: ${highPotential.length}件の複数エピソード店舗`)
  console.log(`   効果: 人気セレブ関連の検索流入最大化`)
  console.log('')
  
  console.log(`4. 【セレブ別コンテンツハブ化】`)
  console.log(`   対象: TOP10セレブの関連店舗群`)
  console.log(`   効果: ロングテールSEO、回遊率向上`)

  return {
    totalLocations: locations.length,
    highPotential: highPotential.length,
    mediumPotential: mediumPotential.length,
    topCelebrities,
    improvementOpportunities: {
      descriptionMissing,
      tagsMissing,
      addressVague
    },
    priorityList: highPotential.slice(0, 20)
  }
}

// 実行
analyzeContentSEOOpportunities()
  .then(result => {
    console.log(`\n✅ コンテンツSEO分析完了!`)
    console.log(`   総データ数: ${result.totalLocations}件`)
    console.log(`   高ポテンシャル: ${result.highPotential}件`)
    console.log(`   中ポテンシャル: ${result.mediumPotential}件`)
    console.log(`   TOP10セレブリティ特定完了`)
    console.log(`   改善機会: 説明${result.improvementOpportunities.descriptionMissing}件、タグ${result.improvementOpportunities.tagsMissing}件`)
  })
  .catch(error => {
    console.error('❌ 分析エラー:', error)
  })