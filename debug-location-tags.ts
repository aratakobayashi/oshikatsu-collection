#!/usr/bin/env npx tsx

/**
 * ロケーションタグ表示問題の調査スクリプト
 * 各セレブリティのエピソード-ロケーション紐づけ状況を調査
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function investigateLocationTags() {
  console.log('🔍 ロケーションタグ表示問題調査開始')
  console.log('=' .repeat(60))

  // 1. 各セレブリティのエピソード-ロケーション紐づけ状況
  console.log('\n📊 セレブリティ別エピソード-ロケーション紐づけ状況:')
  
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select('id, name')
    .in('name', ['伊藤かりん', 'よに', 'ジュニア'])

  for (const celebrity of celebrities || []) {
    console.log(`\n👤 ${celebrity.name}:`)
    
    // エピソード数
    const { count: episodeCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', celebrity.id)
    
    // ロケーション紐づけ済みエピソード数
    const { data: episodesWithLocations } = await supabase
      .from('episodes')
      .select(`
        id, 
        title,
        episode_locations!inner(id)
      `)
      .eq('celebrity_id', celebrity.id)
    
    console.log(`   総エピソード数: ${episodeCount}件`)
    console.log(`   ロケーション紐づけ済み: ${episodesWithLocations?.length || 0}件`)
    
    // 詳細表示（上位5件）
    if (episodesWithLocations && episodesWithLocations.length > 0) {
      console.log('   📍 ロケーション紐づけ済みエピソード（上位5件）:')
      for (const episode of episodesWithLocations.slice(0, 5)) {
        console.log(`      - ${episode.title}`)
      }
    }
  }

  // 2. 伊藤かりんの築地エピソード詳細調査
  console.log('\n🔍 伊藤かりん「築地」エピソード詳細調査:')
  
  const { data: tsukijiEpisode } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      celebrity_id,
      episode_locations(
        id,
        location_id,
        locations(
          id,
          name,
          address
        )
      )
    `)
    .ilike('title', '%築地%')
    .limit(1)
    .single()

  if (tsukijiEpisode) {
    console.log(`   エピソードID: ${tsukijiEpisode.id}`)
    console.log(`   タイトル: ${tsukijiEpisode.title}`)
    console.log(`   セレブリティID: ${tsukijiEpisode.celebrity_id}`)
    console.log(`   紐づけロケーション数: ${tsukijiEpisode.episode_locations?.length || 0}`)
    
    if (tsukijiEpisode.episode_locations) {
      console.log('   📍 紐づけ済みロケーション:')
      for (const link of tsukijiEpisode.episode_locations) {
        if (link.locations) {
          console.log(`      - ${link.locations.name} (${link.locations.address})`)
        }
      }
    }
  } else {
    console.log('   ❌ 築地エピソードが見つかりません')
  }

  // 3. CelebrityProfile.tsxで使用されるクエリの模倣
  console.log('\n🔍 CelebrityProfile.tsx相当のクエリテスト:')
  
  const { data: karinCelebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', '伊藤かりん')
    .single()

  if (karinCelebrity) {
    const { data: episodeLinksData } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        description,
        date,
        video_url,
        thumbnail_url,
        duration,
        view_count,
        episode_locations(count),
        episode_items(count)
      `)
      .eq('celebrity_id', karinCelebrity.id)
      .order('date', { ascending: false })
      .limit(5)

    console.log('   📊 CelebrityProfile相当クエリ結果（上位5件）:')
    for (const episode of episodeLinksData || []) {
      const locationCount = episode.episode_locations?.[0]?.count || 0
      const itemCount = episode.episode_items?.[0]?.count || 0
      console.log(`      ${episode.title}`)
      console.log(`         ロケーション: ${locationCount}件, アイテム: ${itemCount}件`)
    }
  }

  console.log('\n🔍 調査完了')
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  investigateLocationTags().catch(console.error)
}