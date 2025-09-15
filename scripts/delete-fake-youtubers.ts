/**
 * 間違って追加した推定データのYouTuberを削除
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 削除対象のYouTuber（今追加した偽データ）
const FAKE_YOUTUBERS = [
  'PewDiePie',
  'MrBeast',
  'Hajime Syacho',
  'Seikin TV',
  'Kizuna AI',
  'GameWith',
  'Kuroba Mario',
  "Fischer's",
  'Kemio',
  'JunsKitchen',
  'Sekine Risa',
  'Nanou',
  'Goose House',
  'TED',
  'Crash Course',
  'Tasty',
  'Bon Appétit',
  'Dude Perfect',
  'F2Freestylers',
  'Marques Brownlee',
  'Veritasium',
  'Emma Chamberlain',
  'Casey Neistat'
]

async function deleteFakeYouTubers() {
  console.log('❌ 偽YouTuberデータ削除開始')
  console.log('==========================\n')

  let deletedCount = 0
  let deletedEpisodes = 0

  for (const youtuberName of FAKE_YOUTUBERS) {
    console.log(`🗑️ ${youtuberName} を削除中...`)

    // セレブリティIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', youtuberName)
      .single()

    if (!celebrity) {
      console.log(`   ⏭️ ${youtuberName} は存在しません`)
      continue
    }

    // エピソードを削除
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)

    if (episodes && episodes.length > 0) {
      const { error: episodeError } = await supabase
        .from('episodes')
        .delete()
        .eq('celebrity_id', celebrity.id)

      if (episodeError) {
        console.log(`   ❌ エピソード削除エラー: ${episodeError.message}`)
      } else {
        deletedEpisodes += episodes.length
        console.log(`   🗑️ ${episodes.length}本のエピソードを削除`)
      }
    }

    // セレブリティを削除
    const { error: celebrityError } = await supabase
      .from('celebrities')
      .delete()
      .eq('id', celebrity.id)

    if (celebrityError) {
      console.log(`   ❌ セレブリティ削除エラー: ${celebrityError.message}`)
    } else {
      console.log(`   ✅ ${youtuberName} 削除完了`)
      deletedCount++
    }
  }

  console.log('\n' + '='.repeat(40))
  console.log('✅ 偽YouTuberデータ削除完了')
  console.log('='.repeat(40))
  console.log(`📊 削除結果:`)
  console.log(`  削除したYouTuber: ${deletedCount}人`)
  console.log(`  削除したエピソード: ${deletedEpisodes}本`)
  console.log('\n❌ 推定データは全て削除されました')
}

// 実行
deleteFakeYouTubers().catch(console.error)