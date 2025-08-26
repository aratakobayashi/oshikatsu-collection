#!/usr/bin/env npx tsx

/**
 * Tabelogアフィリエイト拡張機会分析
 * 現在の状況と最適な拡張戦略を分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function analyzeTabelogExpansionOpportunities() {
  console.log('📊 Tabelogアフィリエイト拡張機会分析')
  console.log('='.repeat(60))
  
  try {
    // 1. 現在の状況分析
    console.log('\n🔍 【現在の状況分析】')
    console.log('='.repeat(40))
    
    // 全体のロケーション数
    const { data: allLocations } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
    
    // エピソード-ロケーション関係を取得
    const { data: episodeLocationLinks } = await supabase
      .from('episode_locations')
      .select(`
        location_id,
        episodes(
          id, title, date, view_count,
          celebrities(name, slug)
        )
      `)
    
    // ロケーション詳細を取得
    const locationIds = [...new Set(episodeLocationLinks?.map(el => el.location_id) || [])]
    console.log(`デバッグ: エピソードリンク数=${episodeLocationLinks?.length}, ロケーションID数=${locationIds.length}`)
    
    if (locationIds.length === 0) {
      console.log('⚠️ エピソードリンクが見つかりません')
      return null
    }
    
    const { data: locationsWithDetails } = await supabase
      .from('locations')
      .select('id, name, tabelog_url, address, station')
      .in('id', locationIds)
    
    console.log(`デバッグ: 取得したロケーション数=${locationsWithDetails?.length}`)
    
    // データを統合
    const episodeLinkedLocations = locationsWithDetails?.map(location => {
      const episodeLinks = episodeLocationLinks?.filter(el => el.location_id === location.id) || []
      return {
        ...location,
        episode_locations: episodeLinks
      }
    }) || []
    
    const totalLocations = allLocations?.length || 0
    const episodeLinkedCount = episodeLinkedLocations?.length || 0
    const currentAffiliateCount = allLocations?.filter(loc => loc.tabelog_url).length || 0
    const potentialTargets = episodeLinkedLocations?.filter(loc => !loc.tabelog_url).length || 0
    
    console.log(`✅ 全ロケーション数: ${totalLocations}件`)
    console.log(`✅ エピソード紐付きロケーション: ${episodeLinkedCount}件`)
    console.log(`✅ 現在のアフィリエイト: ${currentAffiliateCount}件`)
    console.log(`✅ 拡張対象候補: ${potentialTargets}件`)
    
    // 2. 収益ポテンシャル分析
    console.log('\n💰 【収益ポテンシャル分析】')
    console.log('='.repeat(40))
    
    const currentRevenue = currentAffiliateCount * 120
    const maxPotentialRevenue = episodeLinkedCount * 120
    const expansionPotential = maxPotentialRevenue - currentRevenue
    
    console.log(`✅ 現在の月間収益: ¥${currentRevenue}`)
    console.log(`✅ 最大ポテンシャル: ¥${maxPotentialRevenue}`)
    console.log(`✅ 拡張可能収益: ¥${expansionPotential}`)
    console.log(`✅ 成長率: ${Math.round((expansionPotential / currentRevenue) * 100)}%`)
    
    // 3. 優先度分析
    console.log('\n🎯 【拡張優先度分析】')
    console.log('='.repeat(40))
    
    // エピソード数でソート（人気度の指標）
    const targetsByPriority = (episodeLinkedLocations || [])
      .filter(loc => !loc.tabelog_url)
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        address: loc.address,
        station: loc.station,
        episodes_count: loc.episode_locations?.length || 0,
        latest_episode: loc.episode_locations?.[0]?.episodes,
        celebrity: loc.episode_locations?.[0]?.episodes?.celebrities?.name
      }))
      .sort((a, b) => b.episodes_count - a.episodes_count)
    
    console.log(`✅ 高優先度候補 (複数エピソード): ${targetsByPriority.filter(t => t.episodes_count > 1).length}件`)
    console.log(`✅ 中優先度候補 (1エピソード): ${targetsByPriority.filter(t => t.episodes_count === 1).length}件`)
    
    // TOP10 高優先度候補
    console.log('\n🏆 【TOP10 高優先度拡張候補】')
    const top10 = targetsByPriority.slice(0, 10)
    top10.forEach((target, idx) => {
      console.log(`  ${idx + 1}. ${target.name}`)
      console.log(`     エピソード数: ${target.episodes_count}件`)
      console.log(`     芸能人: ${target.celebrity || '不明'}`)
      console.log(`     住所: ${target.address || '不明'}`)
      console.log(`     最寄駅: ${target.station || '不明'}`)
    })
    
    // 4. 地域別分析
    console.log('\n📍 【地域別分析】')
    console.log('='.repeat(40))
    
    const locationsByRegion = new Map()
    targetsByPriority.forEach(target => {
      const region = target.address?.split('都')[0]?.split('県')[0]?.split('府')[0] || '不明'
      if (!locationsByRegion.has(region)) {
        locationsByRegion.set(region, [])
      }
      locationsByRegion.get(region).push(target)
    })
    
    const sortedRegions = Array.from(locationsByRegion.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
    
    sortedRegions.forEach(([region, locations], idx) => {
      console.log(`  ${idx + 1}. ${region}: ${locations.length}件`)
    })
    
    // 5. 実装推奨戦略
    console.log('\n🚀 【実装推奨戦略】')
    console.log('='.repeat(60))
    
    console.log('📋 **推奨アプローチ**: locationsテーブル直接更新')
    console.log('✅ **理由**:')
    console.log('  • tabelog_urlカラムが既に存在')
    console.log('  • 新しい中間テーブル構造で正常動作確認済み')
    console.log('  • フロントエンドの修正不要')
    console.log('  • 既存の15店舗と同じ方式で一貫性保持')
    
    console.log('\n📝 **具体的な依頼方法**:')
    console.log('```')
    console.log('「以下の店舗にTabelogアフィリエイトリンクを追加してください：')
    console.log('')
    console.log('Location ID: [店舗のID]')
    console.log('店舗名: [店舗名]')
    console.log('住所: [住所情報]')
    console.log('」')
    console.log('```')
    
    console.log('\n⚡ **効率的な進め方**:')
    console.log('  1. 複数エピソード店舗から優先的に実施')
    console.log('  2. 5-10店舗ずつバッチで処理')
    console.log('  3. 各バッチ完了後に収益効果を測定')
    console.log('  4. ROIを確認して次のバッチを決定')
    
    console.log('\n💡 **拡張後の予想効果**:')
    console.log(`  • TOP50店舗対応: +¥${50 * 120}/月 (約¥6,000)`)
    console.log(`  • TOP100店舗対応: +¥${100 * 120}/月 (約¥12,000)`)
    console.log(`  • 全店舗対応: +¥${expansionPotential}/月 (約¥${Math.round(expansionPotential/1000)}k)`)
    
    return {
      current_affiliate_count: currentAffiliateCount,
      expansion_targets: potentialTargets,
      revenue_potential: expansionPotential,
      top_candidates: top10,
      regions: sortedRegions
    }
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
    return null
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  analyzeTabelogExpansionOpportunities()
}

export { analyzeTabelogExpansionOpportunities }