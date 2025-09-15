/**
 * 現在のタレント状況分析
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeCurrentCelebrities() {
  console.log('📊 現在のタレント状況分析')
  console.log('============================\n')

  // 1. 全体統計
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('name, type')
    .order('name', { ascending: true })

  if (!celebrities) {
    console.log('❌ データ取得エラー:', error?.message)
    return
  }

  console.log(`📈 総タレント数: ${celebrities.length}人`)

  // 2. タイプ別分布
  const byType = celebrities.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n🎭 タイプ別分布:')
  Object.entries(byType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}人`)
    })

  // 3. エピソード数分析（各タレントのエピソード数を個別に取得）
  console.log('\n📺 エピソード数分析中...')
  const celebritiesWithEpisodes = []

  for (const celebrity of celebrities.slice(0, 20)) { // 最初の20人のみサンプル
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.name) // celebrity_idがnameと仮定

    celebritiesWithEpisodes.push({
      ...celebrity,
      episode_count: episodes?.length || 0
    })
  }

  // 4. サンプルタレント（エピソード数順）
  console.log('\n⭐ サンプルタレント（エピソード数順）:')
  celebritiesWithEpisodes
    .sort((a, b) => b.episode_count - a.episode_count)
    .forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.type}): ${c.episode_count}本`)
    })

  // 5. 追加候補分析
  console.log('\n💡 追加候補分析:')

  // YouTuber不足チェック
  const youtubers = celebrities.filter(c => c.type === 'YouTuber')
  console.log(`\n🎬 YouTuber現状: ${youtubers.length}人`)

  if (youtubers.length < 20) {
    console.log('  → 人気YouTuber追加推奨（目標: 20-30人）')
    console.log('  → 候補: ヒカキン、はじめしゃちょー、東海オンエア、水溜りボンド等')
  }

  // 俳優・女優不足チェック
  const actors = celebrities.filter(c => c.type === '俳優' || c.type === '女優')
  console.log(`\n🎭 俳優・女優現状: ${actors.length}人`)

  if (actors.length < 30) {
    console.log('  → 人気俳優・女優追加推奨（目標: 30-50人）')
    console.log('  → 候補: 橋本環奈、浜辺美波、永野芽郁、佐藤健、菅田将暉等')
  }

  // アイドル不足チェック
  const idols = celebrities.filter(c => c.type?.includes('アイドル'))
  console.log(`\n👑 アイドル現状: ${idols.length}人`)

  if (idols.length < 50) {
    console.log('  → 人気アイドル追加推奨（目標: 50-100人）')
    console.log('  → 候補: 乃木坂46、櫻坂46、日向坂46、AKB48、新しい学校のリーダーズ等')
  }

  console.log('\n🎯 推奨追加戦略:')
  console.log('1. 人気YouTuber 15-20人追加（各5-20エピソード）')
  console.log('2. 話題の俳優・女優 20-30人追加（各10-30エピソード）')
  console.log('3. 現在活動中のアイドルグループメンバー 30-50人追加')
  console.log('4. K-POPアイドル 10-20人追加（グローバル対応）')
}

// 実行
analyzeCurrentCelebrities().catch(console.error)