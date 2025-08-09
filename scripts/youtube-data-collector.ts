/**
 * よにのチャンネル本番データ収集システム
 * 安全で効率的なYouTube Data API活用
 */

// よにのチャンネル情報
export const YONI_CHANNEL_CONFIG = {
  channelId: 'UC2alHD2WkakOiTxCxF-uMAg',
  channelUrl: 'https://www.youtube.com/channel/UC2alHD2WkakOiTxCxF-uMAg',
  name: 'よにのチャンネル',
  type: 'youtube_channel' as const,
  // 実際のデータは収集後に設定
  estimatedSubscribers: null,
  estimatedVideoCount: null
}

// YouTube Data API クライアント設定
export class YouTubeDataCollector {
  private apiKey: string
  private baseUrl = 'https://www.googleapis.com/youtube/v3'
  
  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // チャンネル基本情報取得
  async getChannelInfo(channelId: string) {
    console.log(`🔍 チャンネル情報取得中: ${channelId}`)
    
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`
      )
      
      if (!response.ok) {
        throw new Error(`YouTube API Error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.items || data.items.length === 0) {
        throw new Error('チャンネルが見つかりません')
      }
      
      const channel = data.items[0]
      const result = {
        id: channelId,
        name: channel.snippet.title,
        slug: this.createSlug(channel.snippet.title),
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high?.url,
        subscriber_count: parseInt(channel.statistics.subscriberCount || '0'),
        video_count: parseInt(channel.statistics.videoCount || '0'),
        view_count: parseInt(channel.statistics.viewCount || '0'),
        published_at: channel.snippet.publishedAt,
        type: 'youtube_channel' as const,
        status: 'active' as const
      }
      
      console.log('✅ チャンネル情報取得完了:', result.name)
      return result
      
    } catch (error) {
      console.error('❌ チャンネル情報取得エラー:', error)
      throw error
    }
  }

  // チャンネルの動画リスト取得
  async getChannelVideos(channelId: string, maxResults: number = 50) {
    console.log(`🎬 動画リスト取得中: ${maxResults}件`)
    
    try {
      // 1. チャンネルのアップロードプレイリストIDを取得
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=contentDetails&id=${channelId}&key=${this.apiKey}`
      )
      
      if (!channelResponse.ok) {
        throw new Error(`YouTube API Error: ${channelResponse.status}`)
      }
      
      const channelData = await channelResponse.json()
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads
      
      // 2. アップロードプレイリストから動画リストを取得
      const videosResponse = await fetch(
        `${this.baseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${this.apiKey}`
      )
      
      if (!videosResponse.ok) {
        throw new Error(`YouTube API Error: ${videosResponse.status}`)
      }
      
      const videosData = await videosResponse.json()
      
      // 3. 動画詳細情報を取得
      const videoIds = videosData.items.map((item: any) => item.snippet.resourceId.videoId).join(',')
      const detailsResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.apiKey}`
      )
      
      const detailsData = await detailsResponse.json()
      
      const videos = detailsData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        published_at: video.snippet.publishedAt,
        duration: this.parseDuration(video.contentDetails.duration),
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
        comment_count: parseInt(video.statistics.commentCount || '0'),
        thumbnail: video.snippet.thumbnails.high?.url,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        celebrity_id: channelId // よにのチャンネルID
      }))
      
      console.log(`✅ 動画リスト取得完了: ${videos.length}件`)
      return videos
      
    } catch (error) {
      console.error('❌ 動画リスト取得エラー:', error)
      throw error
    }
  }

  // ISO 8601 duration を秒数に変換
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return 0
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0') 
    const seconds = parseInt(match[3] || '0')
    
    return hours * 3600 + minutes * 60 + seconds
  }

  // スラッグ作成
  private createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }
}

// データ収集実行関数
export async function collectYoniChannelData() {
  console.log('🚀 よにのチャンネルデータ収集開始')
  
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY
  if (!apiKey) {
    throw new Error('YouTube API キーが設定されていません')
  }
  
  const collector = new YouTubeDataCollector(apiKey)
  
  try {
    // 1. チャンネル基本情報
    const channelInfo = await collector.getChannelInfo(YONI_CHANNEL_CONFIG.channelId)
    
    // 2. 動画リスト（最新50件から開始）
    const videos = await collector.getChannelVideos(YONI_CHANNEL_CONFIG.channelId, 50)
    
    // 3. 人気動画トップ10を特定
    const popularVideos = videos
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, 10)
    
    console.log('🎉 データ収集完了')
    console.log(`📺 チャンネル: ${channelInfo.name}`)
    console.log(`👥 登録者数: ${channelInfo.subscriber_count?.toLocaleString()}人`)
    console.log(`🎬 動画数: ${videos.length}件`)
    console.log(`⭐ 人気動画: ${popularVideos[0]?.title}`)
    
    return {
      channel: channelInfo,
      videos,
      popularVideos,
      summary: {
        totalVideos: videos.length,
        totalViews: videos.reduce((sum, v) => sum + v.view_count, 0),
        avgViews: Math.round(videos.reduce((sum, v) => sum + v.view_count, 0) / videos.length)
      }
    }
    
  } catch (error) {
    console.error('❌ データ収集失敗:', error)
    throw error
  }
}

// バッチ処理用の安全な実行間隔
export const API_RATE_LIMIT = {
  requestsPerSecond: 1, // 1秒に1リクエスト
  maxConcurrentRequests: 1, // 同時リクエスト数制限
  retryAttempts: 3, // リトライ回数
  retryDelay: 2000 // リトライ間隔（ミリ秒）
}

export default YouTubeDataCollector