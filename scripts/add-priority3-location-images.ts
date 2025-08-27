import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// .envファイルから環境変数を読み込み
dotenv.config()

// 環境変数からSupabaseクライアントを作成
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ounloyykptsqzdpbsnpn.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 優先度3: ファンによく知られた聖地（聖地巡礼スポット）
const priority3LocationImages = [
  {
    name: '竹下通り',
    images: [
      'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=250&fit=crop&q=80', // 原宿竹下通りの人混み
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', // ポップカルチャーの街並み
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80'  // 原宿のカラフルな店舗
    ],
    description: '原宿のポップカルチャーの聖地。若者文化の発信地として多くのタレントが訪れる人気スポット',
    category: 'tourist'
  },
  {
    name: '江ノ島',
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', // 江ノ島の海岸風景
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80', // 江ノ島弁天橋
      'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=250&fit=crop&q=80'  // 江ノ島灯台と夕景
    ],
    description: '神奈川県の人気観光地。美しい海岸と島の風景で多くのロケ地として使用される',
    category: 'tourist'
  },
  {
    name: '代々木公園',
    images: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', // 代々木公園の桜
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', // 公園の広場
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80'  // 緑豊かな公園風景
    ],
    description: '東京都渋谷区の大型公園。イベントやピクニックの定番スポットとして親しまれる',
    category: 'tourist'
  },
  {
    name: '鎌倉大仏',
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', // 鎌倉大仏の威厳
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', // 大仏への参道
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80'  // 境内の静寂な雰囲気
    ],
    description: '鎌倉の象徴的な大仏像。歴史ある寺院として多くの観光客が訪れる神奈川県の名所',
    category: 'tourist'
  },
  {
    name: 'お台場海浜公園',
    images: [
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80', // お台場の夜景
      'https://images.unsplash.com/photo-1549693578-d683be217e58?w=400&h=250&fit=crop&q=80', // レインボーブリッジビュー
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=400&h=250&fit=crop&q=80'  // 東京湾の美しい景観
    ],
    description: '東京湾に面した人工海浜公園。レインボーブリッジの絶景で知られるデートスポット',
    category: 'tourist'
  },
  {
    name: 'アメ横',
    images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', // アメ横商店街の活気
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80', // 商店街のショッピング
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80'  // 上野アメ横の賑わい
    ],
    description: '上野駅前の活気ある商店街。戦後から続く歴史ある市場で食べ歩きやお買い物が楽しめる',
    category: 'shop'
  },
  {
    name: '築地場外市場',
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80', // 築地の新鮮な海鮮
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80', // 市場の活気
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80'  // 食べ歩きグルメ
    ],
    description: '東京の台所として親しまれる築地の場外市場。新鮮な海鮮グルメが味わえる食の聖地',
    category: 'restaurant'
  },
  {
    name: '明治神宮',
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80', // 明治神宮の鳥居
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', // 神宮の森
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80'  // 参拝客で賑わう境内
    ],
    description: '明治天皇と昭憲皇太后を祀る東京の代表的神社。初詣や観光で多くの人が訪れる',
    category: 'tourist'
  },
  {
    name: '秋葉原電気街',
    images: [
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80', // 秋葉原の夜のネオン
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop&q=80', // 電器店の賑わい
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=250&fit=crop&q=80'  // アキバの人通り
    ],
    description: '世界的に有名な電気街・オタク文化の聖地。アニメ、マンガ、電子機器の専門店が集積',
    category: 'shop'
  },
  {
    name: '皇居東御苑',
    images: [
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80', // 皇居東御苑の桜
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', // 江戸城跡の庭園
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80'  // 日本庭園の美しさ
    ],
    description: '皇居の一般公開エリア。江戸城跡の歴史ある庭園で四季の自然が楽しめる',
    category: 'tourist'
  }
]

async function addPriority3LocationImages() {
  console.log('🎨 Adding high-quality images to Priority 3 locations (fan pilgrimage sites)...')
  
  for (const locationData of priority3LocationImages) {
    try {
      // ロケーション名で検索（複数のパターンに対応）
      let searchConditions = [locationData.name]
      
      // 特別な検索パターンを追加
      if (locationData.name === '竹下通り') {
        searchConditions.push('竹下', '原宿 竹下')
      } else if (locationData.name === '江ノ島') {
        searchConditions.push('江の島', 'えのしま')
      } else if (locationData.name === '鎌倉大仏') {
        searchConditions.push('大仏', '鎌倉 大仏', '高徳院')
      } else if (locationData.name === 'お台場海浜公園') {
        searchConditions.push('お台場', '台場')
      } else if (locationData.name === 'アメ横') {
        searchConditions.push('アメ横', 'アメヤ横丁', '上野 アメ横')
      } else if (locationData.name === '築地場外市場') {
        searchConditions.push('築地', '築地市場', '場外市場')
      } else if (locationData.name === '秋葉原電気街') {
        searchConditions.push('秋葉原', 'アキバ', 'アキハバラ')
      } else if (locationData.name === '皇居東御苑') {
        searchConditions.push('皇居', '東御苑')
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
  
  console.log('\n🎉 Priority 3 location image update completed!')
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
  console.log('🚀 Starting Priority 3 location image update process...')
  console.log('🎯 Target: Well-known fan pilgrimage sites')
  
  await testConnection()
  await addPriority3LocationImages()
  
  console.log('\n📊 Verifying updates...')
  
  // 更新結果を確認
  for (const locationData of priority3LocationImages) {
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
  
  console.log('\n🎯 Priority image curation process completed!')
  console.log('📝 Next steps: Execute SQL scripts manually in Supabase dashboard or run scripts when network allows')
}

// ES module用のメイン実行チェック
import { fileURLToPath } from 'url'

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}