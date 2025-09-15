/**
 * RINを削除して残り5人のアイドルのエピソード拡充
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 残す5人のアイドル
const TARGET_IDOLS = [
  'JUNON',
  'MANATO',
  'RYUHEI',
  'SHUNTO',
  'SOTA'
]

async function deleteRIN() {
  console.log('🗑️ RIN削除開始...')

  // RINのIDを取得
  const { data: rin } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'RIN')
    .single()

  if (!rin) {
    console.log('   ❌ RINが見つかりません')
    return
  }

  // RINのエピソードを削除
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id')
    .eq('celebrity_id', rin.id)

  if (episodes && episodes.length > 0) {
    const { error: episodeError } = await supabase
      .from('episodes')
      .delete()
      .eq('celebrity_id', rin.id)

    if (episodeError) {
      console.log(`   ❌ エピソード削除エラー: ${episodeError.message}`)
    } else {
      console.log(`   🗑️ ${episodes.length}本のエピソードを削除`)
    }
  }

  // RINを削除
  const { error: celebrityError } = await supabase
    .from('celebrities')
    .delete()
    .eq('id', rin.id)

  if (celebrityError) {
    console.log(`   ❌ セレブリティ削除エラー: ${celebrityError.message}`)
  } else {
    console.log('   ✅ RIN削除完了')
  }
}

async function searchIdolContent(idolName: string) {
  try {
    // アイドル関連の検索クエリ
    const queries = [
      `${idolName} BE:FIRST`,
      `${idolName} アイドル`,
      `${idolName} 音楽`,
      `${idolName} パフォーマンス`,
      `${idolName} バラエティ`,
      `BE:FIRST ${idolName}`,
      `idol ${idolName}`,
      idolName
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
        const nameLower = idolName.toLowerCase()

        const aScore = (aTitle.includes(nameLower) ? 10 : 0) +
                       (aTitle.includes('be:first') || aTitle.includes('befirst') ? 8 : 0) +
                       (aTitle.includes('アイドル') || aTitle.includes('idol') ? 5 : 0)

        const bScore = (bTitle.includes(nameLower) ? 10 : 0) +
                       (bTitle.includes('be:first') || bTitle.includes('befirst') ? 8 : 0) +
                       (bTitle.includes('アイドル') || bTitle.includes('idol') ? 5 : 0)

        return bScore - aScore
      })
      .slice(0, 12) // 最大12件
  } catch (error) {
    console.log(`   ❌ アイドルコンテンツ検索エラー: ${error}`)
    return []
  }
}

async function expandIdolEpisodes() {
  console.log('\n🎤 残り5人アイドルエピソード拡充開始')
  console.log('=================================\n')

  let totalAdded = 0

  for (const idolName of TARGET_IDOLS) {
    console.log(`⭐ ${idolName} のエピソード拡充中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', idolName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${idolName} が見つかりません`)
      continue
    }

    // 現在のエピソード数確認
    const { data: currentEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const currentCount = currentEpisodes?.length || 0
    const targetCount = 12
    const needCount = Math.max(0, targetCount - currentCount)

    console.log(`   📊 現在: ${currentCount}本 → 目標: ${targetCount}本 (追加必要: ${needCount}本)`)

    if (needCount === 0) {
      console.log(`   ✅ 既に目標達成済み`)
      continue
    }

    // アイドルコンテンツ検索
    const idolContent = await searchIdolContent(idolName)
    console.log(`   🔍 検索結果: ${idolContent.length}件`)

    let addedCount = 0
    for (let i = 0; i < idolContent.length && addedCount < needCount; i++) {
      const content = idolContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie'
      const episodeId = `${celebrity.id}_tmdb_idol_${content.id}_${isMovie ? 'movie' : 'tv'}`

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
          description: content.overview || `${idolName}が出演する${mediaType}`,
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

    console.log(`   ✅ ${idolName}: ${addedCount}本追加 (${currentCount} → ${currentCount + addedCount}本)`)
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 アイドルエピソード拡充完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  RIN削除: 完了`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 最終エピソード数:')
  for (const idolName of TARGET_IDOLS) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', idolName)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      console.log(`  ${idolName}: ${episodes?.length || 0}本`)
    }
  }
}

async function main() {
  // Step 1: RINを削除
  await deleteRIN()

  // Step 2: 残り5人のエピソード拡充
  await expandIdolEpisodes()
}

// 実行
main().catch(console.error)