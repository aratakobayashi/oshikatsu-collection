/**
 * 重要なロケーション・アイテムの強制同期
 * celebrity_id = null でも重要なデータを本番に追加
 * えんとつ屋、魯珈カレー等の競合対応データを含む
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

// 重要ロケーションのキーワード（競合対応で追加したもの）
const importantLocationKeywords = [
  'えんとつ屋',
  '魯珈',
  'ろか', 
  '餃子の王将',
  'ヒルトン東京',
  '400℃ Pizza',
  '挽肉と米',
  '佐野みそ',
  'Burger King',
  'Paul Bassett',
  'KIZASU.COFFEE',
  'Donish Coffee',
  'ゴールドラッシュ',
  'すき家',
  'Blue Seal',
  '海老名サービスエリア',
  '銀座 竹葉亭'
]

async function forceSyncImportantLocations() {
  console.log('📍 重要ロケーションの強制同期開始...\n')
  
  // 本番のcelebrity_idを取得
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
  
  // ステージングから重要ロケーションを取得（celebrity_id関係なく）
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('id, name, address, latitude, longitude, notes, celebrity_id')
  
  if (!stagingLocations) {
    console.error('❌ ステージングロケーション取得失敗')
    return { success: false, count: 0 }
  }
  
  // 重要ロケーションをフィルタリング
  const importantLocations = stagingLocations.filter(loc => 
    importantLocationKeywords.some(keyword => 
      loc.name.includes(keyword) || (loc.address && loc.address.includes(keyword))
    ) && !loc.name.includes('テスト')
  )
  
  console.log(`📊 ステージング全ロケーション: ${stagingLocations.length}件`)
  console.log(`🎯 重要ロケーション特定: ${importantLocations.length}件`)
  
  // 重要ロケーションをリスト表示
  console.log('\n📍 重要ロケーション一覧:')
  importantLocations.forEach((loc, i) => {
    console.log(`${i + 1}. ${loc.name}`)
    if (loc.address) console.log(`   ${loc.address}`)
    console.log(`   Celebrity ID: ${loc.celebrity_id || 'null'}`)
  })
  
  // 本番の既存ロケーション取得
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('id')
  
  const existingLocationIds = new Set(productionLocations?.map(loc => loc.id) || [])
  
  // 本番にない重要ロケーションのみフィルタリング
  const newImportantLocations = importantLocations.filter(loc => 
    !existingLocationIds.has(loc.id)
  )
  
  console.log(`\n📊 本番未登録の重要ロケーション: ${newImportantLocations.length}件`)
  
  if (newImportantLocations.length === 0) {
    console.log('✅ 重要ロケーションはすべて本番に存在します\n')
    return { success: true, count: 0 }
  }
  
  // celebrity_idを本番用に統一して追加
  const locationsToAdd = newImportantLocations.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.address || '',
    latitude: loc.latitude,
    longitude: loc.longitude,
    notes: loc.notes || '',
    celebrity_id: productionCelebrity.id
  }))
  
  console.log('\n🔧 追加する重要ロケーション:')
  locationsToAdd.forEach(loc => {
    console.log(`   ✅ ${loc.name}`)
  })
  
  try {
    const { data, error } = await productionSupabase
      .from('locations')
      .insert(locationsToAdd)
      .select()
    
    if (error) {
      console.error('❌ 重要ロケーション追加エラー:', error.message)
      return { success: false, count: 0 }
    } else {
      const addedCount = data?.length || 0
      console.log(`\n✅ 重要ロケーション追加成功: ${addedCount}件`)
      console.log('🎉 えんとつ屋、魯珈カレー等の競合対応ロケーションを含みます\n')
      return { success: true, count: addedCount }
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err)
    return { success: false, count: 0 }
  }
}

async function forceSyncImportantItems() {
  console.log('🏷️ 重要アイテムの強制同期開始...\n')
  
  // 本番のcelebrity_idを取得
  const { data: productionCelebrity } = await productionSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!productionCelebrity) {
    console.error('❌ 本番celebrity_idが見つかりません')
    return { success: false, count: 0 }
  }
  
  // ステージングからアイテムを取得
  const { data: stagingItems } = await stagingSupabase
    .from('items')
    .select('id, name, description, image_url, notes, celebrity_id')
  
  if (!stagingItems) {
    console.error('❌ ステージングアイテム取得失敗')
    return { success: false, count: 0 }
  }
  
  // テストアイテム以外をフィルタリング
  const realItems = stagingItems.filter(item => 
    !item.name.includes('テスト') && 
    !item.name.includes('test') &&
    item.name.trim().length > 0
  )
  
  console.log(`📊 ステージング全アイテム: ${stagingItems.length}件`)
  console.log(`🎯 実アイテム特定: ${realItems.length}件`)
  
  // 実アイテムをリスト表示
  console.log('\n🏷️ 実アイテム一覧:')
  realItems.forEach((item, i) => {
    console.log(`${i + 1}. ${item.name}`)
    if (item.description) console.log(`   ${item.description}`)
    console.log(`   Celebrity ID: ${item.celebrity_id || 'null'}`)
  })
  
  // 本番の既存アイテム取得
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('id')
  
  const existingItemIds = new Set(productionItems?.map(item => item.id) || [])
  
  // 本番にない実アイテムのみフィルタリング
  const newRealItems = realItems.filter(item => 
    !existingItemIds.has(item.id)
  )
  
  console.log(`\n📊 本番未登録の実アイテム: ${newRealItems.length}件`)
  
  if (newRealItems.length === 0) {
    console.log('✅ 実アイテムはすべて本番に存在します\n')
    return { success: true, count: 0 }
  }
  
  // celebrity_idを本番用に統一して追加
  const itemsToAdd = newRealItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    image_url: item.image_url || '',
    notes: item.notes || '',
    celebrity_id: productionCelebrity.id
  }))
  
  console.log('\n🔧 追加する実アイテム:')
  itemsToAdd.forEach(item => {
    console.log(`   ✅ ${item.name}`)
  })
  
  try {
    const { data, error } = await productionSupabase
      .from('items')
      .insert(itemsToAdd)
      .select()
    
    if (error) {
      console.error('❌ 実アイテム追加エラー:', error.message)
      return { success: false, count: 0 }
    } else {
      const addedCount = data?.length || 0
      console.log(`\n✅ 実アイテム追加成功: ${addedCount}件\n`)
      return { success: true, count: addedCount }
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err)
    return { success: false, count: 0 }
  }
}

async function syncAllMissingRelationships() {
  console.log('🔗 すべての関連付けデータ強制同期...\n')
  
  // ステージングの関連付けデータ取得
  const { data: stagingLocationRels } = await stagingSupabase
    .from('episode_locations')
    .select('episode_id, location_id')
  
  const { data: stagingItemRels } = await stagingSupabase
    .from('episode_items')
    .select('episode_id, item_id')
  
  // 本番の有効なID取得
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
  
  // 既存の関連付け取得
  const { data: existingLocationRels } = await productionSupabase
    .from('episode_locations')
    .select('episode_id, location_id')
  
  const { data: existingItemRels } = await productionSupabase
    .from('episode_items')
    .select('episode_id, item_id')
  
  const existingLocationPairs = new Set(
    existingLocationRels?.map(rel => `${rel.episode_id}-${rel.location_id}`) || []
  )
  const existingItemPairs = new Set(
    existingItemRels?.map(rel => `${rel.episode_id}-${rel.item_id}`) || []
  )
  
  // 有効で新規の関連付けのみフィルタリング
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

async function verifyFinalState() {
  console.log('🔍 最終同期状態確認...\n')
  
  // タグ付きエピソード数確認
  const { data: taggedEpisodes } = await productionSupabase
    .from('episodes')
    .select(`
      id,
      title,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const actualTaggedCount = taggedEpisodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  // 重要ロケーションの存在確認
  const { data: importantLocs } = await productionSupabase
    .from('locations')
    .select('name')
    .or('name.ilike.*えんとつ屋*,name.ilike.*魯珈*,name.ilike.*ろか*')
  
  console.log(`🎯 本番タグ付きエピソード: ${actualTaggedCount}件`)
  console.log(`📍 重要ロケーション確認: ${importantLocs?.length || 0}件`)
  
  if (importantLocs && importantLocs.length > 0) {
    console.log('✅ 確認されたロケーション:')
    importantLocs.forEach(loc => {
      console.log(`   - ${loc.name}`)
    })
  }
  
  const isSuccess = actualTaggedCount > 30 && (importantLocs?.length || 0) > 0
  
  if (isSuccess) {
    console.log('\n🎉 重要データの強制同期が成功しました！')
    console.log('🚀 えんとつ屋、魯珈カレー等が本番に追加されました')
  } else {
    console.log('\n⚠️ 一部データが同期されていない可能性があります')
  }
  
  return { success: isSuccess, taggedCount: actualTaggedCount }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 重要データの強制同期開始\n')
    console.log('競合対応で追加した重要なロケーション・アイテムを本番に同期します\n')
    
    const locationResult = await forceSyncImportantLocations()
    const itemResult = await forceSyncImportantItems()
    
    if (locationResult.success || itemResult.success) {
      console.log('🔗 関連付けデータも同期中...')
      const relResult = await syncAllMissingRelationships()
      console.log(`追加関連付け: ${relResult.locationRelCount + relResult.itemRelCount}件\n`)
    }
    
    const verifyResult = await verifyFinalState()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 強制同期完了レポート')
    console.log('='.repeat(60))
    console.log(`📍 重要ロケーション追加: ${locationResult.count}件`)
    console.log(`🏷️ 実アイテム追加: ${itemResult.count}件`)
    console.log(`🎯 本番タグ付きエピソード: ${verifyResult.taggedCount}件`)
    
    if (verifyResult.success) {
      console.log('\n✅ 重要データの同期が完了しました！')
      console.log('🎊 えんとつ屋、魯珈カレーなどの競合対応ロケーションが利用可能です')
      console.log('🚀 本番環境でユーザーに豊富なロケーション情報を提供できます')
    }
    
  } catch (error) {
    console.error('❌ 強制同期でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}