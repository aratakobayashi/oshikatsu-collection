#!/usr/bin/env node

/**
 * 孤独のグルメ正式エピソード（Season1-9）のタベログURL完全検証
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyKodokuNoGourmetTabelog() {
  console.log('🔍 孤独のグルメ Season1-9 タベログURL完全検証\n')
  
  try {
    // 孤独のグルメの正式エピソードのみを対象
    const { data: episodes } = await supabase
      .from('episode_locations')
      .select(`
        episodes!inner(id, title),
        locations!inner(name, tabelog_url)
      `)
      .like('episodes.title', '%孤独のグルメ Season%')
      .not('locations.tabelog_url', 'is', null)
      .neq('locations.tabelog_url', '')
      .order('episodes.title')
    
    if (!episodes) {
      console.log('❌ 孤独のグルメエピソードが見つかりませんでした')
      return
    }
    
    console.log(`📊 検証対象: ${episodes.length}エピソード\n`)
    
    // Season別に集計
    const seasonStats: { [key: string]: { total: number, valid: number, suspicious: any[] } } = {}
    let totalValid = 0
    let allSuspicious: any[] = []
    
    for (const relation of episodes) {
      const episode = relation.episodes as any
      const location = relation.locations as any
      
      const seasonMatch = episode.title.match(/Season(\d+)/)
      const episodeMatch = episode.title.match(/第(\d+)話/)
      const season = seasonMatch ? `Season${seasonMatch[1]}` : 'Unknown'
      const episodeNum = episodeMatch ? episodeMatch[1] : '?'
      
      if (!seasonStats[season]) {
        seasonStats[season] = { total: 0, valid: 0, suspicious: [] }
      }
      seasonStats[season].total++
      
      // タベログURLが有効かチェック
      const hasValidUrl = location.tabelog_url && 
                         location.tabelog_url.includes('tabelog.com') &&
                         !location.tabelog_url.includes('example.com') &&
                         !location.tabelog_url.includes('placeholder') &&
                         location.tabelog_url.startsWith('https://tabelog.com/')
      
      if (hasValidUrl) {
        totalValid++
        seasonStats[season].valid++
        console.log(`✅ ${season} 第${episodeNum}話: ${location.name}`)
      } else {
        const suspiciousItem = {
          season,
          episodeNum,
          name: location.name,
          url: location.tabelog_url,
          title: episode.title,
          episodeId: episode.id
        }
        seasonStats[season].suspicious.push(suspiciousItem)
        allSuspicious.push(suspiciousItem)
        console.log(`❌ ${season} 第${episodeNum}話: ${location.name}`)
        console.log(`    URL: ${location.tabelog_url}`)
      }
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('📈 Season別検証結果:')
    
    Object.keys(seasonStats)
      .sort((a, b) => {
        if (a === 'Unknown') return 1
        if (b === 'Unknown') return -1
        const seasonA = parseInt(a.replace('Season', ''))
        const seasonB = parseInt(b.replace('Season', ''))
        return seasonA - seasonB
      })
      .forEach(season => {
        const stats = seasonStats[season]
        const rate = Math.round((stats.valid / stats.total) * 100)
        const status = rate === 100 ? '✅' : '⚠️'
        
        console.log(`${status} ${season}: ${stats.valid}/${stats.total}エピソード (${rate}%)`)
        
        if (stats.suspicious.length > 0) {
          stats.suspicious.forEach(item => {
            console.log(`    ❌ 第${item.episodeNum}話: ${item.name} - ${item.url}`)
          })
        }
      })
    
    console.log('=' .repeat(70))
    const overallRate = Math.round((totalValid / episodes.length) * 100)
    console.log(`🎯 全体結果: ${totalValid}/${episodes.length}エピソード (${overallRate}%)`)
    
    if (allSuspicious.length === 0) {
      console.log('\n🎉 すべての孤独のグルメエピソードのタベログURLが正常です！')
      console.log('💰 全Season LinkSwitch収益化準備完了')
    } else {
      console.log(`\n🔧 ${allSuspicious.length}エピソードで修正が必要です`)
      console.log('\n📝 修正が必要なエピソード一覧:')
      allSuspicious.forEach(item => {
        console.log(`  ${item.season} 第${item.episodeNum}話: ${item.name}`)
        console.log(`    Episode ID: ${item.episodeId}`)
        console.log(`    問題URL: ${item.url}`)
        console.log()
      })
    }
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// スクリプト実行
verifyKodokuNoGourmetTabelog()
