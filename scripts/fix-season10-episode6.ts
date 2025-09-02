#!/usr/bin/env node

/**
 * Season10 第6話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode6() {
  console.log('🔧 Season10 第6話の店舗情報修正開始...\n')
  
  const { data: episode6 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第6話%')
    .single()
  
  if (!episode6) {
    console.log('❌ 第6話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode6.title}`)
  
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
    .eq('episode_id', episode6.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: '大安食堂',
      slug: 'taian-shokudo-gero-season10-episode6',
      address: '岐阜県下呂市萩原町萩原1166-8',
      description: '下呂温泉街の老舗食堂。飛騨牛丼とトマトラーメンが名物。昭和レトロな雰囲気。孤独のグルメSeason10第6話の舞台。',
      tags: ['食堂', '飛騨牛丼', 'トマトラーメン', '下呂', '萩原', '昭和レトロ', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/gifu/A2104/A210402/21000347/',
      phone: '0576-52-1129',
      opening_hours: '11:00-20:00（不定休）'
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
    
    console.log('\n🎉 第6話の店舗情報修正完了！')
    console.log('✅ 大安食堂の正確な情報で更新されました')
  }
}

fixSeason10Episode6()