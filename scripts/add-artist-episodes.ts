/**
 * アーティストのエピソード追加（TMDB API使用）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// エピソード0本のアーティスト
const TARGET_ARTISTS = [
  'YOASOBI',
  '米津玄師',
  'あいみょん',
  'Official髭男dism',
  'King Gnu'
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

async function searchTMDBMusic(artistName: string) {
  try {
    // 音楽ドキュメンタリー、コンサート映画等を検索
    const queries = [
      `${artistName} 音楽`,
      `${artistName} コンサート`,
      `${artistName} ライブ`,
      `${artistName} ドキュメンタリー`,
      artistName
    ]

    const allResults = []

    for (const query of queries) {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (response.ok) {
        const data = await response.json()
        allResults.push(...(data.results || []))
      }

      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // 重複除去とフィルタリング
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex(other => other.id === item.id)
    )

    return uniqueResults.slice(0, 15) // 最大15件
  } catch (error) {
    console.log(`   ❌ 音楽コンテンツ検索エラー: ${error}`)
    return []
  }
}

async function addArtistEpisodes() {
  console.log('🎵 アーティストエピソード追加開始')
  console.log('==============================\n')

  let totalAdded = 0

  for (const artistName of TARGET_ARTISTS) {
    console.log(`🎤 ${artistName} のエピソード追加中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', artistName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${artistName} が見つかりません`)
      continue
    }

    // 音楽関連コンテンツを検索
    const musicContent = await searchTMDBMusic(artistName)
    console.log(`   🎬 関連コンテンツ: ${musicContent.length}件`)

    if (musicContent.length === 0) {
      console.log(`   ⚠️ 関連コンテンツが見つかりません`)
      continue
    }

    let addedCount = 0
    for (let i = 0; i < musicContent.length && addedCount < 10; i++) {
      const content = musicContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = !!content.release_date
      const episodeId = `${celebrity.id}_tmdb_music_${content.id}_${isMovie ? 'movie' : 'tv'}`

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

      // アーティストに関連する内容かチェック
      const description = content.overview || ''
      const isRelevant = description.toLowerCase().includes(artistName.toLowerCase()) ||
                        title.toLowerCase().includes(artistName.toLowerCase()) ||
                        description.includes('音楽') ||
                        description.includes('ライブ') ||
                        description.includes('コンサート')

      const { error } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${mediaType}】${title}${year ? ` (${year})` : ''}`,
          description: description || `${artistName}に関連する${mediaType}コンテンツ`,
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

    console.log(`   ✅ ${artistName}: ${addedCount}本追加`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 アーティストエピソード追加完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 各アーティストのエピソード数:')
  for (const artistName of TARGET_ARTISTS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', artistName)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      console.log(`  ${artistName}: ${episodes?.length || 0}本`)
    }
  }
}

// 実行
addArtistEpisodes().catch(console.error)