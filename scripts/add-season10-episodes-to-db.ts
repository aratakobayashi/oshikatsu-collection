#!/usr/bin/env node

/**
 * 孤独のグルメ Season10 エピソードをデータベースに追加
 * TMDBから取得したデータを基に実装
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
const KODOKU_NO_GOURMET_ID = 55582
const SEASON_NUMBER = 10

async function addSeason10Episodes() {
  console.log('🎬 孤独のグルメ Season10 エピソード追加開始...\n')
  
  if (!TMDB_API_KEY) {
    console.error('❌ TMDB_API_KEYが設定されていません')
    return
  }
  
  try {
    // Season10の情報を取得
    const url = `${TMDB_BASE_URL}/tv/${KODOKU_NO_GOURMET_ID}/season/${SEASON_NUMBER}?api_key=${TMDB_API_KEY}&language=ja-JP`
    console.log(`🔍 TMDBからSeason10データ取得中...`)
    
    const response = await fetch(url)
    const seasonData = await response.json()
    
    if (!seasonData.episodes || seasonData.episodes.length === 0) {
      console.log('❌ エピソードデータが取得できませんでした')
      return
    }
    
    console.log(`✅ ${seasonData.episodes.length}エピソード取得完了\n`)
    
    // 各エピソードをデータベースに追加
    for (const episode of seasonData.episodes) {
      const episodeId = randomUUID()
      const title = `孤独のグルメ Season10 第${episode.episode_number}話「${episode.name}」`
      
      console.log(`📝 追加中: ${title}`)
      
      // エピソードを追加
      const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: title,
          description: episode.overview || '',
          air_date: episode.air_date,
          thumbnail_url: episode.still_path ? `${TMDB_IMAGE_BASE_URL}${episode.still_path}` : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (episodeError) {
        console.error(`  ❌ エラー:`, episodeError)
        continue
      }
      
      console.log(`  ✅ エピソード追加成功`)
      
      // エピソードタイトルから地名を抽出（簡易的な処理）
      const locationMatch = episode.name.match(/^([^の]+)の(.+)$/)
      if (locationMatch) {
        const area = locationMatch[1]
        const dishes = locationMatch[2]
        console.log(`  📍 エリア: ${area}`)
        console.log(`  🍴 料理: ${dishes}`)
      }
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 Season10 全エピソード追加完了！')
    console.log('=' .repeat(70))
    
    // 追加結果を確認
    const { data: checkData, count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact' })
      .like('title', '%Season10%')
    
    console.log(`\n📊 Season10エピソード数: ${count}`)
    
    if (count === 12) {
      console.log('✅ 全12エピソード正常に追加されました')
      console.log('\n📝 次のステップ:')
      console.log('1. 各エピソードのロケーション（店舗）情報を調査')
      console.log('2. タベログURLを特定してLinkSwitch対応')
      console.log('3. 営業時間や定休日などの詳細情報を追加')
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
addSeason10Episodes()

export { addSeason10Episodes }
