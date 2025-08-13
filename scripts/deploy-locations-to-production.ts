/**
 * 本番環境へのロケーション追加デプロイ
 * ステージングで成功した20件のロケーションを本番に安全に反映
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

// 追加対象の20件のロケーション（ステージングで成功確認済み）
const locationsToAdd = [
  'OVERRIDE 神宮前',
  'CozyStyleCOFFEE',
  '西公園',
  '博多元気一杯!!',
  'LATTE ART MANIA TOKYO',
  '熟豚三代目蔵司',
  '洋麺屋 五右衛門 赤坂店',
  'dancyu食堂',
  'ル・パン・コティディアン',
  'トーキョーアジフライ',
  '二丁目食堂トレド',
  '土鍋炊ごはん なかよし',
  'おひつ膳田んぼ',
  '東京都庁第一庁舎32階職員食堂',
  'あん梅',
  '伊東食堂',
  '筋肉食堂',
  '胡同',
  '相撲茶屋 寺尾',
  '秋葉原カリガリ'
]

async function createProductionBackup() {
  console.log('💾 本番環境バックアップ作成中...\n')
  
  const timestamp = new Date().toISOString().split('T')[0]
  
  const backup = {
    timestamp,
    locations: [],
    episodes: [],
    episode_locations: [],
    items: [],
    episode_items: []
  } as any
  
  // ロケーション
  const { data: locations } = await productionSupabase
    .from('locations')
    .select('*')
  
  backup.locations = locations || []
  console.log(`✅ ロケーション: ${locations?.length || 0}件`)
  
  // エピソード（最近の50件のみ）
  const { data: episodes } = await productionSupabase
    .from('episodes')
    .select('*')
    .order('date', { ascending: false })
    .limit(50)
  
  backup.episodes = episodes || []
  console.log(`✅ エピソード: ${episodes?.length || 0}件`)
  
  // 関連付け
  const { data: episodeLocations } = await productionSupabase
    .from('episode_locations')
    .select('*')
  
  backup.episode_locations = episodeLocations || []
  console.log(`✅ エピソード-ロケーション関連付け: ${episodeLocations?.length || 0}件`)
  
  const { data: items } = await productionSupabase
    .from('items')
    .select('*')
  
  backup.items = items || []
  console.log(`✅ アイテム: ${items?.length || 0}件`)
  
  const { data: episodeItems } = await productionSupabase
    .from('episode_items')
    .select('*')
  
  backup.episode_items = episodeItems || []
  console.log(`✅ エピソード-アイテム関連付け: ${episodeItems?.length || 0}件`)
  
  const backupPath = `./data-backup/production-pre-deploy-${timestamp}.json`
  writeFileSync(backupPath, JSON.stringify(backup, null, 2))
  
  console.log(`\n💾 本番バックアップ完了: ${backupPath}\n`)
  return backupPath
}

async function getSuccessfulStagingData() {
  console.log('📋 ステージング成功データ取得中...\n')
  
  // ステージングから追加対象ロケーション取得
  const { data: stagingLocations } = await stagingSupabase
    .from('locations')
    .select('*')
    .in('name', locationsToAdd)
  
  console.log(`📍 ステージング追加ロケーション: ${stagingLocations?.length || 0}件`)
  
  if (!stagingLocations || stagingLocations.length === 0) {
    throw new Error('ステージングに追加ロケーションが見つかりません')
  }
  
  // 対応するエピソードと関連付けを取得
  const locationIds = stagingLocations.map(loc => loc.id)
  
  const { data: stagingRelations } = await stagingSupabase
    .from('episode_locations')
    .select(`
      episode_id,
      location_id,
      episodes!inner(id, title, video_url, date, celebrity_id)
    `)
    .in('location_id', locationIds)
  
  console.log(`🔗 ステージング関連付け: ${stagingRelations?.length || 0}件`)
  
  // ユニークエピソード抽出
  const uniqueEpisodes = new Map()
  stagingRelations?.forEach((rel: any) => {
    const episode = rel.episodes
    if (episode && !uniqueEpisodes.has(episode.id)) {
      uniqueEpisodes.set(episode.id, episode)
    }
  })
  
  console.log(`📺 対応エピソード: ${uniqueEpisodes.size}件`)
  
  return {
    locations: stagingLocations,
    relations: stagingRelations,
    episodes: Array.from(uniqueEpisodes.values())
  }
}

async function generateUniqueSlug(name: string, productionSlugs: Set<string>): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim()
  
  if (!baseSlug) {
    baseSlug = 'location'
  }
  
  let uniqueSlug = baseSlug
  let counter = 1
  
  while (productionSlugs.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
  
  productionSlugs.add(uniqueSlug)
  return uniqueSlug
}

async function deployToProduction(stagingData: any) {
  console.log('🚀 本番環境へのデプロイ開始...\n')
  
  // 本番環境のcelebrity取得
  const { data: prodCelebrity } = await productionSupabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!prodCelebrity) {
    throw new Error('本番環境でCelebrityが見つかりません')
  }
  
  // 既存slug取得
  const { data: existingLocations } = await productionSupabase
    .from('locations')
    .select('slug')
  
  const existingSlugs = new Set(
    existingLocations?.map(loc => loc.slug).filter(Boolean) || []
  )
  
  console.log(`📊 本番既存slug: ${existingSlugs.size}件`)
  
  // エピソード追加
  console.log('📺 エピソード追加中...')
  const episodeIdMapping = new Map()
  let addedEpisodes = 0
  
  for (const stagingEpisode of stagingData.episodes) {
    // 本番に既存チェック
    const { data: existing } = await productionSupabase
      .from('episodes')
      .select('id')
      .eq('title', stagingEpisode.title)
      .single()
    
    if (existing) {
      episodeIdMapping.set(stagingEpisode.id, existing.id)
      console.log(`⚠️ エピソード既存: ${stagingEpisode.title}`)
    } else {
      // 新規追加
      const episodeForProduction = {
        ...stagingEpisode,
        celebrity_id: prodCelebrity.id
      }
      delete episodeForProduction.id // IDは自動生成
      
      const { data: newEpisode, error } = await productionSupabase
        .from('episodes')
        .insert([episodeForProduction])
        .select('id')
        .single()
      
      if (error || !newEpisode) {
        console.log(`❌ ${stagingEpisode.title} エピソード追加エラー: ${error?.message}`)
        continue
      }
      
      episodeIdMapping.set(stagingEpisode.id, newEpisode.id)
      console.log(`✅ エピソード追加: ${stagingEpisode.title}`)
      addedEpisodes++
    }
  }
  
  console.log(`📺 エピソード追加完了: ${addedEpisodes}件\n`)
  
  // ロケーション追加
  console.log('📍 ロケーション追加中...')
  const locationIdMapping = new Map()
  let addedLocations = 0
  
  for (const stagingLocation of stagingData.locations) {
    // 本番に既存チェック
    const { data: existing } = await productionSupabase
      .from('locations')
      .select('id')
      .eq('name', stagingLocation.name)
      .single()
    
    if (existing) {
      locationIdMapping.set(stagingLocation.id, existing.id)
      console.log(`⚠️ ロケーション既存: ${stagingLocation.name}`)
    } else {
      // ユニークslug生成
      const uniqueSlug = await generateUniqueSlug(stagingLocation.name, existingSlugs)
      
      const locationForProduction = {
        name: stagingLocation.name,
        address: stagingLocation.address,
        slug: uniqueSlug,
        celebrity_id: prodCelebrity.id
      }
      
      const { data: newLocation, error } = await productionSupabase
        .from('locations')
        .insert([locationForProduction])
        .select('id')
        .single()
      
      if (error || !newLocation) {
        console.log(`❌ ${stagingLocation.name} ロケーション追加エラー: ${error?.message}`)
        continue
      }
      
      locationIdMapping.set(stagingLocation.id, newLocation.id)
      console.log(`✅ ロケーション追加: ${stagingLocation.name} (${uniqueSlug})`)
      addedLocations++
    }
  }
  
  console.log(`📍 ロケーション追加完了: ${addedLocations}件\n`)
  
  // 関連付け追加
  console.log('🔗 関連付け追加中...')
  let addedRelations = 0
  
  for (const stagingRelation of stagingData.relations) {
    const newEpisodeId = episodeIdMapping.get(stagingRelation.episode_id)
    const newLocationId = locationIdMapping.get(stagingRelation.location_id)
    
    if (!newEpisodeId || !newLocationId) {
      console.log(`⚠️ 関連付けスキップ: エピソードまたはロケーション不足`)
      continue
    }
    
    // 既存チェック
    const { data: existingRelation } = await productionSupabase
      .from('episode_locations')
      .select('id')
      .eq('episode_id', newEpisodeId)
      .eq('location_id', newLocationId)
      .single()
    
    if (existingRelation) {
      console.log(`⚠️ 関連付け既存`)
      continue
    }
    
    // 新規追加
    const { error } = await productionSupabase
      .from('episode_locations')
      .insert([{
        episode_id: newEpisodeId,
        location_id: newLocationId
      }])
    
    if (error) {
      console.log(`❌ 関連付けエラー: ${error.message}`)
    } else {
      addedRelations++
      console.log(`✅ 関連付け追加完了`)
    }
  }
  
  console.log(`🔗 関連付け追加完了: ${addedRelations}件\n`)
  
  return {
    addedEpisodes,
    addedLocations, 
    addedRelations
  }
}

async function verifyProductionResults() {
  console.log('🔍 本番環境結果確認中...\n')
  
  // 追加されたロケーションを確認
  const { data: addedLocations } = await productionSupabase
    .from('locations')
    .select('id, name, address')
    .in('name', locationsToAdd)
  
  console.log(`📍 本番追加ロケーション: ${addedLocations?.length || 0}件`)
  addedLocations?.forEach((loc, i) => {
    console.log(`${i + 1}. ${loc.name}`)
  })
  
  // タグ付きエピソード確認
  const { data: taggedEpisodes } = await productionSupabase
    .from('episodes')
    .select(`
      id, title,
      episode_locations!left(id),
      episode_items!left(id)
    `)
  
  const taggedCount = taggedEpisodes?.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  ).length || 0
  
  console.log(`🎯 本番タグ付きエピソード総数: ${taggedCount}件`)
  
  return {
    addedLocations: addedLocations?.length || 0,
    taggedEpisodes: taggedCount
  }
}

// メイン実行
async function main() {
  try {
    console.log('🚀 本番環境デプロイ開始\n')
    console.log('ステージングで検証済みの20件のロケーションを本番に反映します\n')
    
    // 1. バックアップ作成
    const backupPath = await createProductionBackup()
    
    // 2. ステージング成功データ取得
    const stagingData = await getSuccessfulStagingData()
    
    // 3. 本番環境へのデプロイ
    const deployResult = await deployToProduction(stagingData)
    
    // 4. 結果確認
    const verifyResult = await verifyProductionResults()
    
    // 5. デプロイレポート作成
    const timestamp = new Date().toISOString().split('T')[0]
    const deployReport = {
      timestamp,
      backup_path: backupPath,
      deploy_results: deployResult,
      verification_results: verifyResult,
      target_locations: locationsToAdd
    }
    
    writeFileSync(
      `./data-backup/production-deploy-report-${timestamp}.json`,
      JSON.stringify(deployReport, null, 2)
    )
    
    console.log('\n' + '='.repeat(60))
    console.log('🎉 本番環境デプロイ完了レポート')
    console.log('='.repeat(60))
    console.log(`💾 バックアップ: ${backupPath}`)
    console.log(`📺 追加エピソード: ${deployResult.addedEpisodes}件`)
    console.log(`📍 追加ロケーション: ${deployResult.addedLocations}件`)
    console.log(`🔗 追加関連付け: ${deployResult.addedRelations}件`)
    console.log(`🎯 本番タグ付きエピソード: ${verifyResult.taggedEpisodes}件`)
    console.log(`✅ 本番追加ロケーション: ${verifyResult.addedLocations}件`)
    
    const successRate = Math.round((verifyResult.addedLocations / locationsToAdd.length) * 100)
    
    if (successRate >= 80) {
      console.log(`\n🎉 デプロイ成功率: ${successRate}%`)
      console.log('✅ 本番環境への反映が正常に完了しました')
      console.log('💡 競合カバー率の大幅改善が期待できます')
    } else {
      console.log(`\n⚠️ デプロイ成功率: ${successRate}%`)
      console.log('🔧 一部のロケーションで問題が発生した可能性があります')
    }
    
  } catch (error) {
    console.error('❌ デプロイエラー:', error)
    console.log('\n🔄 必要に応じてバックアップからの復元を検討してください')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}