/**
 * エピソード-ロケーション紐付けテスト
 * フロントエンドで正しくロケ地タグが表示されるかチェック
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testEpisodeLocationLinks(): Promise<void> {
  try {
    console.log('🔍 松重豊のエピソード-ロケーション紐付けテスト開始...')
    
    // 1. 松重豊のセレブリティIDを取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (celebError || !celebrity) {
      console.error('❌ 松重豊が見つかりません:', celebError)
      return
    }

    console.log(`✅ セレブリティ: ${celebrity.name} (ID: ${celebrity.id})`)

    // 2. エピソードを取得
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .select('id, title, date')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: true })
      .limit(20)

    if (episodeError) {
      console.error('❌ エピソード取得エラー:', episodeError)
      return
    }

    console.log(`\n📺 エピソード数: ${episodes?.length || 0}件`)

    if (!episodes || episodes.length === 0) {
      console.log('⚠️ エピソードが見つかりません')
      return
    }

    // 3. フロントエンドと同じロジックでロケーション情報を取得
    const episodeIds = episodes.map(ep => ep.id)
    
    const { data: locationLinks, error: locError } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        location:locations!inner (
          id,
          name,
          address,
          description
        )
      `)
      .in('episode_id', episodeIds)

    if (locError) {
      console.error('❌ ロケーション取得エラー:', locError)
    }

    console.log(`\n📍 エピソード-ロケーション紐付け数: ${locationLinks?.length || 0}件`)

    // 4. エピソードごとに集計（フロントエンドのロジックを模倣）
    const episodeLinksMap: { [episodeId: string]: { locations: number, items: number, locationDetails: any[] } } = {}
    
    episodes.forEach(episode => {
      episodeLinksMap[episode.id] = { locations: 0, items: 0, locationDetails: [] }
    })
    
    locationLinks?.forEach(link => {
      if (episodeLinksMap[link.episode_id]) {
        episodeLinksMap[link.episode_id].locations++
        episodeLinksMap[link.episode_id].locationDetails.push(link.location)
      }
    })

    // 5. 結果表示
    console.log('\n🎯 エピソード別ロケ地タグ表示テスト:')
    console.log('='.repeat(60))
    
    let totalEpisodesWithLocations = 0
    
    episodes.forEach(episode => {
      const links = episodeLinksMap[episode.id]
      const hasLocationTag = links.locations > 0
      
      if (hasLocationTag) totalEpisodesWithLocations++
      
      console.log(`\n${hasLocationTag ? '✅' : '⚪'} [${episode.date}] ${episode.title}`)
      console.log(`   ロケ地タグ: ${hasLocationTag ? 'あり' : 'なし'} (${links.locations}件)`)
      
      if (links.locationDetails.length > 0) {
        links.locationDetails.forEach((loc, idx) => {
          console.log(`   ${idx + 1}. ${loc.name}`)
          if (loc.address) {
            console.log(`      📍 ${loc.address}`)
          }
        })
      }
    })

    console.log('\n📊 集計結果:')
    console.log('='.repeat(30))
    console.log(`🎬 総エピソード数: ${episodes.length}件`)
    console.log(`📍 ロケ地タグ表示対象: ${totalEpisodesWithLocations}件`)
    console.log(`📈 ロケ地カバー率: ${Math.round((totalEpisodesWithLocations / episodes.length) * 100)}%`)
    
    if (totalEpisodesWithLocations > 0) {
      console.log('\n🎉 ロケ地タグ機能は正常に動作しています！')
      console.log(`孤独のグルメの${totalEpisodesWithLocations}エピソードで「📍 ロケ地あり」タグが表示されます`)
    } else {
      console.log('\n⚠️ ロケ地タグが表示されるエピソードがありません')
      console.log('episode_locations テーブルの紐付けを確認してください')
    }

  } catch (error) {
    console.error('❌ テスト実行エラー:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testEpisodeLocationLinks().catch(console.error)
}