/**
 * 本番環境のタグ付きエピソード詳細分析
 * - どのエピソードにタグが付いているか
 * - ロケーション・アイテムの内容確認
 * - タグ付きデータの品質チェック
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeTaggedEpisodes() {
  console.log('🏷️ 本番環境タグ付きエピソード詳細分析...\n')
  
  // タグ付きエピソードを取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      date,
      episode_locations!left(
        id,
        location_id,
        locations(name, address)
      ),
      episode_items!left(
        id,
        item_id,
        items(name, description)
      )
    `)
    .order('date', { ascending: false })
  
  if (!episodes) {
    console.log('❌ エピソード取得失敗')
    return
  }
  
  console.log(`📊 総エピソード数: ${episodes.length}件`)
  
  // ロケーション付きエピソード
  const locationEpisodes = episodes.filter(ep => 
    ep.episode_locations && ep.episode_locations.length > 0
  )
  
  // アイテム付きエピソード
  const itemEpisodes = episodes.filter(ep => 
    ep.episode_items && ep.episode_items.length > 0
  )
  
  // 何らかのタグがあるエピソード
  const taggedEpisodes = episodes.filter(ep => 
    (ep.episode_locations && ep.episode_locations.length > 0) ||
    (ep.episode_items && ep.episode_items.length > 0)
  )
  
  console.log(`📍 ロケーション付きエピソード: ${locationEpisodes.length}件`)
  console.log(`🏷️ アイテム付きエピソード: ${itemEpisodes.length}件`)
  console.log(`🎯 タグ付きエピソード合計: ${taggedEpisodes.length}件`)
  console.log(`📺 タグなしエピソード: ${episodes.length - taggedEpisodes.length}件`)
  
  if (taggedEpisodes.length === 0) {
    console.log('\n⚠️ タグ付きエピソードがありません！')
    return
  }
  
  console.log('\n📋 タグ付きエピソード詳細:')
  console.log('='.repeat(80))
  
  for (const [index, episode] of taggedEpisodes.entries()) {
    console.log(`\n${index + 1}. "${episode.title}"`)
    console.log(`   日付: ${episode.date}`)
    console.log(`   ID: ${episode.id}`)
    
    if (episode.episode_locations && episode.episode_locations.length > 0) {
      console.log(`   📍 ロケーション (${episode.episode_locations.length}件):`)
      for (const loc of episode.episode_locations) {
        const location = loc.locations
        console.log(`      - ${location?.name || '名前未設定'}`)
        if (location?.address) {
          console.log(`        ${location.address}`)
        }
      }
    }
    
    if (episode.episode_items && episode.episode_items.length > 0) {
      console.log(`   🏷️ アイテム (${episode.episode_items.length}件):`)
      for (const item of episode.episode_items) {
        const itemData = item.items
        console.log(`      - ${itemData?.name || '名前未設定'}`)
        if (itemData?.description) {
          console.log(`        ${itemData.description}`)
        }
      }
    }
  }
}

async function analyzeAllLocationsAndItems() {
  console.log('\n📍 全ロケーションデータ:')
  console.log('='.repeat(40))
  
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .order('name')
  
  if (locations && locations.length > 0) {
    console.log(`総ロケーション数: ${locations.length}件`)
    for (const [index, location] of locations.entries()) {
      console.log(`${index + 1}. ${location.name}`)
      if (location.address) {
        console.log(`   ${location.address}`)
      }
    }
  } else {
    console.log('⚠️ ロケーションデータがありません')
  }
  
  console.log('\n🏷️ 全アイテムデータ:')
  console.log('='.repeat(40))
  
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .order('name')
  
  if (items && items.length > 0) {
    console.log(`総アイテム数: ${items.length}件`)
    for (const [index, item] of items.entries()) {
      console.log(`${index + 1}. ${item.name}`)
      if (item.description) {
        console.log(`   ${item.description}`)
      }
    }
  } else {
    console.log('⚠️ アイテムデータがありません')
  }
}

async function checkRelationshipData() {
  console.log('\n🔗 関連付けデータの詳細:')
  console.log('='.repeat(40))
  
  const { count: locationRelations } = await supabase
    .from('episode_locations')
    .select('*', { count: 'exact', head: true })
  
  const { count: itemRelations } = await supabase
    .from('episode_items')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📍 episode_locations関連付け: ${locationRelations}件`)
  console.log(`🏷️ episode_items関連付け: ${itemRelations}件`)
  
  // 実際の関連付けデータを確認
  const { data: locationLinks } = await supabase
    .from('episode_locations')
    .select(`
      episode_id,
      episodes(title),
      locations(name)
    `)
    .limit(10)
  
  if (locationLinks && locationLinks.length > 0) {
    console.log('\n📍 ロケーション関連付け例:')
    locationLinks.forEach((link, i) => {
      console.log(`${i + 1}. "${link.episodes?.title}" → ${link.locations?.name}`)
    })
  }
  
  const { data: itemLinks } = await supabase
    .from('episode_items')
    .select(`
      episode_id,
      episodes(title),
      items(name)
    `)
    .limit(10)
  
  if (itemLinks && itemLinks.length > 0) {
    console.log('\n🏷️ アイテム関連付け例:')
    itemLinks.forEach((link, i) => {
      console.log(`${i + 1}. "${link.episodes?.title}" → ${link.items?.name}`)
    })
  }
}

// メイン実行
async function main() {
  try {
    await analyzeTaggedEpisodes()
    await analyzeAllLocationsAndItems()
    await checkRelationshipData()
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 分析結果サマリー')
    console.log('='.repeat(60))
    console.log('本番環境のタグ付き状況を詳細に分析しました。')
    console.log('上記の情報から、現在のタグ付きデータの質と量を確認できます。')
    
  } catch (error) {
    console.error('❌ 分析処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}