#!/usr/bin/env node

/**
 * よにのちゃんねる データ分析 - 松重豊方式適用可能性調査
 * 314エピソード、5%収益化率の詳細分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeYoninoPotential() {
  console.log('📺 よにのちゃんねる データ分析開始...\n')
  console.log('松重豊の90%収益化手法適用可能性を調査します')
  console.log('=' .repeat(60))
  
  try {
    // よにのちゃんねるのデータを詳細取得
    const { data: yonino } = await supabase
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
      .eq('slug', 'よにのちゃんねる')
      .single()
    
    if (!yonino) {
      console.error('❌ よにのちゃんねるのデータが見つかりません')
      return
    }
    
    console.log(`✅ よにのちゃんねる 基本情報:`)
    console.log(`   ID: ${yonino.id}`)
    console.log(`   名前: ${yonino.name}`)
    console.log(`   エピソード総数: ${yonino.episodes.length}話`)
    
    // データ品質分析
    let episodesWithLocations = 0
    let episodesWithoutLocations = 0
    let locationsWithTabelog = 0
    let locationsWithLinkSwitch = 0
    let totalLocations = 0
    let qualityIssues = []
    let locationTypeAnalysis: { [key: string]: number } = {}
    
    console.log('\n📊 詳細データ分析（最初の15エピソード）:')
    console.log('-' .repeat(40))
    
    for (let i = 0; i < Math.min(15, yonino.episodes.length); i++) {
      const episode = yonino.episodes[i]
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
            console.log(`      説明: ${location.description || '不明'}`)
            
            // ロケーションタイプ分析
            const locName = location.name.toLowerCase()
            if (locName.includes('レストラン') || locName.includes('料理') || locName.includes('食') || 
                locName.includes('カフェ') || locName.includes('グルメ')) {
              locationTypeAnalysis['食事系'] = (locationTypeAnalysis['食事系'] || 0) + 1
            } else if (locName.includes('観光') || locName.includes('名所') || locName.includes('公園')) {
              locationTypeAnalysis['観光地'] = (locationTypeAnalysis['観光地'] || 0) + 1
            } else {
              locationTypeAnalysis['その他'] = (locationTypeAnalysis['その他'] || 0) + 1
            }
            
            if (location.tabelog_url) {
              locationsWithTabelog++
              console.log(`      食べログ: ✅ ${location.tabelog_url}`)
              
              if (location.affiliate_info?.linkswitch?.status === 'active') {
                locationsWithLinkSwitch++
                console.log(`      LinkSwitch: ✅ 有効`)
              } else {
                console.log(`      LinkSwitch: ❌ 無効`)
                qualityIssues.push(`Episode ${i + 1}: ${location.name} - LinkSwitch未設定`)
              }
            } else {
              console.log(`      食べログ: ❌ なし`)
              // 食事系の場合は問題として記録
              if (locationTypeAnalysis['食事系'] && locationTypeAnalysis['食事系'] > 0) {
                qualityIssues.push(`Episode ${i + 1}: ${location.name} - 食べログURL欠如（食事系）`)
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
    const sampleSize = Math.min(15, yonino.episodes.length)
    const estimatedTotalLocations = Math.round((totalLocations / sampleSize) * yonino.episodes.length)
    const estimatedTabelogRate = totalLocations > 0 ? Math.round((locationsWithTabelog / totalLocations) * 100) : 0
    const estimatedLinkSwitchRate = locationsWithTabelog > 0 ? Math.round((locationsWithLinkSwitch / locationsWithTabelog) * 100) : 0
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎯 よにのちゃんねる 収益化ポテンシャル分析:')
    console.log(`   エピソード総数: ${yonino.episodes.length}話`)
    console.log(`   推定総ロケーション: ${estimatedTotalLocations}箇所`)
    console.log(`   現在の食べログURL率: ${estimatedTabelogRate}%`)
    console.log(`   現在のLinkSwitch率: ${estimatedLinkSwitchRate}%`)
    
    console.log('\n🍽️ ロケーションタイプ分析:')
    Object.entries(locationTypeAnalysis).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}箇所`)
    })
    
    // 松重豊方式適用可能性判定
    const foodRelatedRatio = (locationTypeAnalysis['食事系'] || 0) / totalLocations
    const matsushigeApplicable = foodRelatedRatio > 0.3 && totalLocations > 10
    
    console.log('\n💰 松重豊方式適用による期待収益:')
    if (matsushigeApplicable) {
      const matsushigeSuccess = 0.9 // 90%収益化率
      const expectedMonetizableLocations = Math.round(estimatedTotalLocations * matsushigeSuccess)
      const currentMonetizableLocations = Math.round(estimatedTotalLocations * (estimatedTabelogRate / 100))
      const increaseInRevenue = expectedMonetizableLocations - currentMonetizableLocations
      
      console.log(`   🟢 松重豊方式適用: 推奨`)
      console.log(`   現在の収益化店舗: ${currentMonetizableLocations}箇所`)
      console.log(`   松重豊方式適用後: ${expectedMonetizableLocations}箇所`)
      console.log(`   収益増加分: +${increaseInRevenue}箇所`)
      console.log(`   収益拡大率: ${Math.round((increaseInRevenue / Math.max(currentMonetizableLocations, 1)) * 100)}%`)
      
      console.log('\n🚀 実装戦略（松重豊方式を踏襲）:')
      console.log('   Phase 1: よにのちゃんねる データ品質調査（完了）')
      console.log('   Phase 2: 食事系ロケーションの特定・強化')
      console.log('   Phase 3: 不正確データのクリーニング')
      console.log('   Phase 4: 段階的な正確データ追加')
      console.log('   Phase 5: LinkSwitch全面適用')
    } else {
      console.log(`   🟡 松重豊方式適用: 条件付き`)
      console.log(`   食事系コンテンツ比率: ${Math.round(foodRelatedRatio * 100)}%`)
      console.log(`   → 30%未満のため、部分適用を推奨`)
    }
    
    if (qualityIssues.length > 0) {
      console.log('\n⚠️ 発見された品質課題:')
      qualityIssues.slice(0, 8).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      if (qualityIssues.length > 8) {
        console.log(`   ... その他 ${qualityIssues.length - 8}件`)
      }
    }
    
    console.log('\n🎊 よにのちゃんねる収益化プロジェクト!')
    if (matsushigeApplicable) {
      console.log(`314エピソードの食事系コンテンツで大幅収益向上が期待できます！`)
    } else {
      console.log(`部分的な収益化改善でも大きな効果が期待できます！`)
    }
    
    console.log('\n📋 次のアクション:')
    console.log('1. 食事系エピソードの詳細特定')
    console.log('2. 最も収益ポテンシャルの高いロケーションを選定')
    console.log('3. 松重豊の検証手法を適用')
    console.log('4. 段階的データ改善を開始')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeYoninoPotential().catch(console.error)