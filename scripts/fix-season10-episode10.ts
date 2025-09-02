#!/usr/bin/env node

/**
 * Season10 第10話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode10() {
  console.log('🔧 Season10 第10話の店舗情報修正開始...\n')
  
  const { data: episode10 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第10話%')
    .single()
  
  if (!episode10) {
    console.log('❌ 第10話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode10.title}`)
  
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
    .eq('episode_id', episode10.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: '粥菜坊',
      slug: 'kayunabou-musashi-kosugi-season10-episode10',
      address: '神奈川県川崎市中原区今井南町4-12',
      description: '本格広東料理専門店。豚肉腸粉と雲呑麺が名物。17年の経験を持つ本格派。武蔵小杉駅から徒歩7分。孤独のグルメSeason10第10話の舞台。',
      tags: ['中華料理', '広東料理', '腸粉', '雲呑麺', '飲茶', '川崎', '武蔵小杉', '本格派', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140504/14009596/',
      phone: '044-741-8885',
      opening_hours: '平日11:30-14:00, 18:00-21:00 土日祝11:30-15:00, 17:00-21:00（月曜休み）'
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
    
    console.log('\n🎉 第10話の店舗情報修正完了！')
    console.log('✅ 粥菜坊の正確な情報で更新されました')
  }
}

fixSeason10Episode10()