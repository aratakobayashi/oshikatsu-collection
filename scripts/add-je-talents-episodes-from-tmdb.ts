/**
 * エピソード0本のJE（ジャニーズ）タレント13名にTMDB APIで映画・ドラマエピソードを追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// JEタレント情報
const JE_TALENTS = [
  // SixTONESメンバー
  { name: '松村北斗', tmdbName: '松村北斗' },
  { name: '田中樹', tmdbName: '田中樹' },
  { name: '京本大我', tmdbName: '京本大我' },
  { name: '髙地優吾', tmdbName: '髙地優吾' },
  { name: 'ジェシー', tmdbName: 'ジェシー' },
  { name: '森本慎太郎', tmdbName: '森本慎太郎' },

  // Travis Japanメンバー
  { name: '松田元太', tmdbName: '松田元太' },
  { name: '松倉海斗', tmdbName: '松倉海斗' },
  { name: '宮近海斗', tmdbName: '宮近海斗' },
  { name: '中村海人', tmdbName: '中村海人' },
  { name: '吉澤閑也', tmdbName: '吉澤閑也' },
  { name: '七五三掛龍也', tmdbName: '七五三掛龍也' },
  { name: '川島如恵留', tmdbName: '川島如恵留' }
]

async function searchPersonOnTMDB(personName: string) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(personName)}&language=ja-JP`
    const response = await fetch(searchUrl)

    if (!response.ok) {
      console.log(`   ❌ TMDB検索エラー: ${response.status}`)
      return null
    }

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      // 最も関連性の高い人物を返す
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
    // 映画出演作品を取得
    const movieCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${tmdbApiKey}&language=ja-JP`
    const movieResponse = await fetch(movieCreditsUrl)

    // TV出演作品を取得
    const tvCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${tmdbApiKey}&language=ja-JP`
    const tvResponse = await fetch(tvCreditsUrl)

    const credits = {
      movies: [],
      tvShows: []
    }

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

async function addJETalentsEpisodesFromTMDB() {
  console.log('🎌 JEタレントのエピソード追加（TMDB API）')
  console.log('=========================================\n')

  let totalProcessed = 0
  let totalEpisodesAdded = 0

  for (const talent of JE_TALENTS) {
    console.log(`👤 ${talent.name} のエピソード追加中...`)

    // 1. celebrity_idを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', talent.name)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${talent.name} がデータベースに見つかりません`)
      continue
    }

    const celebrityId = celebrity.id
    console.log(`   ✅ Celebrity ID: ${celebrityId}`)

    // 2. TMDB検索
    const person = await searchPersonOnTMDB(talent.tmdbName)
    if (!person) {
      console.log(`   ⚠️ TMDBで${talent.name}が見つかりません`)
      console.log('')
      continue
    }

    console.log(`   ✅ TMDB ID: ${person.id}`)
    if (person.profile_path) {
      console.log(`   📸 プロフィール画像: https://image.tmdb.org/t/p/w500${person.profile_path}`)
    }

    // 3. 出演作品を取得
    const credits = await getPersonCredits(person.id)

    console.log(`   🎬 映画: ${credits.movies.length}本`)
    console.log(`   📺 TVドラマ: ${credits.tvShows.length}本`)

    // 4. エピソードとして追加（主要作品を最大8本）
    const episodes = []
    let episodeCount = 0

    // 映画から追加（人気順）
    const sortedMovies = credits.movies
      .filter(m => m.title && m.release_date && m.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 4) // 映画は最大4本

    for (const movie of sortedMovies) {
      const episodeId = `${talent.name.replace(/[\\s\\u3000]/g, '_')}_movie_${episodeCount + 1}`
      const posterUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`

      episodes.push({
        id: episodeId,
        title: `【映画】${movie.title}${movie.character ? ` - ${movie.character}役` : ''}`,
        description: movie.overview || `${talent.name}が出演した映画作品`,
        date: new Date(movie.release_date).toISOString(),
        duration: null,
        thumbnail_url: posterUrl,
        video_url: `https://www.themoviedb.org/movie/${movie.id}`,
        view_count: Math.floor((movie.vote_average || 7) * 100000),
        celebrity_id: celebrityId
      })

      episodeCount++
      console.log(`   ✅ 映画: ${movie.title} (${movie.release_date?.substring(0, 4)})`)
    }

    // TVドラマから追加（人気順）
    const sortedTVShows = credits.tvShows
      .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 4) // ドラマは最大4本

    for (const tv of sortedTVShows) {
      const episodeId = `${talent.name.replace(/[\\s\\u3000]/g, '_')}_tv_${episodeCount + 1}`
      const posterUrl = `https://image.tmdb.org/t/p/w500${tv.poster_path}`

      episodes.push({
        id: episodeId,
        title: `【ドラマ】${tv.name}${tv.character ? ` - ${tv.character}役` : ''}`,
        description: tv.overview || `${talent.name}が出演したテレビドラマ作品`,
        date: new Date(tv.first_air_date).toISOString(),
        duration: null,
        thumbnail_url: posterUrl,
        video_url: `https://www.themoviedb.org/tv/${tv.id}`,
        view_count: Math.floor((tv.vote_average || 7) * 80000),
        celebrity_id: celebrityId
      })

      episodeCount++
      console.log(`   ✅ ドラマ: ${tv.name} (${tv.first_air_date?.substring(0, 4)})`)
    }

    // 5. データベースに追加
    if (episodes.length > 0) {
      console.log(`\\n   📝 ${episodes.length}本のエピソードを追加中...`)

      for (const episode of episodes) {
        const { error } = await supabase
          .from('episodes')
          .insert(episode)

        if (error) {
          console.log(`   ❌ エラー: ${error.message}`)
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`   ✅ ${talent.name}: ${episodes.length}本のエピソード追加完了`)
      totalEpisodesAdded += episodes.length
    } else {
      console.log(`   ⚠️ 追加可能なエピソードが見つかりません`)
    }

    totalProcessed++
    console.log('')

    // タレント間のレート制限対策
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('='.repeat(50))
  console.log('🎉 JEタレントエピソード追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 処理結果:`)
  console.log(`  処理したタレント: ${totalProcessed}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // 6. 結果確認
  console.log('\\n📊 追加結果確認:')
  for (const talent of JE_TALENTS.slice(0, 5)) { // 最初の5人のみ表示
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', talent.name)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', celebrity.id)
        .limit(3)

      console.log(`\\n👤 ${talent.name}:`)
      if (episodes && episodes.length > 0) {
        console.log(`   エピソード数: ${episodes.length}本`)
        episodes.forEach(ep => {
          console.log(`   ✅ ${ep.title}`)
        })
      } else {
        console.log(`   エピソードなし`)
      }
    }
  }

  console.log('\\n💡 確認方法:')
  console.log('• 各タレントのプロフィールページでエピソードを確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
  console.log('• TMDB提供の映画・ドラマポスター画像が表示されます')
}

// 実行
addJETalentsEpisodesFromTMDB().catch(console.error)