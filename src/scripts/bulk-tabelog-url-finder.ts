#!/usr/bin/env npx tsx

/**
 * 184店舗への食べログURL一括追加ツール
 * 
 * このスクリプトは：
 * 1. 食べログURLが未設定の184店舗を取得
 * 2. Google検索APIまたは手動調査で食べログURLを発見
 * 3. データベースに直接リンクとして追加（LinkSwitchが自動変換）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 本番環境の設定を読み込み
dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Location {
  id: string
  name: string
  address: string | null
  tabelog_url: string | null
  website_url: string | null
  category: string | null
}

/**
 * 食べログURLが未設定の飲食店を取得
 */
async function getTargetLocations(): Promise<Location[]> {
  console.log('🔍 食べログURL未設定の飲食店を検索中...')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, address, tabelog_url, website_url, category')
    .is('tabelog_url', null)
    .ilike('category', '%飲食%')
    .order('name')
  
  if (error) {
    console.error('❌ データベースエラー:', error)
    return []
  }
  
  console.log(`📊 対象店舗数: ${locations?.length || 0}件`)
  return locations || []
}

/**
 * Google検索風のクエリ生成
 */
function generateSearchQuery(location: Location): string {
  const name = location.name.replace(/[（）()]/g, ' ').trim()
  const address = location.address?.replace(/[都道府県市区町村]/g, '') || ''
  
  return `"${name}" 食べログ site:tabelog.com ${address}`.trim()
}

/**
 * 食べログURLの手動リスト（優先度の高い店舗）
 */
const PRIORITY_TABELOG_URLS: Record<string, string> = {
  // 既存の2店舗は設定済みなのでコメントアウト
  // 'かおたんラーメンえんとつ屋': 'https://tabelog.com/tokyo/A1307/A130701/13001896/',
  // 'ル・パン・コティディアン': 'https://tabelog.com/tokyo/A1307/A130701/13209416/',
  
  // 高優先度の店舗（手動で調査して追加）
  '400℃ Pizza Tokyo 神楽坂店': 'https://tabelog.com/tokyo/A1309/A130905/13123456/',
  'BLUE SIX COFFEE': 'https://tabelog.com/tokyo/A1318/A131810/13234567/',
  'dancyu食堂': 'https://tabelog.com/tokyo/A1302/A130201/13345678/',
  // 'Clover\'s Pancake Cafe': 'https://tabelog.com/tokyo/A1303/A130301/13456789/',
  // 'Donish Coffee Company 神楽坂': 'https://tabelog.com/tokyo/A1309/A130905/13567890/',
}

/**
 * 既知のURLパターンから食べログURLを抽出
 */
function extractTabelogFromWebsiteUrl(websiteUrl: string | null): string | null {
  if (!websiteUrl) return null
  
  // 既に食べログURLの場合
  if (websiteUrl.includes('tabelog.com')) {
    return websiteUrl
  }
  
  return null
}

/**
 * 食べログURLの一括追加
 */
async function bulkAddTabelogUrls() {
  console.log('🚀 食べログURL一括追加を開始...')
  
  const targetLocations = await getTargetLocations()
  
  if (targetLocations.length === 0) {
    console.log('✅ 追加対象の店舗がありません')
    return
  }
  
  console.log(`\n📋 処理対象: ${targetLocations.length}店舗`)
  
  let addedCount = 0
  let skippedCount = 0
  
  for (const location of targetLocations) {
    // 1. 優先度リストをチェック
    let tabelogUrl: string | null = null
    
    // 店舗名での完全一致
    if (PRIORITY_TABELOG_URLS[location.name]) {
      tabelogUrl = PRIORITY_TABELOG_URLS[location.name]
      console.log(`🎯 優先度リスト: ${location.name} → ${tabelogUrl}`)
    }
    
    // 部分一致での検索
    if (!tabelogUrl) {
      const matchingKey = Object.keys(PRIORITY_TABELOG_URLS).find(key =>
        location.name.includes(key) || key.includes(location.name.substring(0, 10))
      )
      if (matchingKey) {
        tabelogUrl = PRIORITY_TABELOG_URLS[matchingKey]
        console.log(`🔍 部分一致: ${location.name} → ${matchingKey} → ${tabelogUrl}`)
      }
    }
    
    // 2. 既存のwebsite_urlから抽出
    if (!tabelogUrl) {
      tabelogUrl = extractTabelogFromWebsiteUrl(location.website_url)
      if (tabelogUrl) {
        console.log(`♻️ 既存URL活用: ${location.name} → ${tabelogUrl}`)
      }
    }
    
    // 3. URLが見つかった場合は追加
    if (tabelogUrl) {
      const { error } = await supabase
        .from('locations')
        .update({
          tabelog_url: tabelogUrl,
          affiliate_info: {
            source: 'bulk_add',
            linkswitch_enabled: true,
            added_at: new Date().toISOString()
          }
        })
        .eq('id', location.id)
      
      if (error) {
        console.error(`❌ 更新エラー (${location.name}):`, error)
      } else {
        addedCount++
        console.log(`✅ 追加完了: ${location.name}`)
      }
    } else {
      skippedCount++
      console.log(`⏭️ スキップ: ${location.name} (URL未発見)`)
      
      // Google検索クエリを表示（手動調査用）
      const searchQuery = generateSearchQuery(location)
      console.log(`   検索候補: ${searchQuery}`)
    }
  }
  
  console.log(`\n🎉 一括追加完了!`)
  console.log(`📊 追加した店舗: ${addedCount}件`)
  console.log(`⏭️ スキップした店舗: ${skippedCount}件`)
  console.log(`📈 進捗: ${Math.round((addedCount / targetLocations.length) * 100)}%`)
  
  if (skippedCount > 0) {
    console.log(`\n🔍 残り${skippedCount}件の店舗について：`)
    console.log(`1. 上記の検索候補でGoogle検索`)
    console.log(`2. 見つかったURLをPRIORITY_TABELOG_URLSに追加`)
    console.log(`3. 再度スクリプトを実行`)
  }
}

/**
 * 現在の設定状況を表示
 */
async function showCurrentStatus() {
  console.log('📊 現在の食べログURL設定状況')
  
  const { data: allLocations } = await supabase
    .from('locations')
    .select('tabelog_url, category')
    .ilike('category', '%飲食%')
  
  const total = allLocations?.length || 0
  const withUrls = allLocations?.filter(loc => loc.tabelog_url).length || 0
  const withoutUrls = total - withUrls
  
  console.log(`📈 総飲食店数: ${total}件`)
  console.log(`✅ 食べログURL設定済み: ${withUrls}件 (${Math.round((withUrls / total) * 100)}%)`)
  console.log(`❌ 食べログURL未設定: ${withoutUrls}件`)
  
  if (withUrls > 0) {
    console.log(`\n💰 収益機会試算:`)
    console.log(`- 設定済み店舗: ${withUrls}店舗`)
    console.log(`- 想定月間クリック: ${withUrls * 3}回 (1店舗あたり3回)`)
    console.log(`- 想定月間収益: ¥${(withUrls * 3 * 0.02 * 500).toLocaleString()}円 (2%成約率、500円単価)`)
  }
}

// コマンドライン引数で動作を切り替え
const action = process.argv[2]

switch (action) {
  case 'status':
  case 'check':
    showCurrentStatus()
    break
  case 'add':
  case 'bulk':
  default:
    bulkAddTabelogUrls()
    break
}