/**
 * 松重豊のロケ地タグが表示されない問題のデバッグ
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugMatsushigeTags() {
  console.log('🔍 松重豊のロケ地タグデバッグ...\n')

  // 1. 松重豊を取得
  const { data: matsushige } = await supabase
    .from('celebrities')
    .select('id, name, slug')
    .eq('slug', 'matsushige-yutaka')
    .single()

  if (!matsushige) {
    console.error('❌ 松重豊が見つかりません')
    return
  }

  console.log(`✅ ${matsushige.name} (${matsushige.id})`)

  // 2. エピソード取得（最新20件）
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, date')
    .eq('celebrity_id', matsushige.id)
    .order('date', { ascending: false })
    .limit(20)

  if (!episodes) {
    console.error('❌ エピソードが取得できません')
    return
  }

  console.log(`📺 最新20エピソード取得: ${episodes.length}件`)

  const episodeIds = episodes.map(ep => ep.id)

  // 3. ロケ地紐付け取得（フロントエンドと同じクエリ）
  const { data: locationLinks, error: locError } = await supabase
    .from('episode_locations')
    .select(`
      episode_id,
      location:locations!inner (
        id,
        name,
        address
      )
    `)
    .in('episode_id', episodeIds)

  if (locError) {
    console.error('❌ ロケ地紐付け取得エラー:', locError)
    return
  }

  console.log(`🔗 ロケ地紐付け: ${locationLinks?.length || 0}件`)

  // 4. エピソードデータ構造作成（フロントエンドと同じ処理）
  const episodeLinksMap: { [episodeId: string]: { locations: number, items: number, locationDetails?: any[] } } = {}

  episodes.forEach(episode => {
    episodeLinksMap[episode.id] = { locations: 0, items: 0, locationDetails: [] }
  })

  locationLinks?.forEach(link => {
    if (episodeLinksMap[link.episode_id] && link.location) {
      episodeLinksMap[link.episode_id].locations++
      episodeLinksMap[link.episode_id].locationDetails?.push({
        id: link.location.id,
        name: link.location.name,
        address: link.location.address
      })
    }
  })

  // 5. 結果確認
  const episodesWithLocations = episodes.filter(ep => episodeLinksMap[ep.id].locations > 0)
  
  console.log(`\n📊 分析結果:`)
  console.log(`- 総エピソード数: ${episodes.length}`)
  console.log(`- ロケ地ありエピソード数: ${episodesWithLocations.length}`)
  
  if (episodesWithLocations.length > 0) {
    console.log(`\n✅ ロケ地ありエピソード（最新20件中）:`)
    episodesWithLocations.forEach(episode => {
      const locations = episodeLinksMap[episode.id].locations
      console.log(`   - ${episode.title.substring(0, 50)}... (${locations}件)`)
    })
    console.log(`\n✅ タグが表示されるはずです！`)
  } else {
    console.log(`\n❌ 最新20件にはロケ地ありエピソードがありません`)
    console.log(`   これが表示されない原因です。`)
    
    // 全エピソードでロケ地があるものを確認
    const { data: allEpisodes } = await supabase
      .from('episodes')
      .select('id, title, date')
      .eq('celebrity_id', matsushige.id)
      .order('date', { ascending: false })

    if (allEpisodes) {
      const allEpisodeIds = allEpisodes.map(ep => ep.id)
      const { data: allLocationLinks } = await supabase
        .from('episode_locations')
        .select('episode_id')
        .in('episode_id', allEpisodeIds)

      const episodesWithLocationsAll = allEpisodes.filter(ep => 
        allLocationLinks?.some(link => link.episode_id === ep.id)
      ).slice(0, 10)

      console.log(`\n📍 全エピソード中でロケ地があるもの（上位10件）:`)
      episodesWithLocationsAll.forEach((episode, index) => {
        console.log(`   ${index + 1}. ${episode.title.substring(0, 60)}...`)
        console.log(`      日付: ${episode.date}`)
      })
    }
  }
}

debugMatsushigeTags().catch(console.error)