#!/usr/bin/env npx tsx

/**
 * Tabelogアフィリエイト拡張バッチ生成
 * 精度高く段階的に拡張するための候補生成
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

async function generateTabelogExpansionBatch(batchSize: number = 10) {
  console.log(`🎯 Tabelogアフィリエイト拡張バッチ生成 (${batchSize}件)`)
  console.log('='.repeat(60))
  
  try {
    // 1. エピソード紐付きでアフィリエイト未設定の店舗を優先度順で取得
    console.log('\n🔍 【優先度分析】')
    console.log('='.repeat(40))
    
    // まずエピソード紐付きのロケーションIDを全取得
    const { data: episodeLinkedIds } = await supabase
      .from('episode_locations')
      .select('location_id, episode_id')
    
    // ロケーション別のエピソード数をカウント
    const locationEpisodeCount = new Map()
    episodeLinkedIds?.forEach(link => {
      const count = locationEpisodeCount.get(link.location_id) || 0
      locationEpisodeCount.set(link.location_id, count + 1)
    })
    
    console.log(`✅ エピソード紐付きロケーション: ${locationEpisodeCount.size}件`)
    console.log(`✅ 平均エピソード数: ${Math.round((episodeLinkedIds?.length || 0) / locationEpisodeCount.size)}件/店舗`)
    
    // 2. アフィリエイト未設定の店舗を取得（バッチ処理でin句制限回避）
    const locationIds = Array.from(locationEpisodeCount.keys())
    console.log(`デバッグ: 処理対象ID数=${locationIds.length}`)
    
    // locationIdsを小さなバッチに分割
    const batchSize = 100
    const allCandidates = []
    
    for (let i = 0; i < locationIds.length; i += batchSize) {
      const batch = locationIds.slice(i, i + batchSize)
      const { data: batchCandidates } = await supabase
        .from('locations')
        .select('id, name, address, station, tabelog_url, created_at')
        .in('id', batch)
        .is('tabelog_url', null)
      
      if (batchCandidates) {
        allCandidates.push(...batchCandidates)
      }
    }
    
    const candidates = allCandidates.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    console.log(`✅ 拡張候補: ${candidates?.length || 0}件`)
    
    if (!candidates || candidates.length === 0) {
      console.log('⚠️ 拡張可能な候補が見つかりません')
      return null
    }
    
    // 3. 優先度付けして上位を選択
    const prioritizedCandidates = candidates
      .map(location => ({
        ...location,
        episodes_count: locationEpisodeCount.get(location.id) || 0
      }))
      .sort((a, b) => {
        // 1. エピソード数の多い順
        if (b.episodes_count !== a.episodes_count) {
          return b.episodes_count - a.episodes_count
        }
        // 2. 住所が詳細な順（詳細情報があるほうが見つけやすい）
        const aDetailScore = (a.address?.length || 0) + (a.station?.length || 0)
        const bDetailScore = (b.address?.length || 0) + (b.station?.length || 0)
        return bDetailScore - aDetailScore
      })
      .slice(0, batchSize)
    
    console.log(`✅ 優先選択: ${prioritizedCandidates.length}件`)
    
    // 4. 各候補のエピソード詳細を取得
    console.log('\n🏆 【今回のバッチ候補】')
    console.log('='.repeat(60))
    
    const batchDetails = []
    
    for (let i = 0; i < prioritizedCandidates.length; i++) {
      const candidate = prioritizedCandidates[i]
      
      // このロケーションのエピソード情報を取得
      const { data: episodeDetails } = await supabase
        .from('episode_locations')
        .select(`
          episode_id,
          episodes(
            id, title, date, view_count,
            celebrities(name, slug)
          )
        `)
        .eq('location_id', candidate.id)
        .order('episodes(view_count)', { ascending: false })
      
      const mostPopularEpisode = episodeDetails?.[0]?.episodes
      const allEpisodes = episodeDetails?.map(ed => ed.episodes) || []
      
      const details = {
        priority: i + 1,
        location_id: candidate.id,
        name: candidate.name,
        address: candidate.address,
        station: candidate.station,
        episodes_count: candidate.episodes_count,
        most_popular_episode: mostPopularEpisode,
        all_episodes: allEpisodes,
        estimated_monthly_revenue: candidate.episodes_count * 120
      }
      
      batchDetails.push(details)
      
      console.log(`\n${i + 1}. ${candidate.name}`)
      console.log(`   🆔 ID: ${candidate.id}`)
      console.log(`   📍 住所: ${candidate.address || '未設定'}`)
      console.log(`   🚉 最寄駅: ${candidate.station || '未設定'}`)
      console.log(`   📺 エピソード数: ${candidate.episodes_count}件`)
      console.log(`   🌟 人気エピソード: ${mostPopularEpisode?.title || '不明'}`)
      console.log(`   👤 芸能人: ${mostPopularEpisode?.celebrities?.name || '不明'}`)
      console.log(`   💰 予想月間収益: ¥${details.estimated_monthly_revenue}`)
      
      if (allEpisodes.length > 1) {
        console.log(`   📋 その他のエピソード: ${allEpisodes.slice(1).map(ep => ep?.title).join(', ')}`)
      }
    }
    
    // 5. バッチサマリー
    const totalEstimatedRevenue = batchDetails.reduce((sum, detail) => sum + detail.estimated_monthly_revenue, 0)
    const avgEpisodesPerLocation = Math.round(
      batchDetails.reduce((sum, detail) => sum + detail.episodes_count, 0) / batchDetails.length
    )
    
    console.log('\n💡 【バッチサマリー】')
    console.log('='.repeat(40))
    console.log(`✅ 対象店舗数: ${batchDetails.length}件`)
    console.log(`✅ 平均エピソード数: ${avgEpisodesPerLocation}件/店舗`)
    console.log(`✅ 予想追加収益: ¥${totalEstimatedRevenue}/月`)
    console.log(`✅ 現在収益との比較: +${Math.round(totalEstimatedRevenue/1800*100)}%`)
    
    // 6. 次のアクション指示
    console.log('\n🚀 【次のアクション】')
    console.log('='.repeat(60))
    console.log('上記の店舗について、以下の手順でTabelogアフィリエイトリンクを追加してください:')
    console.log('')
    console.log('1. Google検索で店舗の食べログページを特定')
    console.log('2. ValueCommerce経由でアフィリエイトリンクを生成')
    console.log('3. 以下のコマンドで各店舗を更新:')
    console.log('')
    
    batchDetails.forEach((detail, idx) => {
      console.log(`## ${idx + 1}. ${detail.name}`)
      console.log(`npx tsx src/scripts/valuecommerce-tabelog-converter.ts --action add-single \\`)
      console.log(`  --location-id ${detail.location_id} \\`)
      console.log(`  --url '[食べログのアフィリエイトURL]'`)
      console.log('')
    })
    
    console.log('4. 全て完了後、効果測定:')
    console.log('npx tsx src/scripts/final-migration-verification.ts')
    
    return {
      batch_size: batchDetails.length,
      total_estimated_revenue: totalEstimatedRevenue,
      candidates: batchDetails
    }
    
  } catch (error) {
    console.error('❌ バッチ生成エラー:', error)
    return null
  }
}

// CLI引数処理
const batchSize = process.argv.includes('--batch-size') 
  ? parseInt(process.argv[process.argv.indexOf('--batch-size') + 1]) 
  : 10

// 実行
if (import.meta.url === `file://${__filename}`) {
  generateTabelogExpansionBatch(batchSize)
}

export { generateTabelogExpansionBatch }