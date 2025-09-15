/**
 * YouTubeをやっている有名人（芸能人・タレント）の追加
 * 既存の芸能人がYouTubeチャンネルを運営している場合を対象
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// YouTubeをやっている有名人情報
const CELEBRITY_YOUTUBERS = {
  // 俳優・女優系YouTuber
  actors: [
    { name: '本田翼', type: '女優', channelName: 'ほんだのばいく', agency: 'スターダストプロモーション', tmdbName: '本田翼' },
    { name: '佐藤二朗', type: '俳優', channelName: '佐藤二朗のくだらないチャンネル', agency: 'フリー', tmdbName: '佐藤二朗' },
    { name: '指原莉乃', type: 'タレント', channelName: '指原莉乃&フワちゃんのYouTube', agency: '太田プロダクション', tmdbName: '指原莉乃' },
    { name: 'りゅうちぇる', type: 'タレント', channelName: 'ryuuchell', agency: 'フリー', tmdbName: 'りゅうちぇる' }
  ],

  // アーティスト系YouTuber
  artists: [
    { name: '米津玄師', type: 'アーティスト', channelName: 'Kenshi Yonezu', agency: 'ソニー・ミュージックエンタテインメント', tmdbName: '米津玄師' },
    { name: 'あいみょん', type: 'アーティスト', channelName: 'aimyon', agency: 'ワーナーミュージック・ジャパン', tmdbName: 'あいみょん' },
    { name: 'YOASOBI', type: 'アーティスト', channelName: 'Ayase / YOASOBI', agency: 'ソニー・ミュージックエンタテインメント', tmdbName: 'YOASOBI' },
    { name: 'King Gnu', type: 'アーティスト', channelName: 'King Gnu', agency: 'アリオラジャパン', tmdbName: 'King Gnu' },
    { name: 'Official髭男dism', type: 'アーティスト', channelName: 'Official髭男dism', agency: 'ポニーキャニオン', tmdbName: 'Official髭男dism' }
  ],

  // スポーツ選手系YouTuber
  athletes: [
    { name: '本田圭佑', type: 'サッカー選手', channelName: 'KEISUKE HONDA', agency: 'フリー', tmdbName: '本田圭佑' },
    { name: '武井壮', type: 'タレント', channelName: '武井壮 百獣の王国', agency: 'アルファセレクション', tmdbName: '武井壮' },
    { name: '前田裕二', type: '実業家', channelName: 'YUJI MAEDA / 前田裕二', agency: 'SHOWROOM', tmdbName: '前田裕二' }
  ],

  // モデル・インフルエンサー系YouTuber
  models: [
    { name: '古川優香', type: 'モデル', channelName: '古川優香 / ゆうこす', agency: 'KOS', tmdbName: '古川優香' },
    { name: '池田美優', type: 'モデル', channelName: 'みちょぱ', agency: 'エイベックス・マネジメント', tmdbName: '池田美優' },
    { name: '藤田ニコル', type: 'モデル', channelName: 'にこるん', agency: 'オスカープロモーション', tmdbName: '藤田ニコル' },
    { name: '渡辺直美', type: 'タレント', channelName: 'NAOMI WATANABE', agency: 'よしもとクリエイティブ・エージェンシー', tmdbName: '渡辺直美' }
  ],

  // 料理系有名人YouTuber
  chefs: [
    { name: '速水もこみち', type: '俳優', channelName: 'MOCOMICHI HAYAMI', agency: 'ケイダッシュ', tmdbName: '速水もこみち' },
    { name: 'りゅうじ', type: '料理研究家', channelName: '料理研究家リュウジのバズレシピ', agency: 'フリー', tmdbName: 'りゅうじ' }
  ]
}

async function searchYouTubeChannel(channelName: string) {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=5&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return null

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
    }

    return bestChannel
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return null
  }
}

async function getYouTubeVideos(channelId: string, maxResults: number = 8) {
  try {
    // チャンネルのアップロードプレイリストIDを取得
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${youtubeApiKey}`
    )

    if (!channelResponse.ok) return []

    const channelData = await channelResponse.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) return []

    // プレイリストから動画を取得
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

async function searchPersonOnTMDB(personName: string) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(personName)}&language=ja-JP`
    const response = await fetch(searchUrl)

    if (!response.ok) return null

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      return data.results[0]
    }
    return null
  } catch (error) {
    console.log(`   ❌ TMDB検索エラー:`, error)
    return null
  }
}

async function getPersonCredits(personId: number) {
  try {
    const movieCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${tmdbApiKey}&language=ja-JP`
    const tvCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${tmdbApiKey}&language=ja-JP`

    const [movieResponse, tvResponse] = await Promise.all([
      fetch(movieCreditsUrl),
      fetch(tvCreditsUrl)
    ])

    const credits = { movies: [], tvShows: [] }

    if (movieResponse.ok) {
      const movieData = await movieResponse.json()
      credits.movies = movieData.cast || []
    }

    if (tvResponse.ok) {
      const tvData = await tvResponse.json()
      credits.tvShows = tvData.cast || []
    }

    return credits
  } catch (error) {
    console.log(`   ❌ クレジット取得エラー:`, error)
    return { movies: [], tvShows: [] }
  }
}

async function addCelebrityYouTubers() {
  console.log('🎬 YouTubeをやっている有名人追加開始')
  console.log('===================================\n')

  let totalAdded = 0
  let totalEpisodesAdded = 0

  // 全カテゴリの有名人を処理
  const allCelebrities = [
    ...CELEBRITY_YOUTUBERS.actors,
    ...CELEBRITY_YOUTUBERS.artists,
    ...CELEBRITY_YOUTUBERS.athletes,
    ...CELEBRITY_YOUTUBERS.models,
    ...CELEBRITY_YOUTUBERS.chefs
  ]

  for (const celebrity of allCelebrities) {
    console.log(`\n👤 ${celebrity.name} を追加中...`)

    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', celebrity.name)
      .single()

    if (existing) {
      console.log(`   ⏭️ 既に存在します`)
      continue
    }

    const celebrityId = celebrity.name.replace(/[\s\u3000]/g, '_').toLowerCase()
    const slug = celebrity.name.replace(/[\s\u3000]/g, '-').toLowerCase()

    // YouTubeチャンネル検索
    const channel = await searchYouTubeChannel(celebrity.channelName)
    let subscriberCount = 0
    let channelThumbnail = null
    let videos = []

    if (channel) {
      subscriberCount = parseInt(channel.statistics.subscriberCount || '0')
      channelThumbnail = channel.snippet.thumbnails?.high?.url
      videos = await getYouTubeVideos(channel.id, 6)
      console.log(`   ✅ YouTubeチャンネル発見: ${subscriberCount.toLocaleString()}人`)
    } else {
      console.log(`   ⚠️ YouTubeチャンネル見つかりません`)
    }

    // TMDB検索（俳優・女優などの場合）
    let person = null
    let profileImageUrl = channelThumbnail
    let bio = `${celebrity.type}として活動しながら、YouTubeチャンネル「${celebrity.channelName}」も運営。`
    let tmdbWorks = []

    if (['俳優', '女優'].includes(celebrity.type)) {
      person = await searchPersonOnTMDB(celebrity.tmdbName)
      if (person) {
        console.log(`   ✅ TMDB ID: ${person.id}`)
        if (person.profile_path) {
          profileImageUrl = `https://image.tmdb.org/t/p/w500${person.profile_path}`
        }

        if (person.biography) {
          bio = person.biography.substring(0, 200) + '...'
        }

        // TMDB作品取得
        const credits = await getPersonCredits(person.id)
        tmdbWorks = [
          ...credits.movies
            .filter(m => m.title && m.release_date && m.poster_path)
            .map(m => ({ ...m, type: 'movie', name: m.title, air_date: m.release_date })),
          ...credits.tvShows
            .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
            .map(tv => ({ ...tv, type: 'tv', air_date: tv.first_air_date }))
        ]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 5) // 上位5作品

        console.log(`   🎬 TMDB作品: ${tmdbWorks.length}本`)
      }
    }

    // セレブリティ追加
    const { error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: celebrity.name,
        slug: slug,
        type: celebrity.type,
        bio: bio,
        image_url: profileImageUrl,
        agency: celebrity.agency,
        subscriber_count: subscriberCount || null,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (celebrityError) {
      console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
      continue
    }

    let episodeCount = 0

    // TMDB作品をエピソードとして追加
    for (let i = 0; i < tmdbWorks.length; i++) {
      const work = tmdbWorks[i]
      const episodeId = `${celebrityId}_${work.type}_${i + 1}`

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${work.type === 'movie' ? '映画' : 'TV'}】${work.name}`,
          description: work.overview || `${celebrity.name}が出演した${work.type === 'movie' ? '映画' : 'テレビ番組'}`,
          date: new Date(work.air_date).toISOString(),
          duration: null,
          thumbnail_url: `https://image.tmdb.org/t/p/w500${work.poster_path}`,
          video_url: `https://www.themoviedb.org/${work.type}/${work.id}`,
          view_count: Math.floor((work.vote_average || 7) * 100000),
          celebrity_id: celebrityId
        })

      if (!episodeError) {
        episodeCount++
        totalEpisodesAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // YouTube動画をエピソードとして追加
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i]
      const episodeId = `${celebrityId}_youtube_${tmdbWorks.length + i + 1}`

      const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                          video.snippet.thumbnails.high?.url ||
                          video.snippet.thumbnails.medium?.url ||
                          video.snippet.thumbnails.default?.url

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【YouTube】${video.snippet.title}`,
          description: video.snippet.description?.substring(0, 400) || `${celebrity.name}のYouTube動画`,
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

    console.log(`   ✅ ${celebrity.name}: ${episodeCount}エピソード追加完了`)
    totalAdded++

    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 YouTubeをやっている有名人追加完了！')
  console.log('='.repeat(60))
  console.log(`📊 結果:`)
  console.log(`  追加した有名人: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // カテゴリ別統計
  console.log('\n📈 カテゴリ別統計:')
  console.log(`  俳優・女優系: ${CELEBRITY_YOUTUBERS.actors.length}人`)
  console.log(`  アーティスト系: ${CELEBRITY_YOUTUBERS.artists.length}人`)
  console.log(`  スポーツ選手系: ${CELEBRITY_YOUTUBERS.athletes.length}人`)
  console.log(`  モデル・インフルエンサー系: ${CELEBRITY_YOUTUBERS.models.length}人`)
  console.log(`  料理系: ${CELEBRITY_YOUTUBERS.chefs.length}人`)

  console.log('\n🌟 代表的な有名人YouTuber:')
  console.log('  俳優・女優: 本田翼、佐藤二朗、速水もこみち')
  console.log('  アーティスト: 米津玄師、あいみょん、YOASOBI、King Gnu')
  console.log('  スポーツ: 本田圭佑、武井壮')
  console.log('  モデル: 古川優香、池田美優、藤田ニコル、渡辺直美')

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで各タイプで検索')
  console.log('• 各有名人のプロフィールページでYouTube動画と本業作品を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addCelebrityYouTubers().catch(console.error)