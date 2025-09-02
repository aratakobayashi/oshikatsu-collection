#!/usr/bin/env node

/**
 * Season11ロケーション情報の修正・追加（確認済み情報）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface LocationUpdate {
  name: string
  updates: {
    address?: string
    tabelog_url?: string
    phone?: string
    opening_hours?: string
  }
}

async function updateSeason11LocationsInfo() {
  console.log('🔄 Season11ロケーション情報を更新中...\n')

  // 確認済み情報による修正データ
  const locationUpdates: LocationUpdate[] = [
    {
      name: 'みたけ食堂',
      updates: {
        address: '東京都足立区谷在家2-5-2',
        tabelog_url: 'https://tabelog.com/tokyo/A1324/A132404/13081040/',
        phone: '03-3890-4421',
        opening_hours: '6:15-16:30（日祝休み）'
      }
    },
    {
      name: 'やすいみ～と',
      updates: {
        address: '東京都府中市白糸台1-23-3',
        phone: '042-363-8601',
        opening_hours: '昼11:30-14:30 夜17:00-22:00（日祝休み）'
      }
    }
  ]

  console.log(`🔄 ${locationUpdates.length}店舗の情報を更新します...`)

  let successCount = 0

  for (const locationUpdate of locationUpdates) {
    console.log(`\n🏪 ${locationUpdate.name}を更新中...`)

    // 対応するロケーションを検索
    const { data: location, error: findError } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url, phone, opening_hours')
      .eq('name', locationUpdate.name)
      .single()

    if (findError || !location) {
      console.error(`❌ ${locationUpdate.name}が見つかりません:`, findError)
      continue
    }

    console.log(`📍 現在の住所: ${location.address}`)
    if (locationUpdate.updates.address) {
      console.log(`📍 更新後住所: ${locationUpdate.updates.address}`)
    }

    console.log(`🔗 現在のタベログURL: ${location.tabelog_url || '未設定'}`)
    if (locationUpdate.updates.tabelog_url) {
      console.log(`🔗 更新後タベログURL: ${locationUpdate.updates.tabelog_url}`)
    }

    // データベースを更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        ...locationUpdate.updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', location.id)

    if (updateError) {
      console.error(`❌ ${locationUpdate.name}の更新エラー:`, updateError.message)
      continue
    }

    console.log(`✅ ${locationUpdate.name}更新完了`)
    successCount++
  }

  console.log(`\n🎉 ${successCount}/${locationUpdates.length}店舗の情報更新完了！`)

  // 現在のSeason11ロケーションの状況を表示
  console.log('\n📊 Season11ロケーションの状況:')
  const { data: allSeason11Locations } = await supabase
    .from('locations')
    .select('name, tabelog_url')
    .like('slug', '%season11%')
    .order('name')

  if (allSeason11Locations) {
    allSeason11Locations.forEach((loc, index) => {
      const hasTabelog = loc.tabelog_url && loc.tabelog_url.trim() !== ''
      const status = hasTabelog ? '✅' : '❌'
      console.log(`${index + 1}. ${status} ${loc.name} ${hasTabelog ? '(タベログあり)' : '(タベログなし)'}`)
    })

    const withTabelog = allSeason11Locations.filter(loc => loc.tabelog_url && loc.tabelog_url.trim() !== '').length
    console.log(`\n📊 タベログURL設定済み: ${withTabelog}/${allSeason11Locations.length}店舗`)
  }
}

updateSeason11LocationsInfo()