#!/usr/bin/env node

/**
 * Season10 第2話の正確な店舗情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason10Episode2() {
  console.log('🔧 Season10 第2話の店舗情報修正開始...\n')
  
  // 第2話のエピソードIDを取得
  const { data: episode2 } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season10%')
    .like('title', '%第2話%')
    .single()
  
  if (!episode2) {
    console.log('❌ 第2話が見つかりません')
    return
  }
  
  console.log(`📍 対象エピソード: ${episode2.title}`)
  
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
    .eq('episode_id', episode2.id)
    .single()
  
  if (currentLocation) {
    console.log('\n❌ 現在の間違った情報:')
    console.log(`  店舗名: ${currentLocation.location.name}`)
    console.log(`  住所: ${currentLocation.location.address}`)
    console.log(`  URL: ${currentLocation.location.tabelog_url}`)
    
    // 正しい情報で更新
    const correctData = {
      name: 'チャベ 目黒店',
      slug: 'cabe-meguro-season10-episode2',
      address: '東京都品川区上大崎3-5-4 2F',
      description: 'インドネシア料理レストラン。ルンダンとナシゴレンが名物。目黒駅から徒歩3分。孤独のグルメSeason10第2話の舞台。',
      tags: ['インドネシア料理', 'ルンダン', 'ナシゴレン', '目黒', 'CABE', 'チャベ', '孤独のグルメ', 'Season10'],
      tabelog_url: 'https://tabelog.com/tokyo/A1316/A131601/13027513/',
      phone: '03-6432-5748',
      opening_hours: '月-土 11:30-14:30, 17:30-22:00（日祝休み）'
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
    
    console.log('\n🎉 第2話の店舗情報修正完了！')
    console.log('✅ チャベ 目黒店の正確な情報で更新されました')
  }
}

fixSeason10Episode2()
