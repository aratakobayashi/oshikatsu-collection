#!/usr/bin/env npx tsx

/**
 * ジュニアCHANNELデータ収集・追加スクリプト
 * 
 * 機能:
 * 1. YouTubeチャンネル情報取得
 * 2. Shorts以外の動画一覧取得
 * 3. セレブリティ登録
 * 4. エピソード登録
 * 5. AI解析によるロケーション・アイテム抽出
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
const CHANNEL_ID = 'UC1cHlPIE-kqiPvpyYz2O8rQ'
const CHANNEL_NAME = 'ジュニアCHANNEL'

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
 * チャンネルの動画一覧取得（Shorts除外）
 */
async function fetchChannelVideos(channelId: string, maxResults: number = 500): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = []
  let pageToken = ''
  let totalProcessed = 0
  
  console.log(`📊 目標: ${maxResults}本の通常動画を取得`)
  
  try {
    while (videos.length < maxResults) {
      console.log(`  📄 ページ${Math.floor(totalProcessed / 50) + 1}を処理中... (現在の通常動画: ${videos.length}本)`)
      
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
      
      let shortsInThisBatch = 0
      let regularInThisBatch = 0
      
      for (const video of detailData.items) {
        totalProcessed++
        
        // Shorts判定（60秒以下の動画をShortsとみなす）
        const duration = parseDuration(video.contentDetails.duration)
        const isShorts = duration <= 60
        
        if (isShorts) {
          shortsInThisBatch++
        } else {
          regularInThisBatch++
          videos.push({
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description || '',
            publishedAt: video.snippet.publishedAt,
            thumbnailUrl: video.snippet.thumbnails.high.url,
            duration: video.contentDetails.duration,
            viewCount: parseInt(video.statistics.viewCount || '0'),
            isShorts: false
          })
        }
        
        if (videos.length >= maxResults) break
      }
      
      console.log(`  📊 バッチ結果: 通常動画 ${regularInThisBatch}本, Shorts ${shortsInThisBatch}本`)
      
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
  
  return videos.slice(0, maxResults)
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
 * セレブリティをデータベースに追加
 */
async function addCelebrity(channelInfo: YouTubeChannel): Promise<string> {
  const slug = channelInfo.title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
  
  // まず既存のセレブリティをチェック
  const { data: existing } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', channelInfo.title)
    .single()
  
  if (existing) {
    console.log(`ℹ️ セレブリティは既に存在します: ${channelInfo.title}`)
    return existing.id
  }
  
  // UUIDを生成
  const celebrityId = randomUUID()
  
  const { data, error } = await supabase
    .from('celebrities')
    .insert({
      id: celebrityId,
      name: channelInfo.title,
      slug: slug,
      image_url: channelInfo.thumbnailUrl
    })
    .select()
    .single()
  
  if (error) {
    console.error('❌ セレブリティ追加エラー:', error)
    throw error
  }
  
  console.log(`✅ セレブリティ追加完了: ${channelInfo.title}`)
  return data.id
}

/**
 * エピソードをデータベースに追加
 */
async function addEpisodes(videos: YouTubeVideo[], celebrityId: string): Promise<void> {
  let addedCount = 0
  let skippedCount = 0
  
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
    const slug = `${video.id}-${video.title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)}`
    
    const episodeId = randomUUID()
    
    const { error } = await supabase
      .from('episodes')
      .insert({
        id: episodeId,
        title: video.title,
        description: video.description,
        date: video.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail_url: video.thumbnailUrl,
        duration: parseDuration(video.duration),
        view_count: video.viewCount,
        celebrity_id: celebrityId
      })
    
    if (error) {
      console.error(`❌ エピソード追加エラー (${video.title}):`, error)
    } else {
      addedCount++
      console.log(`✅ エピソード追加: ${video.title}`)
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  
  console.log(`🎬 エピソード追加完了: ${addedCount}件追加, ${skippedCount}件スキップ, 合計${videos.length}件処理`)
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🎬 ジュニアCHANNELデータ収集開始')
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
  
  // 2. 動画一覧取得（Shorts除外）
  console.log('\n🎥 動画一覧取得中（Shorts除外）...')
  console.log('📺 全ての通常動画を取得します（時間がかかる場合があります）')
  const videos = await fetchChannelVideos(CHANNEL_ID, 500)
  console.log(`✅ 取得完了: ${videos.length}本の通常動画`)
  
  // 3. セレブリティ追加
  console.log('\n👤 セレブリティ登録中...')
  const celebrityId = await addCelebrity(channelInfo)
  
  // 4. エピソード追加
  console.log('\n📝 エピソード登録中...')
  await addEpisodes(videos, celebrityId)
  
  console.log('\n🎉 ジュニアCHANNEL全動画データ追加完了!')
  console.log('=' .repeat(50))
  console.log(`✅ セレブリティ: 1件`)
  console.log(`✅ 新規エピソード: ${videos.length}件処理`)
  console.log('\n📊 次のステップ:')
  console.log('- 拡張されたエピソードリストから食べログ対象店舗の特定')
  console.log('- 高価値エピソード（グルメ・レストラン系）の優先分析')
  console.log('- 手動レビューによる正確な店舗情報収集')
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}