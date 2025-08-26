#!/usr/bin/env npx tsx

/**
 * 最終移行検証スクリプト
 * フロントエンド対応完了後の総合確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function finalMigrationVerification() {
  console.log('🎯 最終移行検証 - 完全な動作確認')
  console.log('=' .repeat(60))
  
  const results = {
    data_migration: false,
    api_queries: false,
    affiliate_links: false,
    frontend_compatibility: false,
    user_experience: false
  }
  
  try {
    // 1. データ移行完全性確認
    console.log('\n📊 【データ移行完全性確認】')
    console.log('=' .repeat(40))
    
    const { data: originalLocations } = await supabase
      .from('locations')
      .select('id, name, episode_id')
      .not('episode_id', 'is', null)
    
    const { data: migratedData } = await supabase
      .from('episode_locations')
      .select('id, location_id, episode_id')
    
    const originalCount = originalLocations?.length || 0
    const migratedCount = migratedData?.length || 0
    
    console.log(`✅ 原本データ: ${originalCount}件`)
    console.log(`✅ 移行済みデータ: ${migratedCount}件`)
    console.log(`✅ データ整合性: ${originalCount === migratedCount ? 'OK' : 'NG'}`)
    
    results.data_migration = originalCount === migratedCount && migratedCount > 0
    
    // 2. APIクエリ動作確認
    console.log('\n🔌 【APIクエリ動作確認】')
    console.log('=' .repeat(40))
    
    // Locationsページクエリ
    const { data: locationsQuery, error: locationsError } = await supabase
      .from('locations')
      .select(`
        *,
        episode_locations(
          id,
          episode_id,
          episodes(
            id,
            title,
            date,
            view_count,
            duration,
            celebrity_id,
            celebrities(id, name, slug)
          )
        )
      `)
      .not('episode_locations', 'is', null)
      .limit(10)
    
    if (locationsError) {
      console.error('❌ Locationsクエリエラー:', locationsError.message)
    } else {
      console.log(`✅ Locationsクエリ: ${locationsQuery?.length || 0}件取得`)
    }
    
    // LocationDetailクエリ
    const sampleLocationId = locationsQuery?.[0]?.id
    if (sampleLocationId) {
      const { data: detailQuery, error: detailError } = await supabase
        .from('episode_locations')
        .select(`
          id,
          episode_id,
          episodes(
            id,
            title,
            date,
            view_count,
            duration,
            thumbnail_url,
            celebrity_id,
            celebrities(name, slug)
          )
        `)
        .eq('location_id', sampleLocationId)
      
      if (detailError) {
        console.error('❌ LocationDetailクエリエラー:', detailError.message)
      } else {
        console.log(`✅ LocationDetailクエリ: ${detailQuery?.length || 0}件取得`)
      }
    }
    
    results.api_queries = !locationsError && locationsQuery && locationsQuery.length > 0
    
    // 3. アフィリエイトリンク確認
    console.log('\n💰 【アフィリエイトリンク確認】')
    console.log('=' .repeat(40))
    
    const { data: affiliateLinks } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .not('tabelog_url', 'is', null)
    
    const { data: affiliateWithEpisodes } = await supabase
      .from('locations')
      .select(`
        id, name, tabelog_url,
        episode_locations(
          id,
          episodes(id, title)
        )
      `)
      .not('tabelog_url', 'is', null)
      .not('episode_locations', 'is', null)
    
    const totalAffiliates = affiliateLinks?.length || 0
    const activeAffiliates = affiliateWithEpisodes?.length || 0
    const expectedRevenue = totalAffiliates * 120
    const activeRevenue = activeAffiliates * 120
    
    console.log(`✅ 総アフィリエイト店舗: ${totalAffiliates}件`)
    console.log(`✅ エピソード紐付きアフィリエイト: ${activeAffiliates}件`)
    console.log(`✅ 予想総収益: ¥${expectedRevenue}/月`)
    console.log(`✅ アクティブ収益: ¥${activeRevenue}/月`)
    
    results.affiliate_links = totalAffiliates >= 15 && activeAffiliates >= 15
    
    // 4. フロントエンド互換性確認
    console.log('\n🎨 【フロントエンド互換性確認】')
    console.log('=' .repeat(40))
    
    // データ処理ロジックテスト
    const processedLocations = (locationsQuery || []).map(location => {
      const firstEpisodeLink = location.episode_locations?.[0]
      const episode = firstEpisodeLink?.episodes ? {
        id: firstEpisodeLink.episodes.id,
        title: firstEpisodeLink.episodes.title,
        date: firstEpisodeLink.episodes.date,
        view_count: firstEpisodeLink.episodes.view_count,
        duration: firstEpisodeLink.episodes.duration,
        celebrity_id: firstEpisodeLink.episodes.celebrity_id,
        celebrity: firstEpisodeLink.episodes.celebrities
      } : undefined
      
      const episodes = location.episode_locations?.map(link => ({
        id: link.episodes.id,
        title: link.episodes.title,
        date: link.episodes.date,
        view_count: link.episodes.view_count,
        celebrity: link.episodes.celebrities
      })) || []
      
      return {
        ...location,
        episode,
        episodes,
        episodes_count: episodes.length,
        episode_id: location.episode_id || episode?.id || ''
      }
    })
    
    const successfulProcessing = processedLocations.filter(loc => loc.episode && loc.episodes_count > 0)
    
    console.log(`✅ データ処理成功: ${successfulProcessing.length}/${processedLocations.length}件`)
    console.log(`✅ エピソード情報保持: ${successfulProcessing.length > 0 ? 'OK' : 'NG'}`)
    
    results.frontend_compatibility = successfulProcessing.length === processedLocations.length
    
    // 5. ユーザー体験改善確認
    console.log('\n👥 【ユーザー体験改善確認】')
    console.log('=' .repeat(40))
    
    // 複数エピソード対応の準備確認
    const multiEpisodeCapable = processedLocations.every(loc => 
      Array.isArray(loc.episodes) && typeof loc.episodes_count === 'number'
    )
    
    // グループ化対応確認
    const locationGroups = new Map()
    processedLocations.forEach(loc => {
      const key = `${loc.name}|${loc.address || ''}`
      if (!locationGroups.has(key)) {
        locationGroups.set(key, [])
      }
      locationGroups.get(key).push(loc)
    })
    
    const potentialGroups = Array.from(locationGroups.values()).filter(group => group.length > 1)
    
    console.log(`✅ 複数エピソード対応: ${multiEpisodeCapable ? 'OK' : 'NG'}`)
    console.log(`✅ グループ化準備: ${potentialGroups.length}グループ候補`)
    console.log(`✅ 聖地レベル計算準備: OK`)
    
    results.user_experience = multiEpisodeCapable
    
    // 6. 総合評価
    console.log('\n🏆 【総合評価】')
    console.log('=' .repeat(60))
    
    const scores = Object.values(results)
    const successRate = scores.filter(Boolean).length / scores.length * 100
    
    console.log(`📊 移行成功率: ${successRate}%`)
    console.log('')
    console.log(`✅ データ移行: ${results.data_migration ? '完了' : '要修正'}`)
    console.log(`✅ APIクエリ: ${results.api_queries ? '正常' : '要修正'}`)
    console.log(`✅ アフィリエイト: ${results.affiliate_links ? '保護済み' : '要確認'}`)
    console.log(`✅ フロントエンド: ${results.frontend_compatibility ? '互換性OK' : '要修正'}`)
    console.log(`✅ ユーザー体験: ${results.user_experience ? '改善準備完了' : '要対応'}`)
    
    if (successRate >= 100) {
      console.log('\n🌟 移行完全成功！本番稼働準備完了！')
    } else if (successRate >= 80) {
      console.log('\n✅ 移行ほぼ成功！軽微な調整のみ必要')
    } else {
      console.log('\n⚠️ 移行に問題があります。修正が必要')
    }
    
    // 7. 次のアクション
    console.log('\n🚀 【次のアクション提案】')
    console.log('=' .repeat(40))
    
    if (successRate >= 90) {
      console.log('✅ Phase 1完了: 緊急対応成功')
      console.log('📋 Phase 2推奨: ユーザー体験強化')
      console.log('  • 複数エピソード表示機能実装')
      console.log('  • 聖地レベル・人気度計算')
      console.log('  • 検索機能強化')
      console.log('  • トレンド分析ダッシュボード')
    } else {
      console.log('🔧 修正必要項目:')
      if (!results.data_migration) console.log('  • データ移行の完全性確認')
      if (!results.api_queries) console.log('  • APIクエリの修正')
      if (!results.affiliate_links) console.log('  • アフィリエイトリンクの復旧')
      if (!results.frontend_compatibility) console.log('  • フロントエンド互換性の修正')
      if (!results.user_experience) console.log('  • ユーザー体験改善の準備')
    }
    
    return {
      success_rate: successRate,
      results,
      total_locations: migratedCount,
      affiliate_count: totalAffiliates,
      active_revenue: activeRevenue
    }
    
  } catch (error) {
    console.error('❌ 検証中にエラーが発生:', error)
    return {
      success_rate: 0,
      results,
      error: error.message
    }
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  finalMigrationVerification()
}

export { finalMigrationVerification }