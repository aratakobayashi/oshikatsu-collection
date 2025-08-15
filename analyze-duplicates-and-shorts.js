import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function analyzeCurrentIssues() {
  console.log('🔍 現在の重複・ショート動画分析開始...\n')
  
  // よにのちゃんねるのID取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // 全エピソード取得
  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('id, title, description, date, video_url, duration_minutes')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
  
  console.log(`📺 総エピソード数: ${allEpisodes?.length || 0}`)
  
  // 1. ショート動画の検出
  console.log('\n🎬 ショート動画の検出:')
  console.log('=====================================')
  
  const shortVideos = allEpisodes?.filter(ep => {
    const title = ep.title.toLowerCase()
    const description = (ep.description || '').toLowerCase()
    
    return title.includes('#shorts') ||
           title.includes('shorts') ||
           title.includes('ショート') ||
           title.includes('short') ||
           description.includes('#shorts') ||
           description.includes('shorts') ||
           (ep.duration_minutes && ep.duration_minutes <= 1) ||
           title.length < 10
  }) || []
  
  console.log(`📱 ショート動画候補: ${shortVideos.length}件`)
  
  if (shortVideos.length > 0) {
    console.log('検出されたショート動画:')
    shortVideos.forEach((ep, i) => {
      console.log(`${i+1}. ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   日付: ${ep.date.split('T')[0]}`)
      console.log(`   時間: ${ep.duration_minutes || 'N/A'}分`)
      console.log('')
    })
  } else {
    console.log('✅ ショート動画は検出されませんでした')
  }
  
  // 2. 重複動画の検出
  console.log('\n🔄 重複動画の検出:')
  console.log('=====================================')
  
  const titleGroups = {}
  const duplicateGroups = []
  
  allEpisodes?.forEach(ep => {
    // タイトルの正規化（記号や数字を除去して比較）
    let normalizedTitle = ep.title
      .replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '') // プレフィックス除去
      .replace(/【.*?】/, '') // 【】内の削除
      .replace(/[#\d\s\[\]]/g, '') // 記号・数字・空白削除
      .toLowerCase()
      .trim()
    
    if (normalizedTitle.length < 5) return // 短すぎるタイトルはスキップ
    
    if (!titleGroups[normalizedTitle]) {
      titleGroups[normalizedTitle] = []
    }
    titleGroups[normalizedTitle].push(ep)
  })
  
  // 重複グループの特定
  Object.entries(titleGroups).forEach(([normalizedTitle, episodes]) => {
    if (episodes.length > 1) {
      duplicateGroups.push({
        normalizedTitle,
        episodes: episodes.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      })
    }
  })
  
  console.log(`🔄 重複グループ数: ${duplicateGroups.length}`)
  console.log(`📹 重複エピソード総数: ${duplicateGroups.reduce((sum, group) => sum + group.episodes.length, 0)}`)
  
  if (duplicateGroups.length > 0) {
    console.log('\n重複グループ詳細:')
    duplicateGroups.forEach((group, i) => {
      console.log(`\nグループ ${i+1}: "${group.normalizedTitle}"`)
      console.log('─'.repeat(50))
      
      group.episodes.forEach((ep, j) => {
        const isOldest = j === 0
        const marker = isOldest ? '👑 [保持推奨]' : '❌ [削除候補]'
        
        console.log(`${marker} ${ep.title}`)
        console.log(`   ID: ${ep.id}`)
        console.log(`   日付: ${ep.date.split('T')[0]}`)
        console.log(`   URL: ${ep.video_url || 'N/A'}`)
        console.log('')
      })
    })
  } else {
    console.log('✅ 重複動画は検出されませんでした')
  }
  
  // 3. 関連データのチェック
  console.log('\n🔗 関連データの確認:')
  console.log('=====================================')
  
  const allProblemEpisodeIds = [
    ...shortVideos.map(ep => ep.id),
    ...duplicateGroups.flatMap(group => group.episodes.slice(1).map(ep => ep.id)) // 最初以外を削除候補
  ]
  
  if (allProblemEpisodeIds.length > 0) {
    // ロケーション関連付けをチェック
    const { data: episodeLocations } = await supabase
      .from('episode_locations')
      .select('episode_id, location_id')
      .in('episode_id', allProblemEpisodeIds)
    
    // アイテム関連付けをチェック
    const { data: episodeItems } = await supabase
      .from('episode_items')
      .select('episode_id, item_id')
      .in('episode_id', allProblemEpisodeIds)
    
    console.log(`📍 削除候補のロケーション関連付け: ${episodeLocations?.length || 0}件`)
    console.log(`🛍️ 削除候補のアイテム関連付け: ${episodeItems?.length || 0}件`)
    
    if (episodeLocations?.length || episodeItems?.length) {
      console.log('\n⚠️ 関連データがある削除候補:')
      
      const episodesWithData = [...new Set([
        ...(episodeLocations?.map(el => el.episode_id) || []),
        ...(episodeItems?.map(ei => ei.episode_id) || [])
      ])]
      
      episodesWithData.forEach(episodeId => {
        const episode = allEpisodes?.find(ep => ep.id === episodeId)
        const locationCount = episodeLocations?.filter(el => el.episode_id === episodeId).length || 0
        const itemCount = episodeItems?.filter(ei => ei.episode_id === episodeId).length || 0
        
        console.log(`• ${episode?.title}`)
        console.log(`  ID: ${episodeId}`)
        console.log(`  ロケーション: ${locationCount}件, アイテム: ${itemCount}件`)
      })
    }
  }
  
  // 4. クリーンアップ推奨事項
  console.log('\n💡 クリーンアップ推奨事項:')
  console.log('=====================================')
  
  if (shortVideos.length === 0 && duplicateGroups.length === 0) {
    console.log('✅ データベースは既にクリーンです！')
  } else {
    console.log('🧹 実行推奨アクション:')
    
    if (shortVideos.length > 0) {
      console.log(`1. ショート動画の削除: ${shortVideos.length}件`)
    }
    
    if (duplicateGroups.length > 0) {
      const duplicatesToDelete = duplicateGroups.reduce((sum, group) => sum + (group.episodes.length - 1), 0)
      console.log(`2. 重複動画の削除: ${duplicatesToDelete}件`)
    }
    
    const totalToDelete = shortVideos.length + duplicateGroups.reduce((sum, group) => sum + (group.episodes.length - 1), 0)
    console.log(`\n📊 削除後の統計:`)
    console.log(`   削除前: ${allEpisodes?.length || 0}件`)
    console.log(`   削除予定: ${totalToDelete}件`)
    console.log(`   削除後: ${(allEpisodes?.length || 0) - totalToDelete}件`)
  }
  
  return {
    totalEpisodes: allEpisodes?.length || 0,
    shortVideos,
    duplicateGroups,
    needsCleanup: shortVideos.length > 0 || duplicateGroups.length > 0
  }
}

analyzeCurrentIssues().catch(console.error)