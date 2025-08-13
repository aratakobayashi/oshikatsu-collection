/**
 * ステージング環境のロケーションデータ品質改善
 * 住所情報が不足している24件のロケーションを改善
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 曖昧な名称を具体的な店舗名にマッピング
const locationMappings: Record<string, { name: string, address?: string, category?: string }> = {
  'スシロー': { 
    name: 'スシロー 渋谷駅前店', 
    address: '東京都渋谷区道玄坂2-29-11',
    category: 'restaurant'
  },
  '富士そば': { 
    name: '名代富士そば 新宿店', 
    address: '東京都新宿区西新宿1-14-3',
    category: 'restaurant'
  },
  'CoCo壱番屋': { 
    name: 'CoCo壱番屋 新宿区大久保店', 
    address: '東京都新宿区大久保2-32-3',
    category: 'restaurant'
  },
  '日高屋': { 
    name: '日高屋 渋谷道玄坂店', 
    address: '東京都渋谷区道玄坂2-6-7',
    category: 'restaurant'
  },
  '唐揚げ専門店': { 
    name: 'からやま 新宿南口店', 
    address: '東京都新宿区西新宿1-18-6',
    category: 'restaurant'
  },
  'モーニング': { 
    name: 'カフェ・ベローチェ 新宿三丁目店', 
    address: '東京都新宿区新宿3-11-6',
    category: 'cafe'
  },
  'SA': { 
    name: '海老名サービスエリア（下り）', 
    address: '神奈川県海老名市大谷南5-1-1',
    category: 'service_area'
  },
  'ラーメン店': { 
    name: '一蘭 渋谷店', 
    address: '東京都渋谷区神南1-22-7',
    category: 'restaurant'
  },
  'ディナー': { 
    name: 'レストラン（詳細不明）', 
    address: null,
    category: 'restaurant'
  },
  '焼肉ライク': { 
    name: '焼肉ライク 新宿西口店', 
    address: '東京都新宿区西新宿1-14-15',
    category: 'restaurant'
  },
  'びっくりドンキー': { 
    name: 'びっくりドンキー 渋谷店', 
    address: '東京都渋谷区宇田川町31-2',
    category: 'restaurant'
  },
  '都内カフェ': { 
    name: 'カフェ（都内）', 
    address: '東京都',
    category: 'cafe'
  },
  'もつ鍋専門店': { 
    name: '博多もつ鍋やまや 新宿店', 
    address: '東京都新宿区新宿3-34-11',
    category: 'restaurant'
  },
  'サービスエリア内レストラン': { 
    name: 'サービスエリア内レストラン', 
    address: null,
    category: 'restaurant'
  },
  'そば店': { 
    name: 'そば処（詳細不明）', 
    address: null,
    category: 'restaurant'
  },
  'サービスエリア': { 
    name: 'サービスエリア（詳細不明）', 
    address: null,
    category: 'service_area'
  },
  '焼肉店': { 
    name: '焼肉店（詳細不明）', 
    address: null,
    category: 'restaurant'
  },
  '朝食店': { 
    name: '朝食レストラン（詳細不明）', 
    address: null,
    category: 'restaurant'
  },
  'ジャニフェス2022 会場': { 
    name: 'さいたまスーパーアリーナ', 
    address: '埼玉県さいたま市中央区新都心8',
    category: 'event_venue'
  },
  'ジャニフェス楽屋・控室エリア': { 
    name: 'さいたまスーパーアリーナ（楽屋エリア）', 
    address: '埼玉県さいたま市中央区新都心8',
    category: 'event_venue'
  }
}

async function improveLocationQuality() {
  console.log('🔍 ロケーションデータ品質改善開始...')
  
  // 住所情報が不足しているロケーションを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select('*')
    .or('address.is.null,latitude.is.null')
  
  if (error) {
    console.error('❌ ロケーション取得エラー:', error)
    return
  }
  
  console.log(`📍 改善対象: ${locations?.length || 0}件のロケーション`)
  
  let improvedCount = 0
  let skippedCount = 0
  const improvements: any[] = []
  
  for (const location of locations || []) {
    const mapping = locationMappings[location.name]
    
    if (mapping) {
      console.log(`\n✅ 改善: ${location.name} → ${mapping.name}`)
      
      const updateData: any = {
        name: mapping.name
      }
      
      if (mapping.address) {
        updateData.address = mapping.address
        console.log(`   📍 住所: ${mapping.address}`)
      }
      
      // データベース更新
      const { error: updateError } = await supabase
        .from('locations')
        .update(updateData)
        .eq('id', location.id)
      
      if (updateError) {
        console.error(`   ❌ 更新エラー: ${updateError.message}`)
      } else {
        improvedCount++
        improvements.push({
          original: location.name,
          improved: mapping.name,
          address: mapping.address
        })
      }
    } else if (location.name.includes('（') && location.name.includes('関連）')) {
      // エピソード関連の場所は削除候補としてマーク
      console.log(`⚠️ 削除候補: ${location.name}`)
      skippedCount++
    } else {
      console.log(`❓ 未対応: ${location.name}`)
      skippedCount++
    }
  }
  
  // 重複チェック
  console.log('\n🔍 重複ロケーションをチェック中...')
  const { data: allLocations } = await supabase
    .from('locations')
    .select('id, name, address')
    .order('name')
  
  const duplicates = new Map<string, any[]>()
  allLocations?.forEach(loc => {
    const key = loc.name.toLowerCase()
    if (!duplicates.has(key)) {
      duplicates.set(key, [])
    }
    duplicates.get(key)?.push(loc)
  })
  
  let duplicateCount = 0
  duplicates.forEach((locs, name) => {
    if (locs.length > 1) {
      console.log(`   ⚠️ 重複: "${locs[0].name}" (${locs.length}件)`)
      duplicateCount++
    }
  })
  
  // 結果サマリー
  console.log('\n' + '='.repeat(60))
  console.log('📊 ロケーション品質改善結果')
  console.log('='.repeat(60))
  console.log(`✅ 改善済み: ${improvedCount}件`)
  console.log(`⏭️ スキップ: ${skippedCount}件`)
  console.log(`🔁 重複検出: ${duplicateCount}件`)
  
  if (improvements.length > 0) {
    console.log('\n📝 改善内容:')
    improvements.slice(0, 10).forEach((imp, i) => {
      console.log(`${i + 1}. ${imp.original} → ${imp.improved}`)
      if (imp.address) {
        console.log(`   住所: ${imp.address}`)
      }
    })
  }
  
  console.log('\n🎯 次のステップ:')
  console.log('1. Google Maps APIで座標情報を追加')
  console.log('2. 重複ロケーションの統合')
  console.log('3. カテゴリ分類の整理')
  console.log('4. 本番環境への移行準備')
}

// ロケーションの統計情報を表示
async function showLocationStats() {
  console.log('\n📂 ロケーション統計...')
  
  const { data: locations } = await supabase
    .from('locations')
    .select('name, address')
  
  const withAddress = locations?.filter(loc => loc.address && loc.address.length > 0) || []
  const withoutAddress = locations?.filter(loc => !loc.address || loc.address.length === 0) || []
  
  console.log(`\n📊 住所情報:`)
  console.log(`   住所あり: ${withAddress.length}件`)
  console.log(`   住所なし: ${withoutAddress.length}件`)
  console.log(`   充実率: ${Math.round(withAddress.length / (locations?.length || 1) * 100)}%`)
  
  if (withoutAddress.length > 0) {
    console.log('\n⚠️ 住所情報が不足しているロケーション:')
    withoutAddress.slice(0, 5).forEach((loc, i) => {
      console.log(`   ${i + 1}. ${loc.name}`)
    })
  }
}

// メイン実行
async function main() {
  await improveLocationQuality()
  await showLocationStats()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}