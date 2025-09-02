#!/usr/bin/env node

/**
 * はまべ（千葉県富津市金谷）のタベログURL修正スクリプト
 * 間違ったURL（菓子工房）から正しいURL（漁師めしはまべ）への修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixHamabeTabeLogUrl() {
  console.log('🔧 はまべ（富津市金谷） タベログURL修正開始...\n')
  console.log('間違ったURL（菓子工房）から正しいURL（漁師めしはまべ）への修正')
  console.log('=' .repeat(70))
  
  try {
    // はまべのロケーションを取得
    const { data: locations, error: searchError } = await supabase
      .from('locations')
      .select('*')
      .eq('name', 'はまべ')
      .ilike('address', '%富津市金谷%')
    
    if (searchError) {
      console.error('❌ ロケーション検索エラー:', searchError)
      return
    }
    
    if (!locations || locations.length === 0) {
      console.error('❌ はまべ（富津市金谷）が見つかりません')
      return
    }
    
    const location = locations[0]
    console.log('📍 修正前データ:')
    console.log(`   ID: ${location.id}`)
    console.log(`   店舗名: ${location.name}`)
    console.log(`   住所: ${location.address}`)
    console.log(`   間違ったタベログURL: ${location.tabelog_url}`)
    
    // 正しい情報
    const correctTabelogUrl = 'https://tabelog.com/chiba/A1206/A120603/12035117/'
    
    // affiliate_info更新
    const updatedAffiliateInfo = {
      ...location.affiliate_info,
      linkswitch: {
        status: 'active',
        original_url: correctTabelogUrl,
        last_verified: new Date().toISOString(),
        episode: 'Season6 Episode10',
        notes: '千葉県富津市金谷の漁師めし食堂。地魚アジフライ定食が名物。',
        verification_method: 'manual_research_with_url_verification_corrected'
      },
      restaurant_info: {
        ...location.affiliate_info?.restaurant_info,
        verification_status: 'verified_season6_high_quality_corrected',
        data_source: 'corrected_accurate_manual_research_season6',
        tabelog_rating: '3.72',
        restaurant_type: '食堂・海鮮料理・魚介料理',
        business_hours: '昼12:00-15:00, 夜18:00-21:00（夜は要予約）',
        phone: '0439-69-2210',
        seating: '38席（カウンター・1F・2F テーブル）',
        ocean_view: '海が見える',
        tabelog_100: '食べログ百名店2024選出',
        url_correction: '間違ったURL（菓子工房）から正しいURL（漁師めしはまべ）に修正',
        correction_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    
    // データベース更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        tabelog_url: correctTabelogUrl,
        affiliate_info: updatedAffiliateInfo,
        description: '千葉県富津市金谷にある地元密着型の食堂。東京湾フェリー金谷港からすぐの立地で、新鮮な地元の海の幸を使ったアジフライ定食が名物。房総沖で獲れる黄金アジを使用した厚くてふわふわのアジフライは絶品で、食べログ百名店2024にも選出された。孤独のグルメSeason6第10話で松重豊が訪問し、地魚フライ定食（アジフライ）とカジメ入り味噌汁を堪能した実際のロケ地。'
      })
      .eq('id', location.id)
    
    if (updateError) {
      console.error('❌ 更新エラー:', updateError)
      return
    }
    
    console.log('\n✅ はまべ タベログURL修正完了！')
    console.log('📊 修正内容:')
    console.log(`   修正前URL: ${location.tabelog_url}`)
    console.log(`   ↓`)
    console.log(`   修正後URL: ${correctTabelogUrl}`)
    console.log(`   評価: タベログ3.72点（339レビュー）`)
    console.log(`   特記: 食べログ百名店2024選出`)
    
    // 修正後データ確認
    const { data: updatedLocation } = await supabase
      .from('locations')
      .select('*')
      .eq('id', location.id)
      .single()
    
    console.log('\n📍 修正後データ確認:')
    console.log(`   店舗名: ${updatedLocation.name}`)
    console.log(`   住所: ${updatedLocation.address}`)
    console.log(`   タベログURL: ${updatedLocation.tabelog_url}`)
    console.log(`   LinkSwitch状態: ${updatedLocation.affiliate_info?.linkswitch?.status}`)
    
    console.log('\n🎊 はまべ URL修正完了！')
    console.log('Season6 Episode10のロケ地データが正確になりました。')
    console.log('これで重大なURL不一致問題が解決しました！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
fixHamabeTabeLogUrl().catch(console.error)