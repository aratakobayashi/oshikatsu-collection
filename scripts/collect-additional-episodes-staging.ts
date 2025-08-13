/**
 * ステージング環境に追加エピソードデータを収集
 * 既存の344件に加えて、さらに200件を目標に収集
 */

import { config } from 'dotenv'
import { YouTubeDataCollector, YONI_CHANNEL_CONFIG } from './youtube-data-collector'
import { createClient } from '@supabase/supabase-js'

// ステージング環境変数を読み込み
config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

// 収集する追加エピソード数
const ADDITIONAL_EPISODES = 200
const BATCH_SIZE = 50 // APIの制限に合わせてバッチサイズを設定

if (!supabaseUrl || !supabaseKey || !youtubeApiKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// API呼び出し間隔（レート制限対策）
async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// エピソードからロケーション情報を抽出
function extractLocationsFromDescription(description: string): string[] {
  const locations: string[] = []
  
  // よくある店舗名パターン
  const storePatterns = [
    /スターバックス[^、。\s]*/g,
    /スタバ[^、。\s]*/g,
    /マクドナルド[^、。\s]*/g,
    /マック[^、。\s]*/g,
    /ローソン[^、。\s]*/g,
    /セブンイレブン[^、。\s]*/g,
    /ファミリーマート[^、。\s]*/g,
    /ファミマ[^、。\s]*/g,
    /すき家[^、。\s]*/g,
    /吉野家[^、。\s]*/g,
    /松屋[^、。\s]*/g,
    /ガスト[^、。\s]*/g,
    /サイゼリヤ[^、。\s]*/g,
    /ココス[^、。\s]*/g,
    /びっくりドンキー[^、。\s]*/g,
    /焼肉ライク[^、。\s]*/g,
    /スシロー[^、。\s]*/g,
    /くら寿司[^、。\s]*/g,
    /はま寿司[^、。\s]*/g,
    /富士そば[^、。\s]*/g,
    /日高屋[^、。\s]*/g,
    /CoCo壱番屋[^、。\s]*/g,
    /ココイチ[^、。\s]*/g
  ]
  
  // 地名・施設パターン
  const placePatterns = [
    /([^、。\s]+)(駅|空港|港|ターミナル)/g,
    /([^、。\s]+)(店|ホテル|旅館|温泉|公園|神社|寺|ビル)/g,
    /(東京|大阪|京都|横浜|名古屋|札幌|福岡|神戸|仙台|広島)[^、。\s]*/g,
    /(渋谷|新宿|原宿|池袋|上野|秋葉原|銀座|六本木|浅草|品川)[^、。\s]*/g
  ]
  
  // パターンマッチング
  const allPatterns = storePatterns.concat(placePatterns)
  allPatterns.forEach(pattern => {
    const matches = description.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length > 2 && match.length < 30) {
          locations.push(match)
        }
      })
    }
  })
  
  // 重複を除去
  return [...new Set(locations)]
}

async function collectAdditionalEpisodes() {
  console.log('🎬 追加エピソードデータ収集開始')
  console.log(`📊 目標: ${ADDITIONAL_EPISODES}件の新規エピソード`)
  console.log('')
  
  try {
    // 既存のエピソードIDを取得
    console.log('📡 既存エピソードを確認中...')
    const { data: existingEpisodes, error: fetchError } = await supabase
      .from('episodes')
      .select('id')
    
    if (fetchError) {
      throw new Error(`既存エピソード取得エラー: ${fetchError.message}`)
    }
    
    const existingIds = new Set(existingEpisodes?.map(ep => ep.id) || [])
    console.log(`✅ 既存エピソード: ${existingIds.size}件`)
    
    // YouTube Data Collectorを初期化
    const collector = new YouTubeDataCollector(youtubeApiKey)
    
    // チャンネルの動画リストを取得（最大500件）
    console.log('🔍 YouTubeから動画リストを取得中...')
    const videos = await collector.getChannelVideos(YONI_CHANNEL_CONFIG.channelId, 500)
    
    // 新規エピソードのみフィルタリング
    const newVideos = videos.filter(video => !existingIds.has(video.id))
    console.log(`📺 新規エピソード候補: ${newVideos.length}件`)
    
    if (newVideos.length === 0) {
      console.log('⚠️ 新規エピソードが見つかりませんでした')
      return
    }
    
    // 収集する件数を決定
    const videosToCollect = newVideos.slice(0, ADDITIONAL_EPISODES)
    console.log(`🎯 収集対象: ${videosToCollect.length}件`)
    
    let successCount = 0
    let locationCount = 0
    const collectedLocations = new Set<string>()
    
    // バッチ処理で保存
    for (let i = 0; i < videosToCollect.length; i += BATCH_SIZE) {
      const batch = videosToCollect.slice(i, i + BATCH_SIZE)
      console.log(`\n📦 バッチ ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(videosToCollect.length/BATCH_SIZE)} 処理中...`)
      
      const episodeData = batch.map(video => ({
        id: video.id,
        title: video.title || 'タイトル未設定',
        description: video.description || '',
        video_url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail_url: video.thumbnail || '',
        date: video.publishedAt || new Date().toISOString(), // dateがnullの場合は現在時刻
        view_count: video.viewCount || 0,
        like_count: video.likeCount || 0,
        comment_count: video.commentCount || 0
        // celebrity_idはUUID型のため省略（NULLでOK）
      }))
      
      // エピソードを保存
      const { data: savedEpisodes, error: insertError } = await supabase
        .from('episodes')
        .insert(episodeData)
        .select()
      
      if (insertError) {
        console.error(`   ❌ バッチ保存エラー: ${insertError.message}`)
        continue
      }
      
      successCount += savedEpisodes?.length || 0
      
      // ロケーション情報を抽出して関連付け
      for (const episode of savedEpisodes || []) {
        if (episode.description) {
          const locations = extractLocationsFromDescription(episode.description)
          locations.forEach(loc => collectedLocations.add(loc))
          locationCount += locations.length
          
          if (locations.length > 0) {
            console.log(`   📍 ${episode.title.substring(0, 30)}... → ${locations.length}件のロケーション候補`)
          }
        }
      }
      
      // レート制限対策
      await delay(2000)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ 追加データ収集完了')
    console.log('='.repeat(60))
    console.log(`📺 新規エピソード: ${successCount}件`)
    console.log(`📍 抽出されたロケーション候補: ${collectedLocations.size}種類（延べ${locationCount}件）`)
    console.log(`📊 現在の総エピソード数: ${existingIds.size + successCount}件`)
    
    // 抽出されたロケーション候補を表示
    if (collectedLocations.size > 0) {
      console.log('\n🏢 頻出ロケーション候補（上位10件）:')
      const locationArray = Array.from(collectedLocations)
      locationArray.slice(0, 10).forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc}`)
      })
    }
    
    console.log('\n🎯 次のステップ:')
    console.log('   1. ロケーション情報の住所補完')
    console.log('   2. アイテム情報の構造化収集')
    console.log('   3. エピソード-ロケーション関連付けの強化')
    console.log('   4. データ品質の最終確認')
    
  } catch (error: any) {
    console.error('❌ エラー発生:', error.message)
    process.exit(1)
  }
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  collectAdditionalEpisodes().catch(console.error)
}