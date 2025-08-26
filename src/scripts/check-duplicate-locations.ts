#!/usr/bin/env npx tsx

/**
 * 重複ロケーション調査スクリプト
 * エピソード紐付きと重複レコードを詳細確認
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

async function checkDuplicateLocations() {
  console.log('🔍 重複ロケーション調査開始')
  console.log('📊 エピソード紐付きと重複レコード確認')
  console.log('=' .repeat(60))
  
  // 全ロケーション取得
  const { data: allLocations, error } = await supabase
    .from('locations')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('❌ データベースエラー:', error.message)
    return
  }
  
  console.log(`📊 総ロケーション数: ${allLocations?.length || 0}件`)
  
  // 名前でグループ化して重複を検出
  const nameGroups: { [key: string]: any[] } = {}
  
  allLocations?.forEach(loc => {
    const name = loc.name || 'Unknown'
    if (!nameGroups[name]) {
      nameGroups[name] = []
    }
    nameGroups[name].push(loc)
  })
  
  // 重複があるものを抽出
  const duplicates = Object.entries(nameGroups).filter(([_, locs]) => locs.length > 1)
  
  console.log(`\n⚠️ 重複ロケーション: ${duplicates.length}件`)
  
  // 重複詳細表示
  duplicates.forEach(([name, locs], index) => {
    console.log(`\n${index + 1}. 【${name}】 (${locs.length}件の重複)`)
    locs.forEach((loc, idx) => {
      console.log(`   ${idx + 1}. ID: ${loc.id}`)
      console.log(`      住所: ${loc.address || '未設定'}`)
      console.log(`      Tabelog URL: ${loc.tabelog_url || 'なし'}`)
      console.log(`      エピソードID: ${loc.episode_id || 'なし'}`)
      console.log(`      作成日: ${new Date(loc.created_at).toLocaleDateString()}`)
      console.log(`      更新日: ${new Date(loc.updated_at).toLocaleDateString()}`)
    })
  })
  
  // アフィリエイト設定済みレコードの確認
  const affiliateLocations = allLocations?.filter(loc => loc.tabelog_url) || []
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 アフィリエイト設定状況')
  console.log('=' .repeat(60))
  console.log(`✅ アフィリエイト設定済み: ${affiliateLocations.length}件`)
  
  // エピソードとの紐付き確認
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, location_id')
  
  const episodeLocationIds = new Set(episodes?.map(ep => ep.location_id).filter(id => id))
  
  console.log(`\n📺 エピソード紐付き状況:`)
  console.log(`• 総エピソード数: ${episodes?.length || 0}件`)
  console.log(`• ロケーション紐付きエピソード: ${episodeLocationIds.size}件`)
  
  // アフィリエイト設定済みでエピソード紐付きがないもの
  const affiliateWithoutEpisode = affiliateLocations.filter(loc => 
    !episodes?.some(ep => ep.location_id === loc.id)
  )
  
  console.log(`\n⚠️ エピソード紐付きなしのアフィリエイト店舗: ${affiliateWithoutEpisode.length}件`)
  affiliateWithoutEpisode.forEach((loc, index) => {
    console.log(`   ${index + 1}. ${loc.name}`)
    console.log(`      ID: ${loc.id}`)
    console.log(`      URL: ${loc.tabelog_url}`)
  })
  
  // 重複かつアフィリエイト設定済みの問題ケース
  console.log('\n' + '=' .repeat(60))
  console.log('🚨 要対処: 重複かつアフィリエイト設定済み')
  console.log('=' .repeat(60))
  
  duplicates.forEach(([name, locs]) => {
    const hasAffiliate = locs.filter(loc => loc.tabelog_url)
    if (hasAffiliate.length > 0) {
      console.log(`\n【${name}】`)
      locs.forEach((loc, idx) => {
        const hasEpisode = episodes?.some(ep => ep.location_id === loc.id)
        console.log(`   ${idx + 1}. ID: ${loc.id}`)
        console.log(`      Tabelog: ${loc.tabelog_url ? '✅' : '❌'}`)
        console.log(`      エピソード: ${hasEpisode ? '✅' : '❌'}`)
        console.log(`      推奨: ${hasEpisode ? '保持' : loc.tabelog_url ? '統合候補' : '削除候補'}`)
      })
    }
  })
  
  // 統計サマリー
  console.log('\n' + '=' .repeat(60))
  console.log('📊 統計サマリー')
  console.log('=' .repeat(60))
  console.log(`• 総ロケーション: ${allLocations?.length || 0}件`)
  console.log(`• 重複グループ: ${duplicates.length}件`)
  console.log(`• アフィリエイト設定済み: ${affiliateLocations.length}件`)
  console.log(`• エピソード紐付きあり: ${episodeLocationIds.size}件`)
  console.log(`• エピソードなしアフィリエイト: ${affiliateWithoutEpisode.length}件`)
  
  return {
    total_locations: allLocations?.length || 0,
    duplicate_groups: duplicates.length,
    affiliate_locations: affiliateLocations.length,
    episode_linked: episodeLocationIds.size,
    affiliate_without_episode: affiliateWithoutEpisode.length
  }
}

checkDuplicateLocations()