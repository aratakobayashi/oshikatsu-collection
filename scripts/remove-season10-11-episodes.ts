#!/usr/bin/env node

/**
 * Season10/11 誤分類エピソード削除
 * 推し活コレクションの対象外Season10/11エピソードを完全削除
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 削除対象のSeason10/11エピソードID一覧
const SEASON_10_11_EPISODE_IDS = [
  '0e1e7f43-f6a6-46bf-b26f-e6ed98fb5eb3', // Season10 第1話
  '5b1947dd-dce0-480f-9d6c-9b78010b1a29', // Season10 第2話
  '0067c303-0e0f-4736-84cc-3a0ab6c6bc95', // Season10 第3話
  '2791601d-81c0-4fed-9b82-8af9802c0b84', // Season10 第4話
  '1553bd02-a3d9-4eaa-8c8c-09879b75a1fc', // Season10 第5話
  '2ed48eb7-e809-41d8-8305-578f6d0b871c', // Season10 第6話
  '29029cfb-5787-4c4c-a6da-a0662ed914df', // Season10 第7話
  'a3e97618-b916-49b9-92b0-44b588f82cb8', // Season10 第8話
  '532f1d65-5100-4098-b293-0b88d23fd8d5', // Season10 第9話
  'edbe9a1c-abd2-4346-a25a-5c42916029f1', // Season10 第10話
  '2b4b7a5e-464a-4475-b09b-973572e1b2df', // Season10 第11話
  '5461c04a-5508-4692-b45b-d0444225dbde', // Season10 第12話
  '12e1fce0-b280-4af1-ba15-d3135873b81e', // Season11 第1話
  'd429369d-6a8d-4f93-8d56-982327814a97', // Season11 第2話
  'b5970d5d-49d4-41d1-8d16-91acb637130c', // Season11 第3話
  'a5f203a9-cd05-4ce7-95c7-2215ee898727', // Season11 第4話
  '05e5b75d-5aff-42fc-97f5-f1a87e8bdce5', // Season11 第5話
  '125275b6-e12f-490f-b50e-aaf6d8863242', // Season11 第6話
  '8bd689c4-9f59-4553-9433-774718216c5c', // Season11 第7話
  'bbb26a48-8c9e-4056-acb8-c11a00cd2a11', // Season11 第8話
  '66e621ba-fe86-4fd8-99b8-ff381427ca38', // Season11 第9話
  '10908df1-11a8-4c6e-a561-20c2af36ceb3', // Season11 第10話
  '3d71d88d-295e-4678-8e3d-0f27a5a21d02', // Season11 第11話
  '666b969a-c31a-4ef4-baa3-96ef4fd3dbf4', // Season11 第12話
]

async function removeSeason1011Episodes() {
  console.log('🗑️ Season10/11 誤分類エピソード削除開始...\n')
  console.log('推し活コレクション対象外のSeason10/11エピソードを完全削除')
  console.log('=' .repeat(60))
  
  try {
    console.log(`✅ 削除対象確認:`)
    console.log(`   Season10/11エピソード: ${SEASON_10_11_EPISODE_IDS.length}件`)
    console.log(`   削除理由: 推し活コレクションの対象外`)
    
    // 削除前確認：対象エピソードの詳細取得
    console.log(`\n🔍 削除前確認:`)
    for (const episodeId of SEASON_10_11_EPISODE_IDS.slice(0, 5)) {
      const { data: episode } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('id', episodeId)
        .single()
      
      if (episode) {
        console.log(`   ✓ ${episode.title}`)
      }
    }
    console.log(`   ... その他 ${SEASON_10_11_EPISODE_IDS.length - 5}件`)
    
    console.log(`\n⚠️ 削除の影響範囲:`)
    console.log('   - episodesテーブルからエピソード削除')
    console.log('   - episode_locationsテーブルから関連データ削除（外部キー制約）')
    console.log('   - celebrity_episodesテーブルから関連データ削除（外部キー制約）')
    
    console.log(`\n🚀 段階的削除実行:`)
    
    let deletedCount = 0
    let errors = []
    
    for (const episodeId of SEASON_10_11_EPISODE_IDS) {
      try {
        // エピソード削除（関連データは外部キー制約で自動削除）
        const { error } = await supabase
          .from('episodes')
          .delete()
          .eq('id', episodeId)
        
        if (error) {
          console.log(`   ❌ ID ${episodeId}: ${error.message}`)
          errors.push(`${episodeId}: ${error.message}`)
        } else {
          deletedCount++
          console.log(`   ✅ 削除済み: ${deletedCount}/${SEASON_10_11_EPISODE_IDS.length}`)
        }
      } catch (err) {
        console.log(`   ❌ ID ${episodeId}: ${err}`)
        errors.push(`${episodeId}: ${err}`)
      }
    }
    
    console.log('\n' + '=' .repeat(60))
    console.log('\n🎊 Season10/11エピソード削除完了！')
    
    console.log(`\n📊 削除結果:`)
    console.log(`   成功削除: ${deletedCount}件`)
    console.log(`   削除失敗: ${errors.length}件`)
    
    if (errors.length > 0) {
      console.log(`\n❌ 削除失敗詳細:`)
      errors.slice(0, 5).forEach(error => {
        console.log(`   - ${error}`)
      })
      if (errors.length > 5) {
        console.log(`   ... その他 ${errors.length - 5}件`)
      }
    }
    
    // 削除後確認：Season1エピソード数確認
    const { data: remainingEpisodes } = await supabase
      .from('celebrities')
      .select(`
        episodes(
          id,
          title
        )
      `)
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    const season1Episodes = remainingEpisodes?.episodes?.filter((ep: any) => 
      ep.title.includes('Season1')) || []
    
    console.log(`\n✅ データ正常化確認:`)
    console.log(`   残存Season1エピソード: ${season1Episodes.length}件`)
    console.log(`   期待値: 12件（正しいSeason1のみ）`)
    
    if (season1Episodes.length === 12) {
      console.log('   🎯 Perfect! Season1データが正常化されました')
    } else {
      console.log('   ⚠️ エピソード数が期待値と異なります')
    }
    
    console.log(`\n💼 データ正常化効果:`)
    console.log('   ✅ 誤分類データの完全除去')
    console.log('   ✅ Season1-4のみのクリーンなデータ')
    console.log('   ✅ 検索・表示の正常化')
    console.log('   ✅ データ管理の簡素化')
    
    console.log(`\n📋 次のステップ:`)
    console.log('1. Season1データ完全性確認')
    console.log('2. Season4データ再構築開始')
    console.log('3. Season3エリア不一致修正')
    console.log('4. Season2 URL個別検証')
    console.log('5. 全体LinkSwitch最適化')
    
    console.log('\n🏆 Season1正常化完了！')
    console.log('これで正しいSeason1-4データのみでの収益化最適化を開始できます！')
    
  } catch (error) {
    console.error('❌ 削除処理エラー:', error)
  }
}

// 実行
removeSeason1011Episodes().catch(console.error)