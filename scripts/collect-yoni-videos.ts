/**
 * よにのチャンネル動画データ収集スクリプト
 * YouTube APIから動画情報を取得してSupabaseに保存
 */

import { config } from 'dotenv'
import { YouTubeDataCollector, YONI_CHANNEL_CONFIG } from './youtube-data-collector'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

// コマンドライン引数から最大取得数を指定
const maxResults = parseInt(process.argv[2]) || 50

console.log('🎬 よにのチャンネル動画データ収集開始')
console.log(`📊 最大取得数: ${maxResults}本`)

if (!supabaseUrl || !supabaseKey || !youtubeApiKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 5秒間隔でAPIリクエストを実行（レート制限対策）
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  try {
    console.log('📡 Supabase接続テスト...')
    const { error: connectionError } = await supabase.from('episodes').select('count').limit(1)
    if (connectionError) {
      throw new Error(`Supabase接続エラー: ${connectionError.message}`)
    }
    console.log('✅ Supabase接続成功')

    console.log('🔍 チャンネル情報を確認中...')
    const { data: channel, error: channelError } = await supabase
      .from('celebrities')
      .select('id')
      .eq('id', YONI_CHANNEL_CONFIG.channelId)
      .single()
    
    if (channelError || !channel) {
      console.error('❌ チャンネル情報が見つかりません')
      console.error('  先に npm run collect:yoni-basic を実行してください')
      process.exit(1)
    }
    console.log('✅ チャンネル情報確認済み')

    console.log('🎥 動画データを取得中...')
    const collector = new YouTubeDataCollector(youtubeApiKey)
    
    const videos = await collector.getChannelVideos(YONI_CHANNEL_CONFIG.channelId, maxResults)
    console.log(`📹 取得完了: ${videos.length}本の動画`)
    
    console.log('💾 Supabaseに保存中...')
    let savedCount = 0
    let skippedCount = 0
    
    for (const video of videos) {
      try {
        // 既存動画チェック
        const { data: existing } = await supabase
          .from('episodes')
          .select('id')
          .eq('id', video.id)
          .single()
        
        if (existing) {
          console.log(`⏭️  スキップ: ${video.title} (既に存在)`)
          skippedCount++
          continue
        }
        
        // 動画データ保存
        const { error: insertError } = await supabase
          .from('episodes')
          .insert({
            id: video.id,
            title: video.title,
            description: video.description,
            date: video.published_at,
            duration: video.duration,
            thumbnail_url: video.thumbnail,
            video_url: video.video_url,
            view_count: video.view_count,
            like_count: video.like_count,
            comment_count: video.comment_count,
            celebrity_id: video.celebrity_id
          })
        
        if (insertError) {
          console.error(`❌ 保存エラー (${video.title}):`, insertError.message)
          continue
        }
        
        console.log(`✅ 保存完了: ${video.title}`)
        savedCount++
        
        // レート制限対策: 1秒待機
        await delay(1000)
        
      } catch (error: any) {
        console.error(`❌ エラー (${video.title}):`, error.message)
      }
    }
    
    console.log('')
    console.log('🎉 動画データ収集完了!')
    console.log(`📊 結果:`)
    console.log(`  新規保存: ${savedCount}本`)
    console.log(`  スキップ: ${skippedCount}本`)
    console.log(`  合計処理: ${videos.length}本`)
    
    if (savedCount > 0) {
      console.log('')
      console.log('次のステップ:')
      console.log('  npm run collect:yoni-popular  # 人気動画を特定')
      console.log('  npm run validate:production-data  # データ品質チェック')
    }
    
  } catch (error: any) {
    console.error('❌ エラー発生:', error.message)
    if (error.message.includes('quota')) {
      console.error('💡 YouTube API使用量制限に達した可能性があります')
      console.error('   翌日再実行するか、別のAPIキーを使用してください')
    }
    process.exit(1)
  }
}

main()