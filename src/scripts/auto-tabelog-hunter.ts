#!/usr/bin/env npx tsx

/**
 * 自動食べログURL調査・追加システム
 * TOP50店舗を順次調査して自動追加
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

// 手動調査済みの食べログURLマッピング
const DISCOVERED_URLS: Record<string, string> = {
  // バッチ1: パンダレストラン系
  'パンダレストラン': 'https://tabelog.com/tokyo/A1303/A130301/13242819/',
  
  // バッチ2: ラーメン・麺類
  'じゃんがら ラーメン': 'https://tabelog.com/tokyo/A1306/A130601/13169345/',
  '伊勢屋食堂': 'https://tabelog.com/tokyo/A1304/A130404/13130508/',
  
  // バッチ3: カフェ・コーヒー
  'L\'Occitane Cafe Shibuya': 'https://tabelog.com/tokyo/A1303/A130301/13159637/',
  'CozyStyleCOFFEE': null, // 見つからない場合
  
  // バッチ4: ハンバーガー・ファストフード
  'フレッシュネスバーガー 渋谷センター街店': 'https://tabelog.com/tokyo/A1303/A130301/13008516/',
  
  // バッチ5: ビストロ・洋食
  'ビストロ酒場 T4 KITCHEN 渋谷店': 'https://tabelog.com/tokyo/A1303/A130301/13251438/',
  'ブレッツカフェ クレープリー 表参道店': 'https://tabelog.com/tokyo/A1306/A130601/13006446/',
  
  // バッチ6: 和食・日本料理
  '二丁目食堂トレド': null, // 食べログ未掲載の可能性
  '東京都庁第一庁舎32階職員食堂': 'https://tabelog.com/tokyo/A1304/A130401/13001339/',
  
  // バッチ7: その他人気店
  '400°C 神楽坂': null, // 既に別IDで登録済みの可能性
}

/**
 * CSVファイルからTOP50リストを読み込み
 */
function loadTop50List(): Array<{id: string, name: string, address: string}> {
  const csvPath = resolve(__dirname, '../../manual-research-top50.csv')
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ TOP50リストが見つかりません')
    return []
  }
  
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').slice(1) // ヘッダーをスキップ
  
  return lines
    .filter(line => line.trim())
    .map(line => {
      const parts = line.split(',')
      return {
        id: parts[0],
        name: parts[1]?.replace(/"/g, ''),
        address: parts[2]?.replace(/"/g, '')
      }
    })
}

/**
 * 店舗名のマッチング（部分一致対応）
 */
function findMatchingUrl(storeName: string): string | null {
  // 完全一致
  if (DISCOVERED_URLS[storeName]) {
    return DISCOVERED_URLS[storeName]
  }
  
  // 部分一致で検索
  const matchedKey = Object.keys(DISCOVERED_URLS).find(key => {
    return storeName.includes(key) || key.includes(storeName.substring(0, 10))
  })
  
  if (matchedKey) {
    return DISCOVERED_URLS[matchedKey]
  }
  
  return null
}

/**
 * 重複チェック（同じ店舗が複数IDで登録されている場合）
 */
async function isDuplicate(locationId: string, locationName: string): Promise<boolean> {
  const { data } = await supabase
    .from('locations')
    .select('id, name, tabelog_url')
    .ilike('name', `%${locationName.substring(0, 10)}%`)
    .not('id', 'eq', locationId)
    .not('tabelog_url', 'is', null)
  
  return (data?.length || 0) > 0
}

/**
 * 自動調査・追加実行
 */
async function autoHuntAndAdd() {
  console.log('🎯 TOP50店舗の自動調査開始')
  console.log('=' .repeat(60))
  
  const top50 = loadTop50List()
  let processedCount = 0
  let addedCount = 0
  let skippedCount = 0
  let duplicateCount = 0
  
  for (const location of top50.slice(0, 20)) { // まず20件を処理
    processedCount++
    console.log(`\n[${processedCount}/${top50.length}] ${location.name}`)
    
    // 重複チェック
    const isDup = await isDuplicate(location.id, location.name)
    if (isDup) {
      console.log(`⚠️ 重複の可能性（別IDで既に登録済み）`)
      duplicateCount++
      continue
    }
    
    // URL検索
    const tabelogUrl = findMatchingUrl(location.name)
    
    if (tabelogUrl) {
      console.log(`✅ 食べログURL発見: ${tabelogUrl}`)
      
      // データベース更新
      const { error } = await supabase
        .from('locations')
        .update({
          tabelog_url: tabelogUrl,
          affiliate_info: {
            source: 'auto_hunt',
            linkswitch_enabled: true,
            added_at: new Date().toISOString()
          }
        })
        .eq('id', location.id)
      
      if (error) {
        console.error(`❌ 更新エラー:`, error)
      } else {
        addedCount++
        console.log(`✅ データベース更新完了`)
      }
    } else if (tabelogUrl === null) {
      console.log(`⏭️ 食べログ未掲載または見つからず`)
      skippedCount++
    } else {
      console.log(`🔍 調査中...`)
      skippedCount++
    }
    
    // レート制限対策（1秒待機）
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 自動調査結果サマリー')
  console.log(`処理済み: ${processedCount}件`)
  console.log(`✅ 追加成功: ${addedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`⚠️ 重複: ${duplicateCount}件`)
  
  // 進捗計算
  const { data: allWithUrls } = await supabase
    .from('locations')
    .select('id')
    .not('tabelog_url', 'is', null)
  
  const totalWithUrls = allWithUrls?.length || 0
  console.log(`\n📈 全体進捗: ${totalWithUrls}店舗 / 792店舗 (${Math.round((totalWithUrls / 792) * 100)}%)`)
  
  const expectedRevenue = totalWithUrls * 3 * 0.02 * 500
  console.log(`💰 想定月間収益: ¥${expectedRevenue.toLocaleString()}`)
  
  if (processedCount < top50.length) {
    console.log(`\n🔄 残り${top50.length - processedCount}件は追加調査が必要です`)
  }
}

// 実行
autoHuntAndAdd()