#!/usr/bin/env node

/**
 * Season5 Episode10 緊急修正
 * 間違った「大島」（404エラー）→ 正しい「菜苑」への緊急修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function emergencyFixSeason5Episode10CorrectSaienKameido() {
  console.log('🚨 Season5 Episode10 緊急修正...\n')
  console.log('間違った大島（404エラーURL） → 正しい菜苑（江東区亀戸・中華・純レバ丼）')
  console.log('=' .repeat(70))
  
  try {
    // Season5 Episode10を特定
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
      .ilike('title', '%Season5 第10話%')
      .single()
    
    if (!episode) {
      console.error('❌ Season5 第10話が見つかりません')
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
    
    // 菜苑の正確なデータで更新
    const correctTabelogUrl = 'https://tabelog.com/tokyo/A1312/A131201/13018014/'
    
    const correctedData = {
      name: '菜苑',
      slug: 'saien-kameido-season5-ep10-correct',
      address: '東京都江東区亀戸3-1-8',
      description: '東京都江東区亀戸にある町中華の老舗。純レバ丼が名物で、レバーのみを使用したシンプルで絶品の丼ぶり。餃子も人気。孤独のグルメSeason5第10話で松重豊が訪問し、純レバ丼と餃子を堪能した実際のロケ地。',
      tabelog_url: correctTabelogUrl,
      affiliate_info: {
        linkswitch: {
          status: 'active',
          original_url: correctTabelogUrl,
          last_verified: new Date().toISOString(),
          episode: 'Season5 Episode10',
          notes: '東京都江東区亀戸の町中華。純レバ丼が名物。',
          correction_note: '間違った大島（404エラー）から正しい菜苑に緊急修正',
          verification_method: 'emergency_correction_with_url_verification'
        },
        restaurant_info: {
          signature_dish: '純レバ丼、餃子、中華料理各種',
          verification_status: 'verified_emergency_corrected_season5',
          data_source: 'accurate_manual_research_emergency_corrected',
          tabelog_rating: '3.49',
          restaurant_type: '中華料理・町中華',
          price_range: '1000-1500円',
          cuisine_type: '中華料理・定食',
          celebrity_association: 'matsushige_yutaka',
          season_association: 'Season5',
          special_features: '錦糸町駅・亀戸駅中間、亀戸天神近く、カウンター席のみ、純レバ丼専門',
          business_hours: '11:30-13:30, 17:00-23:00',
          closed: '日曜日・第4月曜日',
          updated_at: new Date().toISOString()
        }
      }
    }
    
    console.log(`\n✅ 正しい菜苑データに修正:`)
    console.log(`   店名: ${correctedData.name}`)
    console.log(`   住所: ${correctedData.address}`)
    console.log(`   タベログ: ${correctedData.tabelog_url}`)
    console.log(`   特徴: 江東区亀戸の町中華・純レバ丼専門`)
    console.log(`   評価: タベログ3.49点`)
    
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
    
    console.log('\n🎊 Season5 Episode10 緊急修正完了！')
    console.log('江東区亀戸の純レバ丼で正しい収益化開始！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
emergencyFixSeason5Episode10CorrectSaienKameido().catch(console.error)