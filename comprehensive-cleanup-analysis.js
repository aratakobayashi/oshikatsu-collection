import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function comprehensiveCleanupAnalysis() {
  console.log('🧹 包括的クリーンアップ分析開始...\n')
  
  // セレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) return
  
  // 全エピソード取得
  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
  
  console.log(`📺 総エピソード数: ${allEpisodes?.length || 0}`)
  
  // 1. 重複動画の詳細分析
  console.log('\n🔄 重複動画の詳細分析:')
  console.log('=====================================')
  
  const duplicateGroups = []
  const processed = new Set()
  
  allEpisodes?.forEach(ep1 => {
    if (processed.has(ep1.id)) return
    
    const group = [ep1]
    
    allEpisodes?.forEach(ep2 => {
      if (ep1.id === ep2.id || processed.has(ep2.id)) return
      
      // 類似度チェック（複数の基準）
      const isSimilar = 
        // 基本タイトル比較
        ep1.title.replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '').trim() === 
        ep2.title.replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '').trim() ||
        // より厳密な比較
        ep1.title.replace(/[#\d\s\[\]【】]/g, '').toLowerCase() === 
        ep2.title.replace(/[#\d\s\[\]【】]/g, '').toLowerCase()
      
      if (isSimilar) {
        group.push(ep2)
        processed.add(ep2.id)
      }
    })
    
    if (group.length > 1) {
      // 日付順でソート
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      duplicateGroups.push(group)
    }
    
    processed.add(ep1.id)
  })
  
  console.log(`🔄 重複グループ数: ${duplicateGroups.length}`)
  
  let totalDuplicates = 0
  const deletionCandidates = []
  
  duplicateGroups.forEach((group, i) => {
    console.log(`\nグループ ${i+1}: (${group.length}件)`)
    console.log('─'.repeat(60))
    
    group.forEach((ep, j) => {
      const isOriginal = j === 0
      const marker = isOriginal ? '👑 [保持]' : '❌ [削除候補]'
      
      console.log(`${marker} ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   日付: ${ep.date.split('T')[0]}`)
      console.log(`   URL: ${ep.video_url || 'N/A'}`)
      
      if (!isOriginal) {
        deletionCandidates.push(ep)
        totalDuplicates++
      }
      console.log('')
    })
  })
  
  // 2. ショート動画の分析
  console.log('\n📱 ショート動画の分析:')
  console.log('=====================================')
  
  const shortVideos = allEpisodes?.filter(ep => {
    const title = ep.title.toLowerCase()
    const desc = (ep.description || '').toLowerCase()
    
    return title.includes('#shorts') ||
           title.includes('shorts') ||
           title.includes('ショート') ||
           desc.includes('#shorts') ||
           desc.includes('shorts') ||
           (ep.duration_minutes && ep.duration_minutes <= 1) ||
           title.length < 15
  }) || []
  
  console.log(`📱 ショート動画候補: ${shortVideos.length}件`)
  
  shortVideos.forEach((ep, i) => {
    console.log(`${i+1}. ${ep.title}`)
    console.log(`   ID: ${ep.id}`)
    console.log(`   時間: ${ep.duration_minutes || 'N/A'}分`)
    console.log(`   日付: ${ep.date.split('T')[0]}`)
    console.log('')
  })
  
  // 3. 関連データの確認
  console.log('\n🔗 削除候補の関連データ確認:')
  console.log('=====================================')
  
  const allDeletionIds = [
    ...deletionCandidates.map(ep => ep.id),
    ...shortVideos.map(ep => ep.id)
  ]
  
  const uniqueDeletionIds = [...new Set(allDeletionIds)]
  
  if (uniqueDeletionIds.length > 0) {
    const { data: locations } = await supabase
      .from('episode_locations')
      .select('episode_id, locations(name)')
      .in('episode_id', uniqueDeletionIds)
    
    const { data: items } = await supabase
      .from('episode_items')
      .select('episode_id, items(name)')
      .in('episode_id', uniqueDeletionIds)
    
    console.log(`📍 関連ロケーション: ${locations?.length || 0}件`)
    console.log(`🛍️ 関連アイテム: ${items?.length || 0}件`)
    
    if (locations?.length || items?.length) {
      console.log('\n⚠️ 関連データがある削除候補:')
      
      const episodesWithData = [...new Set([
        ...(locations?.map(l => l.episode_id) || []),
        ...(items?.map(i => i.episode_id) || [])
      ])]
      
      episodesWithData.forEach(epId => {
        const episode = allEpisodes?.find(ep => ep.id === epId)
        const relatedLocations = locations?.filter(l => l.episode_id === epId) || []
        const relatedItems = items?.filter(i => i.episode_id === epId) || []
        
        console.log(`• ${episode?.title}`)
        console.log(`  ID: ${epId}`)
        console.log(`  ロケーション: ${relatedLocations.length}件`)
        console.log(`  アイテム: ${relatedItems.length}件`)
        
        if (relatedLocations.length > 0) {
          console.log(`    場所: ${relatedLocations.map(l => l.locations?.name).join(', ')}`)
        }
        console.log('')
      })
    }
  }
  
  // 4. クリーンアップ実行計画
  console.log('\n📋 クリーンアップ実行計画:')
  console.log('=====================================')
  
  const safeDeletions = uniqueDeletionIds.filter(id => {
    const hasLocations = locations?.some(l => l.episode_id === id)
    const hasItems = items?.some(i => i.episode_id === id)
    return !hasLocations && !hasItems
  })
  
  const unsafeDeletions = uniqueDeletionIds.filter(id => !safeDeletions.includes(id))
  
  console.log(`✅ 安全に削除可能: ${safeDeletions.length}件`)
  console.log(`⚠️ 要注意（関連データあり）: ${unsafeDeletions.length}件`)
  console.log(`📊 削除後のエピソード数: ${(allEpisodes?.length || 0) - safeDeletions.length}件`)
  
  if (safeDeletions.length > 0) {
    console.log('\n🗑️ 安全削除リスト:')
    safeDeletions.forEach(id => {
      const ep = allEpisodes?.find(e => e.id === id)
      if (ep) {
        console.log(`• ${ep.title} (${ep.id})`)
      }
    })
  }
  
  if (unsafeDeletions.length > 0) {
    console.log('\n⚠️ 手動確認必要リスト:')
    unsafeDeletions.forEach(id => {
      const ep = allEpisodes?.find(e => e.id === id)
      if (ep) {
        console.log(`• ${ep.title} (${ep.id})`)
      }
    })
  }
  
  return {
    totalEpisodes: allEpisodes?.length || 0,
    duplicateGroups: duplicateGroups.length,
    totalDuplicates,
    shortVideos: shortVideos.length,
    safeDeletions: safeDeletions.length,
    unsafeDeletions: unsafeDeletions.length,
    safeDeletionIds: safeDeletions,
    unsafeDeletionIds: unsafeDeletions
  }
}

comprehensiveCleanupAnalysis().catch(console.error)