/**
 * 追加された声優の確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVoiceActors() {
  console.log('🎤 追加された声優確認')
  console.log('==================\n')

  // 声優を取得
  const { data: voiceActors } = await supabase
    .from('celebrities')
    .select('name, type, agency, id')
    .eq('type', '声優')
    .order('name')

  if (!voiceActors || voiceActors.length === 0) {
    console.log('❌ 声優が見つかりません')
    return
  }

  console.log(`📊 追加された声優: ${voiceActors.length}人\n`)

  let totalEpisodes = 0
  const femaleVA = []
  const maleVA = []

  for (const voiceActor of voiceActors) {
    // エピソード数を取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', voiceActor.id)

    const episodeCount = episodes?.length || 0
    totalEpisodes += episodeCount

    // アニメ作品数を計算
    const animeCount = episodes?.filter(ep =>
      ep.title.includes('【アニメ') ||
      ep.title.includes('映画') ||
      ep.title.includes('TV')
    ).length || 0

    console.log(`👤 ${voiceActor.name}`)
    console.log(`   エピソード: ${episodeCount}本 (アニメ作品: ${animeCount}本)`)
    console.log(`   所属事務所: ${voiceActor.agency || '不明'}`)

    // 代表作品を表示（最初の3作品）
    if (episodes && episodes.length > 0) {
      const animeWorks = episodes
        .filter(ep => ep.title.includes('【アニメ'))
        .slice(0, 3)

      if (animeWorks.length > 0) {
        console.log(`   代表作品: ${animeWorks.map(w => w.title.replace('【アニメ映画】', '').replace('【アニメ】', '')).join(', ')}`)
      }
    }

    console.log('')

    // 性別分類（名前で推測）
    if (['花澤', '早見', '悠木', '佐倉', '水瀬', '茅野', '東山', '小倉', '竹達', '高橋', '野沢', '田中', '林原'].some(name => voiceActor.name.includes(name))) {
      femaleVA.push(voiceActor.name)
    } else {
      maleVA.push(voiceActor.name)
    }
  }

  // 統計情報
  console.log('='.repeat(50))
  console.log('📈 統計情報')
  console.log('='.repeat(50))
  console.log(`追加声優数: ${voiceActors.length}人`)
  console.log(`総エピソード数: ${totalEpisodes}本`)
  console.log(`平均エピソード数: ${Math.round(totalEpisodes / voiceActors.length)}本/人`)

  // 性別統計
  console.log('\n👥 性別統計:')
  console.log(`女性声優: ${femaleVA.length}人`)
  console.log(`男性声優: ${maleVA.length}人`)

  // 事務所別統計
  const agencyStats = voiceActors
    .filter(va => va.agency)
    .reduce((acc, va) => {
      acc[va.agency!] = (acc[va.agency!] || 0) + 1
      return acc
    }, {} as Record<string, number>)

  console.log('\n🏢 主要事務所:')
  Object.entries(agencyStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([agency, count]) => {
      console.log(`  ${agency}: ${count}人`)
    })

  console.log('\n🌟 今回追加された人気声優:')
  console.log('【女性声優】')
  femaleVA.slice(0, 10).forEach(name => console.log(`  • ${name}`))

  console.log('\n【男性声優】')
  maleVA.slice(0, 10).forEach(name => console.log(`  • ${name}`))

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで「声優」で検索')
  console.log('• 各声優のプロフィールページでアニメ作品確認')
  console.log('• キャラクター名付きのエピソードが表示されます')
  console.log('• ブラウザでハードリフレッシュ推奨')
}

// 実行
checkVoiceActors().catch(console.error)