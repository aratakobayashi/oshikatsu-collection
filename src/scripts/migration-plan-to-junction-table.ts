#!/usr/bin/env npx tsx

/**
 * 中間テーブル移行計画とフロントエンド対応分析
 * データ整理からUI変更まで完全ロードマップ
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

async function analyzeMigrationPlan() {
  console.log('🚀 中間テーブル移行完全ロードマップ')
  console.log('=' .repeat(70))
  
  // 1. 現在のデータ構造分析
  console.log('\n📊 【Step 1: 現在のデータ構造分析】')
  console.log('=' .repeat(50))
  
  const { data: currentLocations } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url, address')
    .not('episode_id', 'is', null)
  
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, youtube_url, created_at')
  
  const affiliateCount = currentLocations?.filter(l => l.tabelog_url)?.length || 0
  
  console.log(`📍 移行対象ロケーション: ${currentLocations?.length || 0}件`)
  console.log(`📺 既存エピソード: ${episodes?.length || 0}件`)
  console.log(`💰 アフィリエイト設定済み: ${affiliateCount}件（収益: ¥${affiliateCount * 120}/月）`)
  
  // 2. 必要なデータベース変更
  console.log('\n🛠️ 【Step 2: データベース構造変更】')
  console.log('=' .repeat(50))
  
  console.log('\n📋 必要なマイグレーション:')
  console.log('```sql')
  console.log('-- 1. episode_locationsテーブル強化')
  console.log('CREATE TABLE IF NOT EXISTS episode_locations (')
  console.log('  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),')
  console.log('  episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,')
  console.log('  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,')
  console.log('  visited_at INTEGER, -- エピソード内での訪問時間（秒）')
  console.log('  description TEXT,    -- シーンの説明')
  console.log('  featured BOOLEAN DEFAULT FALSE, -- メインロケーションフラグ')
  console.log('  created_at TIMESTAMP DEFAULT NOW(),')
  console.log('  UNIQUE(episode_id, location_id)')
  console.log(');')
  console.log('')
  console.log('-- 2. インデックス追加（パフォーマンス向上）')
  console.log('CREATE INDEX idx_episode_locations_episode ON episode_locations(episode_id);')
  console.log('CREATE INDEX idx_episode_locations_location ON episode_locations(location_id);')
  console.log('')
  console.log('-- 3. 既存データ移行（後で実行）')
  console.log('-- INSERT INTO episode_locations (episode_id, location_id, featured)')
  console.log('-- SELECT episode_id, id, TRUE FROM locations WHERE episode_id IS NOT NULL;')
  console.log('```')
  
  // 3. データ移行手順
  console.log('\n📦 【Step 3: データ移行手順】')
  console.log('=' .repeat(50))
  
  console.log('\n🔄 Phase 1: セーフティネット準備')
  console.log('  1. 現在のデータ完全バックアップ')
  console.log('  2. episode_locationsテーブル作成')
  console.log('  3. 移行スクリプト作成＋テスト')
  console.log('  4. ロールバック手順準備')
  console.log('')
  console.log('🔄 Phase 2: 段階的データ移行（収益保護）')
  console.log('  1. アフィリエイト設定済み15件を最優先移行')
  console.log('  2. 移行後の収益確認（¥1,800維持）')
  console.log('  3. 残り706件を100件ずつバッチ移行')
  console.log('  4. 各バッチ後に整合性チェック')
  console.log('')
  console.log('🔄 Phase 3: 重複統合（ユーザー体験向上）')
  console.log('  1. 同名店舗の特定（例：サンリオピューロランド）')
  console.log('  2. 重複ロケーションの統合')
  console.log('  3. 複数エピソードの紐付け確認')
  console.log('')
  console.log('🔄 Phase 4: 旧構造クリーンアップ')
  console.log('  1. locations.episode_idフィールドをNULLに更新')
  console.log('  2. フロントエンド動作確認')
  console.log('  3. 問題なければepisode_idカラム削除')
  
  // 4. フロントエンド（UI）への影響分析
  console.log('\n🎨 【Step 4: フロントエンド（UI）への影響】')
  console.log('=' .repeat(50))
  
  console.log('\n📱 必要なUI変更:')
  console.log('')
  console.log('🔍 【ロケーション一覧ページ】')
  console.log('変更前: 1エピソード = 1ロケーション表示')
  console.log('変更後: 1ロケーション = 複数エピソード統合表示')
  console.log('')
  console.log('例：')
  console.log('┌────────────────────────────────────┐')
  console.log('│ 🏪 サンリオピューロランド              │')
  console.log('│ 📺 関連エピソード: 3件                │')
  console.log('│ 👀 合計再生数: 245万回               │')
  console.log('│ ⭐ 聖地レベル: ★★★★☆             │')
  console.log('│ 🍽️ 食べログで予約                   │')
  console.log('└────────────────────────────────────┘')
  
  console.log('\n📄 【ロケーション詳細ページ】')
  console.log('新機能追加:')
  console.log('  • エピソード一覧表示')
  console.log('  • 時系列ソート')
  console.log('  • 再生数表示')
  console.log('  • 「このシーンから再生」ボタン')
  console.log('  • 人気度・聖地レベル表示')
  
  console.log('\n🔍 【検索機能】')
  console.log('強化項目:')
  console.log('  • メンバー別検索（複数エピソード対応）')
  console.log('  • 人気度ソート（合計再生数基準）')
  console.log('  • 訪問回数フィルター（2回以上訪問など）')
  console.log('  • 「話題の聖地」特集ページ')
  
  // 5. API変更の必要性
  console.log('\n🔌 【Step 5: API変更の必要性】')
  console.log('=' .repeat(50))
  
  console.log('\n📊 現在のクエリパターン:')
  console.log('```typescript')
  console.log('// 変更前（直接リンク）')
  console.log('const { data } = await supabase')
  console.log('  .from("locations")')
  console.log('  .select("*, episodes(*)")')
  console.log('  .not("episode_id", "is", null)')
  console.log('```')
  console.log('')
  console.log('📊 新しいクエリパターン:')
  console.log('```typescript')
  console.log('// 変更後（中間テーブル）')
  console.log('const { data } = await supabase')
  console.log('  .from("locations")')
  console.log('  .select(`')
  console.log('    *,')
  console.log('    episode_locations(')
  console.log('      id,')
  console.log('      visited_at,')
  console.log('      description,')
  console.log('      featured,')
  console.log('      episodes(')
  console.log('        id,')
  console.log('        title,')
  console.log('        youtube_url,')
  console.log('        view_count,')
  console.log('        published_at')
  console.log('      )')
  console.log('    )')
  console.log('  `)')
  console.log('```')
  
  // 6. 実装優先度
  console.log('\n🎯 【Step 6: 実装優先度】')
  console.log('=' .repeat(50))
  
  console.log('\n📋 高優先度（収益保護）:')
  console.log('  ✅ P1: アフィリエイト15件の移行確認')
  console.log('  ✅ P1: 移行後の食べログリンク動作確認')
  console.log('  ✅ P1: 収益¥1,800の継続確認')
  console.log('')
  console.log('📋 中優先度（ユーザー体験）:')
  console.log('  🔄 P2: ロケーション詳細ページのエピソード一覧表示')
  console.log('  🔄 P2: 聖地レベル・人気度計算ロジック')
  console.log('  🔄 P2: 検索結果の統合表示')
  console.log('')
  console.log('📋 低優先度（将来拡張）:')
  console.log('  ⏳ P3: 「このシーンから再生」機能')
  console.log('  ⏳ P3: 訪問時間メタデータ活用')
  console.log('  ⏳ P3: トレンド分析ダッシュボード')
  
  // 7. 実装スケジュール
  console.log('\n📅 【Step 7: 実装スケジュール】')
  console.log('=' .repeat(50))
  
  console.log('\n🗓️ Week 1: DB構造整備')
  console.log('  月: マイグレーションスクリプト作成')
  console.log('  火: episode_locationsテーブル作成')
  console.log('  水: アフィリエイト15件移行テスト')
  console.log('  木: 全データ移行テスト')
  console.log('  金: 整合性チェック＋バックアップ')
  console.log('')
  console.log('🗓️ Week 2: フロントエンド対応')
  console.log('  月: APIクエリ変更')
  console.log('  火: ロケーション詳細ページ更新')
  console.log('  水: 一覧ページの統合表示')
  console.log('  木: 検索機能強化')
  console.log('  金: テスト＋デプロイ')
  
  // 8. 注意点・リスク
  console.log('\n⚠️ 【Step 8: 注意点・リスク】')
  console.log('=' .repeat(50))
  
  console.log('\n🚨 データ移行リスク:')
  console.log('  • 721件の大量データ移行')
  console.log('  • 移行中のサービス停止リスク')
  console.log('  • データ不整合の可能性')
  console.log('  • アフィリエイトリンク切れリスク')
  console.log('')
  console.log('🛡️ リスク軽減策:')
  console.log('  ✅ 段階的移行（15件→100件→全件）')
  console.log('  ✅ 各段階での動作確認')
  console.log('  ✅ ロールバック手順準備')
  console.log('  ✅ 本番環境でのテスト環境構築')
  
  // 9. 成功指標
  console.log('\n📈 【Step 9: 成功指標】')
  console.log('=' .repeat(50))
  
  console.log('\n✅ 移行成功の判定基準:')
  console.log('  • アフィリエイト収益¥1,800維持')
  console.log('  • 全ロケーション正常表示')
  console.log('  • 複数エピソード正常統合表示')
  console.log('  • 検索機能正常動作')
  console.log('  • ページ表示速度維持（<2秒）')
  console.log('')
  console.log('🎯 ユーザー体験向上指標:')
  console.log('  • 聖地レベル表示機能')
  console.log('  • エピソード一覧表示')
  console.log('  • 時系列ソート機能')
  console.log('  • 合計再生数表示')
  
  return {
    migration_scope: currentLocations?.length || 0,
    affiliate_protection_priority: affiliateCount,
    estimated_weeks: 2,
    risk_level: 'medium',
    success_criteria: 'revenue_maintained_and_ux_improved'
  }
}

analyzeMigrationPlan()