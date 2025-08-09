/**
 * 収集されたデータの確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 本番環境の設定を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCollectedData() {
  console.log('📊 収集されたデータの確認')
  console.log('='.repeat(60))
  
  try {
    // エピソード数確認
    const { count: episodeCount, error: episodeError } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
    
    if (episodeError) {
      console.error('❌ エピソード取得エラー:', episodeError)
    } else {
      console.log(`📺 エピソード総数: ${episodeCount}`)
    }

    // 最新のエピソード5件を取得
    const { data: recentEpisodes, error: recentError } = await supabase
      .from('episodes')
      .select('id, title, description, published_at, thumbnail_url')
      .order('published_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('❌ 最新エピソード取得エラー:', recentError)
    } else {
      console.log('\n🆕 最新エピソード5件:')
      recentEpisodes?.forEach((episode, index) => {
        console.log(`${index + 1}. ${episode.title}`)
        console.log(`   ID: ${episode.id}`)
        console.log(`   公開日: ${episode.published_at}`)
        console.log(`   説明: ${episode.description?.substring(0, 100)}...`)
        console.log('')
      })
    }

    // セレブ数確認
    const { count: celebCount, error: celebError } = await supabase
      .from('celebrities')
      .select('*', { count: 'exact', head: true })
    
    if (celebError) {
      console.error('❌ セレブ取得エラー:', celebError)
    } else {
      console.log(`⭐ セレブ総数: ${celebCount}`)
    }

    // アイテム数確認
    const { count: itemCount, error: itemError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
    
    if (itemError) {
      console.error('❌ アイテム取得エラー:', itemError)
    } else {
      console.log(`👗 アイテム総数: ${itemCount}`)
    }

    // 店舗数確認
    const { count: locationCount, error: locationError } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    if (locationError) {
      console.error('❌ 店舗取得エラー:', locationError)
    } else {
      console.log(`🏪 店舗総数: ${locationCount}`)
    }

  } catch (error) {
    console.error('❌ データ確認エラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkCollectedData().catch(console.error)
}