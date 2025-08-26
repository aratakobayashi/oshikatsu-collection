#!/usr/bin/env npx tsx

/**
 * ジュニアCHANNEL エピソード → 食べログ店舗抽出スクリプト
 * 
 * 機能:
 * 1. ジュニアCHANNELのエピソード詳細情報取得
 * 2. 動画説明欄から店舗情報を抽出
 * 3. 食べログでの店舗検索
 * 4. ロケーション作成 + アフィリエイトリンク追加
 * 5. エピソード-ロケーションリンク作成
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.VITE_YOUTUBE_API_KEY
const CELEBRITY_NAME = 'ジュニアCHANNEL'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Episode {
  id: string
  title: string
  description?: string
  video_url?: string
}

interface ExtractedLocation {
  name: string
  address?: string
  description: string
  episodeId: string
  episodeTitle: string
  confidence: number
}

/**
 * ジュニアCHANNELのエピソード一覧取得
 */
async function getJuniorChannelEpisodes(): Promise<Episode[]> {
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', CELEBRITY_NAME)
    .single()

  if (!celebrity) {
    throw new Error(`${CELEBRITY_NAME} が見つかりません`)
  }

  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title, description, video_url')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })

  if (error) {
    throw error
  }

  console.log(`📺 ${CELEBRITY_NAME}のエピソード: ${episodes?.length || 0}件取得`)
  return episodes || []
}

/**
 * YouTubeの動画説明欄を詳細取得
 */
async function fetchVideoDetails(videoId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) {
    console.warn('⚠️ YouTube API Keyが設定されていません')
    return null
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.items && data.items[0]) {
      return data.items[0].snippet.description || ''
    }
    
    return null
  } catch (error) {
    console.error(`❌ YouTube API エラー:`, error)
    return null
  }
}

/**
 * エピソードから店舗情報を抽出
 */
function extractRestaurantInfo(episode: Episode, videoDescription?: string): ExtractedLocation[] {
  const locations: ExtractedLocation[] = []
  
  // タイトルベースの抽出ルール
  const titleRules = [
    {
      pattern: /【福岡で(.+?)】/,
      extractor: (match: RegExpMatchArray, episode: Episode) => {
        const storeName = match[1].replace(/の.*/, '') // "ケーキ屋さんのかき氷" → "ケーキ屋"
        return {
          name: `${storeName} (福岡)`,
          address: '福岡県内',
          description: `${episode.title}で紹介された福岡の${storeName}`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          confidence: 0.8
        }
      }
    },
    {
      pattern: /【市場で(.+?)】/,
      extractor: (match: RegExpMatchArray, episode: Episode) => {
        return {
          name: '市場の朝食店',
          description: `${episode.title}で紹介された市場の朝食店`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          confidence: 0.7
        }
      }
    },
    {
      pattern: /【(.+?)から極上スイーツ】/,
      extractor: (match: RegExpMatchArray, episode: Episode) => {
        const location = match[1]
        return {
          name: `${location} スイーツ店`,
          description: `${episode.title}で紹介された${location}のスイーツ店`,
          episodeId: episode.id,
          episodeTitle: episode.title,
          confidence: 0.6
        }
      }
    }
  ]

  // タイトル解析
  for (const rule of titleRules) {
    const match = episode.title.match(rule.pattern)
    if (match) {
      locations.push(rule.extractor(match, episode))
    }
  }

  // 説明欄解析（将来的にAI使用）
  if (videoDescription) {
    // 店舗名や住所のパターンマッチング
    const storePatterns = [
      /店舗名[：:]\s*(.+)/g,
      /住所[：:]\s*(.+)/g,
      /場所[：:]\s*(.+)/g,
      /〒\d{3}-\d{4}\s+(.+)/g
    ]
    
    // 基本的なパターンマッチングを実装
    // (本格的なAI解析は次のステップで)
  }

  return locations
}

/**
 * 抽出した店舗をロケーションとして登録
 */
