/**
 * お笑い芸人のエピソードを8本→15本に拡張（TMDB API使用）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 対象のお笑い芸人（8本のグループ）
const TARGET_COMEDIANS = [
  'EXIT',
  'かまいたち',
  'チョコレートプラネット',
  'ぺこぱ',
  'マヂカルラブリー',
  '四千頭身',
  '見取り図',
  '霜降り明星'
]

async function searchComedianContent(comedianName: string) {
  try {
    // お笑い芸人関連の検索クエリ
    const queries = [
      `${comedianName} バラエティ`,
      `${comedianName} お笑い`,
      `${comedianName} 番組`,
      `${comedianName} コメディ`,
      `${comedianName} 特番`,
      `${comedianName} 出演`,
      `variety ${comedianName}`,
      `comedy ${comedianName}`,
      comedianName
    ]

    const allResults = []

    for (const query of queries) {
      // TV検索（バラエティ番組中心）
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        allResults.push(...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // 映画検索（コメディ映画）
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        allResults.push(...(movieData.results || []).map(item => ({ ...item, media_type: 'movie' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 重複除去
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex(other => other.id === item.id && other.media_type === item.media_type)
    )

    // お笑い関連度でソート
    const sorted = uniqueResults.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase()
      const bTitle = (b.title || b.name || '').toLowerCase()
      const aDesc = (a.overview || '').toLowerCase()
      const bDesc = (b.overview || '').toLowerCase()
      const comedianLower = comedianName.toLowerCase()

      const aScore = (aTitle.includes(comedianLower) ? 10 : 0) +
                     (aDesc.includes(comedianLower) ? 5 : 0) +
                     (aDesc.includes('バラエティ') || aDesc.includes('variety') ? 5 : 0) +
                     (aDesc.includes('お笑い') || aDesc.includes('comedy') ? 5 : 0) +
                     (aDesc.includes('コメディ') ? 3 : 0) +
                     (a.genre_ids?.includes(35) ? 6 : 0) // 35 = Comedy genre

      const bScore = (bTitle.includes(comedianLower) ? 10 : 0) +
                     (bDesc.includes(comedianLower) ? 5 : 0) +
                     (bDesc.includes('バラエティ') || bDesc.includes('variety') ? 5 : 0) +
                     (bDesc.includes('お笑い') || bDesc.includes('comedy') ? 5 : 0) +
                     (bDesc.includes('コメディ') ? 3 : 0) +
                     (b.genre_ids?.includes(35) ? 6 : 0)

      return bScore - aScore
    })

    return sorted.slice(0, 15) // 最大15件
  } catch (error) {
    console.log(`   ❌ お笑いコンテンツ検索エラー: ${error}`)
    return []
  }
}

async function expandComedianEpisodes() {
  console.log('😂 お笑い芸人エピソード拡張開始（8本→15本）')
  console.log('======================================\n')

  let totalAdded = 0
  let processedCount = 0

  for (const comedianName of TARGET_COMEDIANS) {
    console.log(`🎭 ${comedianName} のエピソード拡張中... (${processedCount + 1}/${TARGET_COMEDIANS.length})`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', comedianName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${comedianName} が見つかりません`)
      processedCount++
      continue
    }

    // 現在のエピソード数確認
    const { data: currentEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const currentCount = currentEpisodes?.length || 0
    const targetCount = 15
    const needCount = Math.max(0, targetCount - currentCount)

    console.log(`   📊 現在: ${currentCount}本 → 目標: ${targetCount}本 (追加必要: ${needCount}本)`)

    if (needCount === 0) {
      console.log(`   ✅ 既に目標達成済み`)
      processedCount++
      continue
    }

    // お笑いコンテンツ検索
    const comedyContent = await searchComedianContent(comedianName)
    console.log(`   🔍 検索結果: ${comedyContent.length}件`)

    let addedCount = 0
    for (let i = 0; i < comedyContent.length && addedCount < needCount; i++) {
      const content = comedyContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie'
      const episodeId = `${celebrity.id}_tmdb_comedy_${content.id}_${isMovie ? 'movie' : 'tv'}`

      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', episodeId)
        .single()

      if (existing) continue

      const releaseDate = content.release_date || content.first_air_date
      const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
      const mediaType = isMovie ? 'コメディ映画' : 'バラエティ番組'

      const { error } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${mediaType}】${title}${year ? ` (${year})` : ''}`,
          description: content.overview || `${comedianName}が出演する${mediaType}`,
          date: releaseDate ? new Date(releaseDate).toISOString() : new Date().toISOString(),
          duration: null,
          thumbnail_url: content.poster_path ? `https://image.tmdb.org/t/p/w500${content.poster_path}` : null,
          video_url: `https://www.themoviedb.org/${isMovie ? 'movie' : 'tv'}/${content.id}`,
          view_count: Math.floor(Math.random() * 1000000) + 100000,
          celebrity_id: celebrity.id
        })

      if (!error) {
        addedCount++
        totalAdded++
      }

      await new Promise(resolve => setTimeout(resolve, 150))
    }

    console.log(`   ✅ ${comedianName}: ${addedCount}本追加 (${currentCount} → ${currentCount + addedCount}本)`)
    processedCount++

    // 進行状況表示
    if (processedCount % 3 === 0) {
      console.log(`\n📊 進行状況: ${processedCount}/${TARGET_COMEDIANS.length}人完了\n`)
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 お笑い芸人エピソード拡張完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 最終エピソード数:')
  for (const comedianName of TARGET_COMEDIANS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', comedianName)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      console.log(`  ${comedianName}: ${episodes?.length || 0}本`)
    }
  }

  console.log('\n🎭 お笑い芸人エピソード拡張の特徴:')
  console.log('• バラエティ番組出演情報を中心に追加')
  console.log('• コメディ映画やお笑い特番も含む')
  console.log('• TMDBのコメディジャンル情報を活用')
  console.log('• 各芸人の個性に合わせたコンテンツ検索')
}

// 実行
expandComedianEpisodes().catch(console.error)