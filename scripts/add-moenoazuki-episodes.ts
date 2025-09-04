import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// ES Modules対応
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 環境変数読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function addMoenoazukiEpisodes() {
  console.log('🍎 もえのあずきのYouTube動画をエピソードとして追加中...\n')

  try {
    // 1. もえのあずきの情報を取得
    console.log('🔍 もえのあずきの情報を取得中...')
    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .select('*')
      .eq('slug', 'moenoazuki')
      .single()

    if (celebrityError || !celebrity) {
      throw new Error(`もえのあずきが見つかりません: ${celebrityError?.message}`)
    }

    console.log(`✅ セレブリティ確認: ${celebrity.name} (ID: ${celebrity.id})`)
    console.log('')

    // 2. YouTube APIで特定の動画情報を取得（デカ盛りチャレンジ関連）
    console.log('📺 YouTube APIで動画情報を取得中...')
    
    // もえのあずきのチャンネルIDで特定の動画を検索
    const channelId = 'UCepkcGa3-DVdNHcHGwEkXTg'
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&q=大食い OR チャレンジ OR 店舗 OR レストラン&order=date&maxResults=10&key=${youtubeApiKey}`
    
    const response = await fetch(searchUrl)
    if (!response.ok) {
      throw new Error(`YouTube API エラー: ${response.status}`)
    }

    const searchData = await response.json()
    const videoIds = searchData.items.map((item: any) => item.id.videoId)
    
    console.log(`🎥 ${videoIds.length}本の候補動画を発見`)

    // 3. 動画詳細情報を取得
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(',')}&key=${youtubeApiKey}`
    const videosResponse = await fetch(videosUrl)
    const videosData = await videosResponse.json()

    console.log('📊 動画詳細情報を取得完了')
    console.log('')

    // 4. エピソードデータを準備（ロケ地関連の動画を優先選択）
    const episodes = []
    
    for (const video of videosData.items.slice(0, 3)) { // 最初の3本を追加
      // 動画時間をパース（PT15M33S -> 933秒）
      const duration = parseDuration(video.contentDetails.duration)
      
      episodes.push({
        id: video.id, // YouTube動画ID
        title: video.snippet.title,
        description: video.snippet.description || '',
        date: new Date(video.snippet.publishedAt).toISOString(),
        duration: duration,
        thumbnail_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        view_count: parseInt(video.statistics.viewCount || '0'),
        like_count: parseInt(video.statistics.likeCount || '0'),
        comment_count: parseInt(video.statistics.commentCount || '0'),
        celebrity_id: celebrity.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }

    console.log('📝 追加予定のエピソード:')
    episodes.forEach((ep, i) => {
      console.log(`   ${i + 1}. ${ep.title}`)
      console.log(`      公開日: ${new Date(ep.date).toLocaleDateString('ja-JP')}`)
      console.log(`      視聴回数: ${ep.view_count.toLocaleString()}`)
      console.log(`      時間: ${Math.floor(ep.duration / 60)}分${ep.duration % 60}秒`)
      console.log(`      動画URL: ${ep.video_url}`)
      console.log('')
    })

    // 5. エピソードをデータベースに挿入
    console.log('💾 エピソードをデータベースに挿入中...')
    
    for (const episode of episodes) {
      console.log(`   追加中: ${episode.title}`)
      
      const { error: episodeError } = await supabase
        .from('episodes')
        .insert(episode)

      if (episodeError) {
        if (episodeError.code === '23505') { // 重複キー
          console.log(`   ⚠️ スキップ（既存）: ${episode.title}`)
        } else {
          console.error(`   ❌ エラー: ${episodeError.message}`)
        }
      } else {
        console.log(`   ✅ 追加完了: ${episode.title}`)
      }
    }

    console.log('')
    console.log('🎉 もえのあずきエピソード追加完了!')
    console.log('')
    console.log('📊 追加結果:')
    console.log(`   セレブリティ: ${celebrity.name}`)
    console.log(`   追加エピソード: ${episodes.length}本`)
    console.log('')
    console.log('🚀 次のステップ:')
    console.log('1. ロケ地との関連付け設定 (episode_locations)')
    console.log('2. 特定の店舗（幸福麺処もっちりやなど）との関連付け')
    console.log('3. 他の大食い動画の追加')

  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    throw error
  }
}

// YouTube動画の時間文字列をパース（PT15M33S -> 933秒）
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addMoenoazukiEpisodes()
    .then(() => {
      console.log('\n✅ 実行完了!')
    })
    .catch((error) => {
      console.error('❌ 実行エラー:', error.message)
      process.exit(1)
    })
}

export { addMoenoazukiEpisodes }