/**
 * 追加されたお笑い芸人・バラエティタレントの確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVarietyTalents() {
  console.log('😄 お笑い芸人・バラエティタレント確認')
  console.log('==================================\n')

  // お笑い芸人・バラエティタレントを取得
  const { data: varietyTalents } = await supabase
    .from('celebrities')
    .select('name, type, agency, subscriber_count, id')
    .in('type', ['お笑い芸人', 'バラエティタレント', 'タレント'])
    .order('subscriber_count', { ascending: false, nullsLast: true })

  if (!varietyTalents || varietyTalents.length === 0) {
    console.log('❌ お笑い芸人・バラエティタレントが見つかりません')
    return
  }

  console.log(`📊 追加されたお笑い芸人・バラエティタレント: ${varietyTalents.length}人\n`)

  let totalEpisodes = 0

  for (const talent of varietyTalents) {
    // エピソード数を取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', talent.id)

    const episodeCount = episodes?.length || 0
    totalEpisodes += episodeCount

    const subscriberInfo = talent.subscriber_count
      ? ` (${talent.subscriber_count.toLocaleString()}人)`
      : ''

    console.log(`${talent.name} (${talent.type})${subscriberInfo}`)
    console.log(`  エピソード: ${episodeCount}本`)
    console.log(`  事務所: ${talent.agency || '不明'}`)
    console.log('')
  }

  // 統計情報
  console.log('='.repeat(50))
  console.log('📈 統計情報')
  console.log('='.repeat(50))
  console.log(`追加タレント数: ${varietyTalents.length}人`)
  console.log(`総エピソード数: ${totalEpisodes}本`)
  console.log(`平均エピソード数: ${Math.round(totalEpisodes / varietyTalents.length)}本/人`)

  // タイプ別統計
  const typeStats = varietyTalents.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n🎭 タイプ別統計:')
  Object.entries(typeStats).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}人`)
  })

  // 事務所別統計
  const agencyStats = varietyTalents
    .filter(t => t.agency)
    .reduce((acc, t) => {
      acc[t.agency!] = (acc[t.agency!] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  console.log('\n🏢 事務所別統計:')
  Object.entries(agencyStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([agency, count]) => {
      console.log(`  ${agency}: ${count}人`)
    })

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで「お笑い芸人」「バラエティタレント」で検索')
  console.log('• 各タレントのプロフィールページでエピソード確認')
  console.log('• バラエティ番組・映画作品が表示されます')
  console.log('• ブラウザでハードリフレッシュ推奨')
}

// 実行
checkVarietyTalents().catch(console.error)