/**
 * 店舗・アイテムリンク状況デバッグ
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function debugLinks() {
  console.log('🔍 店舗・アイテムリンク状況確認')
  console.log('='.repeat(50))
  
  try {
    // よにのちゃんねる取得
    const { data: celebrity, error: celebError } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'よにのちゃんねる')
      .single()
    
    if (celebError || !celebrity) {
      console.log('❌ よにのちゃんねる見つからず:', celebError?.message)
      return
    }
    
    console.log(`✅ Celebrity: ${celebrity.name} (${celebrity.id})`)
    
    // エピソード確認
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrity.id)
      .limit(5)
      
    if (epError) {
      console.log('❌ エピソード取得エラー:', epError.message)
      return
    }
      
    console.log(`📺 エピソード数: ${episodes?.length || 0}件`)
    episodes?.forEach((ep, idx) => {
      console.log(`  ${idx + 1}. ${ep.title} (${ep.id})`)
    })
    
    if (!episodes || episodes.length === 0) {
      console.log('❌ エピソードが見つからないため、リンク確認をスキップ')
      return
    }
    
    const episodeIds = episodes.map(ep => ep.id)
    
    // episode_locations確認
    console.log('\n🏪 Episode-Location リンク確認:')
    const { data: locLinks, error: locLinkError } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .in('episode_id', episodeIds)
      
    if (locLinkError) {
      console.log('❌ Episode-Location取得エラー:', locLinkError.message)
    } else {
      console.log(`📊 Episode-Location リンク数: ${locLinks?.length || 0}件`)
      locLinks?.forEach((link, idx) => {
        console.log(`  ${idx + 1}. Episode: ${link.episode_id} → Location: ${link.location_id}`)
      })
    }
    
    // episode_items確認
    console.log('\n🛍️ Episode-Item リンク確認:')
    const { data: itemLinks, error: itemLinkError } = await supabase
      .from('episode_items')
      .select('episode_id, item_id')
      .in('episode_id', episodeIds)
      
    if (itemLinkError) {
      console.log('❌ Episode-Item取得エラー:', itemLinkError.message)
    } else {
      console.log(`📊 Episode-Item リンク数: ${itemLinks?.length || 0}件`)
      itemLinks?.forEach((link, idx) => {
        console.log(`  ${idx + 1}. Episode: ${link.episode_id} → Item: ${link.item_id}`)
      })
    }
    
    // 実際のlocations取得テスト（JOINクエリ）
    console.log('\n🔍 Locations JOIN テスト:')
    const { data: locations, error: locError } = await supabase
      .from('episode_locations')
      .select(`
        episode_id,
        locations (*)
      `)
      .in('episode_id', episodeIds)
      
    if (locError) {
      console.log('❌ Locations JOIN エラー:', locError.message)
    } else {
      console.log(`✅ Locations JOIN 成功: ${locations?.length || 0}件`)
      locations?.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.locations?.name || 'N/A'} (Episode: ${item.episode_id})`)
      })
    }
    
    // 実際のitems取得テスト（JOINクエリ）
    console.log('\n🔍 Items JOIN テスト:')
    const { data: items, error: itemError } = await supabase
      .from('episode_items')
      .select(`
        episode_id,
        items (*)
      `)
      .in('episode_id', episodeIds)
      
    if (itemError) {
      console.log('❌ Items JOIN エラー:', itemError.message)
    } else {
      console.log(`✅ Items JOIN 成功: ${items?.length || 0}件`)
      items?.forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.items?.name || 'N/A'} (Episode: ${item.episode_id})`)
      })
    }
    
    // getByCelebrityId メソッドテスト
    console.log('\n🧪 getByCelebrityId メソッドテスト:')
    
    // locations.getByCelebrityId
    try {
      const { data: locsByCeleb, error: locsByCelebError } = await supabase
        .from('episodes')
        .select('id')
        .eq('celebrity_id', celebrity.id)
        
      if (locsByCelebError) {
        console.log('❌ episodes for celebrity エラー:', locsByCelebError.message)
      } else {
        const epIds = locsByCeleb?.map(ep => ep.id) || []
        const { data: locsData, error: locsDataError } = await supabase
          .from('episode_locations')
          .select(`locations (*)`)
          .in('episode_id', epIds)
          
        if (locsDataError) {
          console.log('❌ locations by celebrity エラー:', locsDataError.message)
        } else {
          console.log(`✅ Locations by celebrity: ${locsData?.length || 0}件`)
        }
      }
    } catch (error: any) {
      console.log('❌ getByCelebrityId テストエラー:', error.message)
    }
    
  } catch (error: any) {
    console.error('❌ 全体エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  debugLinks().catch(console.error)
}