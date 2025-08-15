import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.production' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function executeSafeDeletion() {
  console.log('🗑️ 安全削除の実行開始...\n')
  
  // セレブリティ取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', 'よにのちゃんねる')
    .single()
  
  if (!celebrity) {
    console.log('❌ よにのちゃんねるが見つかりません')
    return
  }
  
  // 前回の分析結果を再現
  const { data: allEpisodes } = await supabase
    .from('episodes')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .order('date', { ascending: false })
  
  console.log(`📺 削除前エピソード数: ${allEpisodes?.length || 0}`)
  
  // 重複グループの特定
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
  
  // ショート動画の特定
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
  
  // 削除候補ID収集
  const allDeletionCandidates = [
    ...duplicateGroups.flatMap(group => group.slice(1)), // 各グループの最初以外
    ...shortVideos
  ]
  
  const allDeletionIds = allDeletionCandidates.map(ep => ep.id)
  const uniqueDeletionIds = [...new Set(allDeletionIds)]
  
  // 関連データの確認
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
  
  // 安全削除対象の特定
  const safeDeletionIds = uniqueDeletionIds.filter(id => !episodesWithRelations.has(id))
  
  console.log(`✅ 安全削除対象: ${safeDeletionIds.length}件`)
  console.log(`⚠️ 関連データあり（スキップ）: ${episodesWithRelations.size}件`)
  
  if (safeDeletionIds.length === 0) {
    console.log('削除対象がありません。')
    return
  }
  
  // 削除前確認
  console.log('\n🗑️ 削除予定エピソード:')
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
    console.log('')
  })
  
  console.log(`📊 削除内訳: 重複${duplicateCount}件 + ショート${shortCount}件 = 合計${safeDeletionIds.length}件\n`)
  
  // 実際の削除実行
  console.log('🚀 削除実行中...')
  
  try {
    const { error } = await supabase
      .from('episodes')
      .delete()
      .in('id', safeDeletionIds)
    
    if (error) {
      console.error('❌ 削除エラー:', error)
      return
    }
    
    console.log('✅ 削除完了!')
    
    // 削除後の統計
    const { data: remainingEpisodes } = await supabase
      .from('episodes')
      .select('id')
      .eq('celebrity_id', celebrity.id)
    
    console.log('\n📊 削除後統計:')
    console.log('=====================================')
    console.log(`削除前: ${allEpisodes?.length || 0}件`)
    console.log(`削除数: ${safeDeletionIds.length}件`)
    console.log(`削除後: ${remainingEpisodes?.length || 0}件`)
    console.log(`データ整合性: ${(allEpisodes?.length || 0) - safeDeletionIds.length === (remainingEpisodes?.length || 0) ? '✅' : '❌'}`)
    
  } catch (error) {
    console.error('❌ 削除実行エラー:', error)
  }
}

executeSafeDeletion().catch(console.error)