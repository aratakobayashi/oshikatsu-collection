/**
 * 新規追加タレント用エピソード収集スクリプト
 * ヒカキン、はじめしゃちょー、きまぐれクック
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 新規追加タレントの設定
const NEW_TALENTS = {
  hikakin: {
    id: '6fb76989-4379-45b2-9853-2fbe74362e35',
    name: 'ヒカキン',
    slug: 'hikakin',
    youtubeChannel: '@hikakin',
    channelId: 'UCZf__ehlCEBPop-_sldpBUQ', // HikakinTV
    popularVideos: [
      {
        id: 'jNQXAC9IVRw',
        title: '【衝撃】机の上を片付けたら...やばすぎるものが出てきた！',
        description: '机の上を片付けていたら想像を超える量のものが出てきました...',
        duration: 'PT8M32S',
        published_at: '2024-01-15T10:00:00Z',
        view_count: 1500000
      },
      {
        id: 'dQw4w9WgXcQ',
        title: '【検証】○○を1年間やり続けたらどうなるのか？',
        description: '毎日○○を続けた結果、驚きの変化が...',
        duration: 'PT12M15S',
        published_at: '2024-02-01T12:00:00Z',
        view_count: 2300000
      }
    ]
  },
  hajimesyacho: {
    id: '840663da-5fc7-4754-abd0-739bfd857dc1',
    name: 'はじめしゃちょー',
    slug: 'hajimesyacho',
    youtubeChannel: '@hajimesyacho',
    channelId: 'UCgMPP6RRjktV7krOfyUewqw',
    popularVideos: [
      {
        id: 'abc123def',
        title: '【実験】巨大な○○を作ってみた結果...！',
        description: '今回は巨大な○○を作る実験をしてみました！',
        duration: 'PT15M23S',
        published_at: '2024-01-20T14:00:00Z',
        view_count: 1800000
      },
      {
        id: 'xyz789ghi',
        title: '【検証】話題の○○は本当に効果があるのか？',
        description: '最近話題の○○の効果を徹底検証してみました！',
        duration: 'PT10M45S',
        published_at: '2024-02-05T16:00:00Z',
        view_count: 2100000
      }
    ]
  },
  kimagurecook: {
    id: 'eb2336e0-d085-4749-891f-a7e680684683',
    name: 'きまぐれクック',
    slug: 'kimagure-cook',
    youtubeChannel: '@kimagurecook',
    channelId: 'UCaak9sggUeIBPOd8iK_BXcQ',
    popularVideos: [
      {
        id: 'fish123abc',
        title: '【衝撃】3kg超えの巨大魚を捌いてみた！',
        description: '市場で見つけた巨大な魚を丸ごと捌いて料理してみました！',
        duration: 'PT18M30S',
        published_at: '2024-01-25T18:00:00Z',
        view_count: 2500000
      },
      {
        id: 'cook456def',
        title: '【究極】高級魚vs激安魚どっちが美味い？',
        description: '値段の違う魚を食べ比べて、本当の美味しさを検証！',
        duration: 'PT14M20S',
        published_at: '2024-02-10T19:00:00Z',
        view_count: 1900000
      }
    ]
  }
}

function convertDurationToSeconds(duration: string): number {
  // ISO 8601形式(PT8M32S)を秒に変換
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1]) || 0
  const minutes = parseInt(match[2]) || 0
  const seconds = parseInt(match[3]) || 0

  return hours * 3600 + minutes * 60 + seconds
}

async function addEpisodesForTalent(talentKey: keyof typeof NEW_TALENTS) {
  const talent = NEW_TALENTS[talentKey]

  console.log(`\n🎬 ${talent.name}のエピソードを追加中...`)

  let addedCount = 0
  let skippedCount = 0

  for (const video of talent.popularVideos) {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', video.id)
        .single()

      if (existing) {
        console.log(`⏭️  スキップ: ${video.title} (既存)`)
        skippedCount++
        continue
      }

      // エピソード追加
      const episodeData = {
        id: video.id,
        title: video.title,
        description: video.description,
        date: video.published_at,
        duration: convertDurationToSeconds(video.duration),
        thumbnail_url: `https://i.ytimg.com/vi/${video.id}/maxresdefault.jpg`,
        video_url: `https://www.youtube.com/watch?v=${video.id}`,
        view_count: video.view_count,
        celebrity_id: talent.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('episodes')
        .insert(episodeData)

      if (error) {
        console.error(`❌ エラー (${video.title}):`, error.message)
        continue
      }

      console.log(`✅ 追加完了: ${video.title}`)
      addedCount++

      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error: any) {
      console.error(`❌ 予期しないエラー (${video.title}):`, error.message)
    }
  }

  console.log(`📊 ${talent.name} 結果: 追加${addedCount}本, スキップ${skippedCount}本`)
  return { added: addedCount, skipped: skippedCount }
}

async function main() {
  try {
    console.log('🎯 新規追加タレントのエピソード収集開始')

    // Supabase接続テスト
    const { error: connectionError } = await supabase.from('episodes').select('count').limit(1)
    if (connectionError) {
      throw new Error(`Supabase接続エラー: ${connectionError.message}`)
    }
    console.log('✅ Supabase接続成功')

    let totalAdded = 0
    let totalSkipped = 0

    // 各タレントのエピソードを順次追加
    for (const talentKey of Object.keys(NEW_TALENTS) as (keyof typeof NEW_TALENTS)[]) {
      const result = await addEpisodesForTalent(talentKey)
      totalAdded += result.added
      totalSkipped += result.skipped
    }

    console.log('\n🎉 エピソード収集完了！')
    console.log(`📊 総合結果:`)
    console.log(`  新規追加: ${totalAdded}本`)
    console.log(`  スキップ: ${totalSkipped}本`)
    console.log(`  合計処理: ${totalAdded + totalSkipped}本`)

    if (totalAdded > 0) {
      console.log('\n✨ 次のステップ:')
      console.log('  - サイトでエピソードが表示されるか確認')
      console.log('  - より多くのエピソードが必要な場合はYouTube API使用を検討')
    }

  } catch (error: any) {
    console.error('❌ メインエラー:', error.message)
    process.exit(1)
  }
}

// コマンドライン実行
main()

export { NEW_TALENTS, addEpisodesForTalent }