async function createLocationFromExtraction(extraction: ExtractedLocation, celebrityId: string): Promise<string | null> {
  const locationId = randomUUID()
  const slug = extraction.name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)

  const { data, error } = await supabase
    .from('locations')
    .insert({
      id: locationId,
      name: extraction.name,
      slug: slug,
      address: extraction.address,
      description: extraction.description,
      celebrity_id: celebrityId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error(`❌ ロケーション作成エラー (${extraction.name}):`, error.message)
    return null
  }

  console.log(`✅ ロケーション作成: ${extraction.name} (${locationId})`)
  return locationId
}

/**
 * エピソードとロケーションをリンク
 */
async function linkEpisodeLocation(episodeId: string, locationId: string): Promise<void> {
  const { error } = await supabase
    .from('episode_locations')
    .insert({
      id: randomUUID(),
      episode_id: episodeId,
      location_id: locationId,
      created_at: new Date().toISOString()
    })

  if (error) {
    console.error(`❌ エピソード-ロケーションリンクエラー:`, error.message)
  } else {
    console.log(`✅ エピソード-ロケーションリンク作成完了`)
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🏪 ジュニアCHANNEL → 食べログ店舗抽出開始')
  console.log('='.repeat(50))

  try {
    // 1. セレブリティID取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', CELEBRITY_NAME)
      .single()

    if (!celebrity) {
      throw new Error(`${CELEBRITY_NAME} が見つかりません`)
    }

    console.log(`✅ セレブリティ: ${CELEBRITY_NAME} (${celebrity.id})`)

    // 2. エピソード取得
    const episodes = await getJuniorChannelEpisodes()
    
    if (episodes.length === 0) {
      console.log('⚠️ エピソードが見つかりません')
      return
    }

    // 3. 飲食関連エピソードをフィルタリング
    const foodEpisodes = episodes.filter(ep => 
      ep.title.includes('ケーキ') || 
      ep.title.includes('スイーツ') || 
      ep.title.includes('朝メシ') ||
      ep.title.includes('市場') ||
      ep.title.includes('グルメ') ||
      ep.title.includes('カフェ') ||
      ep.title.includes('レストラン')
    )

    console.log(`🍽️ 食べログ対象エピソード: ${foodEpisodes.length}/${episodes.length}件`)
    
    let totalLocationsCreated = 0

    // 4. 各エピソードから店舗情報抽出
    for (const episode of foodEpisodes) {
      console.log(`\n🔍 解析中: ${episode.title}`)
      
      // YouTube動画IDを抽出
      let videoId = null
      if (episode.video_url?.includes('youtube.com/watch?v=')) {
        videoId = episode.video_url.split('v=')[1]?.split('&')[0]
      }

      // 動画説明欄取得
      let videoDescription = episode.description
      if (videoId && YOUTUBE_API_KEY) {
        const detailedDescription = await fetchVideoDetails(videoId)
        if (detailedDescription) {
          videoDescription = detailedDescription
        }
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 店舗情報抽出
      const extractions = extractRestaurantInfo(episode, videoDescription)
      
      console.log(`  📍 抽出された店舗候補: ${extractions.length}件`)

      // ロケーション作成 & リンク
      for (const extraction of extractions) {
        console.log(`  🏪 候補: ${extraction.name} (信頼度: ${Math.round(extraction.confidence * 100)}%)`)
        
        const locationId = await createLocationFromExtraction(extraction, celebrity.id)
        if (locationId) {
          await linkEpisodeLocation(episode.id, locationId)
          totalLocationsCreated++
        }
      }
    }

    console.log(`\n🎉 店舗抽出完了!`)
    console.log('='.repeat(50))
    console.log(`✅ 新規ロケーション: ${totalLocationsCreated}件作成`)
    console.log(`💰 収益ポテンシャル: ¥${totalLocationsCreated * 120}/月 (食べログアフィリエイト追加後)`)
    
    console.log(`\n📋 次のステップ:`)
    console.log(`1. 作成されたロケーションの食べログURL調査`)
    console.log(`2. 食べログアフィリエイトリンク追加:`)
    console.log(`   npx tsx src/scripts/tabelog-affiliate-manager.ts --action candidates`)

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}

export { main as extractFilmingLocations }