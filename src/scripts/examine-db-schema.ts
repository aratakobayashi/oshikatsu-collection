#!/usr/bin/env npx tsx

/**
 * データベーススキーマ調査
 * locations と episodes の実際の関係性を特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function examineDBSchema() {
  console.log('🔍 データベーススキーマ調査')
  console.log('🤔 なぜロケーションにエピソードが紐づいて見えるのか？')
  console.log('=' .repeat(60))
  
  // 1. locationsテーブルのサンプルデータ確認
  const { data: locationSamples } = await supabase
    .from('locations')
    .select('*')
    .limit(5)
  
  console.log('\n📍 【locationsテーブル構造】')
  if (locationSamples && locationSamples.length > 0) {
    const sample = locationSamples[0]
    console.log('フィールド:')
    Object.keys(sample).forEach(key => {
      console.log(`  - ${key}: ${typeof sample[key]} (${sample[key]})`)
    })
  }
  
  // 2. episode_idフィールドを持つlocationを探す
  const { data: locationsWithEpisodeId } = await supabase
    .from('locations')
    .select('id, name, episode_id, tabelog_url')
    .not('episode_id', 'is', null)
  
  console.log(`\n🔗 【episode_idフィールド持ちlocation】`)
  console.log(`件数: ${locationsWithEpisodeId?.length || 0}件`)
  
  if (locationsWithEpisodeId && locationsWithEpisodeId.length > 0) {
    console.log('詳細:')
    locationsWithEpisodeId.forEach((loc, idx) => {
      console.log(`  ${idx + 1}. ${loc.name}`)
      console.log(`     location_id: ${loc.id}`)
      console.log(`     episode_id: ${loc.episode_id}`)
      console.log(`     tabelog: ${loc.tabelog_url ? '✅' : '❌'}`)
    })
  }
  
  // 3. episode_locationsテーブルの確認
  const { data: episodeLocations } = await supabase
    .from('episode_locations')
    .select('*')
  
  console.log(`\n🔗 【episode_locationsテーブル】`)
  console.log(`件数: ${episodeLocations?.length || 0}件`)
  
  // 4. 両方の関係パターンの比較
  const directLinkedIds = new Set(locationsWithEpisodeId?.map(l => l.id) || [])
  const junctionLinkedIds = new Set(episodeLocations?.map(el => el.location_id) || [])
  
  console.log('\n📊 【関係パターン比較】')
  console.log(`直接リンク（episode_id）: ${directLinkedIds.size}件`)
  console.log(`中間テーブル（episode_locations）: ${junctionLinkedIds.size}件`)
  
  // 重複チェック
  const overlap = Array.from(directLinkedIds).filter(id => junctionLinkedIds.has(id))
  const onlyDirect = Array.from(directLinkedIds).filter(id => !junctionLinkedIds.has(id))
  const onlyJunction = Array.from(junctionLinkedIds).filter(id => !directLinkedIds.has(id))
  
  console.log(`重複: ${overlap.length}件`)
  console.log(`直接のみ: ${onlyDirect.length}件`)
  console.log(`中間テーブルのみ: ${onlyJunction.length}件`)
  
  // 5. UIで表示されるパターンの特定
  console.log('\n🎯 【UI表示パターンの特定】')
  
  // example locationのデータ確認
  const exampleLocationId = 'bdb0a2d5-36fc-4c87-a872-ba986ed227ba' // えんとつ屋
  
  const { data: exampleLocation } = await supabase
    .from('locations')
    .select('*')
    .eq('id', exampleLocationId)
    .single()
  
  const { data: exampleEpisodeLink } = await supabase
    .from('episode_locations')
    .select('*, episodes(*)')
    .eq('location_id', exampleLocationId)
  
  console.log(`\n🏪 【えんとつ屋の例】`)
  if (exampleLocation) {
    console.log(`名前: ${exampleLocation.name}`)
    console.log(`直接episode_id: ${exampleLocation.episode_id || 'なし'}`)
    console.log(`Tabelog: ${exampleLocation.tabelog_url ? '✅' : '❌'}`)
  }
  
  if (exampleEpisodeLink && exampleEpisodeLink.length > 0) {
    console.log(`中間テーブル経由エピソード: ${exampleEpisodeLink.length}件`)
    exampleEpisodeLink.forEach((link, idx) => {
      console.log(`  ${idx + 1}. ${link.episodes?.title || '不明'}`)
      console.log(`     episode_id: ${link.episode_id}`)
    })
  }
  
  // 6. 結論と推測
  console.log('\n🧠 【分析結果】')
  console.log('=' .repeat(60))
  
  if (directLinkedIds.size > 0) {
    console.log('✅ locationsテーブルに直接episode_idフィールドあり')
    console.log('✅ これがUIでエピソード紐付きに見える理由')
  }
  
  if (junctionLinkedIds.size > 0) {
    console.log('✅ episode_locationsテーブルも存在')
    console.log('✅ 複数エピソード対応の中間テーブル')
  }
  
  console.log('\n🔧 【推奨対応】')
  if (directLinkedIds.size > 0 && junctionLinkedIds.size > 0) {
    console.log('両方のパターンが混在している状態')
    console.log('1. 直接リンクを中間テーブルに移行')
    console.log('2. または中間テーブルを廃止して直接リンクに統一')
    console.log('3. UIロジックの一本化')
  }
  
  return {
    direct_links: directLinkedIds.size,
    junction_links: junctionLinkedIds.size,
    overlap: overlap.length,
    schema_inconsistency: directLinkedIds.size > 0 && junctionLinkedIds.size > 0
  }
}

examineDBSchema()