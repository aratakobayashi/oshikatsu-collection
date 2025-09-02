#!/usr/bin/env node

/**
 * 包括的SEO現状調査スクリプト
 * タベログURL、店舗情報、キーワード対応状況を詳細分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LocationAnalysis {
  id: string
  name: string
  address: string | null
  tabelog_url: string | null
  phone: string | null
  opening_hours: any
  tags: string[] | null
  image_url: string | null
  description: string | null
  episodes_count: number
  celebrity_names: string[]
}

interface AuditResults {
  total_locations: number
  tabelog_coverage: {
    with_tabelog: number
    without_tabelog: number
    percentage: number
    missing_locations: LocationAnalysis[]
  }
  store_info_coverage: {
    phone: { count: number; percentage: number }
    opening_hours: { count: number; percentage: number }
    description: { count: number; percentage: number }
    image: { count: number; percentage: number }
  }
  keyword_opportunities: {
    celebrity_location_pairs: number
    celebrity_restaurant_pairs: number
    potential_longtail_pages: number
  }
  priority_actions: {
    high_traffic_missing_tabelog: LocationAnalysis[]
    popular_celebrity_locations: LocationAnalysis[]
    incomplete_restaurant_info: LocationAnalysis[]
  }
}

async function runComprehensiveAudit(): Promise<AuditResults> {
  console.log('🔍 包括的SEO現状調査を開始します...')
  console.log('='.repeat(60))

  // 全ロケーション情報を取得（関連データ含む）
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, tabelog_url, phone, opening_hours, tags, 
      image_url, description, created_at,
      episode_locations(
        episodes(
          id, title, view_count, celebrity_id,
          celebrities(name, slug)
        )
      )
    `)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 総ロケーション数: ${locations.length}箇所`)

  // データ整形・分析
  const locationAnalysis: LocationAnalysis[] = locations.map(loc => {
    const episodes = loc.episode_locations?.map(el => el.episodes).filter(Boolean) || []
    const celebrityNames = [...new Set(episodes.map(ep => ep.celebrities?.name).filter(Boolean))]
    
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      tabelog_url: loc.tabelog_url,
      phone: loc.phone,
      opening_hours: loc.opening_hours,
      tags: loc.tags,
      image_url: loc.image_url,
      description: loc.description,
      episodes_count: episodes.length,
      celebrity_names: celebrityNames
    }
  })

  // 分析結果の計算
  const results: AuditResults = {
    total_locations: locations.length,
    
    // タベログURL分析
    tabelog_coverage: {
      with_tabelog: locationAnalysis.filter(loc => loc.tabelog_url).length,
      without_tabelog: locationAnalysis.filter(loc => !loc.tabelog_url).length,
      percentage: Math.round((locationAnalysis.filter(loc => loc.tabelog_url).length / locations.length) * 100),
      missing_locations: locationAnalysis.filter(loc => !loc.tabelog_url)
    },
    
    // 店舗情報充実度分析
    store_info_coverage: {
      phone: {
        count: locationAnalysis.filter(loc => loc.phone).length,
        percentage: Math.round((locationAnalysis.filter(loc => loc.phone).length / locations.length) * 100)
      },
      opening_hours: {
        count: locationAnalysis.filter(loc => loc.opening_hours && Object.keys(loc.opening_hours).length > 0).length,
        percentage: Math.round((locationAnalysis.filter(loc => loc.opening_hours && Object.keys(loc.opening_hours).length > 0).length / locations.length) * 100)
      },
      description: {
        count: locationAnalysis.filter(loc => loc.description).length,
        percentage: Math.round((locationAnalysis.filter(loc => loc.description).length / locations.length) * 100)
      },
      image: {
        count: locationAnalysis.filter(loc => loc.image_url).length,
        percentage: Math.round((locationAnalysis.filter(loc => loc.image_url).length / locations.length) * 100)
      }
    },
    
    // キーワード機会分析
    keyword_opportunities: {
      celebrity_location_pairs: locationAnalysis.reduce((sum, loc) => sum + loc.celebrity_names.length, 0),
      celebrity_restaurant_pairs: locationAnalysis.filter(loc => loc.tabelog_url).reduce((sum, loc) => sum + loc.celebrity_names.length, 0),
      potential_longtail_pages: locationAnalysis.reduce((sum, loc) => sum + loc.celebrity_names.length * 2, 0) // ロケ地 + 行きつけ店
    },
    
    // 優先対応箇所の特定
    priority_actions: {
      // 高トラフィック（エピソード数多）でタベログURL無し
      high_traffic_missing_tabelog: locationAnalysis
        .filter(loc => !loc.tabelog_url && loc.episodes_count > 0)
        .sort((a, b) => b.episodes_count - a.episodes_count)
        .slice(0, 20),
      
      // 人気セレブリティのロケ地（複数名関連）
      popular_celebrity_locations: locationAnalysis
        .filter(loc => loc.celebrity_names.length >= 2)
        .sort((a, b) => b.celebrity_names.length - a.celebrity_names.length)
        .slice(0, 15),
      
      // レストラン系で情報不足
      incomplete_restaurant_info: locationAnalysis
        .filter(loc => loc.tabelog_url && (!loc.phone || !loc.opening_hours))
        .slice(0, 30)
    }
  }

  return results
}

async function displayAuditResults(results: AuditResults) {
  console.log('\n🎯 【調査結果サマリー】')
  console.log('='.repeat(60))
  
  console.log(`📍 総ロケーション数: ${results.total_locations}箇所`)
  
  console.log('\n💰 【最優先】タベログURL対応状況:')
  console.log(`  ✅ 対応済み: ${results.tabelog_coverage.with_tabelog}箇所 (${results.tabelog_coverage.percentage}%)`)
  console.log(`  ❌ 未対応: ${results.tabelog_coverage.without_tabelog}箇所 (${100 - results.tabelog_coverage.percentage}%)`)
  console.log(`  🎯 目標90%まで: あと${Math.max(0, Math.ceil(results.total_locations * 0.9) - results.tabelog_coverage.with_tabelog)}箇所`)
  
  console.log('\n🏪 店舗詳細情報の充実度:')
  console.log(`  📞 電話番号: ${results.store_info_coverage.phone.count}箇所 (${results.store_info_coverage.phone.percentage}%) → 目標80%`)
  console.log(`  🕐 営業時間: ${results.store_info_coverage.opening_hours.count}箇所 (${results.store_info_coverage.opening_hours.percentage}%) → 目標80%`)
  console.log(`  📝 説明文: ${results.store_info_coverage.description.count}箇所 (${results.store_info_coverage.description.percentage}%)`)
  console.log(`  🖼️ 画像: ${results.store_info_coverage.image.count}箇所 (${results.store_info_coverage.image.percentage}%)`)
  
  console.log('\n🔍 キーワード機会分析:')
  console.log(`  👥 セレブリティ×ロケ地ペア: ${results.keyword_opportunities.celebrity_location_pairs}組`)
  console.log(`  🍽️ セレブリティ×レストランペア: ${results.keyword_opportunities.celebrity_restaurant_pairs}組`)
  console.log(`  📄 ロングテール対象ページ数: ${results.keyword_opportunities.potential_longtail_pages}ページ`)
  
  console.log('\n🚨 【優先対応】高影響箇所:')
  
  console.log('\n  1. 高トラフィック×タベログURL未対応 (TOP10):')
  results.priority_actions.high_traffic_missing_tabelog.slice(0, 10).forEach((loc, i) => {
    console.log(`     ${i + 1}. ${loc.name} (エピソード${loc.episodes_count}件, セレブ: ${loc.celebrity_names.join(', ')})`)
  })
  
  console.log('\n  2. 人気セレブリティ関連ロケ地 (TOP5):')
  results.priority_actions.popular_celebrity_locations.slice(0, 5).forEach((loc, i) => {
    console.log(`     ${i + 1}. ${loc.name} (${loc.celebrity_names.length}名関連: ${loc.celebrity_names.slice(0, 3).join(', ')})`)
  })
  
  console.log('\n  3. レストラン情報不足 (TOP5):')
  results.priority_actions.incomplete_restaurant_info.slice(0, 5).forEach((loc, i) => {
    const missing = []
    if (!loc.phone) missing.push('電話番号')
    if (!loc.opening_hours) missing.push('営業時間')
    console.log(`     ${i + 1}. ${loc.name} (不足: ${missing.join(', ')})`)
  })
  
  console.log('\n💡 【推奨実装順序】:')
  console.log('  Phase 1 (即効性): 高トラフィック箇所のタベログURL対応 → 収益直結')
  console.log('  Phase 2 (SEO効果): 人気セレブ×ロケ地のロングテールページ → 流入拡大') 
  console.log('  Phase 3 (情報充実): 店舗詳細情報の一括収集 → ユーザビリティ向上')
  
  // 詳細データをJSONで出力
  const timestamp = new Date().toISOString().split('T')[0]
  const outputFile = `audit-results-${timestamp}.json`
  
  try {
    const fs = await import('fs')
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2), 'utf-8')
    console.log(`\n📄 詳細結果を ${outputFile} に保存しました`)
  } catch (error) {
    console.log('\n📄 詳細結果の保存に失敗しましたが、分析は完了しています')
  }
}

// 実行
runComprehensiveAudit()
  .then(displayAuditResults)
  .catch(error => {
    console.error('❌ 調査実行エラー:', error)
    process.exit(1)
  })