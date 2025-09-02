#!/usr/bin/env node

/**
 * Season6以降の全ロケーションデータ削除スクリプト
 * 
 * 背景：
 * - Season6以降のデータは以前の低精度なスクリプトで追加された
 * - 多くのエピソードで間違った店舗が紐付いている
 * - 一度全削除してクリーンな状態から再構築する必要がある
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function deleteAllSeason6AndLaterLocations() {
  console.log('🗑️ Season6以降の全ロケーションデータ削除開始...\n')
  console.log('=' .repeat(70))
  
  try {
    // Season6以降の全エピソードを取得
    const { data: episodes, error: fetchError } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          id,
          location_id,
          locations(
            id,
            name,
            address,
            slug
          )
        )
      `)
      .or('title.ilike.%Season6%,title.ilike.%Season7%,title.ilike.%Season8%,title.ilike.%Season9%,title.ilike.%Season10%,title.ilike.%Season11%,title.ilike.%Season12%')
      .order('title')
    
    if (fetchError) {
      console.error('❌ エピソード取得エラー:', fetchError)
      return
    }
    
    if (!episodes || episodes.length === 0) {
      console.log('ℹ️ Season6以降のエピソードが見つかりません')
      return
    }
    
    console.log(`📊 Season6以降のエピソード数: ${episodes.length}エピソード\n`)
    
    // Season別に集計
    const seasonCounts: Record<string, number> = {}
    const locationsToDelete: Set<string> = new Set()
    const episodeLocationRelations: string[] = []
    
    episodes.forEach(ep => {
      const match = ep.title.match(/Season(\d+)/)
      if (match) {
        const season = `Season${match[1]}`
        seasonCounts[season] = (seasonCounts[season] || 0) + 1
      }
      
      // ロケーションが紐付いているエピソードを記録
      if (ep.episode_locations && ep.episode_locations.length > 0) {
        ep.episode_locations.forEach(el => {
          episodeLocationRelations.push(el.id)
          if (el.locations) {
            locationsToDelete.add(el.location_id)
            console.log(`  🔗 ${ep.title.substring(0, 40)}...`)
            console.log(`     → ${el.locations.name} (${el.locations.address?.substring(0, 30)}...)`)
          }
        })
      }
    })
    
    console.log('\n📈 Season別エピソード数:')
    Object.entries(seasonCounts).sort().forEach(([season, count]) => {
      console.log(`   ${season}: ${count}エピソード`)
    })
    
    console.log(`\n🗑️ 削除対象:`)
    console.log(`   - episode_locationsリレーション: ${episodeLocationRelations.length}件`)
    console.log(`   - locationsレコード: ${locationsToDelete.size}件`)
    
    if (episodeLocationRelations.length === 0 && locationsToDelete.size === 0) {
      console.log('\n✅ 削除対象のロケーションデータはありません')
      return
    }
    
    // 削除処理実行
    console.log('\n🔥 削除処理開始...')
    
    // 1. episode_locationsリレーションを削除
    if (episodeLocationRelations.length > 0) {
      console.log('   1. episode_locationsリレーション削除中...')
      const { error: deleteRelationsError } = await supabase
        .from('episode_locations')
        .delete()
        .in('id', episodeLocationRelations)
      
      if (deleteRelationsError) {
        console.error('❌ リレーション削除エラー:', deleteRelationsError)
        return
      }
      console.log(`   ✅ ${episodeLocationRelations.length}件のリレーション削除完了`)
    }
    
    // 2. 孤立したlocationsレコードを削除（他のエピソードで使われていない場合）
    if (locationsToDelete.size > 0) {
      console.log('   2. 孤立したlocationsレコード削除中...')
      
      // 各locationが他のエピソードで使われているか確認
      const locationsToActuallyDelete: string[] = []
      
      for (const locationId of locationsToDelete) {
        const { data: otherRelations } = await supabase
          .from('episode_locations')
          .select('id')
          .eq('location_id', locationId)
          .limit(1)
        
        if (!otherRelations || otherRelations.length === 0) {
          locationsToActuallyDelete.push(locationId)
        }
      }
      
      if (locationsToActuallyDelete.length > 0) {
        const { error: deleteLocationsError } = await supabase
          .from('locations')
          .delete()
          .in('id', locationsToActuallyDelete)
        
        if (deleteLocationsError) {
          console.error('❌ ロケーション削除エラー:', deleteLocationsError)
          return
        }
        console.log(`   ✅ ${locationsToActuallyDelete.length}件のロケーション削除完了`)
      } else {
        console.log('   ℹ️ 削除対象のロケーションは他のエピソードで使用されています')
      }
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('\n🎊 Season6以降のロケーションデータ削除完了！\n')
    
    console.log('📋 削除結果サマリー:')
    console.log(`   ✅ ${episodeLocationRelations.length}件のエピソード・ロケーション関連を削除`)
    console.log(`   ✅ ${locationsToDelete.size}件のロケーションデータを削除対象として処理`)
    console.log(`   ✅ Season6-9のエピソードは保持（ロケーションデータのみ削除）`)
    
    console.log('\n🔄 今後の作業:')
    console.log('   1. Season5の残りエピソードを正確に修正')
    console.log('   2. Season5完了後、Season6を高精度で追加')
    console.log('   3. 各Seasonを順次、検証済みの正確なデータで構築')
    
    console.log('\n💡 削除理由:')
    console.log('   - 以前の低精度スクリプトによる間違ったデータ')
    console.log('   - エリア不一致（大阪→東京など）の重大エラー')
    console.log('   - タベログURL未検証のデータ')
    console.log('   - クリーンな状態から再構築が必要')
    
    console.log('\n✨ これでSeason6以降はクリーンな状態になりました！')
    console.log('Season1-5の高品質データベースから再スタートできます。')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行前確認
console.log('⚠️  警告: このスクリプトはSeason6以降の全ロケーションデータを削除します。')
console.log('続行しますか？ (5秒後に自動実行)\n')

setTimeout(() => {
  deleteAllSeason6AndLaterLocations().catch(console.error)
}, 5000)