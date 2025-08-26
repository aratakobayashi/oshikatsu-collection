#!/usr/bin/env npx tsx

/**
 * 食べログURL一括追加スクリプト（バッチ2）
 * TOP50リストから次の20店舗を追加
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

// バッチ2追加用の店舗データ（優先度の高い残り店舗）
const BATCH_2_STORES = [
  // 人気カフェ・レストラン系
  {
    id: 'ff64c19e-e7d9-440a-88f7-0c97c358a8fb',
    name: '400℃ Pizza Tokyo 神楽坂店',
    url: 'https://tabelog.com/tokyo/A1309/A130905/13245238/'
  },
  {
    id: 'c214c0a2-00cd-48f9-9172-bf7b9e46580f',
    name: '400°C 神楽坂',
    url: 'https://tabelog.com/tokyo/A1309/A130905/13074113/'
  },
  {
    id: 'c57e0996-e886-49b2-9298-01560c508c77',
    name: 'ポール・ボキューズ 西新宿店',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13009467/'
  },
  // Paul Bassett別店舗
  {
    id: '66f6832a-769e-443f-80dd-c67f165e8e27',
    name: 'Paul Bassett 新宿店',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13189567/'
  },
  // わんこそば専門店（渋谷で候補）
  {
    id: '44d8966c-c17c-4083-83fd-4df513c3d449',
    name: 'わんこそば専門店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13180234/'
  },
  // ゲーム・エンタメ系で飲食があるもの
  {
    id: '42a7c553-0e84-4bb6-8f00-4bc619e33282',
    name: 'アドアーズ渋谷店',
    url: null // ゲームセンターのため食べログ対象外
  },
  {
    id: '0d06e133-eea2-4910-b9a9-8754b0c9a97e',
    name: 'ギンザシックス',
    url: 'https://tabelog.com/tokyo/A1301/A130101/13206640/' // レストランフロアあり
  },
  {
    id: '3ce0da78-2c68-4a5d-9a4c-40bafb0f0a19',
    name: 'くらやみ遊園地 新宿南口ゲームワールド店',
    url: null // ゲーム施設のため食べログ対象外
  },
  // ブランド・ショップ系（カフェ併設の可能性）
  {
    id: 'd24e07d8-5095-491e-a53e-b0e5c578d365',
    name: 'スタージュエリー銀座店',
    url: null // ジュエリーショップのため食べログ対象外
  },
  {
    id: '7d7873c7-3727-4142-869a-526c4e34560f',
    name: 'ティファニー銀座本店',
    url: 'https://tabelog.com/tokyo/A1301/A130101/13004993/' // ティファニーカフェがある
  },
  // 重複店舗（スキップ）
  {
    id: '88881729-e9ff-4fe4-a40c-6ee87f5b3618',
    name: 'フレッシュネスバーガー 渋谷センター街店',
    url: null // 重複のためスキップ
  },
  {
    id: 'b87e1262-58b3-4cd1-ae94-6860d2051f8e',
    name: 'フレッシュネスバーガー 渋谷センター街店',
    url: null // 重複のためスキップ
  },
  {
    id: '06d638bf-bcbd-47d9-bd29-88cafa76cbc1',
    name: 'フレッシュネスバーガー 渋谷センター街店',
    url: null // 重複のためスキップ
  },
  {
    id: 'f58e2f4b-1549-49c1-aa29-6fc5b8646a10',
    name: 'ヒルトン東京 マーブルラウンジ',
    url: null // 重複のためスキップ
  },
  {
    id: '1484c927-06ed-4e01-b8df-017445716f4b',
    name: 'ヒルトン東京マーブルラウンジ（西新宿）',
    url: null // 重複のためスキップ
  },
  // 非飲食系（スキップ）
  {
    id: '456ea422-8f89-4d9e-91f1-c78059e5ab1e',
    name: 'Club Pilates 恵比寿ガーデンプレイス店',
    url: null // フィットネスのため食べログ対象外
  },
  {
    id: '8d8fc6b9-f030-40d1-9ba2-aa68ae2f3a8d',
    name: 'Dr.HEAD 新宿店',
    url: null // マッサージ店のため食べログ対象外
  },
  {
    id: '15cf8dee-5aa1-4fad-8322-4810d1dcbc06',
    name: 'Dr.HEAD 新宿本店',
    url: null // マッサージ店のため食べログ対象外
  },
  {
    id: '5d8315f8-5312-4add-a786-88cdd5ef463e',
    name: 'JUNKY SPECIAL（歌舞伎町）',
    url: null // 詳細不明、要調査
  },
  {
    id: '4597d0e6-9e75-46c0-9ef1-88724fba6233',
    name: 'Mystery Circus',
    url: null // エンタメ施設のため食べログ対象外
  }
]

async function batchAdd2TabelogUrls() {
  console.log('🚀 食べログURL一括追加（バッチ2）を開始')
  console.log('=' .repeat(60))
  
  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const store of BATCH_2_STORES) {
    if (!store.url) {
      console.log(`⏭️ スキップ: ${store.name} (URLなし)`)
      skippedCount++
      continue
    }
    
    console.log(`\n🔄 処理中: ${store.name}`)
    console.log(`   URL: ${store.url}`)
    
    // 既存チェック
    const { data: existing } = await supabase
      .from('locations')
      .select('tabelog_url')
      .eq('id', store.id)
      .single()
    
    if (existing?.tabelog_url) {
      console.log(`   ⚠️ 既に設定済み`)
      skippedCount++
      continue
    }
    
    // 更新
    const { error } = await supabase
      .from('locations')
      .update({
        tabelog_url: store.url,
        affiliate_info: {
          source: 'batch_add_2',
          linkswitch_enabled: true,
          added_at: new Date().toISOString()
        }
      })
      .eq('id', store.id)
    
    if (error) {
      console.error(`   ❌ エラー:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ 追加成功`)
      addedCount++
    }
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('📊 バッチ2追加結果')
  console.log(`✅ 追加成功: ${addedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`合計処理: ${BATCH_2_STORES.length}件`)
}

// 実行
batchAdd2TabelogUrls()