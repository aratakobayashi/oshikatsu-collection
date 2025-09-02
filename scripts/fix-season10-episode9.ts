#!/usr/bin/env node

/**
 * Season10 第9話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode9() {
  console.log('🔧 Season10 第9話の店舗情報修正開始...\n')
  
  const { data: episode9 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第9話%')
    .single()
  
  if (!episode9) {
    console.log('❌ 第9話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode9.title}`)
  
  const { data: currentLocation } = await supabase
    .from('episode_locations')
    .select(`
      location_id,
      location:locations(
        name,
        address,
        tabelog_url
      )
    `)
    .eq('episode_id', episode9.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: '世味',
      slug: 'semi-nippori-season10-episode9',
      address: '東京都荒川区東日暮里3-43-8 大河ビル1F',
      description: '韓国式中華料理店。酢豚とチャムチャ麺が名物。「五郎さんセット」も人気。三河島駅から徒歩4分。孤独のグルメSeason10第9話の舞台。',
      tags: ['韓国料理', '中華料理', '酢豚', 'チャムチャ麺', 'ジャジャン麺', '日暮里', '三河島', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/tokyo/A1324/A132401/13180444/',
      phone: '03-3806-4477',
      opening_hours: '11:30-14:30, 17:00-22:00（火曜休み）'
    }
    
    console.log('\n✅ 正しい情報で修正:')
    console.log(`  店舗名: ${correctData.name}`)
    console.log(`  URL: ${correctData.tabelog_url}`)
    
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        name: correctData.name,
        slug: correctData.slug,
        address: correctData.address,
        description: correctData.description,
        tags: correctData.tags,
        tabelog_url: correctData.tabelog_url,
        phone: correctData.phone,
        opening_hours: correctData.opening_hours,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentLocation.location_id)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError)
      return
    }
    
    console.log('\n🎉 第9話の店舗情報修正完了！')
    console.log('✅ 世味の正確な情報で更新されました')
  }
}

fixSeason10Episode9()