#!/usr/bin/env npx tsx

/**
 * 伊藤かりん（元乃木坂46）データ収集・追加スクリプト
 * 
 * 機能:
 * 1. YouTubeチャンネル情報取得
 * 2. グルメ・食べ歩き動画の抽出
 * 3. セレブリティ登録
 * 4. エピソード登録
 * 5. 食べログ対象店舗の特定
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
// 伊藤かりんのチャンネルURL: https://www.youtube.com/channel/UC9BihA2GY6ATFR__KvRWudA
const CHANNEL_ID = 'UC9BihA2GY6ATFR__KvRWudA'
const CHANNEL_NAME = '伊藤かりん'

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  viewCount: number
  isShorts: boolean
}

interface YouTubeChannel {
  id: string
  title: string
  description: string
  subscriberCount: number
  videoCount: number
  thumbnailUrl: string
}

/**
 * YouTubeチャンネル情報取得
 */
async function fetchChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.error('❌ チャンネルが見つかりません')
      return null
    }
    
    const channel = data.items[0]
    const snippet = channel.snippet
    const statistics = channel.statistics
    
    return {
      id: channel.id,
      title: snippet.title,
      description: snippet.description,
      subscriberCount: parseInt(statistics.subscriberCount || '0'),
      videoCount: parseInt(statistics.videoCount || '0'),
      thumbnailUrl: snippet.thumbnails.high.url
    }
  } catch (error) {
    console.error('❌ チャンネル情報取得エラー:', error)
    return null
  }
}

/**
 * YouTube Duration形式を秒数に変換
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * グルメ関連動画のフィルタリング
 */
function isGourmetVideo(video: YouTubeVideo): boolean {
  const keywords = [
    '食べ', 'グルメ', '築地', 'レストラン', 'カフェ', 'ランチ', 'ディナー',
    '朝食', '夕食', 'スイーツ', 'ケーキ', '料理', '美味しい', 'おいしい',
    'ラーメン', '寿司', '焼肉', '居酒屋', 'バー', 'ビストロ', 'イタリアン',
    'フレンチ', '中華', '和食', '洋食', 'パン', 'ベーカリー', 'デザート'
  ]
  
  const titleLower = video.title.toLowerCase()
  const descLower = video.description.toLowerCase()
  
  return keywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  )
}

/**
 * チャンネルの動画一覧取得（グルメ関連優先）
 */
