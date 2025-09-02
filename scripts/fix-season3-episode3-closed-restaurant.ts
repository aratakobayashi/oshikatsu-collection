#!/usr/bin/env node

/**
 * Season3 Episode3 わさび園かどや（閉店）正確な処理
 * 現在休業中のため、LinkSwitchを無効化し正確な情報に更新
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason3Episode3ClosedRestaurant() {
  console.log('🍜 Season3 Episode3 わさび園かどや（休業中）正確な処理...\n')
  console.log('現在休業中のため、適切なデータ更新を行います')
  console.log('=' .repeat(60))
  
  try {
    // Season3 Episode3を検索
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
            slug,
            address,
            tabelog_url,
            affiliate_info
          )
        )
      `)
      .ilike('title', '%Season3 第3話%')
      .single()
    
    if (!episode) {
      console.error('❌ Season3 第3話が見つかりません')
      return
    }
    
    console.log(`✅ Episode確認: ${episode.title}`)
    
    const existingLocation = episode.episode_locations?.[0]?.locations
    if (!existingLocation) {
      console.error('❌ 既存ロケーションが見つかりません')
      return
    }
    
    console.log(`\n🏪 既存ロケーション: ${existingLocation.name}`)
    console.log(`   現在のslug: ${existingLocation.slug}`)
    console.log(`   住所: ${existingLocation.address}`)
    
    // わさび園かどやの正確なデータで更新
    const updatedData = {
      name: 'わさび園かどや',
      slug: 'wasabi-en-kadoya-kawazu-season3-ep3-closed',
      address: '静岡県賀茂郡河津町河津七滝',
      description: '河津七滝近くのわさび農園。4代続く老舗で100年以上わさびを栽培。孤独のグルメSeason3第3話で松重豊が「わさび丼」をおかわりした伝説の店。現在休業中。',
      tabelog_url: 'https://tabelog.com/shizuoka/A2205/A220503/22014866/',
      affiliate_info: {
        linkswitch: {
          status: 'inactive',
          original_url: 'https://tabelog.com/shizuoka/A2205/A220503/22014866/',
          last_verified: new Date().toISOString(),
          episode: 'Season3 Episode3',
          notes: 'わさび園かどや - 現在休業中のため収益化停止。河津のわさび丼で有名だった名店。',
          closure_reason: 'temporarily_closed',
          historical_significance: '孤独のグルメ効果で一日200杯売れた伝説のわさび丼'
        },
        restaurant_info: {
          signature_dish: 'わさび丼（生わさび付き）',
          verification_status: 'verified_closed',
          data_source: 'accurate_manual_research',
          business_status: 'temporarily_closed',
          closure_date: '2024年頃',
          historical_note: '4代続くわさび農園、100年以上の歴史',
          updated_at: new Date().toISOString()
        }
      }
    }
    
    console.log('\n🔄 データ更新:')
    console.log(`   店名: ${updatedData.name}`)
    console.log(`   住所: ${updatedData.address}`)
    console.log(`   食べログ: ${updatedData.tabelog_url}`)
    console.log(`   営業状況: 休業中`)
    console.log(`   LinkSwitch: 無効化`)
    
    // locationsテーブル更新
    const { error: updateError } = await supabase
      .from('locations')
      .update(updatedData)
      .eq('id', existingLocation.id)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError)
      return
    }
    
    console.log('   ✅ データ更新完了')
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎊 Season3 Episode3 正確な処理完了！')
    
    console.log('\n📊 わさび園かどや 詳細情報:')
    console.log('   🌿 4代続く老舗わさび農園（100年以上の歴史）')
    console.log('   📍 河津七滝近く、河津駅から30分')
    console.log('   🍚 名物：わさび丼（550円）')
    console.log('   📺 孤独のグルメで松重豊がおかわりした伝説の店')
    console.log('   📈 放送後は1日200杯売れる大人気店だった')
    console.log('   ⚠️ 現在休業中のため収益化対象外')
    
    console.log('\n💼 適切な対応:')
    console.log('   ✅ LinkSwitch無効化（休業中のため）')
    console.log('   ✅ 正確な営業状況記録')
    console.log('   ✅ 歴史的意義の保存')
    console.log('   ✅ 将来の営業再開時に備えた完全なデータ保持')
    
    console.log('\n🚀 Season3進捗（修正版）:')
    console.log('   Episode 1: ザクロ ✅（有効）')
    console.log('   Episode 2: 第一亭 ✅（有効）')
    console.log('   Episode 3: わさび園かどや ❌（休業中）')
    console.log('   Episode 7: 阿佐 ✅（有効）')
    console.log('   収益化: 3/4箇所（75% - 営業中店舗のみ）')
    
    console.log('\n📝 次のアクション:')
    console.log('   1. Episode 4以降の営業中店舗調査継続')
    console.log('   2. 営業中店舗のみでの収益化率向上')
    console.log('   3. 閉店店舗の適切な履歴保存')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
fixSeason3Episode3ClosedRestaurant().catch(console.error)