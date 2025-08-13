/**
 * 競合サイトから特定した未登録の朝ごはんロケーションを追加
 * 重要店舗11件を正確な住所付きで登録
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 追加する未登録ロケーション（競合サイトから特定）
const missingLocations = [
  {
    name: 'えんとつ屋 南青山店',
    slug: 'entotsuya-minamiaoyama',
    address: '東京都港区南青山3-8-2 サンブリッジ青山1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問した人気ラーメン店',
    type: 'restaurant',
    tags: ['朝ごはん', 'ラーメン', '南青山']
  },
  {
    name: 'スパイシー カレー 魯珈（ろか）',
    slug: 'spicy-curry-roka',
    address: '東京都新宿区神楽坂5-1-2 神楽坂TNヒルズ1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したカレー専門店',
    type: 'restaurant',
    tags: ['朝ごはん', 'カレー', '神楽坂']
  },
  {
    name: '餃子の王将 新橋駅前店',
    slug: 'ohsho-shinbashi',
    address: '東京都港区新橋2-16-1 ニュー新橋ビル1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問',
    type: 'restaurant',
    tags: ['朝ごはん', '中華', '新橋', '餃子']
  },
  {
    name: 'ヒルトン東京 マーブルラウンジ',
    slug: 'hilton-tokyo-marble-lounge',
    address: '東京都新宿区西新宿6-6-2 ヒルトン東京1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したホテルラウンジ',
    type: 'restaurant',
    tags: ['朝ごはん', 'ホテル', '西新宿', 'ビュッフェ']
  },
  {
    name: '400℃ Pizza Tokyo 神楽坂店',
    slug: '400-pizza-kagurazaka',
    address: '東京都新宿区神楽坂3-2-5 SHKビル1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したピザ店',
    type: 'restaurant',
    tags: ['朝ごはん', 'ピザ', '神楽坂', 'イタリアン']
  },
  {
    name: '挽肉と米 渋谷',
    slug: 'hikiniku-to-kome-shibuya',
    address: '東京都渋谷区渋谷3-6-19 第1矢木ビル1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したハンバーグ専門店',
    type: 'restaurant',
    tags: ['朝ごはん', 'ハンバーグ', '渋谷', '定食']
  },
  {
    name: '佐野みそ 亀戸本店',
    slug: 'sano-miso-kameido',
    address: '東京都江東区亀戸2-3-10',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問した味噌ラーメン専門店',
    type: 'restaurant',
    tags: ['朝ごはん', 'ラーメン', '亀戸', '味噌']
  },
  {
    name: 'Burger King 新宿東口店',
    slug: 'burger-king-shinjuku',
    address: '東京都新宿区新宿3-26-13 新宿中村屋ビル1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問',
    type: 'restaurant',
    tags: ['朝ごはん', 'ハンバーガー', '新宿', 'ファストフード']
  },
  {
    name: 'すき家 渋谷道玄坂店',
    slug: 'sukiya-shibuya-dogenzaka',
    address: '東京都渋谷区道玄坂2-25-10',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問した牛丼チェーン',
    type: 'restaurant',
    tags: ['朝ごはん', '牛丼', '渋谷', 'ファストフード']
  },
  {
    name: 'Donish Coffee Company 神楽坂',
    slug: 'donish-coffee-kagurazaka',
    address: '東京都新宿区神楽坂6-8 文悠ビル1F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したコーヒースタンド',
    type: 'cafe',
    tags: ['朝ごはん', 'カフェ', '神楽坂', 'コーヒー']
  },
  {
    name: 'Paul Bassett 新宿',
    slug: 'paul-bassett-shinjuku',
    address: '東京都新宿区西新宿1-1-3 小田急百貨店新宿店本館2F',
    description: 'よにのちゃんねる朝ごはんシリーズで訪問したカフェ',
    type: 'cafe',
    tags: ['朝ごはん', 'カフェ', '新宿', 'コーヒー']
  }
]

async function addMissingBreakfastLocations() {
  console.log('🍳 未登録の朝ごはんロケーション追加開始...\n')
  
  let successCount = 0
  let errorCount = 0
  const addedLocations: string[] = []
  
  for (const location of missingLocations) {
    try {
      // 既存チェック
      const { data: existing } = await supabase
        .from('locations')
        .select('id, name')
        .or(`name.eq.${location.name},slug.eq.${location.slug}`)
        .single()
      
      if (existing) {
        console.log(`⏭️ スキップ: ${location.name} (既存)`)
        continue
      }
      
      // 新規追加
      const { data, error } = await supabase
        .from('locations')
        .insert({
          name: location.name,
          slug: location.slug,
          address: location.address,
          description: location.description
          // typeとtagsカラムが存在しない場合はコメントアウト
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ エラー: ${location.name}`)
        console.error(`   ${error.message}`)
        errorCount++
      } else {
        console.log(`✅ 追加成功: ${location.name}`)
        console.log(`   📍 ${location.address}`)
        successCount++
        addedLocations.push(location.name)
      }
      
    } catch (err) {
      console.error(`❌ 予期しないエラー: ${location.name}`, err)
      errorCount++
    }
  }
  
  // 結果サマリー
  console.log('\n' + '='.repeat(60))
  console.log('📊 追加結果')
  console.log('='.repeat(60))
  console.log(`✅ 成功: ${successCount}件`)
  console.log(`❌ エラー: ${errorCount}件`)
  console.log(`📍 総ロケーション数の確認中...`)
  
  // 現在の総数を確認
  const { count } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 現在の総ロケーション数: ${count}件`)
  
  if (addedLocations.length > 0) {
    console.log('\n✨ 追加された店舗:')
    addedLocations.forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`)
    })
  }
  
  // 朝ごはんエピソードとの関連付け提案
  console.log('\n🔗 次のステップ:')
  console.log('1. 朝ごはんエピソードとこれらのロケーションを関連付け')
  console.log('2. カバー率の再検証（目標: 100%）')
  console.log('3. 本番環境への移行準備')
}

// メイン実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addMissingBreakfastLocations().catch(console.error)
}