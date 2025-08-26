#!/usr/bin/env npx tsx

/**
 * 新しいAPIクエリのテスト
 * 中間テーブル対応後のクエリが正常に動作するか確認
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

async function testNewAPIQueries() {
  console.log('🧪 新しいAPIクエリテスト')
  console.log('=' .repeat(50))
  
  try {
    // 1. 新しいLocationsクエリのテスト
    console.log('\n📍 【Locationsクエリテスト】')
    
    const { data: locationsData, error: locationsError } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(5) // テスト用に5件に制限
    
    if (locationsError) {
      console.error('❌ Locationsクエリエラー:', locationsError)
      throw locationsError
    }
    
    console.log(`✅ Locationsクエリ成功: ${locationsData?.length || 0}件取得`)
    
    // データ構造の確認
    if (locationsData && locationsData.length > 0) {
      const sampleLocation = locationsData[0]
      console.log('\n📊 サンプルデータ構造:')
      console.log(`  Location Name: ${sampleLocation.name}`)
      console.log(`  Episode Links: ${sampleLocation.episode_locations?.length || 0}件`)
      
      if (sampleLocation.episode_locations && sampleLocation.episode_locations.length > 0) {
        const firstEpisode = sampleLocation.episode_locations[0]
        console.log('  First Episode:')
        console.log(`    Title: ${firstEpisode.episodes?.title || '不明'}`)
        console.log(`    Celebrity: ${firstEpisode.episodes?.celebrities?.name || '不明'}`)
        console.log(`    Date: ${firstEpisode.episodes?.date || '不明'}`)
      }
    }
    
    // 2. データ処理テスト
    console.log('\n🔄 【データ処理テスト】')
    
    const processedLocations = (locationsData || []).map(location => {
      // 新しい処理ロジック
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
    
    console.log(`✅ データ処理成功: ${processedLocations.length}件処理`)
    
    // 処理結果の確認
    processedLocations.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}`)
      console.log(`     Episodes: ${loc.episodes_count}件`)
      console.log(`     Primary Episode: ${loc.episode?.title || 'なし'}`)
      console.log(`     Celebrity: ${loc.episode?.celebrity?.name || 'なし'}`)
    })
    
    // 3. アフィリエイトリンクの確認
    console.log('\n💰 【アフィリエイトリンク確認】')
    
    const affiliateLocations = processedLocations.filter(loc => loc.tabelog_url)
    console.log(`✅ アフィリエイト設定済み: ${affiliateLocations.length}件`)
    
    affiliateLocations.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}`)
      console.log(`     URL: ${loc.tabelog_url}`)
      console.log(`     Episodes: ${loc.episodes_count}件`)
    })
    
    // 4. 複数エピソード対応の確認
    console.log('\n📺 【複数エピソード対応確認】')
    
    const multiEpisodeLocations = processedLocations.filter(loc => loc.episodes_count > 1)
    console.log(`✅ 複数エピソード店舗: ${multiEpisodeLocations.length}件`)
    
    if (multiEpisodeLocations.length > 0) {
      multiEpisodeLocations.forEach((loc, idx) => {
        console.log(`  ${idx + 1}. ${loc.name} (${loc.episodes_count}件)`)
        loc.episodes.forEach((ep, epIdx) => {
          console.log(`     Episode ${epIdx + 1}: ${ep.title}`)
          console.log(`       Celebrity: ${ep.celebrity?.name || '不明'}`)
        })
      })
    } else {
      console.log('  現在複数エピソードを持つ店舗はありません')
      console.log('  将来の拡張に備えて構造は準備済みです')
    }
    
    // 5. パフォーマンステスト
    console.log('\n⚡ 【パフォーマンステスト】')
    
    const start = Date.now()
    
    const { data: perfTestData } = await supabase
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
            celebrities(id, name, slug)
          )
        )
      `)
      .not('episode_locations', 'is', null)
      .limit(50)
    
    const duration = Date.now() - start
    console.log(`✅ 50件取得時間: ${duration}ms`)
    console.log(`✅ 実取得件数: ${perfTestData?.length || 0}件`)
    
    if (duration < 2000) {
      console.log('🌟 パフォーマンス: 優秀')
    } else if (duration < 5000) {
      console.log('⚡ パフォーマンス: 良好')
    } else {
      console.log('⚠️ パフォーマンス: 要改善')
    }
    
    // 6. 最終結果
    console.log('\n🎯 【テスト結果サマリー】')
    console.log('=' .repeat(50))
    console.log(`✅ APIクエリ: 正常動作`)
    console.log(`✅ データ処理: ${processedLocations.length}件成功`)
    console.log(`✅ アフィリエイト: ${affiliateLocations.length}件保護`)
    console.log(`✅ 複数エピソード: ${multiEpisodeLocations.length}件対応`)
    console.log(`✅ パフォーマンス: ${duration}ms`)
    
    console.log('\n🚀 フロントエンド対応準備完了！')
    
    return {
      success: true,
      locations_count: processedLocations.length,
      affiliate_count: affiliateLocations.length,
      multi_episode_count: multiEpisodeLocations.length,
      performance_ms: duration
    }
    
  } catch (error) {
    console.error('❌ テスト失敗:', error)
    
    console.log('\n🔧 トラブルシューティング:')
    console.log('1. episode_locationsテーブルの存在確認')
    console.log('2. データ移行の完了確認')
    console.log('3. RLSポリシーの設定確認')
    
    return {
      success: false,
      error: error.message
    }
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  testNewAPIQueries()
}

export { testNewAPIQueries }