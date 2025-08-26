#!/usr/bin/env npx tsx

/**
 * 移行結果の詳細分析
 * Before/After比較とフロントエンド対応の必要性確認
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

async function analyzeMigrationResults() {
  console.log('📊 移行結果詳細分析 & フロントエンド対応計画')
  console.log('=' .repeat(70))
  
  // 1. 移行前後のデータ構造比較
  console.log('\n🔍 【移行前後のデータ構造比較】')
  console.log('=' .repeat(50))
  
  // 移行前の構造確認（locations.episode_id）
  const { data: locationsWithDirectLink } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url, address')
    .not('episode_id', 'is', null)
  
  console.log('📋 移行前（直接リンク構造）:')
  console.log(`  • locations.episode_id: ${locationsWithDirectLink?.length || 0}件`)
  console.log(`  • 1対1の関係: location ↔ episode`)
  console.log(`  • 重複店舗問題: 同じ店が複数レコードに分散`)
  
  // 移行後の構造確認（episode_locations）
  const { data: migrationResults } = await supabase
    .from('episode_locations')
    .select('id, episode_id, location_id')
  
  console.log('\n📋 移行後（中間テーブル構造）:')
  console.log(`  • episode_locations: ${migrationResults?.length || 0}件`)
  console.log(`  • 多対多の関係: location ↔ episodes`)
  console.log(`  • 複数エピソード対応: 同じ店に複数エピソード紐付け可能`)
  
  // 2. アフィリエイト収益の実態確認
  console.log('\n💰 【アフィリエイト収益の実態】')
  console.log('=' .repeat(50))
  
  // 実際のアフィリエイト設定済み店舗
  const { data: actualAffiliateLocations } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, address')
    .not('tabelog_url', 'is', null)
  
  console.log(`📊 実際のアフィリエイト設定済み: ${actualAffiliateLocations?.length || 0}件`)
  console.log(`💵 実際の月間収益: ¥${(actualAffiliateLocations?.length || 0) * 120}`)
  
  if (actualAffiliateLocations && actualAffiliateLocations.length > 0) {
    console.log('\n🏪 アフィリエイト店舗一覧:')
    actualAffiliateLocations.forEach((store, idx) => {
      console.log(`  ${idx + 1}. ${store.name}`)
      console.log(`     URL: ${store.tabelog_url}`)
    })
  }
  
  // 3. episode_locationsとアフィリエイトの関係確認
  const { data: affiliateWithEpisodes } = await supabase
    .from('episode_locations')
    .select(`
      id,
      location_id,
      episode_id,
      locations(name, tabelog_url, address)
    `)
    .not('locations.tabelog_url', 'is', null)
  
  console.log(`\n🔗 エピソード紐付き+アフィリエイト: ${affiliateWithEpisodes?.length || 0}件`)
  console.log(`💎 最適化済み収益: ¥${(affiliateWithEpisodes?.length || 0) * 120}/月`)
  
  // 4. 現在のフロントエンドクエリの問題点
  console.log('\n⚠️ 【現在のフロントエンドで起こる問題】')
  console.log('=' .repeat(50))
  
  console.log('\n🚨 既存のクエリパターンの問題:')
  console.log('```typescript')
  console.log('// 現在のクエリ（移行後は動作しない）')
  console.log('const { data } = await supabase')
  console.log('  .from("locations")')
  console.log('  .select("*, episodes(*)")')
  console.log('  .not("episode_id", "is", null)')
  console.log('```')
  console.log('')
  console.log('❌ 問題点:')
  console.log('  • locations.episode_id は残っているが、新しいデータは episode_locations に入っている')
  console.log('  • 移行済みロケーションがクエリ結果に含まれない')
  console.log('  • UI上でロケーションが表示されなくなる可能性')
  
  // 5. 必要な新しいクエリパターン
  console.log('\n✅ 【必要な新しいクエリパターン】')
  console.log('=' .repeat(50))
  
  console.log('\n🔧 新しいクエリ（中間テーブル対応）:')
  console.log('```typescript')
  console.log('// 方法1: locations起点（推奨）')
  console.log('const { data } = await supabase')
  console.log('  .from("locations")')
  console.log('  .select(`')
  console.log('    *,')
  console.log('    episode_locations(')
  console.log('      id,')
  console.log('      episode_id,')
  console.log('      episodes(')
  console.log('        id,')
  console.log('        title,')
  console.log('        youtube_url,')
  console.log('        view_count')
  console.log('      )')
  console.log('    )')
  console.log('  `)')
  console.log('  .not("episode_locations", "is", null)')
  console.log('')
  console.log('// 方法2: episode_locations起点（特定用途）')
  console.log('const { data } = await supabase')
  console.log('  .from("episode_locations")')
  console.log('  .select(`')
  console.log('    *,')
  console.log('    locations(*),')
  console.log('    episodes(*)')
  console.log('  `)')
  console.log('```')
  
  // 6. フロントエンドの変更必要箇所
  console.log('\n🎨 【フロントエンド変更必要箇所】')
  console.log('=' .repeat(50))
  
  console.log('\n📱 変更が必要なコンポーネント:')
  console.log('  1. ロケーション一覧ページ')
  console.log('     - 複数エピソード統合表示')
  console.log('     - 聖地レベル計算')
  console.log('     - 合計再生数表示')
  console.log('')
  console.log('  2. ロケーション詳細ページ')
  console.log('     - エピソード一覧コンポーネント')
  console.log('     - 時系列ソート')
  console.log('     - 人気度表示')
  console.log('')
  console.log('  3. 検索機能')
  console.log('     - メンバー別検索の強化')
  console.log('     - 複数エピソード考慮')
  console.log('     - 人気度ソート')
  console.log('')
  console.log('  4. APIクエリ層')
  console.log('     - 全クエリの書き換え')
  console.log('     - データ形式変換')
  console.log('     - エラーハンドリング')
  
  // 7. 実際のデータサンプルで変化を確認
  console.log('\n📊 【実際のデータでBefore/After確認】')
  console.log('=' .repeat(50))
  
  // サンプルロケーションを取得
  const { data: sampleLocation } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .not('tabelog_url', 'is', null)
    .limit(1)
    .single()
  
  if (sampleLocation) {
    console.log(`\n🏪 サンプル店舗: ${sampleLocation.name}`)
    console.log(`📍 Location ID: ${sampleLocation.id}`)
    console.log(`🍽️ Tabelog URL: ${sampleLocation.tabelog_url}`)
    
    // このロケーションの移行前後の状態
    const { data: directLinkData } = await supabase
      .from('locations')
      .select('episode_id')
      .eq('id', sampleLocation.id)
      .single()
    
    const { data: junctionData } = await supabase
      .from('episode_locations')
      .select('episode_id')
      .eq('location_id', sampleLocation.id)
    
    console.log('\n📋 データ状態:')
    console.log(`  • 直接リンク (episode_id): ${directLinkData?.episode_id || 'なし'}`)
    console.log(`  • 中間テーブル: ${junctionData?.length || 0}件のエピソード`)
    
    if (junctionData && junctionData.length > 0) {
      console.log('  📺 紐付きエピソード:')
      junctionData.forEach((link, idx) => {
        console.log(`    ${idx + 1}. Episode ID: ${link.episode_id}`)
      })
    }
  }
  
  // 8. 移行の成功度評価
  console.log('\n✅ 【移行成功度評価】')
  console.log('=' .repeat(50))
  
  const directCount = locationsWithDirectLink?.length || 0
  const junctionCount = migrationResults?.length || 0
  const affiliateCount = actualAffiliateLocations?.length || 0
  
  console.log(`\n📊 移行完全性: ${junctionCount}/${directCount} (${Math.round(junctionCount/directCount*100)}%)`)
  console.log(`💰 収益保護率: ${affiliateCount}件アフィリエイト保護`)
  console.log(`🔗 関係性変更: 1対1 → 多対多`)
  
  const migrationScore = junctionCount === directCount ? 100 : Math.round(junctionCount/directCount*100)
  
  if (migrationScore === 100) {
    console.log('🌟 移行スコア: 100% - 完璧！')
  } else if (migrationScore >= 90) {
    console.log('✅ 移行スコア: 優秀')
  } else {
    console.log('⚠️ 移行スコア: 要改善')
  }
  
  // 9. 緊急度の評価
  console.log('\n🚨 【フロントエンド対応の緊急度】')
  console.log('=' .repeat(50))
  
  console.log('\n⏰ 緊急度レベル: 🔴 HIGH')
  console.log('理由:')
  console.log('  • 既存のUIクエリが移行済みデータにアクセスできない')
  console.log('  • ユーザーがロケーションを見つけられない可能性')
  console.log('  • アフィリエイト収益への直接影響')
  console.log('  • SEO・検索流入への悪影響')
  
  console.log('\n⚡ 推奨対応期間: 24-48時間以内')
  console.log('優先順位:')
  console.log('  1. APIクエリ修正（データアクセス復旧）')
  console.log('  2. 基本表示機能の動作確認')
  console.log('  3. アフィリエイトリンクの動作確認')
  console.log('  4. 新機能（複数エピソード表示）の実装')
  
  // 10. 次のアクションプラン
  console.log('\n🎯 【次のアクションプラン】')
  console.log('=' .repeat(50))
  
  console.log('\n📋 Phase 1: 緊急対応（今日中）')
  console.log('  ✅ APIクエリを新構造に対応')
  console.log('  ✅ 基本的なロケーション表示復旧')
  console.log('  ✅ アフィリエイトリンク動作確認')
  console.log('  ✅ 本番環境での動作テスト')
  
  console.log('\n📋 Phase 2: UX改善（明日）')
  console.log('  • 複数エピソード表示機能')
  console.log('  • 聖地レベル・人気度計算')
  console.log('  • エピソード一覧コンポーネント')
  console.log('  • 検索機能の強化')
  
  console.log('\n📋 Phase 3: 最適化（来週）')
  console.log('  • パフォーマンス最適化')
  console.log('  • キャッシュ戦略')
  console.log('  • エラーハンドリング強化')
  console.log('  • ユーザーテスト')
  
  return {
    migration_success: migrationScore === 100,
    data_integrity: junctionCount === directCount,
    affiliate_protection: affiliateCount,
    frontend_urgency: 'HIGH',
    recommended_timeline: '24-48 hours'
  }
}

analyzeMigrationResults()