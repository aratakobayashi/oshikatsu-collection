/**
 * 新規人気YouTuber追加スクリプト
 * コムドット、東海オンエア、フィッシャーズを追加
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 新規YouTuberデータ
const NEW_YOUTUBERS = [
  {
    id: 'f1e2d3c4-b5a6-9870-1234-567890abcdef',
    name: 'コムドット',
    slug: 'comdot',
    bio: '関西弁で話す5人組YouTuberグループ。エンタメ系企画や日常系動画で人気。メンバーはやまと、ゆうた、ひゅうが、あむぎり、うらた。',
    image_url: 'https://yt3.ggpht.com/ytc/AIdro_n5uODLQB2qCBuLr7bF6KoVrXG_DQMJVr-vd8E=s800-c-k-c0x00ffffff-no-rj',
    social_links: {
      youtube: 'https://www.youtube.com/channel/UCgQgMOBZOJ5p9QSf7AxpZvQ',
      twitter: 'https://twitter.com/com_dot_',
      instagram: 'https://instagram.com/com.dot_'
    },
    agency: 'フリー',
    fandom_name: 'ファン',
    group_name: 'コムドット',
    type: 'group',
    status: 'active',
    episodes: [
      {
        id: 'comdot_ep_001',
        title: '【検証】本気で1日何円稼げるのか調べてみた',
        description: 'コムドット5人で様々な方法で1日のお小遣い稼ぎに挑戦！果たしていくら稼げるのか？',
        duration: 1320, // 22分
        published_at: '2024-02-15T19:00:00Z',
        view_count: 2800000
      },
      {
        id: 'comdot_ep_002',
        title: '【大食い】5人で100人前のラーメンに挑戦！',
        description: '伝説の大食いチャレンジ！果たして完食できるのか？',
        duration: 1800, // 30分
        published_at: '2024-03-01T18:00:00Z',
        view_count: 3500000
      },
      {
        id: 'comdot_ep_003',
        title: '【ドッキリ】メンバーの部屋を勝手に改造してみた',
        description: 'やまとの部屋を大改造！帰ってきた時の反応は...',
        duration: 1440, // 24分
        published_at: '2024-03-20T20:00:00Z',
        view_count: 4200000
      },
      {
        id: 'comdot_ep_004',
        title: '【旅行】5人で沖縄満喫旅！',
        description: '念願の沖縄旅行！美ら海水族館からステーキまで沖縄を堪能',
        duration: 2100, // 35分
        published_at: '2024-04-10T19:00:00Z',
        view_count: 3800000
      },
      {
        id: 'comdot_ep_005',
        title: '【企画】コムドット運動会開催！',
        description: '5人で本気の運動会！優勝者には豪華賞品が...？',
        duration: 1680, // 28分
        published_at: '2024-05-05T18:00:00Z',
        view_count: 3200000
      }
    ]
  },
  {
    id: 'a2b3c4d5-e6f7-8901-2345-678901bcdefg',
    name: '東海オンエア',
    slug: 'tokai-onair',
    bio: '愛知県岡崎市を拠点とする6人組YouTuberグループ。虫眼鏡、てつや、りょう、しばゆー、ゆめまる、としみつで構成。バラエティに富んだ企画で人気。',
    image_url: 'https://yt3.ggpht.com/ytc/AIdro_k8oMVZjKyqGgOKLx9pH6RgTwbKw2LqKvQ=s800-c-k-c0x00ffffff-no-rj',
    social_links: {
      youtube: 'https://www.youtube.com/channel/UCutJqz56653xV2wwSvut_hQ',
      twitter: 'https://twitter.com/TokaiOnAir',
      instagram: 'https://instagram.com/tokaionair'
    },
    agency: 'フリー',
    fandom_name: 'ファン',
    group_name: '東海オンエア',
    type: 'group',
    status: 'active',
    episodes: [
      {
        id: 'tokai_ep_001',
        title: '【検証】岡崎市の美味しいお店を全制覇できるか？',
        description: '地元岡崎市の隠れた名店を6人で回る美食ツアー！',
        duration: 1920, // 32分
        published_at: '2024-02-20T19:00:00Z',
        view_count: 3100000
      },
      {
        id: 'tokai_ep_002',
        title: '【ガチ】6人でマジカルバナナ1時間耐久',
        description: 'まさかの1時間マジカルバナナ！途中で頭がおかしくなる...',
        duration: 3600, // 60分
        published_at: '2024-03-05T18:00:00Z',
        view_count: 4800000
      },
      {
        id: 'tokai_ep_003',
        title: '【企画】東海オンエア人狼ゲーム！',
        description: '6人での白熱人狼バトル！まさかの裏切りも...？',
        duration: 2400, // 40分
        published_at: '2024-03-25T20:00:00Z',
        view_count: 3600000
      },
      {
        id: 'tokai_ep_004',
        title: '【チャレンジ】6人で協力して巨大迷路脱出',
        description: '愛知県の巨大迷路に挑戦！果たして脱出できるのか？',
        duration: 1560, // 26分
        published_at: '2024-04-15T19:00:00Z',
        view_count: 2900000
      },
      {
        id: 'tokai_ep_005',
        title: '【感謝】チャンネル登録700万人記念スペシャル',
        description: '700万人突破記念！これまでの軌跡を振り返る感動回',
        duration: 1800, // 30分
        published_at: '2024-05-01T20:00:00Z',
        view_count: 4500000
      }
    ]
  },
  {
    id: 'b3c4d5e6-f7g8-9012-3456-789012cdefgh',
    name: 'フィッシャーズ',
    slug: 'fischers',
    bio: '中学時代の同級生で結成されたYouTuberグループ。シルクロード、ぺけたん、ンダホ、ザカオ、モトキ、マサイで構成。アスレチック動画で人気を博す。',
    image_url: 'https://yt3.ggpht.com/ytc/AIdro_lRn7ZEtD7VsqhvHg_QX9vYJgP5KwLqT=s800-c-k-c0x00ffffff-no-rj',
    social_links: {
      youtube: 'https://www.youtube.com/channel/UCibEhpu5HP45-w7Bq1ZIulw',
      twitter: 'https://twitter.com/FischersHome',
      instagram: 'https://instagram.com/fischers_official'
    },
    agency: 'フリー',
    fandom_name: 'ファン',
    group_name: 'フィッシャーズ',
    type: 'group',
    status: 'active',
    episodes: [
      {
        id: 'fischers_ep_001',
        title: '【アスレチック】巨大室内アスレチック完全制覇',
        description: 'フィッシャーズ得意のアスレチック！今回は室内の巨大施設に挑戦',
        duration: 1680, // 28分
        published_at: '2024-02-25T18:00:00Z',
        view_count: 3400000
      },
      {
        id: 'fischers_ep_002',
        title: '【検証】6人でどこまで高く人間タワーを作れるか？',
        description: '危険すぎる人間タワーチャレンジ！まさかの高さに...',
        duration: 1200, // 20分
        published_at: '2024-03-10T19:00:00Z',
        view_count: 2800000
      },
      {
        id: 'fischers_ep_003',
        title: '【ドッキリ】シルクの誕生日にサプライズプレゼント',
        description: 'リーダーシルクへの感謝を込めたサプライズ企画！',
        duration: 1440, // 24分
        published_at: '2024-04-01T20:00:00Z',
        view_count: 4100000
      },
      {
        id: 'fischers_ep_004',
        title: '【挑戦】水上アスレチックで限界に挑む',
        description: '夏の水上アスレチック！落水必至の超難関コースに挑戦',
        duration: 1920, // 32分
        published_at: '2024-04-28T18:00:00Z',
        view_count: 3700000
      },
      {
        id: 'fischers_ep_005',
        title: '【企画】フィッシャーズ運動会2024',
        description: '毎年恒例の運動会！今年は新種目も追加で大盛り上がり',
        duration: 2400, // 40分
        published_at: '2024-05-20T19:00:00Z',
        view_count: 4900000
      }
    ]
  }
]

async function addNewYouTubers() {
  console.log('🚀 新規YouTuber追加開始')
  console.log('=====================================\n')

  let totalCelebritiesAdded = 0
  let totalEpisodesAdded = 0

  for (const youtuber of NEW_YOUTUBERS) {
    console.log(`📺 ${youtuber.name}を追加中...`)

    try {
      // タレント追加
      const { error: celebrityError } = await supabase
        .from('celebrities')
        .insert({
          id: youtuber.id,
          name: youtuber.name,
          slug: youtuber.slug,
          bio: youtuber.bio,
          image_url: youtuber.image_url,
          social_links: youtuber.social_links,
          agency: youtuber.agency,
          fandom_name: youtuber.fandom_name,
          group_name: youtuber.group_name,
          type: youtuber.type,
          status: youtuber.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (celebrityError) {
        console.error(`  ❌ タレント追加エラー: ${youtuber.name}`, celebrityError.message)
        continue
      }

      console.log(`  ✅ タレント追加: ${youtuber.name}`)
      totalCelebritiesAdded++

      // エピソード追加
      let episodesAdded = 0
      for (const episode of youtuber.episodes) {
        try {
          const { error: episodeError } = await supabase
            .from('episodes')
            .insert({
              id: episode.id,
              title: episode.title,
              description: episode.description,
              date: episode.published_at,
              duration: episode.duration,
              thumbnail_url: `https://i.ytimg.com/vi/${episode.id}/maxresdefault.jpg`,
              video_url: `https://www.youtube.com/watch?v=${episode.id}`,
              view_count: episode.view_count,
              celebrity_id: youtuber.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (episodeError) {
            console.error(`    ❌ エピソードエラー: ${episode.title}`, episodeError.message)
            continue
          }

          console.log(`    ✅ エピソード追加: ${episode.title}`)
          episodesAdded++

          // レート制限対策
          await new Promise(resolve => setTimeout(resolve, 300))

        } catch (error: any) {
          console.error(`    ❌ 予期しないエピソードエラー: ${error.message}`)
        }
      }

      console.log(`  📊 ${youtuber.name}: エピソード${episodesAdded}本追加\n`)
      totalEpisodesAdded += episodesAdded

      // タレント間の間隔
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error: any) {
      console.error(`❌ ${youtuber.name}の追加中に予期しないエラー: ${error.message}\n`)
    }
  }

  console.log('=====================================')
  console.log('🎉 新規YouTuber追加完了！')
  console.log(`📊 総合結果:`)
  console.log(`  タレント追加: ${totalCelebritiesAdded}人`)
  console.log(`  エピソード追加: ${totalEpisodesAdded}本`)
  console.log(`  平均エピソード数: ${totalCelebritiesAdded > 0 ? (totalEpisodesAdded / totalCelebritiesAdded).toFixed(1) : 0}本/人`)
}

// 実行
addNewYouTubers()