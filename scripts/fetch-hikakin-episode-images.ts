/**
 * ヒカキンのエピソード画像をYouTube Data APIで取得
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const youtubeApiKey = process.env.VITE_YOUTUBE_API_KEY!

if (!supabaseUrl || !supabaseKey || !youtubeApiKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

class EpisodeImageFetcher {
  private youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3'
  private hikakinChannelId = 'UCZf__ehlCEBPop-_sldpBUQ' // HikakinTV

  // ヒカキンの最新動画から画像を取得してエピソードに紐付け
  async fetchHikakinEpisodeImages() {
    console.log('🎬 ヒカキンのエピソード画像を取得中...')
    console.log(`チャンネルID: ${this.hikakinChannelId}\n`)

    try {
      // 1. ヒカキンのエピソード一覧を取得
      const { data: episodes, error: episodeError } = await supabase
        .from('episodes')
        .select('id, title, video_url, thumbnail_url, celebrity_id')
        .eq('celebrity_id', '6fb76989-4379-45b2-9853-2fbe74362e35') // ヒカキンのID
        .order('created_at', { ascending: false })

      if (episodeError) {
        console.error('❌ エピソード取得エラー:', episodeError)
        return
      }

      if (!episodes || episodes.length === 0) {
        console.log('ヒカキンのエピソードが見つかりません')
        return
      }

      console.log(`📋 ヒカキンのエピソード数: ${episodes.length}本`)

      // 2. HikakinTVチャンネルから最新動画を取得
      console.log('🔍 HikakinTVから最新動画を取得中...')

      // チャンネルのアップロードプレイリストID取得
      const channelResponse = await fetch(
        `${this.youtubeBaseUrl}/channels?part=contentDetails&id=${this.hikakinChannelId}&key=${youtubeApiKey}`
      )

      if (!channelResponse.ok) {
        console.error('❌ チャンネル情報取得エラー')
        return
      }

      const channelData = await channelResponse.json()
      const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads

      // 最新動画を取得
      const playlistResponse = await fetch(
        `${this.youtubeBaseUrl}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50&key=${youtubeApiKey}`
      )

      if (!playlistResponse.ok) {
        console.error('❌ プレイリスト取得エラー')
        return
      }

      const playlistData = await playlistResponse.json()
      const videos = playlistData.items

      console.log(`✅ 取得した動画数: ${videos.length}本`)

      // 3. エピソードタイトルと動画タイトルをマッチング
      let successCount = 0
      let matchedCount = 0

      for (const episode of episodes) {
        console.log(`\n🔍 "${episode.title}" の画像を検索中...`)

        // 動画IDがvideo_urlに含まれている場合は直接取得
        let videoId = null
        if (episode.video_url && episode.video_url.includes('youtube.com/watch?v=')) {
          videoId = episode.video_url.split('v=')[1]?.split('&')[0]
          console.log(`   📹 既存のVideo ID: ${videoId}`)
        }

        // Video IDが取得できた場合は直接画像を取得
        if (videoId) {
          try {
            const videoResponse = await fetch(
              `${this.youtubeBaseUrl}/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`
            )

            if (videoResponse.ok) {
              const videoData = await videoResponse.json()
              if (videoData.items && videoData.items.length > 0) {
                const video = videoData.items[0]
                const thumbnailUrl = video.snippet.thumbnails.maxres?.url ||
                                   video.snippet.thumbnails.high?.url ||
                                   video.snippet.thumbnails.medium?.url ||
                                   video.snippet.thumbnails.default?.url

                if (thumbnailUrl && thumbnailUrl !== episode.thumbnail_url) {
                  console.log(`   ✅ 高品質サムネイル取得: ${thumbnailUrl.substring(0, 60)}...`)

                  // データベース更新
                  const { error: updateError } = await supabase
                    .from('episodes')
                    .update({
                      thumbnail_url: thumbnailUrl,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', episode.id)

                  if (updateError) {
                    console.log(`   ❌ 更新エラー: ${updateError.message}`)
                  } else {
                    console.log(`   ✅ サムネイル更新完了`)
                    successCount++
                  }
                  matchedCount++
                } else {
                  console.log(`   ⏭️ 既に最適な画像が設定済み`)
                }
              }
            }
          } catch (error) {
            console.log(`   ❌ 動画詳細取得エラー: ${error}`)
          }
        } else {
          // タイトルマッチングで動画を探す
          const matchedVideo = videos.find((video: any) => {
            const videoTitle = video.snippet.title.toLowerCase()
            const episodeTitle = episode.title.toLowerCase()

            // キーワードベースのマッチング
            const episodeKeywords = episodeTitle.replace(/【|】|\[|\]|\(|\)/g, '').split(/\s+/).filter(k => k.length > 1)
            const matchCount = episodeKeywords.filter(keyword => videoTitle.includes(keyword)).length

            return matchCount >= Math.min(2, episodeKeywords.length)
          })

          if (matchedVideo) {
            const thumbnailUrl = matchedVideo.snippet.thumbnails.maxres?.url ||
                               matchedVideo.snippet.thumbnails.high?.url ||
                               matchedVideo.snippet.thumbnails.medium?.url

            console.log(`   ✅ マッチした動画: ${matchedVideo.snippet.title}`)
            console.log(`   📸 サムネイル: ${thumbnailUrl?.substring(0, 60)}...`)

            if (thumbnailUrl && thumbnailUrl !== episode.thumbnail_url) {
              const { error: updateError } = await supabase
                .from('episodes')
                .update({
                  thumbnail_url: thumbnailUrl,
                  video_url: `https://www.youtube.com/watch?v=${matchedVideo.snippet.resourceId.videoId}`,
                  updated_at: new Date().toISOString()
                })
                .eq('id', episode.id)

              if (updateError) {
                console.log(`   ❌ 更新エラー: ${updateError.message}`)
              } else {
                console.log(`   ✅ エピソード情報更新完了`)
                successCount++
              }
              matchedCount++
            }
          } else {
            console.log(`   ⚠️ マッチする動画が見つかりませんでした`)
          }
        }

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      console.log('\n' + '='.repeat(50))
      console.log('🎉 ヒカキンのエピソード画像取得完了！')
      console.log('='.repeat(50))
      console.log(`📊 処理結果:`)
      console.log(`  処理したエピソード: ${episodes.length}本`)
      console.log(`  マッチした動画: ${matchedCount}本`)
      console.log(`  更新成功: ${successCount}本`)

      // 5. 結果確認
      console.log('\n🔍 更新結果確認:')
      const { data: updatedEpisodes } = await supabase
        .from('episodes')
        .select('title, thumbnail_url')
        .eq('celebrity_id', '6fb76989-4379-45b2-9853-2fbe74362e35')
        .limit(5)

      if (updatedEpisodes) {
        updatedEpisodes.forEach((ep, index) => {
          const hasImage = ep.thumbnail_url && !ep.thumbnail_url.includes('placeholder')
          const status = hasImage ? '✅' : '⚠️'
          console.log(`${status} ${ep.title}`)
          if (hasImage) {
            console.log(`   ${ep.thumbnail_url.substring(0, 80)}...`)
          }
        })
      }

    } catch (error) {
      console.error('❌ 予期しないエラー:', error)
    }
  }
}

async function fetchHikakinEpisodeImages() {
  console.log('🎬 ヒカキンのエピソード画像取得開始')
  console.log('==================================\n')

  const fetcher = new EpisodeImageFetcher()
  await fetcher.fetchHikakinEpisodeImages()

  console.log('\n💡 確認方法:')
  console.log('• ヒカキンのプロフィールページでエピソード画像を確認')
  console.log('• ブラウザでハードリフレッシュ（Ctrl+Shift+R / Cmd+Shift+R）')
  console.log('• 画像が表示されない場合は、しばらく時間をおいて再確認')
}

// 実行
fetchHikakinEpisodeImages().catch(console.error)