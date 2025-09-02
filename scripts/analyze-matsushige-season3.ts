#!/usr/bin/env node

/**
 * 松重豊 Season3 データ分析・展開戦略
 * Season1(90%)+Season2(100%)の成功に続く、Season3完全収益化への道筋
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeMatsushigeSeason3() {
  console.log('🍜 松重豊 Season3 分析・展開戦略構築...\n')
  console.log('Season1(90%)+Season2(100%)の成功モデルをSeason3に適用！')
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
    
    console.log(`✅ 松重豊 基本情報:`)
    console.log(`   総エピソード: ${celebrity.episodes.length}話`)
    console.log(`   Season1: ${season1Episodes.length}話`)
    console.log(`   Season2: ${season2Episodes.length}話`)
    console.log(`   Season3: ${season3Episodes.length}話`)
    
    // Season1・Season2の実績サマリー
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
    
    console.log('\\n📊 既存実績サマリー:')
    console.log(`   Season1: ${season1MonetizedCount}/${season1LocationCount}箇所 (${Math.round((season1MonetizedCount/season1LocationCount)*100)}%収益化)`)
    console.log(`   Season2: ${season2MonetizedCount}/${season2LocationCount}箇所 (${Math.round((season2MonetizedCount/season2LocationCount)*100)}%収益化)`)
    console.log(`   合計: ${season1MonetizedCount + season2MonetizedCount}箇所`)
    
    if (season3Episodes.length === 0) {
      console.error('❌ Season3エピソードが見つかりません')
      return
    }
    
    console.log(`\\n🎯 Season3 詳細分析 (${season3Episodes.length}話):`)
    console.log('-' .repeat(40))
    
    let season3LocationsTotal = 0
    let season3LocationsWithTabelog = 0
    let season3LocationsWithLinkSwitch = 0
    let season3QualityIssues: string[] = []
    
    season3Episodes.forEach((episode: any, index: number) => {
      const locationCount = episode.episode_locations?.length || 0
      season3LocationsTotal += locationCount
      
      console.log(`\\n📺 Episode ${index + 1}: ${episode.title}`)
      
      if (locationCount > 0) {
        console.log(`   ロケーション: ${locationCount}箇所`)
        
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   ${locIndex + 1}. ${location.name}`)
            console.log(`      住所: ${location.address || '不明'}`)
            
            if (location.tabelog_url) {
              season3LocationsWithTabelog++
              console.log(`      食べログ: ✅ ${location.tabelog_url}`)
              
              if (location.affiliate_info?.linkswitch?.status === 'active') {
                season3LocationsWithLinkSwitch++
                console.log(`      LinkSwitch: ✅ 有効`)
              } else {
                console.log(`      LinkSwitch: ❌ 無効`)
                season3QualityIssues.push(`Episode ${index + 1}: ${location.name} - LinkSwitch未設定`)
              }
            } else {
              console.log(`      食べログ: ❌ なし`)
              season3QualityIssues.push(`Episode ${index + 1}: ${location.name} - 食べログURL欠如`)
            }
          }
        })
      } else {
        console.log(`   ロケーション: ❌ データなし`)
        season3QualityIssues.push(`Episode ${index + 1}: ロケーションデータ不備`)
      }
    })
    
    console.log('\\n' + '=' .repeat(60))
    console.log('\\n📊 Season3 収益化ポテンシャル分析:')
    
    console.log(`\\nSeason3 現状:`)
    console.log(`   エピソード: ${season3Episodes.length}話`)
    console.log(`   総ロケーション: ${season3LocationsTotal}箇所`)
    console.log(`   食べログURL保有: ${season3LocationsWithTabelog}箇所`)
    console.log(`   収益化店舗: ${season3LocationsWithLinkSwitch}箇所`)
    
    if (season3LocationsTotal > 0) {
      const season3TabelogRate = Math.round((season3LocationsWithTabelog / season3LocationsTotal) * 100)
      const season3MonetizationRate = Math.round((season3LocationsWithLinkSwitch / season3LocationsTotal) * 100)
      
      console.log(`   食べログ保有率: ${season3TabelogRate}%`)
      console.log(`   収益化率: ${season3MonetizationRate}%`)
      
      // Season1・Season2の成功パターンに基づく戦略決定
      console.log('\\n🎯 Season3 最適戦略判定:')
      
      const needsLinkSwitchActivation = season3LocationsWithTabelog > season3LocationsWithLinkSwitch
      const needsDataImprovement = season3QualityIssues.filter(issue => issue.includes('データ不備') || issue.includes('URL欠如')).length > 5
      
      let strategy = ''
      if (needsLinkSwitchActivation && season3TabelogRate >= 25) {
        strategy = 'よにのちゃんねる方式（LinkSwitch一括有効化）'
        console.log(`   🟢 推奨戦略: ${strategy}`)
        console.log(`   即座収益化可能: ${season3LocationsWithTabelog - season3LocationsWithLinkSwitch}箇所`)
        console.log(`   理由: 既存食べログURL（${season3TabelogRate}%）のLinkSwitch未有効化`)
        
      } else if (needsDataImprovement) {
        strategy = 'Season1・Season2方式（段階的データ改善）'
        console.log(`   🟡 推奨戦略: ${strategy}`)
        console.log(`   理由: データ品質改善が必要`)
        console.log(`   アプローチ: 詳細調査→検証→段階的追加`)
        
      } else {
        strategy = 'ハイブリッド方式'
        console.log(`   🔄 推奨戦略: ${strategy}`)
        console.log(`   理由: 既存活用 + 部分改善`)
      }
      
      // 期待効果算出
      const expectedSeason3Revenue = Math.min(season3Episodes.length, 10) // 最大10店舗想定
      const currentTotal = season1MonetizedCount + season2MonetizedCount
      const potentialTotal = currentTotal + expectedSeason3Revenue
      
      console.log('\\n💰 Season3拡大収益ポテンシャル:')
      console.log(`   現在の松重豊収益化: ${currentTotal}箇所`)
      console.log(`   Season3追加可能: ${expectedSeason3Revenue}箇所`)
      console.log(`   最終的収益化: ${potentialTotal}箇所`)
      console.log(`   収益拡大率: +${Math.round((expectedSeason3Revenue / currentTotal) * 100)}%`)
      
      console.log('\\n🏆 全Season統合収益化の壮大なビジョン:')
      console.log(`   Season1: 9箇所（90%達成）`)
      console.log(`   Season2: 12箇所（100%達成）`)
      console.log(`   Season3: ${expectedSeason3Revenue}箇所（目標90-100%）`)
      console.log(`   **最終合計: ${potentialTotal}箇所の収益化帝国**`)
      
    } else {
      console.log('\\n⚠️ Season3にロケーションデータがありません')
      console.log('完全な段階的データ構築が必要です')
    }
    
    if (season3QualityIssues.length > 0) {
      console.log('\\n⚠️ Season3 品質課題:')
      season3QualityIssues.slice(0, 8).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      if (season3QualityIssues.length > 8) {
        console.log(`   ... その他 ${season3QualityIssues.length - 8}件`)
      }
    }
    
    console.log('\\n🚀 Season3 完全攻略計画:')
    if (season3LocationsWithTabelog > season3LocationsWithLinkSwitch) {
      console.log('   Phase 1: 【即座実行】LinkSwitch一括有効化')
      console.log('   Phase 2: 残りデータの詳細調査')
      console.log('   Phase 3: 段階的品質改善')
    } else {
      console.log('   Phase 1: Season3エピソード別詳細調査')
      console.log('   Phase 2: 営業中店舗の完全特定')
      console.log('   Phase 3: Season1・Season2方式での段階的データ追加')
    }
    console.log('   Phase 4: Season3完全収益化達成')
    console.log('   Phase 5: 松重豊全Season収益化帝国完成')
    
    console.log('\\n🌟 Season3で松重豊の収益化帝国が完全体になります！')
    console.log('Season1・Season2で実証された成功手法の最終適用です！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeMatsushigeSeason3().catch(console.error)