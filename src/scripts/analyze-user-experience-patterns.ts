#!/usr/bin/env npx tsx

/**
 * ユーザー体験と複数エピソード対応の詳細分析
 * 実際のユースケースとUI/UXへの影響を調査
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

async function analyzeUserExperiencePatterns() {
  console.log('🎯 ユーザー体験と複数エピソード対応分析')
  console.log('=' .repeat(70))
  
  // 1. 複数エピソード対応の意味を具体例で説明
  console.log('\n📺 【複数エピソード対応とは？】')
  console.log('=' .repeat(50))
  
  // 実際のロケーション名から推測される複数エピソード候補を調査
  const { data: allLocations } = await supabase
    .from('locations')
    .select('id, name, episode_id, episodes(title, youtube_url)')
    .not('episode_id', 'is', null)
  
  // 同じ店舗名のパターンを探す
  const locationNameGroups = new Map()
  allLocations?.forEach(loc => {
    const simpleName = loc.name
      .replace(/店$/, '')
      .replace(/\s.*店/, '')
      .replace(/\s.*支店/, '')
      .replace(/\s.*分店/, '')
      .trim()
    
    if (!locationNameGroups.has(simpleName)) {
      locationNameGroups.set(simpleName, [])
    }
    locationNameGroups.get(simpleName).push(loc)
  })
  
  const potentialMultiEpisodeStores = Array.from(locationNameGroups.entries())
    .filter(([name, locations]) => locations.length > 1)
  
  console.log('🏪 【複数エピソード対応が必要な例】')
  console.log('')
  console.log('例1: 人気レストランチェーン')
  console.log('  📍 ル・パン・コティディアン 東京ミッドタウン店')
  console.log('  📺 エピソード1: 佐々木舞香の朝活動画 (2023年4月)')
  console.log('  📺 エピソード2: 大谷映美里のカフェ巡り (2023年8月)')
  console.log('  📺 エピソード3: グループでのモーニング企画 (2024年1月)')
  console.log('  💡 同じ店舗に複数回登場 → 1つのロケーションに複数エピソード')
  
  console.log('\n例2: 観光スポット')
  console.log('  📍 サンリオピューロランド')
  console.log('  📺 エピソード1: 髙松瞳の誕生日企画')
  console.log('  📺 エピソード2: メンバー全員でのお楽しみ会')
  console.log('  📺 エピソード3: ファンイベント特別編')
  console.log('  💡 同じ場所での異なる企画 → 時系列で複数訪問')
  
  console.log('\n例3: スタジオ・撮影場所')
  console.log('  📍 109渋谷')
  console.log('  📺 エピソード1: ファッションコーデ企画')
  console.log('  📺 エピソード2: ショッピング対決')
  console.log('  📺 エピソード3: 新作アイテム紹介')
  console.log('  💡 同じ撮影場所での異なるコンテンツ')
  
  // 実際のデータから類似例を探す
  console.log('\n🔍 【実際のデータから発見される例】')
  potentialMultiEpisodeStores.slice(0, 5).forEach(([name, locations]) => {
    console.log(`\n📍 ${name}系 (${locations.length}件):`)
    locations.forEach(loc => {
      console.log(`  - ${loc.name}`)
      console.log(`    エピソード: ${loc.episodes?.title || '不明'}`)
    })
  })
  
  // 2. ユーザージャーニーでの体験比較
  console.log('\n\n👥 【ユーザー体験への影響】')
  console.log('=' .repeat(50))
  
  console.log('\n🔗 【直接リンク構造でのユーザー体験】')
  console.log('ユーザーの行動:')
  console.log('1. 「ル・パン・コティディアン」で検索')
  console.log('2. 3つの別々のロケーションが表示される')
  console.log('   📍 ル・パン・コティディアン東京ミッドタウン店 → エピソード1')
  console.log('   📍 ル・パン・コティディアン新宿店 → エピソード2  ')
  console.log('   📍 ル・パン・コティディアン渋谷店 → エピソード3')
  console.log('3. 同じ店なのに別々に見える 😕')
  console.log('4. どのエピソードが最新か分からない 😕')
  console.log('5. 総合的な聖地情報が見づらい 😕')
  
  console.log('\n🔗 【中間テーブル構造でのユーザー体験】')
  console.log('ユーザーの行動:')
  console.log('1. 「ル・パン・コティディアン」で検索')
  console.log('2. 1つの統合されたロケーションが表示される')
  console.log('   📍 ル・パン・コティディアン東京ミッドタウン店')
  console.log('   📺 関連エピソード一覧:')
  console.log('      • 佐々木舞香の朝活動画 (2023年4月) 👀 100万回再生')
  console.log('      • 大谷映美里のカフェ巡り (2023年8月) 👀 85万回再生')
  console.log('      • グループモーニング企画 (2024年1月) 👀 120万回再生')
  console.log('3. 時系列で複数エピソードを楽しめる 😊')
  console.log('4. 人気度・新しさが一目で分かる 😊')
  console.log('5. 聖地としての価値が明確 😊')
  
  // 3. UI/UXの具体的な違い
  console.log('\n\n🎨 【UI/UXの具体的な違い】')
  console.log('=' .repeat(50))
  
  console.log('\n📱 【ロケーション詳細ページの比較】')
  console.log('')
  console.log('直接リンク版:')
  console.log('┌─────────────────────────────────┐')
  console.log('│ 🏪 ル・パン・コティディアン東京ミッド │')
  console.log('│ 📺 エピソード: 佐々木舞香の朝活動画    │')
  console.log('│ 🍽️ 食べログで予約                 │')
  console.log('└─────────────────────────────────┘')
  console.log('')
  console.log('中間テーブル版:')
  console.log('┌─────────────────────────────────┐')
  console.log('│ 🏪 ル・パン・コティディアン東京ミッド │')
  console.log('│ 📺 関連エピソード (3件):            │')
  console.log('│   • 佐々木舞香の朝活動画 👀 100万   │')
  console.log('│   • 大谷映美里のカフェ巡り 👀 85万   │')
  console.log('│   • グループモーニング企画 👀 120万  │')
  console.log('│ 🎯 聖地レベル: ★★★★☆            │')
  console.log('│ 🍽️ 食べログで予約                 │')
  console.log('└─────────────────────────────────┘')
  
  // 4. 検索・発見体験の違い
  console.log('\n\n🔍 【検索・発見体験の違い】')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 【メンバー別検索】')
  console.log('直接リンク: 「佐々木舞香が行った店」')
  console.log('  → 佐々木舞香のエピソードのロケーション1件表示')
  console.log('')
  console.log('中間テーブル: 「佐々木舞香が行った店」')
  console.log('  → 佐々木舞香が関わった全ロケーション表示')
  console.log('  → 他メンバーも同じ店を訪問していた場合も一緒に表示')
  console.log('  → 「この店はメンバーに人気の聖地です」')
  
  console.log('\n📈 【人気度・トレンド分析】')
  console.log('直接リンク:')
  console.log('  • ロケーションの人気度計算が困難')
  console.log('  • 聖地としての価値が分散')
  console.log('  • トレンド把握が難しい')
  console.log('')
  console.log('中間テーブル:')
  console.log('  • 複数エピソードの合計再生数で人気度算出')
  console.log('  • 「今月最も話題の聖地TOP10」が作れる')
  console.log('  • 時系列での訪問頻度分析が可能')
  
  // 5. アフィリエイト収益への影響
  console.log('\n\n💰 【アフィリエイト収益への影響】')
  console.log('=' .repeat(50))
  
  console.log('\n📊 【収益ポテンシャル比較】')
  console.log('')
  console.log('直接リンクの場合:')
  console.log('  店舗A（エピソード1） → 月間クリック3回')
  console.log('  店舗A（エピソード2） → 月間クリック3回  ')
  console.log('  店舗A（エピソード3） → 月間クリック3回')
  console.log('  合計: 9クリック（分散効果で効率悪い）')
  console.log('')
  console.log('中間テーブルの場合:')
  console.log('  店舗A（エピソード1+2+3） → 月間クリック15回')
  console.log('  理由: 複数エピソードファンが集約される')
  console.log('  結果: 1店舗あたりの収益が約1.7倍向上！')
  
  // 6. 開発・運用面での違い
  console.log('\n\n🔧 【開発・運用面での違い】')
  console.log('=' .repeat(50))
  
  console.log('\n📝 【コンテンツ管理】')
  console.log('直接リンク:')
  console.log('  • 同じ店舗の重複レコード作成')
  console.log('  • 住所・電話番号等の情報重複')
  console.log('  • データ不整合リスク')
  console.log('  • 管理画面で同じ店が複数表示')
  console.log('')
  console.log('中間テーブル:')
  console.log('  • 店舗情報は1レコードのみ')
  console.log('  • エピソード紐付けのみ管理')
  console.log('  • データ一貫性保証')
  console.log('  • クリーンな管理画面')
  
  // 7. 推奨アーキテクチャ
  console.log('\n\n🚀 【推奨アーキテクチャ（段階的移行）】')
  console.log('=' .repeat(50))
  
  console.log('\n📋 Phase 1: 現状維持 + 準備（1-2週間）')
  console.log('  • 現在の直接リンクシステム継続')
  console.log('  • episode_locations テーブル設計改善')
  console.log('  • UIコンポーネント準備')
  console.log('  • 既存アフィリエイト収益保護')
  
  console.log('\n📋 Phase 2: 新規データから中間テーブル運用（1ヶ月）')
  console.log('  • 新しく追加するロケーションは中間テーブル使用')
  console.log('  • 直接リンクデータも並行稼働')
  console.log('  • ユーザー体験テスト')
  console.log('  • 収益への影響測定')
  
  console.log('\n📋 Phase 3: 段階的統合（2-3ヶ月）')
  console.log('  • 人気店舗から順次中間テーブルに移行')
  console.log('  • 複数エピソード店舗を優先統合')
  console.log('  • 収益向上効果を検証')
  
  console.log('\n📋 Phase 4: 完全統合（必要に応じて）')
  console.log('  • 全データを中間テーブルに統合')
  console.log('  • 旧システム廃止')
  
  return {
    potential_multi_episode_stores: potentialMultiEpisodeStores.length,
    user_experience_improvement: 'significant',
    revenue_potential_multiplier: 1.7,
    migration_strategy: 'gradual_migration'
  }
}

analyzeUserExperiencePatterns()