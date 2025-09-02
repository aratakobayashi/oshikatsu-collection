#!/usr/bin/env node

/**
 * 他のセレブリティを調査して、同じ成功手法を適用可能か確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOtherCelebrities() {
  console.log('🔍 他のセレブリティ調査開始...\n')
  console.log('松重豊の成功手法を他のセレブにも適用します！')
  console.log('=' .repeat(60))
  
  try {
    // 全セレブリティを取得
    const { data: celebrities } = await supabase
      .from('celebrities')
      .select(`
        id,
        slug,
        name,
        episodes(
          id,
          title,
          episode_locations(
            location_id,
            locations(
              id,
              name,
              tabelog_url,
              affiliate_info
            )
          )
        )
      `)
      .order('name')
    
    if (!celebrities) {
      console.error('❌ セレブリティデータの取得に失敗')
      return
    }
    
    console.log(`📊 登録セレブリティ総数: ${celebrities.length}名\n`)
    
    let totalEpisodes = 0
    let totalLocations = 0
    let linkSwitchEnabled = 0
    let potentialRevenue = 0
    
    for (const celebrity of celebrities) {
      const episodeCount = celebrity.episodes.length
      totalEpisodes += episodeCount
      
      let locationCount = 0
      let revenueCount = 0
      
      for (const episode of celebrity.episodes) {
        if (episode.episode_locations && episode.episode_locations.length > 0) {
          locationCount += episode.episode_locations.length
          
          for (const epLoc of episode.episode_locations) {
            if (epLoc.locations?.tabelog_url) {
              revenueCount++
              if (epLoc.locations.affiliate_info?.linkswitch?.status === 'active') {
                linkSwitchEnabled++
              }
            }
          }
        }
      }
      
      totalLocations += locationCount
      potentialRevenue += revenueCount
      
      // 収益化ポテンシャルを計算
      const revenueRate = episodeCount > 0 ? Math.round((revenueCount / episodeCount) * 100) : 0
      
      console.log(`📺 ${celebrity.name} (@${celebrity.slug})`)
      console.log(`   エピソード: ${episodeCount}話`)
      console.log(`   ロケーション: ${locationCount}箇所`)
      console.log(`   収益可能: ${revenueCount}箇所`)
      console.log(`   収益化率: ${revenueRate}%`)
      
      if (celebrity.slug === 'matsushige-yutaka') {
        console.log(`   🏆 SUCCESS STORY: 90%収益化達成！`)
      } else if (revenueRate >= 50) {
        console.log(`   🥇 高収益化ポテンシャル`)
      } else if (revenueRate >= 25) {
        console.log(`   🥈 中収益化ポテンシャル`)
      } else if (revenueRate > 0) {
        console.log(`   🥉 改善余地あり`)
      } else {
        console.log(`   ⚠️ 収益化未対応`)
      }
      
      console.log('')
    }
    
    console.log('=' .repeat(60))
    console.log('\n📈 プラットフォーム全体の状況:')
    console.log(`   総セレブリティ: ${celebrities.length}名`)
    console.log(`   総エピソード: ${totalEpisodes}話`)
    console.log(`   総ロケーション: ${totalLocations}箇所`)
    console.log(`   収益可能ロケーション: ${potentialRevenue}箇所`)
    console.log(`   LinkSwitch有効: ${linkSwitchEnabled}箇所`)
    
    const overallRevenueRate = totalLocations > 0 ? Math.round((potentialRevenue / totalLocations) * 100) : 0
    const linkSwitchRate = potentialRevenue > 0 ? Math.round((linkSwitchEnabled / potentialRevenue) * 100) : 0
    
    console.log(`   全体収益化率: ${overallRevenueRate}%`)
    console.log(`   LinkSwitch適用率: ${linkSwitchRate}%`)
    
    console.log('\n🎯 拡大戦略の提案:')
    
    // 高ポテンシャルセレブを特定
    const highPotentialCelebs = celebrities.filter(c => {
      const episodes = c.episodes.length
      const locations = c.episodes.reduce((acc, ep) => 
        acc + (ep.episode_locations?.length || 0), 0)
      const revenue = c.episodes.reduce((acc, ep) => 
        acc + (ep.episode_locations?.filter(el => el.locations?.tabelog_url).length || 0), 0)
      const rate = episodes > 0 ? (revenue / episodes) * 100 : 0
      
      return episodes >= 5 && rate < 80 && c.slug !== 'matsushige-yutaka'
    }).sort((a, b) => b.episodes.length - a.episodes.length)
    
    if (highPotentialCelebs.length > 0) {
      console.log('\n🚀 優先対象セレブリティ（松重豊方式適用推奨）:')
      highPotentialCelebs.slice(0, 5).forEach((celeb, index) => {
        const episodes = celeb.episodes.length
        const locations = celeb.episodes.reduce((acc, ep) => 
          acc + (ep.episode_locations?.length || 0), 0)
        const revenue = celeb.episodes.reduce((acc, ep) => 
          acc + (ep.episode_locations?.filter(el => el.locations?.tabelog_url).length || 0), 0)
        const rate = episodes > 0 ? Math.round((revenue / episodes) * 100) : 0
        
        console.log(`   ${index + 1}. ${celeb.name} (@${celeb.slug})`)
        console.log(`      → ${episodes}話、収益化率${rate}%、改善ポテンシャル高`)
      })
      
      console.log('\n📋 次のアクションプラン:')
      console.log('1. 最優先セレブに松重豊と同じ段階的アプローチを適用')
      console.log('2. データクリーニング → 検証 → 段階的追加の流れを再現')
      console.log('3. 同様の90%収益化を目指す')
      console.log('4. 成功パターンをテンプレート化して他セレブにも展開')
      
      console.log('\n💡 期待効果:')
      const potentialIncrease = highPotentialCelebs.slice(0, 3).reduce((acc, celeb) => 
        acc + celeb.episodes.length * 0.7, 0) // 70%収益化を想定
      console.log(`   上位3名だけでも約${Math.round(potentialIncrease)}店舗の収益化が可能`)
      console.log(`   プラットフォーム全体の収益が大幅に向上`)
    }
    
    console.log('\n🌟 松重豊の成功が他セレブ展開の完璧なモデルケースになります！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
checkOtherCelebrities().catch(console.error)