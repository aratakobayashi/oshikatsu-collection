/**
 * ステージングから本番への完全同期
 * 1. ステージング重複エピソード削除（本番と同様に）
 * 2. 不足エピソードを本番に追加
 * 3. ロケーション・アイテムデータの同期
 * 4. エピソード関連付けの同期
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { writeFileSync } from 'fs'

// 環境変数読み込み
const stagingEnv = dotenv.config({ path: '.env.staging' })
const productionEnv = dotenv.config({ path: '.env.production' })

const stagingUrl = stagingEnv.parsed?.VITE_SUPABASE_URL!
const stagingKey = stagingEnv.parsed?.VITE_SUPABASE_ANON_KEY!
const productionUrl = productionEnv.parsed?.VITE_SUPABASE_URL!
const productionKey = productionEnv.parsed?.VITE_SUPABASE_ANON_KEY!

const stagingSupabase = createClient(stagingUrl, stagingKey)
const productionSupabase = createClient(productionUrl, productionKey)

interface Episode {
  id: string
  title: string
  description?: string
  video_url: string
  thumbnail_url?: string
  date: string
  view_count?: number
  like_count?: number
  comment_count?: number
  celebrity_id?: string
  episode_locations?: any[]
  episode_items?: any[]
}

async function step1_cleanStagingDuplicates() {
  console.log('🧹 Step 1: ステージング環境の重複エピソード削除...\n')
  
  // ステージングの重複分析（本番と同じロジック）
  const { data: episodes, error } = await stagingSupabase
    .from('episodes')
    .select(`
      id,
      title,
      video_url,
      date,
      episode_locations!left(id),
      episode_items!left(id)
    `)
    .order('title')
  
  if (error || !episodes) {
    console.error('❌ ステージングエピソード取得エラー:', error)
    return { success: false, deletedCount: 0 }
  }
  
  console.log(`📊 ステージング総エピソード数: ${episodes.length}件`)
  
  // タイトルごとにグループ化
  const titleGroups = new Map<string, Episode[]>()
  
  for (const episode of episodes) {
    const normalizedTitle = episode.title.trim()
    const episodeData: Episode = {
      id: episode.id,
      title: episode.title,
      video_url: episode.video_url,
      date: episode.date,
      location_count: episode.episode_locations?.length || 0,
      item_count: episode.episode_items?.length || 0
    } as any
    
    if (!titleGroups.has(normalizedTitle)) {
      titleGroups.set(normalizedTitle, [])
    }
    titleGroups.get(normalizedTitle)!.push(episodeData)
  }
  
  // 重複グループから削除候補を特定
  const deletionCandidates: string[] = []
  
  for (const [title, episodeList] of titleGroups.entries()) {
    if (episodeList.length > 1) {
      // タグ数でソート（多い順）、同じ場合は日付が新しい順
      const sortedEpisodes = episodeList.sort((a: any, b: any) => {
        const aTagCount = (a.location_count || 0) + (a.item_count || 0)
        const bTagCount = (b.location_count || 0) + (b.item_count || 0)
        
        if (aTagCount !== bTagCount) {
          return bTagCount - aTagCount
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      
      // 最初の1件以外を削除候補に追加
      for (let i = 1; i < sortedEpisodes.length; i++) {
        deletionCandidates.push(sortedEpisodes[i].id)
      }
    }
  }
  
  console.log(`🗑️ ステージング削除候補: ${deletionCandidates.length}件`)
  
  // バックアップ
  const backupData = []
  for (const episodeId of deletionCandidates) {
    const { data: episode } = await stagingSupabase
      .from('episodes')
      .select('*')
      .eq('id', episodeId)
      .single()
    
    if (episode) backupData.push(episode)
  }
  
  const timestamp = new Date().toISOString().split('T')[0]
  writeFileSync(`./data-backup/staging-duplicates-backup-${timestamp}.json`, JSON.stringify(backupData, null, 2))
  console.log(`💾 バックアップ完了: staging-duplicates-backup-${timestamp}.json`)
  
  // 削除実行
  let deletedCount = 0
  for (const episodeId of deletionCandidates) {
    try {
      // 関連データ削除
      await stagingSupabase.from('episode_locations').delete().eq('episode_id', episodeId)
      await stagingSupabase.from('episode_items').delete().eq('episode_id', episodeId)
      
      // エピソード削除
      const { error: deleteError } = await stagingSupabase
        .from('episodes')
        .delete()
        .eq('id', episodeId)
      
      if (!deleteError) {
        deletedCount++
      }
    } catch (err) {
      console.error(`❌ 削除エラー ${episodeId}:`, err)
    }
  }
  
  console.log(`✅ ステージング重複削除完了: ${deletedCount}件削除\n`)
  return { success: true, deletedCount }
}

async function step2_syncEpisodes() {
  console.log('📺 Step 2: エピソードデータ同期...\n')
  
  // クリーンアップ後のステージングエピソード取得
  const { data: stagingEpisodes, error: stagingError } = await stagingSupabase
    .from('episodes')
    .select('id, title, description, video_url, thumbnail_url, date, view_count, like_count, comment_count')
    .order('date')
  
  if (stagingError || !stagingEpisodes) {
    console.error('❌ ステージングデータ取得エラー:', stagingError)
    return { success: false, addedCount: 0 }
  }
  
  // 本番の既存エピソードID取得
  const { data: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('id')
  
  const existingIds = new Set(productionEpisodes?.map(ep => ep.id) || [])
  
  // 本番にない新規エピソードを特定
  const newEpisodes = stagingEpisodes.filter(ep => !existingIds.has(ep.id))
  
  console.log(`📊 ステージング総数: ${stagingEpisodes.length}件`)
  console.log(`📊 本番既存: ${existingIds.size}件`)
  console.log(`📊 追加対象: ${newEpisodes.length}件`)
  
  if (newEpisodes.length === 0) {
    console.log('✅ エピソード同期: 追加不要\n')
    return { success: true, addedCount: 0 }
  }
  
  // よにのちゃんねるのcelebrity_idを取得
  const { data: celebrity } = await productionSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.error('❌ よにのちゃんねるのcelebrity_idが見つかりません')
    return { success: false, addedCount: 0 }
  }
  
  // バッチ処理で追加
  let addedCount = 0
  const batchSize = 50
  
  for (let i = 0; i < newEpisodes.length; i += batchSize) {
    const batch = newEpisodes.slice(i, i + batchSize)
    
    const cleanBatch = batch.map(ep => ({
      id: ep.id,
      title: ep.title,
      description: ep.description || '',
      video_url: ep.video_url,
      thumbnail_url: ep.thumbnail_url || '',
      date: ep.date,
      view_count: ep.view_count || 0,
      like_count: ep.like_count || 0,
      comment_count: ep.comment_count || 0,
      celebrity_id: celebrity.id
    }))
    
    try {
      const { data, error } = await productionSupabase
        .from('episodes')
        .insert(cleanBatch)
        .select()
      
      if (error) {
        console.error(`❌ バッチ${Math.floor(i/batchSize) + 1}エラー:`, error.message)
      } else {
        addedCount += data?.length || 0
        console.log(`✅ バッチ${Math.floor(i/batchSize) + 1}: ${data?.length || 0}件追加`)
      }
      
      // レート制限対策
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (err) {
      console.error(`❌ 予期しないエラー:`, err)
    }
  }
  
  console.log(`✅ エピソード同期完了: ${addedCount}件追加\n`)
  return { success: true, addedCount }
}

async function step3_syncLocationsAndItems() {
  console.log('📍 Step 3: ロケーション・アイテムデータ同期...\n')
  
  // ステージングのロケーションとアイテムを取得
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('*')
  
  const { data: stagingItems } = await stagingSupabase
    .from('items')
    .select('*')
  
  // 本番の既存データ取得
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('id')
  
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('id')
  
  const existingLocationIds = new Set(productionLocations?.map(loc => loc.id) || [])
  const existingItemIds = new Set(productionItems?.map(item => item.id) || [])
  
  // 新規データのみフィルタリング
  const newLocations = stagingLocations?.filter(loc => !existingLocationIds.has(loc.id)) || []
  const newItems = stagingItems?.filter(item => !existingItemIds.has(item.id)) || []
  
  console.log(`📍 新規ロケーション: ${newLocations.length}件`)
  console.log(`🏷️ 新規アイテム: ${newItems.length}件`)
  
  let locationCount = 0
  let itemCount = 0
  
  // ロケーション追加
  if (newLocations.length > 0) {
    const { data, error } = await productionSupabase
      .from('locations')
      .insert(newLocations)
      .select()
    
    if (error) {
      console.error('❌ ロケーション追加エラー:', error.message)
    } else {
      locationCount = data?.length || 0
      console.log(`✅ ロケーション追加: ${locationCount}件`)
      
      // 追加されたロケーション名を表示
      newLocations.slice(0, 5).forEach(loc => {
        console.log(`   - ${loc.name}`)
      })
      if (newLocations.length > 5) {
        console.log(`   ... 他${newLocations.length - 5}件`)
      }
    }
  }
  
  // アイテム追加
  if (newItems.length > 0) {
    const { data, error } = await productionSupabase
      .from('items')
      .insert(newItems)
      .select()
    
    if (error) {
      console.error('❌ アイテム追加エラー:', error.message)
    } else {
      itemCount = data?.length || 0
      console.log(`✅ アイテム追加: ${itemCount}件`)
      
      // 追加されたアイテム名を表示
      newItems.slice(0, 5).forEach(item => {
        console.log(`   - ${item.name}`)
      })
      if (newItems.length > 5) {
        console.log(`   ... 他${newItems.length - 5}件`)
      }
    }
  }
  
  console.log('')
  return { locationCount, itemCount }
}

async function step4_syncRelationships() {
  console.log('🔗 Step 4: エピソード関連付け同期...\n')
  
  // ステージングの関連付けデータ取得
  const { data: stagingLocationRels } = await stagingSupabase
    .from('episode_locations')
    .select('*')
  
  const { data: stagingItemRels } = await stagingSupabase
    .from('episode_items')
    .select('*')
  
  // 本番に存在するエピソードIDのみを対象とする
  const { data: productionEpisodes } = await productionSupabase
    .from('episodes')
    .select('id')
  
  const validEpisodeIds = new Set(productionEpisodes?.map(ep => ep.id) || [])
  
  // 本番に存在するロケーション・アイテムIDのみを対象とする
  const { data: productionLocations } = await productionSupabase
    .from('locations')
    .select('id')
  
  const { data: productionItems } = await productionSupabase
    .from('items')
    .select('id')
  
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
      .insert(newLocationRels.map(rel => ({
        episode_id: rel.episode_id,
        location_id: rel.location_id
      })))
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
      .insert(newItemRels.map(rel => ({
        episode_id: rel.episode_id,
        item_id: rel.item_id
      })))
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

async function step5_verifySync() {
  console.log('🔍 Step 5: 同期後検証...\n')
  
  // 各環境の最終状態を取得
  const { count: stagingEpisodeCount } = await stagingSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionEpisodeCount } = await productionSupabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
  
  const { count: stagingLocationCount } = await stagingSupabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionLocationCount } = await productionSupabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  const { count: stagingItemCount } = await stagingSupabase
    .from('items')
    .select('*', { count: 'exact', head: true })
  
  const { count: productionItemCount } = await productionSupabase
    .from('items')
    .select('*', { count: 'exact', head: true })
  
  // タグ付きエピソード数確認
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
  
  console.log('📊 同期後比較:')
  console.log('項目'.padEnd(20) + 'ステージング'.padEnd(12) + '本番'.padEnd(8) + '差分')
  console.log('='.repeat(50))
  console.log('エピソード'.padEnd(20) + `${stagingEpisodeCount}`.padEnd(12) + `${productionEpisodeCount}`.padEnd(8) + `${(productionEpisodeCount || 0) - (stagingEpisodeCount || 0)}`)
  console.log('ロケーション'.padEnd(20) + `${stagingLocationCount}`.padEnd(12) + `${productionLocationCount}`.padEnd(8) + `${(productionLocationCount || 0) - (stagingLocationCount || 0)}`)
  console.log('アイテム'.padEnd(20) + `${stagingItemCount}`.padEnd(12) + `${productionItemCount}`.padEnd(8) + `${(productionItemCount || 0) - (stagingItemCount || 0)}`)
  
  console.log(`\n🏷️ 本番タグ付きエピソード: ${productionTaggedCount}件`)
  
  const isFullySync = 
    Math.abs((productionEpisodeCount || 0) - (stagingEpisodeCount || 0)) <= 5 &&
    Math.abs((productionLocationCount || 0) - (stagingLocationCount || 0)) <= 5 &&
    productionTaggedCount > 50
  
  if (isFullySync) {
    console.log('\n✅ 同期完了: 両環境がほぼ同じ状態になりました')
  } else {
    console.log('\n⚠️ 同期未完了: まだ差分があります')
  }
  
  return { isFullySync, productionTaggedCount }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 ステージング→本番 完全同期開始\n')
    console.log('このプロセスには以下のステップが含まれます:')
    console.log('1. ステージング重複エピソード削除')
    console.log('2. エピソードデータ同期') 
    console.log('3. ロケーション・アイテムデータ同期')
    console.log('4. エピソード関連付け同期')
    console.log('5. 同期後検証\n')
    
    const step1Result = await step1_cleanStagingDuplicates()
    if (!step1Result.success) {
      throw new Error('Step 1 失敗')
    }
    
    const step2Result = await step2_syncEpisodes()
    if (!step2Result.success) {
      throw new Error('Step 2 失敗')
    }
    
    const step3Result = await step3_syncLocationsAndItems()
    const step4Result = await step4_syncRelationships()
    const step5Result = await step5_verifySync()
    
    // 最終レポート
    console.log('\n' + '='.repeat(60))
    console.log('🎉 同期完了レポート')
    console.log('='.repeat(60))
    console.log(`🧹 ステージング重複削除: ${step1Result.deletedCount}件`)
    console.log(`📺 エピソード追加: ${step2Result.addedCount}件`)
    console.log(`📍 ロケーション追加: ${step3Result.locationCount}件`)
    console.log(`🏷️ アイテム追加: ${step3Result.itemCount}件`)
    console.log(`🔗 関連付け追加: ${step4Result.locationRelCount + step4Result.itemRelCount}件`)
    console.log(`🎯 本番タグ付きエピソード: ${step5Result.productionTaggedCount}件`)
    
    if (step5Result.isFullySync) {
      console.log('\n✅ ステージング→本番同期が完了しました！')
      console.log('🚀 両環境が同じ状態になりました')
    } else {
      console.log('\n⚠️ 一部同期が未完了です')
      console.log('🔧 手動での調整が必要かもしれません')
    }
    
  } catch (error) {
    console.error('❌ 同期処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}