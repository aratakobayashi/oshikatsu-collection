#!/usr/bin/env node

/**
 * Season5 Episode4,5 台湾エピソード緊急修正
 * 台湾エピソードに誤って東京の店舗が登録されている問題を修正
 * 台湾の店舗は収益化対象外のため、ロケーション関連を削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function emergencyFixSeason5TaiwanEpisodesDelete() {
  console.log('🚨 Season5 台湾エピソード緊急修正...\n')
  console.log('台湾エピソード（第4話・第5話）の間違った東京店舗データを削除')
  console.log('=' .repeat(70))
  
  try {
    // Season5 Episode4を特定
    const { data: episode4 } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          id,
          location_id,
          locations(
            id,
            name,
            address,
            tabelog_url
          )
        )
      `)
      .ilike('title', '%Season5 第4話%')
      .single()
    
    // Season5 Episode5を特定
    const { data: episode5 } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          id,
          location_id,
          locations(
            id,
            name,
            address,
            tabelog_url
          )
        )
      `)
      .ilike('title', '%Season5 第5話%')
      .single()
    
    const episodesToFix = []
    if (episode4) episodesToFix.push({ episode: episode4, name: 'Episode4' })
    if (episode5) episodesToFix.push({ episode: episode5, name: 'Episode5' })
    
    if (episodesToFix.length === 0) {
      console.error('❌ 台湾エピソードが見つかりません')
      return
    }
    
    console.log(`✅ 対象エピソード数: ${episodesToFix.length}`)
    
    const locationIdsToDelete = []
    const episodeLocationIdsToDelete = []
    
    for (const { episode, name } of episodesToFix) {
      console.log(`\n🔍 ${name}: ${episode.title}`)
      
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        for (const episodeLocation of episode.episode_locations) {
          const location = episodeLocation.locations
          console.log(`❌ 削除対象店舗:`)
          console.log(`   店名: ${location.name}`)
          console.log(`   住所: ${location.address}`)
          console.log(`   理由: 台湾エピソードに東京の店舗が誤登録`)
          
          locationIdsToDelete.push(location.id)
          episodeLocationIdsToDelete.push(episodeLocation.id)
        }
      } else {
        console.log('✅ 既にロケーションデータなし')
      }
    }
    
    if (locationIdsToDelete.length === 0) {
      console.log('\n✅ 削除対象のロケーションはありません')
      return
    }
    
    console.log(`\n🗑️  削除予定: ${locationIdsToDelete.length}件のロケーション`)
    
    // episode_locationsから削除
    if (episodeLocationIdsToDelete.length > 0) {
      const { error: deleteEpisodeLocationsError } = await supabase
        .from('episode_locations')
        .delete()
        .in('id', episodeLocationIdsToDelete)
      
      if (deleteEpisodeLocationsError) {
        console.error('❌ episode_locations削除エラー:', deleteEpisodeLocationsError)
        return
      }
      console.log(`✅ episode_locations削除完了: ${episodeLocationIdsToDelete.length}件`)
    }
    
    // locationsから削除
    if (locationIdsToDelete.length > 0) {
      const { error: deleteLocationsError } = await supabase
        .from('locations')
        .delete()
        .in('id', locationIdsToDelete)
      
      if (deleteLocationsError) {
        console.error('❌ locations削除エラー:', deleteLocationsError)
        return
      }
      console.log(`✅ locations削除完了: ${locationIdsToDelete.length}件`)
    }
    
    console.log('\n✅ 台湾エピソード修正完了')
    
    console.log('\n📋 修正内容:')
    console.log('• Episode4「台湾宜蘭県羅東」: 焼肉 牛角本店（東京）を削除')
    console.log('• Episode5「台湾台北市永楽市場」: 寿司幸（東京）を削除')
    console.log('• 理由: 台湾の店舗は日本の収益化システム対象外')
    console.log('• 今後: 台湾エピソードはロケーション表示なし')
    
    console.log('\n🎊 Season5 台湾エピソード修正完了！')
    console.log('収益化対象外エピソードの正確なデータ管理！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
emergencyFixSeason5TaiwanEpisodesDelete().catch(console.error)