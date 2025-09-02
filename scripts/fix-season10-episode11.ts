#!/usr/bin/env node

/**
 * Season10 第11話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode11() {
  console.log('🔧 Season10 第11話の店舗情報修正開始...\n')
  
  const { data: episode11 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第11話%')
    .single()
  
  if (!episode11) {
    console.log('❌ 第11話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode11.title}`)
  
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
    .eq('episode_id', episode11.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: 'レストラン バイキング',
      slug: 'restaurant-viking-asahi-season10-episode11',
      address: '千葉県旭市ロ1239-3',
      description: '創業50年以上の老舗洋食店。厚切り豚ロースの塩ワサビソテーが名物。完全予約制。旭駅から徒歩10分。孤独のグルメSeason10第11話の舞台。',
      tags: ['洋食', 'ビストロ', '豚ロース', '塩ワサビ', 'ステーキ', '旭市', 'いも豚', '老舗', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/chiba/A1205/A120502/12025317/',
      phone: '0479-63-7557',
      opening_hours: '火木金土 17:00-22:00（完全予約制、月水日休み）'
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
    
    console.log('\n🎉 第11話の店舗情報修正完了！')
    console.log('✅ レストラン バイキングの正確な情報で更新されました')
  }
}

fixSeason10Episode11()