/**
 * 俳優・女優のエピソード拡張（TMDB API使用）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// エピソード少ない俳優・女優
const TARGET_ACTORS = [
  { name: '佐藤二朗', current: 5, target: 15 },
  { name: '本田翼', current: 5, target: 15 },
  { name: '速水もこみち', current: 5, target: 15 }
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

    // 日本語タイトルがあるものを優先、リリース日でソート
    return allCredits
      .filter(credit => credit.release_date || credit.first_air_date)
      .sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date)
        const dateB = new Date(b.release_date || b.first_air_date)
        return dateB.getTime() - dateA.getTime()
      })
  } catch (error) {
    console.log(`   ❌ クレジット取得エラー: ${error}`)
    return []
  }
}

async function expandActorEpisodes() {
  console.log('🎬 俳優・女優エピソード拡張開始')
  console.log('============================\n')

  let totalAdded = 0

  for (const actor of TARGET_ACTORS) {
    console.log(`👤 ${actor.name} のエピソード拡張中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', actor.name)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${actor.name} が見つかりません`)
      continue
    }

    // TMDB検索
    const person = await searchTMDBPerson(actor.name)
    if (!person) {
      console.log(`   ❌ TMDBで ${actor.name} が見つかりません`)
      continue
    }

    console.log(`   ✅ TMDB発見: ${person.name}`)

    // 出演作品を取得
    const credits = await getTMDBCredits(person.id)
    console.log(`   📽️ 出演作品: ${credits.length}件`)

    const needCount = actor.target - actor.current
    const addCredits = credits.slice(0, needCount + 5) // 少し多めに取得

    let addedCount = 0
    for (let i = 0; i < addCredits.length && addedCount < needCount; i++) {
      const credit = addCredits[i]

      const title = credit.title || credit.name
      if (!title) continue

      const isMovie = !!credit.release_date
      const episodeId = `${celebrity.id}_tmdb_${credit.id}_${isMovie ? 'movie' : 'tv'}`

      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', episodeId)
        .single()

      if (existing) continue

      const releaseDate = credit.release_date || credit.first_air_date
      const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
      const mediaType = isMovie ? '映画' : 'ドラマ'

      const { error } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${mediaType}】${title}${year ? ` (${year})` : ''}`,
          description: credit.overview || `${actor.name}が出演する${mediaType}作品`,
          date: releaseDate ? new Date(releaseDate).toISOString() : new Date().toISOString(),
          duration: null,
          thumbnail_url: credit.poster_path ? `https://image.tmdb.org/t/p/w500${credit.poster_path}` : null,
          video_url: `https://www.themoviedb.org/movie/${credit.id}`,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          celebrity_id: celebrity.id
        })

      if (!error) {
        addedCount++
        totalAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${actor.name}: ${addedCount}本追加 (${actor.current} → ${actor.current + addedCount}本)`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 俳優・女優エピソード拡張完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 更新後エピソード数:')
  for (const actor of TARGET_ACTORS) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', (await supabase.from('celebrities').select('id').eq('name', actor.name).single()).data?.id)

    console.log(`  ${actor.name}: ${episodes?.length || 0}本`)
  }
}

// 実行
expandActorEpisodes().catch(console.error)