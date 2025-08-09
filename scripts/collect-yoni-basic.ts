/**
 * よにのチャンネル基本情報収集スクリプト
 * 最初に実行して、チャンネルの基本情報をSupabaseに保存
 */

import { config } from 'dotenv'
import { YouTubeDataCollector, YONI_CHANNEL_CONFIG } from './youtube-data-collector'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

console.log('🚀 よにのチャンネル基本情報収集開始')
console.log('📋 設定確認:')
console.log('  Supabase URL:', supabaseUrl ? '✅ 設定済み' : '❌ 未設定')
console.log('  Supabase Key:', supabaseKey ? '✅ 設定済み' : '❌ 未設定')
console.log('  YouTube API Key:', youtubeApiKey ? '✅ 設定済み' : '❌ 未設定')

if (!supabaseUrl || !supabaseKey || !youtubeApiKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  console.error('  .env.production ファイルを確認してください')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  try {
    console.log('📡 Supabase接続テスト...')
    const { error: connectionError } = await supabase.from('celebrities').select('count').limit(1)
    if (connectionError) {
      throw new Error(`Supabase接続エラー: ${connectionError.message}`)
    }
    console.log('✅ Supabase接続成功')

    console.log('🔍 よにのチャンネル情報を取得中...')
    const collector = new YouTubeDataCollector(youtubeApiKey)
    
    const channelInfo = await collector.getChannelInfo(YONI_CHANNEL_CONFIG.channelId)
    console.log('📺 チャンネル情報:')
    console.log(`  名前: ${channelInfo.name}`)
    console.log(`  登録者数: ${channelInfo.subscriber_count?.toLocaleString()}人`)
    console.log(`  動画数: ${channelInfo.video_count}本`)
    console.log(`  総視聴回数: ${channelInfo.view_count?.toLocaleString()}回`)
    
    console.log('💾 Supabaseに保存中...')
    const { data: savedChannel, error: insertError } = await supabase
      .from('celebrities')
      .insert({
        id: channelInfo.id,
        name: channelInfo.name,
        slug: channelInfo.slug,
        bio: channelInfo.description,
        image_url: channelInfo.thumbnail,
        subscriber_count: channelInfo.subscriber_count,
        video_count: channelInfo.video_count,
        view_count: channelInfo.view_count,
        published_at: channelInfo.published_at,
        type: channelInfo.type,
        status: channelInfo.status
      })
      .select()
      .single()
    
    if (insertError) {
      throw new Error(`データベース保存エラー: ${insertError.message}`)
    }
    
    console.log('✅ チャンネル情報保存完了')
    console.log('🎉 基本情報収集完了!')
    console.log('')
    console.log('次のステップ:')
    console.log('  npm run collect:yoni-videos  # 動画データを収集')
    
  } catch (error: any) {
    console.error('❌ エラー発生:', error.message)
    process.exit(1)
  }
}

main()