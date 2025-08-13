/**
 * ステージング環境のデータ詳細調査
 * ロケーション・アイテムがなぜ同期されないかを確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)

async function debugStagingData() {
  console.log('🔍 ステージング環境データ詳細調査...\n')
  
  // 全テーブルの状況確認
  const tables = ['episodes', 'celebrities', 'locations', 'items', 'episode_locations', 'episode_items']
  
  for (const table of tables) {
    console.log(`📋 ${table}テーブル:`)
    
    const { count, error } = await stagingSupabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`   ❌ エラー: ${error.message}`)
    } else {
      console.log(`   📊 件数: ${count}件`)
    }
    
    // サンプルデータ確認
    if (count && count > 0) {
      const { data } = await stagingSupabase
        .from(table)
        .select('*')
        .limit(3)
      
      if (data && data.length > 0) {
        console.log('   サンプルデータ:')
        data.forEach((item, i) => {
          console.log(`   ${i + 1}. ID: ${item.id}`)
          if (item.name) console.log(`      名前: ${item.name}`)
          if (item.title) console.log(`      タイトル: ${item.title}`)
        })
      }
    }
    console.log('')
  }
  
  // celebritiesの詳細確認
  const { data: celebrities } = await stagingSupabase
    .from('celebrities')
    .select('*')
  
  if (celebrities && celebrities.length > 0) {
    console.log('🎭 Celebritiesの詳細:')
    celebrities.forEach(cel => {
      console.log(`   - ID: ${cel.id}`)
      console.log(`     名前: ${cel.name}`)
      console.log(`     スラッグ: ${cel.slug}`)
    })
    console.log('')
  }
  
  // ロケーション・アイテムの詳細（もしあれば）
  const { data: locations } = await stagingSupabase
    .from('locations')
    .select('id, name, celebrity_id')
    .limit(10)
  
  if (locations && locations.length > 0) {
    console.log('📍 ロケーションサンプル:')
    locations.forEach(loc => {
      console.log(`   - ${loc.name} (celebrity_id: ${loc.celebrity_id})`)
    })
    console.log('')
  }
  
  const { data: items } = await stagingSupabase
    .from('items')
    .select('id, name, celebrity_id')
    .limit(10)
  
  if (items && items.length > 0) {
    console.log('🏷️ アイテムサンプル:')
    items.forEach(item => {
      console.log(`   - ${item.name} (celebrity_id: ${item.celebrity_id})`)
    })
    console.log('')
  }
  
  // episode_locationsの詳細
  const { data: episodeLocations } = await stagingSupabase
    .from('episode_locations')
    .select(`
      episode_id,
      location_id,
      episodes(title),
      locations(name)
    `)
    .limit(5)
  
  if (episodeLocations && episodeLocations.length > 0) {
    console.log('🔗 エピソード-ロケーション関連付けサンプル:')
    episodeLocations.forEach(rel => {
      console.log(`   - "${rel.episodes?.title}" → ${rel.locations?.name}`)
    })
    console.log('')
  }
  
  // episode_itemsの詳細
  const { data: episodeItems } = await stagingSupabase
    .from('episode_items')
    .select(`
      episode_id,
      item_id,
      episodes(title),
      items(name)
    `)
    .limit(5)
  
  if (episodeItems && episodeItems.length > 0) {
    console.log('🔗 エピソード-アイテム関連付けサンプル:')
    episodeItems.forEach(rel => {
      console.log(`   - "${rel.episodes?.title}" → ${rel.items?.name}`)
    })
    console.log('')
  }
  
  // タグ付きエピソードの確認
  const { data: taggedEpisodes } = await stagingSupabase
    .from('episodes')
    .select(`
      id,
      title,
      episode_locations!left(id),
      episode_items!left(id)
    `)
    .limit(10)
  
  const actualTaggedEpisodes = taggedEpisodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ) || []
  
  console.log(`🎯 実際のタグ付きエピソード: ${actualTaggedEpisodes.length}件`)
  
  if (actualTaggedEpisodes.length > 0) {
    console.log('タグ付きエピソードサンプル:')
    actualTaggedEpisodes.slice(0, 3).forEach(ep => {
      const locationCount = ep.episode_locations?.length || 0
      const itemCount = ep.episode_items?.length || 0
      console.log(`   - "${ep.title}" (📍${locationCount} 🏷️${itemCount})`)
    })
  }
}

// メイン実行
async function main() {
  try {
    await debugStagingData()
  } catch (error) {
    console.error('❌ 調査処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}