async function fetchChannelVideos(channelId: string, maxResults: number = 100): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = []
  let pageToken = ''
  let totalProcessed = 0
  
  console.log(`📊 最大${maxResults}本の動画を取得（グルメ関連を優先）`)
  
  try {
    while (videos.length < maxResults) {
      console.log(`  📄 ページ${Math.floor(totalProcessed / 50) + 1}を処理中...`)
      
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${YOUTUBE_API_KEY}${pageToken ? `&pageToken=${pageToken}` : ''}`
      
      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()
      
      if (!searchData.items || searchData.items.length === 0) {
        console.log(`  ⚠️ これ以上の動画が見つかりません`)
        break
      }
      
      // 動画詳細情報を取得
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
      const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
      
      const detailResponse = await fetch(detailUrl)
      const detailData = await detailResponse.json()
      
      let gourmetCount = 0
      let regularCount = 0
      
      for (const video of detailData.items) {
        totalProcessed++
        
        // Shorts判定（60秒以下の動画をShortsとみなす）
        const duration = parseDuration(video.contentDetails.duration)
        const isShorts = duration <= 60
        
        if (!isShorts) {
          const videoData: YouTubeVideo = {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description || '',
            publishedAt: video.snippet.publishedAt,
            thumbnailUrl: video.snippet.thumbnails.high.url,
            duration: video.contentDetails.duration,
            viewCount: parseInt(video.statistics.viewCount || '0'),
            isShorts: false
          }
          
          videos.push(videoData)
          
          if (isGourmetVideo(videoData)) {
            gourmetCount++
            console.log(`    🍽️ グルメ動画: ${videoData.title}`)
          } else {
            regularCount++
          }
        }
        
        if (videos.length >= maxResults) break
      }
      
      console.log(`  📊 バッチ結果: グルメ系 ${gourmetCount}本, その他 ${regularCount}本`)
      
      pageToken = searchData.nextPageToken
      if (!pageToken) {
        console.log(`  ⚠️ 全ての動画を確認しました（合計処理数: ${totalProcessed}本）`)
        break
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  } catch (error) {
    console.error('❌ 動画一覧取得エラー:', error)
  }
  
  // グルメ関連動画を優先してソート
  return videos.sort((a, b) => {
    const aIsGourmet = isGourmetVideo(a) ? 1 : 0
    const bIsGourmet = isGourmetVideo(b) ? 1 : 0
    return bIsGourmet - aIsGourmet
  })
}

/**
 * セレブリティをデータベースに追加
 */
async function addCelebrity(channelInfo: YouTubeChannel): Promise<string> {
  const slug = 'ito-karin'
  
  // まず既存のセレブリティをチェック
  const { data: existing } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', CHANNEL_NAME)
    .single()
  
  if (existing) {
    console.log(`ℹ️ セレブリティは既に存在します: ${CHANNEL_NAME}`)
    return existing.id
  }
  
  // UUIDを生成
  const celebrityId = randomUUID()
  
  const { data, error } = await supabase
    .from('celebrities')
    .insert({
      id: celebrityId,
      name: CHANNEL_NAME,
      slug: slug,
      image_url: channelInfo.thumbnailUrl,
      bio: '元乃木坂46メンバー。2020年5月26日にYouTubeチャンネル「かりんチャンネル」を開設。築地食べ歩きなどグルメ系コンテンツも配信。',
      group_name: '元乃木坂46'
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ セレブリティ追加エラー:', error)
    throw error
  }
  
  console.log(`✅ セレブリティ追加完了: ${CHANNEL_NAME}`)
  return data.id
}

/**
 * エピソードをデータベースに追加
 */
async function addEpisodes(videos: YouTubeVideo[], celebrityId: string): Promise<void> {
  let addedCount = 0
  let skippedCount = 0
  let gourmetCount = 0
  
  for (const video of videos) {
    // 既存エピソードチェック（動画URLで重複確認）
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`
    const { data: existing } = await supabase
      .from('episodes')
      .select('id')
      .eq('video_url', videoUrl)
      .single()
    
    if (existing) {
      skippedCount++
      console.log(`⏭️ スキップ（既存）: ${video.title}`)
      continue
    }
    
    const episodeId = randomUUID()
    
    const { error } = await supabase
      .from('episodes')
      .insert({
        id: episodeId,
        title: video.title,
        description: video.description,
        date: video.publishedAt,
        video_url: videoUrl,
        thumbnail_url: video.thumbnailUrl,
        duration: parseDuration(video.duration),
        view_count: video.viewCount,
        celebrity_id: celebrityId
      })
    
    if (error) {
      console.error(`❌ エピソード追加エラー (${video.title}):`, error)
    } else {
      addedCount++
      if (isGourmetVideo(video)) {
        gourmetCount++
        console.log(`✅ グルメエピソード追加: ${video.title}`)
      } else {
        console.log(`✅ エピソード追加: ${video.title}`)
      }
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  console.log(`🎬 エピソード追加完了: ${addedCount}件追加, ${skippedCount}件スキップ`)
  console.log(`🍽️ グルメ関連エピソード: ${gourmetCount}件`)
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🌟 伊藤かりん（元乃木坂46）データ収集開始')
  console.log('=' .repeat(50))
  
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YouTube API キーが設定されていません')
    return
  }
  
  // 1. チャンネル情報取得
  console.log('📺 チャンネル情報取得中...')
  const channelInfo = await fetchChannelInfo(CHANNEL_ID)
  if (!channelInfo) {
    console.error('❌ チャンネル情報取得失敗')
    return
  }
  
  console.log(`✅ チャンネル情報取得完了:`)
  console.log(`   名前: ${channelInfo.title}`)
  console.log(`   登録者数: ${channelInfo.subscriberCount.toLocaleString()}人`)
  console.log(`   動画数: ${channelInfo.videoCount.toLocaleString()}本`)
  
  // 2. 動画一覧取得（グルメ関連優先）
  console.log('\n🎥 動画一覧取得中（グルメ関連を優先）...')
  const videos = await fetchChannelVideos(CHANNEL_ID, 100)
  console.log(`✅ 取得完了: ${videos.length}本の動画`)
  
  const gourmetVideos = videos.filter(isGourmetVideo)
  console.log(`🍽️ グルメ関連動画: ${gourmetVideos.length}本`)
  
  // 3. セレブリティ追加
  console.log('\n👤 セレブリティ登録中...')
  const celebrityId = await addCelebrity(channelInfo)
  
  // 4. エピソード追加
  console.log('\n📝 エピソード登録中...')
  await addEpisodes(videos, celebrityId)
  
  console.log('\n🎉 伊藤かりんデータ追加完了!')
  console.log('=' .repeat(50))
  console.log(`✅ セレブリティ: 1件`)
  console.log(`✅ エピソード: ${videos.length}件処理`)
  console.log(`🍽️ グルメ関連: ${gourmetVideos.length}件`)
  console.log('\n📊 次のステップ:')
  console.log('- グルメエピソードから具体的な店舗名を抽出')
  console.log('- 築地食べ歩き動画の詳細分析')
  console.log('- 食べログアフィリエイトリンクの追加')
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}