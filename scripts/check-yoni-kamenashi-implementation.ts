/**
 * よにのチャンネルと亀梨和也のデータ構造を正確に確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkYoniKamenashiImplementation(): Promise<void> {
  try {
    console.log('🔍 よにのチャンネルと亀梨和也のデータ構造確認...\n')

    // 1. よにのチャンネル確認
    console.log('📺 よにのチャンネル:')
    const { data: yoni } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', 'yoni-channel')
      .single()

    if (yoni) {
      console.log(`  ID: ${yoni.id}`)
      console.log(`  Name: ${yoni.name}`)

      // エピソード確認
      const { data: yoniEpisodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', yoni.id)
        .limit(3)

      console.log(`  エピソード数: ${yoniEpisodes?.length || 0}`)
      
      if (yoniEpisodes && yoniEpisodes.length > 0) {
        console.log(`  サンプルエピソードID: ${yoniEpisodes[0].id}`)
        
        // episode_locations確認
        const { data: yoniLinks } = await supabase
          .from('episode_locations')
          .select('episode_id, location_id')
          .eq('episode_id', yoniEpisodes[0].id)

        console.log(`  episode_locationsデータ: ${yoniLinks?.length || 0}件`)
        
        if (yoniLinks && yoniLinks.length > 0) {
          console.log(`  ✅ ロケーション紐付けあり`)
        }
      }
    }

    // 2. 亀梨和也確認
    console.log('\n🎭 亀梨和也:')
    const { data: kamenashi } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', 'kamenashi-kazuya')
      .single()

    if (kamenashi) {
      console.log(`  ID: ${kamenashi.id}`)
      console.log(`  Name: ${kamenashi.name}`)

      // エピソード確認
      const { data: kamenashiEpisodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', kamenashi.id)
        .limit(3)

      console.log(`  エピソード数: ${kamenashiEpisodes?.length || 0}`)
      
      if (kamenashiEpisodes && kamenashiEpisodes.length > 0) {
        console.log(`  サンプルエピソードID: ${kamenashiEpisodes[0].id}`)
        
        // episode_locations確認
        const { data: kamenashiLinks } = await supabase
          .from('episode_locations')
          .select('episode_id, location_id')
          .eq('episode_id', kamenashiEpisodes[0].id)

        console.log(`  episode_locationsデータ: ${kamenashiLinks?.length || 0}件`)
        
        if (kamenashiLinks && kamenashiLinks.length > 0) {
          console.log(`  ✅ ロケーション紐付けあり`)
        }
      }
    }

    // 3. 松重豊と比較
    console.log('\n🍜 松重豊（比較）:')
    const { data: matsushige } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (matsushige) {
      console.log(`  ID: ${matsushige.id}`)
      
      const { data: matsushigeEpisodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', matsushige.id)
        .order('date', { ascending: false })
        .limit(10)

      console.log(`  最新10エピソード:`)
      
      for (const ep of (matsushigeEpisodes || [])) {
        const { data: links } = await supabase
          .from('episode_locations')
          .select('episode_id')
          .eq('episode_id', ep.id)

        console.log(`    ${ep.title.substring(0, 30)}... → ${links?.length || 0}件`)
      }
    }

    // 4. 全体のepisode_locations確認
    console.log('\n📊 episode_locationsテーブル全体:')
    const { data: allLinks } = await supabase
      .from('episode_locations')
      .select('episode_id')
      
    const uniqueEpisodes = new Set(allLinks?.map(l => l.episode_id) || [])
    console.log(`  総レコード数: ${allLinks?.length || 0}`)
    console.log(`  ユニークエピソード数: ${uniqueEpisodes.size}`)

    // どのセレブリティのエピソードか確認
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, celebrity_id')
      .in('id', Array.from(uniqueEpisodes).slice(0, 20))

    const celebrityCount: Record<string, number> = {}
    episodes?.forEach(ep => {
      celebrityCount[ep.celebrity_id] = (celebrityCount[ep.celebrity_id] || 0) + 1
    })

    console.log('\n  セレブリティ別内訳（サンプル）:')
    Object.entries(celebrityCount).forEach(([celeb, count]) => {
      console.log(`    ${celeb}: ${count}件`)
    })

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
checkYoniKamenashiImplementation().catch(console.error)