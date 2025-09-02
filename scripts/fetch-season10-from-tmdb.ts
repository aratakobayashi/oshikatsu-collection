#!/usr/bin/env node

/**
 * TMDBから孤独のグルメ Season10のエピソード情報を取得
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// TMDBのAPI設定
const TMDB_API_KEY = process.env.TMDB_API_KEY
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// 孤独のグルメのTMDB ID
const KODOKU_NO_GOURMET_ID = 55582
const SEASON_NUMBER = 10

interface TMDBEpisode {
  id: number
  episode_number: number
  name: string
  overview: string
  air_date: string
  still_path: string | null
  season_number: number
}

async function fetchSeason10FromTMDB() {
  console.log('🎬 孤独のグルメ Season10 エピソード取得開始...\n')
  
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEYが設定されていません')
    return
  }
  
  try {
    // Season10の情報を取得
    const url = `${TMDB_BASE_URL}/tv/${KODOKU_NO_GOURMET_ID}/season/${SEASON_NUMBER}?api_key=${TMDB_API_KEY}&language=ja-JP`
    console.log(`🔍 TMDBからSeason10データ取得中...`)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('⚠️ Season10はTMDBにまだ登録されていない可能性があります')
        console.log('📺 最新シーズンの情報確認中...')
        
        // シリーズ全体の情報を取得
        const seriesUrl = `${TMDB_BASE_URL}/tv/${KODOKU_NO_GOURMET_ID}?api_key=${TMDB_API_KEY}&language=ja-JP`
        const seriesResponse = await fetch(seriesUrl)
        const seriesData = await seriesResponse.json()
        
        console.log(`📊 現在のシーズン数: ${seriesData.number_of_seasons}`)
        console.log(`📊 総エピソード数: ${seriesData.number_of_episodes}`)
        
        if (seriesData.seasons) {
          console.log('\n利用可能なシーズン:')
          seriesData.seasons.forEach((season: any) => {
            if (season.season_number > 0) {
              console.log(`  Season${season.season_number}: ${season.episode_count}エピソード (${season.air_date || '未定'})`)
            }
          })
        }
        
        return
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const seasonData = await response.json()
    
    console.log(`✅ Season10データ取得成功!`)
    console.log(`📺 シーズン名: ${seasonData.name}`)
    console.log(`📅 放送開始日: ${seasonData.air_date || '未定'}`)
    console.log(`🎬 エピソード数: ${seasonData.episodes?.length || 0}`)
    
    if (seasonData.episodes && seasonData.episodes.length > 0) {
      console.log('\n📝 エピソード一覧:')
      
      for (const episode of seasonData.episodes) {
        console.log(`\n第${episode.episode_number}話: ${episode.name}`)
        console.log(`  放送日: ${episode.air_date || '未定'}`)
        console.log(`  概要: ${episode.overview || '詳細未定'}`)
        
        if (episode.still_path) {
          console.log(`  画像: ${TMDB_IMAGE_BASE_URL}${episode.still_path}`)
        }
      }
      
      console.log('\n💾 データベースへの保存を開始しますか？')
      console.log('(実際の保存は別スクリプトで実装)')
      
      // エピソードデータを返す（別スクリプトで使用可能）
      return seasonData.episodes
    } else {
      console.log('\n⚠️ エピソード情報がまだ登録されていません')
      console.log('放送開始後に再度お試しください')
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
fetchSeason10FromTMDB()

export { fetchSeason10FromTMDB }
