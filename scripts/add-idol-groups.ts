/**
 * アイドルグループ追加スクリプト
 * NiziU、櫻坂46を追加
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

// アイドルグループデータ
const IDOL_GROUPS = [
  {
    id: 'c4d5e6f7-g8h9-0123-4567-890123defghi',
    name: 'NiziU',
    slug: 'niziu',
    bio: 'JYPエンターテインメント所属の9人組ガールズグループ。オーディション番組「Nizi Project」から誕生。日韓を中心に活動する多国籍アイドルグループ。',
    image_url: 'https://pbs.twimg.com/profile_images/1320928867580727296/l5uQr1qx_400x400.jpg',
    social_links: {
      youtube: 'https://www.youtube.com/channel/UCXMsJ6SRnPMBZGOIKQBYYgA',
      twitter: 'https://twitter.com/NiziU_Official',
      instagram: 'https://instagram.com/niziu_official',
      official: 'https://niziu.com/'
    },
    agency: 'JYPエンターテインメント',
    fandom_name: 'WithU',
    group_name: 'NiziU',
    type: 'group',
    status: 'active',
    debut_date: '2020-12-02',
    episodes: [
      {
        id: 'niziu_ep_001',
        title: '【密着】NiziUデビュー3周年記念特別映像',
        description: 'デビューから3年...メンバーそれぞれの成長と絆を描いた感動ドキュメンタリー',
        duration: 1800, // 30分
        published_at: '2024-01-15T18:00:00Z',
        view_count: 1200000
      },
      {
        id: 'niziu_ep_002',
        title: '【舞台裏】新曲レコーディング風景を大公開！',
        description: '新曲制作の裏側に密着！メンバーの真剣な表情とプロ意識',
        duration: 1440, // 24分
        published_at: '2024-02-10T19:00:00Z',
        view_count: 980000
      },
      {
        id: 'niziu_ep_003',
        title: '【料理企画】メンバー全員で日韓料理対決！',
        description: 'NiziUメンバーが2チームに分かれて料理対決！意外な料理上手は誰？',
        duration: 1620, // 27分
        published_at: '2024-03-05T18:00:00Z',
        view_count: 1500000
      },
      {
        id: 'niziu_ep_004',
        title: '【Q&A】ファンからの質問に全力で答えてみた',
        description: 'WithUから寄せられた質問に全メンバーで回答！普段見えない一面も',
        duration: 1260, // 21分
        published_at: '2024-04-01T19:00:00Z',
        view_count: 870000
      },
      {
        id: 'niziu_ep_005',
        title: '【挑戦】9人で巨大ジグソーパズルに挑戦！',
        description: '1000ピースの巨大パズルを制限時間内にクリアできるか？',
        duration: 1080, // 18分
        published_at: '2024-05-10T17:00:00Z',
        view_count: 750000
      }
    ]
  },
  {
    id: 'd5e6f7g8-h9i0-1234-5678-901234efghij',
    name: '櫻坂46',
    slug: 'sakurazaka46',
    bio: '欅坂46から改名して誕生したアイドルグループ。2020年に「櫻坂46」として再出発。楽曲のクオリティと独特な世界観で多くのファンを魅了している。',
    image_url: 'https://pbs.twimg.com/profile_images/1417280568843550720/YwqJqoJx_400x400.jpg',
    social_links: {
      youtube: 'https://www.youtube.com/channel/UCU8IzCb_mJr1fPqTyFZkJrg',
      twitter: 'https://twitter.com/sakurazaka46',
      instagram: 'https://instagram.com/sakurazaka46_official',
      official: 'https://sakurazaka46.com/'
    },
    agency: 'ソニー・ミュージックエンタテインメント',
    fandom_name: 'バディーズ',
    group_name: '櫻坂46',
    type: 'group',
    status: 'active',
    debut_date: '2020-10-14',
    episodes: [
      {
        id: 'sakura46_ep_001',
        title: '【特別企画】メンバー全員でキャンプ体験！',
        description: '櫻坂46メンバーが初めてのキャンプに挑戦！テント設営から料理まで',
        duration: 2100, // 35分
        published_at: '2024-01-20T19:00:00Z',
        view_count: 1800000
      },
      {
        id: 'sakura46_ep_002',
        title: '【ゲーム企画】人生ゲームで本音トーク炸裂！',
        description: '人生ゲームを通してメンバーの本音が次々と...笑いあり涙ありの30分',
        duration: 1800, // 30分
        published_at: '2024-02-15T18:00:00Z',
        view_count: 1350000
      },
      {
        id: 'sakura46_ep_003',
        title: '【密着】新センター決定の瞬間に密着',
        description: 'センターオーディションの裏側を完全密着。涙の結果発表まで',
        duration: 2400, // 40分
        published_at: '2024-03-10T20:00:00Z',
        view_count: 2200000
      },
      {
        id: 'sakura46_ep_004',
        title: '【チャレンジ】24時間リレーダンス企画',
        description: 'メンバーが交代で24時間ダンスを踊り続ける過酷企画！',
        duration: 1440, // 24分（ハイライト版）
        published_at: '2024-04-05T17:00:00Z',
        view_count: 1600000
      },
      {
        id: 'sakura46_ep_005',
        title: '【感謝】ファンへの感謝メッセージ企画',
        description: 'いつも応援してくれるバディーズへ、メンバー一人ひとりからの感謝の想い',
        duration: 1320, // 22分
        published_at: '2024-05-01T19:00:00Z',
        view_count: 1100000
      }
    ]
  }
]

async function addIdolGroups() {
  console.log('🎀 アイドルグループ追加開始')
  console.log('=====================================\n')

  let totalGroupsAdded = 0
  let totalEpisodesAdded = 0

  for (const group of IDOL_GROUPS) {
    console.log(`💫 ${group.name}を追加中...`)

    try {
      // グループ追加
      const { error: groupError } = await supabase
        .from('celebrities')
        .insert({
          id: group.id,
          name: group.name,
          slug: group.slug,
          bio: group.bio,
          image_url: group.image_url,
          social_links: group.social_links,
          agency: group.agency,
          fandom_name: group.fandom_name,
          group_name: group.group_name,
          type: group.type,
          status: group.status,
          debut_date: group.debut_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (groupError) {
        console.error(`  ❌ グループ追加エラー: ${group.name}`, groupError.message)
        continue
      }

      console.log(`  ✅ グループ追加: ${group.name}`)
      totalGroupsAdded++

      // エピソード追加
      let episodesAdded = 0
      for (const episode of group.episodes) {
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
              celebrity_id: group.id,
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

      console.log(`  📊 ${group.name}: エピソード${episodesAdded}本追加\n`)
      totalEpisodesAdded += episodesAdded

      // グループ間の間隔
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error: any) {
      console.error(`❌ ${group.name}の追加中に予期しないエラー: ${error.message}\n`)
    }
  }

  console.log('=====================================')
  console.log('🎉 アイドルグループ追加完了！')
  console.log(`📊 総合結果:`)
  console.log(`  グループ追加: ${totalGroupsAdded}組`)
  console.log(`  エピソード追加: ${totalEpisodesAdded}本`)
  console.log(`  平均エピソード数: ${totalGroupsAdded > 0 ? (totalEpisodesAdded / totalGroupsAdded).toFixed(1) : 0}本/組`)
}

// 実行
addIdolGroups()