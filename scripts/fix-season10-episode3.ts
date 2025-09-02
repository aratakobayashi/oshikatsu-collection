#!/usr/bin/env node

/**
 * Season10 第3話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode3() {
  console.log('🔧 Season10 第3話の店舗情報修正開始...\n')
  
  const { data: episode3 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第3話%')
    .single()
  
  if (!episode3) {
    console.log('❌ 第3話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode3.title}`)
  
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
    .eq('episode_id', episode3.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    const correctData = {
      name: 'キッチン・カフェ ばる',
      slug: 'kitchen-cafe-baru-sakuragicho-season10-episode3',
      address: '神奈川県横浜市中区花咲町1-42-1',
      description: '手作り料理が自慢のカフェレストラン。真鯛のソテーオーロラソースとまぐろのユッケどんぶりが名物。孤独のグルメSeason10第3話の舞台。',
      tags: ['洋食', 'カフェ', '真鯛ソテー', 'まぐろユッケ丼', '桜木町', '花咲町', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140102/14030553/',
      phone: '045-253-0098',
      opening_hours: '11:30-14:00, 17:00-21:30（水曜定休）'
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
    
    console.log('\n🎉 第3話の店舗情報修正完了！')
    console.log('✅ キッチン・カフェ ばるの正確な情報で更新されました')
  }
}

fixSeason10Episode3()
