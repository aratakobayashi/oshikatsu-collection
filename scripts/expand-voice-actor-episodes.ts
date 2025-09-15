/**
 * 声優のエピソードを13本→20本に拡張（TMDB API使用）
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 全声優リスト
const VOICE_ACTORS = [
  '下野紘', '中村悠一', '佐倉綾音', '宮野真守', '小倉唯',
  '悠木碧', '早見沙織', '杉田智和', '東山奈央', '松岡禎丞',
  '梶裕貴', '櫻井孝宏', '水瀬いのり', '石田彰', '神谷浩史',
  '竹達彩奈', '花澤香菜', '茅野愛衣', '高橋李依'
]

async function searchAnimeContent(voiceActorName: string) {
  try {
    // アニメ関連の検索クエリ
    const queries = [
      `${voiceActorName} アニメ`,
      `${voiceActorName} 声優`,
      `${voiceActorName} キャラクター`,
      `anime ${voiceActorName}`,
      `voice actor ${voiceActorName}`,
      voiceActorName
    ]

    const allResults = []

    for (const query of queries) {
      // TV検索（アニメ中心）
      const tvResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}&language=ja`
      )

      if (tvResponse.ok) {
        const tvData = await tvResponse.json()
        allResults.push(...(tvData.results || []).map(item => ({ ...item, media_type: 'tv' })))
      }

      await new Promise(resolve => setTimeout(resolve, 200))

      // 映画検索（アニメ映画）
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

    // アニメ関連度でソート
    const sorted = uniqueResults.sort((a, b) => {
      const aTitle = (a.title || a.name || '').toLowerCase()
      const bTitle = (b.title || b.name || '').toLowerCase()
      const aDesc = (a.overview || '').toLowerCase()
      const bDesc = (b.overview || '').toLowerCase()
      const actorLower = voiceActorName.toLowerCase()

      const aScore = (aTitle.includes(actorLower) ? 10 : 0) +
                     (aDesc.includes(actorLower) ? 5 : 0) +
                     (aDesc.includes('アニメ') || aDesc.includes('anime') ? 5 : 0) +
                     (aDesc.includes('声優') || aDesc.includes('voice') ? 3 : 0) +
                     (a.genre_ids?.includes(16) ? 8 : 0) // 16 = Animation genre

      const bScore = (bTitle.includes(actorLower) ? 10 : 0) +
                     (bDesc.includes(actorLower) ? 5 : 0) +
                     (bDesc.includes('アニメ') || bDesc.includes('anime') ? 5 : 0) +
                     (bDesc.includes('声優') || bDesc.includes('voice') ? 3 : 0) +
                     (b.genre_ids?.includes(16) ? 8 : 0)

      return bScore - aScore
    })

    return sorted.slice(0, 15) // 最大15件
  } catch (error) {
    console.log(`   ❌ アニメコンテンツ検索エラー: ${error}`)
    return []
  }
}

async function expandVoiceActorEpisodes() {
  console.log('🎭 声優エピソード拡張開始（13本→20本）')
  console.log('====================================\n')

  let totalAdded = 0
  let processedCount = 0

  for (const voiceActorName of VOICE_ACTORS) {
    console.log(`🎤 ${voiceActorName} のエピソード拡張中... (${processedCount + 1}/${VOICE_ACTORS.length})`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', voiceActorName)
      .single()

    if (!celebrity) {
      console.log(`   ❌ ${voiceActorName} が見つかりません`)
      processedCount++
      continue
    }

    // 現在のエピソード数確認
    const { data: currentEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    const currentCount = currentEpisodes?.length || 0
    const needCount = Math.max(0, 20 - currentCount)

    if (needCount === 0) {
      console.log(`   ✅ 既に20本以上あります (${currentCount}本)`)
      processedCount++
      continue
    }

    // アニメコンテンツ検索
    const animeContent = await searchAnimeContent(voiceActorName)
    console.log(`   🔍 検索結果: ${animeContent.length}件`)

    let addedCount = 0
    for (let i = 0; i < animeContent.length && addedCount < needCount; i++) {
      const content = animeContent[i]

      const title = content.title || content.name
      if (!title) continue

      const isMovie = content.media_type === 'movie'
      const episodeId = `${celebrity.id}_tmdb_anime_${content.id}_${isMovie ? 'movie' : 'tv'}`

      // 重複チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', episodeId)
        .single()

      if (existing) continue

      const releaseDate = content.release_date || content.first_air_date
      const year = releaseDate ? new Date(releaseDate).getFullYear() : ''
      const mediaType = isMovie ? 'アニメ映画' : 'アニメTV'

      const { error } = await supabase
        .from('episodes')
        .insert({
          id: episodeId,
          title: `【${mediaType}】${title}${year ? ` (${year})` : ''}`,
          description: content.overview || `${voiceActorName}が出演する${mediaType}作品`,
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

    console.log(`   ✅ ${voiceActorName}: ${addedCount}本追加 (${currentCount} → ${currentCount + addedCount}本)`)
    processedCount++

    // 進行状況表示
    if (processedCount % 5 === 0) {
      console.log(`\n📊 進行状況: ${processedCount}/${VOICE_ACTORS.length}人完了\n`)
    }

    await new Promise(resolve => setTimeout(resolve, 800))
  }

  console.log('\n' + '='.repeat(50))
  console.log('🎉 声優エピソード拡張完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果:`)
  console.log(`  追加したエピソード: ${totalAdded}本`)

  console.log('\n📈 最終エピソード数:')
  for (let i = 0; i < VOICE_ACTORS.length; i++) {
    const voiceActorName = VOICE_ACTORS[i]
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', voiceActorName)
      .single()

    if (celebrity) {
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)

      console.log(`  ${voiceActorName}: ${episodes?.length || 0}本`)
    }

    if ((i + 1) % 5 === 0 && i < VOICE_ACTORS.length - 1) {
      console.log('') // 5人ごとに改行
    }
  }
}

// 実行
expandVoiceActorEpisodes().catch(console.error)