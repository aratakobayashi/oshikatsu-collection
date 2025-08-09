/**
 * 簡易データ確認スクリプト
 */

import * as dotenv from 'dotenv'

// 本番環境変数を読み込み
dotenv.config({ path: '.env.production' })

async function quickDataCheck() {
  console.log('🔍 データ収集スクリプトの動作確認...')
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY
  const channelId = process.env.VITE_YONI_CHANNEL_ID
  
  console.log('\n📋 設定確認:')
  console.log(`Supabase URL: ${supabaseUrl ? '✅ 設定済み' : '❌ 未設定'}`)
  console.log(`YouTube API Key: ${youtubeApiKey ? '✅ 設定済み' : '❌ 未設定'}`)
  console.log(`Channel ID: ${channelId ? '✅ 設定済み' : '❌ 未設定'}`)
  
  // YouTube APIテスト
  if (youtubeApiKey && channelId) {
    try {
      console.log('\n🎥 YouTube APIテスト...')
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      )
      
      if (response.ok) {
        const data = await response.json()
        const channel = data.items?.[0]
        if (channel) {
          console.log('✅ YouTube API接続成功!')
          console.log(`   チャンネル名: ${channel.snippet.title}`)
          console.log(`   動画数: ${channel.statistics.videoCount}`)
          console.log(`   登録者数: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}人`)
        }
      } else {
        console.log('❌ YouTube API接続失敗:', response.status)
      }
    } catch (error) {
      console.log('❌ YouTube APIエラー:', error)
    }
  }
  
  // 既存の収集スクリプトの確認
  console.log('\n📜 利用可能なデータ収集スクリプト:')
  const scripts = [
    'collect:yoni-basic - よにの基本データ収集',
    'collect:yoni-videos - 動画データ収集', 
    'collect:yoni-popular - 人気動画収集',
    'collect:yoni-all - 全データ収集'
  ]
  
  scripts.forEach(script => console.log(`   📄 ${script}`))
  
  console.log('\n🎯 推奨次ステップ:')
  console.log('1. npm run collect:yoni-basic でよにのちゃんねる基本情報を収集')
  console.log('2. npm run collect:yoni-popular で人気動画から開始')
  console.log('3. データ確認後、全体収集を実行')
}

quickDataCheck().catch(console.error)