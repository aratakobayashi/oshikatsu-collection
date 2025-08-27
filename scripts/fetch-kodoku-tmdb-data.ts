/**
 * TMDBから孤独のグルメの全エピソード情報を取得し、
 * 松重豊の画像も取得するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// TMDBのAPI設定
const TMDB_API_KEY = process.env.TMDB_API_KEY // 環境変数に設定が必要
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'

// 孤独のグルメのTMDB ID
const KODOKU_NO_GOURMET_ID = 55582

interface TMDBSeason {
  season_number: number
  name: string
  episode_count: number
  air_date: string
}

interface TMDBEpisode {
  id: number
  episode_number: number
  name: string
  overview: string
  air_date: string
  still_path: string | null
  season_number: number
}

interface TMDBPerson {
  id: number
  name: string
  profile_path: string | null
  character: string
  known_for_department: string
}

class TMDBKodokuImporter {
  private apiKey: string
  private celebrityId: string = ''

  constructor() {
    this.apiKey = TMDB_API_KEY || ''
    if (!this.apiKey) {
      console.error('❌ TMDB_API_KEYが設定されていません')
      process.exit(1)
    }
  }

  // TMDBからデータを取得
  async fetchFromTMDB(endpoint: string): Promise<any> {
    const url = `${TMDB_BASE_URL}${endpoint}?api_key=${this.apiKey}&language=ja-JP`
    console.log(`🔍 取得中: ${endpoint}`)
    
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`❌ APIエラー (${endpoint}):`, error)
      return null
    }
  }

  // 松重豊の画像を更新
  async updateMatsushigeImage() {
    console.log('📸 松重豊の画像を取得中...')

    // キャスト情報を取得
    const credits = await this.fetchFromTMDB(`/tv/${KODOKU_NO_GOURMET_ID}/credits`)
    
    if (!credits?.cast) {
      console.log('⚠️ キャスト情報が取得できませんでした')
      return
    }

    // 松重豊を検索（井之頭五郎役）
    const matsushige = credits.cast.find((person: TMDBPerson) => 
      person.name.includes('松重豊') || person.character.includes('井之頭五郎')
    )

    if (!matsushige?.profile_path) {
      console.log('⚠️ 松重豊の画像が見つかりませんでした')
      return
    }

    const imageUrl = `${TMDB_IMAGE_BASE_URL}${matsushige.profile_path}`
    
    // データベース更新
    const { error } = await supabase
      .from('celebrities')
      .update({ image_url: imageUrl })
      .eq('slug', 'matsushige-yutaka')

    if (error) {
      console.error('❌ 画像更新エラー:', error)
    } else {
      console.log('✅ 松重豊の画像を更新しました:', imageUrl)
    }
  }

  // シーズン一覧を取得
  async getSeasons(): Promise<TMDBSeason[]> {
    const series = await this.fetchFromTMDB(`/tv/${KODOKU_NO_GOURMET_ID}`)
    
    if (!series?.seasons) {
      console.log('⚠️ シーズン情報が取得できませんでした')
      return []
    }

    console.log(`📺 ${series.seasons.length}シーズンが見つかりました`)
    return series.seasons.filter((season: TMDBSeason) => season.season_number > 0) // スペシャルを除外
  }

  // エピソード詳細を取得
  async getEpisodes(seasonNumber: number): Promise<TMDBEpisode[]> {
    const season = await this.fetchFromTMDB(`/tv/${KODOKU_NO_GOURMET_ID}/season/${seasonNumber}`)
    
    if (!season?.episodes) {
      console.log(`⚠️ Season ${seasonNumber} のエピソードが取得できませんでした`)
      return []
    }

    return season.episodes
  }

  // エピソードをデータベースに追加
  async addEpisodeToDB(episode: TMDBEpisode): Promise<string | null> {
    const episodeId = randomUUID()
    
    const episodeData = {
      id: episodeId,
      celebrity_id: this.celebrityId,
      title: `孤独のグルメ Season${episode.season_number} 第${episode.episode_number}話「${episode.name}」`,
      date: episode.air_date,
      description: episode.overview || `Season ${episode.season_number} Episode ${episode.episode_number}`,
      video_url: `https://www.tv-tokyo.co.jp/kodokuno_gourmet${episode.season_number}/episode${String(episode.episode_number).padStart(2, '0')}/`,
      thumbnail_url: episode.still_path ? `${TMDB_IMAGE_BASE_URL}${episode.still_path}` : null
    }

    const { error } = await supabase
      .from('episodes')
      .insert([episodeData])

    if (error) {
      console.error(`❌ エピソード追加エラー (S${episode.season_number}E${episode.episode_number}):`, error.message)
      return null
    }

    return episodeId
  }

  // メイン処理
  async importAllData() {
    console.log('🍜 TMDBから孤独のグルメの全データを取得開始...\n')

    try {
      // 1. セレブリティIDを取得
      const { data: celebrity } = await supabase
        .from('celebrities')
        .select('id')
        .eq('slug', 'matsushige-yutaka')
        .single()

      if (!celebrity) {
        throw new Error('松重豊のセレブリティが見つかりません')
      }

      this.celebrityId = celebrity.id
      console.log('✅ 松重豊のID:', this.celebrityId)

      // 2. 松重豊の画像を更新
      await this.updateMatsushigeImage()

      // 3. シーズン一覧を取得
      const seasons = await this.getSeasons()
      
      if (seasons.length === 0) {
        console.log('⚠️ シーズン情報が取得できませんでした')
        return
      }
      
      // 4. 各シーズンのエピソードを処理（全シーズン）
      let totalEpisodes = 0
      let addedEpisodes = 0
      let errorCount = 0

      for (const season of seasons) {
        if (season.season_number === 0) continue // スペシャル除外
        
        console.log(`\n📺 Season ${season.season_number}: ${season.name}`)
        console.log(`   エピソード数: ${season.episode_count}件`)
        
        const episodes = await this.getEpisodes(season.season_number)
        totalEpisodes += episodes.length

        if (episodes.length === 0) {
          console.log(`   ⚠️ エピソードデータが取得できませんでした`)
          continue
        }

        for (const episode of episodes) {
          // 既存チェック
          const { data: existing } = await supabase
            .from('episodes')
            .select('id')
            .eq('celebrity_id', this.celebrityId)
            .like('title', `%Season${episode.season_number}%第${episode.episode_number}話%`)
            .single()

          if (existing) {
            console.log(`   ⏭️ 既存: S${episode.season_number}E${episode.episode_number} - ${episode.name}`)
            continue
          }

          const episodeId = await this.addEpisodeToDB(episode)
          
          if (episodeId) {
            console.log(`   ✅ 追加: S${episode.season_number}E${episode.episode_number} - ${episode.name}`)
            addedEpisodes++
          } else {
            errorCount++
          }

          // APIレート制限対策
          await new Promise(resolve => setTimeout(resolve, 250))
        }

        console.log(`   📊 Season ${season.season_number} 完了: ${episodes.length}件処理`)
        
        // シーズン間でより長い待機
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log('\n🎉 全データ取得完了!')
      console.log('='.repeat(40))
      console.log(`📺 総処理エピソード: ${totalEpisodes}件`)
      console.log(`✅ 新規追加: ${addedEpisodes}件`)
      console.log(`❌ エラー: ${errorCount}件`)
      console.log(`🎯 成功率: ${totalEpisodes > 0 ? Math.round((addedEpisodes / totalEpisodes) * 100) : 0}%`)

      // 最終確認
      const { count: finalCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', this.celebrityId)

      console.log(`\n🏆 松重豊の総エピソード数: ${finalCount}件`)
      
      if (finalCount && finalCount > 100) {
        console.log('🎊 100エピソード超達成！')
        console.log('💰 食べログアフィリエイト収益化の準備完了！')
      }

    } catch (error) {
      console.error('❌ エラーが発生しました:', error)
      console.log('\n🔧 トラブルシューティング:')
      console.log('1. TMDB_API_KEYが正しく設定されているか確認')
      console.log('2. インターネット接続を確認')
      console.log('3. APIレート制限に達していないか確認')
    }
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  const importer = new TMDBKodokuImporter()
  importer.importAllData().catch(console.error)
}

export { TMDBKodokuImporter }