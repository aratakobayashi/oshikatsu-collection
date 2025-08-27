#!/usr/bin/env node

/**
 * 画像がないロケーションに画像を追加するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.production' })

// 本番環境のSupabase設定
const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY)

// 画像がないロケーション用のデータ
const missingLocationImages = [
  // カフェ
  {
    name: 'シナモロールカフェ',
    searchPatterns: ['シナモロールカフェ', 'シナモロール', 'サンリオカフェ'],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop&q=80', // かわいいカフェ内装
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=250&fit=crop&q=80', // カフェラテアート
      'https://images.unsplash.com/photo-1522012188892-24beb302783d?w=400&h=250&fit=crop&q=80'  // キャラクターカフェ風
    ],
    description: 'サンリオの人気キャラクター「シナモロール」のテーマカフェ。かわいい内装とキャラクタースイーツが人気'
  },
  {
    name: 'BLUE SIX COFFEE',
    searchPatterns: ['BLUE SIX COFFEE', 'BLUE SIX', 'ブルーシックス'],
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80', // スペシャルティコーヒー
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80', // コーヒーショップ
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=250&fit=crop&q=80'  // モダンカフェ内装
    ],
    description: '明治公園内にあるスペシャルティコーヒー専門店。厳選された豆と丁寧な抽出で人気'
  },
  {
    name: "Clover's Pancake Cafe",
    searchPatterns: ["Clover's Pancake", 'クローバー', 'パンケーキカフェ'],
    images: [
      'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=250&fit=crop&q=80', // パンケーキ
      'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=400&h=250&fit=crop&q=80', // ふわふわパンケーキ
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop&q=80'  // カフェスイーツ
    ],
    description: '恵比寿にある人気パンケーキカフェ。ふわふわのパンケーキと季節限定メニューが楽しめる'
  },
  
  // ショップ
  {
    name: 'Dr.HEAD 新宿本店',
    searchPatterns: ['Dr.HEAD', 'ドクターヘッド', 'ヘッドスパ'],
    images: [
      'https://images.unsplash.com/photo-1560750133-c5d4ef4de911?w=400&h=250&fit=crop&q=80', // ヘッドスパ・リラクゼーション
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&q=80', // スパ・マッサージ
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop&q=80'  // リラックス空間
    ],
    description: '新宿にあるヘッドスパ専門店。プロの技術でリラクゼーションと頭皮ケアを提供'
  },
  {
    name: 'GiGO 新宿歌舞伎町店',
    searchPatterns: ['GiGO', 'ギーゴ', 'ゲームセンター', '歌舞伎町'],
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', // ゲームセンター
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=250&fit=crop&q=80', // アーケード
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=250&fit=crop&q=80'  // ネオン街
    ],
    description: '新宿歌舞伎町にある大型ゲームセンター。最新のアーケードゲームとプライズゲームが充実'
  },
  {
    name: 'GiGO池袋3号館',
    searchPatterns: ['GiGO池袋', 'ギーゴ池袋', 'ゲームセンター池袋'],
    images: [
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=250&fit=crop&q=80', // アーケードゲーム
      'https://images.unsplash.com/photo-1598103442097-8b74394ba95b?w=400&h=250&fit=crop&q=80', // ゲームセンター内部
      'https://images.unsplash.com/photo-1561049933-2c2e8a6b4e68?w=400&h=250&fit=crop&q=80'  // クレーンゲーム
    ],
    description: '池袋にある人気ゲームセンター。音楽ゲームやクレーンゲームが豊富'
  },
  {
    name: 'GINZA過門香',
    searchPatterns: ['過門香', 'GINZA過門香', '錦糸町'],
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80', // 中華料理
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=250&fit=crop&q=80', // 中華レストラン
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop&q=80'  // 高級中華
    ],
    description: '錦糸町にある本格中華料理店。北京ダックと四川料理が自慢の人気レストラン'
  },
  
  // 観光施設
  {
    name: '神戸ワールド記念ホール',
    searchPatterns: ['神戸ワールド記念ホール', 'ワールド記念ホール', '神戸ポートアイランド'],
    images: [
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80', // コンサートホール
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=250&fit=crop&q=80', // イベント会場
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop&q=80'  // コンサート
    ],
    description: '神戸ポートアイランドにある大型イベントホール。コンサートやスポーツイベントが開催される'
  },
  
  // 追加のレストラン・観光地
  {
    name: '亀澤堂',
    searchPatterns: ['亀澤堂', '亀沢堂', 'かめざわどう'],
    images: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80', // 和菓子店
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80', // 日本の伝統菓子
      'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=250&fit=crop&q=80'  // 和スイーツ
    ],
    description: '伝統的な和菓子店。季節の和菓子と抹茶が楽しめる老舗店'
  },
  {
    name: '志づや',
    searchPatterns: ['志づや', 'しづや', '志津屋'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80', // 日本料理
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=250&fit=crop&q=80', // 懐石料理
      'https://images.unsplash.com/photo-1562113346-9ca34e47bd6f?w=400&h=250&fit=crop&q=80'  // 高級和食
    ],
    description: '伝統的な日本料理店。旬の食材を使った懐石料理が楽しめる'
  },
  {
    name: '小田原城址公園',
    searchPatterns: ['小田原城址公園', '小田原城', '小田原城址'],
    images: [
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80', // 城
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=250&fit=crop&q=80', // 日本の城
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80'  // 城と桜
    ],
    description: '小田原にある歴史的な城跡公園。天守閣と美しい庭園が見どころ'
  },
  {
    name: '西公園',
    searchPatterns: ['西公園', '西園', '西の公園'],
    images: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80', // 公園
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80', // 緑地
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&q=80'  // 桜の公園
    ],
    description: '地域住民に愛される公園。四季折々の自然と広い芝生広場が特徴'
  },
  {
    name: '辻堂海水浴場',
    searchPatterns: ['辻堂海水浴場', '辻堂海岸', '辻堂ビーチ'],
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop&q=80', // ビーチ
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&h=250&fit=crop&q=80', // 海水浴場
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop&q=80'  // 湘南の海
    ],
    description: '湘南エリアの人気海水浴場。サーフィンやマリンスポーツが楽しめるビーチ'
  },
  {
    name: '青山迎賓館',
    searchPatterns: ['青山迎賓館', '迎賓館', '赤坂迎賓館'],
    images: [
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80', // 洋館建築
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=250&fit=crop&q=80', // 迎賓館
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80'  // 豪華な内装
    ],
    description: '青山にある歴史的建造物。国賓の接遇に使用される格式高い洋館'
  },
  {
    name: 'ベニスビーチ',
    searchPatterns: ['ベニスビーチ', 'Venice Beach', 'ヴェニスビーチ'],
    images: [
      'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=400&h=250&fit=crop&q=80', // ビーチ風景
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&h=250&fit=crop&q=80', // 海岸線
      'https://images.unsplash.com/photo-1524813686514-a57563d77965?w=400&h=250&fit=crop&q=80'  // カリフォルニアビーチ
    ],
    description: 'カリフォルニアスタイルのビーチ。サーフカルチャーとストリートアートが特徴'
  }
]

// 統計情報
const stats = {
  processed: 0,
  updated: 0,
  notFound: 0,
  errors: 0
}

async function updateLocationImages(locationData: any) {
  try {
    const searchPatterns = locationData.searchPatterns || [locationData.name]
    
    let location = null
    
    // 各検索パターンで検索
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
    
    // 画像とdescriptionを更新
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

async function main() {
  console.log('🚀 Missing Location Image Update Script')
  console.log('=====================================')
  console.log(`Total locations to process: ${missingLocationImages.length}\n`)
  
  // データベース接続テスト
  console.log('🔌 Testing database connection...')
  try {
    const { count, error } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`✅ Connected successfully. Total locations in DB: ${count}\n`)
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
  
  // 各ロケーションを処理
  for (const locationData of missingLocationImages) {
    stats.processed++
    console.log(`[${stats.processed}/${missingLocationImages.length}] ${locationData.name}`)
    await updateLocationImages(locationData)
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100))
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
  
  console.log('\n✨ Missing location image update completed!')
}

// 実行
main().catch(console.error)