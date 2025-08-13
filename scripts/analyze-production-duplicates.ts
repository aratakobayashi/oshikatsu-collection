/**
 * 本番環境エピソード重複分析
 * - タイトルベースで重複エピソードを特定
 * - タグ（ロケーション・アイテム）付きエピソードと未タグエピソードを識別
 * - 削除候補を提案
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Episode {
  id: string
  title: string
  video_url: string
  date: string
  location_count?: number
  item_count?: number
}

interface DuplicateGroup {
  title: string
  episodes: Episode[]
  hasTaggedEpisode: boolean
  hasUntaggedEpisode: boolean
}

async function analyzeEpisodeDuplicates() {
  console.log('🔍 本番環境エピソード重複分析開始...\n')
  
  // 全エピソードを取得（関連データ数も含む）
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select(`
      id,
      title,
      video_url,
      date,
      episode_locations!left(id),
      episode_items!left(id)
    `)
    .order('title')
  
  if (error || !episodes) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }
  
  console.log(`📊 総エピソード数: ${episodes.length}件`)
  
  // タイトルごとにグループ化
  const titleGroups = new Map<string, Episode[]>()
  
  for (const episode of episodes) {
    const normalizedTitle = episode.title.trim()
    const episodeData: Episode = {
      id: episode.id,
      title: episode.title,
      video_url: episode.video_url,
      date: episode.date,
      location_count: episode.episode_locations?.length || 0,
      item_count: episode.episode_items?.length || 0
    }
    
    if (!titleGroups.has(normalizedTitle)) {
      titleGroups.set(normalizedTitle, [])
    }
    titleGroups.get(normalizedTitle)!.push(episodeData)
  }
  
  // 重複グループを特定
  const duplicateGroups: DuplicateGroup[] = []
  
  for (const [title, episodeList] of titleGroups.entries()) {
    if (episodeList.length > 1) {
      const hasTaggedEpisode = episodeList.some(ep => 
        (ep.location_count && ep.location_count > 0) || 
        (ep.item_count && ep.item_count > 0)
      )
      const hasUntaggedEpisode = episodeList.some(ep => 
        (!ep.location_count || ep.location_count === 0) && 
        (!ep.item_count || ep.item_count === 0)
      )
      
      duplicateGroups.push({
        title,
        episodes: episodeList,
        hasTaggedEpisode,
        hasUntaggedEpisode
      })
    }
  }
  
  console.log(`\n🔍 重複グループ分析結果:`)
  console.log('='.repeat(60))
  console.log(`📋 重複タイトル数: ${duplicateGroups.length}件`)
  
  if (duplicateGroups.length === 0) {
    console.log('✅ エピソード重複は見つかりませんでした')
    return { duplicateGroups: [], totalDuplicateEpisodes: 0, deletionCandidates: [] }
  }
  
  let totalDuplicateEpisodes = 0
  let deletionCandidates: string[] = []
  
  console.log('\n📺 重複エピソード詳細:')
  console.log('='.repeat(60))
  
  for (const [index, group] of duplicateGroups.entries()) {
    console.log(`\n${index + 1}. "${group.title}"`)
    console.log(`   重複数: ${group.episodes.length}件`)
    
    totalDuplicateEpisodes += group.episodes.length - 1 // 1件は残すため
    
    // エピソードの詳細表示とソート
    const sortedEpisodes = group.episodes.sort((a, b) => {
      const aTagCount = (a.location_count || 0) + (a.item_count || 0)
      const bTagCount = (b.location_count || 0) + (b.item_count || 0)
      
      // タグ数が多い順、同じ場合は日付が新しい順
      if (aTagCount !== bTagCount) {
        return bTagCount - aTagCount
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })
    
    for (const [epIndex, episode] of sortedEpisodes.entries()) {
      const tagCount = (episode.location_count || 0) + (episode.item_count || 0)
      const status = epIndex === 0 ? '✅ 保持' : '❌ 削除候補'
      const tagInfo = tagCount > 0 ? `(📍${episode.location_count} 🏷️${episode.item_count})` : '(タグなし)'
      
      console.log(`   ${status} ${episode.id} ${tagInfo}`)
      console.log(`      日付: ${episode.date}`)
      console.log(`      URL: ${episode.video_url}`)
      
      if (epIndex > 0) {
        deletionCandidates.push(episode.id)
      }
    }
  }
  
  console.log('\n📊 重複削除サマリー:')
  console.log('='.repeat(40))
  console.log(`🗑️ 削除候補エピソード: ${deletionCandidates.length}件`)
  console.log(`✅ 保持されるエピソード: ${episodes.length - deletionCandidates.length}件`)
  
  return {
    duplicateGroups,
    totalDuplicateEpisodes,
    deletionCandidates
  }
}

async function showDeletionPreview(deletionCandidates: string[]) {
  if (deletionCandidates.length === 0) return
  
  console.log('\n🔍 削除候補エピソードの詳細確認:')
  console.log('='.repeat(60))
  
  for (const [index, episodeId] of deletionCandidates.entries()) {
    console.log(`\n${index + 1}. エピソードID: ${episodeId}`)
    
    // エピソード詳細取得
    const { data: episode } = await supabase
      .from('episodes')
      .select('title, date, video_url')
      .eq('id', episodeId)
      .single()
    
    if (episode) {
      console.log(`   タイトル: ${episode.title}`)
      console.log(`   日付: ${episode.date}`)
      console.log(`   URL: ${episode.video_url}`)
    }
    
    // 関連データ確認
    const { count: locationCount } = await supabase
      .from('episode_locations')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episodeId)
    
    const { count: itemCount } = await supabase
      .from('episode_items')
      .select('*', { count: 'exact', head: true })
      .eq('episode_id', episodeId)
    
    console.log(`   関連ロケーション: ${locationCount || 0}件`)
    console.log(`   関連アイテム: ${itemCount || 0}件`)
    
    if ((locationCount || 0) > 0 || (itemCount || 0) > 0) {
      console.log(`   ⚠️ この削除候補にはタグが付いています！`)
    }
  }
}

// メイン実行
async function main() {
  try {
    const result = await analyzeEpisodeDuplicates()
    
    if (result && result.deletionCandidates.length > 0) {
      await showDeletionPreview(result.deletionCandidates)
      
      console.log('\n' + '='.repeat(60))
      console.log('🎯 次のステップ:')
      console.log('='.repeat(60))
      console.log('1. 上記の削除候補リストを確認')
      console.log('2. タグ付きエピソードが誤って削除対象になっていないか検証')
      console.log('3. 確認後、削除スクリプトを実行')
      console.log(`4. 削除予定: ${result.deletionCandidates.length}件のエピソード`)
    }
    
  } catch (error) {
    console.error('❌ 重複分析でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}