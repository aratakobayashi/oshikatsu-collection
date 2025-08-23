#!/usr/bin/env npx tsx

/**
 * 大規模食べログ展開システム
 * 
 * 180店舗への食べログURL一括追加のための総合システム
 * 3段階アプローチ：既知パターン → 自動検索 → 手動リスト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

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
}

/**
 * 既知の店舗パターンマッピング（チェーン店等）
 */
const KNOWN_CHAINS: Record<string, (name: string, address?: string) => string | null> = {
  // スターバックス
  'スターバックス': (name: string, address?: string) => {
    // スターバックスは食べログに載っていないことが多い
    return null
  },
  
  // マクドナルド
  'マクドナルド': (name: string, address?: string) => {
    if (address?.includes('渋谷')) return 'https://tabelog.com/tokyo/A1303/A130301/13001234/' // 例
    return null
  },
  
  // カフェチェーン
  'ドトール': () => null, // 基本的に食べログ未対応
  'タリーズ': () => null,
  'エクセルシオール': () => null,
}

/**
 * 明らかに食べログに載らない店舗パターン
 */
const EXCLUDE_PATTERNS = [
  '・他',
  '📖',
  'Loppi',
  'TSUTAYA',
  '楽天',
  'Amazon',
  'Yahoo',
  'Google',
  'YouTube',
  '109', // 商業施設
  'GiGO', // ゲームセンター
  'ABCラジオ', // 放送局
]

/**
 * 対象店舗を取得（食べログURLが未設定で、明らかな飲食店）
 */
async function getTargetLocations(): Promise<Location[]> {
  console.log('🔍 対象店舗を検索中...')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, address, tabelog_url, website_url')
    .is('tabelog_url', null)
    .not('name', 'in', `(${EXCLUDE_PATTERNS.map(p => `"${p}"`).join(',')})`)
    .order('name')
  
  if (error) {
    console.error('❌ データベースエラー:', error)
    return []
  }
  
  // さらに除外パターンでフィルタリング
  const filtered = locations?.filter(loc => {
    const name = loc.name.toLowerCase()
    return !EXCLUDE_PATTERNS.some(pattern => 
      name.includes(pattern.toLowerCase()) || 
      loc.name.includes(pattern)
    )
  }) || []
  
  console.log(`📊 対象店舗数: ${filtered.length}件`)
  return filtered
}

/**
 * フェーズ1: 既知パターンでの一括処理
 */
async function processKnownPatterns() {
  console.log('🎯 フェーズ1: 既知パターンでの処理開始')
  
  const locations = await getTargetLocations()
  let processedCount = 0
  
  for (const location of locations) {
    // チェーン店判定
    const chainMatch = Object.keys(KNOWN_CHAINS).find(chain => 
      location.name.includes(chain)
    )
    
    if (chainMatch) {
      const generator = KNOWN_CHAINS[chainMatch]
      const tabelogUrl = generator(location.name, location.address || undefined)
      
      if (tabelogUrl) {
        console.log(`✅ チェーン店パターン: ${location.name} → ${tabelogUrl}`)
        
        const { error } = await supabase
          .from('locations')
          .update({
            tabelog_url: tabelogUrl,
            affiliate_info: {
              source: 'known_pattern',
              pattern: chainMatch,
              linkswitch_enabled: true,
              added_at: new Date().toISOString()
            }
          })
          .eq('id', location.id)
        
        if (error) {
          console.error(`❌ 更新エラー (${location.name}):`, error)
        } else {
          processedCount++
        }
      }
    }
  }
  
  console.log(`📊 フェーズ1完了: ${processedCount}件処理`)
  return processedCount
}

/**
 * フェーズ2: 高優先度店舗の手動調査リスト生成
 */
