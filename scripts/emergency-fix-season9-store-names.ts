#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function emergencyFixStoreNames() {
  console.log('🚨 緊急店舗名修正開始...\n')
  
  const fixes = [
    {
      episodeId: '6237ac50-fe5e-4462-8f3b-ea08e6f7817e',
      episodeNum: 4,
      correctName: 'Sincerity（しんせらてぃ）',
      wrongName: '中国料理 天山'
    },
    {
      episodeId: '969559b3-33d3-41dd-b237-6d270cccf74f',
      episodeNum: 2,
      correctName: '魚処 にしけん',
      wrongName: '海鮮料理 みやけ'
    }
  ]
  
  for (const fix of fixes) {
    console.log(`📍 Episode ${fix.episodeNum}: 店舗名修正`)
    console.log(`  ❌ 間違い: ${fix.wrongName}`)
    console.log(`  ✅ 正しい: ${fix.correctName}`)
    
    // エピソードに関連するロケーションIDを取得
    const { data: relationData } = await supabase
      .from('episode_locations')
      .select('location_id')
      .eq('episode_id', fix.episodeId)
      .single()
    
    if (!relationData) {
      console.log(`  ❌ エピソード関連が見つかりません`)
      continue
    }
    
    // ロケーションの店舗名を修正
    const { error: updateError } = await supabase
      .from('locations')
      .update({ 
        name: fix.correctName
      })
      .eq('id', relationData.location_id)
    
    if (updateError) {
      console.error(`  ❌ 更新エラー:`, updateError)
      continue
    }
    
    console.log(`  ✅ 店舗名修正完了`)
  }
  
  console.log('\n🎉 緊急店舗名修正完了！')
}

emergencyFixStoreNames()
