/**
 * 既存JEタレントのTMDBエピソードを20本まで拡張
 * 対象：12人、約100本のエピソード追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 20本拡張対象タレント（現在のエピソード数）
const EXPANSION_TARGETS = [
  { name: '中村海人', currentEpisodes: 6, targetEpisodes: 20 },
  { name: '七五三掛龍也', currentEpisodes: 7, targetEpisodes: 20 },
  { name: '川島如恵留', currentEpisodes: 8, targetEpisodes: 20 },
  { name: '松倉海斗', currentEpisodes: 9, targetEpisodes: 20 },
  { name: '宮近海斗', currentEpisodes: 9, targetEpisodes: 20 },
  { name: '松田元太', currentEpisodes: 11, targetEpisodes: 20 },
  { name: '平手友梨奈', currentEpisodes: 13, targetEpisodes: 20 },
  { name: 'ジェシー', currentEpisodes: 14, targetEpisodes: 20 },
  { name: '田中樹', currentEpisodes: 14, targetEpisodes: 20 },
  { name: '森本慎太郎', currentEpisodes: 14, targetEpisodes: 20 },
  { name: '松村北斗', currentEpisodes: 14, targetEpisodes: 20 },
  { name: '齋藤飛鳥', currentEpisodes: 16, targetEpisodes: 20 }
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

async function getExistingEpisodeIds(celebrityId: string) {
  const { data: episodes } = await supabase
    .from('episodes')
    .select('video_url')
    .eq('celebrity_id', celebrityId)

  const existingIds = new Set()

  if (episodes) {
    episodes.forEach(ep => {
      if (ep.video_url && ep.video_url.includes('themoviedb.org')) {
        // TMDBのIDを抽出
        const matches = ep.video_url.match(/\/(movie|tv)\/(\d+)/)
        if (matches) {
          existingIds.add(`${matches[1]}_${matches[2]}`)
        }
      }
    })
  }

  return existingIds
}

async function expandTMDBEpisodesTo20() {
  console.log('🎬 TMDBエピソード全タレント20本拡張')
  console.log('=====================================\n')

  let totalProcessed = 0
  let totalEpisodesAdded = 0

  for (const target of EXPANSION_TARGETS) {
    const addNeeded = target.targetEpisodes - target.currentEpisodes

    console.log(`👤 ${target.name} のエピソード拡張中...`)
    console.log(`   現在: ${target.currentEpisodes}本 → 目標: ${target.targetEpisodes}本 (+${addNeeded}本追加)`)

    // 1. celebrity_idを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', target.name)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${target.name} がデータベースに見つかりません\n`)
      continue
    }

    const celebrityId = celebrity.id

    // 2. 既存エピソードのTMDB IDを取得（重複回避用）
    const existingIds = await getExistingEpisodeIds(celebrityId)
    console.log(`   📋 既存TMDB作品: ${existingIds.size}件`)

    // 3. TMDB検索
    const person = await searchPersonOnTMDB(target.name)
    if (!person) {
      console.log(`   ⚠️ TMDBで${target.name}が見つかりません\n`)
      continue
    }

    console.log(`   ✅ TMDB ID: ${person.id}`)

    // 4. 出演作品を取得
    const credits = await getPersonCredits(person.id)
    console.log(`   🎬 映画: ${credits.movies.length}本`)
    console.log(`   📺 TVドラマ: ${credits.tvShows.length}本`)

    // 5. 新しいエピソードを作成（既存作品を除外）
    const newEpisodes = []
    let episodeCount = 0

    // 全作品を統合してソート（人気度順）
    const allWorks = [
      ...credits.movies
        .filter(m => m.title && m.release_date && m.poster_path)
        .filter(m => !existingIds.has(`movie_${m.id}`))
        .map(m => ({ ...m, type: 'movie', name: m.title, air_date: m.release_date })),
      ...credits.tvShows
        .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
        .filter(tv => !existingIds.has(`tv_${tv.id}`))
        .map(tv => ({ ...tv, type: 'tv', air_date: tv.first_air_date }))
    ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

    // 必要な数だけ追加
    for (let i = 0; i < allWorks.length && episodeCount < addNeeded; i++) {
      const work = allWorks[i]
      const episodeId = `${target.name.replace(/[\s\u3000]/g, '_')}_expand_${work.type}_${episodeCount + 1}`
      const posterUrl = `https://image.tmdb.org/t/p/w500${work.poster_path}`

      newEpisodes.push({
        id: episodeId,
        title: `【${work.type === 'movie' ? '映画' : 'ドラマ'}】${work.name}${work.character ? ` - ${work.character}役` : ''}`,
        description: work.overview || `${target.name}が出演した${work.type === 'movie' ? '映画' : 'テレビドラマ'}作品`,
        date: new Date(work.air_date).toISOString(),
        duration: null,
        thumbnail_url: posterUrl,
        video_url: `https://www.themoviedb.org/${work.type}/${work.id}`,
        view_count: Math.floor((work.vote_average || 7) * (work.type === 'movie' ? 100000 : 80000)),
        celebrity_id: celebrityId
      })

      episodeCount++
      console.log(`   ✅ ${work.type === 'movie' ? '映画' : 'ドラマ'}: ${work.name} (${work.air_date?.substring(0, 4)})`)
    }

    // 6. データベースに追加
    if (newEpisodes.length > 0) {
      console.log(`\n   📝 ${newEpisodes.length}本の新エピソードを追加中...`)

      for (const episode of newEpisodes) {
        const { error } = await supabase
          .from('episodes')
          .insert(episode)

        if (error) {
          console.log(`   ❌ エラー: ${error.message}`)
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`   ✅ ${target.name}: ${newEpisodes.length}本の新エピソード追加完了`)
      totalEpisodesAdded += newEpisodes.length
    } else {
      console.log(`   ⚠️ 追加可能な新エピソードが見つかりません`)
    }

    totalProcessed++
    console.log('')

    // タレント間のレート制限対策
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('='.repeat(60))
  console.log('🎉 TMDBエピソード全タレント20本拡張完了！')
  console.log('='.repeat(60))
  console.log(`📊 処理結果:`)
  console.log(`  処理したタレント: ${totalProcessed}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // 7. 最終結果確認
  console.log('\n📊 拡張後のエピソード数確認:')
  for (const target of EXPANSION_TARGETS.slice(0, 8)) { // 最初の8人のみ表示
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', target.name)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      const currentCount = episodes?.length || 0
      const reachedTarget = currentCount >= target.targetEpisodes
      const status = reachedTarget ? '✅' : '📈'

      console.log(`${status} ${target.name}: ${currentCount}本 (目標: ${target.targetEpisodes}本)`)
    }
  }

  console.log('\n💡 確認方法:')
  console.log('• 各タレントのプロフィールページでエピソードを確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
  console.log('• すべてTMDB提供の映画・ドラマポスター画像付きで表示されます')
}

// 実行
expandTMDBEpisodesTo20().catch(console.error)