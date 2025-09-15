/**
 * 現在のコンテンツ状況分析と次の拡充戦略提案
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeCurrentContentStatus() {
  console.log('📊 現在のコンテンツ状況分析')
  console.log('==========================\n')

  // 1. 全体統計
  const { data: allCelebrities } = await supabase
    .from('celebrities')
    .select('name, type, group_name')

  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('id')

  console.log('📈 全体統計:')
  console.log(`  タレント総数: ${allCelebrities?.length || 0}人`)
  console.log(`  エピソード総数: ${allEpisodes?.length || 0}本`)
  console.log(`  平均エピソード数: ${Math.round((allEpisodes?.length || 0) / (allCelebrities?.length || 1))}本/人`)

  // 2. タイプ別統計
  console.log('\n🎭 タイプ別分布:')
  const typeStats = (allCelebrities || []).reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  Object.entries(typeStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}人`)
    })

  // 3. グループ別統計
  console.log('\n👥 主要グループ:')
  const groupStats = (allCelebrities || [])
    .filter(c => c.group_name)
    .reduce((acc, c) => {
      acc[c.group_name!] = (acc[c.group_name!] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  Object.entries(groupStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([group, count]) => {
      console.log(`  ${group}: ${count}人`)
    })

  // 4. エピソード数上位タレント
  console.log('\n⭐ エピソード数上位タレント:')
  const celebritiesWithEpisodes = []

  for (const celebrity of (allCelebrities || []).slice(0, 15)) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.name)

    celebritiesWithEpisodes.push({
      ...celebrity,
      episode_count: episodes?.length || 0
    })
  }

  celebritiesWithEpisodes
    .sort((a, b) => b.episode_count - a.episode_count)
    .slice(0, 10)
    .forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.type}): ${c.episode_count}本`)
    })

  // 5. 拡充提案
  console.log('\n' + '='.repeat(50))
  console.log('🎯 次の拡充戦略提案')
  console.log('='.repeat(50))

  // K-POPアイドル不足チェック
  const kpopCount = (allCelebrities || []).filter(c =>
    c.name.includes('BTS') || c.name.includes('BLACKPINK') ||
    c.name.includes('TWICE') || c.name.includes('IVE') ||
    c.name.includes('NewJeans') || c.name.includes('LE SSERAFIM')
  ).length

  console.log('\n1️⃣ K-POPアイドル拡充:')
  console.log(`   現在: ${kpopCount}グループ/人`)
  if (kpopCount < 20) {
    console.log('   📈 推奨: 人気K-POPアイドル20-30組追加')
    console.log('   候補: BTS、BLACKPINK、TWICE、NewJeans、LE SSERAFIM、IVE、aespa等')
  }

  // バラエティタレント不足チェック
  const varietyCount = (allCelebrities || []).filter(c =>
    c.type === 'お笑い芸人' || c.type === 'タレント' || c.type === 'バラエティ'
  ).length

  console.log('\n2️⃣ バラエティタレント拡充:')
  console.log(`   現在: ${varietyCount}人`)
  if (varietyCount < 20) {
    console.log('   📈 推奨: 人気お笑い芸人・バラエティタレント追加')
    console.log('   候補: 霜降り明星、EXIT、マヂカルラブリー、ぺこぱ、四千頭身等')
  }

  // 声優不足チェック
  const voiceActorCount = (allCelebrities || []).filter(c =>
    c.type === '声優'
  ).length

  console.log('\n3️⃣ 声優拡充:')
  console.log(`   現在: ${voiceActorCount}人`)
  if (voiceActorCount < 15) {
    console.log('   📈 推奨: 人気声優15-25人追加')
    console.log('   候補: 花澤香菜、沢城みゆき、神谷浩史、梶裕貴、中村悠一等')
  }

  // エピソード数不足タレントチェック
  const lowEpisodeCelebrities = celebritiesWithEpisodes.filter(c => c.episode_count < 5)

  console.log('\n4️⃣ 既存タレントのエピソード拡充:')
  console.log(`   エピソード5本未満: ${lowEpisodeCelebrities.length}人`)
  if (lowEpisodeCelebrities.length > 0) {
    console.log('   📈 推奨: 既存タレントのエピソード数を最低10本まで拡充')
  }

  // 新規カテゴリ提案
  console.log('\n5️⃣ 新規カテゴリ提案:')
  console.log('   📺 アナウンサー（テレビ局別）')
  console.log('   🎵 シンガーソングライター・アーティスト')
  console.log('   🏃 スポーツ選手（野球、サッカー、フィギュア等）')
  console.log('   🎮 ゲーム実況者・配信者')
  console.log('   📸 インスタグラマー・インフルエンサー')

  console.log('\n💡 実装優先度:')
  console.log('1. K-POPアイドル追加（グローバル対応）')
  console.log('2. 既存タレントエピソード拡充（品質向上）')
  console.log('3. バラエティタレント追加（コンテンツ多様化）')
  console.log('4. 声優追加（アニメファン獲得）')
  console.log('5. 新規カテゴリ追加（ニッチ需要対応）')

  console.log('\n🚀 どの分野から始めますか？')
}

// 実行
analyzeCurrentContentStatus().catch(console.error)