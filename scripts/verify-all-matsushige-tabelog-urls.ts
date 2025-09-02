#!/usr/bin/env node

/**
 * 松重豊全エピソードのDB店舗名とタベログリンク先の完全一致検証
 * タベログURLが保存されているロケーションのみ対象
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAllMatsushigeTabeLogUrls() {
  console.log('🔍 松重豊全エピソード タベログURL完全検証開始...\n')
  console.log('📋 対象: タベログURLが保存されているロケーションのみ')
  console.log('=' .repeat(70))
  
  try {
    // タベログURLが存在するすべてのエピソードを取得
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
    
    let totalCount = 0
    let validCount = 0
    let suspiciousUrls: any[] = []
    
    console.log(`\n📊 検証対象: ${episodes.length}エピソード\n`)
    
    for (const episode of episodes) {
      const episodeNum = episode.title.match(/第(\d+)話/)?.[1] || episode.title.match(/Season(\d+)/)?.[1] || '?'
      const season = episode.title.match(/Season(\d+)/)?.[1] || '?'
      
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        const location = episode.episode_locations[0].location
        totalCount++
        
        // タベログURLが有効かどうかの基本チェック
        const hasValidUrl = location.tabelog_url && 
                           location.tabelog_url.includes('tabelog.com') &&
                           !location.tabelog_url.includes('example.com')
        
        const status = hasValidUrl ? '✅' : '❌'
        console.log(`${status} S${season}E${episodeNum}: ${location.name}`)
        console.log(`    🔗 ${location.tabelog_url}`)
        
        if (hasValidUrl) {
          validCount++
        } else {
          suspiciousUrls.push({
            episode: `S${season}E${episodeNum}`,
            name: location.name,
            url: location.tabelog_url,
            episodeId: episode.id
          })
        }
        console.log()
      }
    }
    
    console.log('=' .repeat(70))
    console.log('📈 検証結果サマリー')
    console.log(`✅ 有効URL: ${validCount}/${totalCount}エピソード`)
    console.log(`❌ 問題URL: ${totalCount - validCount}エピソード`)
    const successRate = Math.round((validCount / totalCount) * 100)
    console.log(`📊 成功率: ${successRate}%`)
    
    if (suspiciousUrls.length > 0) {
      console.log('\n🚨 問題のあるURL一覧:')
      suspiciousUrls.forEach(item => {
        console.log(`  ${item.episode}: ${item.name} - ${item.url}`)
      })
    }
    
    console.log('=' .repeat(70))
    
    if (successRate === 100) {
      console.log('🎉 全エピソードのタベログURLが正常です！')
      console.log('💰 LinkSwitch収益化準備完了')
    } else {
      console.log(`⚠️ ${totalCount - validCount}エピソードで問題が見つかりました`)
      console.log('🔧 修正が必要です')
    }
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生しました:', error)
  }
}

// スクリプト実行
verifyAllMatsushigeTabeLogUrls()
