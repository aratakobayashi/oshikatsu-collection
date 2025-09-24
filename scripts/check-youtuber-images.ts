/**
 * YouTuberの画像状況詳細チェック
 * プロフィール画像とエピソードのサムネイル画像を確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const TARGET_YOUTUBERS = ['水溜りボンド', 'フワちゃん', 'QuizKnock', 'ヒカル', '中田敦彦']

async function checkYouTuberImages() {
  console.log('🖼️ YouTuber画像状況詳細チェック')
  console.log('==============================\n')

  for (const youtuberName of TARGET_YOUTUBERS) {
    console.log(`👤 ${youtuberName} の画像チェック中...`)

    // セレブリティ情報取得（プロフィール画像）
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name, image_url, subscriber_count')
      .eq('name', youtuberName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${youtuberName} が見つかりません\n`)
      continue
    }

    // 1. プロフィール画像チェック
    console.log('   🖼️ プロフィール画像:')
    if (celebrity.image_url) {
      console.log(`   ✅ 画像あり: ${celebrity.image_url}`)

      // YouTube画像URLの種類を判定
      if (celebrity.image_url.includes('yt3.ggpht.com')) {
        console.log(`      📺 YouTubeチャンネル画像（高解像度）`)
      } else if (celebrity.image_url.includes('i.ytimg.com')) {
        console.log(`      📺 YouTube動画サムネイル画像`)
      } else {
        console.log(`      🌐 その他のソース`)
      }
    } else {
      console.log(`   ❌ プロフィール画像なし`)
    }

    if (celebrity.subscriber_count) {
      console.log(`   👥 登録者数: ${celebrity.subscriber_count.toLocaleString()}人`)
    }

    // 2. エピソードのサムネイル画像チェック
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, thumbnail_url, date')
      .eq('celebrity_id', celebrity.id)
      .order('date', { ascending: false })
      .limit(20)

    console.log(`\n   📺 エピソードサムネイル状況 (最新20本):`)
    console.log(`   =====================================`)

    if (!episodes || episodes.length === 0) {
      console.log(`   ❌ エピソードが見つかりません`)
    } else {
      let withThumbnails = 0
      let maxresThumbnails = 0
      let highThumbnails = 0
      let mediumThumbnails = 0
      let defaultThumbnails = 0

      episodes.forEach((episode, index) => {
        const shortTitle = episode.title.substring(0, 40) + (episode.title.length > 40 ? '...' : '')

        if (episode.thumbnail_url) {
          withThumbnails++
          console.log(`   ${(index + 1).toString().padStart(2, '0')}. ✅ ${shortTitle}`)

          // サムネイルの解像度を判定
          if (episode.thumbnail_url.includes('maxresdefault')) {
            maxresThumbnails++
            console.log(`       🔥 最高解像度 (1280x720)`)
          } else if (episode.thumbnail_url.includes('hqdefault')) {
            highThumbnails++
            console.log(`       📸 高解像度 (480x360)`)
          } else if (episode.thumbnail_url.includes('mqdefault')) {
            mediumThumbnails++
            console.log(`       📷 中解像度 (320x180)`)
          } else if (episode.thumbnail_url.includes('default')) {
            defaultThumbnails++
            console.log(`       📱 標準解像度 (120x90)`)
          } else {
            console.log(`       🌐 その他の解像度`)
          }

          console.log(`       🔗 ${episode.thumbnail_url}`)
        } else {
          console.log(`   ${(index + 1).toString().padStart(2, '0')}. ❌ ${shortTitle}`)
          console.log(`       ⚠️ サムネイルなし`)
        }
      })

      // 統計表示
      console.log(`\n   📊 サムネイル統計:`)
      console.log(`   ├─ サムネイルあり: ${withThumbnails}/${episodes.length}本 (${(withThumbnails/episodes.length*100).toFixed(1)}%)`)
      console.log(`   ├─ 最高解像度: ${maxresThumbnails}本`)
      console.log(`   ├─ 高解像度: ${highThumbnails}本`)
      console.log(`   ├─ 中解像度: ${mediumThumbnails}本`)
      console.log(`   └─ 標準解像度: ${defaultThumbnails}本`)

      // 品質評価
      if (withThumbnails === episodes.length) {
        console.log(`   🎉 完璧！全エピソードにサムネイルあり`)
      } else if (withThumbnails / episodes.length >= 0.9) {
        console.log(`   👍 良好！90%以上にサムネイルあり`)
      } else {
        console.log(`   ⚠️ 改善必要！サムネイル率が90%未満`)
      }
    }

    console.log(`\n${'='.repeat(60)}\n`)
  }

  // 全体統計
  console.log('📊 全YouTuber画像統計')
  console.log('====================')

  let totalWithProfile = 0
  let totalEpisodes = 0
  let totalWithThumbnails = 0

  for (const youtuberName of TARGET_YOUTUBERS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, image_url')
      .eq('name', youtuberName)
      .single()

    if (celebrity) {
      if (celebrity.image_url) totalWithProfile++

      const { data: episodes } = await supabase
        .from('episodes')
        .select('thumbnail_url')
        .eq('celebrity_id', celebrity.id)

      if (episodes) {
        totalEpisodes += episodes.length
        totalWithThumbnails += episodes.filter(ep => ep.thumbnail_url).length
      }
    }
  }

  console.log(`\n🖼️ プロフィール画像:`)
  console.log(`├─ 画像あり: ${totalWithProfile}/${TARGET_YOUTUBERS.length}人 (${(totalWithProfile/TARGET_YOUTUBERS.length*100).toFixed(1)}%)`)

  console.log(`\n📺 エピソードサムネイル:`)
  console.log(`├─ 総エピソード数: ${totalEpisodes}本`)
  console.log(`├─ サムネイルあり: ${totalWithThumbnails}本`)
  console.log(`└─ サムネイル率: ${totalEpisodes ? (totalWithThumbnails/totalEpisodes*100).toFixed(1) : 0}%`)

  // 最終評価
  const profileRate = totalWithProfile / TARGET_YOUTUBERS.length
  const thumbnailRate = totalEpisodes ? totalWithThumbnails / totalEpisodes : 0

  console.log(`\n🎯 画像品質評価:`)

  if (profileRate >= 1.0 && thumbnailRate >= 0.95) {
    console.log(`🏆 最高品質！プロフィール・サムネイル共に優秀`)
  } else if (profileRate >= 0.8 && thumbnailRate >= 0.9) {
    console.log(`👍 高品質！ユーザー体験に問題なし`)
  } else if (profileRate >= 0.6 && thumbnailRate >= 0.8) {
    console.log(`📈 良好！軽微な改善で更に向上`)
  } else {
    console.log(`⚠️ 改善推奨！画像品質の向上が必要`)
  }

  console.log(`\n💡 改善推奨事項:`)
  if (profileRate < 1.0) {
    console.log(`• プロフィール画像未設定のYouTuberを修正`)
  }
  if (thumbnailRate < 0.95) {
    console.log(`• サムネイル欠損エピソードの修正`)
  }
  if (profileRate >= 1.0 && thumbnailRate >= 0.95) {
    console.log(`• 現状維持で十分！画像品質は優秀です`)
  }
}

// 実行
checkYouTuberImages().catch(console.error)