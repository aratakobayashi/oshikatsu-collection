#!/usr/bin/env npx tsx

/**
 * シンプルなTabelogアフィリエイト拡張分析
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

async function simpleTabelogAnalysis() {
  console.log('📊 シンプルTabelogアフィリエイト拡張分析')
  console.log('='.repeat(60))
  
  try {
    // 1. 基本統計
    console.log('\n🔍 【基本統計】')
    console.log('='.repeat(40))
    
    // 全ロケーション数
    const { count: totalLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    // アフィリエイト済み
    const { count: affiliateLocations } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('tabelog_url', 'is', null)
    
    // エピソード紐付きロケーション数
    const { count: episodeLinkedCount } = await supabase
      .from('episode_locations')
      .select('location_id', { count: 'exact', head: true })
    
    console.log(`✅ 全ロケーション数: ${totalLocations}件`)
    console.log(`✅ アフィリエイト済み: ${affiliateLocations}件`)
    console.log(`✅ エピソード紐付き: ${episodeLinkedCount}件`)
    
    // 2. 拡張対象の特定
    console.log('\n🎯 【拡張対象特定】')
    console.log('='.repeat(40))
    
    // エピソード紐付きでアフィリエイト未設定の店舗を取得
    // まずepisode_locationsから重複除去したlocation_idを取得
    const { data: uniqueLocationIds } = await supabase
      .from('episode_locations')
      .select('location_id')
    
    const locationIdSet = new Set(uniqueLocationIds?.map(el => el.location_id))
    
    // アフィリエイト未設定のロケーションを取得
    const { data: expansionTargets } = await supabase
      .from('locations')
      .select('id, name, address, station, tabelog_url')
      .is('tabelog_url', null)
      .in('id', Array.from(locationIdSet))
      .limit(50) // より多くのサンプルを取得
    
    const potentialTargets = expansionTargets?.length || 0
    
    console.log(`✅ 拡張対象候補: ${potentialTargets}件 (サンプル20件表示)`)
    
    // 3. 収益計算
    console.log('\n💰 【収益ポテンシャル】')
    console.log('='.repeat(40))
    
    const currentRevenue = affiliateLocations! * 120
    const fullPotentialRevenue = episodeLinkedCount! * 120
    const expansionPotential = fullPotentialRevenue - currentRevenue
    
    console.log(`✅ 現在の月間収益: ¥${currentRevenue}`)
    console.log(`✅ 最大ポテンシャル: ¥${fullPotentialRevenue}`)
    console.log(`✅ 拡張可能収益: ¥${expansionPotential}`)
    console.log(`✅ 成長倍率: ${Math.round(fullPotentialRevenue / currentRevenue)}倍`)
    
    // 4. TOP候補リスト
    if (expansionTargets && expansionTargets.length > 0) {
      console.log('\n🏆 【TOP拡張候補】')
      console.log('='.repeat(40))
      
      // エピソード情報を取得して表示
      for (let idx = 0; idx < Math.min(10, expansionTargets.length); idx++) {
        const target = expansionTargets[idx]
        
        // このロケーションのエピソード情報を取得
        const { data: episodeInfo } = await supabase
          .from('episode_locations')
          .select(`
            episodes(title, celebrities(name))
          `)
          .eq('location_id', target.id)
          .limit(1)
        
        const firstEpisode = episodeInfo?.[0]?.episodes
        const episodeName = firstEpisode?.title || '不明'
        const celebrityName = firstEpisode?.celebrities?.name || '不明'
        
        console.log(`${idx + 1}. ${target.name}`)
        console.log(`   ID: ${target.id}`)
        console.log(`   住所: ${target.address || '不明'}`)
        console.log(`   最寄駅: ${target.station || '不明'}`)
        console.log(`   エピソード: ${episodeName}`)
        console.log(`   芸能人: ${celebrityName}`)
        console.log('')
      }
    }
    
    // 5. 推奨戦略
    console.log('\n🚀 【推奨実装戦略】')
    console.log('='.repeat(60))
    
    console.log('📋 **最適なアプローチ**: locationsテーブル直接更新')
    console.log('')
    console.log('✅ **理由**:')
    console.log('  • tabelog_urlカラムが既に存在し、構造変更不要')
    console.log('  • 中間テーブル移行完了済みで安全に実装可能')
    console.log('  • フロントエンドの追加修正不要')
    console.log('  • 既存15店舗と同じ方式で一貫性保持')
    
    console.log('\n📝 **具体的な依頼方法**:')
    console.log('```')
    console.log('以下の店舗にTabelogアフィリエイトリンクを追加してください:')
    console.log('')
    console.log('Location ID: [上記のID]')
    console.log('店舗名: [店舗名]')
    console.log('住所: [住所情報]')
    console.log('```')
    
    console.log('\n⚡ **効率的な進め方**:')
    console.log('  1. 上記TOP10から開始（確実にエピソード紐付き済み）')
    console.log('  2. 5店舗ずつバッチで処理して効果測定')
    console.log('  3. 収益効果確認後、次の5店舗を追加')
    console.log('  4. 段階的に全対象店舗まで拡張')
    
    console.log('\n💡 **拡張後の予想効果**:')
    console.log(`  • 段階1 (5店舗): +¥${5 * 120}/月`)
    console.log(`  • 段階2 (10店舗): +¥${10 * 120}/月`)
    console.log(`  • 段階3 (20店舗): +¥${20 * 120}/月`)
    console.log(`  • 最大 (全${Math.floor(episodeLinkedCount!/10)*10}店舗): +¥${Math.floor(expansionPotential/1000)*1000}/月`)
    
    return {
      current_affiliates: affiliateLocations,
      potential_targets: episodeLinkedCount! - affiliateLocations!,
      expansion_revenue: expansionPotential,
      top_candidates: expansionTargets?.slice(0, 10)
    }
    
  } catch (error) {
    console.error('❌ 分析エラー:', error)
    return null
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  simpleTabelogAnalysis()
}

export { simpleTabelogAnalysis }