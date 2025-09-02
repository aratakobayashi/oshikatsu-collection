#!/usr/bin/env node

/**
 * Snow Man データ分析 - 松重豊方式適用のための詳細調査
 * 949エピソード、1%収益化率の巨大ポテンシャル分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeSnowManPotential() {
  console.log('🏔️ Snow Man データ分析開始...\n')
  console.log('松重豊の90%収益化手法をSnow Manに適用する戦略を立てます')
  console.log('=' .repeat(60))
  
  try {
    // Snow Manのデータを詳細取得
    const { data: snowMan } = await supabase
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
      .eq('slug', 'snow-man')
      .single()
    
    if (!snowMan) {
      console.error('❌ Snow Manのデータが見つかりません')
      return
    }
    
    console.log(`✅ Snow Man 基本情報:`)
    console.log(`   ID: ${snowMan.id}`)
    console.log(`   名前: ${snowMan.name}`)
    console.log(`   エピソード総数: ${snowMan.episodes.length}話`)
    
    // データ品質分析
    let episodesWithLocations = 0
    let episodesWithoutLocations = 0
    let locationsWithTabelog = 0
    let locationsWithLinkSwitch = 0
    let totalLocations = 0
    let qualityIssues = []
    
    console.log('\n📊 詳細データ分析:')
    console.log('-' .repeat(40))
    
    for (let i = 0; i < Math.min(10, snowMan.episodes.length); i++) {
      const episode = snowMan.episodes[i]
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
              qualityIssues.push(`Episode ${i + 1}: ${location.name} - 食べログURL欠如`)
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
    const sampleSize = Math.min(10, snowMan.episodes.length)
    const estimatedTotalLocations = Math.round((totalLocations / sampleSize) * snowMan.episodes.length)
    const estimatedTabelogRate = totalLocations > 0 ? Math.round((locationsWithTabelog / totalLocations) * 100) : 0
    const estimatedLinkSwitchRate = locationsWithTabelog > 0 ? Math.round((locationsWithLinkSwitch / locationsWithTabelog) * 100) : 0
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎯 Snow Man 収益化ポテンシャル分析:')
    console.log(`   エピソード総数: ${snowMan.episodes.length}話`)
    console.log(`   推定総ロケーション: ${estimatedTotalLocations}箇所`)
    console.log(`   現在の食べログURL率: ${estimatedTabelogRate}%`)
    console.log(`   現在のLinkSwitch率: ${estimatedLinkSwitchRate}%`)
    
    console.log('\n💰 松重豊方式適用による期待収益:')
    const matsushigeSuccess = 0.9 // 90%収益化率
    const expectedMonetizableLocations = Math.round(estimatedTotalLocations * matsushigeSuccess)
    const currentMonetizableLocations = Math.round(estimatedTotalLocations * (estimatedTabelogRate / 100))
    const increaseInRevenue = expectedMonetizableLocations - currentMonetizableLocations
    
    console.log(`   現在の収益化店舗: ${currentMonetizableLocations}箇所`)
    console.log(`   松重豊方式適用後: ${expectedMonetizableLocations}箇所`)
    console.log(`   収益増加分: +${increaseInRevenue}箇所`)
    console.log(`   収益拡大率: ${Math.round((increaseInRevenue / Math.max(currentMonetizableLocations, 1)) * 100)}%`)
    
    console.log('\n🚀 実装戦略（松重豊方式を踏襲）:')
    console.log('   Phase 1: データ品質調査（完了）')
    console.log('   Phase 2: 問題データのクリーニング')
    console.log('   Phase 3: 検証システム構築')
    console.log('   Phase 4: 段階的な正確データ追加')
    console.log('   Phase 5: LinkSwitch全面適用')
    
    if (qualityIssues.length > 0) {
      console.log('\n⚠️ 発見された品質課題（最初の10エピソードから）:')
      qualityIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      if (qualityIssues.length > 5) {
        console.log(`   ... その他 ${qualityIssues.length - 5}件`)
      }
    }
    
    console.log('\n🎊 Snow Man = 次の巨大成功ストーリー!')
    console.log(`949エピソードの収益化で、松重豊の${Math.round(949 / 132)}倍の売上が期待できます！`)
    
    console.log('\n📋 次のアクション:')
    console.log('1. Snow Man データクリーニング戦略を立案')
    console.log('2. 最も収益ポテンシャルの高いエピソードを特定')
    console.log('3. 松重豊と同じ段階的アプローチを適用')
    console.log('4. 90%収益化を目標に設定')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeSnowManPotential().catch(console.error)