import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込み
dotenv.config()

// 環境変数からSupabaseクライアントを作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ounloyykptsqzdpbsnpn.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 優先度2: 複数エピソードで登場する人気スポットの高品質実画像
const priority2LocationImages = [
  {
    name: 'すみだ水族館',
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop&q=80', // 水族館内部、魚の群れ
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=400&h=250&fit=crop&q=80', // 水族館の幻想的な照明
      'https://images.unsplash.com/photo-1520637836862-4d197d17c92a?w=400&h=250&fit=crop&q=80'  // クラゲの美しい展示
    ],
    description: '東京スカイツリータウンにある人気の水族館。ペンギンやクラゲなど多彩な海の生き物を展示',
    category: 'tourist'
  },
  {
    name: '東京ドーム',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', // 東京ドーム外観
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80', // スタジアム内部
      'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=400&h=250&fit=crop&q=80'  // ドーム球場の照明
    ],
    description: '日本初の屋根付き球場として親しまれる東京ドーム。野球観戦やコンサートなど多目的に利用',
    category: 'tourist'
  },
  {
    name: '銀座三越',
    images: [
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80', // 高級デパート外観
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80', // デパート内部のラグジュアリー空間
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'  // 高級ショッピング
    ],
    description: '銀座を代表する老舗百貨店。最高級のファッション、グルメ、ライフスタイル商品が揃う',
    category: 'shop'
  },
  {
    name: '渋谷スクランブル交差点',
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop&q=80', // スクランブル交差点の人波
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80', // 渋谷の夜景
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80'  // 渋谷交差点上空からの撮影
    ],
    description: '世界で最も有名な交差点の一つ。1日約50万人が行き交う東京の象徴的なスポット',
    category: 'tourist'
  },
  {
    name: '東京タワー',
    images: [
      'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&q=80', // 東京タワーの赤い姿
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80', // 夜の東京タワー
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'  // 東京タワーと街並み
    ],
    description: '1958年開業の東京のシンボル。高さ333mの電波塔で、展望台からは東京の絶景を望める',
    category: 'tourist'
  },
  {
    name: '浅草寺',
    images: [
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80', // 浅草寺の雷門
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', // 浅草寺本堂
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80'  // 浅草の仲見世通り
    ],
    description: '東京最古の寺院として1400年の歴史を持つ。雷門と仲見世通りで知られる東京の代表的観光地',
    category: 'tourist'
  },
  {
    name: '新宿御苑',
    images: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', // 新宿御苑の桜
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80', // 日本庭園の美しい池
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80'  // 公園の緑豊かな風景
    ],
    description: '新宿の中心にある58.3haの広大な国民公園。四季折々の美しい自然と日本庭園が楽しめる',
    category: 'tourist'
  },
  {
    name: '上野動物園',
    images: [
      'https://images.unsplash.com/photo-1549366021-9f761d040a94?w=400&h=250&fit=crop&q=80', // パンダ（動物園の人気者）
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', // 動物園の自然環境
      'https://images.unsplash.com/photo-1574146681337-f0b6709f0b58?w=400&h=250&fit=crop&q=80'  // 動物園の入口や施設
    ],
    description: '1882年開園の日本最古の動物園。ジャイアントパンダをはじめ約400種3000点の動物を飼育',
    category: 'tourist'
  }
]

async function addPriority2LocationImages() {
  console.log('🎨 Adding high-quality images to Priority 2 locations (multi-episode popular spots)...')
  
  for (const locationData of priority2LocationImages) {
    try {
      // ロケーション名で検索（複数のパターンに対応）
      let searchConditions = [locationData.name]
      
      // 特別な検索パターンを追加
      if (locationData.name === '銀座三越') {
        searchConditions.push('三越', '銀座 三越')
      } else if (locationData.name === '渋谷スクランブル交差点') {
        searchConditions.push('スクランブル交差点', '渋谷 交差点', '渋谷交差点')
      } else if (locationData.name === '浅草寺') {
        searchConditions.push('浅草 寺', '雷門')
      } else if (locationData.name === '新宿御苑') {
        searchConditions.push('新宿 御苑')
      } else if (locationData.name === '上野動物園') {
        searchConditions.push('上野 動物園')
      }
      
      let location = null
      
      // 各検索条件で順番に検索
      for (const searchName of searchConditions) {
        const { data: locations, error: searchError } = await supabase
          .from('locations')
          .select('*')
          .ilike('name', `%${searchName}%`)
          .limit(5) // 複数候補を取得
        
        if (searchError) {
          console.error(`❌ Error searching for ${searchName}:`, searchError)
          continue
        }
        
        if (locations && locations.length > 0) {
          // より適切なマッチを選択
          location = locations.find(loc => 
            loc.name.includes(locationData.name) || 
            locationData.name.includes(loc.name) ||
            searchConditions.some(condition => loc.name.includes(condition))
          ) || locations[0]
          
          console.log(`📍 Found location: ${location.name} (${location.id}) - searched for: ${searchName}`)
          break
        }
      }
      
      if (!location) {
        console.log(`⚠️  Location not found: ${locationData.name}`)
        continue
      }
      
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
  
  console.log('\n🎉 Priority 2 location image update completed!')
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
  console.log('🚀 Starting Priority 2 location image update process...')
  console.log('🎯 Target: Multi-episode popular tourist spots')
  
  await testConnection()
  await addPriority2LocationImages()
  
  console.log('\n📊 Verifying updates...')
  
  // 更新結果を確認
  for (const locationData of priority2LocationImages) {
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
  
  console.log('\n🎯 Next: Priority 3 locations (well-known fan pilgrimage sites)')
}

// ES module用のメイン実行チェック
import { fileURLToPath } from 'url'

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}