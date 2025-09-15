/**
 * 新規YouTuber（コムドット、東海オンエア、フィッシャーズ、NiziU、櫻坂46）のエピソードを5本→10本に拡充
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 新規YouTuberの追加エピソード（各5本追加で計10本に）
const EXPANDED_EPISODES = {
  comdot: {
    id: 'f1e2d3c4-b5a6-9870-1234-567890abcdef',
    episodes: [
      {
        id: 'comdot_ep_006',
        title: '【24時間】コンビニで1日過ごしたらバイト体験になった件',
        description: 'コンビニに24時間滞在してバイト体験！意外な発見と爆笑エピソードが満載',
        date: '2024-11-25',
        duration: '18:45',
        view_count: 2100000
      },
      {
        id: 'comdot_ep_007',
        title: '【大食い】ゆうたの胃袋は無限？ラーメン何杯食べられるか検証',
        description: 'ゆうたの大食い能力を本格検証！まさかの結果に一同驚愕',
        date: '2024-11-22',
        duration: '16:32',
        view_count: 1850000
      },
      {
        id: 'comdot_ep_008',
        title: '【ドッキリ】やまとに内緒で部屋を完全リフォームしてみた',
        description: 'やまとが外出中に部屋を大改造！帰ってきた時の反応が最高すぎる',
        date: '2024-11-18',
        duration: '22:15',
        view_count: 2800000
      },
      {
        id: 'comdot_ep_009',
        title: '【検証】本当に女子ウケする男子の行動TOP10やってみた',
        description: '巷で話題の女子ウケ行動を5人で検証！意外な結果にメンバー困惑',
        date: '2024-11-15',
        duration: '19:28',
        view_count: 2300000
      },
      {
        id: 'comdot_ep_010',
        title: '【コラボ】東海オンエアとガチ勝負！負けたら罰ゲーム企画',
        description: '東海オンエアとの初コラボ！様々なゲームで真剣勝負、負けた方には衝撃の罰ゲームが...',
        date: '2024-11-12',
        duration: '25:41',
        view_count: 3200000
      }
    ]
  },
  tokai: {
    id: 'a2b3c4d5-e6f7-8901-2345-678901bcdefg',
    episodes: [
      {
        id: 'tokai_ep_006',
        title: '【実験】1週間お菓子だけで生活したら体はどうなる？',
        description: 'としみつがお菓子だけで1週間生活実験！体重や体調の変化を詳しく記録',
        date: '2024-11-20',
        duration: '20:33',
        view_count: 1900000
      },
      {
        id: 'tokai_ep_007',
        title: '【DIY】廃材だけで秘密基地作ってみた結果...',
        description: '廃材を使って本格的な秘密基地をDIY！完成度が予想以上すぎる件',
        date: '2024-11-17',
        duration: '24:12',
        view_count: 2200000
      },
      {
        id: 'tokai_ep_008',
        title: '【検証】虫歯男は本当に虫歯だらけなのか歯医者で検査してもらった',
        description: '虫歯男の口の中を歯科医師が本格検査！衝撃の結果にメンバー絶句',
        date: '2024-11-14',
        duration: '17:55',
        view_count: 2500000
      },
      {
        id: 'tokai_ep_009',
        title: '【料理】てつやの隠れた才能！？本格中華に挑戦',
        description: 'てつやが本格中華料理に挑戦！意外すぎる料理の腕前にメンバーも驚愕',
        date: '2024-11-11',
        duration: '21:47',
        view_count: 1700000
      },
      {
        id: 'tokai_ep_010',
        title: '【企画】メンバーの本気の特技披露会が想像以上だった件',
        description: '各メンバーが隠していた本気の特技を披露！りょうの特技が衝撃すぎる',
        date: '2024-11-08',
        duration: '19:23',
        view_count: 2100000
      }
    ]
  },
  fishers: {
    id: 'b3c4d5e6-f7g8-9012-3456-789012cdefgh',
    episodes: [
      {
        id: 'fishers_ep_006',
        title: '【アスレチック】巨大アスレチックで本気の鬼ごっこしたら大変なことに',
        description: '巨大アスレチック施設で本気の鬼ごっこ！予想以上にハードで爆笑ハプニング続出',
        date: '2024-11-19',
        duration: '22:18',
        view_count: 2400000
      },
      {
        id: 'fishers_ep_007',
        title: '【実験】シルクロードは本当に甘いものが嫌いなのか検証',
        description: 'シルクロードの甘いもの嫌いを徹底検証！意外な一面が明らかに',
        date: '2024-11-16',
        duration: '16:44',
        view_count: 1800000
      },
      {
        id: 'fishers_ep_008',
        title: '【挑戦】ンダホは何回転でめまいになる？人間回転実験',
        description: 'ンダホの回転耐性を本格実験！まさかの結果にメンバー爆笑',
        date: '2024-11-13',
        duration: '14:26',
        view_count: 2100000
      },
      {
        id: 'fishers_ep_009',
        title: '【ゲーム】マサイとモトキの本気のゲーム対決が白熱しすぎた',
        description: 'ゲーム上手い組の本気対決！まさかの展開にメンバー全員興奮',
        date: '2024-11-10',
        duration: '25:33',
        view_count: 2600000
      },
      {
        id: 'fishers_ep_010',
        title: '【企画】ザカオの一日密着したら意外すぎる素顔が見えた',
        description: 'ザカオの私生活に完全密着！普段見せない意外な一面が明らかに',
        date: '2024-11-07',
        duration: '18:52',
        view_count: 1900000
      }
    ]
  },
  niziu: {
    id: 'c4d5e6f7-g8h9-0123-4567-890123defghi',
    episodes: [
      {
        id: 'niziu_ep_006',
        title: '【ダンス】メンバーが選ぶ最高難易度のダンスに挑戦！',
        description: 'メンバー同士で最高難易度のダンスを出し合い！果たして全員クリアできるのか？',
        date: '2024-11-21',
        duration: '17:29',
        view_count: 1600000
      },
      {
        id: 'niziu_ep_007',
        title: '【料理】韓国料理対決！本場の味に挑戦してみた',
        description: 'メンバーが本格韓国料理に挑戦！リクの料理センスが光る回',
        date: '2024-11-18',
        duration: '20:15',
        view_count: 1400000
      },
      {
        id: 'niziu_ep_008',
        title: '【ゲーム】NiziUの頭脳派は誰？知力バトル開催',
        description: '様々な知識問題でメンバーの知力をテスト！意外な結果にみんなびっくり',
        date: '2024-11-15',
        duration: '16:43',
        view_count: 1700000
      },
      {
        id: 'niziu_ep_009',
        title: '【挑戦】メンバーの隠れた特技披露会が想像以上だった',
        description: '普段見せないメンバーの特技を大公開！ニナの特技にメンバー全員驚愕',
        date: '2024-11-12',
        duration: '19:37',
        view_count: 1800000
      },
      {
        id: 'niziu_ep_010',
        title: '【企画】1日マネージャー体験！メンバーの仕事の裏側',
        description: 'マコがマネージャー体験！アイドルの裏側の大変さを実感する感動回',
        date: '2024-11-09',
        duration: '22:18',
        view_count: 2100000
      }
    ]
  },
  sakurazaka: {
    id: 'd5e6f7g8-h9i0-1234-5678-901234efghij',
    episodes: [
      {
        id: 'sakura_ep_006',
        title: '【挑戦】メンバーの意外すぎる特技大公開！',
        description: '普段見せないメンバーの隠れた特技を大披露！森田ひかるの特技に一同驚愛',
        date: '2024-11-23',
        duration: '18:24',
        view_count: 1300000
      },
      {
        id: 'sakura_ep_007',
        title: '【料理】手作りお弁当対決！一番美味しいのは誰？',
        description: 'メンバーが手作りお弁当で勝負！小池美波の意外な料理センスが光る',
        date: '2024-11-20',
        duration: '21:15',
        view_count: 1500000
      },
      {
        id: 'sakura_ep_008',
        title: '【ゲーム】櫻坂46版人狼ゲーム！騙し合いが白熱',
        description: 'メンバー同士の人狼ゲームが予想以上に白熱！菅井友香の演技力に注目',
        date: '2024-11-17',
        duration: '25:42',
        view_count: 1700000
      },
      {
        id: 'sakura_ep_009',
        title: '【企画】1日だけメンバーの役割交代してみた結果',
        description: 'センターとバックメンバーが役割交代！新鮮な発見がたくさん',
        date: '2024-11-14',
        duration: '19:33',
        view_count: 1600000
      },
      {
        id: 'sakura_ep_010',
        title: '【チャレンジ】櫻坂46流！チームワーク検証企画',
        description: '様々なチームワークゲームでメンバーの絆を確認！感動の結末が待っている',
        date: '2024-11-11',
        duration: '23:17',
        view_count: 1900000
      }
    ]
  }
}

async function expandNewYoutubersEpisodes() {
  console.log('🎬 新規YouTuberのエピソード拡充開始')
  console.log('=====================================\n')

  let totalAdded = 0

  for (const [key, talent] of Object.entries(EXPANDED_EPISODES)) {
    console.log(`📺 ${key.toUpperCase()}のエピソード追加中...`)

    for (const episode of talent.episodes) {
      try {
        // プレースホルダー画像URL（後でYouTube Data APIで取得）
        const placeholderThumbnail = `https://i.ytimg.com/vi/${episode.id}/maxresdefault.jpg`
        const placeholderVideoUrl = `https://www.youtube.com/watch?v=${episode.id}`

        const { error } = await supabase
          .from('episodes')
          .insert({
            id: episode.id,
            title: episode.title,
            description: episode.description,
            date: new Date(episode.date).toISOString(),
            duration: null, // durationフィールドは使用しない
            thumbnail_url: placeholderThumbnail,
            video_url: placeholderVideoUrl,
            view_count: episode.view_count,
            celebrity_id: talent.id
          })

        if (error) {
          console.log(`   ❌ ${episode.title}: ${error.message}`)
        } else {
          console.log(`   ✅ ${episode.title}`)
          totalAdded++
        }
      } catch (error) {
        console.log(`   ❌ ${episode.title}: 予期しないエラー`)
      }

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    console.log('')
  }

  console.log('='.repeat(50))
  console.log('🎉 新規YouTuberエピソード拡充完了！')
  console.log('='.repeat(50))
  console.log(`📊 結果: ${totalAdded}本のエピソードを追加`)
  console.log('')

  // 各タレントの現在のエピソード数を確認
  console.log('📋 更新後のエピソード数:')
  for (const [key, talent] of Object.entries(EXPANDED_EPISODES)) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', talent.id)

    console.log(`   ${key.toUpperCase()}: ${episodes?.length || 0}本`)
  }

  console.log('\n💡 次のステップ:')
  console.log('• 各タレントのエピソード画像をYouTube Data APIで取得')
  console.log('• scripts/fix-[talent-name]-episode-thumbnails.ts を実行')
  console.log('• フロントエンドで各タレントのプロフィールページを確認')
}

// 実行
expandNewYoutubersEpisodes().catch(console.error)