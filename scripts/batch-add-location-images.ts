#!/usr/bin/env node

/**
 * ロケーション画像一括追加スクリプト
 * Priority 1〜3の全ロケーションに高品質画像を自動で追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込み（本番環境優先）
dotenv.config({ path: '.env.production' })
dotenv.config() // フォールバック用

// Supabaseクライアント設定（本番環境）
const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

// Staging環境（開発用）  
const STAGING_SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co'
const STAGING_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

// 環境選択
const USE_PRODUCTION = true // 本番環境を使用する場合はtrue
const supabaseUrl = USE_PRODUCTION ? PROD_SUPABASE_URL : STAGING_SUPABASE_URL
const supabaseAnonKey = USE_PRODUCTION ? PROD_ANON_KEY : STAGING_ANON_KEY

console.log(`🌍 Using ${USE_PRODUCTION ? 'PRODUCTION' : 'STAGING'} environment`)
console.log(`📍 URL: ${supabaseUrl}`)

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 全優先度の画像データ
const allLocationImages = [
  // Priority 1: アフィリエイト対象レストラン・カフェ
  {
    priority: 1,
    name: 'ポール・ボキューズ 西新宿店',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80'
    ],
    description: 'ミシュラン三つ星シェフ、ポール・ボキューズの名を冠した高級フレンチレストラン'
  },
  {
    priority: 1,
    name: 'USHIHACHI 渋谷店',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷の人気焼肉店、高品質な和牛を提供'
  },
  {
    priority: 1,
    name: 'NEM COFFEE & ESPRESSO',
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80'
    ],
    description: 'スペシャルティコーヒーとエスプレッソが自慢のカフェ'
  },
  {
    priority: 1,
    name: 'Blue Seal アメリカンビレッジ店',
    images: [
      'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=250&fit=crop&q=80'
    ],
    description: '沖縄発祥の人気アイスクリームチェーン、アメリカンビレッジの店舗'
  },
  {
    priority: 1,
    name: '浅草今半',
    searchPatterns: ['今半', '浅草今半', '国際通り本店'],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80'
    ],
    description: '創業明治28年の老舗すき焼き店、最高級の和牛を提供'
  },
  
  // Priority 2: 複数エピソードで登場する人気スポット
  {
    priority: 2,
    name: 'すみだ水族館',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520637836862-4d197d17c92a?w=400&h=250&fit=crop&q=80'
    ],
    description: '東京スカイツリータウンにある人気の水族館。ペンギンやクラゲなど多彩な海の生き物を展示'
  },
  {
    priority: 2,
    name: '東京ドーム',
    images: [
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563395261-dd8e651e7fde?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=250&fit=crop&q=80'
    ],
    description: '日本初の屋根付き球場として親しまれる東京ドーム。野球観戦やコンサートなど多目的に利用'
  },
  {
    priority: 2,
    name: '銀座三越',
    searchPatterns: ['銀座三越', '三越', '銀座 三越'],
    images: [
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座を代表する老舗百貨店。最高級のファッション、グルメ、ライフスタイル商品が揃う'
  },
  {
    priority: 2,
    name: '渋谷スクランブル交差点',
    searchPatterns: ['スクランブル交差点', '渋谷 交差点', '渋谷交差点'],
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80'
    ],
    description: '世界で最も有名な交差点の一つ。1日約50万人が行き交う東京の象徴的なスポット'
  },
  {
    priority: 2,
    name: '東京タワー',
    images: [
      'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'
    ],
    description: '1958年開業の東京のシンボル。高さ333mの電波塔で、展望台からは東京の絶景を望める'
  },
  {
    priority: 2,
    name: '浅草寺',
    searchPatterns: ['浅草寺', '浅草 寺', '雷門'],
    images: [
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80'
    ],
    description: '東京最古の寺院として1400年の歴史を持つ。雷門と仲見世通りで知られる東京の代表的観光地'
  },
  {
    priority: 2,
    name: '新宿御苑',
    searchPatterns: ['新宿御苑', '新宿 御苑'],
    images: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80'
    ],
    description: '新宿の中心にある58.3haの広大な国民公園。四季折々の美しい自然と日本庭園が楽しめる'
  },
  {
    priority: 2,
    name: '上野動物園',
    searchPatterns: ['上野動物園', '上野 動物園'],
    images: [
      'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574146681337-f0b6709f0b58?w=400&h=250&fit=crop&q=80'
    ],
    description: '1882年開園の日本最古の動物園。ジャイアントパンダをはじめ約400種3000点の動物を飼育'
  },
  
  // Priority 3: ファンによく知られた聖地
  {
    priority: 3,
    name: '竹下通り',
    searchPatterns: ['竹下通り', '竹下', '原宿 竹下'],
    images: [
      'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80'
    ],
    description: '原宿のポップカルチャーの聖地。若者文化の発信地として多くのタレントが訪れる人気スポット'
  },
  {
    priority: 3,
    name: '江ノ島',
    searchPatterns: ['江ノ島', '江の島', 'えのしま'],
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'
    ],
    description: '神奈川県の人気観光地。美しい海岸と島の風景で多くのロケ地として使用される'
  },
  {
    priority: 3,
    name: '代々木公園',
    searchPatterns: ['代々木公園', '代々木 公園'],
    images: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80'
    ],
    description: '東京都渋谷区の大型公園。イベントやピクニックの定番スポットとして親しまれる'
  }
]

// 統計情報を保持
const stats = {
  processed: 0,
  updated: 0,
  notFound: 0,
  errors: 0
}

// ロケーション画像を更新
async function updateLocationImages(locationData: any) {
  try {
    // 検索パターンの設定
    const searchPatterns = locationData.searchPatterns || [locationData.name]
    
    let location = null
    
    // 各検索パターンで順番に検索
    for (const searchName of searchPatterns) {
      const { data: locations, error: searchError } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${searchName}%`)
        .limit(5)
      
      if (searchError) {
        console.error(`❌ Error searching for ${searchName}:`, searchError.message)
        continue
      }
      
      if (locations && locations.length > 0) {
        // より適切なマッチを選択
        location = locations.find(loc => 
          loc.name.includes(locationData.name) || 
          locationData.name.includes(loc.name) ||
          searchPatterns.some(pattern => loc.name.includes(pattern))
        ) || locations[0]
        
        console.log(`  📍 Found: ${location.name} (ID: ${location.id.substring(0, 8)}...)`)
        break
      }
    }
    
    if (!location) {
      console.log(`  ⚠️  Not found: ${locationData.name}`)
      stats.notFound++
      return false
    }
    
    // 画像URLs、説明を更新
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        image_urls: locationData.images,
        description: locationData.description
      })
      .eq('id', location.id)
    
    if (updateError) {
      console.error(`  ❌ Update error for ${location.name}:`, updateError.message)
      stats.errors++
      return false
    }
    
    console.log(`  ✅ Updated with ${locationData.images.length} images`)
    stats.updated++
    return true
    
  } catch (error: any) {
    console.error(`  ❌ Unexpected error for ${locationData.name}:`, error.message)
    stats.errors++
    return false
  }
}

// バッチ処理で優先度ごとに実行
async function processPriority(priority: number) {
  const priorityLocations = allLocationImages.filter(loc => loc.priority === priority)
  
  console.log(`\n🎯 Priority ${priority}: ${priorityLocations.length} locations`)
  console.log('━'.repeat(50))
  
  for (const locationData of priorityLocations) {
    stats.processed++
    console.log(`\n[${stats.processed}/${allLocationImages.length}] ${locationData.name}`)
    await updateLocationImages(locationData)
    
    // レート制限対策（100ms待機）
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

// メイン実行
async function main() {
  console.log('🚀 Batch Location Image Update Script')
  console.log('=====================================')
  console.log(`Total locations to process: ${allLocationImages.length}`)
  
  // データベース接続テスト
  console.log('\n🔌 Testing database connection...')
  try {
    const { count, error } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`✅ Connected successfully. Total locations in DB: ${count}`)
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    console.error('\nTroubleshooting:')
    console.error('1. Check your internet connection')
    console.error('2. Verify .env file has correct VITE_SUPABASE_ANON_KEY')
    console.error('3. Try switching USE_PRODUCTION flag in the script')
    process.exit(1)
  }
  
  // 優先度順に処理
  for (let priority = 1; priority <= 3; priority++) {
    await processPriority(priority)
  }
  
  // 結果サマリー
  console.log('\n' + '='.repeat(50))
  console.log('📊 Final Statistics')
  console.log('='.repeat(50))
  console.log(`✅ Successfully updated: ${stats.updated}`)
  console.log(`⚠️  Not found: ${stats.notFound}`)
  console.log(`❌ Errors: ${stats.errors}`)
  console.log(`📝 Total processed: ${stats.processed}`)
  console.log(`✔️  Success rate: ${((stats.updated / stats.processed) * 100).toFixed(1)}%`)
  
  // 確認クエリ
  console.log('\n🔍 Verifying updates...')
  const { data: updatedLocations } = await supabase
    .from('locations')
    .select('name, image_urls')
    .not('image_urls', 'is', null)
    .limit(10)
  
  if (updatedLocations && updatedLocations.length > 0) {
    console.log(`\nSample updated locations (${updatedLocations.length}):`)
    updatedLocations.forEach(loc => {
      const imageCount = loc.image_urls?.length || 0
      console.log(`  • ${loc.name}: ${imageCount} images`)
    })
  }
  
  console.log('\n✨ Batch update completed!')
}

// エラーハンドリング付きで実行
main().catch(error => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})