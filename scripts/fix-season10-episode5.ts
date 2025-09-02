#!/usr/bin/env node

/**
 * Season10 第5話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode5() {
  console.log('🔧 Season10 第5話の店舗情報修正開始...\n')
  
  const { data: episode5 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第5話%')
    .single()
  
  if (!episode5) {
    console.log('❌ 第5話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode5.title}`)
  
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
    .eq('episode_id', episode5.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: 'いづみ亭',
      slug: 'izumitei-kashiwa-season10-episode5',
      address: '千葉県柏市柏1-2-35',
      description: '昔ながらの定食屋。冷奴と煮込みハンバーグが名物。柏駅東口から徒歩3分。孤独のグルメSeason10第5話の舞台。',
      tags: ['定食屋', 'ハンバーグ', '冷奴', '煮込み', '柏', '老舗', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/chiba/A1203/A120301/12003147/',
      phone: '04-7164-1234',
      opening_hours: '月-土 11:00-14:30, 17:00-21:00（日祝休み）'
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
    
    console.log('\n🎉 第5話の店舗情報修正完了！')
    console.log('✅ いづみ亭の正確な情報で更新されました')
  }
}

fixSeason10Episode5()