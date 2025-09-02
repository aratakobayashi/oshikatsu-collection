#!/usr/bin/env node

/**
 * 特定エピソードの詳細確認スクリプト
 * Episode ID: 4874d588-750f-4801-be81-4d3791c53b0c
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecificEpisode() {
  const episodeId = '4874d588-750f-4801-be81-4d3791c53b0c'
  
  console.log('🔍 特定エピソードの詳細確認...\n')
  console.log(`Episode ID: ${episodeId}`)
  console.log('=' .repeat(70))
  
  try {
    // エピソード基本情報の取得
    const { data: episode, error: episodeError } = await supabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single()
    
    if (episodeError) {
      console.error('❌ エピソード取得エラー:', episodeError)
      return
    }
    
    if (!episode) {
      console.log('❌ 指定されたエピソードが見つかりません')
      return
    }
    
    console.log('📺 エピソード情報:')
    console.log(`   ID: ${episode.id}`)
    console.log(`   タイトル: ${episode.title}`)
    console.log(`   説明: ${episode.description || '未設定'}`)
    console.log(`   シーズン: ${episode.season || '未設定'}`)
    console.log(`   エピソード番号: ${episode.episode_number || '未設定'}`)
    console.log(`   放送日: ${episode.air_date || '未設定'}`)
    
    // 関連するロケーションの取得
    const { data: locations, error: locationsError } = await supabase
      .from('episode_locations')
      .select(`
        locations (
          id,
          name,
          address,
          tabelog_url,
          affiliate_info
        )
      `)
      .eq('episode_id', episodeId)
    
    if (locationsError) {
      console.error('❌ ロケーション取得エラー:', locationsError)
      return
    }
    
    console.log(`\n📍 関連ロケーション: ${locations?.length || 0}件`)
    
    if (!locations || locations.length === 0) {
      console.log('⚠️ このエピソードにはロケーションが設定されていません')
      console.log('\n🔍 可能な問題:')
      console.log('   1. ロケーションデータが未作成')
      console.log('   2. episode_locationsテーブルでの関連付けが未設定')
      console.log('   3. エピソードIDの不一致')
    } else {
      locations.forEach((loc, index) => {
        const location = loc.locations
        console.log(`\n${index + 1}️⃣ ${location.name}`)
        console.log(`   住所: ${location.address}`)
        console.log(`   タベログURL: ${location.tabelog_url || '❌未設定'}`)
        
        const linkswitch = location.affiliate_info?.linkswitch
        if (linkswitch) {
          console.log(`   LinkSwitch状態: ${linkswitch.status || '未設定'}`)
          console.log(`   URL一致: ${linkswitch.original_url === location.tabelog_url ? '✅' : '❌'}`)
        } else {
          console.log(`   LinkSwitch情報: ❌未設定`)
        }
      })
    }
    
    // Season6エピソードかどうかの判定
    if (episode.title?.includes('Season6')) {
      console.log('\n⚠️ これはSeason6のエピソードです')
      console.log('Season6の品質修正が必要な可能性があります')
    }
    
    console.log('\n🔧 推奨対応:')
    if (!locations || locations.length === 0) {
      console.log('1. ロケーションデータの作成')
      console.log('2. episode_locationsテーブルでの関連付け')
    } else {
      const problemLocations = locations.filter(loc => 
        !loc.locations.tabelog_url || 
        !loc.locations.affiliate_info?.linkswitch ||
        loc.locations.affiliate_info?.linkswitch?.status !== 'active'
      )
      
      if (problemLocations.length > 0) {
        console.log(`${problemLocations.length}件のロケーションに問題があります`)
        console.log('- タベログURL設定')
        console.log('- LinkSwitch設定')
        console.log('- Affiliate情報完備')
      } else {
        console.log('✅ ロケーションデータに明らかな問題は見つかりません')
      }
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
checkSpecificEpisode().catch(console.error)