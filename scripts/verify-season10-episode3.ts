#!/usr/bin/env node

/**
 * Season10 第3話の店舗情報確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySeason10Episode3() {
  console.log('🔍 Season10 第3話の店舗情報確認...\n')
  
  const { data: episode3 } = await supabase
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
    .like('title', '%第3話%')
    .single()
  
  if (episode3?.episode_locations?.[0]?.location) {
    const location = episode3.episode_locations[0].location
    
    console.log(`📍 ${episode3.title}`)
    console.log(`🏢 DB店舗名: ${location.name}`)
    console.log(`📍 DB住所: ${location.address}`)
    console.log(`🔗 DB URL: ${location.tabelog_url}`)
    
    // 正しい情報と比較
    const correctName = 'キッチン・カフェ ばる'
    const correctUrl = 'https://tabelog.com/kanagawa/A1401/A140102/14030553/'
    
    const nameMatch = location.name === correctName
    const urlMatch = location.tabelog_url === correctUrl
    
    console.log(`\n✅ 店舗名一致: ${nameMatch ? '✅' : '❌'}`)
    console.log(`✅ URL一致: ${urlMatch ? '✅' : '❌'}`)
    
    if (nameMatch && urlMatch) {
      console.log('\n🎉 第3話は正確です！修正不要')
    } else {
      console.log('\n⚠️ 第3話に修正が必要です')
    }
  }
}

verifySeason10Episode3()
