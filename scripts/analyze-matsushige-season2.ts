#!/usr/bin/env node

/**
 * 松重豊 Season2 データ分析
 * Season1の90%収益化成功を踏まえ、Season2での展開可能性を調査
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeMatsushigeSeason2() {
  console.log('🍜 松重豊 Season2 データ分析開始...\n')
  console.log('Season1の90%収益化成功を踏まえ、Season2を同様に展開します！')
  console.log('=' .repeat(60))
  
  try {
    // 松重豊の全エピソードを取得
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
    
    console.log(`✅ 松重豊 基本情報:`)
    console.log(`   ID: ${celebrity.id}`)
    console.log(`   名前: ${celebrity.name}`)
    console.log(`   総エピソード数: ${celebrity.episodes.length}話`)
    
    // Season別に分類
    const season1Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season1') || ep.title.includes('Season 1'))
    const season2Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season2') || ep.title.includes('Season 2'))
    const season3Episodes = celebrity.episodes.filter((ep: any) => 
      ep.title.includes('Season3') || ep.title.includes('Season 3'))
    const otherEpisodes = celebrity.episodes.filter((ep: any) => 
      !ep.title.includes('Season'))
    
    console.log(`\n📺 エピソード分類:`)
    console.log(`   Season1: ${season1Episodes.length}話`)
    console.log(`   Season2: ${season2Episodes.length}話`)
    console.log(`   Season3: ${season3Episodes.length}話`)
    console.log(`   その他: ${otherEpisodes.length}話`)
    
    if (season2Episodes.length === 0) {
      console.error('❌ Season2のエピソードが見つかりません')
      console.log('タイトル形式を確認します...')
      
      celebrity.episodes.slice(0, 20).forEach((ep: any, index: number) => {
        console.log(`   ${index + 1}. ${ep.title}`)
      })
      return
    }
    
    console.log(`\n🎯 Season2 詳細分析 (${season2Episodes.length}話):`)
    console.log('-' .repeat(40))
    
    let season2LocationsTotal = 0
    let season2LocationsWithTabelog = 0
    let season2LocationsWithLinkSwitch = 0
    let season2QualityIssues: string[] = []
    
    season2Episodes.forEach((episode: any, index: number) => {
      const locationCount = episode.episode_locations?.length || 0
      season2LocationsTotal += locationCount
      
      console.log(`\n📺 Episode ${index + 1}: ${episode.title}`)
      
      if (locationCount > 0) {
        console.log(`   ロケーション: ${locationCount}箇所`)
        
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   ${locIndex + 1}. ${location.name}`)
            console.log(`      住所: ${location.address || '不明'}`)
            
            if (location.tabelog_url) {
              season2LocationsWithTabelog++
              console.log(`      食べログ: ✅ ${location.tabelog_url}`)
              
              if (location.affiliate_info?.linkswitch?.status === 'active') {
                season2LocationsWithLinkSwitch++
                console.log(`      LinkSwitch: ✅ 有効`)
              } else {
                console.log(`      LinkSwitch: ❌ 無効`)
                season2QualityIssues.push(`Episode ${index + 1}: ${location.name} - LinkSwitch未設定`)
              }
            } else {
              console.log(`      食べログ: ❌ なし`)
              season2QualityIssues.push(`Episode ${index + 1}: ${location.name} - 食べログURL欠如`)
            }
          }
        })
      } else {
        console.log(`   ロケーション: ❌ データなし`)
        season2QualityIssues.push(`Episode ${index + 1}: ロケーションデータ不備`)
      }
    })
    
    // Season1との比較
    const season1LocationsTotal = season1Episodes.reduce((total: number, ep: any) => 
      total + (ep.episode_locations?.length || 0), 0)
    const season1LocationsWithLinkSwitch = season1Episodes.reduce((total: number, ep: any) => {
      if (!ep.episode_locations) return total
      return total + ep.episode_locations.filter((epLoc: any) => 
        epLoc.locations?.affiliate_info?.linkswitch?.status === 'active').length
    }, 0)
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n📊 Season2 vs Season1 比較分析:')
    
    console.log(`\nSeason1 実績:`)
    console.log(`   エピソード: ${season1Episodes.length}話`)
    console.log(`   総ロケーション: ${season1LocationsTotal}箇所`)
    console.log(`   収益化店舗: ${season1LocationsWithLinkSwitch}箇所`)
    console.log(`   収益化率: ${Math.round((season1LocationsWithLinkSwitch / season1LocationsTotal) * 100)}% 🏆`)
    
    console.log(`\nSeason2 現状:`)
    console.log(`   エピソード: ${season2Episodes.length}話`)
    console.log(`   総ロケーション: ${season2LocationsTotal}箇所`)
    console.log(`   食べログURL保有: ${season2LocationsWithTabelog}箇所`)
    console.log(`   収益化店舗: ${season2LocationsWithLinkSwitch}箇所`)
    
    if (season2LocationsTotal > 0) {
      const season2TabelogRate = Math.round((season2LocationsWithTabelog / season2LocationsTotal) * 100)
      const season2MonetizationRate = Math.round((season2LocationsWithLinkSwitch / season2LocationsTotal) * 100)
      
      console.log(`   食べログ保有率: ${season2TabelogRate}%`)
      console.log(`   収益化率: ${season2MonetizationRate}%`)
      
      // 戦略決定
      console.log('\n🎯 Season2 収益化戦略:')
      
      if (season2LocationsWithTabelog > season2LocationsWithLinkSwitch) {
        console.log('   🟢 推奨戦略: よにの方式（LinkSwitch一括有効化）')
        console.log(`   即座収益化可能: ${season2LocationsWithTabelog - season2LocationsWithLinkSwitch}箇所`)
        console.log('   理由: 既存食べログURLのLinkSwitch未有効化')
        
      } else if (season2QualityIssues.filter(issue => issue.includes('データ不備')).length > 5) {
        console.log('   🟡 推奨戦略: 松重豊方式（段階的データ改善）')
        console.log('   理由: データ品質改善が必要')
        console.log('   アプローチ: Season1と同じ段階的調査→検証→追加')
        
      } else {
        console.log('   🔄 推奨戦略: ハイブリッド方式')
        console.log('   理由: 既存活用 + 部分改善')
      }
      
      // 期待効果
      const expectedSeason2Revenue = Math.min(season2Episodes.length, 10) // 最大10店舗（閉店考慮）
      console.log('\n💰 期待収益効果:')
      console.log(`   Season2最大収益化店舗: ${expectedSeason2Revenue}箇所`)
      console.log(`   松重豊全体収益化: ${season1LocationsWithLinkSwitch + expectedSeason2Revenue}箇所`)
      console.log(`   収益拡大率: +${Math.round((expectedSeason2Revenue / season1LocationsWithLinkSwitch) * 100)}%`)
      
    } else {
      console.log('\n⚠️ Season2にロケーションデータがありません')
      console.log('データ追加が必要です')
    }
    
    if (season2QualityIssues.length > 0) {
      console.log('\n⚠️ Season2 品質課題:')
      season2QualityIssues.slice(0, 8).forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`)
      })
      if (season2QualityIssues.length > 8) {
        console.log(`   ... その他 ${season2QualityIssues.length - 8}件`)
      }
    }
    
    console.log('\n🚀 Season2 実装計画:')
    if (season2LocationsWithTabelog > season2LocationsWithLinkSwitch) {
      console.log('1. 【即座実行】LinkSwitch一括有効化')
      console.log('2. 即座収益化の確認')
      console.log('3. 不足データの段階的追加')
    } else {
      console.log('1. Season2エピソード別詳細調査')
      console.log('2. 営業中店舗の特定')
      console.log('3. Season1方式での段階的データ追加')
    }
    console.log('4. Season1+Season2統合収益化の完成')
    
    console.log('\n🎊 Season2展開で松重豊の収益化がさらに拡大します！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
analyzeMatsushigeSeason2().catch(console.error)