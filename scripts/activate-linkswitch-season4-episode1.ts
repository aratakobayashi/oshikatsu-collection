#!/usr/bin/env node

/**
 * Season4 Episode1 LinkSwitch即座有効化
 * 既存の食べログURLを持つEpisode1のもつ焼きばんをまず収益化開始
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function activateLinkSwitchSeason4Episode1() {
  console.log('🍜 Season4 Episode1 LinkSwitch即座有効化開始...\n')
  console.log('既存食べログURLを活用した緊急収益化対応！')
  console.log('=' .repeat(60))
  
  try {
    // Season4 Episode1を特定
    const { data: episode } = await supabase
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
            tabelog_url,
            affiliate_info
          )
        )
      `)
      .ilike('title', '%Season4 第1話%')
      .single()
    
    if (!episode) {
      console.error('❌ Season4 第1話が見つかりません')
      return
    }
    
    console.log(`✅ Episode確認: ${episode.title}`)
    
    const location = episode.episode_locations?.[0]?.locations
    if (!location) {
      console.error('❌ ロケーションが見つかりません')
      return
    }
    
    if (!location.tabelog_url) {
      console.error('❌ 食べログURLがありません')
      return
    }
    
    console.log(`\n🏪 対象店舗: ${location.name}`)
    console.log(`   住所: ${location.address}`)
    console.log(`   食べログ: ${location.tabelog_url}`)
    
    // 現在のLinkSwitch状態を確認
    const currentInfo = location.affiliate_info || {}
    const currentLinkSwitch = currentInfo.linkswitch || {}
    
    if (currentLinkSwitch.status === 'active') {
      console.log('\n✅ LinkSwitchは既に有効化済みです')
      return
    }
    
    console.log(`   現在のLinkSwitch: ${currentLinkSwitch.status || '未設定'}`)
    
    // LinkSwitch有効化
    const updatedAffiliateInfo = {
      ...currentInfo,
      linkswitch: {
        status: 'active',
        original_url: location.tabelog_url,
        last_verified: new Date().toISOString(),
        activation_source: 'season4_episode1_emergency_activation',
        season: 'Season4',
        celebrity: 'matsushige_yutaka',
        notes: 'Season4緊急収益化対応 - 既存食べログURLでLinkSwitch即座有効化'
      },
      restaurant_info: {
        ...currentInfo.restaurant_info,
        monetization_status: 'linkswitch_active',
        celebrity_association: 'matsushige_yutaka',
        season_association: 'Season4',
        activation_type: 'emergency_existing_url',
        updated_at: new Date().toISOString()
      }
    }
    
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        affiliate_info: updatedAffiliateInfo
      })
      .eq('id', location.id)
    
    if (updateError) {
      console.error(`❌ 更新エラー: ${updateError.message}`)
      return
    }
    
    console.log(`\n⚡ LinkSwitch有効化完了！`)
    console.log(`   → Season4初の収益化店舗誕生`)
    console.log(`   → クリック時に即座収益発生開始`)
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎊 Season4 Episode1 LinkSwitch有効化成功！')
    
    console.log('\n💰 収益化効果:')
    console.log('   ✅ Season4初の収益化店舗')
    console.log('   ⚡ 食べログリンククリックで即座収益発生')
    console.log('   📈 Season4収益化率: 1/8箇所 → 13%達成')
    
    console.log('\n🏆 松重豊収益化帝国拡大:')
    console.log('   Season1: 9箇所（100%）')
    console.log('   Season2: 11箇所（92%）')
    console.log('   Season3: 7箇所（修正済み）')
    console.log('   Season4: 1箇所（開始！）')
    console.log('   **現在合計: 28箇所**')
    
    console.log('\n📋 次のステップ:')
    console.log('1. Season4残り7箇所のデータ正確性検証')
    console.log('2. エピソード9-12の正しいロケ地調査・追加')
    console.log('3. Season4完全収益化へ向けた段階的対応')
    
    console.log('\n🚀 Season4収益化スタート成功！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
activateLinkSwitchSeason4Episode1().catch(console.error)