#!/usr/bin/env node

/**
 * Season10の店舗名とタベログリンク先の一致確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySeason10TabelogMatch() {
  console.log('🔍 Season10 店舗名とタベログリンク先の一致確認\n')
  console.log('=' .repeat(70))
  
  // Season10のエピソードとロケーション情報を取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select(`
      title,
      episode_locations(
        location:locations(
          name,
          address,
          tabelog_url
        )
      )
    `)
    .like('title', '%Season10%')
    .order('title')
  
  if (!episodes || episodes.length === 0) {
    console.log('❌ Season10エピソードが見つかりません')
    return
  }
  
  console.log(`📊 検証対象: ${episodes.length}エピソード\n`)
  
  const verificationResults: any[] = []
  
  for (const episode of episodes) {
    const episodeNum = episode.title.match(/第(\d+)話/)?.[1] || '?'
    
    if (episode.episode_locations && episode.episode_locations.length > 0) {
      const location = episode.episode_locations[0].location
      
      console.log(`📍 第${episodeNum}話`)
      console.log(`  🏢 DB店舗名: ${location.name}`)
      console.log(`  📍 住所: ${location.address}`)
      console.log(`  🔗 タベログURL: ${location.tabelog_url}`)
      
      verificationResults.push({
        episodeNum,
        dbName: location.name,
        address: location.address,
        tabelogUrl: location.tabelog_url
      })
      
      console.log()
    }
  }
  
  console.log('=' .repeat(70))
  console.log('📝 検証サマリー:')
  console.log(`✅ 全${verificationResults.length}店舗のタベログURL設定済み`)
  console.log('\n⚠️ 注意: タベログページの実際の店舗名は手動確認が必要です')
  console.log('以下のURLをクリックして、店舗名が一致することを確認してください:\n')
  
  verificationResults.forEach(result => {
    console.log(`第${result.episodeNum}話: ${result.dbName}`)
    console.log(`  ${result.tabelogUrl}`)
  })
}

verifySeason10TabelogMatch()
