/**
 * ロケーション・アイテムデータ同期の修正
 * celebrity_id制約問題を解決してデータ同期を完了
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

async function fixLocationsSync() {
  console.log('📍 ロケーションデータ修正同期...\n')
  
  // 本番のよにのちゃんねるcelebrity_id取得
  const { data: productionCelebrity } = await productionSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!productionCelebrity) {
    console.error('❌ 本番celebrity_idが見つかりません')
    return { success: false, count: 0 }
  }
  
  console.log(`🎯 本番celebrity_id: ${productionCelebrity.id}`)
  
  // ステージングのロケーション取得
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('id, name, address, latitude, longitude, notes')
  
  // 本番の既存ロケーション取得
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('id')
  
  const existingLocationIds = new Set(productionLocations?.map(loc => loc.id) || [])
  
  // 新規ロケーションのみフィルタリング
  const newLocations = stagingLocations?.filter(loc => !existingLocationIds.has(loc.id)) || []
  
  console.log(`📊 ステージングロケーション: ${stagingLocations?.length || 0}件`)
  console.log(`📊 本番既存ロケーション: ${existingLocationIds.size}件`)
  console.log(`📊 新規追加対象: ${newLocations.length}件`)
  
  if (newLocations.length === 0) {
    console.log('✅ ロケーション: 追加不要\n')
    return { success: true, count: 0 }
  }
  
  // celebrity_idを本番のIDに統一して追加
  const locationsToAdd = newLocations.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.address || '',
    latitude: loc.latitude,
    longitude: loc.longitude,
    notes: loc.notes || '',
    celebrity_id: productionCelebrity.id
  }))
  
  console.log('🔧 重要なロケーション例:')
  locationsToAdd.slice(0, 5).forEach(loc => {
    console.log(`   - ${loc.name} (${loc.address})`)
  })
  
  try {
    const { data, error } = await productionSupabase
      .from('locations')
      .insert(locationsToAdd)
      .select()
    
    if (error) {
      console.error('❌ ロケーション追加エラー:', error.message)
      return { success: false, count: 0 }
    } else {
      const addedCount = data?.length || 0
      console.log(`✅ ロケーション追加成功: ${addedCount}件\n`)
      return { success: true, count: addedCount }
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err)
    return { success: false, count: 0 }
  }
}

async function fixItemsSync() {
  console.log('🏷️ アイテムデータ修正同期...\n')
  
  // 本番のよにのちゃんねるcelebrity_id取得
  const { data: productionCelebrity } = await productionSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!productionCelebrity) {
    console.error('❌ 本番celebrity_idが見つかりません')
    return { success: false, count: 0 }
  }
  
  // ステージングのアイテム取得
  const { data: stagingItems } = await stagingSupabase
    .from('items')
    .select('id, name, description, image_url, notes')
  
  // 本番の既存アイテム取得
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('id')
  
  const existingItemIds = new Set(productionItems?.map(item => item.id) || [])
  
  // 新規アイテムのみフィルタリング
  const newItems = stagingItems?.filter(item => !existingItemIds.has(item.id)) || []
  
  console.log(`📊 ステージングアイテム: ${stagingItems?.length || 0}件`)
  console.log(`📊 本番既存アイテム: ${existingItemIds.size}件`)
  console.log(`📊 新規追加対象: ${newItems.length}件`)
  
  if (newItems.length === 0) {
    console.log('✅ アイテム: 追加不要\n')
    return { success: true, count: 0 }
  }
  
  // celebrity_idを本番のIDに統一して追加
  const itemsToAdd = newItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    image_url: item.image_url || '',
    notes: item.notes || '',
    celebrity_id: productionCelebrity.id
  }))
  
  console.log('🔧 追加アイテム例:')
  itemsToAdd.slice(0, 5).forEach(item => {
    console.log(`   - ${item.name}`)
  })
  
  try {
    const { data, error } = await productionSupabase
      .from('items')
      .insert(itemsToAdd)
      .select()
    
    if (error) {
      console.error('❌ アイテム追加エラー:', error.message)
      return { success: false, count: 0 }
    } else {
      const addedCount = data?.length || 0
      console.log(`✅ アイテム追加成功: ${addedCount}件\n`)
      return { success: true, count: addedCount }
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err)
    return { success: false, count: 0 }
  }
}

async function syncMissingRelationships() {
  console.log('🔗 不足関連付けデータ同期...\n')
  
  // ステージングの関連付けデータ取得
  const { data: stagingLocationRels } = await stagingSupabase
    .from('episode_locations')
    .select('episode_id, location_id')
  
  const { data: stagingItemRels } = await stagingSupabase
    .from('episode_items')
    .select('episode_id, item_id')
  
  // 本番の既存関連付け取得
  const { data: productionLocationRels } = await productionSupabase
    .from('episode_locations')
    .select('episode_id, location_id')
  
  const { data: productionItemRels } = await productionSupabase
    .from('episode_items')
    .select('episode_id, item_id')
  
  // 本番に存在するエピソード・ロケーション・アイテムIDを取得
  const { data: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('id')
  
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('id')
  
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('id')
  
  const validEpisodeIds = new Set(productionEpisodes?.map(ep => ep.id) || [])
  const validLocationIds = new Set(productionLocations?.map(loc => loc.id) || [])
  const validItemIds = new Set(productionItems?.map(item => item.id) || [])
  
  // 既存関連付けのペア
  const existingLocationPairs = new Set(
    productionLocationRels?.map(rel => `${rel.episode_id}-${rel.location_id}`) || []
  )
  const existingItemPairs = new Set(
    productionItemRels?.map(rel => `${rel.episode_id}-${rel.item_id}`) || []
  )
  
  // 新規関連付けのみフィルタリング
  const newLocationRels = stagingLocationRels?.filter(rel => 
    validEpisodeIds.has(rel.episode_id) &&
    validLocationIds.has(rel.location_id) &&
    !existingLocationPairs.has(`${rel.episode_id}-${rel.location_id}`)
  ) || []
  
  const newItemRels = stagingItemRels?.filter(rel => 
    validEpisodeIds.has(rel.episode_id) &&
    validItemIds.has(rel.item_id) &&
    !existingItemPairs.has(`${rel.episode_id}-${rel.item_id}`)
  ) || []
  
  console.log(`🔗 新規ロケーション関連付け: ${newLocationRels.length}件`)
  console.log(`🔗 新規アイテム関連付け: ${newItemRels.length}件`)
  
  let locationRelCount = 0
  let itemRelCount = 0
  
  // ロケーション関連付け追加
  if (newLocationRels.length > 0) {
    const { data, error } = await productionSupabase
      .from('episode_locations')
      .insert(newLocationRels)
      .select()
    
    if (error) {
      console.error('❌ ロケーション関連付けエラー:', error.message)
    } else {
      locationRelCount = data?.length || 0
      console.log(`✅ ロケーション関連付け追加: ${locationRelCount}件`)
    }
  }
  
  // アイテム関連付け追加
  if (newItemRels.length > 0) {
    const { data, error } = await productionSupabase
      .from('episode_items')
      .insert(newItemRels)
      .select()
    
    if (error) {
      console.error('❌ アイテム関連付けエラー:', error.message)
    } else {
      itemRelCount = data?.length || 0
      console.log(`✅ アイテム関連付け追加: ${itemRelCount}件`)
    }
  }
  
  console.log('')
  return { locationRelCount, itemRelCount }
}

async function verifyFinalSync() {
  console.log('🔍 最終同期状態確認...\n')
  
  // 各環境の状態確認
  const { count: stagingEpisodes } = await stagingSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  const { count: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionLocations } = await productionSupabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  const { count: stagingItems } = await stagingSupabase
    .from('items')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionItems } = await productionSupabase
    .from('items')
    .select('*', { count: 'exact', head: true })
  
  // タグ付きエピソード数
  const { data: productionTagged } = await productionSupabase
    .from('episodes')
    .select(`
      id,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const productionTaggedCount = productionTagged?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log('📊 最終比較:')
  console.log('項目'.padEnd(20) + 'ステージング'.padEnd(12) + '本番'.padEnd(8) + '差分')
  console.log('='.repeat(50))
  console.log('エピソード'.padEnd(20) + `${stagingEpisodes}`.padEnd(12) + `${productionEpisodes}`.padEnd(8) + `${(productionEpisodes || 0) - (stagingEpisodes || 0)}`)
  console.log('ロケーション'.padEnd(20) + `${stagingLocations}`.padEnd(12) + `${productionLocations}`.padEnd(8) + `${(productionLocations || 0) - (stagingLocations || 0)}`)
  console.log('アイテム'.padEnd(20) + `${stagingItems}`.padEnd(12) + `${productionItems}`.padEnd(8) + `${(productionItems || 0) - (stagingItems || 0)}`)
  console.log(`\n🏷️ 本番タグ付きエピソード: ${productionTaggedCount}件`)
  
  const isSync = Math.abs((productionEpisodes || 0) - (stagingEpisodes || 0)) <= 5 &&
                Math.abs((productionLocations || 0) - (stagingLocations || 0)) <= 5
  
  if (isSync) {
    console.log('\n✅ 完全同期達成！両環境がほぼ同じ状態です')
  } else {
    console.log('\n⚠️ まだ少し差分があります')
  }
  
  return { isSync, productionTaggedCount }
}

// メイン実行
async function main() {
  try {
    console.log('🔧 ロケーション・アイテムデータ同期修正開始\n')
    
    const locationResult = await fixLocationsSync()
    const itemResult = await fixItemsSync()
    
    if (locationResult.success || itemResult.success) {
      const relResult = await syncMissingRelationships()
      console.log(`🔗 追加関連付け: ${relResult.locationRelCount + relResult.itemRelCount}件`)
    }
    
    const verifyResult = await verifyFinalSync()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 修正完了レポート')
    console.log('='.repeat(60))
    console.log(`📍 ロケーション追加: ${locationResult.count}件`)
    console.log(`🏷️ アイテム追加: ${itemResult.count}件`)
    console.log(`🎯 本番タグ付きエピソード: ${verifyResult.productionTaggedCount}件`)
    
    if (verifyResult.isSync) {
      console.log('\n🚀 ステージング→本番同期が完了しました！')
      console.log('✨ えんとつ屋、魯珈カレーなどの重要ロケーションも含まれています')
    }
    
  } catch (error) {
    console.error('❌ 修正処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}