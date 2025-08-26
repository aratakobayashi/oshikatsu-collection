#!/usr/bin/env npx tsx

/**
 * CelebrityProfile.tsxのepisodeLinksData生成をデバッグ
 * 築地エピソードがepisodeLinksDataに正しく含まれているかチェック
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

const TSUKIJI_EPISODE_ID = 'c5fb3c6c-a4d0-450a-9dd4-46009da263a9'

async function debugEpisodeLinks() {
  console.log('🔍 CelebrityProfile.tsx episodeLinksData生成デバッグ')
  console.log('=' .repeat(60))

  // 1. 伊藤かりんのセレブリティIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id, name')
    .eq('name', '伊藤かりん')
    .single()

  if (!celebrity) {
    console.error('❌ 伊藤かりんが見つかりません')
    return
  }

  console.log(`👤 Celebrity: ${celebrity.name} (${celebrity.id})`)

  // 2. CelebrityProfile.tsxと同じロジックでエピソードを取得
  console.log('\n📊 エピソード取得（CelebrityProfile.tsx相当）:')
  
  const { data: episodes, error: episodesError } = await supabase
    .from('episodes')
    .select(`
      *,
      celebrity:celebrities(id, name, slug, image_url)
    `)
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })

  if (episodesError) {
    console.error('❌ エピソード取得エラー:', episodesError)
    return
  }

  console.log(`   取得エピソード数: ${episodes?.length}件`)
  
  // 築地エピソードが含まれているかチェック
  const tsukijiEpisode = episodes?.find(ep => ep.id === TSUKIJI_EPISODE_ID)
  const tsukijiIndex = episodes?.findIndex(ep => ep.id === TSUKIJI_EPISODE_ID)
  
  console.log(`   築地エピソード: ${tsukijiEpisode ? '✅ 含まれています' : '❌ 含まれていません'}`)
  if (tsukijiEpisode) {
    console.log(`   築地エピソード位置: ${(tsukijiIndex || -1) + 1}番目`)
    console.log(`   築地エピソード日付: ${tsukijiEpisode.date}`)
  }

  // 3. CelebrityProfile.tsxと同じロジックでロケーションリンクを取得
  console.log('\n📍 ロケーションリンク取得:')
  
  const { data: locationLinks, error: locationError } = await supabase
    .from('episode_locations')
    .select('episode_id')
    .in('episode_id', episodes?.map(ep => ep.id) || [])

  if (locationError) {
    console.error('❌ ロケーションリンク取得エラー:', locationError)
    return
  }

  console.log(`   総ロケーションリンク数: ${locationLinks?.length}件`)

  // 4. episodeLinksMapを生成（CelebrityProfile.tsxと同じロジック）
  console.log('\n🔗 episodeLinksMap生成:')
  
  const episodeLinksMap: { [episodeId: string]: { locations: number, items: number } } = {}
  
  // 初期化
  episodes?.forEach(episode => {
    episodeLinksMap[episode.id] = { locations: 0, items: 0 }
  })
  
  // ロケーションリンクをカウント
  locationLinks?.forEach(link => {
    if (episodeLinksMap[link.episode_id]) {
      episodeLinksMap[link.episode_id].locations++
    }
  })

  console.log(`   episodeLinksMap生成完了`)

  // 5. 築地エピソードのリンク数をチェック
  console.log('\n🎯 築地エピソード詳細チェック:')
  
  const tsukijiLinks = episodeLinksMap[TSUKIJI_EPISODE_ID]
  console.log(`   築地エピソードID: ${TSUKIJI_EPISODE_ID}`)
  console.log(`   episodeLinksMapに存在: ${tsukijiLinks ? '✅ はい' : '❌ いいえ'}`)
  
  if (tsukijiLinks) {
    console.log(`   ロケーション数: ${tsukijiLinks.locations}件`)
    console.log(`   アイテム数: ${tsukijiLinks.items}件`)
    console.log(`   タグ表示判定: ${tsukijiLinks.locations > 0 ? '✅ 表示されるはず' : '❌ 表示されない'}`)
  }

  // 6. ロケーション付きエピソード一覧
  console.log('\n📍 ロケーション付きエピソード一覧:')
  
  let locationEpisodeCount = 0
  for (const [episodeId, links] of Object.entries(episodeLinksMap)) {
    if (links.locations > 0) {
      locationEpisodeCount++
      const episode = episodes?.find(ep => ep.id === episodeId)
      console.log(`   - ${episode?.title || '不明'} (${links.locations}件)`)
    }
  }
  
  console.log(`   総ロケーション付きエピソード: ${locationEpisodeCount}件`)

  console.log('\n🔍 デバッグ完了')
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  debugEpisodeLinks().catch(console.error)
}