/**
 * 最終本番環境状態検証
 * - テストデータ削除後の状態確認
 * - celebritiesとepisodesの整合性確認
 * - 全体データ統計レポート
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyProductionState() {
  console.log('🔍 本番環境最終状態検証開始...\n')
  
  // 1. 各テーブルのレコード数
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  console.log('📊 テーブル別レコード数:')
  console.log('='.repeat(40))
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`❌ ${table}: エラー - ${error.message}`)
    } else {
      console.log(`📋 ${table}: ${count}件`)
    }
  }
  
  // 2. celebrities詳細確認
  console.log('\n📺 Celebrities詳細:')
  console.log('='.repeat(40))
  
  const { data: celebrities, error: celError } = await supabase
    .from('celebrities')
    .select('*')
    .order('created_at')
  
  if (!celError && celebrities) {
    for (const celebrity of celebrities) {
      const { count: episodeCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrity.id)
      
      console.log(`🎯 ${celebrity.name}: ${episodeCount}件のエピソード`)
      console.log(`   ID: ${celebrity.id}`)
      console.log(`   スラッグ: ${celebrity.slug}`)
    }
  }
  
  // 3. 未関連付けデータの確認
  console.log('\n⚠️ 未関連付けデータチェック:')
  console.log('='.repeat(40))
  
  const { count: orphanEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .is('celebrity_id', null)
  
  console.log(`📺 celebrity_id未設定エピソード: ${orphanEpisodes || 0}件`)
  
  // 4. テストデータ残存確認
  console.log('\n🧹 テストデータ残存チェック:')
  console.log('='.repeat(40))
  
  // TESTを含むエピソード
  const { data: testEpisodes } = await supabase
    .from('episodes')
    .select('id, title')
    .or('id.ilike.%test%,title.ilike.%test%')
  
  if (testEpisodes && testEpisodes.length > 0) {
    console.log(`⚠️ テストエピソード残存: ${testEpisodes.length}件`)
    testEpisodes.forEach(ep => {
      console.log(`   - ${ep.id}: ${ep.title}`)
    })
  } else {
    console.log('✅ テストエピソードなし')
  }
  
  // 開発用celebritiesチェック
  const { data: testCelebrities } = await supabase
    .from('celebrities')
    .select('id, name')
    .or('name.ilike.%開発%,name.ilike.%テスト%,slug.ilike.%test%')
  
  if (testCelebrities && testCelebrities.length > 0) {
    console.log(`⚠️ テストCelebrities残存: ${testCelebrities.length}件`)
    testCelebrities.forEach(cel => {
      console.log(`   - ${cel.id}: ${cel.name}`)
    })
  } else {
    console.log('✅ テストCelebritiesなし')
  }
  
  // 5. データ品質チェック
  console.log('\n🎯 データ品質サマリー:')
  console.log('='.repeat(40))
  
  // エピソードの基本フィールド確認
  const { data: episodesSample } = await supabase
    .from('episodes')
    .select('id, title, video_url, date')
    .limit(5)
  
  let qualityScore = 100
  episodesSample?.forEach(ep => {
    if (!ep.title || ep.title === 'タイトル未設定') qualityScore -= 2
    if (!ep.video_url) qualityScore -= 5
    if (!ep.date) qualityScore -= 3
  })
  
  console.log(`📈 データ品質スコア: ${qualityScore}%`)
  
  return {
    episodes: await getTableCount('episodes'),
    celebrities: await getTableCount('celebrities'),
    locations: await getTableCount('locations'),
    orphanEpisodes: orphanEpisodes || 0,
    testDataFound: (testEpisodes?.length || 0) + (testCelebrities?.length || 0),
    qualityScore
  }
}

async function getTableCount(tableName: string): Promise<number> {
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
  return count || 0
}

async function generateFinalReport(stats: any) {
  console.log('\n' + '='.repeat(60))
  console.log('🎉 本番環境最終レポート')
  console.log('='.repeat(60))
  
  console.log(`📺 総エピソード数: ${stats.episodes}件`)
  console.log(`🎭 Celebrities: ${stats.celebrities}件`)
  console.log(`📍 ロケーション数: ${stats.locations}件`)
  console.log(`⚠️ 未関連付けエピソード: ${stats.orphanEpisodes}件`)
  console.log(`🧹 テストデータ残存: ${stats.testDataFound}件`)
  console.log(`📊 データ品質: ${stats.qualityScore}%`)
  
  const overall = stats.orphanEpisodes === 0 && stats.testDataFound === 0 && stats.qualityScore >= 90
  
  if (overall) {
    console.log('\n✅ 本番環境は正常状態です！')
    console.log('🚀 サービス提供準備完了')
  } else {
    console.log('\n⚠️ 以下の課題があります:')
    if (stats.orphanEpisodes > 0) console.log('   - 未関連付けエピソードの修正が必要')
    if (stats.testDataFound > 0) console.log('   - テストデータの削除が必要')
    if (stats.qualityScore < 90) console.log('   - データ品質の改善が必要')
  }
}

// メイン実行
async function main() {
  try {
    const stats = await verifyProductionState()
    await generateFinalReport(stats)
  } catch (error) {
    console.error('❌ 検証処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}