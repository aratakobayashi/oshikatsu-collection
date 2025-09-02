#!/usr/bin/env node

/**
 * ≠ME データ分析 - 松重豊/よにのちゃんねる方式適用可能性調査
 * 252エピソード、8%収益化率の詳細分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeNotEqualMePotential() {
  console.log('🎭 ≠ME データ分析開始...\n')
  console.log('松重豊(90%)/よにのちゃんねる(100%)の成功手法適用可能性を調査')
  console.log('=' .repeat(60))
  
  try {
    // ≠MEのデータを詳細取得
    const { data: notEqualMe } = await supabase
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
      .eq('slug', 'not-equal-me')
      .single()
    
    if (!notEqualMe) {
      console.error('❌ ≠MEのデータが見つかりません')
      return
    }
    
    console.log(`✅ ≠ME 基本情報:`)
    console.log(`   ID: ${notEqualMe.id}`)
    console.log(`   名前: ${notEqualMe.name}`)
    console.log(`   エピソード総数: ${notEqualMe.episodes.length}話`)
    
    // データ品質分析
    let episodesWithLocations = 0
    let episodesWithoutLocations = 0
    let locationsWithTabelog = 0
    let locationsWithLinkSwitch = 0
    let locationsNeedingLinkSwitch = 0
    let totalLocations = 0
    let qualityIssues = []
    let locationTypeAnalysis: { [key: string]: number } = {}
    let tabelogUrls: string[] = []
    
    console.log('\n📊 詳細データ分析（最初の20エピソード）:')
    console.log('-' .repeat(40))
    
    for (let i = 0; i < Math.min(20, notEqualMe.episodes.length); i++) {
      const episode = notEqualMe.episodes[i]
      const locationCount = episode.episode_locations?.length || 0
      totalLocations += locationCount
      
      if (locationCount > 0) {
        episodesWithLocations++
        console.log(`\n📺 Episode ${i + 1}: ${episode.title}`)
        console.log(`   ロケーション: ${locationCount}箇所`)
        
        episode.episode_locations?.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   ${locIndex + 1}. ${location.name}`)
            console.log(`      住所: ${location.address || '不明'}`)
            
            // ロケーションタイプ分析
            const locName = location.name.toLowerCase()
            const locDesc = (location.description || '').toLowerCase()
            if (locName.includes('レストラン') || locName.includes('料理') || locName.includes('食') || 
                locName.includes('カフェ') || locName.includes('グルメ') || locDesc.includes('食')) {
              locationTypeAnalysis['食事系'] = (locationTypeAnalysis['食事系'] || 0) + 1
            } else if (locName.includes('観光') || locName.includes('名所') || locName.includes('公園') || 
                     locName.includes('神社') || locName.includes('寺')) {
              locationTypeAnalysis['観光地'] = (locationTypeAnalysis['観光地'] || 0) + 1
            } else if (locName.includes('店') || locName.includes('ショップ') || locDesc.includes('買い物')) {
              locationTypeAnalysis['ショッピング'] = (locationTypeAnalysis['ショッピング'] || 0) + 1
            } else {
              locationTypeAnalysis['その他'] = (locationTypeAnalysis['その他'] || 0) + 1
            }
            
            if (location.tabelog_url) {
              locationsWithTabelog++
              tabelogUrls.push(location.tabelog_url)
              console.log(`      食べログ: ✅ ${location.tabelog_url}`)
              
              if (location.affiliate_info?.linkswitch?.status === 'active') {
                locationsWithLinkSwitch++
                console.log(`      LinkSwitch: ✅ 有効`)
              } else {
                locationsNeedingLinkSwitch++
                console.log(`      LinkSwitch: ❌ 無効 → 即座に有効化可能`)
                qualityIssues.push(`Episode ${i + 1}: ${location.name} - LinkSwitch未設定（即座に有効化可能）`)
              }
            } else {
              console.log(`      食べログ: ❌ なし`)
              if (locationTypeAnalysis['食事系'] && 
                  locName.includes('食') || locName.includes('レストラン') || locName.includes('カフェ')) {
                qualityIssues.push(`Episode ${i + 1}: ${location.name} - 食べログURL欠如（要調査）`)
              }
            }
          }
        })
      } else {
        episodesWithoutLocations++
        console.log(`\n📺 Episode ${i + 1}: ${episode.title}`)
        console.log(`   ロケーション: ❌ データなし`)
        qualityIssues.push(`Episode ${i + 1}: ロケーションデータ不備`)
      }
    }
    
    // 全体統計（サンプリングベース）
    const sampleSize = Math.min(20, notEqualMe.episodes.length)
    const estimatedTotalLocations = Math.round((totalLocations / sampleSize) * notEqualMe.episodes.length)
    const estimatedTabelogRate = totalLocations > 0 ? Math.round((locationsWithTabelog / totalLocations) * 100) : 0
    const estimatedLinkSwitchRate = locationsWithTabelog > 0 ? Math.round((locationsWithLinkSwitch / locationsWithTabelog) * 100) : 0
    const needsLinkSwitchActivation = locationsNeedingLinkSwitch > 0
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎯 ≠ME 収益化ポテンシャル分析:')
    console.log(`   エピソード総数: ${notEqualMe.episodes.length}話`)
    console.log(`   推定総ロケーション: ${estimatedTotalLocations}箇所`)
    console.log(`   現在の食べログURL率: ${estimatedTabelogRate}%`)
    console.log(`   現在のLinkSwitch率: ${estimatedLinkSwitchRate}%`)
    console.log(`   LinkSwitch未設定: ${locationsNeedingLinkSwitch}箇所`)
    
    console.log('\n🍽️ ロケーションタイプ分析:')
    Object.entries(locationTypeAnalysis).forEach(([type, count]) => {
      const percentage = Math.round((count / totalLocations) * 100)
      console.log(`   ${type}: ${count}箇所 (${percentage}%)`)
    })
    
    // 最適な収益化戦略を決定
    const foodRelatedRatio = (locationTypeAnalysis['食事系'] || 0) / totalLocations
    const hasExistingTabelogUrls = estimatedTabelogRate > 0
    let recommendedStrategy = ''
    
    console.log('\n💰 収益化戦略分析:')
    
    if (needsLinkSwitchActivation && hasExistingTabelogUrls) {
      recommendedStrategy = 'よにのちゃんねる方式（LinkSwitch一括有効化）'
      console.log(`   🟢 推奨戦略: ${recommendedStrategy}`)
      console.log(`   理由: 既存食べログURL（${estimatedTabelogRate}%）のLinkSwitch未有効化`)
      console.log(`   期待効果: 即座に${locationsNeedingLinkSwitch}箇所の収益化`)
      
      const immediateRevenue = Math.round(estimatedTotalLocations * (estimatedTabelogRate / 100))
      console.log(`   即座収益化可能: ${immediateRevenue}箇所`)
      console.log(`   追加収益可能性: ${estimatedTotalLocations - immediateRevenue}箇所`)
      
    } else if (foodRelatedRatio > 0.3) {
      recommendedStrategy = '松重豊方式（段階的データ改善）'
      console.log(`   🟡 推奨戦略: ${recommendedStrategy}`)
      console.log(`   理由: 食事系コンテンツ${Math.round(foodRelatedRatio * 100)}%`)
      console.log(`   アプローチ: データクリーニング → 段階的追加`)
      
    } else {
      recommendedStrategy = 'ハイブリッド方式'
      console.log(`   🔄 推奨戦略: ${recommendedStrategy}`)
      console.log(`   理由: 混合コンテンツ（食事系${Math.round(foodRelatedRatio * 100)}%）`)
      console.log(`   アプローチ: 既存活用 + 選択的改善`)
    }
    
    console.log('\n📈 期待収益効果:')
    if (needsLinkSwitchActivation) {
      const immediateImpact = Math.round(estimatedTotalLocations * (estimatedTabelogRate / 100) * 0.95)
      console.log(`   即座収益化: +${immediateImpact}箇所`)
      console.log(`   追加改善余地: ${estimatedTotalLocations - immediateImpact}箇所`)
      console.log(`   総収益ポテンシャル: ${Math.round(estimatedTotalLocations * 0.8)}箇所（80%目標）`)
    }
    
    if (qualityIssues.length > 0) {
      console.log('\n⚠️ 発見された課題:')
      const linkSwitchIssues = qualityIssues.filter(issue => issue.includes('LinkSwitch未設定'))
      const dataIssues = qualityIssues.filter(issue => !issue.includes('LinkSwitch未設定'))
      
      if (linkSwitchIssues.length > 0) {
        console.log(`   🔧 LinkSwitch未設定: ${linkSwitchIssues.length}件（即座に解決可能）`)
      }
      if (dataIssues.length > 0) {
        console.log(`   📝 データ改善必要: ${dataIssues.length}件`)
        dataIssues.slice(0, 3).forEach(issue => console.log(`      - ${issue}`))
      }
    }
    
    console.log('\n🎊 ≠ME = 次の収益化ターゲット!')
    console.log(`252エピソードで${recommendedStrategy}を適用します！`)
    
    console.log('\n📋 実行計画:')
    if (needsLinkSwitchActivation) {
      console.log('1. 【即座実行】LinkSwitch一括有効化')
      console.log(`2. ${locationsNeedingLinkSwitch}箇所の即座収益化`)
      console.log('3. データ品質向上（必要に応じて）')
    } else {
      console.log('1. データ品質詳細調査')
      console.log('2. 収益化優先箇所の特定')
      console.log('3. 段階的改善実装')
    }
    console.log('4. 他セレブへの展開')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeNotEqualMePotential().catch(console.error)