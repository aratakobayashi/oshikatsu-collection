#!/usr/bin/env node

/**
 * Season10 第7話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode7() {
  console.log('🔧 Season10 第7話の店舗情報修正開始...\n')
  
  const { data: episode7 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第7話%')
    .single()
  
  if (!episode7) {
    console.log('❌ 第7話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode7.title}`)
  
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
    .eq('episode_id', episode7.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: '山横沢',
      slug: 'yamayokosawa-sasazuka-season10-episode7',
      address: '東京都渋谷区笹塚1-58-9',
      description: '蕎麦と沖縄料理の融合店。ふうちゃんぷるととまとカレーつけそばが名物。笹塚駅から徒歩1分。孤独のグルメSeason10第7話の舞台。',
      tags: ['そば', '沖縄料理', 'ふうちゃんぷる', 'とまとカレーつけそば', '笹塚', '沖縄そば', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/tokyo/A1318/A131808/13041797/',
      phone: '080-6709-1589',
      opening_hours: '18:30-23:30（L.O.21:45、日曜休み）'
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
    
    console.log('\n🎉 第7話の店舗情報修正完了！')
    console.log('✅ 山横沢の正確な情報で更新されました')
  }
}

fixSeason10Episode7()