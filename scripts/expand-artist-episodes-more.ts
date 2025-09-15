/**
 * アーティストのエピソードをさらに増加（より広範囲な検索）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 既存アーティスト（エピソード少ない順）
const TARGET_ARTISTS = [
  { name: '米津玄師', current: 4, target: 12 },
  { name: 'あいみょん', current: 4, target: 12 },
  { name: 'King Gnu', current: 9, target: 15 },
  { name: 'YOASOBI', current: 10, target: 15 },
  { name: 'Official髭男dism', current: 10, target: 15 }
]

async function searchExtendedContent(artistName: string) {
  try {
    // より広範囲な検索クエリ
    const queries = [
      `${artistName} ミュージックビデオ`,
      `${artistName} PV`,
      `${artistName} 特集`,
      `${artistName} 出演`,
      `${artistName} インタビュー`,
      `${artistName} バラエティ`,
      `${artistName} 歌番組`,
      `music ${artistName}`,
      `interview ${artistName}`,
      artistName
    ]

    const allResults = []

    for (const query of queries) {
      // 映画検索
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        allResults.push(...(movieData.results || []).map(item => ({ ...item, media_type: 'movie' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // TV検索
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        allResults.push(...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 重複除去
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex(other => other.id === item.id && other.media_type === item.media_type)
    )

    // 関連度でソート（アーティスト名が含まれるものを優先）
    const sorted = uniqueResults.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase()
      const bTitle = (b.title || b.name || '').toLowerCase()
      const aDesc = (a.overview || '').toLowerCase()
      const bDesc = (b.overview || '').toLowerCase()
      const artistLower = artistName.toLowerCase()

      const aScore = (aTitle.includes(artistLower) ? 10 : 0) +
                     (aDesc.includes(artistLower) ? 5 : 0) +
                     (aDesc.includes('音楽') || aDesc.includes('ライブ') || aDesc.includes('コンサート') ? 3 : 0)
      const bScore = (bTitle.includes(artistLower) ? 10 : 0) +
                     (bDesc.includes(artistLower) ? 5 : 0) +
                     (bDesc.includes('音楽') || bDesc.includes('ライブ') || bDesc.includes('コンサート') ? 3 : 0)

      return bScore - aScore
    })

    return sorted.slice(0, 20) // 最大20件
  } catch (error) {
    console.log(`   ❌ 拡張検索エラー: ${error}`)
    return []
  }
}

async function expandArtistEpisodesMore() {
  console.log('🎵 アーティストエピソード拡張開始（第2弾）')
  console.log('======================================\n')

  let totalAdded = 0

  for (const artist of TARGET_ARTISTS) {
    console.log(`🎤 ${artist.name} のエピソード拡張中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', artist.name)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${artist.name} が見つかりません`)
      continue
    }

    // 拡張検索
    const extendedContent = await searchExtendedContent(artist.name)
    console.log(`   🔍 拡張検索結果: ${extendedContent.length}件`)

    const needCount = artist.target - artist.current

    let addedCount = 0
    for (let i = 0; i < extendedContent.length && addedCount < needCount; i++) {
      const content = extendedContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie'
      const episodeId = `${celebrity.id}_tmdb_ext_${content.id}_${isMovie ? 'movie' : 'tv'}`

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
          description: content.overview || `${artist.name}に関連する${mediaType}コンテンツ`,
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

      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`   ✅ ${artist.name}: ${addedCount}本追加 (${artist.current} → ${artist.current + addedCount}本)`)
    await new Promise(resolve => setTimeout(resolve, 1500))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 アーティストエピソード拡張完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 更新後エピソード数:')
  for (const artist of TARGET_ARTISTS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', artist.name)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      console.log(`  ${artist.name}: ${episodes?.length || 0}本`)
    }
  }
}

// 実行
expandArtistEpisodesMore().catch(console.error)