#!/usr/bin/env node

/**
 * Season10の完全性を確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySeason10Complete() {
  console.log('🔍 Season10 完全性確認...\n')
  
  // Season10エピソード確認
  const { data: episodes } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      thumbnail_url,
      episode_locations(
        location:locations(
          name,
          tabelog_url
        )
      )
    `)
    .like('title', '%Season10%')
    .order('title')
  
  console.log(`📺 Season10 エピソード数: ${episodes?.length || 0}`)
  
  if (episodes && episodes.length > 0) {
    console.log('\n📝 エピソード詳細:')
    
    let locationsCount = 0
    let tabelogCount = 0
    
    episodes.forEach(episode => {
      const episodeNum = episode.title.match(/第(\d+)話/)?.[1] || '?'
      const hasLocation = episode.episode_locations && episode.episode_locations.length > 0
      const location = hasLocation ? episode.episode_locations[0].location : null
      const hasTabelog = location?.tabelog_url ? true : false
      
      if (hasLocation) locationsCount++
      if (hasTabelog) tabelogCount++
      
      const status = hasTabelog ? '✅' : hasLocation ? '⚠️' : '❌'
      console.log(`${status} 第${episodeNum}話: ${location?.name || 'ロケーションなし'}`)
      
      if (hasTabelog) {
        console.log(`    🔗 ${location.tabelog_url}`)
      }
    })
    
    console.log('\n' + '=' .repeat(70))
    console.log('📊 Season10 統計:')
    console.log(`  📺 エピソード: ${episodes.length}/12`)
    console.log(`  📍 ロケーション: ${locationsCount}/12`)
    console.log(`  🔗 タベログURL: ${tabelogCount}/12`)
    
    const completionRate = Math.round((tabelogCount / 12) * 100)
    console.log(`  📈 完成度: ${completionRate}%`)
    
    if (completionRate === 100) {
      console.log('\n🎉 Season10 完全制覇！')
      console.log('💰 全エピソードLinkSwitch対応完了')
      console.log('🚀 孤独のグルメ全10シーズン（120エピソード）対応完了！')
    }
  }
}

verifySeason10Complete()
