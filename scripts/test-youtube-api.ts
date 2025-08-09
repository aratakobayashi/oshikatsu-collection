/**
 * YouTube API接続テストスクリプト
 * APIキーが正しく動作するかチェック
 */

import { config } from 'dotenv'

// 環境変数を読み込み
config({ path: '.env.production' })

const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

console.log('🔧 YouTube API接続テスト')
console.log('APIキー:', youtubeApiKey ? `${youtubeApiKey.substring(0, 10)}...` : '❌ 未設定')

async function testYouTubeAPI() {
  try {
    // 1. 簡単なAPIテスト（検索API使用）
    console.log('\n🔍 テスト1: 検索API')
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=channel&maxResults=1&key=${youtubeApiKey}`
    
    const searchResponse = await fetch(searchUrl)
    console.log('検索APIレスポンス:', searchResponse.status, searchResponse.statusText)
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.log('エラー詳細:', JSON.stringify(errorData, null, 2))
      return
    }
    
    const searchData = await searchResponse.json()
    console.log('✅ 検索API成功')
    
    // 2. よにのチャンネルテスト
    console.log('\n🔍 テスト2: よにのチャンネル取得')
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=UC2alHD2WkakOiTxCxF-uMAg&key=${youtubeApiKey}`
    
    const channelResponse = await fetch(channelUrl)
    console.log('チャンネルAPIレスポンス:', channelResponse.status, channelResponse.statusText)
    
    if (!channelResponse.ok) {
      const errorData = await channelResponse.json()
      console.log('エラー詳細:', JSON.stringify(errorData, null, 2))
      return
    }
    
    const channelData = await channelResponse.json()
    
    if (!channelData.items || channelData.items.length === 0) {
      console.log('❌ チャンネルが見つかりません')
      return
    }
    
    const channel = channelData.items[0]
    console.log('✅ よにのチャンネル情報取得成功!')
    console.log('チャンネル名:', channel.snippet.title)
    console.log('登録者数:', parseInt(channel.statistics.subscriberCount || '0').toLocaleString())
    console.log('動画数:', channel.statistics.videoCount)
    console.log('総視聴回数:', parseInt(channel.statistics.viewCount || '0').toLocaleString())
    
  } catch (error: any) {
    console.error('❌ テストエラー:', error.message)
  }
}

testYouTubeAPI()