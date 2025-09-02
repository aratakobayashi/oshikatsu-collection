#!/usr/bin/env node

/**
 * Season10 第12話（最終回）の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode12() {
  console.log('🔧 Season10 第12話（最終回）の店舗情報修正開始...\n')
  
  const { data: episode12 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第12話%')
    .single()
  
  if (!episode12) {
    console.log('❌ 第12話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode12.title}`)
  
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
    .eq('episode_id', episode12.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: 'ラ・タベルナ',
      slug: 'la-taverna-kojimachi-season10-episode12',
      address: '東京都千代田区六番町1-1',
      description: '創業45年の老舗イタリア食堂。ミートローフが名物の大衆的イタリアン。麹町駅から徒歩2分。孤独のグルメSeason10第12話（最終回）の舞台。',
      tags: ['イタリア料理', 'ミートローフ', '老舗', '大衆的', '麹町', '市ヶ谷', '創業45年', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/tokyo/A1308/A130803/13000423/',
      phone: '03-3234-7374',
      opening_hours: '火-金11:00-15:30, 17:00-22:30 土11:00-15:30, 17:00-22:00（日月休み）'
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
    
    console.log('\n🎉 第12話（最終回）の店舗情報修正完了！')
    console.log('✅ ラ・タベルナの正確な情報で更新されました')
  }
}

fixSeason10Episode12()