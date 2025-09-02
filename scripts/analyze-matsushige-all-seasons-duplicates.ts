#!/usr/bin/env node

/**
 * 松重豊 全Season 重複ロケーション詳細分析
 * Season1, Season2, Season3での1エピソード複数ロケーション問題を調査
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeMatsushigeAllSeasonsDuplicates() {
  console.log('🔍 松重豊 全Season 重複ロケーション詳細分析...\n')
  console.log('1エピソード複数ロケーション問題を全季調査')
  console.log('=' .repeat(60))
  
  try {
    // 松重豊の全エピソードと関連ロケーションを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select(`
        id,
        slug,
        name,
        episodes(
          id,
          title,
          description,
          episode_locations(
            id,
            location_id,
            locations(
              id,
              name,
              address,
              tabelog_url,
              affiliate_info
            )
          )
        )
      `)
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊のデータが見つかりません')
      return
    }
    
    console.log(`✅ 松重豊 総エピソード: ${celebrity.episodes.length}話`)
    
    // Season別分析
    const season1Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season1'))
    const season2Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season2'))
    const season3Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season3'))
    
    console.log(`\n📊 Season別エピソード数:`)
    console.log(`   Season1: ${season1Episodes.length}話`)
    console.log(`   Season2: ${season2Episodes.length}話`)
    console.log(`   Season3: ${season3Episodes.length}話`)
    
    // 重複ロケーション分析関数
    function analyzeDuplicateLocations(episodes: any[], seasonName: string) {
      console.log(`\n🎯 ${seasonName} 重複ロケーション分析:`)
      console.log('-' .repeat(40))
      
      let totalEpisodes = 0
      let episodesWithMultipleLocations = 0
      let duplicateDetails: any[] = []
      
      episodes.forEach((episode: any, index: number) => {
        const locationCount = episode.episode_locations?.length || 0
        totalEpisodes++
        
        if (locationCount > 1) {
          episodesWithMultipleLocations++
          
          console.log(`\n⚠️ ${episode.title}`)
          console.log(`   ロケーション数: ${locationCount}箇所 (重複!)`)
          
          const duplicateEntry = {
            episodeTitle: episode.title,
            locationCount: locationCount,
            locations: []
          }
          
          episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
            const location = epLoc.locations
            if (location) {
              console.log(`   ${locIndex + 1}. ${location.name}`)
              console.log(`      住所: ${location.address || '不明'}`)
              console.log(`      食べログ: ${location.tabelog_url ? '✅' : '❌'}`)
              console.log(`      LinkSwitch: ${location.affiliate_info?.linkswitch?.status === 'active' ? '✅' : '❌'}`)
              
              duplicateEntry.locations.push({
                name: location.name,
                address: location.address,
                tabelog_url: location.tabelog_url,
                linkswitch_active: location.affiliate_info?.linkswitch?.status === 'active'
              })
            }
          })
          
          duplicateDetails.push(duplicateEntry)
        }
      })
      
      console.log(`\n📊 ${seasonName} サマリー:`)
      console.log(`   総エピソード: ${totalEpisodes}話`)
      console.log(`   重複ありエピソード: ${episodesWithMultipleLocations}話`)
      console.log(`   重複なしエピソード: ${totalEpisodes - episodesWithMultipleLocations}話`)
      console.log(`   重複率: ${Math.round((episodesWithMultipleLocations / totalEpisodes) * 100)}%`)
      
      return {
        seasonName,
        totalEpisodes,
        episodesWithMultipleLocations,
        duplicateRate: Math.round((episodesWithMultipleLocations / totalEpisodes) * 100),
        duplicateDetails
      }
    }
    
    // 各Seasonを分析
    const season1Analysis = analyzeDuplicateLocations(season1Episodes, 'Season1')
    const season2Analysis = analyzeDuplicateLocations(season2Episodes, 'Season2')
    const season3Analysis = analyzeDuplicateLocations(season3Episodes, 'Season3')
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🏆 全Season 重複ロケーション分析結果:')
    
    const allAnalyses = [season1Analysis, season2Analysis, season3Analysis]
    let totalDuplicateEpisodes = 0
    let totalEpisodes = 0
    
    allAnalyses.forEach(analysis => {
      totalEpisodes += analysis.totalEpisodes
      totalDuplicateEpisodes += analysis.episodesWithMultipleLocations
      
      console.log(`\n📺 ${analysis.seasonName}:`)
      console.log(`   重複エピソード: ${analysis.episodesWithMultipleLocations}/${analysis.totalEpisodes}話 (${analysis.duplicateRate}%)`)
      
      if (analysis.episodesWithMultipleLocations > 0) {
        console.log(`   ⚠️ 重複問題あり - 要修正`)
      } else {
        console.log(`   ✅ 重複問題なし - 完璧`)
      }
    })
    
    console.log(`\n🎯 総合分析結果:`)
    console.log(`   松重豊総エピソード: ${totalEpisodes}話`)
    console.log(`   重複問題エピソード: ${totalDuplicateEpisodes}話`)
    console.log(`   正常エピソード: ${totalEpisodes - totalDuplicateEpisodes}話`)
    console.log(`   全体重複率: ${Math.round((totalDuplicateEpisodes / totalEpisodes) * 100)}%`)
    
    if (totalDuplicateEpisodes === 0) {
      console.log('\n🎊🎊🎊 完璧！重複ロケーション問題は0件！ 🎊🎊🎊')
      console.log('\n✅ データ品質状況:')
      console.log('   - 全エピソードが1ロケーションのみ')
      console.log('   - 重複削除作業完了済み')
      console.log('   - 収益化効率最大化達成')
      console.log('   - ユーザー体験最適化')
    } else {
      console.log('\n⚠️ 重複問題要対応:')
      console.log(`   ${totalDuplicateEpisodes}話で重複ロケーション発見`)
      console.log('   収益化効率とデータ品質の向上が必要')
    }
    
    console.log('\n📋 次のアクション:')
    if (totalDuplicateEpisodes === 0) {
      console.log('1. ✅ 重複問題なし - 追加対応不要')
      console.log('2. ✅ 収益化施策継続')
      console.log('3. ✅ 新エピソード追加時の品質維持')
    } else {
      console.log('1. 重複エピソードの詳細調査')
      console.log('2. 正しいロケーションの特定')
      console.log('3. 不正確ロケーションの削除')
      console.log('4. データ品質検証の実施')
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeMatsushigeAllSeasonsDuplicates().catch(console.error)