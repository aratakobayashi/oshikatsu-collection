#!/usr/bin/env node

/**
 * 最後の問題データ「いろんなお店」を削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteFinalProblemLocation() {
  const targetId = '579ddbcc-eac7-4e0c-96e9-f05769ce8678'
  
  console.log('🧹 最後の問題データ削除')
  console.log('対象: "いろんなお店"')
  
  // Step 1: エピソードリンクを削除
  const { error: episodeError, count: episodeCount } = await supabase
    .from('episode_locations')
    .delete({ count: 'exact' })
    .eq('location_id', targetId)

  if (episodeError) {
    throw new Error(`エピソードリンク削除エラー: ${episodeError.message}`)
  }
  
  console.log(`✅ エピソードリンク ${episodeCount}件削除`)

  // Step 2: ロケーション本体を削除
  const { error: locationError, count: locationCount } = await supabase
    .from('locations')
    .delete({ count: 'exact' })
    .eq('id', targetId)

  if (locationError) {
    throw new Error(`ロケーション削除エラー: ${locationError.message}`)
  }
  
  console.log(`✅ ロケーション ${locationCount}件削除`)
  
  // 最終カウント
  const { count: finalCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })

  console.log(`\n🏆 最終ロケーション数: ${finalCount}件`)
  console.log('✨ 完璧なデータクリーニング達成！')

  return finalCount
}

deleteFinalProblemLocation()
  .catch(error => {
    console.error('❌ 削除エラー:', error)
  })