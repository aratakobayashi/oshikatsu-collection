/**
 * 実際のlocations/itemsテーブルデータ確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function checkActualData() {
  console.log('🔍 実際のテーブルデータ確認')
  console.log('='.repeat(50))
  
  try {
    // 1. locationsテーブル全体確認
    console.log('\n🏪 LOCATIONS テーブル確認:')
    const { data: allLocations, error: locError } = await supabase
      .from('locations')
      .select('*')
      .limit(10)
      
    if (locError) {
      console.log('❌ Locations取得エラー:', locError.message)
    } else {
      console.log(`📊 Locations総数: ${allLocations?.length || 0}件`)
      allLocations?.forEach((loc, idx) => {
        console.log(`  ${idx + 1}. ${loc.name} (${loc.id})`)
        console.log(`     - Address: ${loc.address || 'N/A'}`)
        console.log(`     - Description: ${loc.description ? loc.description.substring(0, 50) + '...' : 'N/A'}`)
      })
    }
    
    // 2. itemsテーブル全体確認
    console.log('\n🛍️ ITEMS テーブル確認:')
    const { data: allItems, error: itemError } = await supabase
      .from('items')
      .select('*')
      .limit(10)
      
    if (itemError) {
      console.log('❌ Items取得エラー:', itemError.message)
    } else {
      console.log(`📊 Items総数: ${allItems?.length || 0}件`)
      allItems?.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.id})`)
        console.log(`     - Brand: ${item.brand || 'N/A'}`)
        console.log(`     - Category: ${item.category || 'N/A'}`)
        console.log(`     - Price: ${item.price || 'N/A'}`)
      })
    }
    
    // 3. episode_locationsからJOINして実データ確認
    console.log('\n🔗 EPISODE_LOCATIONS JOIN実データ確認:')
    const { data: locationJoins, error: locJoinError } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        location_id,
        locations!inner (
          id,
          name,
          address,
          description
        )
      `)
      .limit(10)
      
    if (locJoinError) {
      console.log('❌ Location JOIN エラー:', locJoinError.message)
    } else {
      console.log(`📊 Location JOIN結果: ${locationJoins?.length || 0}件`)
      locationJoins?.forEach((join, idx) => {
        console.log(`  ${idx + 1}. Episode: ${join.episode_id}`)
        console.log(`     → Location: ${join.locations?.name || 'NULL'} (${join.location_id})`)
        console.log(`     → Address: ${join.locations?.address || 'NULL'}`)
      })
    }
    
    // 4. episode_itemsからJOINして実データ確認
    console.log('\n🔗 EPISODE_ITEMS JOIN実データ確認:')
    const { data: itemJoins, error: itemJoinError } = await supabase
      .from('episode_items')
      .select(`
        episode_id,
        item_id,
        items!inner (
          id,
          name,
          brand,
          category,
          price
        )
      `)
      .limit(10)
      
    if (itemJoinError) {
      console.log('❌ Item JOIN エラー:', itemJoinError.message)
    } else {
      console.log(`📊 Item JOIN結果: ${itemJoins?.length || 0}件`)
      itemJoins?.forEach((join, idx) => {
        console.log(`  ${idx + 1}. Episode: ${join.episode_id}`)
        console.log(`     → Item: ${join.items?.name || 'NULL'} (${join.item_id})`)
        console.log(`     → Brand: ${join.items?.brand || 'NULL'}`)
      })
    }
    
    // 5. よにのちゃんねる特定確認
    console.log('\n🎯 よにのちゃんねる特定データ確認:')
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'よにのちゃんねる')
      .single()
      
    if (celebrity) {
      // Episode IDs取得
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)
        
      if (episodes && episodes.length > 0) {
        const episodeIds = episodes.map(ep => ep.id)
        
        // Specific location data for よにのちゃんねる
        const { data: specificLocs } = await supabase
          .from('episode_locations')
          .select(`
            episodes!inner (title),
            locations!inner (name, address)
          `)
          .in('episode_id', episodeIds)
          
        console.log(`🎯 よにのちゃんねる Locations: ${specificLocs?.length || 0}件`)
        specificLocs?.forEach((loc, idx) => {
          console.log(`  ${idx + 1}. "${loc.episodes?.title}" → "${loc.locations?.name}"`)
        })
        
        // Specific item data for よにのちゃんねる
        const { data: specificItems } = await supabase
          .from('episode_items')
          .select(`
            episodes!inner (title),
            items!inner (name, brand)
          `)
          .in('episode_id', episodeIds)
          
        console.log(`🎯 よにのちゃんねる Items: ${specificItems?.length || 0}件`)
        specificItems?.forEach((item, idx) => {
          console.log(`  ${idx + 1}. "${item.episodes?.title}" → "${item.items?.name}"`)
        })
      }
    }
    
  } catch (error: any) {
    console.error('❌ 全体エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkActualData().catch(console.error)
}