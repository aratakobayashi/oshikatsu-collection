import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function identifySafeDeletions() {
  console.log('🔍 安全削除対象の特定開始...\n')
  
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
  
  // 1. 重複グループの特定
  const duplicateGroups = []
  const processed = new Set()
  
  allEpisodes?.forEach(ep1 => {
    if (processed.has(ep1.id)) return
    
    const group = [ep1]
    
    allEpisodes?.forEach(ep2 => {
      if (ep1.id === ep2.id || processed.has(ep2.id)) return
      
      const isSimilar = 
        ep1.title.replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '').trim() === 
        ep2.title.replace(/^(#\d+|よにのちゃんねる)[\[\s]*/i, '').trim()
      
      if (isSimilar) {
        group.push(ep2)
        processed.add(ep2.id)
      }
    })
    
    if (group.length > 1) {
      group.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      duplicateGroups.push(group)
    }
    
    processed.add(ep1.id)
  })
  
  // 2. ショート動画の特定
  const shortVideos = allEpisodes?.filter(ep => {
    const title = ep.title.toLowerCase()
    const desc = (ep.description || '').toLowerCase()
    
    return title.includes('#shorts') ||
           title.includes('shorts') ||
           title.includes('ショート') ||
           desc.includes('#shorts') ||
           desc.includes('shorts') ||
           title.length < 15
  }) || []
  
  // 3. すべての削除候補ID収集
  const allDeletionCandidates = [
    ...duplicateGroups.flatMap(group => group.slice(1)), // 各グループの最初以外
    ...shortVideos
  ]
  
  const allDeletionIds = allDeletionCandidates.map(ep => ep.id)
  const uniqueDeletionIds = [...new Set(allDeletionIds)]
  
  console.log(`🗑️ 削除候補総数: ${uniqueDeletionIds.length}件`)
  console.log(`   重複動画: ${duplicateGroups.reduce((sum, group) => sum + (group.length - 1), 0)}件`)
  console.log(`   ショート動画: ${shortVideos.length}件`)
  
  // 4. 関連データの確認
  const { data: locationRelations } = await supabase
    .from('episode_locations')
    .select('episode_id')
    .in('episode_id', uniqueDeletionIds)
  
  const { data: itemRelations } = await supabase
    .from('episode_items')
    .select('episode_id')
    .in('episode_id', uniqueDeletionIds)
  
  const episodesWithRelations = new Set([
    ...(locationRelations?.map(r => r.episode_id) || []),
    ...(itemRelations?.map(r => r.episode_id) || [])
  ])
  
  // 5. 安全削除対象の特定
  const safeDeletionIds = uniqueDeletionIds.filter(id => !episodesWithRelations.has(id))
  const unsafeDeletionIds = uniqueDeletionIds.filter(id => episodesWithRelations.has(id))
  
  console.log(`\n✅ 安全削除可能: ${safeDeletionIds.length}件`)
  console.log(`⚠️ 関連データあり: ${unsafeDeletionIds.length}件`)
  
  // 6. 安全削除リストの詳細表示
  if (safeDeletionIds.length > 0) {
    console.log('\n🗑️ 安全削除リスト:')
    console.log('=====================================')
    
    const safeDeletionEpisodes = allDeletionCandidates.filter(ep => 
      safeDeletionIds.includes(ep.id)
    )
    
    let duplicateCount = 0
    let shortCount = 0
    
    safeDeletionEpisodes.forEach((ep, i) => {
      const isShort = shortVideos.some(sv => sv.id === ep.id)
      const isDuplicate = duplicateGroups.some(group => 
        group.slice(1).some(dupEp => dupEp.id === ep.id)
      )
      
      const type = isShort ? '[SHORT]' : '[DUPLICATE]'
      
      if (isShort) shortCount++
      if (isDuplicate) duplicateCount++
      
      console.log(`${i+1}. ${type} ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   日付: ${ep.date.split('T')[0]}`)
      console.log(`   URL: ${ep.video_url || 'N/A'}`)
      console.log('')
    })
    
    console.log(`📊 安全削除内訳:`)
    console.log(`   重複動画: ${duplicateCount}件`)
    console.log(`   ショート動画: ${shortCount}件`)
  }
  
  // 7. 要注意リストの表示
  if (unsafeDeletionIds.length > 0) {
    console.log('\n⚠️ 要注意リスト（関連データあり）:')
    console.log('=====================================')
    
    const unsafeDeletionEpisodes = allDeletionCandidates.filter(ep => 
      unsafeDeletionIds.includes(ep.id)
    )
    
    unsafeDeletionEpisodes.forEach((ep, i) => {
      const locationCount = locationRelations?.filter(r => r.episode_id === ep.id).length || 0
      const itemCount = itemRelations?.filter(r => r.episode_id === ep.id).length || 0
      
      console.log(`${i+1}. ${ep.title}`)
      console.log(`   ID: ${ep.id}`)
      console.log(`   関連データ: ロケーション${locationCount}件, アイテム${itemCount}件`)
      console.log('')
    })
  }
  
  return {
    totalEpisodes: allEpisodes?.length || 0,
    totalDeletionCandidates: uniqueDeletionIds.length,
    safeDeletions: safeDeletionIds.length,
    unsafeDeletions: unsafeDeletionIds.length,
    safeDeletionIds,
    unsafeDeletionIds
  }
}

identifySafeDeletions().catch(console.error)