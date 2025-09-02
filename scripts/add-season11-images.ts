#!/usr/bin/env node

/**
 * Season11のエピソード画像をTMDBから取得してデータベースに追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const TMDB_API_KEY = process.env.TMDB_API_KEY!
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
const TV_ID = 55582 // 孤独のグルメのTMDB ID
const SEASON_NUMBER = 11

async function addSeason11Images() {
  console.log('🖼️  Season11のエピソード画像を取得・更新中...\n')

  try {
    // TMDBからSeason11の詳細データを取得
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${TV_ID}/season/${SEASON_NUMBER}?api_key=${TMDB_API_KEY}&language=ja-JP`
    )

    if (!response.ok) {
      throw new Error(`TMDBリクエストエラー: ${response.status}`)
    }

    const seasonData = await response.json()
    
    console.log(`📺 シーズン: ${seasonData.name}`)
    console.log(`📋 エピソード数: ${seasonData.episodes.length}`)
    
    // データベースからSeason11エピソードを取得
    console.log('\n📊 データベースからSeason11エピソード取得中...')
    const { data: dbEpisodes, error: dbError } = await supabase
      .from('episodes')
      .select('id, title, image_url')
      .like('title', '%Season11%')
      .order('title')

    if (dbError || !dbEpisodes) {
      console.error('❌ データベースエラー:', dbError)
      return
    }

    console.log(`✅ データベースエピソード取得: ${dbEpisodes.length}話`)

    let successCount = 0
    let alreadyHasImage = 0

    // 各エピソードの画像を確認・更新
    for (let i = 0; i < seasonData.episodes.length; i++) {
      const tmdbEpisode = seasonData.episodes[i]
      const episodeNumber = tmdbEpisode.episode_number
      
      // 対応するDBエピソードを検索
      const dbEpisode = dbEpisodes.find(ep => ep.title.includes(`第${episodeNumber}話`))
      
      if (!dbEpisode) {
        console.log(`⚠️  第${episodeNumber}話: データベースにエピソードが見つかりません`)
        continue
      }

      console.log(`\n📺 第${episodeNumber}話: ${tmdbEpisode.name}`)
      
      // 現在の画像URL状況を確認
      if (dbEpisode.image_url && dbEpisode.image_url.trim() !== '') {
        console.log(`✅ 既に画像URLが設定済み: ${dbEpisode.image_url}`)
        alreadyHasImage++
        continue
      }

      // TMDB画像が存在するかチェック
      if (!tmdbEpisode.still_path) {
        console.log(`⚠️  TMDB画像なし`)
        continue
      }

      const imageUrl = `${TMDB_IMAGE_BASE_URL}${tmdbEpisode.still_path}`
      console.log(`🖼️  TMDB画像: ${imageUrl}`)

      // データベースを更新
      const { error: updateError } = await supabase
        .from('episodes')
        .update({ 
          image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbEpisode.id)

      if (updateError) {
        console.error(`❌ 第${episodeNumber}話の画像更新エラー:`, updateError.message)
        continue
      }

      console.log(`✅ 第${episodeNumber}話: 画像URL追加完了`)
      successCount++
    }

    console.log('\n📊 結果まとめ:')
    console.log(`✅ 画像追加完了: ${successCount}話`)
    console.log(`🔄 既存画像あり: ${alreadyHasImage}話`)
    console.log(`📺 総エピソード: ${dbEpisodes.length}話`)

    if (successCount > 0) {
      console.log('\n🎉 Season11のエピソード画像追加完了！')
      console.log('💡 フロントエンドで画像が表示されるようになります。')
    } else if (alreadyHasImage === dbEpisodes.length) {
      console.log('\n✅ すべてのエピソードに既に画像が設定済みです！')
    } else {
      console.log('\n⚠️  一部のエピソードに画像を追加できませんでした。')
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

addSeason11Images()