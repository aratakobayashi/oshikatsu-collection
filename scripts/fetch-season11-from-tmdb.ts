#!/usr/bin/env node

/**
 * TMDB APIから孤独のグルメ Season11のエピソード情報を取得
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const TMDB_API_KEY = process.env.TMDB_API_KEY

if (!TMDB_API_KEY) {
  console.error('❌ TMDB_API_KEY が設定されていません。.env.productionファイルを確認してください。')
  process.exit(1)
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TV_ID = 55582 // 孤独のグルメのTMDB ID
const SEASON_NUMBER = 11

interface TMDBEpisode {
  id: number
  name: string
  overview: string
  air_date: string
  episode_number: number
  season_number: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

interface TMDBSeason {
  air_date: string
  episodes: TMDBEpisode[]
  name: string
  overview: string
  id: number
  poster_path: string | null
  season_number: number
}

async function fetchSeason11Episodes() {
  console.log('🎬 TMDB APIから Season11 のエピソード情報を取得中...\n')

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/tv/${TV_ID}/season/${SEASON_NUMBER}?api_key=${TMDB_API_KEY}&language=ja-JP`
    )

    if (!response.ok) {
      throw new Error(`TMDBリクエストエラー: ${response.status}`)
    }

    const seasonData: TMDBSeason = await response.json()
    
    console.log(`📺 シーズン: ${seasonData.name}`)
    console.log(`📅 放送開始日: ${seasonData.air_date}`)
    console.log(`📋 エピソード数: ${seasonData.episodes.length}`)
    console.log(`🆔 Season ID: ${seasonData.id}`)
    console.log('\n📖 エピソード一覧:')
    
    seasonData.episodes.forEach(episode => {
      console.log(`\n第${episode.episode_number}話:`)
      console.log(`  タイトル: ${episode.name}`)
      console.log(`  放送日: ${episode.air_date}`)
      console.log(`  概要: ${episode.overview || '概要なし'}`)
      console.log(`  評価: ${episode.vote_average}/10 (${episode.vote_count}票)`)
      console.log(`  TMDB ID: ${episode.id}`)
    })

    console.log('\n✅ Season11のエピソード情報取得完了！')
    console.log('\n📄 取得したデータ（JSON形式）:')
    console.log(JSON.stringify(seasonData, null, 2))
    
    return seasonData

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

fetchSeason11Episodes()