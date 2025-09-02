#!/usr/bin/env node

/**
 * Season11のエピソードとロケーションを関連付け
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface EpisodeLocationLink {
  episodeTitleContains: string
  locationName: string
}

async function linkSeason11EpisodesToLocations() {
  console.log('🔗 Season11のエピソードとロケーションを関連付け中...\n')

  // エピソードとロケーションの関連付けデータ
  const links: EpisodeLocationLink[] = [
    { episodeTitleContains: '第1話', locationName: '中華飯店 一番' },
    { episodeTitleContains: '第2話', locationName: 'みたけ食堂' },
    { episodeTitleContains: '第3話', locationName: '京城園' },
    { episodeTitleContains: '第4話', locationName: 'キッチンオニオン' },
    { episodeTitleContains: '第5話', locationName: 'サウナセンター稲荷町' },
    { episodeTitleContains: '第6話', locationName: '子ども食堂（教会）' },
    { episodeTitleContains: '第7話', locationName: '餃子屋（出雲）' },
    { episodeTitleContains: '第8話', locationName: 'やすいみ～と' },
    { episodeTitleContains: '第9話', locationName: '与倉ドライブイン' },
    { episodeTitleContains: '第10話', locationName: '南印度ダイニング' },
    { episodeTitleContains: '第11話', locationName: 'きっちん大浪' },
    { episodeTitleContains: '第12話', locationName: '鳥獣菜魚 あい川' }
  ]

  console.log(`🔗 ${links.length}話のエピソードとロケーションを関連付けします...`)

  // Season11のエピソード一覧を取得
  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('id, title')
    .like('title', '%Season11%')
    .order('title')

  if (episodesError || !episodes) {
    console.error('❌ エピソード取得エラー:', episodesError)
    return
  }

  console.log(`📺 取得エピソード: ${episodes.length}話`)

  // Season11のロケーション一覧を取得
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name')
    .like('slug', '%season11%')

  if (locationsError || !locations) {
    console.error('❌ ロケーション取得エラー:', locationsError)
    return
  }

  console.log(`🏪 取得ロケーション: ${locations.length}店舗`)

  let successCount = 0

  for (const link of links) {
    console.log(`\n🔗 ${link.episodeTitleContains}と${link.locationName}を関連付け中...`)

    // 対応するエピソードを検索
    const episode = episodes.find(ep => ep.title.includes(link.episodeTitleContains))
    if (!episode) {
      console.error(`❌ エピソードが見つかりません: ${link.episodeTitleContains}`)
      continue
    }

    // 対応するロケーションを検索
    const location = locations.find(loc => loc.name === link.locationName)
    if (!location) {
      console.error(`❌ ロケーションが見つかりません: ${link.locationName}`)
      continue
    }

    console.log(`📺 エピソード: ${episode.title.replace('孤独のグルメ Season11 ', '')}`)
    console.log(`🏪 ロケーション: ${location.name}`)

    // 既に関連付けがあるかチェック
    const { data: existingLink } = await supabase
      .from('episode_locations')
      .select('id')
      .eq('episode_id', episode.id)
      .eq('location_id', location.id)
      .single()

    if (existingLink) {
      console.log(`⏭️  既に関連付け済み`)
      continue
    }

    // episode_locationsテーブルに関連付けを追加
    const episodeLocationId = randomUUID()
    const { error: linkError } = await supabase
      .from('episode_locations')
      .insert({
        id: episodeLocationId,
        episode_id: episode.id,
        location_id: location.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (linkError) {
      console.error(`❌ 関連付けエラー:`, linkError.message)
      continue
    }

    console.log(`✅ 関連付け完了`)
    successCount++
  }

  console.log(`\n🎉 ${successCount}/${links.length}話の関連付けが完了しました！`)
  
  if (successCount === links.length) {
    console.log('\n📋 次のステップ:')
    console.log('1. 未確認店舗のタベログURL調査・追加')
    console.log('2. タベログURLとLinkSwitch対応確認')
    console.log('3. 各店舗の詳細情報の精度向上')
  }
}

linkSeason11EpisodesToLocations()