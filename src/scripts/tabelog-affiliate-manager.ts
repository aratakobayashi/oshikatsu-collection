#!/usr/bin/env npx tsx

/**
 * 食べログアフィリエイト管理ツール
 * 
 * ⚠️ 重要：このプロジェクトでは以下の方式以外は使用禁止
 * - 直接の食べログURLをlocations.tabelog_urlに保存
 * - LinkSwitch（vc_pid=891908080）による自動変換に依存
 * - ValueCommerseの手動リンクは使用しない
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface TabelogLocation {
  id: string
  name: string
  address?: string
  tabelog_url?: string
}

class TabelogAffiliateManager {
  
  /**
   * 🚨 重要：正しいリンク形式の検証
   */
  private validateTabelogUrl(url: string): boolean {
    // 直接の食べログURLのみ許可
    const tabelogPattern = /^https:\/\/tabelog\.com\/[^\/]+\/[^\/]+\/[^\/]+\/\d+\/?$/
    return tabelogPattern.test(url)
  }

  /**
   * 🚨 重要：ValueCommerceリンクを検出して警告
   */
  private detectValueCommerceUrl(url: string): boolean {
    return url.includes('valuecommerce.com') || url.includes('ck.jp.ap.valuecommerce.com')
  }

  /**
   * 新しい食べログリンクを追加
   */
  async addTabelogUrl(locationId: string, tabelogUrl: string): Promise<boolean> {
    // 1. リンク形式の検証
    if (!this.validateTabelogUrl(tabelogUrl)) {
      console.error('❌ 無効な食べログURL形式:', tabelogUrl)
      console.error('✅ 正しい形式: https://tabelog.com/tokyo/A1311/A131101/13279833/')
      return false
    }

    // 2. ValueCommerceリンクの検出と拒否
    if (this.detectValueCommerceUrl(tabelogUrl)) {
      console.error('❌ ValueCommerceリンクは使用禁止:', tabelogUrl)
      console.error('✅ 直接の食べログURLを使用してください')
      return false
    }

    // 3. ロケーションの存在確認
    const { data: location, error: fetchError } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url')
      .eq('id', locationId)
      .single()

    if (fetchError || !location) {
      console.error('❌ ロケーションが見つかりません:', locationId)
      return false
    }

    // 4. 既存リンクの確認
    if (location.tabelog_url) {
      console.log('⚠️ 既存のリンクを上書きします:')
      console.log(`  旧: ${location.tabelog_url}`)
      console.log(`  新: ${tabelogUrl}`)
    }

    // 5. データベース更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({ 
        tabelog_url: tabelogUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', locationId)

    if (updateError) {
      console.error('❌ データベース更新エラー:', updateError.message)
      return false
    }

    console.log(`✅ 食べログリンクを正常に追加しました:`)
    console.log(`  店舗: ${location.name}`)
    console.log(`  住所: ${location.address || '未設定'}`)
    console.log(`  URL: ${tabelogUrl}`)

    return true
  }

  /**
   * アフィリエイト設定済み店舗一覧
   */
  async listAffiliateStores(): Promise<void> {
    const { data: stores, error } = await supabase
      .from('locations')
      .select('id, name, address, tabelog_url, created_at, updated_at')
      .not('tabelog_url', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('❌ データ取得エラー:', error.message)
      return
    }

    console.log('🍽️ 食べログアフィリエイト設定済み店舗一覧')
    console.log('='.repeat(60))
    console.log(`総店舗数: ${stores?.length || 0}件`)
    console.log(`予想月間収益: ¥${(stores?.length || 0) * 120}`)
    console.log('')

    stores?.forEach((store, idx) => {
      console.log(`${idx + 1}. ${store.name}`)
      console.log(`   ID: ${store.id}`)
      console.log(`   住所: ${store.address || '未設定'}`)
      console.log(`   URL: ${store.tabelog_url}`)
      
      // リンク形式の検証
      if (this.detectValueCommerceUrl(store.tabelog_url!)) {
        console.log('   ⚠️ ValueCommerceリンク検出 - 修正が必要')
      } else if (this.validateTabelogUrl(store.tabelog_url!)) {
        console.log('   ✅ 正しい形式')
      } else {
        console.log('   ❌ 無効な形式')
      }
      
      console.log(`   更新日: ${new Date(store.updated_at).toLocaleDateString('ja-JP')}`)
      console.log('')
    })
  }

  /**
   * 拡張候補店舗の取得
   */
  async getExpansionCandidates(limit: number = 10): Promise<TabelogLocation[]> {
    // エピソード紐付きでアフィリエイト未設定の店舗
    const { data: locationIds } = await supabase
      .from('episode_locations')
      .select('location_id')

    if (!locationIds || locationIds.length === 0) {
      console.log('⚠️ エピソード紐付きロケーションが見つかりません')
      return []
    }

    const uniqueIds = [...new Set(locationIds.map(el => el.location_id))]

    // バッチ処理で候補を取得
    const batchSize = 100
    const allCandidates: TabelogLocation[] = []

    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const batch = uniqueIds.slice(i, i + batchSize)
      const { data: batchCandidates } = await supabase
        .from('locations')
        .select('id, name, address, tabelog_url')
        .in('id', batch)
        .is('tabelog_url', null)

      if (batchCandidates) {
        allCandidates.push(...batchCandidates)
      }
    }

    return allCandidates.slice(0, limit)
  }

  /**
   * 拡張候補の表示
   */
  async showExpansionCandidates(limit: number = 10): Promise<void> {
    console.log(`🎯 食べログアフィリエイト拡張候補 (上位${limit}件)`)
    console.log('='.repeat(60))

    const candidates = await this.getExpansionCandidates(limit)

    if (candidates.length === 0) {
      console.log('✅ 全ての対象店舗にアフィリエイトが設定済みです')
      return
    }

    console.log(`拡張可能店舗: ${candidates.length}件`)
    console.log(`追加収益ポテンシャル: ¥${candidates.length * 120}/月`)
    console.log('')

    candidates.forEach((candidate, idx) => {
      console.log(`${idx + 1}. ${candidate.name}`)
      console.log(`   ID: ${candidate.id}`)
      console.log(`   住所: ${candidate.address || '未設定'}`)
      console.log('')
    })

    console.log('📋 追加方法:')
    console.log(`npx tsx ${__filename} --action add --location-id [ID] --url [食べログURL]`)
  }

  /**
   * システム健全性チェック
   */
  async healthCheck(): Promise<void> {
    console.log('🔍 食べログアフィリエイトシステム健全性チェック')
    console.log('='.repeat(60))

    // 1. LinkSwitch設定確認
    const indexHtmlPath = resolve(__dirname, '../../index.html')
    try {
      const fs = await import('fs/promises')
      const indexContent = await fs.readFile(indexHtmlPath, 'utf-8')
      
      if (indexContent.includes('vc_pid = "891908080"')) {
        console.log('✅ LinkSwitch設定: 正常 (vc_pid=891908080)')
      } else {
        console.log('❌ LinkSwitch設定: 異常 - index.htmlを確認してください')
      }
    } catch (error) {
      console.log('⚠️ index.htmlの確認に失敗しました')
    }

    // 2. アフィリエイト店舗数
    const { count: affiliateCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .not('tabelog_url', 'is', null)

    console.log(`✅ アフィリエイト設定済み店舗: ${affiliateCount}件`)
    console.log(`✅ 予想月間収益: ¥${(affiliateCount || 0) * 120}`)

    // 3. リンク形式の検証
    const { data: allLinks } = await supabase
      .from('locations')
      .select('id, name, tabelog_url')
      .not('tabelog_url', 'is', null)

    let validCount = 0
    let valueCommerceCount = 0
    let invalidCount = 0

    allLinks?.forEach(link => {
      if (this.detectValueCommerceUrl(link.tabelog_url!)) {
        valueCommerceCount++
      } else if (this.validateTabelogUrl(link.tabelog_url!)) {
        validCount++
      } else {
        invalidCount++
      }
    })

    console.log(`✅ 正しい形式: ${validCount}件`)
    if (valueCommerceCount > 0) {
      console.log(`⚠️ ValueCommerceリンク: ${valueCommerceCount}件 (修正推奨)`)
    }
    if (invalidCount > 0) {
      console.log(`❌ 無効な形式: ${invalidCount}件 (要修正)`)
    }

    // 4. 拡張ポテンシャル
    const candidates = await this.getExpansionCandidates(1000)
    console.log(`🎯 拡張可能店舗: ${candidates.length}件`)
    console.log(`🚀 最大収益ポテンシャル: ¥${((affiliateCount || 0) + candidates.length) * 120}/月`)

    console.log('✅ システム健全性チェック完了')
  }
}

