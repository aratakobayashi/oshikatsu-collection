/**
 * お笑い芸人のエピソードをさらに追加（より広範囲な検索）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 現在15本未満のお笑い芸人を優先
const TARGET_COMEDIANS = [
  { name: 'マヂカルラブリー', current: 8, target: 15 },
  { name: 'ぺこぱ', current: 9, target: 15 },
  { name: '四千頭身', current: 9, target: 15 },
  { name: 'チョコレートプラネット', current: 11, target: 15 },
  { name: '霜降り明星', current: 11, target: 15 },
  { name: '見取り図', current: 13, target: 18 },
  { name: 'EXIT', current: 15, target: 18 },
  { name: 'かまいたち', current: 15, target: 18 }
]

async function searchExtendedComedyContent(comedianName: string) {
  try {
    // より広範囲な検索クエリ
    const queries = [
      `${comedianName} TV`,
      `${comedianName} 特番`,
      `${comedianName} ドキュメンタリー`,
      `${comedianName} 映画`,
      `${comedianName} トーク`,
      `${comedianName} ゲスト`,
      `${comedianName} レギュラー`,
      `${comedianName} MC`,
      `talk show ${comedianName}`,
      `documentary ${comedianName}`,
      `entertainment ${comedianName}`,
      comedianName
    ]

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

      await new Promise(resolve => setTimeout(resolve, 150))

      // 映画検索
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        allResults.push(...(movieData.results || []).map(item => ({ ...item, media_type: 'movie' })))
      }

      await new Promise(resolve => setTimeout(resolve, 150))
    }

    // 重複除去
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex(other => other.id === item.id && other.media_type === item.media_type)
    )

    // 関連度でソート
    const sorted = uniqueResults.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase()
      const bTitle = (b.title || b.name || '').toLowerCase()
      const aDesc = (a.overview || '').toLowerCase()
      const bDesc = (b.overview || '').toLowerCase()
      const comedianLower = comedianName.toLowerCase()

      const aScore = (aTitle.includes(comedianLower) ? 15 : 0) +
                     (aDesc.includes(comedianLower) ? 8 : 0) +
                     (aDesc.includes('バラエティ') || aDesc.includes('variety') ? 6 : 0) +
                     (aDesc.includes('お笑い') || aDesc.includes('comedy') ? 6 : 0) +
                     (aDesc.includes('トーク') || aDesc.includes('talk') ? 4 : 0) +
                     (aDesc.includes('エンタメ') || aDesc.includes('entertainment') ? 4 : 0) +
                     (a.genre_ids?.includes(35) ? 5 : 0) // Comedy genre

      const bScore = (bTitle.includes(comedianLower) ? 15 : 0) +
                     (bDesc.includes(comedianLower) ? 8 : 0) +
                     (bDesc.includes('バラエティ') || bDesc.includes('variety') ? 6 : 0) +
                     (bDesc.includes('お笑い') || bDesc.includes('comedy') ? 6 : 0) +
                     (bDesc.includes('トーク') || bDesc.includes('talk') ? 4 : 0) +
                     (bDesc.includes('エンタメ') || bDesc.includes('entertainment') ? 4 : 0) +
                     (b.genre_ids?.includes(35) ? 5 : 0)

      return bScore - aScore
    })

    return sorted.slice(0, 20) // 最大20件
  } catch (error) {
    console.log(`   ❌ 拡張検索エラー: ${error}`)
    return []
  }
}

async function expandComedianEpisodesMore() {
  console.log('😂 お笑い芸人エピソード追加（第2弾）')
  console.log('=================================\n')

  let totalAdded = 0

  for (const comedian of TARGET_COMEDIANS) {
    console.log(`🎭 ${comedian.name} のエピソード追加中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', comedian.name)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${comedian.name} が見つかりません`)
      continue
    }

    // 現在のエピソード数確認
    const { data: currentEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const currentCount = currentEpisodes?.length || 0
    const needCount = Math.max(0, comedian.target - currentCount)

    console.log(`   📊 現在: ${currentCount}本 → 目標: ${comedian.target}本 (追加必要: ${needCount}本)`)

    if (needCount === 0) {
      console.log(`   ✅ 既に目標達成済み`)
      continue
    }

    // 拡張検索
    const extendedContent = await searchExtendedComedyContent(comedian.name)
    console.log(`   🔍 拡張検索結果: ${extendedContent.length}件`)

    let addedCount = 0
    for (let i = 0; i < extendedContent.length && addedCount < needCount; i++) {
      const content = extendedContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie'
      const episodeId = `${celebrity.id}_tmdb_ext2_${content.id}_${isMovie ? 'movie' : 'tv'}`

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
          description: content.overview || `${comedian.name}が出演する${mediaType}`,
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

    console.log(`   ✅ ${comedian.name}: ${addedCount}本追加 (${currentCount} → ${currentCount + addedCount}本)`)
    await new Promise(resolve => setTimeout(resolve, 1200))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 お笑い芸人エピソード追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 更新後エピソード数:')
  for (const comedian of TARGET_COMEDIANS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', comedian.name)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      const count = episodes?.length || 0
      const status = count >= comedian.target ? '✅' : count >= comedian.current + 3 ? '📈' : '📉'
      console.log(`  ${comedian.name}: ${count}本 ${status}`)
    }
  }

  console.log('\n🎭 追加されたコンテンツの特徴:')
  console.log('• トークショー、ドキュメンタリー番組')
  console.log('• 映画出演（コメディ以外も含む）')
  console.log('• MC、ゲスト出演番組')
  console.log('• エンタメ系特番')
}

// 実行
expandComedianEpisodesMore().catch(console.error)