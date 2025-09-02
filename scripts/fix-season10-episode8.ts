#!/usr/bin/env node

/**
 * Season10 第8話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode8() {
  console.log('🔧 Season10 第8話の店舗情報修正開始...\n')
  
  const { data: episode8 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第8話%')
    .single()
  
  if (!episode8) {
    console.log('❌ 第8話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode8.title}`)
  
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
    .eq('episode_id', episode8.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: '居酒屋 舞子',
      slug: 'izakaya-maiko-toyama-season10-episode8',
      address: '富山県富山市柳町2-3-26',
      description: '創業約40年の老舗居酒屋。かに面おでんと海鮮とろろ丼が名物。富山の地魚料理が自慢。孤独のグルメSeason10第8話の舞台。',
      tags: ['居酒屋', 'かに面おでん', '海鮮とろろ丼', '地魚', '富山', '柳町', '老舗', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/toyama/A1601/A160101/16000879/',
      phone: '076-432-4169',
      opening_hours: '18:00-5:00（日曜休み）'
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
    
    console.log('\n🎉 第8話の店舗情報修正完了！')
    console.log('✅ 居酒屋 舞子の正確な情報で更新されました')
  }
}

fixSeason10Episode8()