/**
 * Staging環境でのテストデータ収集
 * 少量のデータで動作確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Staging環境変数を読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const channelId = process.env.VITE_YONI_CHANNEL_ID!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStagingCollection() {
  console.log('🧪 Staging環境でテストデータ収集を開始...')
  console.log('📊 環境: Staging (oshikatsu-development)')
  console.log('🎯 目標: 少量データ（1-3件）で動作確認\n')

  try {
    // Step 1: よにのちゃんねる基本情報を取得
    console.log('📺 Step 1: チャンネル基本情報を取得...')
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
    )
    
    if (!channelResponse.ok) {
      throw new Error(`YouTube API Error: ${channelResponse.status}`)
    }

    const channelData = await channelResponse.json()
    const channel = channelData.items?.[0]
    
    if (!channel) {
      throw new Error('チャンネル情報が取得できませんでした')
    }

    console.log(`✅ チャンネル名: ${channel.snippet.title}`)
    console.log(`   登録者数: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}人`)
    console.log(`   総動画数: ${channel.statistics.videoCount}本\n`)

    // Step 2: セレブリティ（よにの）データを保存
    console.log('👤 Step 2: セレブリティデータを保存...')
    const celebrityData = {
      name: channel.snippet.title,
      slug: 'yonino-channel',
      type: 'youtube_channel',
      description: channel.snippet.description?.slice(0, 500),
      image_url: channel.snippet.thumbnails?.high?.url,
      metadata: {
        subscriber_count: parseInt(channel.statistics.subscriberCount),
        video_count: parseInt(channel.statistics.videoCount),
        view_count: parseInt(channel.statistics.viewCount),
        channel_id: channelId
      }
    }

    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .upsert(celebrityData, { onConflict: 'slug' })
      .select()
      .single()

    if (celebrityError) {
      console.warn('⚠️ セレブリティ保存エラー:', celebrityError)
    } else {
      console.log('✅ セレブリティデータ保存成功')
    }

    // Step 3: 最新動画を3件取得
    console.log('\n🎥 Step 3: 最新動画を3件取得...')
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=3&order=date&type=video&key=${youtubeApiKey}`
    )

    if (!videosResponse.ok) {
      throw new Error(`YouTube API Error: ${videosResponse.status}`)
    }

    const videosData = await videosResponse.json()
    const videos = videosData.items || []

    console.log(`📹 ${videos.length}件の動画を取得`)

    // Step 4: 各動画の詳細情報を取得して保存
    console.log('\n💾 Step 4: 動画データを保存...')
    let savedCount = 0
    
    for (const video of videos) {
      const videoId = video.id.videoId
      
      // 動画詳細を取得
      const detailResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`
      )
      
      if (!detailResponse.ok) continue
      
      const detailData = await detailResponse.json()
      const videoDetail = detailData.items?.[0]
      
      if (!videoDetail) continue

      const episodeData = {
        celebrity_id: celebrity?.id,
        title: videoDetail.snippet.title,
        description: videoDetail.snippet.description?.slice(0, 1000),
        date: videoDetail.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: videoDetail.snippet.thumbnails?.high?.url,
        metadata: {
          video_id: videoId,
          duration: videoDetail.contentDetails.duration,
          view_count: parseInt(videoDetail.statistics.viewCount || '0'),
          like_count: parseInt(videoDetail.statistics.likeCount || '0'),
          comment_count: parseInt(videoDetail.statistics.commentCount || '0')
        }
      }

      const { error: episodeError } = await supabase
        .from('episodes')
        .upsert(episodeData, { onConflict: 'video_url' })

      if (!episodeError) {
        savedCount++
        console.log(`   ✅ ${savedCount}. ${videoDetail.snippet.title.slice(0, 50)}...`)
      }
    }

    console.log(`\n📊 保存結果: ${savedCount}/${videos.length}件のエピソードを保存`)

    // Step 5: データ確認
    console.log('\n🔍 Step 5: 保存データを確認...')
    
    const { count: episodeCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
    
    const { count: celebrityCount } = await supabase
      .from('celebrities')
      .select('*', { count: 'exact', head: true })

    console.log('📈 現在のデータ件数:')
    console.log(`   - セレブリティ: ${celebrityCount || 0}件`)
    console.log(`   - エピソード: ${episodeCount || 0}件`)

    console.log('\n✨ テスト収集完了!')
    console.log('🌐 確認URL:')
    console.log('   Staging環境: https://develop--oshikatsu-collection.netlify.app')
    console.log('   （認証: staging123）')

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  testStagingCollection()
    .then(() => {
      console.log('\n🎉 すべてのテストが成功しました！')
      console.log('📝 次のステップ:')
      console.log('   1. Staging環境でデータを確認')
      console.log('   2. 問題なければ中規模収集へ進む')
      console.log('   3. npm run collect:yoni-popular で人気動画を収集')
    })
    .catch(console.error)
}