#!/usr/bin/env npx tsx

/**
 * 直接リンク vs 中間テーブルの詳細分析
 * メリット・デメリットと実際のデータパターンを調査
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

async function analyzeRelationshipPatterns() {
  console.log('🔍 直接リンク vs 中間テーブル - 完全分析')
  console.log('=' .repeat(70))
  
  // 1. 現在のデータパターン調査
  console.log('\n📊 【現在のデータ状況】')
  
  // 直接リンク（locations.episode_id）
  const { data: directLinks } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url')
    .not('episode_id', 'is', null)
  
  // 中間テーブル（episode_locations）
  const { data: junctionLinks } = await supabase
    .from('episode_locations')
    .select('location_id, episode_id, visited_at, description')
  
  console.log(`直接リンク（locations.episode_id）: ${directLinks?.length || 0}件`)
  console.log(`中間テーブル（episode_locations）: ${junctionLinks?.length || 0}件`)
  
  // 重複チェック
  const directLocationIds = new Set(directLinks?.map(l => l.id) || [])
  const junctionLocationIds = new Set(junctionLinks?.map(el => el.location_id) || [])
  
  const overlap = Array.from(directLocationIds).filter(id => junctionLocationIds.has(id))
  const onlyDirect = Array.from(directLocationIds).filter(id => !junctionLocationIds.has(id))
  const onlyJunction = Array.from(junctionLocationIds).filter(id => !directLocationIds.has(id))
  
  console.log(`\n🔗 【重複分析】`)
  console.log(`両方にあり: ${overlap.length}件`)
  console.log(`直接のみ: ${onlyDirect.length}件`)
  console.log(`中間テーブルのみ: ${onlyJunction.length}件`)
  
  // 2. 実際のユースケース分析
  console.log('\n🎯 【実際のユースケース分析】')
  
  // 複数エピソードを持つロケーションの調査
  const locationEpisodeCount = new Map()
  
  // 直接リンクから
  directLinks?.forEach(loc => {
    const count = locationEpisodeCount.get(loc.id) || 0
    locationEpisodeCount.set(loc.id, count + 1)
  })
  
  // 中間テーブルから
  junctionLinks?.forEach(el => {
    const count = locationEpisodeCount.get(el.location_id) || 0
    locationEpisodeCount.set(el.location_id, count + 1)
  })
  
  const multiEpisodeLocations = Array.from(locationEpisodeCount.entries())
    .filter(([_, count]) => count > 1)
  
  console.log(`複数エピソード持ちロケーション: ${multiEpisodeLocations.length}件`)
  
  if (multiEpisodeLocations.length > 0) {
    console.log('詳細:')
    for (const [locationId, count] of multiEpisodeLocations.slice(0, 5)) {
      const location = directLinks?.find(l => l.id === locationId)
      console.log(`  ${location?.name || locationId}: ${count}エピソード`)
    }
  }
  
  // 3. パフォーマンス比較
  console.log('\n⚡ 【パフォーマンス比較】')
  
  // 直接リンククエリのシミュレーション
  const start1 = Date.now()
  const { data: directQuery } = await supabase
    .from('locations')
    .select('id, name, episode_id, episodes(title)')
    .not('episode_id', 'is', null)
    .limit(10)
  const directTime = Date.now() - start1
  
  // 中間テーブルクエリのシミュレーション
  const start2 = Date.now()
  const { data: junctionQuery } = await supabase
    .from('episode_locations')
    .select('location_id, locations(name), episodes(title)')
    .limit(10)
  const junctionTime = Date.now() - start2
  
  console.log(`直接リンククエリ時間: ${directTime}ms`)
  console.log(`中間テーブルクエリ時間: ${junctionTime}ms`)
  
  // 4. メリット・デメリット分析
  console.log('\n📋 【メリット・デメリット完全比較】')
  console.log('=' .repeat(70))
  
  console.log('\n🔗 【直接リンク（locations.episode_id）】')
  console.log('✅ メリット:')
  console.log('  • シンプルな構造でわかりやすい')
  console.log('  • JOINが少なく高速クエリ')
  console.log('  • 既存データ721件をそのまま活用')
  console.log('  • 開発・メンテナンスが楽')
  console.log('  • 1対1の明確な関係')
  
  console.log('\n❌ デメリット:')
  console.log('  • 1ロケーションに1エピソードしか紐付けられない')
  console.log('  • 複数エピソードで使われる店舗に対応不可')
  console.log('  • 将来の拡張性に制限')
  console.log('  • 同じ店舗の重複レコード作成が必要になる可能性')
  
  console.log('\n🔗 【中間テーブル（episode_locations）】')
  console.log('✅ メリット:')
  console.log('  • 1ロケーションに複数エピソード対応')
  console.log('  • 正規化されたDB設計')
  console.log('  • 訪問時間・説明などメタデータ保存可能')
  console.log('  • 将来の拡張性抜群')
  console.log('  • 多対多の柔軟な関係')
  
  console.log('\n❌ デメリット:')
  console.log('  • 複雑なJOINクエリが必要')
  console.log('  • 既存721件のデータ移行が必要')
  console.log('  • 開発・保守の複雑性増加')
  console.log('  • パフォーマンス劣化の可能性')
  
  // 5. 収益への影響分析
  console.log('\n💰 【収益への影響分析】')
  console.log('=' .repeat(70))
  
  const directWithTabelog = directLinks?.filter(l => l.tabelog_url) || []
  
  console.log(`現在のTabelog設定済み（直接リンク）: ${directWithTabelog.length}件`)
  console.log(`月間収益: ¥${directWithTabelog.length * 120}`)
  
  console.log('\n🎯 【どちらを選ぶべきか？】')
  console.log('=' .repeat(70))
  
  // 実際のデータから判断材料を提供
  const realMultiEpisodeNeeds = multiEpisodeLocations.length
  const currentAffiliatePriority = directWithTabelog.length
  const dataVolume = directLinks?.length || 0
  
  console.log('\n📈 【判断材料】')
  console.log(`現在のデータ量: ${dataVolume}件（直接リンク優勢）`)
  console.log(`複数エピソード需要: ${realMultiEpisodeNeeds}件`)
  console.log(`アフィリエイト優先度: ${currentAffiliatePriority}件設定済み`)
  
  console.log('\n💡 【推奨パターン別】')
  
  if (realMultiEpisodeNeeds < 10 && currentAffiliatePriority > 10) {
    console.log('🎯 【推奨: 直接リンク統一】')
    console.log('理由:')
    console.log('  • 複数エピソード需要が少ない')
    console.log('  • アフィリエイト収益が既に動いている')
    console.log('  • 大量データの移行リスク回避')
    console.log('  • 開発速度優先')
  } else if (realMultiEpisodeNeeds > 50) {
    console.log('🎯 【推奨: 中間テーブル統一】')
    console.log('理由:')
    console.log('  • 複数エピソード需要が高い')
    console.log('  • 長期的な拡張性重視')
    console.log('  • データ正規化が必要')
  } else {
    console.log('🎯 【推奨: 段階的移行】')
    console.log('理由:')
    console.log('  • 中間的な状況')
    console.log('  • 現状維持→必要に応じて移行')
  }
  
  // 6. 移行コスト分析
  console.log('\n💸 【移行コスト分析】')
  console.log('=' .repeat(70))
  
  console.log('\n📊 直接リンク→中間テーブル移行:')
  console.log(`  移行対象: ${dataVolume}件`)
  console.log(`  推定工数: ${Math.ceil(dataVolume / 100)}日（100件/日）`)
  console.log(`  リスク: 高（既存アフィリエイト収益への影響）`)
  console.log(`  テストコスト: 高（全機能の検証必要）`)
  
  console.log('\n📊 中間テーブル→直接リンク移行:')
  console.log(`  移行対象: ${junctionLinks?.length || 0}件`)
  console.log(`  推定工数: 1日（少量データ）`)
  console.log(`  リスク: 低（少数データ）`)
  console.log(`  テストコスト: 低`)
  
  return {
    direct_links: directLinks?.length || 0,
    junction_links: junctionLinks?.length || 0,
    multi_episode_locations: realMultiEpisodeNeeds,
    affiliate_count: directWithTabelog.length,
    performance_diff: junctionTime - directTime,
    migration_recommendation: realMultiEpisodeNeeds < 10 ? 'direct' : 'junction'
  }
}

analyzeRelationshipPatterns()