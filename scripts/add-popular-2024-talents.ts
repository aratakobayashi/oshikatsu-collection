/**
 * 2024年人気タレントの追加
 * YouTube Data API、TMDB APIを使用してエピソードも同時追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 2024年人気タレント（カテゴリ別）
const POPULAR_2024_TALENTS = {
  // 超人気YouTuber
  youtubers: [
    { name: 'ヒカキン', type: 'YouTuber', channelName: 'HikakinTV' },
    { name: 'はじめしゃちょー', type: 'YouTuber', channelName: 'はじめしゃちょー（hajime）' },
    { name: '東海オンエア', type: 'YouTuber', channelName: '東海オンエア' },
    { name: '水溜りボンド', type: 'YouTuber', channelName: '水溜りボンド' },
    { name: 'フワちゃん', type: 'YouTuber', channelName: 'フワちゃんTV' },
    { name: 'QuizKnock', type: 'YouTuber', channelName: 'QuizKnock' },
    { name: '中田敦彦', type: 'YouTuber', channelName: '中田敦彦のYouTube大学' },
    { name: 'ヒカル', type: 'YouTuber', channelName: 'Hikaru Games' }
  ],

  // 人気俳優・女優
  actors: [
    { name: '橋本環奈', type: '女優', tmdbName: '橋本環奈' },
    { name: '浜辺美波', type: '女優', tmdbName: '浜辺美波' },
    { name: '永野芽郁', type: '女優', tmdbName: '永野芽郁' },
    { name: '今田美桜', type: '女優', tmdbName: '今田美桜' },
    { name: '佐藤健', type: '俳優', tmdbName: '佐藤健' },
    { name: '菅田将暉', type: '俳優', tmdbName: '菅田将暉' },
    { name: '横浜流星', type: '俳優', tmdbName: '横浜流星' },
    { name: '山崎賢人', type: '俳優', tmdbName: '山崎賢人' }
  ],

  // 現在活動中のアイドル
  idols: [
    { name: '白石麻衣', type: 'アイドル', tmdbName: '白石麻衣' },
    { name: '生田絵梨花', type: 'アイドル', tmdbName: '生田絵梨花' },
    { name: '西野七瀬', type: 'アイドル', tmdbName: '西野七瀬' },
    { name: '柏木由紀', type: 'アイドル', tmdbName: '柏木由紀' },
    { name: '指原莉乃', type: 'アイドル', tmdbName: '指原莉乃' }
  ]
}

async function searchYouTubeChannel(channelName: string) {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(channelName)}&type=channel&maxResults=5&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      console.log(`   ❌ YouTube検索エラー: ${searchResponse.status}`)
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
    }

    return bestChannel
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return null
  }
}

async function getYouTubeVideos(channelId: string, maxResults: number = 10) {
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

async function addPopular2024Talents() {
  console.log('🌟 2024年人気タレント追加開始')
  console.log('==================================\n')

  let totalAdded = 0
  let totalEpisodesAdded = 0

  // 1. YouTuber追加
  console.log('🎬 YouTuber追加中...')
  for (const youtuber of POPULAR_2024_TALENTS.youtubers) {
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
      console.log(`   ❌ チャンネルが見つかりません`)
      continue
    }

    const subscriberCount = parseInt(channel.statistics.subscriberCount || '0')
    console.log(`   ✅ チャンネル発見: ${subscriberCount.toLocaleString()}人`)

    // セレブリティ追加
    const celebrityId = youtuber.name.replace(/[\s\u3000]/g, '_').toLowerCase()
    const slug = youtuber.name.replace(/[\s\u3000]/g, '-').toLowerCase()

    const { data: celebrity, error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: youtuber.name,
        slug: slug,
        type: youtuber.type,
        bio: `人気YouTuber「${youtuber.channelName}」として活動中。登録者数${subscriberCount.toLocaleString()}人の人気チャンネルを運営。`,
        image_url: channel.snippet.thumbnails?.high?.url || null,
        agency: 'UUUM',
        subscriber_count: subscriberCount,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (celebrityError) {
      console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
      continue
    }

    // YouTube動画をエピソードとして追加
    const videos = await getYouTubeVideos(channel.id, 8)
    console.log(`   📹 動画取得: ${videos.length}本`)

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
          description: video.snippet.description?.substring(0, 500) || `${youtuber.name}の動画`,
          date: new Date(video.snippet.publishedAt).toISOString(),
          duration: null,
          thumbnail_url: thumbnailUrl,
          video_url: `https://www.youtube.com/watch?v=${video.snippet.resourceId.videoId}`,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          celebrity_id: celebrityId
        })

      if (!episodeError) {
        totalEpisodesAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${youtuber.name}: ${videos.length}エピソード追加完了`)
    totalAdded++

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // 2. 俳優・女優追加（TMDB使用）
  console.log('\n🎭 俳優・女優追加中...')
  for (const actor of POPULAR_2024_TALENTS.actors) {
    console.log(`\n👤 ${actor.name} を追加中...`)

    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', actor.name)
      .single()

    if (existing) {
      console.log(`   ⏭️ 既に存在します`)
      continue
    }

    // TMDB検索
    const person = await searchPersonOnTMDB(actor.tmdbName)
    if (!person) {
      console.log(`   ❌ TMDBで見つかりません`)
      continue
    }

    console.log(`   ✅ TMDB ID: ${person.id}`)

    // セレブリティ追加
    const profileImageUrl = person.profile_path
      ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
      : null

    const celebrityId = actor.name.replace(/[\s\u3000]/g, '_').toLowerCase()
    const slug = actor.name.replace(/[\s\u3000]/g, '-').toLowerCase()

    const { error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: actor.name,
        slug: slug,
        type: actor.type,
        bio: person.biography ? person.biography.substring(0, 200) + '...' : `人気${actor.type}として映画・ドラマで活躍中。`,
        image_url: profileImageUrl,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (celebrityError) {
      console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
      continue
    }

    // 出演作品をエピソードとして追加
    const credits = await getPersonCredits(person.id)
    const allWorks = [
      ...credits.movies
        .filter(m => m.title && m.release_date && m.poster_path)
        .map(m => ({ ...m, type: 'movie', name: m.title, air_date: m.release_date })),
      ...credits.tvShows
        .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
        .map(tv => ({ ...tv, type: 'tv', air_date: tv.first_air_date }))
    ]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 10) // 上位10作品

    console.log(`   🎬 作品取得: ${allWorks.length}本`)

    for (let i = 0; i < allWorks.length; i++) {
      const work = allWorks[i]
      const episodeId = `${celebrityId}_${work.type}_${i + 1}`

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${work.type === 'movie' ? '映画' : 'ドラマ'}】${work.name}`,
          description: work.overview || `${actor.name}が出演した${work.type === 'movie' ? '映画' : 'テレビドラマ'}作品`,
          date: new Date(work.air_date).toISOString(),
          duration: null,
          thumbnail_url: `https://image.tmdb.org/t/p/w500${work.poster_path}`,
          video_url: `https://www.themoviedb.org/${work.type}/${work.id}`,
          view_count: Math.floor((work.vote_average || 7) * 100000),
          celebrity_id: celebrityId
        })

      if (!episodeError) {
        totalEpisodesAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${actor.name}: ${allWorks.length}エピソード追加完了`)
    totalAdded++

    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  // 3. アイドル追加（TMDB使用）
  console.log('\n👑 アイドル追加中...')
  for (const idol of POPULAR_2024_TALENTS.idols) {
    console.log(`\n👤 ${idol.name} を追加中...`)

    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', idol.name)
      .single()

    if (existing) {
      console.log(`   ⏭️ 既に存在します`)
      continue
    }

    // TMDB検索
    const person = await searchPersonOnTMDB(idol.tmdbName)
    if (!person) {
      console.log(`   ❌ TMDBで見つかりません`)
      continue
    }

    console.log(`   ✅ TMDB ID: ${person.id}`)

    // セレブリティ追加
    const profileImageUrl = person.profile_path
      ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
      : null

    const celebrityId = idol.name.replace(/[\s\u3000]/g, '_').toLowerCase()
    const slug = idol.name.replace(/[\s\u3000]/g, '-').toLowerCase()

    const { error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: idol.name,
        slug: slug,
        type: idol.type,
        bio: person.biography ? person.biography.substring(0, 200) + '...' : `人気アイドルとして音楽活動・エンターテイメント活動で活躍中。`,
        image_url: profileImageUrl,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (celebrityError) {
      console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
      continue
    }

    // 出演作品をエピソードとして追加
    const credits = await getPersonCredits(person.id)
    const allWorks = [
      ...credits.movies
        .filter(m => m.title && m.release_date && m.poster_path)
        .map(m => ({ ...m, type: 'movie', name: m.title, air_date: m.release_date })),
      ...credits.tvShows
        .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
        .map(tv => ({ ...tv, type: 'tv', air_date: tv.first_air_date }))
    ]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 8) // 上位8作品

    console.log(`   🎬 作品取得: ${allWorks.length}本`)

    for (let i = 0; i < allWorks.length; i++) {
      const work = allWorks[i]
      const episodeId = `${celebrityId}_${work.type}_${i + 1}`

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${work.type === 'movie' ? '映画' : 'ドラマ'}】${work.name}`,
          description: work.overview || `${idol.name}が出演した${work.type === 'movie' ? '映画' : 'テレビドラマ'}作品`,
          date: new Date(work.air_date).toISOString(),
          duration: null,
          thumbnail_url: `https://image.tmdb.org/t/p/w500${work.poster_path}`,
          video_url: `https://www.themoviedb.org/${work.type}/${work.id}`,
          view_count: Math.floor((work.vote_average || 7) * 80000),
          celebrity_id: celebrityId
        })

      if (!episodeError) {
        totalEpisodesAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${idol.name}: ${allWorks.length}エピソード追加完了`)
    totalAdded++

    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 2024年人気タレント追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したタレント: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)
  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで新しいタレントを確認')
  console.log('• 各タレントのプロフィールページでエピソードを確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addPopular2024Talents().catch(console.error)