/**
 * フロントエンドのロジックをデバッグ
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFrontendLogic(): Promise<void> {
  try {
    console.log('🔍 フロントエンドロジックのデバッグ開始...\n')

    // 1. 松重豊のセレブリティ情報を取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (celebError || !celebrity) {
      console.error('❌ セレブリティ取得エラー:', celebError)
      return
    }

    console.log(`✅ セレブリティ: ${celebrity.name} (ID: ${celebrity.id})\n`)

    // 2. エピソードを取得（フロントエンドと同じロジック）
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: false })
      .limit(10)

    if (episodeError || !episodes) {
      console.error('❌ エピソード取得エラー:', episodeError)
      return
    }

    const episodeIds = episodes.map(ep => ep.id)
    console.log(`📺 エピソード数: ${episodes.length}`)
    console.log(`📺 エピソードID例:`, episodeIds.slice(0, 3), '\n')

    // 3. episode_locations テーブルから紐付けを取得（フロントエンドと同じクエリ）
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

    console.log('🔍 episode_locationsクエリ結果:')
    console.log(`  取得件数: ${locationLinks?.length || 0}件`)
    
    if (locError) {
      console.error('  ❌ エラー:', locError)
    } else if (locationLinks && locationLinks.length > 0) {
      console.log('  📍 サンプルデータ:')
      locationLinks.slice(0, 3).forEach(link => {
        console.log(`    - Episode: ${link.episode_id}`)
        console.log(`      Location: ${link.location?.name || 'なし'}`)
      })
    } else {
      console.log('  ⚠️ 紐付けデータが見つかりません')
    }

    // 4. 直接SQLクエリで確認
    console.log('\n🔍 直接SQLクエリで確認:')
    
    // episode_locationsテーブルの存在確認
    const { data: allEpisodeLocations, error: allError } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .limit(5)

    console.log(`  episode_locationsテーブル全体: ${allEpisodeLocations?.length || 0}件`)
    
    if (allEpisodeLocations && allEpisodeLocations.length > 0) {
      console.log('  サンプル:')
      allEpisodeLocations.forEach(el => {
        console.log(`    - ${el.episode_id} → ${el.location_id}`)
      })
    }

    // 5. 孤独のグルメエピソードに紐付いているか確認
    const { data: kodokuLinks } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .in('episode_id', episodeIds)

    console.log(`\n📊 孤独のグルメエピソードの紐付け:`)
    console.log(`  対象エピソード: ${episodeIds.length}件`)
    console.log(`  紐付けあり: ${kodokuLinks?.length || 0}件`)

    if (kodokuLinks && kodokuLinks.length > 0) {
      console.log('  ✅ 紐付けデータは存在します')
      
      // エピソードIDと照合
      const matchedEpisodes = episodes.filter(ep => 
        kodokuLinks.some(link => link.episode_id === ep.id)
      )
      console.log(`  📺 タグが表示されるエピソード:`)
      matchedEpisodes.forEach(ep => {
        console.log(`    - ${ep.title.substring(0, 40)}...`)
      })
    } else {
      console.log('  ⚠️ 最新10エピソードには紐付けがありません')
      console.log('  💡 古いエピソード（Season1-10）には紐付けがある可能性があります')
    }

  } catch (error) {
    console.error('❌ デバッグエラー:', error)
  }
}

// 実行
debugFrontendLogic().catch(console.error)