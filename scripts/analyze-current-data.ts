/**
 * 現在のデータベース状況を分析するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface DataStats {
  table: string
  count: number
  sample?: any[]
}

async function analyzeTable(tableName: string, sampleSize: number = 3): Promise<DataStats> {
  try {
    // データ件数を取得
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      throw countError
    }

    // サンプルデータを取得
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(sampleSize)
    
    if (sampleError) {
      throw sampleError
    }

    return {
      table: tableName,
      count: count || 0,
      sample: sampleData || []
    }
  } catch (error) {
    console.warn(`⚠️ テーブル ${tableName} の分析でエラー:`, error)
    return {
      table: tableName,
      count: 0,
      sample: []
    }
  }
}

async function analyzeCurrentData() {
  console.log('🔍 現在のデータ状況を分析しています...\n')
  
  const tables = [
    'celebrities',
    'episodes', 
    'items',
    'locations',
    'users',
    'user_posts'
  ]

  const results: DataStats[] = []

  for (const table of tables) {
    console.log(`📊 ${table}テーブルを分析中...`)
    const stats = await analyzeTable(table)
    results.push(stats)
  }

  // 結果を整理して表示
  console.log('\n' + '='.repeat(60))
  console.log('📈 データベース分析結果')
  console.log('='.repeat(60))

  let totalRecords = 0
  results.forEach(stat => {
    console.log(`\n📋 ${stat.table.toUpperCase()}`)
    console.log(`   件数: ${stat.count.toLocaleString()}件`)
    totalRecords += stat.count

    if (stat.sample && stat.sample.length > 0) {
      console.log(`   サンプル:`)
      stat.sample.forEach((item, index) => {
        const keys = Object.keys(item).slice(0, 3) // 最初の3つのフィールドを表示
        const preview = keys.map(key => `${key}: ${item[key]}`).join(', ')
        console.log(`     ${index + 1}. ${preview}`)
      })
    } else {
      console.log(`   ⚠️ データが存在しません`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`🎯 総レコード数: ${totalRecords.toLocaleString()}件`)
  console.log('='.repeat(60))

  // データ品質と推奨事項を表示
  console.log('\n📝 分析結果と推奨事項:')
  
  const episodeCount = results.find(r => r.table === 'episodes')?.count || 0
  const locationCount = results.find(r => r.table === 'locations')?.count || 0
  const itemCount = results.find(r => r.table === 'items')?.count || 0

  if (episodeCount === 0) {
    console.log('🚨 【最優先】エピソードデータが不足 - YouTube API収集を開始')
  } else if (episodeCount < 50) {
    console.log(`⚠️ エピソードデータが少なめ (${episodeCount}件) - 収集拡大を推奨`)
  } else {
    console.log(`✅ エピソードデータは充実 (${episodeCount}件)`)
  }

  if (locationCount === 0) {
    console.log('🚨 【高優先】聖地巡礼用ロケーションデータが不足')
  } else if (locationCount < episodeCount * 0.3) {
    console.log(`⚠️ ロケーションデータが少なめ - エピソード対比で拡充推奨`)
  } else {
    console.log(`✅ ロケーションデータは適切`)
  }

  if (itemCount === 0) {
    console.log('🚨 【中優先】アイテムデータが不足')
  } else {
    console.log(`✅ アイテムデータあり (${itemCount}件)`)
  }

  console.log('\n🎯 ユーザー要望対応状況:')
  console.log('   1. よにのチャンネルの飲食店情報 → ロケーションデータで対応可能')
  console.log('   2. アイドル活動情報 → セレブリティ・エピソードデータで対応')
  console.log('   3. 聖地巡礼情報 → ロケーションデータの拡充が必要')
  console.log('   4. 着用アイテム情報 → アイテムデータの拡充が必要')
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeCurrentData().catch(console.error)
}