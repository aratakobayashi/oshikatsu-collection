#!/usr/bin/env node

/**
 * 松重豊 Season4 データ分析・展開戦略
 * Season1(100%)+Season2(92%)+Season3(58%修正済み)の成功に続く、Season4完全収益化への道筋
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeMatsushigeSeason4() {
  console.log('🍜 松重豊 Season4 分析・展開戦略構築...\n')
  console.log('Season1(100%)+Season2(92%)+Season3(修正済み)の成功モデルをSeason4に適用！')
  console.log('=' .repeat(60))
  
  try {
    // 松重豊の全データ取得
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
            location_id,
            locations(
              id,
              name,
              address,
              tabelog_url,
              affiliate_info,
              description
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
    
    // Season別分析
    const season1Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season1'))
    const season2Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season2'))
    const season3Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season3'))
    const season4Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season4'))
    
    console.log(`✅ 松重豊 基本情報:`)
    console.log(`   総エピソード: ${celebrity.episodes.length}話`)
    console.log(`   Season1: ${season1Episodes.length}話`)
    console.log(`   Season2: ${season2Episodes.length}話`)
    console.log(`   Season3: ${season3Episodes.length}話`)
    console.log(`   Season4: ${season4Episodes.length}話`)
    
    // 既存Season実績サマリー
    const season1LocationCount = season1Episodes.reduce((total: number, ep: any) => 
      total + (ep.episode_locations?.length || 0), 0)
    const season1MonetizedCount = season1Episodes.reduce((total: number, ep: any) => {
      if (!ep.episode_locations) return total
      return total + ep.episode_locations.filter((epLoc: any) => 
        epLoc.locations?.affiliate_info?.linkswitch?.status === 'active').length
    }, 0)
    
    const season2LocationCount = season2Episodes.reduce((total: number, ep: any) => 
      total + (ep.episode_locations?.length || 0), 0)
    const season2MonetizedCount = season2Episodes.reduce((total: number, ep: any) => {
      if (!ep.episode_locations) return total
      return total + ep.episode_locations.filter((epLoc: any) => 
        epLoc.locations?.affiliate_info?.linkswitch?.status === 'active').length
    }, 0)
    
    const season3LocationCount = season3Episodes.reduce((total: number, ep: any) => 
      total + (ep.episode_locations?.length || 0), 0)
    const season3MonetizedCount = season3Episodes.reduce((total: number, ep: any) => {
      if (!ep.episode_locations) return total
      return total + ep.episode_locations.filter((epLoc: any) => 
        epLoc.locations?.affiliate_info?.linkswitch?.status === 'active').length
    }, 0)
    
    console.log('\n📊 既存実績サマリー:')
    console.log(`   Season1: ${season1MonetizedCount}/${season1LocationCount}箇所 (${Math.round((season1MonetizedCount/season1LocationCount)*100)}%収益化)`)
    console.log(`   Season2: ${season2MonetizedCount}/${season2LocationCount}箇所 (${Math.round((season2MonetizedCount/season2LocationCount)*100)}%収益化)`)
    console.log(`   Season3: ${season3MonetizedCount}/${season3LocationCount}箇所 (${Math.round((season3MonetizedCount/season3LocationCount)*100)}%収益化)`)
    console.log(`   合計: ${season1MonetizedCount + season2MonetizedCount + season3MonetizedCount}箇所`)
    
    if (season4Episodes.length === 0) {
      console.log('\n⚠️ Season4エピソードが見つかりません')
      console.log('データ追加が必要、または別の検索条件でSeason4を特定する必要があります')
      return
    }
    
    console.log(`\n🎯 Season4 詳細分析 (${season4Episodes.length}話):`)
    console.log('-' .repeat(40))
    
    let season4LocationsTotal = 0
    let season4LocationsWithTabelog = 0
    let season4LocationsWithLinkSwitch = 0
    let season4QualityIssues: string[] = []
    
    season4Episodes.forEach((episode: any, index: number) => {
      const locationCount = episode.episode_locations?.length || 0
      season4LocationsTotal += locationCount
      
      console.log(`\n📺 Episode ${index + 1}: ${episode.title}`)
      
      if (locationCount > 0) {
        console.log(`   ロケーション: ${locationCount}箇所`)
        
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   ${locIndex + 1}. ${location.name}`)
            console.log(`      住所: ${location.address || '不明'}`)
            
            if (location.tabelog_url) {
              season4LocationsWithTabelog++
              console.log(`      食べログ: ✅ ${location.tabelog_url}`)
              
              if (location.affiliate_info?.linkswitch?.status === 'active') {
                season4LocationsWithLinkSwitch++
                console.log(`      LinkSwitch: ✅ 有効`)
              } else {
                console.log(`      LinkSwitch: ❌ 無効`)
                season4QualityIssues.push(`Episode ${index + 1}: ${location.name} - LinkSwitch未設定`)
              }
            } else {
              console.log(`      食べログ: ❌ なし`)
              season4QualityIssues.push(`Episode ${index + 1}: ${location.name} - 食べログURL欠如`)
            }
          }
        })
      } else {
        console.log(`   ロケーション: ❌ データなし`)
        season4QualityIssues.push(`Episode ${index + 1}: ロケーションデータ不備`)
      }
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 Season4 収益化ポテンシャル分析:')
    
    console.log(`\nSeason4 現状:`)
    console.log(`   エピソード: ${season4Episodes.length}話`)
    console.log(`   総ロケーション: ${season4LocationsTotal}箇所`)
    console.log(`   食べログURL保有: ${season4LocationsWithTabelog}箇所`)
    console.log(`   収益化店舗: ${season4LocationsWithLinkSwitch}箇所`)
    
    if (season4LocationsTotal > 0) {
      const season4TabelogRate = Math.round((season4LocationsWithTabelog / season4LocationsTotal) * 100)
      const season4MonetizationRate = Math.round((season4LocationsWithLinkSwitch / season4LocationsTotal) * 100)
      
      console.log(`   食べログ保有率: ${season4TabelogRate}%`)
      console.log(`   収益化率: ${season4MonetizationRate}%`)
      
      // Season1-3の成功パターンに基づく戦略決定
      console.log('\n🎯 Season4 最適戦略判定:')
      
      const needsLinkSwitchActivation = season4LocationsWithTabelog > season4LocationsWithLinkSwitch
      const needsDataImprovement = season4QualityIssues.filter(issue => issue.includes('データ不備') || issue.includes('URL欠如')).length > 3
      
      let strategy = ''
      if (needsLinkSwitchActivation && season4TabelogRate >= 30) {
        strategy = 'よにのちゃんねる方式（LinkSwitch一括有効化）'
        console.log(`   🟢 推奨戦略: ${strategy}`)
        console.log(`   即座収益化可能: ${season4LocationsWithTabelog - season4LocationsWithLinkSwitch}箇所`)
        console.log(`   理由: 既存食べログURL（${season4TabelogRate}%）のLinkSwitch未有効化`)
        
      } else if (needsDataImprovement) {
        strategy = 'Season1・Season2・Season3方式（段階的データ改善）'
        console.log(`   🟡 推奨戦略: ${strategy}`)
        console.log(`   理由: データ品質改善が必要`)
        console.log(`   アプローチ: 詳細調査→検証→段階的追加`)
        
      } else {
        strategy = 'ハイブリッド方式'
        console.log(`   🔄 推奨戦略: ${strategy}`)
        console.log(`   理由: 既存活用 + 部分改善`)
      }
      
      // 期待効果算出
      const expectedSeason4Revenue = Math.min(season4Episodes.length, 12) // 最大12店舗想定
      const currentTotal = season1MonetizedCount + season2MonetizedCount + season3MonetizedCount
      const potentialTotal = currentTotal + expectedSeason4Revenue
      
      console.log('\n💰 Season4拡大収益ポテンシャル:')
      console.log(`   現在の松重豊収益化: ${currentTotal}箇所`)
      console.log(`   Season4追加可能: ${expectedSeason4Revenue}箇所`)
      console.log(`   最終的収益化: ${potentialTotal}箇所`)
      console.log(`   収益拡大率: +${Math.round((expectedSeason4Revenue / currentTotal) * 100)}%`)
      
      console.log('\n🏆 全Season統合収益化の壮大なビジョン:')
      console.log(`   Season1: ${season1MonetizedCount}箇所（100%達成）`)
      console.log(`   Season2: ${season2MonetizedCount}箇所（92%達成）`)
      console.log(`   Season3: ${season3MonetizedCount}箇所（修正済み）`)
      console.log(`   Season4: ${expectedSeason4Revenue}箇所（目標90-100%）`)
      console.log(`   **最終合計: ${potentialTotal}箇所の収益化帝国**`)
      
    } else {
      console.log('\n⚠️ Season4にロケーションデータがありません')
      console.log('完全な段階的データ構築が必要です')
    }
    
    if (season4QualityIssues.length > 0) {
      console.log('\n⚠️ Season4 品質課題:')
      season4QualityIssues.slice(0, 8).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      if (season4QualityIssues.length > 8) {
        console.log(`   ... その他 ${season4QualityIssues.length - 8}件`)
      }
    }
    
    console.log('\n🚀 Season4 完全攻略計画:')
    if (season4LocationsWithTabelog > season4LocationsWithLinkSwitch) {
      console.log('   Phase 1: 【即座実行】LinkSwitch一括有効化')
      console.log('   Phase 2: 残りデータの詳細調査')
      console.log('   Phase 3: 段階的品質改善')
    } else {
      console.log('   Phase 1: Season4エピソード別詳細調査')
      console.log('   Phase 2: 営業中店舗の完全特定')
      console.log('   Phase 3: Season1-3方式での段階的データ追加')
    }
    console.log('   Phase 4: Season4完全収益化達成')
    console.log('   Phase 5: 松重豊全Season収益化帝国完成')
    
    console.log('\n🌟 Season4で松重豊の収益化帝国が究極体になります！')
    console.log('Season1-3で実証された成功手法の最終完成形です！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeMatsushigeSeason4().catch(console.error)