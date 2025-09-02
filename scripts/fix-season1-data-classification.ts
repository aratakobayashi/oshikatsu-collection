#!/usr/bin/env node

/**
 * Season1 データ分類正常化
 * 誤分類されたSeason10/11エピソードを除外し、正しいSeason1データのみを保持
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSeason1DataClassification() {
  console.log('🔧 Season1 データ分類正常化開始...\n')
  console.log('誤分類されたSeason10/11エピソード → 正しいデータ分類へ修正')
  console.log('=' .repeat(60))
  
  try {
    // 松重豊のSeason1として分類されている全エピソードを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select(`
        id,
        slug,
        name,
        episodes(
          id,
          title,
          description,
          episode_locations(
            id,
            location_id,
            locations(
              id,
              name,
              address
            )
          )
        )
      `)
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊のデータが見つかりません')
      return
    }
    
    // Season1として分類されているエピソードを分析
    const season1Episodes = celebrity.episodes.filter((ep: any) => ep.title.includes('Season1'))
    
    console.log(`✅ 現在のSeason1分類エピソード: ${season1Episodes.length}話`)
    
    // 正しいSeason1エピソード（Season1と明記されているもののみ）
    const correctSeason1Episodes = season1Episodes.filter((ep: any) => {
      return ep.title.includes('Season1') && 
             !ep.title.includes('Season10') && 
             !ep.title.includes('Season11')
    })
    
    // 誤分類エピソード（Season10/11）
    const misclassifiedEpisodes = season1Episodes.filter((ep: any) => {
      return ep.title.includes('Season10') || ep.title.includes('Season11')
    })
    
    console.log(`\n📊 分類分析結果:`)
    console.log(`   正しいSeason1エピソード: ${correctSeason1Episodes.length}話`)
    console.log(`   誤分類エピソード: ${misclassifiedEpisodes.length}話`)
    
    if (misclassifiedEpisodes.length === 0) {
      console.log('\n✅ 誤分類エピソードは見つかりませんでした')
      console.log('Season1データは既に正常です')
      return
    }
    
    console.log(`\n🔍 誤分類エピソード詳細:`)
    console.log('-' .repeat(40))
    
    misclassifiedEpisodes.forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`)
      console.log(`   ID: ${episode.id}`)
      console.log(`   説明: ${episode.description || '説明なし'}`)
      console.log(`   ロケーション数: ${episode.episode_locations?.length || 0}`)
    })
    
    console.log(`\n⚠️ 修正方針:`)
    console.log('これらのSeason10/11エピソードは正しいSeasonカテゴリに移動するか、')
    console.log('本プロジェクトの対象外であれば削除が必要です。')
    
    console.log(`\n📋 推奨アクション:`)
    console.log('1. Season10/11エピソードの扱い方針決定')
    console.log('   a) 削除（対象外の場合）')
    console.log('   b) 別カテゴリに移動（含める場合）')
    console.log('2. 正しいSeason1データのみ保持')
    console.log('3. データ整合性の確保')
    
    console.log(`\n✅ 正しいSeason1エピソード一覧:`)
    console.log('-' .repeat(40))
    
    correctSeason1Episodes.forEach((episode, index) => {
      console.log(`\n${index + 1}. ${episode.title}`)
      console.log(`   ID: ${episode.id}`)
      console.log(`   ロケーション数: ${episode.episode_locations?.length || 0}`)
      
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        episode.episode_locations.forEach((epLoc: any, locIndex: number) => {
          const location = epLoc.locations
          if (location) {
            console.log(`   ${locIndex + 1}. ${location.name} (${location.address})`)
          }
        })
      }
    })
    
    // 正しいSeason1の統計
    const totalCorrectLocations = correctSeason1Episodes.reduce((total: number, ep: any) => 
      total + (ep.episode_locations?.length || 0), 0)
    
    console.log(`\n📊 正しいSeason1統計:`)
    console.log(`   エピソード数: ${correctSeason1Episodes.length}話`)
    console.log(`   ロケーション数: ${totalCorrectLocations}箇所`)
    console.log(`   1エピソードあたり: ${totalCorrectLocations > 0 ? Math.round(totalCorrectLocations / correctSeason1Episodes.length * 100) / 100 : 0}箇所`)
    
    console.log(`\n🎯 Season1正常化の効果:`)
    console.log('   ✅ データ分類の正確性向上')
    console.log('   ✅ 検索・表示の正常化')
    console.log('   ✅ ユーザー体験の改善')
    console.log('   ✅ データ管理の簡素化')
    
    console.log(`\n💼 次のステップ:`)
    console.log('1. Season10/11エピソードの処理方針決定')
    console.log('2. 誤分類データの削除または移動実行')
    console.log('3. Season1データの最終検証')
    console.log('4. 他Season（Season4等）の修正へ進行')
    
    // 詳細な修正手順を提示
    console.log(`\n🔧 具体的修正手順（次回実行用）:`)
    console.log('以下のIDのエピソードの処理が必要：')
    misclassifiedEpisodes.forEach(episode => {
      console.log(`   Episode ID: ${episode.id} - ${episode.title}`)
    })
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
fixSeason1DataClassification().catch(console.error)