/**
 * ステージング環境状態確認
 * 現在のデータ数とクリーンアップ後の状態をチェック
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)

async function checkStagingStatus() {
  console.log('🔍 ステージング環境状態確認\n')
  
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  console.log('テーブル名'.padEnd(20) + '件数'.padEnd(10) + '状態')
  console.log('='.repeat(40))
  
  for (const table of tables) {
    const { count, error } = await stagingSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    const status = error ? '❌ エラー' : count === 0 ? '⚠️ 空' : '✅ データあり'
    
    console.log(
      table.padEnd(20) + 
      (count || 0).toString().padEnd(10) + 
      status
    )
    
    if (error) {
      console.log(`   エラー詳細: ${error.message}`)
    }
  }
  
  // エピソード詳細確認
  const { data: episodes } = await stagingSupabase
    .from('episodes')
    .select('id, title, date')
    .order('date', { ascending: false })
    .limit(5)
  
  if (episodes && episodes.length > 0) {
    console.log('\n📺 最新エピソード（上位5件）:')
    episodes.forEach((ep, i) => {
      console.log(`${i + 1}. ${ep.title} (${ep.date})`)
    })
  }
  
  // ロケーション確認
  const { data: locations } = await stagingSupabase
    .from('locations')
    .select('id, name')
    .order('name')
    .limit(10)
  
  if (locations && locations.length > 0) {
    console.log('\n📍 ロケーション（上位10件）:')
    locations.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`)
    })
  }
  
  return {
    episodeCount: await getStagingCount('episodes'),
    locationCount: await getStagingCount('locations'),
    itemCount: await getStagingCount('items'),
    celebrityCount: await getStagingCount('celebrities')
  }
}

async function getStagingCount(table: string): Promise<number> {
  const { count } = await stagingSupabase
    .from(table)
    .select('*', { count: 'exact', head: true })
  return count || 0
}

// メイン実行
async function main() {
  try {
    const status = await checkStagingStatus()
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 ステージング環境サマリー')
    console.log('='.repeat(50))
    console.log(`📺 エピソード: ${status.episodeCount}件`)
    console.log(`📍 ロケーション: ${status.locationCount}件`)
    console.log(`🏷️ アイテム: ${status.itemCount}件`)
    console.log(`🎭 セレブリティ: ${status.celebrityCount}件`)
    
    if (status.episodeCount === 0) {
      console.log('\n⚠️ ステージング環境は空です')
      console.log('💡 本番データを復元するか、新しいデータを追加する必要があります')
    } else {
      console.log('\n✅ ステージング環境はデータを保持しています')
      console.log('🚀 追加データのテストが可能です')
    }
    
  } catch (error) {
    console.error('❌ ステージング状態確認エラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}