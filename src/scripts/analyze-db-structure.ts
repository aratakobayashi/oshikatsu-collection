#!/usr/bin/env npx tsx

/**
 * DB構造分析と最適化提案
 * ユーザージャーニーに基づいた構造整理
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

async function analyzeDBStructure() {
  console.log('🔍 DB構造分析とユーザージャーニー最適化')
  console.log('=' .repeat(60))
  console.log('📱 ユーザージャーニー:')
  console.log('1️⃣ セレブリティを探す')
  console.log('2️⃣ エピソードをチェック')
  console.log('3️⃣ ロケーションを見つける')
  console.log('4️⃣ 食べログで予約（アフィリエイト収益）')
  console.log('=' .repeat(60))
  
  // 1. セレブリティ（メンバー）分析
  const { data: members } = await supabase
    .from('members')
    .select('*')
  
  console.log('\n👥 【セレブリティ/メンバー】')
  console.log(`総数: ${members?.length || 0}人`)
  
  if (members && members.length > 0) {
    console.log('サンプル:')
    members.slice(0, 3).forEach(m => {
      console.log(`  - ${m.name} (${m.group_name})`)
    })
  }
  
  // 2. エピソード分析
  const { data: episodes } = await supabase
    .from('episodes')
    .select('*')
  
  console.log('\n📺 【エピソード】')
  console.log(`総数: ${episodes?.length || 0}件`)
  
  // 3. エピソード-ロケーション関連分析
  const { data: episodeLocations } = await supabase
    .from('episode_locations')
    .select('*')
  
  console.log('\n🔗 【エピソード-ロケーション関連】')
  console.log(`総リンク数: ${episodeLocations?.length || 0}件`)
  
  // ユニークなエピソードとロケーション数
  const uniqueEpisodes = new Set(episodeLocations?.map(el => el.episode_id))
  const uniqueLocations = new Set(episodeLocations?.map(el => el.location_id))
  
  console.log(`ロケーション紐付きエピソード: ${uniqueEpisodes.size}件`)
  console.log(`エピソード紐付きロケーション: ${uniqueLocations.size}件`)
  
  // 4. ロケーション分析
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
  
  const locationsWithTabelog = locations?.filter(l => l.tabelog_url) || []
  
  console.log('\n📍 【ロケーション】')
  console.log(`総数: ${locations?.length || 0}件`)
  console.log(`Tabelog設定済み: ${locationsWithTabelog.length}件`)
  
  // 5. 収益ポテンシャル分析
  console.log('\n💰 【収益ポテンシャル分析】')
  
  // エピソード紐付きでTabelog設定済み
  const revenueOptimalLocations = []
  for (const locId of uniqueLocations) {
    const loc = locations?.find(l => l.id === locId)
    if (loc?.tabelog_url) {
      revenueOptimalLocations.push(loc)
    }
  }
  
  console.log(`最適化済み（エピソード+Tabelog）: ${revenueOptimalLocations.length}件`)
  console.log(`月間収益ポテンシャル: ¥${revenueOptimalLocations.length * 120}`)
  
  // 6. 問題点の特定
  console.log('\n⚠️ 【現在の問題点】')
  
  // エピソードはあるがロケーションがない
  const episodesWithoutLocation = episodes?.filter(ep => 
    !episodeLocations?.some(el => el.episode_id === ep.id)
  ) || []
  
  console.log(`1. ロケーション未設定エピソード: ${episodesWithoutLocation.length}件`)
  
  // ロケーションはあるがTabelogがない
  const locationsInEpisodesWithoutTabelog = []
  for (const locId of uniqueLocations) {
    const loc = locations?.find(l => l.id === locId)
    if (!loc?.tabelog_url) {
      locationsInEpisodesWithoutTabelog.push(loc)
    }
  }
  
  console.log(`2. エピソード紐付きだがTabelog未設定: ${locationsInEpisodesWithoutTabelog.length}件`)
  
  // Tabelogはあるがエピソードがない
  const tabelogWithoutEpisode = locationsWithTabelog.filter(l => 
    !uniqueLocations.has(l.id)
  )
  
  console.log(`3. Tabelog設定済みだがエピソード未紐付き: ${tabelogWithoutEpisode.length}件`)
  
  // 7. 最適化提案
  console.log('\n✨ 【DB構造最適化提案】')
  console.log('=' .repeat(60))
  
  console.log('\n📊 理想的なDB構造:')
  console.log('```')
  console.log('celebrities (セレブリティ)')
  console.log('  ↓')
  console.log('episodes (エピソード/動画)')
  console.log('  ↓')
  console.log('episode_locations (中間テーブル)')
  console.log('  ↓')
  console.log('locations (ロケーション)')
  console.log('  ├─ tabelog_url (アフィリエイト)')
  console.log('  └─ その他店舗情報')
  console.log('```')
  
  console.log('\n🔧 推奨アクション:')
  console.log('1. セレブリティとエピソードの関連強化')
  console.log('2. エピソード紐付きロケーションへのTabelog URL追加')
  console.log('3. 人気エピソードのロケーション優先でアフィリエイト設定')
  console.log('4. ユーザー行動分析でコンバージョン率向上')
  
  // 8. 収益最大化の戦略
  console.log('\n💎 【収益最大化戦略】')
  console.log('=' .repeat(60))
  
  const maxRevenuePotential = uniqueLocations.size * 120
  const currentRevenue = revenueOptimalLocations.length * 120
  const untappedRevenue = maxRevenuePotential - currentRevenue
  
  console.log(`現在の月間収益: ¥${currentRevenue}`)
  console.log(`最大ポテンシャル: ¥${maxRevenuePotential}`)
  console.log(`未開拓収益: ¥${untappedRevenue}`)
  console.log(`改善余地: ${Math.round(untappedRevenue / maxRevenuePotential * 100)}%`)
  
  // サンプルデータ表示
  if (locationsInEpisodesWithoutTabelog.length > 0) {
    console.log('\n📋 Tabelog追加候補（エピソード紐付き）:')
    locationsInEpisodesWithoutTabelog.slice(0, 5).forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc?.name}`)
      console.log(`     住所: ${loc?.address || '未設定'}`)
    })
  }
  
  return {
    celebrities: members?.length || 0,
    episodes: episodes?.length || 0,
    locations: locations?.length || 0,
    episode_linked_locations: uniqueLocations.size,
    tabelog_enabled: locationsWithTabelog.length,
    optimal_revenue_locations: revenueOptimalLocations.length,
    untapped_potential: locationsInEpisodesWithoutTabelog.length
  }
}

analyzeDBStructure()