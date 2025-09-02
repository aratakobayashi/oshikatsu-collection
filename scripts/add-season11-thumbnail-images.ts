#!/usr/bin/env node

/**
 * Season11のエピソードサムネイル画像をTMDBから取得してデータベースに追加
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

async function addSeason11ThumbnailImages() {
  console.log('🖼️  Season11のエピソードサムネイル画像を取得・更新中...\n')

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
      .select('id, title, thumbnail_url')
      .like('title', '%Season11%')
      .order('title')

    if (dbError || !dbEpisodes) {
      console.error('❌ データベースエラー:', dbError)
      return
    }

    console.log(`✅ データベースエピソード取得: ${dbEpisodes.length}話`)

    let successCount = 0
    let alreadyHasImage = 0
    let noImageAvailable = 0

    // 各エピソードのサムネイルを確認・更新
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
      
      // 現在のサムネイルURL状況を確認
      if (dbEpisode.thumbnail_url && dbEpisode.thumbnail_url.trim() !== '') {
        console.log(`✅ 既にサムネイルURLが設定済み: ${dbEpisode.thumbnail_url}`)
        alreadyHasImage++
        continue
      }

      // TMDB画像が存在するかチェック
      if (!tmdbEpisode.still_path) {
        console.log(`⚠️  TMDB画像なし`)
        noImageAvailable++
        continue
      }

      const thumbnailUrl = `${TMDB_IMAGE_BASE_URL}${tmdbEpisode.still_path}`
      console.log(`🖼️  TMDB画像: ${thumbnailUrl}`)

      // データベースを更新
      const { error: updateError } = await supabase
        .from('episodes')
        .update({ 
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbEpisode.id)

      if (updateError) {
        console.error(`❌ 第${episodeNumber}話のサムネイル更新エラー:`, updateError.message)
        continue
      }

      console.log(`✅ 第${episodeNumber}話: サムネイル画像追加完了`)
      successCount++
    }

    console.log('\n📊 結果まとめ:')
    console.log(`✅ サムネイル追加完了: ${successCount}話`)
    console.log(`🔄 既存サムネイルあり: ${alreadyHasImage}話`)
    console.log(`⚠️  画像なし: ${noImageAvailable}話`)
    console.log(`📺 総エピソード: ${dbEpisodes.length}話`)

    if (successCount > 0) {
      console.log('\n🎉 Season11のエピソードサムネイル画像追加完了！')
      console.log('💡 フロントエンドでサムネイル画像が表示されるようになります。')
    } else if (alreadyHasImage === dbEpisodes.length) {
      console.log('\n✅ すべてのエピソードに既にサムネイルが設定済みです！')
    } else {
      console.log('\n⚠️  一部のエピソードにサムネイルを追加できませんでした。')
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

addSeason11ThumbnailImages()