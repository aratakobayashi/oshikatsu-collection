#!/usr/bin/env node

/**
 * 長崎飯店渋谷店のタベログURL修正スクリプト
 * 移転に伴う新しいタベログURLへの更新
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixNagasakiHantenUrl() {
  console.log('🔧 長崎飯店渋谷店 タベログURL修正開始...\n')
  console.log('移転に伴う新店舗URLへの更新')
  console.log('=' .repeat(70))
  
  try {
    const locationId = 'e0c28f95-e942-4155-90ab-c4f284fe257c'
    
    // 現在のデータ確認
    const { data: currentLocation } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()
    
    if (!currentLocation) {
      console.error('❌ 長崎飯店のロケーションデータが見つかりません')
      return
    }
    
    console.log('📍 修正前データ:')
    console.log(`   店舗名: ${currentLocation.name}`)
    console.log(`   住所: ${currentLocation.address}`)
    console.log(`   タベログURL: ${currentLocation.tabelog_url || '未設定'}`)
    
    // 新しい情報
    const newTabelogUrl = 'https://tabelog.com/tokyo/A1303/A130301/13281342/'
    const newAddress = '東京都渋谷区道玄坂1-9-1 梅山ビル1F'
    
    // affiliate_info更新
    const updatedAffiliateInfo = {
      ...currentLocation.affiliate_info,
      linkswitch: {
        status: 'active',
        original_url: newTabelogUrl,
        last_verified: new Date().toISOString(),
        episode: 'Season6 Episode7',
        notes: '東京都渋谷区道玄坂の長崎料理専門店。2023年4月移転後の新店舗。',
        verification_method: 'manual_research_with_url_verification_post_relocation'
      },
      restaurant_info: {
        ...currentLocation.affiliate_info?.restaurant_info,
        verification_status: 'verified_season6_high_quality_post_relocation',
        tabelog_rating: '3.49',
        business_hours: '月-金11:00-14:30/17:10-22:00, 土11:00-14:30',
        phone: '050-5593-4789',
        relocation_date: '2023年4月18日',
        relocation_reason: '道玄坂二丁目南地区再開発工事',
        new_location_features: '渋谷駅徒歩4分、梅山ビル1F、現金のみ',
        updated_at: new Date().toISOString()
      }
    }
    
    // データベース更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        tabelog_url: newTabelogUrl,
        address: newAddress,
        affiliate_info: updatedAffiliateInfo,
        description: '東京都渋谷区道玄坂にある1975年創業の長崎料理専門店。2023年4月に再開発に伴い移転し、現在は渋谷駅により近い梅山ビル1Fで営業。皿うどんやちゃんぽんなど本格的な長崎料理が楽しめ、昔ながらの中華料理店の雰囲気を残している。孤独のグルメSeason6第7話で松重豊が訪問し、皿うどん柔麺、春巻き、特製ちゃんぽん麺少なめを堪能した実際のロケ地。移転後も同じ味を提供している。'
      })
      .eq('id', locationId)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError)
      return
    }
    
    console.log('\n✅ 長崎飯店渋谷店 データ更新完了！')
    console.log('📊 更新内容:')
    console.log(`   新タベログURL: ${newTabelogUrl}`)
    console.log(`   新住所: ${newAddress}`)
    console.log(`   LinkSwitch状態: active`)
    console.log(`   移転情報: 2023年4月18日移転（再開発に伴う）`)
    console.log(`   新評価: タベログ3.49点`)
    
    // 修正後データ確認
    const { data: updatedLocation } = await supabase
      .from('locations')
      .select('*')
      .eq('id', locationId)
      .single()
    
    console.log('\n📍 修正後データ確認:')
    console.log(`   店舗名: ${updatedLocation.name}`)
    console.log(`   住所: ${updatedLocation.address}`)
    console.log(`   タベログURL: ${updatedLocation.tabelog_url}`)
    console.log(`   LinkSwitch状態: ${updatedLocation.affiliate_info?.linkswitch?.status}`)
    
    console.log('\n🎊 長崎飯店渋谷店 URL修正完了！')
    console.log('Season6 Episode7のロケ地データが正確になりました。')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
fixNagasakiHantenUrl().catch(console.error)