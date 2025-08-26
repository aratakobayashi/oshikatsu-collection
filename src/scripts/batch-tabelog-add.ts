#!/usr/bin/env npx tsx

/**
 * 食べログURL一括追加スクリプト
 * 調査済みURLを一括でデータベースに追加
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

// バッチ追加用の店舗データ
const BATCH_STORES = [
  // 飲食店系
  {
    id: '9dba22c4-45a4-4c46-b6e5-e7728a8b3117',
    name: '伊勢屋食堂',
    url: 'https://tabelog.com/tokyo/A1304/A130404/13130508/'
  },
  {
    id: '19fdc05d-d9f1-43c7-96c4-1717811dc86d',
    name: '筋肉食堂',
    url: 'https://tabelog.com/tokyo/A1301/A130103/13169876/'
  },
  {
    id: '357c14e6-f3da-43a1-b1d3-37a44b723753',
    name: 'Burger King 新宿東口店',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13139124/'
  },
  {
    id: '85823106-2a8a-4951-a97f-d630ad5220c4',
    name: 'Hohokam DINER',
    url: 'https://tabelog.com/tokyo/A1306/A130601/13217633/'
  },
  {
    id: '26a449d5-baae-4d53-b4cc-bd9989d8940a',
    name: 'Pablo 表参道店',
    url: 'https://tabelog.com/tokyo/A1306/A130601/13155764/'
  },
  {
    id: '3cd3559e-f94d-4a35-9271-5c326576807a',
    name: 'Paul Bassett 新宿',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13181649/'
  },
  {
    id: '48e1b64d-2677-4e27-ae1c-69da5313baa0',
    name: 'キッチン南国',
    url: 'https://tabelog.com/tokyo/A1305/A130504/13000178/'
  },
  {
    id: '9013ed0c-888e-46ea-b055-c28b296fe85c',
    name: 'ゴールドラッシュ渋谷本店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13001609/'
  },
  {
    id: 'db16e322-193b-460e-96a3-06cdd2c34159',
    name: 'すき家 渋谷道玄坂店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13181090/'
  },
  {
    id: '6ae0f3d4-c6cc-461e-afbb-1d069d1efae1',
    name: 'スパイシー カレー 魯珈',
    url: 'https://tabelog.com/tokyo/A1309/A130905/13171634/'
  },
  {
    id: '7b433da8-0c9b-4909-8488-3923964a4d75',
    name: 'スパイシーカレー魯珈 大久保',
    url: 'https://tabelog.com/tokyo/A1304/A130404/13241444/'
  },
  {
    id: 'dbce75d8-b07d-4035-ac97-681a33ed4349',
    name: 'ヒルトン東京 マーブルラウンジ',
    url: 'https://tabelog.com/tokyo/A1304/A130401/13002075/'
  },
  // 重複チェック用（既存店舗の別ID）
  {
    id: 'f58e2f4b-1549-49c1-aa29-6fc5b8646a10',
    name: 'ヒルトン東京 マーブルラウンジ（重複）',
    url: null // 重複なのでスキップ
  },
  {
    id: '1484c927-06ed-4e01-b8df-017445716f4b',
    name: 'ヒルトン東京マーブルラウンジ（重複）',
    url: null // 重複なのでスキップ
  },
  // カフェ・スイーツ系
  {
    id: '4454e9ab-1357-4cc2-b5ef-95c54652642c',
    name: 'スターバックス コーヒー 渋谷スカイ店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13233474/'
  },
  // さらに追加（計20店舗目標）
  {
    id: '855d480a-120e-4b3d-8dba-8ba1806b5b21',
    name: 'Wagaya no Shokudo',
    url: null // 見つからない場合
  },
  // フレッシュネスバーガー（複数あるので1つだけ）
  {
    id: '97b42b86-68ae-4bc6-8840-526bcf4cf525',
    name: 'フレッシュネスバーガー 渋谷センター街店',
    url: 'https://tabelog.com/tokyo/A1303/A130301/13060998/'
  },
  // ブレッツカフェ
  {
    id: '405597a3-4699-4780-a029-2491de140147',
    name: 'ブレッツカフェ クレープリー 表参道店',
    url: 'https://tabelog.com/tokyo/A1306/A130601/13006446/'
  },
  // 二丁目食堂
  {
    id: 'b7e3a6b0-d450-40f9-8921-6e937aeaf965',
    name: '二丁目食堂トレド',
    url: 'https://tabelog.com/tokyo/A1309/A130905/13190339/'
  },
  // じゃんがら（原宿本店）
  {
    id: '76c1a5d1-7220-4673-9cf5-a0b94168f861',
    name: 'じゃんがら ラーメン',
    url: 'https://tabelog.com/tokyo/A1306/A130601/13001244/'
  }
]

async function batchAddTabelogUrls() {
  console.log('🚀 食べログURL一括追加を開始')
  console.log('=' .repeat(60))
  
  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0
  
  for (const store of BATCH_STORES) {
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
          source: 'batch_add_20',
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
  console.log('📊 一括追加結果')
  console.log(`✅ 追加成功: ${addedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`合計処理: ${BATCH_STORES.length}件`)
}

// 実行
batchAddTabelogUrls()