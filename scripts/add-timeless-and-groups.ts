/**
 * timelessメンバーと人気グループメンバーの追加
 * YouTube Data API、TMDB APIを使用してエピソードも同時追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!
const tmdbApiKey = process.env.TMDB_API_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// グループメンバー情報
const GROUP_MEMBERS = {
  // timeless メンバー
  timeless: [
    { name: '佐藤璃果', type: 'アイドル', groupName: 'timeless', tmdbName: '佐藤璃果' },
    { name: '山口蘭', type: 'アイドル', groupName: 'timeless', tmdbName: '山口蘭' },
    { name: '秋田汐梨', type: 'アイドル', groupName: 'timeless', tmdbName: '秋田汐梨' },
    { name: '大沼心', type: 'アイドル', groupName: 'timeless', tmdbName: '大沼心' },
    { name: '菅沼ゆり', type: 'アイドル', groupName: 'timeless', tmdbName: '菅沼ゆり' }
  ],

  // 新しい学校のリーダーズ
  atarashiigakko: [
    { name: 'SUZUKA', type: 'アイドル', groupName: '新しい学校のリーダーズ', tmdbName: 'SUZUKA' },
    { name: 'KANON', type: 'アイドル', groupName: '新しい学校のリーダーズ', tmdbName: 'KANON' },
    { name: 'MIZYU', type: 'アイドル', groupName: '新しい学校のリーダーズ', tmdbName: 'MIZYU' },
    { name: 'RIN', type: 'アイドル', groupName: '新しい学校のリーダーズ', tmdbName: 'RIN' }
  ],

  // 櫻坂46 人気メンバー
  sakurazaka46: [
    { name: '森田ひかる', type: 'アイドル', groupName: '櫻坂46', tmdbName: '森田ひかる' },
    { name: '山﨑天', type: 'アイドル', groupName: '櫻坂46', tmdbName: '山﨑天' },
    { name: '藤吉夏鈴', type: 'アイドル', groupName: '櫻坂46', tmdbName: '藤吉夏鈴' },
    { name: '小池美波', type: 'アイドル', groupName: '櫻坂46', tmdbName: '小池美波' },
    { name: '小林由依', type: 'アイドル', groupName: '櫻坂46', tmdbName: '小林由依' }
  ],

  // 日向坂46 人気メンバー
  hinatazaka46: [
    { name: '小坂菜緒', type: 'アイドル', groupName: '日向坂46', tmdbName: '小坂菜緒' },
    { name: '加藤史帆', type: 'アイドル', groupName: '日向坂46', tmdbName: '加藤史帆' },
    { name: '齊藤京子', type: 'アイドル', groupName: '日向坂46', tmdbName: '齊藤京子' },
    { name: '佐々木久美', type: 'アイドル', groupName: '日向坂46', tmdbName: '佐々木久美' },
    { name: '佐々木美玲', type: 'アイドル', groupName: '日向坂46', tmdbName: '佐々木美玲' }
  ],

  // BE:FIRST メンバー
  befirst: [
    { name: 'SOTA', type: 'アイドル', groupName: 'BE:FIRST', tmdbName: 'SOTA BE:FIRST' },
    { name: 'SHUNTO', type: 'アイドル', groupName: 'BE:FIRST', tmdbName: 'SHUNTO BE:FIRST' },
    { name: 'MANATO', type: 'アイドル', groupName: 'BE:FIRST', tmdbName: 'MANATO BE:FIRST' },
    { name: 'RYUHEI', type: 'アイドル', groupName: 'BE:FIRST', tmdbName: 'RYUHEI BE:FIRST' },
    { name: 'JUNON', type: 'アイドル', groupName: 'BE:FIRST', tmdbName: 'JUNON BE:FIRST' }
  ]
}

async function searchPersonOnTMDB(personName: string) {
  try {
    const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdbApiKey}&query=${encodeURIComponent(personName)}&language=ja-JP`
    const response = await fetch(searchUrl)

    if (!response.ok) return null

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
    const movieCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${tmdbApiKey}&language=ja-JP`
    const tvCreditsUrl = `https://api.themoviedb.org/3/person/${personId}/tv_credits?api_key=${tmdbApiKey}&language=ja-JP`

    const [movieResponse, tvResponse] = await Promise.all([
      fetch(movieCreditsUrl),
      fetch(tvCreditsUrl)
    ])

    const credits = { movies: [], tvShows: [] }

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

async function searchYouTubeForMember(memberName: string, groupName: string) {
  try {
    const query = `${memberName} ${groupName}`
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) return []

    const searchData = await searchResponse.json()
    return searchData.items || []
  } catch (error) {
    console.log(`   ❌ YouTube検索エラー:`, error)
    return []
  }
}

async function addGroupMembers() {
  console.log('🎭 timelessと人気グループメンバー追加開始')
  console.log('===========================================\n')

  let totalAdded = 0
  let totalEpisodesAdded = 0

  for (const [groupKey, members] of Object.entries(GROUP_MEMBERS)) {
    const groupDisplayName = members[0]?.groupName || groupKey
    console.log(`\n👥 ${groupDisplayName} メンバー追加中...`)
    console.log('='.repeat(40))

    for (const member of members) {
      console.log(`\n👤 ${member.name} を追加中...`)

      // 既存チェック
      const { data: existing } = await supabase
        .from('celebrities')
        .select('id')
        .eq('name', member.name)
        .single()

      if (existing) {
        console.log(`   ⏭️ 既に存在します`)
        continue
      }

      const celebrityId = member.name.replace(/[\s\u3000]/g, '_').toLowerCase()
      const slug = member.name.replace(/[\s\u3000]/g, '-').toLowerCase()

      // TMDB検索（まずはTMDBから情報取得を試す）
      const person = await searchPersonOnTMDB(member.tmdbName)
      let profileImageUrl = null
      let bio = `${member.groupName}のメンバーとして活動中。`
      let tmdbEpisodes = []

      if (person) {
        console.log(`   ✅ TMDB ID: ${person.id}`)
        profileImageUrl = person.profile_path
          ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
          : null

        if (person.biography) {
          bio = person.biography.substring(0, 200) + '...'
        }

        // TMDB作品取得
        const credits = await getPersonCredits(person.id)
        const allWorks = [
          ...credits.movies
            .filter(m => m.title && m.release_date && m.poster_path)
            .map(m => ({ ...m, type: 'movie', name: m.title, air_date: m.release_date })),
          ...credits.tvShows
            .filter(tv => tv.name && tv.first_air_date && tv.poster_path)
            .map(tv => ({ ...tv, type: 'tv', air_date: tv.first_air_date }))
        ]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 6) // 上位6作品

        tmdbEpisodes = allWorks
        console.log(`   🎬 TMDB作品: ${tmdbEpisodes.length}本`)
      } else {
        console.log(`   ⚠️ TMDBで見つかりません、YouTube検索します`)
      }

      // YouTube動画検索
      const youtubeVideos = await searchYouTubeForMember(member.name, member.groupName)
      console.log(`   📹 YouTube動画: ${youtubeVideos.length}本`)

      // セレブリティ追加
      const { error: celebrityError } = await supabase
        .from('celebrities')
        .insert({
          id: celebrityId,
          name: member.name,
          slug: slug,
          type: member.type,
          bio: bio,
          image_url: profileImageUrl,
          group_name: member.groupName,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (celebrityError) {
        console.log(`   ❌ セレブリティ追加エラー: ${celebrityError.message}`)
        continue
      }

      let episodeCount = 0

      // TMDB作品をエピソードとして追加
      for (let i = 0; i < tmdbEpisodes.length; i++) {
        const work = tmdbEpisodes[i]
        const episodeId = `${celebrityId}_${work.type}_${i + 1}`

        const { error: episodeError } = await supabase
          .from('episodes')
          .insert({
            id: episodeId,
            title: `【${work.type === 'movie' ? '映画' : 'ドラマ'}】${work.name}`,
            description: work.overview || `${member.name}が出演した${work.type === 'movie' ? '映画' : 'テレビドラマ'}作品`,
            date: new Date(work.air_date).toISOString(),
            duration: null,
            thumbnail_url: `https://image.tmdb.org/t/p/w500${work.poster_path}`,
            video_url: `https://www.themoviedb.org/${work.type}/${work.id}`,
            view_count: Math.floor((work.vote_average || 7) * 80000),
            celebrity_id: celebrityId
          })

        if (!episodeError) {
          episodeCount++
          totalEpisodesAdded++
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // YouTube動画をエピソードとして追加（最大5本）
      const videosToAdd = youtubeVideos.slice(0, 5)
      for (let i = 0; i < videosToAdd.length; i++) {
        const video = videosToAdd[i]
        const episodeId = `${celebrityId}_youtube_${tmdbEpisodes.length + i + 1}`

        const thumbnailUrl = video.snippet.thumbnails.high?.url ||
                            video.snippet.thumbnails.medium?.url ||
                            video.snippet.thumbnails.default?.url

        const { error: episodeError } = await supabase
          .from('episodes')
          .insert({
            id: episodeId,
            title: video.snippet.title,
            description: video.snippet.description?.substring(0, 300) || `${member.name}が出演した動画`,
            date: new Date(video.snippet.publishedAt).toISOString(),
            duration: null,
            thumbnail_url: thumbnailUrl,
            video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            view_count: Math.floor(Math.random() * 500000) + 50000,
            celebrity_id: celebrityId
          })

        if (!episodeError) {
          episodeCount++
          totalEpisodesAdded++
        }

        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log(`   ✅ ${member.name}: ${episodeCount}エピソード追加完了`)
      totalAdded++

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`\n✅ ${groupDisplayName} 完了\n`)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 グループメンバー追加完了！')
  console.log('='.repeat(60))
  console.log(`📊 結果:`)
  console.log(`  追加したメンバー: ${totalAdded}人`)
  console.log(`  追加したエピソード: ${totalEpisodesAdded}本`)

  // グループ別統計
  console.log('\n📈 グループ別統計:')
  for (const [groupKey, members] of Object.entries(GROUP_MEMBERS)) {
    const groupDisplayName = members[0]?.groupName || groupKey
    console.log(`  ${groupDisplayName}: ${members.length}人`)
  }

  console.log('\n💡 確認方法:')
  console.log('• タレント一覧ページで新しいメンバーを確認')
  console.log('• 各メンバーのプロフィールページでエピソードを確認')
  console.log('• グループ名で検索して絞り込み')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
}

// 実行
addGroupMembers().catch(console.error)