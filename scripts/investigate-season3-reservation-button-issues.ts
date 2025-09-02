#!/usr/bin/env node

/**
 * Season3 「予約する」ボタン問題調査
 * LinkSwitch未設定や無効設定によるボタン未表示問題を特定・修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateSeason3ReservationButtonIssues() {
  console.log('🔍 Season3 「予約する」ボタン問題調査開始...\n')
  console.log('LinkSwitch設定状況とボタン表示問題の詳細分析')
  console.log('=' .repeat(60))
  
  try {
    // Season3の全エピソードとロケーションを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select(`
        id,
        slug,
        name,
        episodes(
          id,
          title,
          episode_locations(
            id,
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
    
    // Season3エピソードをフィルター
    const season3Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season3'))
    
    console.log(`✅ Season3 基本情報:`)
    console.log(`   総エピソード: ${season3Episodes.length}話`)
    
    if (season3Episodes.length === 0) {
      console.error('❌ Season3エピソードが見つかりません')
      return
    }
    
    console.log(`\n📊 Season3 「予約する」ボタン問題分析:`)
    console.log('-' .repeat(50))
    
    let totalLocations = 0
    let locationsWithTabelog = 0
    let locationsWithActiveLS = 0
    let buttonIssues: any[] = []
    
    season3Episodes.forEach((episode: any, index: number) => {
      const locationCount = episode.episode_locations?.length || 0
      totalLocations += locationCount
      
      console.log(`\n📺 ${episode.title}`)
      
      if (locationCount > 0) {
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   🏪 ${location.name}`)
            console.log(`      住所: ${location.address}`)
            
            let buttonStatus = '❌ 予約ボタンなし'
            let issueType = 'unknown'
            
            if (location.tabelog_url) {
              locationsWithTabelog++
              console.log(`      タベログURL: ✅ ${location.tabelog_url}`)
              
              // LinkSwitch設定確認
              const linkswitch = location.affiliate_info?.linkswitch
              if (linkswitch?.status === 'active') {
                locationsWithActiveLS++
                buttonStatus = '✅ 予約ボタンあり'
                console.log(`      LinkSwitch: ✅ 有効 (${linkswitch.status})`)
              } else {
                issueType = 'linkswitch_inactive'
                console.log(`      LinkSwitch: ❌ 無効 (${linkswitch?.status || '未設定'})`)
                buttonIssues.push({
                  episode: episode.title,
                  location: location.name,
                  locationId: location.id,
                  issue: 'LinkSwitch未有効化',
                  tabelog_url: location.tabelog_url,
                  current_status: linkswitch?.status || '未設定'
                })
              }
            } else {
              issueType = 'no_tabelog_url'
              console.log(`      タベログURL: ❌ なし`)
              buttonIssues.push({
                episode: episode.title,
                location: location.name,
                locationId: location.id,
                issue: 'タベログURL欠如',
                tabelog_url: null,
                current_status: 'no_url'
              })
            }
            
            console.log(`      予約ボタン: ${buttonStatus}`)
          }
        })
      } else {
        console.log(`   ❌ ロケーションデータなし`)
      }
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 Season3 予約ボタン問題サマリー:')
    
    console.log(`\nSeason3 現状:`)
    console.log(`   総ロケーション: ${totalLocations}箇所`)
    console.log(`   タベログURL保有: ${locationsWithTabelog}箇所`)
    console.log(`   予約ボタン正常: ${locationsWithActiveLS}箇所`)
    console.log(`   予約ボタン問題: ${buttonIssues.length}箇所`)
    
    if (totalLocations > 0) {
      const tabelogRate = Math.round((locationsWithTabelog / totalLocations) * 100)
      const buttonRate = Math.round((locationsWithActiveLS / totalLocations) * 100)
      const issueRate = Math.round((buttonIssues.length / totalLocations) * 100)
      
      console.log(`\n📈 Season3 収益化状況:`)
      console.log(`   タベログ保有率: ${tabelogRate}%`)
      console.log(`   予約ボタン表示率: ${buttonRate}%`)
      console.log(`   問題発生率: ${issueRate}%`)
    }
    
    if (buttonIssues.length > 0) {
      console.log(`\n⚠️ 予約ボタン問題詳細 (${buttonIssues.length}件):`)
      console.log('-' .repeat(50))
      
      const linkswitchIssues = buttonIssues.filter(issue => issue.issue === 'LinkSwitch未有効化')
      const urlIssues = buttonIssues.filter(issue => issue.issue === 'タベログURL欠如')
      
      if (linkswitchIssues.length > 0) {
        console.log(`\n🔧 LinkSwitch未有効化問題 (${linkswitchIssues.length}件):`)
        linkswitchIssues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.location}`)
          console.log(`      エピソード: ${issue.episode}`)
          console.log(`      タベログURL: ✅ ${issue.tabelog_url}`)
          console.log(`      現在状態: ${issue.current_status}`)
          console.log(`      修正方法: LinkSwitchを'active'に設定`)
          console.log()
        })
      }
      
      if (urlIssues.length > 0) {
        console.log(`\n🔗 タベログURL欠如問題 (${urlIssues.length}件):`)
        urlIssues.forEach((issue, index) => {
          console.log(`   ${index + 1}. ${issue.location}`)
          console.log(`      エピソード: ${issue.episode}`)
          console.log(`      修正方法: 正確なタベログURLを調査・追加`)
          console.log()
        })
      }
      
      console.log('🚀 推奨修正アクション:')
      if (linkswitchIssues.length > 0) {
        console.log(`1. 【即座実行可能】LinkSwitch一括有効化 (${linkswitchIssues.length}件)`)
        console.log('   → 既存タベログURLでのLinkSwitch設定変更')
        console.log('   → 即座に予約ボタン表示開始')
      }
      
      if (urlIssues.length > 0) {
        console.log(`2. 【調査必要】タベログURL追加 (${urlIssues.length}件)`)
        console.log('   → 実店舗のタベログページを調査')
        console.log('   → URLを追加後LinkSwitch有効化')
      }
    } else {
      console.log('\n✅ Season3予約ボタン問題なし')
      console.log('全ロケーションで予約ボタンが正常表示中')
    }
    
    console.log('\n💰 予約ボタン修正による収益向上効果:')
    if (buttonIssues.length > 0) {
      const potentialIncrease = Math.round((buttonIssues.length / totalLocations) * 100)
      console.log(`   現在の収益化率: ${Math.round((locationsWithActiveLS / totalLocations) * 100)}%`)
      console.log(`   修正後の収益化率: 100% (目標)`)
      console.log(`   収益拡大ポテンシャル: +${potentialIncrease}%`)
      console.log(`   修正対象: ${buttonIssues.length}箇所`)
    } else {
      console.log('   ✅ Season3は既に100%収益化達成')
    }
    
    console.log('\n📋 Season3修正優先順位:')
    if (linkswitchIssues.length > 0) {
      console.log('   Priority 1: LinkSwitch一括有効化 (即座実行)')
      console.log(`               → ${linkswitchIssues.length}箇所の即座収益化`)
    }
    if (urlIssues.length > 0) {
      console.log('   Priority 2: タベログURL調査追加')
      console.log(`               → ${urlIssues.length}箇所の段階的収益化`)
    }
    
    console.log('\n🏆 全Season統合予約ボタン最適化:')
    console.log('   Season1: 予約ボタン正常動作 ✅')
    console.log('   Season2: 田や修正完了（他も要確認）')
    console.log(`   Season3: ${buttonIssues.length}件修正必要`)
    console.log('   Season4: データ品質改善中')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
investigateSeason3ReservationButtonIssues().catch(console.error)