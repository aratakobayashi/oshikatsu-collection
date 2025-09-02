#!/usr/bin/env node

/**
 * 単一ロケーションの詳細確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSingleLocation() {
  const targetId = '579ddbcc-eac7-4e0c-96e9-f05769ce8678'

  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        id, episode_id,
        episodes(id, title, celebrities(name))
      )
    `)
    .eq('id', targetId)
    .single()

  if (error) {
    console.log('❌ データが見つかりません（既に削除済みの可能性）')
    return null
  }

  console.log('🔍 指定ロケーション詳細')
  console.log('='.repeat(40))
  console.log(`名前: "${location.name}"`)
  console.log(`ID: ${location.id}`)
  console.log(`住所: ${location.address || 'なし'}`)
  console.log(`説明: ${location.description || 'なし'}`)
  console.log(`タグ: ${location.tags?.join(', ') || 'なし'}`)
  console.log(`タベログURL: ${location.tabelog_url ? 'あり' : 'なし'}`)
  console.log(`ウェブサイト: ${location.website_url ? 'あり' : 'なし'}`)
  console.log(`電話: ${location.phone || 'なし'}`)
  console.log(`営業時間: ${location.opening_hours || 'なし'}`)
  console.log(`エピソード数: ${location.episode_locations?.length || 0}件`)

  if (location.episode_locations && location.episode_locations.length > 0) {
    const celebrities = [...new Set(location.episode_locations.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean))]
    console.log(`関連セレブ: ${celebrities.join(', ')}`)
    console.log(`エピソード例: ${location.episode_locations[0].episodes?.title || 'なし'}`)
  }

  // 削除推奨判定
  let shouldDelete = false
  let reasons = []

  if (!location.address || location.address.includes('東京都内') || location.address.length < 10) {
    shouldDelete = true
    reasons.push('住所が曖昧')
  }

  if (location.name && (location.name.length > 30 || location.name.includes('【') || location.name.includes('】'))) {
    shouldDelete = true
    reasons.push('説明文っぽい名前')
  }

  if (!location.tabelog_url && !location.phone && (!location.address || location.address.length < 15)) {
    shouldDelete = true
    reasons.push('店舗情報不足')
  }

  console.log('\n🤔 削除判定')
  console.log('='.repeat(20))
  if (shouldDelete) {
    console.log('❌ 削除推奨')
    console.log(`理由: ${reasons.join(', ')}`)
  } else {
    console.log('✅ 保持推奨')
  }

  return location
}

checkSingleLocation()
  .then(location => {
    if (!location) {
      console.log('データが見つかりませんでした。')
    }
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })