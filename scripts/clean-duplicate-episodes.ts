#!/usr/bin/env tsx
import { supabase } from '../src/lib/supabase'

async function cleanDuplicateEpisodes() {
  console.log('🧹 重複エピソードのクリーンアップを開始...')

  try {
    // 1. 全エピソードを取得
    const { data: episodes, error: fetchError } = await supabase
      .from('episodes')
      .select('id, title, video_url')
      .order('created_at', { ascending: true })

    if (fetchError) {
      throw fetchError
    }

    console.log(`📊 現在のエピソード数: ${episodes?.length || 0}件`)

    if (!episodes || episodes.length === 0) {
      console.log('✅ データが存在しないため、クリーンアップは不要です')
      return
    }

    // 2. 重複を特定 (video_urlまたはtitleで判定)
    const uniqueEpisodes = new Map<string, any>()
    const duplicateIds: string[] = []

    for (const episode of episodes) {
      const key = episode.video_url || episode.title
      
      if (uniqueEpisodes.has(key)) {
        // 重複発見
        duplicateIds.push(episode.id)
        console.log(`🔍 重複発見: "${episode.title}" (ID: ${episode.id})`)
      } else {
        // 初回出現
        uniqueEpisodes.set(key, episode)
      }
    }

    console.log(`📋 ユニークエピソード: ${uniqueEpisodes.size}件`)
    console.log(`❌ 重複エピソード: ${duplicateIds.length}件`)

    // 3. 重複データを削除
    if (duplicateIds.length > 0) {
      console.log('🗑️ 重複データを削除中...')
      
      const { error: deleteError } = await supabase
        .from('episodes')
        .delete()
        .in('id', duplicateIds)

      if (deleteError) {
        throw deleteError
      }

      console.log(`✅ ${duplicateIds.length}件の重複データを削除しました`)
    } else {
      console.log('✅ 重複データは見つかりませんでした')
    }

    // 4. 最終確認
    const { data: finalEpisodes, error: finalError } = await supabase
      .from('episodes')
      .select('id, title')
      .order('created_at', { ascending: true })

    if (finalError) {
      throw finalError
    }

    console.log(`🎯 クリーンアップ後のエピソード数: ${finalEpisodes?.length || 0}件`)
    
    if (finalEpisodes && finalEpisodes.length > 0) {
      console.log('\n📋 現在のエピソード:')
      finalEpisodes.slice(0, 5).forEach((ep, index) => {
        console.log(`   ${index + 1}. ${ep.title}`)
      })
      if (finalEpisodes.length > 5) {
        console.log(`   ... 他${finalEpisodes.length - 5}件`)
      }
    }

  } catch (error) {
    console.error('❌ クリーンアップ中にエラーが発生:', error)
  }
}

// 実行
cleanDuplicateEpisodes()
  .then(() => {
    console.log('\n🎉 クリーンアップ完了!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ エラー:', error)
    process.exit(1)
  })