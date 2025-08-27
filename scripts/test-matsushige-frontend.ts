/**
 * 松重豊のフロントエンド表示をテスト
 * よにのチャンネルと同じ方法でデータを取得
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testMatsushigeFrontend() {
  console.log('🔍 フロントエンドと同じ方法でテスト...\n')

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

  console.log(`✅ ${matsushige.name} (${matsushige.id})\n`)

  // 2. エピソードを取得（フロントエンドと同じ）
  const { data: episodes, error: epError } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', matsushige.id)
    .order('date', { ascending: false })

  console.log(`📺 エピソード総数: ${episodes?.length || 0}\n`)

  if (!episodes || episodes.length === 0) {
    console.error('❌ エピソードが見つかりません')
    return
  }

  const episodeIds = episodes.map(ep => ep.id)
  
  // 3. フロントエンドと全く同じクエリ
  console.log('🔗 フロントエンドと同じクエリを実行...')
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

  console.log(`結果: ${locationLinks?.length || 0}件`)
  
  if (locError) {
    console.error('❌ エラー:', locError)
    return
  }

  // 4. エピソードごとの集計
  const episodeLinksMap: Record<string, any> = {}
  
  episodes.forEach(episode => {
    episodeLinksMap[episode.id] = { 
      title: episode.title,
      locations: 0, 
      locationDetails: [] 
    }
  })
  
  locationLinks?.forEach(link => {
    if (episodeLinksMap[link.episode_id] && link.location) {
      episodeLinksMap[link.episode_id].locations++
      episodeLinksMap[link.episode_id].locationDetails.push({
        id: link.location.id,
        name: link.location.name,
        address: link.location.address
      })
    }
  })

  // 5. 結果表示
  console.log('\n📊 ロケ地ありエピソード:')
  const episodesWithLocations = Object.entries(episodeLinksMap)
    .filter(([_, data]) => data.locations > 0)
    .sort((a, b) => b[1].locations - a[1].locations)

  console.log(`合計: ${episodesWithLocations.length}件\n`)
  
  episodesWithLocations.slice(0, 10).forEach(([episodeId, data]) => {
    console.log(`✅ ${data.title.substring(0, 40)}...`)
    console.log(`   ロケーション: ${data.locations}件`)
    data.locationDetails.forEach((loc: any) => {
      console.log(`   - ${loc.name}`)
    })
    console.log('')
  })

  // 6. よにのチャンネルと比較
  console.log('\n📺 よにのチャンネルと比較:')
  
  const { data: yoni } = await supabase
    .from('celebrities')
    .select('id, name')
    .eq('id', 'UC2alHD2WkakOiTxCxF-uMAg')
    .single()

  if (yoni) {
    const { data: yoniEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', yoni.id)
      .limit(50)

    if (yoniEpisodes) {
      const yoniIds = yoniEpisodes.map(e => e.id)
      
      const { data: yoniLinks } = await supabase
        .from('episode_locations')
        .select('episode_id')
        .in('episode_id', yoniIds)

      console.log(`  よにのチャンネル: ${yoniLinks?.length || 0}件のロケーション紐付け（50エピソード中）`)
    }
  }

  console.log(`  松重豊: ${locationLinks?.length || 0}件のロケーション紐付け（${episodes.length}エピソード中）`)
  
  if (locationLinks && locationLinks.length > 0) {
    console.log('\n✅ データは正しく存在しています！')
    console.log('フロントエンドで表示されるはずです。')
  } else {
    console.log('\n❌ ロケーション紐付けが見つかりません')
  }
}

testMatsushigeFrontend().catch(console.error)