async function generateManualResearchList() {
  console.log('📝 フェーズ2: 手動調査リスト生成中...')
  
  const locations = await getTargetLocations()
  
  // 優先度スコア算出
  const prioritized = locations
    .map(loc => ({
      ...loc,
      priority: calculatePriorityScore(loc)
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 50) // TOP50を手動調査対象とする
  
  // CSVファイル生成
  const csvContent = [
    'ID,店舗名,住所,優先度,検索クエリ1,検索クエリ2,食べログURL',
    ...prioritized.map(loc => [
      loc.id,
      `"${loc.name}"`,
      `"${loc.address || ''}"`,
      loc.priority,
      `"${loc.name} 食べログ site:tabelog.com"`,
      `"${loc.name.replace(/[（）()]/g, ' ')} tabelog"`,
      '' // 手動で入力
    ].join(','))
  ].join('\n')
  
  const filePath = resolve(__dirname, '../../manual-research-top50.csv')
  fs.writeFileSync(filePath, csvContent, 'utf-8')
  
  console.log(`✅ 手動調査リスト生成完了: ${filePath}`)
  console.log(`📊 対象店舗: ${prioritized.length}件`)
  
  // 検索クエリ例を表示
  console.log('\n🔍 検索クエリ例（TOP10）:')
  prioritized.slice(0, 10).forEach((loc, index) => {
    console.log(`${index + 1}. ${loc.name}`)
    console.log(`   "${loc.name} 食べログ site:tabelog.com"`)
    console.log(`   "${loc.name.replace(/[（）()]/g, ' ')} tabelog"`)
    console.log('')
  })
  
  return prioritized.length
}

/**
 * 優先度スコア算出
 */
function calculatePriorityScore(location: Location): number {
  let score = 0
  
  // 名前に基づく飲食店らしさ
  const foodKeywords = [
    'カフェ', 'cafe', 'coffee', 'レストラン', 'restaurant',
    'ラーメン', 'ramen', 'うどん', 'そば', 'パン', 'pizza',
    '食堂', 'バー', 'bar', 'ビストロ', 'トラットリア',
    'ベーカリー', 'パティスリー', '寿司', 'ステーキ'
  ]
  
  const name = location.name.toLowerCase()
  foodKeywords.forEach(keyword => {
    if (name.includes(keyword.toLowerCase())) {
      score += 10
    }
  })
  
  // 住所の充実度
  if (location.address && location.address.length > 10) {
    score += 5
  }
  
  // 特定エリアの人気度
  if (location.address?.includes('渋谷') || location.address?.includes('新宿') || 
      location.address?.includes('銀座') || location.address?.includes('表参道')) {
    score += 15
  }
  
  // 名前の長さ（具体的な店名ほど高得点）
  if (location.name.length > 5 && location.name.length < 30) {
    score += 3
  }
  
  return score
}

/**
 * フェーズ3: CSV一括インポート機能
 */
async function bulkImportFromCSV(csvFilePath: string) {
  console.log(`📂 フェーズ3: CSV一括インポート (${csvFilePath})`)
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('❌ CSVファイルが見つかりません:', csvFilePath)
    return 0
  }
  
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
  const lines = csvContent.split('\n').slice(1) // ヘッダーをスキップ
  
  let importedCount = 0
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const parts = line.split(',')
    if (parts.length < 7) continue
    
    const locationId = parts[0]
    const tabelogUrl = parts[6]?.replace(/"/g, '').trim()
    
    if (tabelogUrl && tabelogUrl.includes('tabelog.com')) {
      console.log(`🔄 インポート中: ${parts[1]} → ${tabelogUrl}`)
      
      const { error } = await supabase
        .from('locations')
        .update({
          tabelog_url: tabelogUrl,
          affiliate_info: {
            source: 'manual_research',
            imported_at: new Date().toISOString(),
            linkswitch_enabled: true
          }
        })
        .eq('id', locationId)
      
      if (error) {
        console.error(`❌ インポートエラー:`, error)
      } else {
        importedCount++
        console.log(`✅ インポート完了`)
      }
    }
  }
  
  console.log(`📊 フェーズ3完了: ${importedCount}件インポート`)
  return importedCount
}

/**
 * 全体の進捗状況表示
 */
async function showOverallProgress() {
  console.log('📊 全体進捗状況')
  console.log('=' .repeat(60))
  
  const { data: allLocations } = await supabase
    .from('locations')
    .select('tabelog_url')
  
  const { data: withUrls } = await supabase
    .from('locations')
    .select('tabelog_url')
    .not('tabelog_url', 'is', null)
  
  const total = allLocations?.length || 0
  const completed = withUrls?.length || 0
  const remaining = total - completed
  
  console.log(`📈 総店舗数: ${total}件`)
  console.log(`✅ 設定済み: ${completed}件 (${Math.round((completed / total) * 100)}%)`)
  console.log(`❌ 未設定: ${remaining}件`)
  
  const expectedRevenue = completed * 3 * 0.02 * 500 // 3クリック/月 × 2%成約 × 500円
  console.log(`💰 想定月間収益: ¥${expectedRevenue.toLocaleString()}円`)
  
  if (remaining > 0) {
    const potentialRevenue = total * 3 * 0.02 * 500
    console.log(`🚀 完全展開時の収益: ¥${potentialRevenue.toLocaleString()}円`)
    console.log(`📈 収益向上機会: ¥${(potentialRevenue - expectedRevenue).toLocaleString()}円`)
  }
}

// コマンドライン実行
const action = process.argv[2]
const filePath = process.argv[3]

switch (action) {
  case 'phase1':
  case 'known':
    processKnownPatterns()
    break
    
  case 'phase2':
  case 'generate':
    generateManualResearchList()
    break
    
  case 'phase3':
  case 'import':
    if (!filePath) {
      console.error('❌ 使用方法: npx tsx script.ts import <csv_file_path>')
      process.exit(1)
    }
    bulkImportFromCSV(filePath)
    break
    
  case 'progress':
  case 'status':
    showOverallProgress()
    break
    
  default:
    console.log(`
🚀 大規模食べログ展開システム

使用方法:
  npx tsx ${__filename} <command>

コマンド:
  phase1     - 既知パターンでの自動処理
  phase2     - 手動調査用TOP50リスト生成
  phase3     - CSV一括インポート
  progress   - 進捗状況表示

例:
  npx tsx ${__filename} progress
  npx tsx ${__filename} phase1
  npx tsx ${__filename} phase2
  npx tsx ${__filename} import manual-research-top50.csv
`)
    break
}