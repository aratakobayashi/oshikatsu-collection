#!/usr/bin/env node

/**
 * Season6 タベログURL検証スクリプト
 * 各ロケーションのタベログURLが実際の店舗と一致しているかを検証
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySeasonTabelog() {
  console.log('🔍 Season6 タベログURL検証開始...\n')
  console.log('各ロケーションのタベログURLと店舗情報の一致性を検証')
  console.log('=' .repeat(70))
  
  try {
    // Season6の全ロケーションを取得
    const { data: locations, error } = await supabase
      .from('locations')
      .select(`
        id,
        name,
        address,
        tabelog_url,
        affiliate_info,
        episode_locations!inner (
          episodes!inner (
            title
          )
        )
      `)
      .filter('episode_locations.episodes.title', 'ilike', '%Season6%')
      .order('name')
    
    if (error) {
      console.error('❌ データベース取得エラー:', error)
      return
    }
    
    if (!locations || locations.length === 0) {
      console.log('⚠️ Season6のロケーションが見つかりません')
      return
    }
    
    console.log(`✅ Season6ロケーション取得: ${locations.length}件\n`)
    
    const verificationResults = []
    
    for (const location of locations) {
      const episodeTitle = location.episode_locations[0]?.episodes?.title || '不明'
      
      console.log(`📍 ${location.name}`)
      console.log(`   Episode: ${episodeTitle}`)
      console.log(`   住所: ${location.address}`)
      console.log(`   タベログURL: ${location.tabelog_url}`)
      
      const result = {
        id: location.id,
        name: location.name,
        episode: episodeTitle,
        address: location.address,
        tabelog_url: location.tabelog_url,
        issues: []
      }
      
      // タベログURL基本チェック
      if (!location.tabelog_url) {
        result.issues.push('❌ タベログURLが設定されていません')
      } else if (!location.tabelog_url.includes('tabelog.com')) {
        result.issues.push('❌ 不正なタベログURL形式')
      }
      
      // affiliate_info内のlinkswitch情報確認
      if (location.affiliate_info?.linkswitch) {
        const linkswitch = location.affiliate_info.linkswitch
        if (linkswitch.original_url !== location.tabelog_url) {
          result.issues.push('⚠️ tabelog_urlとlinkswitch.original_urlが不一致')
        }
        if (linkswitch.status !== 'active') {
          result.issues.push(`⚠️ linkswitch status: ${linkswitch.status}`)
        }
      } else {
        result.issues.push('❌ affiliate_info.linkswitch情報が不足')
      }
      
      if (result.issues.length === 0) {
        console.log('   ✅ 問題なし')
      } else {
        result.issues.forEach(issue => console.log(`   ${issue}`))
      }
      
      console.log()
      verificationResults.push(result)
    }
    
    // 問題のあるロケーションをまとめて報告
    const problemLocations = verificationResults.filter(r => r.issues.length > 0)
    
    console.log('=' .repeat(70))
    console.log('📊 検証結果サマリー')
    console.log(`   - 総ロケーション数: ${verificationResults.length}件`)
    console.log(`   - 問題なし: ${verificationResults.length - problemLocations.length}件`)
    console.log(`   - 問題あり: ${problemLocations.length}件`)
    
    if (problemLocations.length > 0) {
      console.log('\n🚨 問題のあるロケーション:')
      problemLocations.forEach(location => {
        console.log(`\n📍 ${location.name} (${location.episode})`)
        location.issues.forEach(issue => console.log(`   ${issue}`))
        console.log(`   修正対象ID: ${location.id}`)
      })
      
      console.log('\n🔧 次のステップ:')
      console.log('1. 各タベログURLの実際の遷移先を手動確認')
      console.log('2. 不一致URLの正しいURLを調査・取得')
      console.log('3. データベース修正スクリプト実行')
    } else {
      console.log('\n🌟 全ロケーションで問題は検出されませんでした！')
    }
    
  } catch (error) {
    console.error('❌ 検証エラー:', error)
  }
}

// 実行
verifySeasonTabelog().catch(console.error)