import { createClient } from '@supabase/supabase-js'

// 直接Supabaseクライアントを作成
const supabase = createClient(
  'https://ounloyykptsqzdpbsnpn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'
)

// 優先度1: アフィリエイト対象レストラン・カフェの高品質実画像
const priorityLocationImages = [
  {
    name: 'ポール・ボキューズ 西新宿店',
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80', // エレガントなフレンチレストラン
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80', // 高級料理
    ],
    category: 'restaurant',
    description: 'ミシュラン三つ星シェフ、ポール・ボキューズの名を冠した高級フレンチレストラン'
  },
  {
    name: 'USHIHACHI 渋谷店',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80', // 焼肉・グリル
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80', // 牛肉ステーキ
    ],
    category: 'restaurant', 
    description: '渋谷の人気焼肉店、高品質な和牛を提供'
  },
  {
    name: 'NEM COFFEE & ESPRESSO',
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80', // スペシャルティコーヒー
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80', // エスプレッソ
    ],
    category: 'cafe',
    description: 'スペシャルティコーヒーとエスプレッソが自慢のカフェ'
  },
  {
    name: 'Blue Seal アメリカンビレッジ店',
    images: [
      'https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&h=250&fit=crop&q=80', // アイスクリーム店
      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400&h=250&fit=crop&q=80', // トロピカルアイス
    ],
    category: 'cafe',
    description: '沖縄発祥の人気アイスクリームチェーン、アメリカンビレッジの店舗'
  },
  {
    name: '浅草今半 国際通り本店',
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80', // すき焼き・和牛
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80', // 日本料理店内装
    ],
    category: 'restaurant',
    description: '創業明治28年の老舗すき焼き店、最高級の和牛を提供'
  }
]

async function addPriorityLocationImages() {
  console.log('🎨 Adding high-quality images to priority locations...')
  
  for (const locationData of priorityLocationImages) {
    try {
      // ロケーション名で検索
      const { data: locations, error: searchError } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${locationData.name}%`)
        .limit(1)
      
      if (searchError) {
        console.error(`❌ Error searching for ${locationData.name}:`, searchError)
        continue
      }
      
      if (!locations || locations.length === 0) {
        console.log(`⚠️  Location not found: ${locationData.name}`)
        continue
      }
      
      const location = locations[0]
      console.log(`📍 Found location: ${location.name} (${location.id})`)
      
      // 画像URLs、説明、カテゴリを更新
      const { error: updateError } = await supabase
        .from('locations')
        .update({
          image_urls: locationData.images,
          description: locationData.description,
          category: locationData.category
        })
        .eq('id', location.id)
      
      if (updateError) {
        console.error(`❌ Error updating ${location.name}:`, updateError)
        continue
      }
      
      console.log(`✅ Updated ${location.name} with ${locationData.images.length} high-quality images`)
      
      // カテゴリも更新された場合は通知
      if (location.category !== locationData.category) {
        console.log(`   📂 Category updated: ${location.category} → ${locationData.category}`)
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error processing ${locationData.name}:`, error)
    }
  }
  
  console.log('\n🎉 Priority location image update completed!')
}

// データベース接続をテスト
async function testConnection() {
  const { data, error } = await supabase
    .from('locations')
    .select('count(*)')
    .limit(1)
  
  if (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
  
  console.log('✅ Database connection successful')
  return true
}

// メイン実行
async function main() {
  console.log('🚀 Starting priority location image update process...')
  
  await testConnection()
  await addPriorityLocationImages()
  
  console.log('\n📊 Verifying updates...')
  
  // 更新結果を確認
  for (const locationData of priorityLocationImages) {
    const { data: locations } = await supabase
      .from('locations')
      .select('name, image_urls, category, description')
      .ilike('name', `%${locationData.name}%`)
      .limit(1)
    
    if (locations && locations.length > 0) {
      const location = locations[0]
      console.log(`📍 ${location.name}:`)
      console.log(`   Images: ${location.image_urls?.length || 0} URLs`)
      console.log(`   Category: ${location.category}`)
      console.log(`   Description: ${location.description ? 'Updated' : 'None'}`)
    }
  }
}

// ES module用のメイン実行チェック
import { fileURLToPath } from 'url'

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}