#!/usr/bin/env node

/**
 * Season11の全エピソードを松重豊さんに関連付け
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 松重豊さんのID（Season10で使用された）
const MATSUSHIGE_ID = '39bb6fe4-97ed-439d-9bb6-868dd660ec66'

async function linkSeason11ToMatsushige() {
  console.log('🎭 Season11の全エピソードを松重豊さんに関連付け中...\n')

  // まず松重豊さんの情報を確認
  console.log('👤 松重豊さんの情報確認中...')
  const { data: celebrity, error: celebrityError } = await supabase
    .from('celebrities')
    .select('id, name')
    .eq('id', MATSUSHIGE_ID)
    .single()

  if (celebrityError || !celebrity) {
    console.error('❌ 松重豊さんの情報が見つかりません:', celebrityError)
    return
  }

  console.log(`✅ 松重豊さんの情報確認: ${celebrity.name} (${celebrity.id})`)

  // Season11のエピソードを取得
  console.log('\n📺 Season11エピソード取得中...')
  const { data: season11Episodes, error: episodesError } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .like('title', '%Season11%')
    .order('title')

  if (episodesError || !season11Episodes) {
    console.error('❌ Season11エピソード取得エラー:', episodesError)
    return
  }

  console.log(`✅ Season11エピソード取得: ${season11Episodes.length}話`)

  // 各エピソードの現在の関連付け状況を確認
  console.log('\n🔍 現在の関連付け状況:')
  let needsUpdate = 0
  season11Episodes.forEach(episode => {
    const isLinked = episode.celebrity_id === MATSUSHIGE_ID
    const status = isLinked ? '✅ 関連付け済み' : '❌ 未関連付け'
    console.log(`  ${episode.title.replace('孤独のグルメ Season11 ', '')}: ${status}`)
    if (!isLinked) needsUpdate++
  })

  if (needsUpdate === 0) {
    console.log('\n🎉 すべてのエピソードが既に関連付け済みです！')
    return
  }

  console.log(`\n🔧 ${needsUpdate}話のエピソードを松重豊さんに関連付け中...`)

  let successCount = 0

  for (const episode of season11Episodes) {
    if (episode.celebrity_id === MATSUSHIGE_ID) {
      console.log(`⏭️  ${episode.title.replace('孤独のグルメ Season11 ', '')}: 既に関連付け済み`)
      continue
    }

    const { error: updateError } = await supabase
      .from('episodes')
      .update({ 
        celebrity_id: MATSUSHIGE_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', episode.id)

    if (updateError) {
      console.error(`❌ ${episode.title}の関連付けエラー:`, updateError.message)
      continue
    }

    console.log(`✅ ${episode.title.replace('孤独のグルメ Season11 ', '')}: 関連付け完了`)
    successCount++
  }

  console.log(`\n🎉 ${successCount}話の関連付けが完了しました！`)
  console.log('💡 これで松重豊さんのページにSeason11のエピソードが表示されます。')
}

linkSeason11ToMatsushige()