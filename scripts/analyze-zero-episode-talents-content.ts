/**
 * エピソード0本タレントのコンテンツタイプ分析
 * ロケーション・アイテム紐付け可能性を評価
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// エピソード0本のタレント
const ZERO_EPISODE_TALENTS = [
  { name: '吉澤閑也', type: 'celebrity', group: 'Travis Japan' },
  { name: '本田圭佑', type: 'サッカー選手', group: null },
  { name: '古川優香', type: 'モデル', group: null },
  { name: '前田裕二', type: '実業家', group: 'SHOWROOM' },
  { name: 'りゅうじ', type: '料理研究家', group: null }
]

async function analyzeYouTubeContent(searchQuery: string) {
  try {
    console.log(`   🔍 YouTube検索: "${searchQuery}"`)

    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      console.log(`   ❌ YouTube検索失敗: ${searchResponse.status}`)
      return []
    }

    const searchData = await searchResponse.json()
    const videos = searchData.items || []

    return videos.map(video => ({
      title: video.snippet.title,
      description: video.snippet.description?.substring(0, 200) || '',
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt
    }))
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー: ${error}`)
    return []
  }
}

async function analyzeTMDBContent(searchQuery: string) {
  try {
    console.log(`   🎬 TMDB検索: "${searchQuery}"`)

    // 人物検索
    const personResponse = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(searchQuery)}&language=ja-JP`
    )

    if (!personResponse.ok) {
      console.log(`   ❌ TMDB人物検索失敗: ${personResponse.status}`)
      return { movies: [], tvShows: [] }
    }

    const personData = await personResponse.json()
    const persons = personData.results || []

    if (persons.length === 0) {
      console.log(`   ⚠️ TMDB人物が見つかりません`)
      return { movies: [], tvShows: [] }
    }

    const person = persons[0]
    console.log(`   ✅ 人物発見: ${person.name} (ID: ${person.id})`)

    await new Promise(resolve => setTimeout(resolve, 300))

    // その人の出演作品を取得
    const creditsResponse = await fetch(
      `https://api.themoviedb.org/3/person/${person.id}/combined_credits?api_key=${tmdbApiKey}&language=ja-JP`
    )

    if (!creditsResponse.ok) {
      console.log(`   ❌ TMDB出演作品取得失敗`)
      return { movies: [], tvShows: [] }
    }

    const creditsData = await creditsResponse.json()

    const movies = (creditsData.cast || [])
      .filter(item => item.media_type === 'movie')
      .slice(0, 5)
      .map(movie => ({
        title: movie.title,
        overview: movie.overview?.substring(0, 100) || '',
        releaseDate: movie.release_date,
        character: movie.character
      }))

    const tvShows = (creditsData.cast || [])
      .filter(item => item.media_type === 'tv')
      .slice(0, 5)
      .map(show => ({
        title: show.name,
        overview: show.overview?.substring(0, 100) || '',
        firstAirDate: show.first_air_date,
        character: show.character
      }))

    return { movies, tvShows }
  } catch (error) {
    console.log(`   ❌ TMDB検索エラー: ${error}`)
    return { movies: [], tvShows: [] }
  }
}

function evaluateLocationItemPotential(videos: any[], movies: any[], tvShows: any[], talentType: string) {
  console.log(`   📊 ロケーション・アイテム紐付け可能性評価:`)

  let locationPotential = 0
  let itemPotential = 0
  let recommendations = []

  // YouTubeコンテンツ分析
  const locationKeywords = ['旅行', '旅', 'グルメ', '食べ', 'カフェ', 'レストラン', '散歩', 'デート', '買い物', 'ショッピング', '体験', 'ロケ', '訪問']
  const itemKeywords = ['購入', '買った', '紹介', '開封', 'レビュー', 'コーデ', 'メイク', 'グッズ', 'アイテム', '料理', '作り方']

  videos.forEach(video => {
    const text = `${video.title} ${video.description}`.toLowerCase()

    locationKeywords.forEach(keyword => {
      if (text.includes(keyword)) locationPotential++
    })

    itemKeywords.forEach(keyword => {
      if (text.includes(keyword)) itemPotential++
    })
  })

  // タレントタイプ別分析
  switch (talentType) {
    case '料理研究家':
      locationPotential += 3 // レストラン、市場等
      itemPotential += 5     // 食材、調理器具等
      recommendations.push('料理動画は食材・調理器具の宝庫')
      recommendations.push('レストラン訪問で地理情報も豊富')
      break

    case 'モデル':
      locationPotential += 2 // 撮影地、ショップ等
      itemPotential += 4     // ファッション、コスメ等
      recommendations.push('ファッション・コスメ系アイテム多数')
      recommendations.push('撮影地やショップ情報')
      break

    case 'サッカー選手':
      locationPotential += 2 // スタジアム、合宿地等
      itemPotential += 3     // スポーツ用品等
      recommendations.push('スタジアム・練習場等のロケーション')
      recommendations.push('スポーツ用品・ウェア等')
      break

    case '実業家':
      locationPotential += 1 // オフィス等
      itemPotential += 2     // ガジェット等
      recommendations.push('ビジネス系ガジェット・書籍')
      recommendations.push('オフィス・会議室等')
      break

    case 'celebrity':
      locationPotential += 2 // バラエティ番組ロケ地等
      itemPotential += 3     // 番組グッズ等
      recommendations.push('TV番組ロケ地情報')
      recommendations.push('番組関連グッズ・衣装')
      break
  }

  // 映画・TV番組からの追加ポイント
  movies.forEach(movie => {
    locationPotential += 1 // 撮影地
    itemPotential += 1     // 衣装・小道具
  })

  tvShows.forEach(show => {
    locationPotential += 1 // 撮影地
    itemPotential += 1     // 衣装・小道具
  })

  const totalPotential = locationPotential + itemPotential
  let rating = '⭐'

  if (totalPotential >= 15) rating = '⭐⭐⭐⭐⭐'
  else if (totalPotential >= 10) rating = '⭐⭐⭐⭐'
  else if (totalPotential >= 7) rating = '⭐⭐⭐'
  else if (totalPotential >= 4) rating = '⭐⭐'

  console.log(`     📍 ロケーション可能性: ${locationPotential}点`)
  console.log(`     🛍️ アイテム可能性: ${itemPotential}点`)
  console.log(`     🎯 総合評価: ${rating} (${totalPotential}点)`)

  if (recommendations.length > 0) {
    console.log(`     💡 推奨理由:`)
    recommendations.forEach(rec => console.log(`       • ${rec}`))
  }

  return { locationPotential, itemPotential, totalPotential, rating, recommendations }
}

async function analyzeZeroEpisodeTalents() {
  console.log('📊 エピソード0本タレント コンテンツ分析')
  console.log('=========================================')
  console.log('🎯 目的: ロケーション・アイテム紐付け可能性評価\\n')

  const analysisResults = []

  for (const talent of ZERO_EPISODE_TALENTS) {
    console.log(`👤 ${talent.name} (${talent.type}) の分析中...`)

    // YouTube検索
    const searchQueries = [
      talent.name,
      talent.group ? `${talent.name} ${talent.group}` : `${talent.name} ${talent.type}`
    ]

    let allVideos = []
    for (const query of searchQueries) {
      const videos = await analyzeYouTubeContent(query)
      allVideos = [...allVideos, ...videos]
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // 重複除去
    const uniqueVideos = allVideos.filter((video, index, self) =>
      index === self.findIndex(v => v.title === video.title)
    )

    console.log(`   📺 YouTube動画: ${uniqueVideos.length}本発見`)

    // TMDB検索
    const tmdbContent = await analyzeTMDBContent(talent.name)
    console.log(`   🎬 TMDB: 映画${tmdbContent.movies.length}本、TV番組${tmdbContent.tvShows.length}本`)

    // 紐付け可能性評価
    const evaluation = evaluateLocationItemPotential(
      uniqueVideos,
      tmdbContent.movies,
      tmdbContent.tvShows,
      talent.type
    )

    analysisResults.push({
      name: talent.name,
      type: talent.type,
      youtubeVideos: uniqueVideos.length,
      movies: tmdbContent.movies.length,
      tvShows: tmdbContent.tvShows.length,
      ...evaluation
    })

    console.log(`   ✅ ${talent.name} 分析完了\\n`)

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // 結果サマリー
  console.log('\\n' + '='.repeat(60))
  console.log('🎯 ロケーション・アイテム紐付け可能性ランキング')
  console.log('='.repeat(60))

  analysisResults
    .sort((a, b) => b.totalPotential - a.totalPotential)
    .forEach((result, index) => {
      console.log(`\\n${index + 1}位: ${result.name} (${result.type})`)
      console.log(`   ${result.rating} 総合${result.totalPotential}点 (ロケーション${result.locationPotential}点 + アイテム${result.itemPotential}点)`)
      console.log(`   📺 YouTube: ${result.youtubeVideos}本 | 🎬 映画: ${result.movies}本 | 📺 TV: ${result.tvShows}本`)

      if (result.recommendations.length > 0) {
        console.log(`   💡 ${result.recommendations[0]}`)
      }
    })

  // 推奨拡充順序
  console.log(`\\n\\n🚀 推奨拡充順序:`)
  analysisResults
    .sort((a, b) => b.totalPotential - a.totalPotential)
    .forEach((result, index) => {
      const priority = index < 2 ? '🔥 最優先' : index < 4 ? '📈 優先' : '⭐ 通常'
      console.log(`${index + 1}. ${result.name} - ${priority} (${result.rating})`)
    })
}

// 実行
analyzeZeroEpisodeTalents().catch(console.error)