// CLI実行部分
async function main() {
  const manager = new TabelogAffiliateManager()
  const args = process.argv.slice(2)

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
🍽️ 食べログアフィリエイト管理ツール

使用方法:
  npx tsx ${__filename} --action <action> [options]

アクション:
  list                           アフィリエイト設定済み店舗一覧
  candidates [--limit N]         拡張候補店舗一覧
  add --location-id ID --url URL 新しいアフィリエイトリンク追加
  health                         システム健全性チェック

例:
  npx tsx ${__filename} --action list
  npx tsx ${__filename} --action candidates --limit 20
  npx tsx ${__filename} --action add --location-id abc-123 --url https://tabelog.com/tokyo/A1311/A131101/13279833/
  npx tsx ${__filename} --action health

⚠️ 重要な注意事項:
- 直接の食べログURLのみ使用可能
- ValueCommerceリンクは使用禁止
- LinkSwitch（vc_pid=891908080）による自動変換に依存
    `)
    return
  }

  const action = args[args.indexOf('--action') + 1]

  switch (action) {
    case 'list':
      await manager.listAffiliateStores()
      break

    case 'candidates': {
      const limitIndex = args.indexOf('--limit')
      const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) || 10 : 10
      await manager.showExpansionCandidates(limit)
      break
    }

    case 'add': {
      const locationIdIndex = args.indexOf('--location-id')
      const urlIndex = args.indexOf('--url')
      
      if (locationIdIndex === -1 || urlIndex === -1) {
        console.error('❌ --location-id と --url が必要です')
        return
      }

      const locationId = args[locationIdIndex + 1]
      const url = args[urlIndex + 1]

      await manager.addTabelogUrl(locationId, url)
      break
    }

    case 'health':
      await manager.healthCheck()
      break

    default:
      console.error('❌ 不明なアクション:', action)
      console.log('使用可能なアクション: list, candidates, add, health')
  }
}

// 実行
if (import.meta.url === `file://${__filename}`) {
  main().catch(console.error)
}

export { TabelogAffiliateManager }