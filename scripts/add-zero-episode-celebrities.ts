/**
 * エピソード0本のタレント・モデル・スポーツ選手のエピソード追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// エピソード0本の対象セレブリティ
const TARGET_CELEBRITIES = [
  // タレント
  { name: '渡辺直美', type: 'タレント' },
  { name: 'りゅうちぇる', type: 'タレント' },
  { name: '武井壮', type: 'タレント' },

  // モデル
  { name: '古川優香', type: 'モデル' },
  { name: '池田美優', type: 'モデル' },
  { name: '藤田ニコル', type: 'モデル' },

  // スポーツ選手
  { name: '本田圭佑', type: 'サッカー選手' }
]

async function searchTMDBPerson(name: string) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(name)}&language=ja`
    )

    if (!response.ok) return null

    const data = await response.json()
    return data.results?.[0] || null
  } catch (error) {
    console.log(`   ❌ TMDB検索エラー: ${error}`)
    return null
  }
}

async function getTMDBCredits(personId: number) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${tmdbApiKey}&language=ja`
    )

    if (!response.ok) return []

    const data = await response.json()
    const allCredits = [...(data.cast || []), ...(data.crew || [])]

    return allCredits
      .filter(credit => credit.release_date || credit.first_air_date)
      .sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date)
        const dateB = new Date(b.release_date || b.first_air_date)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 15) // 最大15件
  } catch (error) {
    console.log(`   ❌ クレジット取得エラー: ${error}`)
    return []
  }
}

async function searchGeneralContent(celebrityName: string, celebrityType: string) {
  try {
    // タイプ別の検索クエリ
    const queries = [
      `${celebrityName}`,
      `${celebrityName} バラエティ`,
      `${celebrityName} 番組`,
      `${celebrityName} 出演`,
      `${celebrityName} ドキュメンタリー`,
      celebrityType === 'サッカー選手' ? `${celebrityName} サッカー` : '',
      celebrityType === 'モデル' ? `${celebrityName} ファッション` : '',
      celebrityType === 'タレント' ? `${celebrityName} エンタメ` : ''
    ].filter(q => q)

    const allResults = []

    for (const query of queries) {
      // TV検索
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        allResults.push(...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // 映画検索
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        allResults.push(...(movieData.results || []).map(item => ({ ...item, media_type: 'movie' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 重複除去とソート
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex(other => other.id === item.id && other.media_type === item.media_type)
    )

    return uniqueResults
      .sort((a, b) => {
        const aTitle = (a.title || a.name || '').toLowerCase()
        const bTitle = (b.title || b.name || '').toLowerCase()
        const nameLower = celebrityName.toLowerCase()

        const aScore = aTitle.includes(nameLower) ? 10 : 0
        const bScore = bTitle.includes(nameLower) ? 10 : 0

        return bScore - aScore
      })
      .slice(0, 12) // 最大12件
  } catch (error) {
    console.log(`   ❌ 一般コンテンツ検索エラー: ${error}`)
    return []
  }
}

async function addZeroEpisodeCelebrities() {
  console.log('⭐ エピソード0本セレブリティ追加開始')
  console.log('=================================\n')

  let totalAdded = 0

  for (const celebrity of TARGET_CELEBRITIES) {
    console.log(`👤 ${celebrity.name} (${celebrity.type}) のエピソード追加中...`)

    // セレブリティIDを取得
    const { data: celebrityData } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', celebrity.name)
      .single()

    if (!celebrityData) {
      console.log(`   ❌ ${celebrity.name} が見つかりません`)
      continue
    }

    // TMDB人物検索
    const person = await searchTMDBPerson(celebrity.name)
    let credits = []

    if (person) {
      console.log(`   ✅ TMDB人物発見: ${person.name}`)
      credits = await getTMDBCredits(person.id)
    }

    // 一般的なコンテンツ検索
    const generalContent = await searchGeneralContent(celebrity.name, celebrity.type)

    const allContent = [...credits, ...generalContent]
    console.log(`   🔍 総コンテンツ: ${allContent.length}件`)

    if (allContent.length === 0) {
      console.log(`   ⚠️ コンテンツが見つかりません`)
      continue
    }

    let addedCount = 0
    for (let i = 0; i < allContent.length && addedCount < 10; i++) {
      const content = allContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie' || !!content.release_date
      const episodeId = `${celebrityData.id}_tmdb_general_${content.id}_${isMovie ? 'movie' : 'tv'}`

      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', episodeId)
        .single()

      if (existing) continue

      const releaseDate = content.release_date || content.first_air_date
      const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
      const mediaType = isMovie ? '映画' : 'TV番組'

      const { error } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${mediaType}】${title}${year ? ` (${year})` : ''}`,
          description: content.overview || `${celebrity.name}が出演する${mediaType}`,
          date: releaseDate ? new Date(releaseDate).toISOString() : new Date().toISOString(),
          duration: null,
          thumbnail_url: content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : null,
          video_url: `https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${content.id}`,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          celebrity_id: celebrityData.id
        })

      if (!error) {
        addedCount++
        totalAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${celebrity.name}: ${addedCount}本追加`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 エピソード0本セレブリティ追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 各セレブリティのエピソード数:')
  for (const celebrity of TARGET_CELEBRITIES) {
    const { data: celebrityData } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', celebrity.name)
      .single()

    if (celebrityData) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrityData.id)

      console.log(`  ${celebrity.name}: ${episodes?.length || 0}本`)
    }
  }
}

// 実行
addZeroEpisodeCelebrities().catch(console.error)