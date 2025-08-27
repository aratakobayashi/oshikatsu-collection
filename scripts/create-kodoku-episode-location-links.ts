/**
 * 孤独のグルメのエピソード-ロケーション紐付けを作成
 * locations テーブルの情報を使って episode_locations テーブルに紐付けを作成
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createKodokuEpisodeLocationLinks(): Promise<void> {
  try {
    console.log('🔗 孤独のグルメ エピソード-ロケーション紐付け作成開始...')

    // 1. 松重豊のセレブリティIDを取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'matsushige-yutaka')
      .single()

    if (celebError || !celebrity) {
      throw new Error('松重豊のセレブリティが見つかりません')
    }

    console.log(`✅ セレブリティ: ${celebrity.name} (${celebrity.id})`)

    // 2. 孤独のグルメのロケーションを取得
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, description')
      .like('description', '%Season%Episode%')

    if (locError || !locations) {
      throw new Error('孤独のグルメロケーションの取得に失敗')
    }

    console.log(`📍 対象ロケーション: ${locations.length}件`)

    // 3. 孤独のグルメのエピソードを取得
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, date')
      .eq('celebrity_id', celebrity.id)

    if (epError || !episodes) {
      throw new Error('孤独のグルメエピソードの取得に失敗')
    }

    console.log(`🎬 対象エピソード: ${episodes.length}件`)

    // 4. 紐付けを作成
    let createdLinks = 0
    let skippedExisting = 0
    let errors = 0

    for (const location of locations) {
      try {
        // DescriptionからSeason/Episodeを抽出
        const seasonMatch = location.description?.match(/Season(\d+)/)
        const episodeMatch = location.description?.match(/Episode(\d+)/)
        
        if (!seasonMatch || !episodeMatch) {
          console.log(`⚠️ ${location.name}: Season/Episode情報が見つかりません`)
          continue
        }

        const season = parseInt(seasonMatch[1])
        const episodeNum = parseInt(episodeMatch[1])

        // 対応するエピソードを検索
        const targetEpisode = episodes.find(ep => 
          ep.title.includes(`Season${season}`) && 
          ep.title.includes(`第${episodeNum}話`)
        )

        if (!targetEpisode) {
          console.log(`⚠️ ${location.name}: Season${season} 第${episodeNum}話が見つかりません`)
          continue
        }

        // 既存の紐付けをチェック
        const { data: existingLink } = await supabase
          .from('episode_locations')
          .select('id')
          .eq('episode_id', targetEpisode.id)
          .eq('location_id', location.id)
          .single()

        if (existingLink) {
          console.log(`⏭️ 既存: ${location.name} → ${targetEpisode.title.substring(0, 40)}...`)
          skippedExisting++
          continue
        }

        // 新規紐付けを作成
        const { error: createError } = await supabase
          .from('episode_locations')
          .insert({
            episode_id: targetEpisode.id,
            location_id: location.id
          })

        if (createError) {
          throw createError
        }

        console.log(`✅ 作成: ${location.name} → ${targetEpisode.title.substring(0, 40)}...`)
        createdLinks++

        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`❌ ${location.name}: ${error}`)
        errors++
      }
    }

    // 5. 結果レポート
    console.log('\n🎉 エピソード-ロケーション紐付け作成完了!')
    console.log('='.repeat(50))
    console.log(`📍 処理対象ロケーション: ${locations.length}件`)
    console.log(`✅ 新規紐付け作成: ${createdLinks}件`)
    console.log(`⏭️ 既存スキップ: ${skippedExisting}件`)
    console.log(`❌ エラー: ${errors}件`)

    // 6. 作成後のテスト
    const { data: allLinks } = await supabase
      .from('episode_locations')
      .select('*')
      .in('location_id', locations.map(l => l.id))

    console.log(`\n🔗 作成された紐付け総数: ${allLinks?.length || 0}件`)
    
    if (createdLinks > 0) {
      console.log('\n🎯 フロントエンドでの表示:')
      console.log(`${createdLinks}件のエピソードで「📍 ロケ地あり」タグが表示されます！`)
    }

  } catch (error) {
    console.error('❌ 実行エラー:', error)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createKodokuEpisodeLocationLinks().catch(console.error)
}