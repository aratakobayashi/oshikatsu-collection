#!/usr/bin/env node

/**
 * Season4 Episode2 ロケ地詳細調査
 * 現在のデータと実際のロケ地の正確性検証
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateSeason4Episode2Location() {
  console.log('🔍 Season4 Episode2 ロケ地詳細調査...\n')
  console.log('銀座韓国風天ぷらの実際のロケ地特定・検証')
  console.log('=' .repeat(60))
  
  try {
    // Season4 Episode2を検索
    const { data: episode } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
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
      .ilike('title', '%Season4 第2話%')
      .single()
    
    if (!episode) {
      console.error('❌ Season4 第2話が見つかりません')
      return
    }
    
    console.log(`✅ Episode確認: ${episode.title}`)
    console.log(`   説明: ${episode.description}`)
    
    const locationCount = episode.episode_locations?.length || 0
    
    if (locationCount === 0) {
      console.log('\n❌ ロケーションデータが見つかりません')
      console.log('新規データ追加が必要です')
      return
    }
    
    if (locationCount > 1) {
      console.log(`\n⚠️ 複数ロケーション検出: ${locationCount}箇所`)
      console.log('1エピソード1ロケーションが正常です')
    }
    
    console.log(`\n🏪 現在のロケーションデータ分析:`)
    console.log('-' .repeat(40))
    
    episode.episode_locations.forEach((epLoc: any, index: number) => {
      const location = epLoc.locations
      if (location) {
        console.log(`\n${index + 1}. ${location.name}`)
        console.log(`   住所: ${location.address}`)
        console.log(`   タベログURL: ${location.tabelog_url || '❌ なし'}`)
        console.log(`   説明: ${location.description}`)
        
        // LinkSwitch状態確認
        const linkswitch = location.affiliate_info?.linkswitch
        if (linkswitch) {
          console.log(`   LinkSwitch: ${linkswitch.status || '未設定'} (${linkswitch.notes || 'メモなし'})`)
        } else {
          console.log(`   LinkSwitch: 未設定`)
        }
        
        // データ品質分析
        console.log(`\n   📊 データ品質分析:`)
        
        let qualityScore = 0
        let issues: string[] = []
        
        if (location.name) qualityScore += 20
        else issues.push('店名欠如')
        
        if (location.address) qualityScore += 20
        else issues.push('住所欠如')
        
        if (location.tabelog_url) qualityScore += 30
        else issues.push('タベログURL欠如')
        
        if (location.description) qualityScore += 15
        else issues.push('説明欠如')
        
        if (linkswitch?.status === 'active') qualityScore += 15
        else issues.push('LinkSwitch未有効化')
        
        console.log(`   品質スコア: ${qualityScore}/100点`)
        
        if (issues.length > 0) {
          console.log(`   課題: ${issues.join(', ')}`)
        } else {
          console.log(`   ✅ データ品質良好`)
        }
      }
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎯 Season4 Episode2 ロケ地検証結論:')
    
    // エピソードタイトル分析
    const episodeTitle = episode.title
    console.log(`\nエピソード分析:`)
    console.log(`   タイトル: ${episodeTitle}`)
    
    // キーワード抽出
    const keywords: string[] = []
    if (episodeTitle.includes('銀座')) keywords.push('銀座エリア')
    if (episodeTitle.includes('天ぷら') || episodeTitle.includes('天プラ')) keywords.push('天ぷら料理')
    if (episodeTitle.includes('韓国')) keywords.push('韓国風')
    
    console.log(`   キーワード: ${keywords.join(', ') || '不明'}`)
    
    if (locationCount > 0) {
      const location = episode.episode_locations[0].locations
      const hasTabelog = !!location.tabelog_url
      const hasActiveLS = location.affiliate_info?.linkswitch?.status === 'active'
      
      console.log(`\n収益化ポテンシャル:`)
      if (hasTabelog && hasActiveLS) {
        console.log('   ✅ 完全収益化済み')
      } else if (hasTabelog && !hasActiveLS) {
        console.log('   🟡 LinkSwitch有効化のみ必要')
      } else {
        console.log('   🔴 タベログURL調査が必要')
      }
    }
    
    console.log('\n📋 推奨アクション:')
    
    if (locationCount === 0) {
      console.log('1. 【要調査】Season4 Episode2の実際のロケ地特定')
      console.log('2. 正確な店舗情報（名前・住所）の調査')
      console.log('3. タベログURL調査・取得')
      console.log('4. 段階的データ追加・収益化')
    } else {
      const location = episode.episode_locations[0].locations
      
      console.log('1. 現在データの正確性検証')
      console.log(`   → 店名「${location.name}」の実在確認`)
      console.log(`   → 住所「${location.address}」の正確性確認`)
      
      if (!location.tabelog_url) {
        console.log('2. タベログURL調査・追加')
      }
      
      if (location.affiliate_info?.linkswitch?.status !== 'active') {
        console.log('3. LinkSwitch有効化')
      }
    }
    
    console.log('\n💡 Season4 Episode2 調査優先度:')
    if (locationCount === 0) {
      console.log('   Priority: 🔴 HIGH（データ完全欠如）')
    } else if (!episode.episode_locations[0].locations.tabelog_url) {
      console.log('   Priority: 🟡 MEDIUM（タベログURL欠如）')
    } else {
      console.log('   Priority: 🟢 LOW（基本データ有り）')
    }
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
investigateSeason4Episode2Location().catch(console.error)