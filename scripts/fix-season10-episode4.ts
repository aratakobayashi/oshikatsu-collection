#!/usr/bin/env node

/**
 * Season10 第4話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode4() {
  console.log('🔧 Season10 第4話の店舗情報修正開始...\n')
  
  const { data: episode4 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第4話%')
    .single()
  
  if (!episode4) {
    console.log('❌ 第4話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode4.title}`)
  
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
    .eq('episode_id', episode4.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: 'ビストロKUROKAWA',
      slug: 'bistro-kurokawa-niiza-season10-episode4',
      address: '埼玉県新座市野火止5-18-25',
      description: '地元で愛されるビストロ。季節の野菜とお肉の炒め物、自家製バニラアイスが名物。孤独のグルメSeason10第4話の舞台。',
      tags: ['ビストロ', '洋食', '野菜炒め', 'バニラアイス', '新座', '野火止', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/saitama/A1107/A110701/11047312/',
      phone: '048-479-8739',
      opening_hours: '火-日 11:30-14:00, 17:30-21:00（月曜定休）'
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
    
    console.log('\n🎉 第4話の店舗情報修正完了！')
    console.log('✅ ビストロKUROKAWAの正確な情報で更新されました')
  }
}

fixSeason10Episode4()