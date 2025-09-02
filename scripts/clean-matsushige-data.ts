#!/usr/bin/env node

/**
 * 松重豊の全ロケーションデータをクリアして0からスタート
 * 間違ったデータを削除し、正確なデータで再構築する準備
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function cleanMatsushigeData() {
  console.log('🧹 松重豊のロケーションデータクリーニング開始...\n')
  console.log('⚠️  注意: 全ての既存ロケーションデータを削除します')
  console.log('=' .repeat(60))
  
  try {
    // 松重豊のIDを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊のデータが見つかりません')
      return
    }

    console.log(`✅ 松重豊 ID: ${celebrity.id}`)
    
    // 現在のSeason1エピソードとロケーションの状況を確認
    const { data: currentEpisodes } = await supabase
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
            address
          )
        )
      `)
      .eq('celebrity_id', celebrity.id)
      .like('title', '%Season1%')
      .order('title')
    
    if (!currentEpisodes) {
      console.log('Season1のエピソードが見つかりませんでした')
      return
    }
    
    console.log(`\n📊 削除対象の現在のデータ:`)
    
    let locationIdsToDelete: string[] = []
    let episodeLocationIdsToDelete: string[] = []
    
    for (const episode of currentEpisodes) {
      const episodeNumber = episode.title.match(/第(\d+)話/)?.[1] || '不明'
      console.log(`\n第${episodeNumber}話: ${episode.title}`)
      
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        for (const epLoc of episode.episode_locations) {
          console.log(`   → 削除予定: ${epLoc.locations?.name} (Location ID: ${epLoc.location_id})`)
          locationIdsToDelete.push(epLoc.location_id)
          episodeLocationIdsToDelete.push(epLoc.id)
        }
      } else {
        console.log(`   → ロケーション未設定`)
      }
    }
    
    console.log(`\n🗑️  削除対象:`)
    console.log(`   - エピソード-ロケーション関連: ${episodeLocationIdsToDelete.length}件`)
    console.log(`   - ロケーション: ${locationIdsToDelete.length}件`)
    
    // 確認プロンプト（実際の環境では手動確認が必要）
    console.log(`\n⚠️  警告: これらのデータを完全に削除します。`)
    console.log(`続行するには、このスクリプトを実行してください。`)
    
    // Step 1: episode_locationsテーブルから関連を削除
    console.log(`\n🔄 Step 1: エピソード-ロケーション関連を削除中...`)
    
    if (episodeLocationIdsToDelete.length > 0) {
      const { error: epLocError } = await supabase
        .from('episode_locations')
        .delete()
        .in('id', episodeLocationIdsToDelete)
      
      if (epLocError) {
        console.error(`❌ エピソード-ロケーション削除エラー: ${epLocError.message}`)
        return
      } else {
        console.log(`✅ エピソード-ロケーション関連 ${episodeLocationIdsToDelete.length}件を削除完了`)
      }
    }
    
    // Step 2: locationsテーブルからロケーションデータを削除
    console.log(`\n🔄 Step 2: ロケーションデータを削除中...`)
    
    if (locationIdsToDelete.length > 0) {
      const { error: locationError } = await supabase
        .from('locations')
        .delete()
        .in('id', locationIdsToDelete)
      
      if (locationError) {
        console.error(`❌ ロケーション削除エラー: ${locationError.message}`)
        return
      } else {
        console.log(`✅ ロケーション ${locationIdsToDelete.length}件を削除完了`)
      }
    }
    
    // Step 3: エピソードのdescriptionもクリア（必要に応じて）
    console.log(`\n🔄 Step 3: エピソードのdescriptionをクリア中...`)
    
    const { error: episodeUpdateError } = await supabase
      .from('episodes')
      .update({ description: null })
      .eq('celebrity_id', celebrity.id)
      .like('title', '%Season1%')
    
    if (episodeUpdateError) {
      console.error(`❌ エピソード更新エラー: ${episodeUpdateError.message}`)
    } else {
      console.log(`✅ Season1エピソードのdescriptionをクリア完了`)
    }
    
    console.log(`\n🎉 クリーニング完了！`)
    console.log(`\n📝 次のステップ:`)
    console.log(`1. Season1 全12話の正確な店舗調査`)
    console.log(`   → 実際の番組確認または信頼できる情報源の利用`)
    console.log(`2. 正確なデータでの再構築`)
    console.log(`   → 店名、住所、食べログURL、LinkSwitch設定`)
    console.log(`3. データ品質検証システムの適用`)
    console.log(`   → 今後の間違いを防ぐ自動チェック`)
    
    console.log(`\n🏁 準備完了: クリーンな状態から正確なデータ構築を開始できます`)
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
cleanMatsushigeData().catch(console.error)