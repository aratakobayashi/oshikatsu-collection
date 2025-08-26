#!/usr/bin/env npx tsx

/**
 * 無効なロケーションデータのクリーンアップ
 * 
 * 問題:
 * 1. 曖昧な店舗名（「ケーキ屋さん (福岡)」「市場の朝食店」など）
 * 2. 実際の店舗と一致しない食べログリンク
 * 3. エピソード連携の不備確認
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface LocationToCleanup {
  id: string
  name: string
  address?: string
  tabelog_url?: string
  created_at: string
  episode_links: number
}

/**
 * 問題のあるロケーションを特定
 */
async function identifyProblematicLocations(): Promise<LocationToCleanup[]> {
  console.log('🔍 問題のあるロケーションを特定中...')
  
  // ジュニアCHANNEL関連の曖昧なロケーションを検索
  const { data: locations } = await supabase
    .from('locations')
    .select(`
      id, 
      name, 
      address, 
      tabelog_url, 
      created_at,
      episode_locations!inner(episode_id)
    `)
    .or('name.ilike.%ケーキ屋さん%,name.ilike.%市場の朝食店%,name.ilike.%スイーツ店%')
    .order('created_at', { ascending: false })

  if (!locations) return []

  // エピソード連携数をカウント
  const locationsWithCounts: LocationToCleanup[] = locations.map(loc => ({
    id: loc.id,
    name: loc.name,
    address: loc.address,
    tabelog_url: loc.tabelog_url,
    created_at: loc.created_at,
    episode_links: (loc as any).episode_locations?.length || 0
  }))

  return locationsWithCounts
}

/**
 * エピソード連携の詳細確認
 */
async function checkEpisodeLinking(locationId: string) {
  const { data: links } = await supabase
    .from('episode_locations')
    .select(`
      id,
      episode:episodes(id, title, celebrity:celebrities(name))
    `)
    .eq('location_id', locationId)

  return links || []
}

/**
 * ロケーションと関連データを安全に削除
 */
async function deleteLocationSafely(locationId: string, locationName: string): Promise<boolean> {
  console.log(`🗑️ 削除中: ${locationName} (${locationId})`)

  try {
    // 1. エピソード-ロケーションリンクを削除
    const { error: linkError } = await supabase
      .from('episode_locations')
      .delete()
      .eq('location_id', locationId)

    if (linkError) {
      console.error(`❌ リンク削除エラー:`, linkError.message)
      return false
    }

    // 2. ロケーション本体を削除
    const { error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('id', locationId)

    if (locationError) {
      console.error(`❌ ロケーション削除エラー:`, locationError.message)
      return false
    }

    console.log(`✅ 削除完了: ${locationName}`)
    return true

  } catch (error) {
    console.error(`❌ 削除中にエラー:`, error)
    return false
  }
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('🧹 無効ロケーションデータ クリーンアップ開始')
  console.log('='.repeat(50))

  try {
    // 1. 問題のあるロケーションを特定
    const problematicLocations = await identifyProblematicLocations()
    
    if (problematicLocations.length === 0) {
      console.log('✅ クリーンアップ対象のロケーションは見つかりませんでした')
      return
    }

    console.log(`🎯 クリーンアップ対象: ${problematicLocations.length}件`)
    console.log('')

    // 2. 各ロケーションの詳細確認
    for (const location of problematicLocations) {
      console.log(`📍 ${location.name}`)
      console.log(`   ID: ${location.id}`)
      console.log(`   住所: ${location.address || '未設定'}`)
      console.log(`   食べログ: ${location.tabelog_url || '未設定'}`)
      console.log(`   作成日: ${new Date(location.created_at).toLocaleString('ja-JP')}`)
      console.log(`   エピソード連携: ${location.episode_links}件`)

      // エピソード連携の詳細確認
      if (location.episode_links > 0) {
        const links = await checkEpisodeLinking(location.id)
        links.forEach((link: any, idx) => {
          const episode = link.episode
          const celebrity = episode?.celebrity
          console.log(`     ${idx + 1}. ${episode?.title} (${celebrity?.name})`)
        })
      }

      console.log('')
    }

    // 3. 削除確認（自動実行）
    console.log('⚠️ 以下のロケーションを削除します:')
    console.log('理由: 曖昧な店舗名で実際の店舗と一致せず、ユーザー体験を悪化させる')
    console.log('')

    let deletedCount = 0

    // 4. 各ロケーションを削除
    for (const location of problematicLocations) {
      // 曖昧な名前のロケーションのみ削除
      const isVague = location.name.includes('ケーキ屋さん') || 
                      location.name.includes('市場の朝食店') || 
                      location.name.includes('スイーツ店')

      if (isVague) {
        const success = await deleteLocationSafely(location.id, location.name)
        if (success) {
          deletedCount++
        }
        
        // レート制限対策
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // 5. 結果サマリー
    console.log('\n🎉 クリーンアップ完了!')
    console.log('='.repeat(50))
    console.log(`✅ 削除済みロケーション: ${deletedCount}件`)
    console.log(`✅ 削除済みエピソードリンク: ${problematicLocations.reduce((sum, loc) => sum + loc.episode_links, 0)}件`)
    
    console.log('\n💡 次のステップ:')
    console.log('1. より具体的な店舗情報の収集')
    console.log('2. YouTube動画の詳細分析による正確な店舗特定')
    console.log('3. 手動での店舗追加（確実に特定できる場合のみ）')
    
    // アフィリエイト状況を再確認
    console.log('\n📊 クリーンアップ後のアフィリエイト状況:')
    const { count: totalStores } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('tabelog_url', 'is', null)

    console.log(`店舗数: ${totalStores}件`)
    console.log(`予想収益: ¥${(totalStores || 0) * 120}/月`)

  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}

export { main as cleanupInvalidLocations }