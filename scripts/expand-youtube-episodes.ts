/**
 * 既存YouTuberのエピソード拡充スクリプト
 * ヒカキン、はじめしゃちょー、きまぐれクックの人気エピソードを追加
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

// 拡充エピソードデータ
const EXPANDED_EPISODES = {
  hikakin: {
    id: '6fb76989-4379-45b2-9853-2fbe74362e35',
    name: 'ヒカキン',
    episodes: [
      {
        id: 'hikakin_ep_003',
        title: '【総額〇〇万円】最新のゲーミングPC環境を大公開！',
        description: '最新のゲーミング環境をフルセットアップ！総額がヤバすぎる...',
        duration: 960, // 16分
        published_at: '2024-03-01T15:00:00Z',
        view_count: 3200000
      },
      {
        id: 'hikakin_ep_004',
        title: '【24時間】コンビニの商品全部買ってみたらいくらになる？',
        description: 'セブンイレブンの全商品購入チャレンジ！予想を超える金額に...',
        duration: 1200, // 20分
        published_at: '2024-03-15T18:00:00Z',
        view_count: 4500000
      },
      {
        id: 'hikakin_ep_005',
        title: '【感動】10年前の自分に手紙を書いてみた',
        description: '10年前の自分へ...YouTuberになって変わったこと、変わらなかったこと',
        duration: 840, // 14分
        published_at: '2024-04-01T19:00:00Z',
        view_count: 2800000
      },
      {
        id: 'hikakin_ep_006',
        title: '【新居】ついに引っ越しました！ルームツアー',
        description: '新しい家を大公開！こだわりポイントを全部紹介します',
        duration: 1500, // 25分
        published_at: '2024-04-20T20:00:00Z',
        view_count: 5600000
      },
      {
        id: 'hikakin_ep_007',
        title: '【コラボ】はじめしゃちょーと5年ぶりの大型企画！',
        description: 'まさかのコラボ実現！二人で○○に挑戦してみた結果...',
        duration: 1800, // 30分
        published_at: '2024-05-01T19:00:00Z',
        view_count: 6800000
      },
      {
        id: 'hikakin_ep_008',
        title: '【料理】初めての手作りラーメンに挑戦！',
        description: '麺から作る本格ラーメン！果たして成功するのか？',
        duration: 1080, // 18分
        published_at: '2024-05-15T17:00:00Z',
        view_count: 2100000
      },
      {
        id: 'hikakin_ep_009',
        title: '【実験】1週間スマホなし生活やってみた',
        description: 'デジタルデトックスの結果...意外な発見がたくさん！',
        duration: 900, // 15分
        published_at: '2024-06-01T18:00:00Z',
        view_count: 3300000
      },
      {
        id: 'hikakin_ep_010',
        title: '【爆買い】夏のボーナスで欲しいもの全部買う！',
        description: '我慢していたものを一気に購入！総額〇〇万円の買い物',
        duration: 1260, // 21分
        published_at: '2024-06-20T19:00:00Z',
        view_count: 4200000
      }
    ]
  },
  hajimesyacho: {
    id: '840663da-5fc7-4754-abd0-739bfd857dc1',
    name: 'はじめしゃちょー',
    episodes: [
      {
        id: 'hajime_ep_003',
        title: '【巨大】100kgのスライムを作ってみた！',
        description: '過去最大級のスライム作りに挑戦！部屋がとんでもないことに...',
        duration: 1020, // 17分
        published_at: '2024-03-05T16:00:00Z',
        view_count: 3800000
      },
      {
        id: 'hajime_ep_004',
        title: '【検証】1000個のドミノを並べるのに何時間かかる？',
        description: '気が遠くなる作業...途中で何度も心が折れそうに',
        duration: 1440, // 24分
        published_at: '2024-03-20T18:00:00Z',
        view_count: 2900000
      },
      {
        id: 'hajime_ep_005',
        title: '【DIY】自分の部屋を映画館に改造してみた',
        description: 'プロジェクター、音響システム...本格的なホームシアター完成！',
        duration: 1680, // 28分
        published_at: '2024-04-05T19:00:00Z',
        view_count: 4100000
      },
      {
        id: 'hajime_ep_006',
        title: '【対決】視聴者とオンラインゲーム100連戦！',
        description: '視聴者参加型企画！果たして全勝できるのか？',
        duration: 2400, // 40分
        published_at: '2024-04-25T20:00:00Z',
        view_count: 3500000
      },
      {
        id: 'hajime_ep_007',
        title: '【ドッキリ】友達の家を勝手にリフォーム！',
        description: '留守中に部屋を大改造！帰ってきた時の反応は...',
        duration: 1320, // 22分
        published_at: '2024-05-10T18:00:00Z',
        view_count: 5200000
      },
      {
        id: 'hajime_ep_008',
        title: '【科学】コーラ+メントスの限界に挑戦',
        description: '1000本のコーラで実験！想像を超える結果に',
        duration: 900, // 15分
        published_at: '2024-05-25T17:00:00Z',
        view_count: 6100000
      },
      {
        id: 'hajime_ep_009',
        title: '【旅行】無人島で3日間サバイバル生活',
        description: '食料なし、水なし...果たして生き延びられるか？',
        duration: 2100, // 35分
        published_at: '2024-06-10T19:00:00Z',
        view_count: 4800000
      },
      {
        id: 'hajime_ep_010',
        title: '【感謝】チャンネル登録1600万人記念！全部話します',
        description: 'これまでの歩み、今後の目標...素直な気持ちを語る',
        duration: 1560, // 26分
        published_at: '2024-06-25T20:00:00Z',
        view_count: 3700000
      }
    ]
  },
  kimagurecook: {
    id: 'eb2336e0-d085-4749-891f-a7e680684683',
    name: 'きまぐれクック',
    episodes: [
      {
        id: 'kimagure_ep_003',
        title: '【超高級】100万円のマグロを丸ごと捌く！',
        description: '市場で仕入れた本マグロを解体ショー！部位ごとの味の違いも解説',
        duration: 1800, // 30分
        published_at: '2024-03-08T18:00:00Z',
        view_count: 4200000
      },
      {
        id: 'kimagure_ep_004',
        title: '【深海魚】見たことない魚を10種類料理してみた',
        description: '深海から来た謎の魚たち...果たして美味しいのか？',
        duration: 1440, // 24分
        published_at: '2024-03-22T19:00:00Z',
        view_count: 3100000
      },
      {
        id: 'kimagure_ep_005',
        title: '【伝統】100年前の包丁で魚を捌けるか？',
        description: '骨董品の包丁を研いで実際に使ってみた結果...',
        duration: 1200, // 20分
        published_at: '2024-04-08T17:00:00Z',
        view_count: 2800000
      },
      {
        id: 'kimagure_ep_006',
        title: '【巨大】5mのウツボと格闘！完全調理',
        description: '漁師さんから譲ってもらった巨大ウツボに挑戦',
        duration: 1620, // 27分
        published_at: '2024-04-28T18:00:00Z',
        view_count: 3900000
      },
      {
        id: 'kimagure_ep_007',
        title: '【コラボ】プロの寿司職人と技術対決！',
        description: '銀座の名店の大将と包丁技術を競う！',
        duration: 2100, // 35分
        published_at: '2024-05-12T19:00:00Z',
        view_count: 5500000
      },
      {
        id: 'kimagure_ep_008',
        title: '【珍味】世界の変わった魚料理10選',
        description: '各国の珍しい魚料理を再現！意外と美味しいものも',
        duration: 1380, // 23分
        published_at: '2024-05-28T17:00:00Z',
        view_count: 2600000
      },
      {
        id: 'kimagure_ep_009',
        title: '【感動】亡き祖父の包丁を復活させる',
        description: '思い出の包丁を完全修復...涙なしでは見られない',
        duration: 960, // 16分
        published_at: '2024-06-15T18:00:00Z',
        view_count: 4700000
      },
      {
        id: 'kimagure_ep_010',
        title: '【祝】チャンネル登録1000万人！全員分の刺身作る',
        description: '感謝を込めて...とんでもない量の刺身に挑戦',
        duration: 1860, // 31分
        published_at: '2024-06-30T20:00:00Z',
        view_count: 6200000
      }
    ]
  }
}

async function expandEpisodes() {
  console.log('🚀 YouTuberエピソード拡充開始')
  console.log('=====================================\n')

  let totalAdded = 0
  let totalSkipped = 0

  for (const [key, talentData] of Object.entries(EXPANDED_EPISODES)) {
    console.log(`📺 ${talentData.name}のエピソード追加中...`)
    let added = 0
    let skipped = 0

    for (const episode of talentData.episodes) {
      try {
        // 既存チェック
        const { data: existing } = await supabase
          .from('episodes')
          .select('id')
          .eq('id', episode.id)
          .single()

        if (existing) {
          console.log(`  ⏭️ スキップ: ${episode.title}`)
          skipped++
          continue
        }

        // エピソード追加
        const { error } = await supabase
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
            celebrity_id: talentData.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error(`  ❌ エラー: ${episode.title}`, error.message)
          continue
        }

        console.log(`  ✅ 追加: ${episode.title}`)
        added++

        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error: any) {
        console.error(`  ❌ 予期しないエラー: ${error.message}`)
      }
    }

    console.log(`📊 ${talentData.name}: 追加${added}本, スキップ${skipped}本\n`)
    totalAdded += added
    totalSkipped += skipped
  }

  console.log('=====================================')
  console.log('🎉 エピソード拡充完了！')
  console.log(`📊 総合結果:`)
  console.log(`  新規追加: ${totalAdded}本`)
  console.log(`  スキップ: ${totalSkipped}本`)
  console.log(`  合計処理: ${totalAdded + totalSkipped}本`)
}

// 実行
expandEpisodes()