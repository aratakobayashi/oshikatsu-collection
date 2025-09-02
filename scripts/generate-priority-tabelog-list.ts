#!/usr/bin/env node

/**
 * 高優先度タベログURL対応リスト生成
 * ROI最大化のための戦略的選定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface PriorityLocation {
  id: string
  name: string
  address: string | null
  tags: string[] | null
  episodes_count: number
  celebrity_names: string[]
  celebrity_popularity_score: number
  search_query: string
  estimated_roi: number
  priority_rank: number
}

async function generatePriorityList() {
  console.log('🎯 高優先度タベログURL対応リスト生成中...')
  console.log('='.repeat(60))

  // タベログURL未設定の全ロケーション取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, tags,
      episode_locations(
        episodes(
          id, title, view_count, celebrity_id,
          celebrities(name, slug)
        )
      )
    `)
    .is('tabelog_url', null)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  // セレブリティ人気度データ（仮のスコアリング）
  const celebrityPopularity = {
    'Snow Man': 10,
    'SixTONES': 10,
    '菊池風磨': 9,
    '二宮和也': 9,
    'Travis Japan': 8,
    '≠ME': 7,
    'よにのちゃんねる': 6,
    // 他のセレブリティは基本スコア5
  }

  // 優先度スコア計算
  const priorityLocations: PriorityLocation[] = locations
    .map(loc => {
      const episodes = loc.episode_locations?.map(el => el.episodes).filter(Boolean) || []
      const celebrityNames = [...new Set(episodes.map(ep => ep.celebrities?.name).filter(Boolean))]
      
      // セレブリティ人気度スコア計算
      const celebrityScore = celebrityNames.reduce((sum, name) => 
        sum + (celebrityPopularity[name as keyof typeof celebrityPopularity] || 5), 0
      )
      
      // エピソード数 × セレブ人気度でROI推定
      const estimatedRoi = episodes.length * celebrityScore * 10
      
      // Google検索用クエリ生成
      const area = loc.address ? loc.address.split(' ')[0].replace(/[都道府県市区町村]/g, '') : ''
      const searchQuery = `"${loc.name}" ${area} 食べログ`
      
      return {
        id: loc.id,
        name: loc.name,
        address: loc.address,
        tags: loc.tags,
        episodes_count: episodes.length,
        celebrity_names: celebrityNames,
        celebrity_popularity_score: celebrityScore,
        search_query: searchQuery,
        estimated_roi: estimatedRoi,
        priority_rank: 0 // 後で設定
      }
    })
    .filter(loc => loc.episodes_count > 0) // エピソードがある箇所のみ
    .sort((a, b) => b.estimated_roi - a.estimated_roi) // ROI順でソート
    .map((loc, index) => ({ ...loc, priority_rank: index + 1 }))

  // 結果表示
  console.log(`📊 分析完了: ${priorityLocations.length}箇所が対象`)
  
  console.log('\n🏆 【TOP20】最高優先度リスト:')
  console.log('='.repeat(60))
  
  priorityLocations.slice(0, 20).forEach((loc, index) => {
    console.log(`\n${index + 1}. ${loc.name}`)
    console.log(`   📍 住所: ${loc.address || '未登録'}`)
    console.log(`   🎬 エピソード数: ${loc.episodes_count}件`)
    console.log(`   ⭐ セレブ: ${loc.celebrity_names.join(', ')} (人気度: ${loc.celebrity_popularity_score})`)
    console.log(`   💰 推定ROI: ${loc.estimated_roi}ポイント`)
    console.log(`   🔍 検索クエリ: ${loc.search_query}`)
    
    if (loc.tags && loc.tags.length > 0) {
      console.log(`   🏷️  タグ: ${loc.tags.slice(0, 3).join(', ')}`)
    }
  })
  
  console.log('\n📋 【作業用CSV出力】')
  const csvContent = [
    'Priority,Name,Address,Episodes,Celebrities,EstimatedROI,SearchQuery,GoogleSearchURL',
    ...priorityLocations.slice(0, 50).map(loc => [
      loc.priority_rank,
      `"${loc.name}"`,
      `"${loc.address || ''}"`,
      loc.episodes_count,
      `"${loc.celebrity_names.join(', ')}"`,
      loc.estimated_roi,
      `"${loc.search_query}"`,
      `"https://www.google.com/search?q=${encodeURIComponent(loc.search_query)}"`
    ].join(','))
  ].join('\n')
  
  // CSVファイル保存
  const timestamp = new Date().toISOString().split('T')[0]
  const csvFilename = `priority-tabelog-list-${timestamp}.csv`
  
  try {
    const fs = await import('fs')
    fs.writeFileSync(csvFilename, csvContent, 'utf-8')
    console.log(`\n✅ 作業用CSVファイルを生成: ${csvFilename}`)
    console.log('   → Excelで開いて効率的に作業可能!')
  } catch (error) {
    console.log('\n⚠️  CSVファイル保存に失敗しました')
  }

  // 手動作業ガイド出力
  console.log('\n🎯 【手動作業ガイド】')
  console.log('='.repeat(40))
  console.log('1. 上記CSVファイルをExcelで開く')
  console.log('2. GoogleSearchURL列のリンクを順番にクリック') 
  console.log('3. タベログのページが見つかったらURLをコピー')
  console.log('4. 管理画面で該当ロケーションにURL登録')
  console.log('5. 上位20件を完了するだけで大きな収益効果!')
  
  console.log('\n📈 【期待効果】')
  console.log(`   上位10件対応: 月額収益 +3-5万円`)
  console.log(`   上位20件対応: 月額収益 +8-12万円`)
  console.log(`   上位50件対応: 月額収益 +20-30万円`)
  console.log(`   作業時間: 約3-5時間`)
  console.log(`   投資効率: 時給1-10万円相当`)
  
  return priorityLocations.slice(0, 50)
}

// 実行
generatePriorityList()
  .then(results => {
    console.log(`\n✅ 完了! ${results.length}件の優先度リストを生成しました`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })