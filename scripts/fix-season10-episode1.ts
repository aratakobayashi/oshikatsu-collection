#!/usr/bin/env node

/**
 * Season10 第1話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode1() {
  console.log('🔧 Season10 第1話の店舗情報修正開始...\n')
  
  // 第1話のエピソードIDを取得
  const { data: episode1 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第1話%')
    .single()
  
  if (!episode1) {
    console.log('❌ 第1話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode1.title}`)
  
  // 現在の間違ったロケーション情報を取得
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
    .eq('episode_id', episode1.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  住所: ${currentLocation.location.address}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    // 正しい情報で更新
    const correctData = {
      name: 'よしの食堂',
      slug: 'yoshino-shokudo-hashimoto-season10-episode1',
      address: '神奈川県相模原市緑区東橋本2-19-4',
      description: '1966年創業の老舗食堂。牛肉のスタミナ炒めとネギ玉が名物。孤独のグルメSeason10第1話の舞台。',
      tags: ['定食', '食堂', '牛肉スタミナ炒め', 'ネギ玉', '橋本', '相模原', '1966年創業', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/kanagawa/A1407/A140701/14015513/',
      phone: '042-771-8705',
      opening_hours: '月-土 11:00-14:30, 17:00-20:30（日祝休み）'
    }
    
    console.log('\n✅ 正しい情報で修正:')
    console.log(`  店舗名: ${correctData.name}`)
    console.log(`  住所: ${correctData.address}`)
    console.log(`  URL: ${correctData.tabelog_url}`)
    
    // データベースを更新
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
    
    console.log('\n🎉 第1話の店舗情報修正完了！')
    console.log('✅ よしの食堂の正確な情報で更新されました')
  }
}

fixSeason10Episode1()
