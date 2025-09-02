#!/usr/bin/env node

/**
 * 松重豊全エピソード タベログURL検証（サマリー版）
 * Season別に整理して問題のあるURLのみ詳細表示
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyMatsushigeTabeLogSummary() {
  console.log('🔍 松重豊全エピソード タベログURL検証（サマリー版）\n')
  
  try {
    // Season別にエピソードを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          location:locations!inner(
            name,
            tabelog_url
          )
        )
      `)
      .not('episode_locations.location.tabelog_url', 'is', null)
      .neq('episode_locations.location.tabelog_url', '')
      .order('title')
    
    if (!episodes) {
      console.log('❌ エピソードデータが取得できませんでした')
      return
    }
    
    // Season別に集計
    const seasonStats: { [key: string]: { total: number, valid: number, suspicious: any[] } } = {}
    let totalEpisodes = 0
    let totalValidUrls = 0
    let allSuspicious: any[] = []
    
    for (const episode of episodes) {
      const seasonMatch = episode.title.match(/Season(\d+)/)
      const season = seasonMatch ? `Season${seasonMatch[1]}` : 'Other'
      
      if (!seasonStats[season]) {
        seasonStats[season] = { total: 0, valid: 0, suspicious: [] }
      }
      
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        const location = episode.episode_locations[0].location
        totalEpisodes++
        seasonStats[season].total++
        
        // タベログURLが有効かどうかの基本チェック
        const hasValidUrl = location.tabelog_url && 
                           location.tabelog_url.includes('tabelog.com') &&
                           !location.tabelog_url.includes('example.com') &&
                           !location.tabelog_url.includes('placeholder')
        
        if (hasValidUrl) {
          totalValidUrls++
          seasonStats[season].valid++
        } else {
          const episodeNum = episode.title.match(/第(\d+)話/)?.[1] || '?'
          const suspiciousItem = {
            season,
            episode: `第${episodeNum}話`,
            name: location.name,
            url: location.tabelog_url,
            episodeId: episode.id,
            title: episode.title
          }
          seasonStats[season].suspicious.push(suspiciousItem)
          allSuspicious.push(suspiciousItem)
        }
      }
    }
    
    // Season別サマリー表示
    console.log('📊 Season別 タベログURL検証結果:')
    console.log('=' .repeat(70))
    
    Object.keys(seasonStats)
      .sort((a, b) => {
        if (a === 'Other') return 1
        if (b === 'Other') return -1
        const seasonA = parseInt(a.replace('Season', ''))
        const seasonB = parseInt(b.replace('Season', ''))
        return seasonA - seasonB
      })
      .forEach(season => {
        const stats = seasonStats[season]
        const rate = Math.round((stats.valid / stats.total) * 100)
        const status = rate === 100 ? '✅' : '⚠️'
        
        console.log(`${status} ${season}: ${stats.valid}/${stats.total} (${rate}%)`)
        
        if (stats.suspicious.length > 0) {
          stats.suspicious.forEach(item => {
            console.log(`    ❌ ${item.episode}: ${item.name}`)
            console.log(`       URL: ${item.url}`)
          })
        }
        console.log()
      })
    
    // 全体サマリー
    console.log('=' .repeat(70))
    console.log('🎯 全体サマリー:')
    console.log(`📈 総エピソード数: ${totalEpisodes}`)
    console.log(`✅ 有効URL: ${totalValidUrls}/${totalEpisodes}`)
    console.log(`❌ 問題URL: ${allSuspicious.length}/${totalEpisodes}`)
    const overallRate = Math.round((totalValidUrls / totalEpisodes) * 100)
    console.log(`📊 全体成功率: ${overallRate}%`)
    
    if (allSuspicious.length === 0) {
      console.log('\n🎉 全エピソードのタベログURLが正常です！')
      console.log('💰 LinkSwitch収益化準備完了')
    } else {
      console.log(`\n🔧 ${allSuspicious.length}エピソードで修正が必要です`)
    }
    
    console.log('=' .repeat(70))
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// スクリプト実行
verifyMatsushigeTabeLogSummary()
