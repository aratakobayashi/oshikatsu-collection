#!/usr/bin/env node

/**
 * Season11のエピソード情報をSupabaseに追加（UUID版）
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Episode {
  title: string
  description: string
  date: string
  celebrity_id: string | null
  video_url: string
}

async function addSeason11Episodes() {
  console.log('🎬 Season11のエピソード情報をデータベースに追加中（UUID版）...\n')

  // Season11のエピソードデータ
  const episodes: Episode[] = [
    {
      title: '孤独のグルメ Season11 第1話「東京都荒川区町屋の海老チャーハンと海鮮春巻」',
      description: '「それぞれの孤独のグルメ」シリーズ第1話。荒川区町屋で海老チャーハンと海鮮春巻を味わう。太田光がゲスト出演。',
      date: '2024-10-04',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第2話「東京都足立区谷在家のセルフ食堂の朝ご飯」',
      description: '足立区谷在家のセルフ食堂で朝食を楽しむ。マキタスポーツがゲスト出演。',
      date: '2024-10-11',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第3話「東京都千代田区神保町の上タン塩とゲタカルビ」',
      description: '神保町の焼肉店で上タン塩とゲタカルビを堪能。板谷由夏がゲスト出演。',
      date: '2024-10-18',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第4話「埼玉県川口市の目玉焼きハンバーグと雲丹クリームコロッケ」',
      description: '川口市で目玉焼きハンバーグと雲丹クリームコロッケを味わう。中山裕介がゲスト出演。',
      date: '2024-10-25',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第5話「東京都台東区東上野のサウナ飯」',
      description: '東上野でサウナ後の食事を楽しむ。玉井詩織がゲスト出演。',
      date: '2024-11-01',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第6話「神奈川県平塚市の豚バラ大根とシイラのフライ」',
      description: '平塚市で豚バラ大根とシイラのフライを堪能。平田満がゲスト出演。',
      date: '2024-11-08',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第7話「島根県出雲市の餃子とライス」',
      description: '出雲市で餃子とライスを味わう。比嘉愛未がゲスト出演。',
      date: '2024-11-15',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第8話「東京都府中市白糸台のわらじとんかつ」',
      description: '府中市でわらじとんかつを楽しむ。渋川清彦がゲスト出演。',
      date: '2024-11-22',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第9話「千葉県香取市のドライブインの豚肉キムチ卵炒め定食」',
      description: '香取市のドライブインで豚肉キムチ卵炒め定食を味わう。黒木華がゲスト出演。',
      date: '2024-11-29',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第10話「東京都中野区新井の南インドランチ」',
      description: '中野区で南インドランチを楽しむ。結木滉星、肥後克広がゲスト出演。',
      date: '2024-12-06',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第11話「東京都武蔵野市吉祥寺のチキンてりやきと惣菜盛り合わせ定食」',
      description: '吉祥寺でチキンてりやきと惣菜盛り合わせ定食を堪能。平祐奈、久住昌之がゲスト出演。',
      date: '2024-12-13',
      celebrity_id: null,
      video_url: ''
    },
    {
      title: '孤独のグルメ Season11 第12話「神奈川県横浜市関内の大トロ頭肉と鶏の水炊き」',
      description: '横浜市関内で大トロ頭肉と鶏の水炊きを味わう。川原和久がゲスト出演。',
      date: '2024-12-20',
      celebrity_id: null,
      video_url: ''
    }
  ]

  console.log(`📝 ${episodes.length}話のエピソードを追加します...`)

  let successCount = 0

  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i]
    const episodeId = randomUUID()
    
    console.log(`\n📺 第${i + 1}話を追加中: ${episode.title}`)
    console.log(`🆔 UUID: ${episodeId}`)

    const { data, error } = await supabase
      .from('episodes')
      .insert({
        id: episodeId,
        title: episode.title,
        description: episode.description,
        date: episode.date,
        celebrity_id: episode.celebrity_id,
        video_url: episode.video_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error(`❌ 第${i + 1}話の追加エラー:`, error.message)
      continue
    }

    console.log(`✅ 第${i + 1}話を追加完了`)
    successCount++
  }

  console.log(`\n🎉 Season11の${successCount}/${episodes.length}話を追加完了！`)
  
  if (successCount === episodes.length) {
    console.log('\n📋 次のステップ:')
    console.log('1. 松重豊さんのcelebrity_idを確認・関連付け')
    console.log('2. 各エピソードのロケーション情報を調査・追加')
    console.log('3. タベログURLの正確性確認・修正')
    console.log('\n💡 Season11は「それぞれの孤独のグルメ」として、従来とは異なる形式です')
  }
}

addSeason11Episodes()