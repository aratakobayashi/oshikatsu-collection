#!/usr/bin/env node

/**
 * 孤独のグルメ全108エピソードのタベログURL検証（最終版）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyKodokuTabelogFinal() {
  console.log('🔍 孤独のグルメ全エピソード タベログURL完全検証\n')
  
  try {
    // 孤独のグルメの全エピソードを取得
    const { data: kodokuEpisodes } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          location:locations(
            name,
            tabelog_url
          )
        )
      `)
      .like('title', '%孤独のグルメ%')
      .order('title')
    
    if (!kodokuEpisodes) {
      console.log('❌ 孤独のグルメエピソードが取得できませんでした')
      return
    }
    
    console.log(`📊 検証対象: ${kodokuEpisodes.length}エピソード\n`)
    
    // Season別に集計
    const seasonStats: { [key: string]: { 
      total: number, 
      withTabelog: number, 
      validTabelog: number, 
      suspicious: any[] 
    } } = {}
    
    let totalEpisodes = 0
    let episodesWithTabelog = 0
    let validTabelogUrls = 0
    let allSuspicious: any[] = []
    
    for (const episode of kodokuEpisodes) {
      const seasonMatch = episode.title.match(/Season(\d+)/)
      const episodeMatch = episode.title.match(/第(\d+)話/)
      const season = seasonMatch ? `Season${seasonMatch[1]}` : 'Unknown'
      const episodeNum = episodeMatch ? episodeMatch[1] : '?'
      
      if (!seasonStats[season]) {
        seasonStats[season] = { total: 0, withTabelog: 0, validTabelog: 0, suspicious: [] }
      }
      
      seasonStats[season].total++
      totalEpisodes++
      
      // ロケーションデータがあるかチェック
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        const location = episode.episode_locations[0].location
        
        // タベログURLがあるかチェック
        if (location.tabelog_url && location.tabelog_url.trim() !== '') {
          seasonStats[season].withTabelog++
          episodesWithTabelog++
          
          // タベログURLが有効かチェック
          const hasValidUrl = location.tabelog_url.includes('tabelog.com') &&
                             !location.tabelog_url.includes('example.com') &&
                             !location.tabelog_url.includes('placeholder') &&
                             location.tabelog_url.startsWith('https://tabelog.com/')
          
          if (hasValidUrl) {
            seasonStats[season].validTabelog++
            validTabelogUrls++
            console.log(`✅ ${season} 第${episodeNum}話: ${location.name}`)
          } else {
            const suspiciousItem = {
              season,
              episodeNum,
              name: location.name,
              url: location.tabelog_url,
              episodeId: episode.id
            }
            seasonStats[season].suspicious.push(suspiciousItem)
            allSuspicious.push(suspiciousItem)
            console.log(`❌ ${season} 第${episodeNum}話: ${location.name}`)
            console.log(`    問題URL: ${location.tabelog_url}`)
          }
        } else {
          console.log(`⚪ ${season} 第${episodeNum}話: ${location.name} (タベログURL未設定)`)
        }
      } else {
        console.log(`⚪ ${season} 第${episodeNum}話: ロケーションデータなし`)
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
        const tabelogRate = stats.withTabelog > 0 ? Math.round((stats.validTabelog / stats.withTabelog) * 100) : 0
        const coverageRate = Math.round((stats.withTabelog / stats.total) * 100)
        
        console.log(`📺 ${season}:`)
        console.log(`   📊 総エピソード: ${stats.total}`)
        console.log(`   🔗 タベログURL有: ${stats.withTabelog} (${coverageRate}%)`)
        console.log(`   ✅ 有効URL: ${stats.validTabelog}/${stats.withTabelog} (${tabelogRate}%)`)
        
        if (stats.suspicious.length > 0) {
          console.log(`   ❌ 問題URL:`)
          stats.suspicious.forEach(item => {
            console.log(`      第${item.episodeNum}話: ${item.name}`)
          })
        }
        console.log()
      })
    
    console.log('=' .repeat(70))
    console.log('🎯 全体サマリー:')
    console.log(`📺 総エピソード数: ${totalEpisodes}`)
    console.log(`🔗 タベログURL付きエピソード: ${episodesWithTabelog}`)
    console.log(`✅ 有効タベログURL: ${validTabelogUrls}`)
    
    const coverageRate = Math.round((episodesWithTabelog / totalEpisodes) * 100)
    const validityRate = episodesWithTabelog > 0 ? Math.round((validTabelogUrls / episodesWithTabelog) * 100) : 0
    
    console.log(`📊 タベログカバー率: ${coverageRate}%`)
    console.log(`📊 URL有効率: ${validityRate}%`)
    
    if (allSuspicious.length === 0 && episodesWithTabelog > 0) {
      console.log('\n🎉 設定済みの全タベログURLが正常です！')
      console.log('💰 LinkSwitch収益化準備完了')
    } else if (allSuspicious.length > 0) {
      console.log(`\n🔧 ${allSuspicious.length}エピソードで修正が必要です`)
    }
    
    if (episodesWithTabelog < totalEpisodes) {
      const missingCount = totalEpisodes - episodesWithTabelog
      console.log(`📝 ${missingCount}エピソードでタベログURL未設定`)
    }
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// スクリプト実行
verifyKodokuTabelogFinal()
