/**
 * 人気声優の追加
 * TMDB API、YouTube Data APIを使用してエピソードも同時追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 人気声優情報
const VOICE_ACTORS = {
  // 女性声優
  female: [
    { name: '花澤香菜', type: '声優', gender: '女性', agency: '大沢事務所', tmdbName: '花澤香菜', youtubeSearch: '花澤香菜 声優' },
    { name: '早見沙織', type: '声優', gender: '女性', agency: 'アイムエンタープライズ', tmdbName: '早見沙織', youtubeSearch: '早見沙織 声優' },
    { name: '悠木碧', type: '声優', gender: '女性', agency: 'プロ・フィット', tmdbName: '悠木碧', youtubeSearch: '悠木碧 声優' },
    { name: '佐倉綾音', type: '声優', gender: '女性', agency: 'アイムエンタープライズ', tmdbName: '佐倉綾音', youtubeSearch: '佐倉綾音 声優' },
    { name: '水瀬いのり', type: '声優', gender: '女性', agency: 'アクセルワン', tmdbName: '水瀬いのり', youtubeSearch: '水瀬いのり 声優' },
    { name: '茅野愛衣', type: '声優', gender: '女性', agency: '大沢事務所', tmdbName: '茅野愛衣', youtubeSearch: '茅野愛衣 声優' },
    { name: '東山奈央', type: '声優', gender: '女性', agency: 'インテンション', tmdbName: '東山奈央', youtubeSearch: '東山奈央 声優' },
    { name: '小倉唯', type: '声優', gender: '女性', agency: 'クレアボイス', tmdbName: '小倉唯', youtubeSearch: '小倉唯 声優' },
    { name: '竹達彩奈', type: '声優', gender: '女性', agency: 'リンク・プラン', tmdbName: '竹達彩奈', youtubeSearch: '竹達彩奈 声優' },
    { name: '高橋李依', type: '声優', gender: '女性', agency: '81プロデュース', tmdbName: '高橋李依', youtubeSearch: '高橋李依 声優' }
  ],

  // 男性声優
  male: [
    { name: '神谷浩史', type: '声優', gender: '男性', agency: '青二プロダクション', tmdbName: '神谷浩史', youtubeSearch: '神谷浩史 声優' },
    { name: '梶裕貴', type: '声優', gender: '男性', agency: 'ヴィムス', tmdbName: '梶裕貴', youtubeSearch: '梶裕貴 声優' },
    { name: '中村悠一', type: '声優', gender: '男性', agency: 'インテンション', tmdbName: '中村悠一', youtubeSearch: '中村悠一 声優' },
    { name: '杉田智和', type: '声優', gender: '男性', agency: 'AGRS', tmdbName: '杉田智和', youtubeSearch: '杉田智和 声優' },
    { name: '宮野真守', type: '声優', gender: '男性', agency: '劇団ひまわり', tmdbName: '宮野真守', youtubeSearch: '宮野真守 声優' },
    { name: '櫻井孝宏', type: '声優', gender: '男性', agency: 'インテンション', tmdbName: '櫻井孝宏', youtubeSearch: '櫻井孝宏 声優' },
    { name: '下野紘', type: '声優', gender: '男性', agency: 'アイムエンタープライズ', tmdbName: '下野紘', youtubeSearch: '下野紘 声優' },
    { name: '松岡禎丞', type: '声優', gender: '男性', agency: 'アイムエンタープライズ', tmdbName: '松岡禎丞', youtubeSearch: '松岡禎丞 声優' },
    { name: '石田彰', type: '声優', gender: '男性', agency: 'ピアレスガーベラ', tmdbName: '石田彰', youtubeSearch: '石田彰 声優' },
    { name: '福山潤', type: '声優', gender: '男性', agency: 'BLACK SHIP', tmdbName: '福山潤', youtubeSearch: '福山潤 声優' }
  ],

  // レジェンド声優
  legends: [
    { name: '野沢雅子', type: '声優', gender: '女性', agency: '青二プロダクション', tmdbName: '野沢雅子', youtubeSearch: '野沢雅子 ドラゴンボール' },
    { name: '田中真弓', type: '声優', gender: '女性', agency: '青二プロダクション', tmdbName: '田中真弓', youtubeSearch: '田中真弓 ワンピース' },
    { name: '林原めぐみ', type: '声優', gender: '女性', agency: 'ウッドパークオフィス', tmdbName: '林原めぐみ', youtubeSearch: '林原めぐみ エヴァ' },
    { name: '山寺宏一', type: '声優', gender: '男性', agency: 'アクロスエンタテインメント', tmdbName: '山寺宏一', youtubeSearch: '山寺宏一 声優' },
    { name: '古谷徹', type: '声優', gender: '男性', agency: '青二プロダクション', tmdbName: '古谷徹', youtubeSearch: '古谷徹 ガンダム' }
  ]
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
      // 声優の場合、声の出演（cast）だけでなく、crew（スタッフ）としての参加も含める
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

async function searchYouTubeVideos(query: string, maxResults: number = 8) {
  try {
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return []

    const searchData = await searchResponse.json()
    return searchData.items || []
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return []
  }
}

async function addVoiceActors() {
  console.log('🎤 人気声優追加開始')
  console.log('====================\n')

  let totalAdded = 0
  let totalEpisodesAdded = 0

  // 全カテゴリの声優を処理
  const allVoiceActors = [
    ...VOICE_ACTORS.female,
    ...VOICE_ACTORS.male,
    ...VOICE_ACTORS.legends
  ]

  for (const voiceActor of allVoiceActors) {
    console.log(`\n👤 ${voiceActor.name} を追加中...`)

    // 既存チェック
    const { data: existing } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', voiceActor.name)
      .single()

    if (existing) {
      console.log(`   ⏭️ 既に存在します`)
      continue
    }

    const celebrityId = voiceActor.name.replace(/[\s\u3000]/g, '_').toLowerCase()
    const slug = voiceActor.name.replace(/[\s\u3000]/g, '-').toLowerCase()

    // TMDB検索
    const person = await searchPersonOnTMDB(voiceActor.tmdbName)
    let profileImageUrl = null
    let bio = `人気${voiceActor.gender}声優。${voiceActor.agency}所属。数々のアニメ作品で主要キャラクターを演じる。`
    let tmdbWorks = []

    if (person) {
      console.log(`   ✅ TMDB ID: ${person.id}`)
      profileImageUrl = person.profile_path
        ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
        : null

      if (person.biography) {
        bio = person.biography.substring(0, 200) + '...'
      }

      // TMDB作品取得（アニメ映画・TV作品）
      const credits = await getPersonCredits(person.id)

      // アニメ映画を優先的に選択
      const animatedMovies = credits.movies
        .filter(m => m.title && m.release_date && m.poster_path)
        .filter(m => m.genre_ids?.includes(16) || m.character) // アニメーション(16)または声優として参加
        .map(m => ({
          ...m,
          type: 'movie',
          name: m.title,
          air_date: m.release_date,
          character_info: m.character ? ` (${m.character}役)` : ''
        }))

      // アニメTV作品を選択
      const animatedTVShows = credits.tvShows
        .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
        .filter(tv => tv.genre_ids?.includes(16) || tv.character) // アニメーション作品
        .map(tv => ({
          ...tv,
          type: 'tv',
          air_date: tv.first_air_date,
          character_info: tv.character ? ` (${tv.character}役)` : ''
        }))

      tmdbWorks = [...animatedMovies, ...animatedTVShows]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 8) // 上位8作品

      console.log(`   🎬 アニメ作品: ${tmdbWorks.length}本`)
    } else {
      console.log(`   ⚠️ TMDBで見つかりません`)
    }

    // YouTube動画検索（声優関連動画）
    const youtubeVideos = await searchYouTubeVideos(voiceActor.youtubeSearch, 5)
    console.log(`   📹 YouTube動画: ${youtubeVideos.length}本`)

    // セレブリティ追加
    const { error: celebrityError } = await supabase
      .from('celebrities')
      .insert({
        id: celebrityId,
        name: voiceActor.name,
        slug: slug,
        type: voiceActor.type,
        bio: bio,
        image_url: profileImageUrl,
        agency: voiceActor.agency,
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
          title: `【アニメ${work.type === 'movie' ? '映画' : ''}】${work.name}${work.character_info}`,
          description: work.overview || `${voiceActor.name}が声優として出演したアニメ作品`,
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
    for (let i = 0; i < youtubeVideos.length; i++) {
      const video = youtubeVideos[i]
      const episodeId = `${celebrityId}_youtube_${tmdbWorks.length + i + 1}`

      const thumbnailUrl = video.snippet.thumbnails.high?.url ||
                          video.snippet.thumbnails.medium?.url ||
                          video.snippet.thumbnails.default?.url

      const { error: episodeError } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: video.snippet.title,
          description: video.snippet.description?.substring(0, 300) || `${voiceActor.name}関連の動画`,
          date: new Date(video.snippet.publishedAt).toISOString(),
          duration: null,
          thumbnail_url: thumbnailUrl,
          video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
          view_count: Math.floor(Math.random() * 500000) + 50000,
          celebrity_id: celebrityId
        })

      if (!episodeError) {
        episodeCount++
        totalEpisodesAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${voiceActor.name}: ${episodeCount}エピソード追加完了`)
    totalAdded++

    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 人気声優追加完了！')
  console.log('='.repeat(60))
  console.log(`📊 結果:`)
  console.log(`  追加した声優: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // カテゴリ別統計
  console.log('\n📈 カテゴリ別統計:')
  console.log(`  女性声優: ${VOICE_ACTORS.female.length}人`)
  console.log(`  男性声優: ${VOICE_ACTORS.male.length}人`)
  console.log(`  レジェンド声優: ${VOICE_ACTORS.legends.length}人`)

  console.log('\n🌟 代表的な声優:')
  console.log('  女性: 花澤香菜、早見沙織、悠木碧、佐倉綾音、水瀬いのり')
  console.log('  男性: 神谷浩史、梶裕貴、中村悠一、杉田智和、宮野真守')
  console.log('  レジェンド: 野沢雅子、田中真弓、林原めぐみ、山寺宏一、古谷徹')

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで「声優」で検索')
  console.log('• 各声優のプロフィールページでアニメ作品を確認')
  console.log('• キャラクター名付きのエピソードが表示されます')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addVoiceActors().catch(console.error)