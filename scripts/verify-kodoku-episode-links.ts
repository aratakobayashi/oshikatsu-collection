/**
 * 孤独のグルメのエピソードとロケーション紐付けを完全検証
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyKodokuEpisodeLinks(): Promise<void> {
  try {
    console.log('🔍 孤独のグルメ データ完全検証開始...\n')

    // 1. 松重豊確認
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (!celebrity) {
      console.error('❌ 松重豊が見つかりません')
      return
    }

    console.log(`✅ セレブリティ: ${celebrity.name} (${celebrity.id})\n`)

    // 2. すべてのエピソードを取得
    const { data: allEpisodes } = await supabase
      .from('episodes')
      .select('id, title, date')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: true })

    console.log(`📺 総エピソード数: ${allEpisodes?.length || 0}件\n`)

    // 3. episode_locationsの全データを確認
    const { data: allEpisodeLocations } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')

    console.log(`🔗 episode_locations総レコード数: ${allEpisodeLocations?.length || 0}件\n`)

    // 4. 孤独のグルメエピソードの紐付けを確認
    if (allEpisodes && allEpisodeLocations) {
      const kodokuEpisodeIds = allEpisodes.map(e => e.id)
      const kodokuLinks = allEpisodeLocations.filter(el => 
        kodokuEpisodeIds.includes(el.episode_id)
      )

      console.log(`📊 孤独のグルメ紐付け状況:`)
      console.log(`  対象エピソード: ${kodokuEpisodeIds.length}件`)
      console.log(`  紐付けレコード: ${kodokuLinks.length}件\n`)

      // エピソードごとの紐付け状況を確認
      const episodesWithLocations = allEpisodes.filter(ep => 
        kodokuLinks.some(link => link.episode_id === ep.id)
      )

      console.log(`✅ ロケーションありエピソード: ${episodesWithLocations.length}件`)
      
      // シーズンごとの内訳
      const seasonStats: Record<string, number> = {}
      episodesWithLocations.forEach(ep => {
        const seasonMatch = ep.title.match(/Season(\d+)/)
        const season = seasonMatch ? `Season${seasonMatch[1]}` : 'Unknown'
        seasonStats[season] = (seasonStats[season] || 0) + 1
      })

      console.log('\n📈 シーズン別内訳:')
      Object.entries(seasonStats).forEach(([season, count]) => {
        console.log(`  ${season}: ${count}件`)
      })

      // 最初の5件と最後の5件を表示
      console.log('\n📝 サンプル（最初の5件）:')
      episodesWithLocations.slice(0, 5).forEach(ep => {
        console.log(`  ✅ [${ep.date}] ${ep.title.substring(0, 40)}...`)
      })

      console.log('\n📝 サンプル（最後の5件）:')
      episodesWithLocations.slice(-5).forEach(ep => {
        console.log(`  ✅ [${ep.date}] ${ep.title.substring(0, 40)}...`)
      })

      // 紐付けがないエピソードの確認
      const episodesWithoutLocations = allEpisodes.filter(ep => 
        !kodokuLinks.some(link => link.episode_id === ep.id)
      )

      console.log(`\n⚠️ ロケーションなしエピソード: ${episodesWithoutLocations.length}件`)
      if (episodesWithoutLocations.length > 0) {
        console.log('  最新の5件:')
        episodesWithoutLocations.slice(-5).forEach(ep => {
          console.log(`    ❌ [${ep.date}] ${ep.title.substring(0, 40)}...`)
        })
      }
    }

    // 5. フロントエンドで使われるクエリを完全に模倣
    console.log('\n🎯 フロントエンドクエリ模倣テスト:')
    
    const episodeIds = allEpisodes?.map(ep => ep.id) || []
    const { data: frontendData, error } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        location:locations!inner (
          id,
          name,
          address
        )
      `)
      .in('episode_id', episodeIds.slice(0, 20)) // 最初の20件でテスト

    console.log(`  クエリ結果: ${frontendData?.length || 0}件`)
    if (error) {
      console.error(`  ❌ エラー:`, error)
    } else if (frontendData && frontendData.length > 0) {
      console.log('  ✅ データ取得成功')
      console.log('  サンプル:', frontendData[0])
    }

  } catch (error) {
    console.error('❌ 検証エラー:', error)
  }
}

// 実行
verifyKodokuEpisodeLinks().catch(console.error)