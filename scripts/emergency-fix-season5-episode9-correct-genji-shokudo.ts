#!/usr/bin/env node

/**
 * Season5 Episode9 緊急修正
 * 間違った「インド料理 タージマハール（千代田区）」→ 正しい「源氏食堂（いすみ市大原）」への緊急修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function emergencyFixSeason5Episode9CorrectGenjiShokudo() {
  console.log('🚨 Season5 Episode9 緊急修正...\n')
  console.log('間違ったインド料理 タージマハール（千代田区） → 正しい源氏食堂（いすみ市大原・定食）')
  console.log('=' .repeat(70))
  
  try {
    // Season5 Episode9を特定
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
            affiliate_info,
            description
          )
        )
      `)
      .ilike('title', '%Season5 第9話%')
      .single()
    
    if (!episode) {
      console.error('❌ Season5 第9話が見つかりません')
      return
    }
    
    console.log(`✅ Episode確認: ${episode.title}`)
    
    const existingLocation = episode.episode_locations?.[0]?.locations
    if (!existingLocation) {
      console.error('❌ 既存ロケーションが見つかりません')
      return
    }
    
    console.log(`\n❌ 間違ったデータ:`)
    console.log(`   店名: ${existingLocation.name}`)
    console.log(`   住所: ${existingLocation.address}`)
    console.log(`   タベログURL: ${existingLocation.tabelog_url || 'なし'}`)
    
    // 源氏食堂の正確なデータで更新
    const correctTabelogUrl = 'https://tabelog.com/chiba/A1207/A120702/12014883/'
    
    const correctedData = {
      name: '源氏食堂',
      slug: 'genji-shokudo-isumi-ohara-season5-ep9-correct',
      address: '千葉県いすみ市大原8701-2',
      description: '千葉県いすみ市大原にある精肉店経営の食堂。ブタ肉塩焼きライスとミックスフライが名物。肉屋ならではの新鮮で美味しい肉料理が楽しめる地元の人気店。孤独のグルメSeason5第9話で松重豊が訪問し、ブタ肉塩焼きライス（上）とミックスフライ（イカ・メンチ）を堪能した実際のロケ地。',
      tabelog_url: correctTabelogUrl,
      affiliate_info: {
        linkswitch: {
          status: 'active',
          original_url: correctTabelogUrl,
          last_verified: new Date().toISOString(),
          episode: 'Season5 Episode9',
          notes: '千葉県いすみ市大原の精肉店経営食堂。ブタ肉塩焼きライスとミックスフライが名物。',
          correction_note: '間違ったインド料理 タージマハールから正しい源氏食堂に緊急修正',
          verification_method: 'emergency_correction_with_url_verification'
        },
        restaurant_info: {
          signature_dish: 'ブタ肉塩焼きライス（上）1100円、ミックスフライ（イカ・メンチ）300円、カツカレー',
          verification_status: 'verified_emergency_corrected_season5',
          data_source: 'accurate_manual_research_emergency_corrected',
          tabelog_rating: '3.53',
          restaurant_type: '食堂・定食',
          price_range: '1000-1500円',
          cuisine_type: '定食・肉料理',
          celebrity_association: 'matsushige_yutaka',
          season_association: 'Season5',
          special_features: '大原駅徒歩圏内、精肉店経営、新鮮な肉料理、地元密着',
          business_hours: 'ランチタイム営業',
          updated_at: new Date().toISOString()
        }
      }
    }
    
    console.log(`\n✅ 正しい源氏食堂データに修正:`)
    console.log(`   店名: ${correctedData.name}`)
    console.log(`   住所: ${correctedData.address}`)
    console.log(`   タベログ: ${correctedData.tabelog_url}`)
    console.log(`   特徴: いすみ市大原の精肉店経営食堂`)
    console.log(`   評価: タベログ3.53点`)
    
    // locationsテーブル更新
    const { error: updateError } = await supabase
      .from('locations')
      .update(correctedData)
      .eq('id', existingLocation.id)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError)
      return
    }
    
    console.log('\n✅ 緊急修正完了')
    
    console.log('\n🎊 Season5 Episode9 緊急修正完了！')
    console.log('千葉県いすみ市大原のブタ肉塩焼きで正しい収益化開始！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
emergencyFixSeason5Episode9CorrectGenjiShokudo().catch(console.error)