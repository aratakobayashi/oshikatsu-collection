#!/usr/bin/env node

/**
 * 指定されたロケーションIDの詳細確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecificLocations() {
  console.log('🔍 指定ロケーションの詳細確認')
  console.log('='.repeat(60))

  const targetIds = [
    '94078027-58e0-4eb1-862c-c2ad0c2029f4',
    'fb0adf88-858e-416c-84f9-08ec14017a1f',
    'bbe8ec56-0482-4dd7-a119-d411460fe4c4',
    'b91ab2b5-e36b-4f1c-ab06-e983aed22144',
    '0ffca7df-2951-4c29-bc65-c891ef267dec',
    '702bf87b-1e0b-4e70-9e49-016c35bd313e',
    'b39b6280-6ffb-47a0-b36a-7f6af2d90a14',
    'a91ead51-2f91-42dd-8c6f-1917e5530379'
  ]

  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
    .in('id', targetIds)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 指定データ: ${locations.length}件`)

  locations.forEach((loc, i) => {
    console.log(`\n${i+1}. 【${loc.name}】`)
    console.log(`   ID: ${loc.id}`)
    console.log(`   📍 住所: ${loc.address || 'なし'}`)
    console.log(`   📝 説明: ${loc.description || 'なし'}`)
    console.log(`   🏷️ タグ: ${loc.tags?.join(', ') || 'なし'}`)
    console.log(`   📱 タベログURL: ${loc.tabelog_url ? 'あり' : 'なし'}`)
    console.log(`   🌐 ウェブサイト: ${loc.website_url ? 'あり' : 'なし'}`)
    console.log(`   📞 電話: ${loc.phone || 'なし'}`)
    console.log(`   🕐 営業時間: ${loc.opening_hours || 'なし'}`)
    console.log(`   🎬 エピソード数: ${loc.episode_locations?.length || 0}件`)
    
    if (loc.episode_locations && loc.episode_locations.length > 0) {
      const episodes = loc.episode_locations.map(el => el.episodes)
      const celebrities = [...new Set(episodes.map(ep => ep?.celebrities?.name).filter(Boolean))]
      console.log(`   ⭐ 関連セレブ: ${celebrities.join(', ')}`)
      console.log(`   📺 エピソード例: ${episodes[0]?.title || 'なし'}`)
    }
  })

  // 削除対象かどうかの判定
  console.log('\n🤔 【削除対象判定】')
  console.log('='.repeat(40))
  
  const deleteRecommendations = locations.map(loc => {
    const name = loc.name?.toLowerCase() || ''
    const address = loc.address?.toLowerCase() || ''
    
    let shouldDelete = false
    let reason = []
    
    // 人名パターン
    if (/^[一-龯]{2,4}\s+[一-龯]{2,4}$/.test(loc.name) || 
        /^[A-Za-z]+\s+[A-Za-z]+$/.test(loc.name)) {
      shouldDelete = true
      reason.push('人名パターン')
    }
    
    // 曖昧すぎる名前
    if (name.includes('その他') || name.includes('不明') || 
        name.includes('various') || name === '・他' ||
        name.length < 3) {
      shouldDelete = true
      reason.push('曖昧な名前')
    }
    
    // 明らかに店舗ではないもの
    if (name.includes('公園') || name.includes('駅') || 
        name.includes('ビル') || name.includes('マンション') ||
        name.includes('スタジオ') || name.includes('セット')) {
      shouldDelete = true
      reason.push('非店舗')
    }
    
    // 住所が曖昧
    if (address.includes('東京都内') || address.includes('各店舗') ||
        !loc.address || loc.address.length < 10) {
      shouldDelete = true
      reason.push('住所曖昧')
    }
    
    // 説明文っぽい長い名前
    if (loc.name && loc.name.length > 20) {
      shouldDelete = true
      reason.push('名前が長すぎ')
    }
    
    return {
      id: loc.id,
      name: loc.name,
      shouldDelete,
      reasons: reason,
      episodeCount: loc.episode_locations?.length || 0
    }
  })

  deleteRecommendations.forEach((rec, i) => {
    const status = rec.shouldDelete ? '❌ 削除推奨' : '✅ 保持推奨'
    console.log(`${i+1}. ${status}: "${rec.name}"`)
    if (rec.shouldDelete) {
      console.log(`   理由: ${rec.reasons.join(', ')}`)
    }
    console.log(`   エピソード: ${rec.episodeCount}件`)
    console.log('')
  })

  const deleteCount = deleteRecommendations.filter(r => r.shouldDelete).length
  const keepCount = deleteRecommendations.filter(r => !r.shouldDelete).length

  console.log(`📊 判定結果: 削除推奨${deleteCount}件、保持推奨${keepCount}件`)

  return {
    locations,
    deleteRecommendations,
    deleteCount,
    keepCount
  }
}

// 実行
checkSpecificLocations()
  .then(result => {
    console.log(`\n✅ 調査完了!`)
    console.log(`   削除推奨: ${result.deleteCount}件`)
    console.log(`   保持推奨: ${result.keepCount}件`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })