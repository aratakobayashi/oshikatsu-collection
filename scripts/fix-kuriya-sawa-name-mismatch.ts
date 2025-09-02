#!/usr/bin/env node

/**
 * 厨sawa店舗名不一致修正
 * 登録店名「厨sawa」→ タベログ正式名称「厨 Sawa」に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixKuriyaSawaNameMismatch() {
  console.log('🔧 厨sawa店舗名修正...\n')
  console.log('登録店名「厨sawa」→ タベログ正式名称「厨 Sawa」に修正')
  console.log('=' .repeat(60))
  
  try {
    // 厨sawaのロケーション特定
    const { data: location } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .eq('name', '厨sawa')
      .single()
    
    if (!location) {
      console.error('❌ 厨sawaが見つかりません')
      return
    }
    
    console.log(`📍 現在の登録名: ${location.name}`)
    console.log(`🔗 タベログURL: ${location.tabelog_url}`)
    
    // 正しい店舗名に更新
    const { error } = await supabase
      .from('locations')
      .update({ 
        name: '厨 Sawa',
        slug: 'kuriya-sawa-sengendai-season5-ep11-name-corrected'
      })
      .eq('id', location.id)
    
    if (error) {
      console.error('❌ 更新エラー:', error)
      return
    }
    
    console.log('\n✅ 店舗名修正完了')
    console.log('📝 修正内容:')
    console.log('   旧名: 厨sawa')
    console.log('   新名: 厨 Sawa（タベログ正式名称）')
    
    console.log('\n🎊 厨 Sawa店舗名修正完了！')
    console.log('タベログURLと一致する正確な店舗名に更新！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

fixKuriyaSawaNameMismatch().catch(console.error)