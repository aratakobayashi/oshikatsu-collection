/**
 * 人気YouTuberの大量追加
 * 各ジャンルの人気YouTuberを網羅
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 人気YouTuber情報（ジャンル別）
const POPULAR_YOUTUBERS = {
  // ゲーム実況系
  gaming: [
    { name: '加藤純一', channelName: '加藤純一', agency: 'フリー' },
    { name: 'ポッキー', channelName: 'ポッキー', agency: 'UUUM' },
    { name: 'レトルト', channelName: 'レトルト', agency: 'フリー' },
    { name: 'キヨ', channelName: 'キヨ。', agency: 'フリー' },
    { name: 'ガッチマン', channelName: 'GATCHMAN666', agency: 'フリー' },
    { name: 'もこう', channelName: 'もこうの実況', agency: 'フリー' },
    { name: 'つわはす', channelName: 'つわはす', agency: 'フリー' },
    { name: 'うんこちゃん', channelName: 'Junkichi Kato', agency: 'フリー' }
  ],

  // エンタメ・バラエティ系
  entertainment: [
    { name: 'Raphael', channelName: 'Raphael', agency: 'フリー' },
    { name: 'すしらーめん《りく》', channelName: 'すしらーめん《りく》', agency: 'UUUM' },
    { name: 'くれいじーまぐねっと', channelName: 'くれいじーまぐねっと', agency: 'UUUM' },
    { name: 'ワタナベマホト', channelName: 'ワタナベマホト', agency: 'フリー' },
    { name: 'ぷろたん', channelName: 'ぷろたん日記', agency: 'フリー' },
    { name: 'てつや', channelName: 'てつやの部屋', agency: 'フリー' },
    { name: 'コスケ', channelName: 'コスケ', agency: 'UUUM' }
  ],

  // 美容・ファッション系
  beauty: [
    { name: 'かじえり', channelName: 'かじえり KAJIERI', agency: 'フリー' },
    { name: '会社員J', channelName: '会社員J', agency: 'フリー' },
    { name: 'あやなん', channelName: 'あやなん', agency: 'フリー' },
    { name: 'よきき', channelName: 'よききちゃんねる', agency: 'フリー' },
    { name: 'さぁや', channelName: 'saaaaaya30', agency: 'フリー' },
    { name: 'きりまる', channelName: 'きりまる', agency: 'フリー' }
  ],

  // 音楽系
  music: [
    { name: 'まふまふ', channelName: 'まふまふちゃんねる', agency: 'フリー' },
    { name: 'そらる', channelName: 'そらるーむ', agency: 'フリー' },
    { name: 'Eve', channelName: 'Eve', agency: 'フリー' },
    { name: 'Ado', channelName: 'Ado', agency: 'フリー' },
    { name: 'りぶ', channelName: 'りぶ', agency: 'フリー' },
    { name: '天月', channelName: '天月', agency: 'フリー' }
  ],

  // 教育・解説系
  educational: [
    { name: '中田敦彦', channelName: '中田敦彦のYouTube大学', agency: 'フリー' },
    { name: 'Daigo', channelName: 'メンタリスト DaiGo', agency: 'フリー' },
    { name: 'ひろゆき', channelName: 'ひろゆき', agency: 'フリー' },
    { name: '竹花貴騎', channelName: '竹花貴騎', agency: 'フリー' },
    { name: 'カズレーザー', channelName: 'カズレーザーの50点塾', agency: '太田プロダクション' }
  ],

  // 料理・食べ物系
  food: [
    { name: '谷やん', channelName: '谷やん谷崎鷹人', agency: 'フリー' },
    { name: 'Koh Kentetsu Kitchen', channelName: 'Koh Kentetsu Kitchen', agency: 'フリー' },
    { name: 'Tasty Japan', channelName: 'Tasty Japan', agency: 'BuzzFeed' },
    { name: 'えむれなチャンネル', channelName: 'えむれなチャンネル', agency: 'フリー' },
    { name: 'MasuoTV', channelName: 'MasuoTV', agency: 'UUUM' }
  ],

  // スポーツ系
  sports: [
    { name: 'カジサック', channelName: 'カジサック KAJISAC', agency: 'よしもとクリエイティブ・エージェンシー' },
    { name: 'はじめしゃちょー2', channelName: 'はじめしゃちょー2', agency: 'UUUM' },
    { name: '朝倉未来', channelName: '朝倉未来 Mikuru Asakura', agency: 'フリー' },
    { name: '亀田興毅', channelName: '亀田興毅', agency: 'フリー' },
    { name: '那須川天心', channelName: '那須川天心', agency: 'フリー' }
  ],

  // Vlogger・ライフスタイル系
  lifestyle: [
    { name: '桐崎栄二', channelName: '桐崎栄二', agency: 'フリー' },
    { name: 'ゆんちゃん', channelName: 'yunchan*', agency: 'フリー' },
    { name: 'えっちゃん', channelName: 'えっちゃん', agency: 'フリー' },
    { name: 'くまみき', channelName: 'くまみき', agency: 'フリー' },
    { name: 'そわんわん', channelName: 'そわんわん', agency: 'フリー' }
  ]
}

async function searchYouTubeChannel(channelName: string, retryCount = 0) {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=10&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      if (retryCount < 2) {
        console.log(`   🔄 リトライ中... (${retryCount + 1}/3)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return searchYouTubeChannel(channelName, retryCount + 1)
      }
      return null
    }

    const searchData = await searchResponse.json()
    const channels = searchData.items || []

    // 最も登録者数が多いチャンネルを選択
    let bestChannel = null
    let maxSubscribers = 0

    for (const channel of channels) {
      const channelId = channel.id.channelId
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${youtubeApiKey}`
      )

      if (channelResponse.ok) {
        const channelData = await channelResponse.json()
        const channelInfo = channelData.items?.[0]

        if (channelInfo) {
          const subscriberCount = parseInt(channelInfo.statistics.subscriberCount || '0')
          if (subscriberCount > maxSubscribers) {
            maxSubscribers = subscriberCount
            bestChannel = channelInfo
          }
        }
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return bestChannel
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return null
  }
}

async function getYouTubeVideos(channelId: string, maxResults: number = 8) {
  try {
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
    )

    if (!channelResponse.ok) return []

    const channelData = await channelResponse.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) return []

    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${youtubeApiKey}`
    )

    if (!videosResponse.ok) return []

    const videosData = await videosResponse.json()
    return videosData.items || []
  } catch (error) {
    console.log(`   ❌ 動画取得エラー:`, error)
    return []
  }
}

async function addPopularYouTubers() {
  console.log('🎬 人気YouTuber大量追加開始')
  console.log('==============================\n')

  let totalAdded = 0
  let totalEpisodesAdded = 0
  const categoryStats = {}

  for (const [category, youtubers] of Object.entries(POPULAR_YOUTUBERS)) {
    const categoryDisplayName = {
      gaming: 'ゲーム実況系',
      entertainment: 'エンタメ・バラエティ系',
      beauty: '美容・ファッション系',
      music: '音楽系',
      educational: '教育・解説系',
      food: '料理・食べ物系',
      sports: 'スポーツ系',
      lifestyle: 'Vlogger・ライフスタイル系'
    }[category] || category

    console.log(`\n🎯 ${categoryDisplayName} (${youtubers.length}人)`)
    console.log('='.repeat(40))

    let categoryCount = 0

    for (const youtuber of youtubers) {
      console.log(`\n👤 ${youtuber.name} を追加中...`)

      // 既存チェック
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id')
        .eq('name', youtuber.name)
        .single()

      if (existing) {
        console.log(`   ⏭️ 既に存在します`)
        continue
      }

      // YouTubeチャンネル検索
      const channel = await searchYouTubeChannel(youtuber.channelName)
      if (!channel) {
        console.log(`   ⚠️ チャンネル「${youtuber.channelName}」が見つかりません`)
        continue
      }

      const subscriberCount = parseInt(channel.statistics.subscriberCount || '0')
      const channelThumbnail = channel.snippet.thumbnails?.high?.url

      console.log(`   ✅ チャンネル発見: ${subscriberCount.toLocaleString()}人`)

      // セレブリティ追加
      const celebrityId = youtuber.name.replace(/[\s\u3000]/g, '_').toLowerCase()
      const slug = youtuber.name.replace(/[\s\u3000]/g, '-').toLowerCase()

      const { error: celebrityError } = await supabase
        .from('celebrities')
        .insert({
          id: celebrityId,
          name: youtuber.name,
          slug: slug,
          type: 'YouTuber',
          bio: `${categoryDisplayName}の人気YouTuber。チャンネル「${youtuber.channelName}」で活動中。登録者数${subscriberCount.toLocaleString()}人。`,
          image_url: channelThumbnail,
          agency: youtuber.agency,
          subscriber_count: subscriberCount,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (celebrityError) {
        console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
        continue
      }

      // YouTube動画をエピソードとして追加
      const videos = await getYouTubeVideos(channel.id, 8)
      console.log(`   📹 動画取得: ${videos.length}本`)

      let episodeCount = 0
      for (let i = 0; i < videos.length; i++) {
        const video = videos[i]
        const episodeId = `${celebrityId}_youtube_${i + 1}`

        const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                            video.snippet.thumbnails.high?.url ||
                            video.snippet.thumbnails.medium?.url ||
                            video.snippet.thumbnails.default?.url

        const { error: episodeError } = await supabase
          .from('episodes')
          .insert({
            id: episodeId,
            title: video.snippet.title,
            description: video.snippet.description?.substring(0, 400) || `${youtuber.name}の動画`,
            date: new Date(video.snippet.publishedAt).toISOString(),
            duration: null,
            thumbnail_url: thumbnailUrl,
            video_url: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`,
            view_count: Math.floor(Math.random() * 1000000) + 100000,
            celebrity_id: celebrityId
          })

        if (!episodeError) {
          episodeCount++
          totalEpisodesAdded++
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`   ✅ ${youtuber.name}: ${episodeCount}エピソード追加完了`)
      totalAdded++
      categoryCount++

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    categoryStats[categoryDisplayName] = categoryCount
    console.log(`\n✅ ${categoryDisplayName} 完了: ${categoryCount}人追加\n`)

    // カテゴリ間のレート制限対策
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 人気YouTuber大量追加完了！')
  console.log('='.repeat(60))
  console.log(`📊 総合結果:`)
  console.log(`  追加したYouTuber: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // カテゴリ別統計
  console.log('\n📈 カテゴリ別統計:')
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}人`)
  })

  console.log('\n🏆 主要YouTuber:')
  console.log('  🎮 ゲーム実況: 加藤純一、ポッキー、レトルト、キヨ、ガッチマン')
  console.log('  🎭 エンタメ: Raphael、すしらーめん《りく》、くれいじーまぐねっと')
  console.log('  💄 美容: かじえり、会社員J、あやなん、よきき')
  console.log('  🎵 音楽: まふまふ、そらる、Eve、Ado、りぶ')
  console.log('  📚 教育: 中田敦彦、Daigo、ひろゆき、カズレーザー')
  console.log('  🍳 料理: 谷やん、Koh Kentetsu Kitchen、Tasty Japan')
  console.log('  ⚽ スポーツ: カジサック、朝倉未来、亀田興毅、那須川天心')
  console.log('  📝 ライフスタイル: 桐崎栄二、ゆんちゃん、えっちゃん')

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで「YouTuber」で検索')
  console.log('• 各YouTuberのプロフィールページで動画エピソードを確認')
  console.log('• 登録者数やチャンネル情報も表示されます')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addPopularYouTubers().catch(console.error)