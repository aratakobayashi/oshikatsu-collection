#!/usr/bin/env node

/**
 * 残りの画像なしロケーションを詳細分析
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY)

async function analyzeRemainingLocations() {
  console.log('🔍 残りの画像なしロケーションを詳細分析中...\n')
  
  try {
    // 画像がないロケーションを全て取得（制限なし）
    const { data: locationsWithoutImages, error } = await supabase
      .from('locations')
      .select('id, name, address, description')
      .or('image_urls.is.null,image_urls.eq.{}')
      .order('name')
    
    if (error) throw error
    
    if (!locationsWithoutImages || locationsWithoutImages.length === 0) {
      console.log('✅ 全てのロケーションに画像が設定されています！')
      return []
    }
    
    console.log(`📊 画像がないロケーション: ${locationsWithoutImages.length}件\n`)
    
    // 「・他」を除外して実際の場所のみをフィルタ
    const realLocations = locationsWithoutImages.filter(loc => {
      const name = loc.name.toLowerCase()
      // 除外するパターン
      const excludePatterns = [
        '・他',
        '●',
        'http',
        'www',
        '.com',
        'フォーム',
        'covered by',
        'glow by',
        'weekend',
        'tom ford',
        'burberry',
        'lopez',
        'jennifer'
      ]
      
      return !excludePatterns.some(pattern => name.includes(pattern))
    })
    
    console.log(`📍 実際のロケーション（除外後）: ${realLocations.length}件\n`)
    console.log('=' .repeat(60))
    
    // カテゴリ推定のための詳細キーワード
    const categoryKeywords = {
      restaurant: [
        'レストラン', 'restaurant', '食堂', '料理', 'dining',
        'ラーメン', 'ramen', '寿司', 'sushi', '焼肉', 'yakiniku',
        '定食', 'ていしょく', '屋', 'や', 'kitchen', 'キッチン',
        '亭', 'てい', 'グリル', 'grill', '鉄板', 'teppan',
        '天ぷら', 'tempura', 'うどん', 'udon', 'そば', 'soba',
        '丼', 'どんぶり', '串', 'くし', 'バー', 'bar', 'バル',
        '居酒屋', 'いざかや', '酒場', 'さかば', '割烹', 'かっぽう',
        '懐石', 'かいせき', 'ビストロ', 'bistro', 'トラットリア',
        'イタリアン', 'italian', 'フレンチ', 'french', '中華', 'chinese',
        'タイ', 'thai', '韓国', 'korean', 'インド', 'indian',
        'カレー', 'curry', 'ステーキ', 'steak', 'ハンバーグ', 'hamburg',
        'とんかつ', 'tonkatsu', '牛', 'ぎゅう', '豚', 'ぶた', '鶏', 'とり'
      ],
      cafe: [
        'カフェ', 'cafe', 'coffee', 'コーヒー', '珈琲',
        '喫茶', 'きっさ', 'tea', 'ティー', '茶', 'ちゃ',
        'パンケーキ', 'pancake', 'ケーキ', 'cake', 'スイーツ', 'sweets',
        'パフェ', 'parfait', 'アイス', 'ice', 'クリーム', 'cream',
        'ドリンク', 'drink', 'ジュース', 'juice', 'スムージー', 'smoothie',
        'タピオカ', 'tapioca', 'ベーカリー', 'bakery', 'パン', 'bread',
        'サンドイッチ', 'sandwich', 'モーニング', 'morning', 'ブランチ', 'brunch',
        'デザート', 'dessert', 'チョコレート', 'chocolate', 'クレープ', 'crepe'
      ],
      shop: [
        'ショップ', 'shop', 'store', '店', 'みせ', 'ストア',
        'マート', 'mart', '市場', 'いちば', '商店', 'しょうてん',
        '百貨店', 'ひゃっかてん', 'デパート', 'department', '専門店',
        'ブティック', 'boutique', '問屋', 'とんや', '商会', 'しょうかい',
        '本舗', 'ほんぽ', '堂', 'どう', '館', 'かん', 'センター', 'center',
        'モール', 'mall', 'プラザ', 'plaza', 'マーケット', 'market',
        'アウトレット', 'outlet', 'ファッション', 'fashion', '服', 'ふく',
        '薬', 'くすり', '本', 'ほん', 'ブック', 'book', '文具', 'ぶんぐ',
        'スポーツ', 'sports', '電気', 'でんき', '家電', 'かでん',
        'ゲーム', 'game', 'ホビー', 'hobby', 'おもちゃ', 'toy'
      ],
      tourist: [
        '公園', 'こうえん', 'park', '神社', 'じんじゃ', 'shrine',
        '寺', 'てら', 'temple', '城', 'しろ', 'castle',
        '博物館', 'はくぶつかん', 'museum', '美術館', 'びじゅつかん', 'gallery',
        '水族館', 'すいぞくかん', 'aquarium', '動物園', 'どうぶつえん', 'zoo',
        'タワー', 'tower', '展望台', 'てんぼうだい', 'observatory',
        'ビーチ', 'beach', '海岸', 'かいがん', '海水浴', 'かいすいよく',
        '山', 'やま', 'mountain', '湖', 'みずうみ', 'lake',
        '温泉', 'おんせん', 'onsen', 'ホテル', 'hotel', '旅館', 'りょかん',
        '観光', 'かんこう', 'ランドマーク', 'landmark', 'パーク',
        '庭園', 'ていえん', 'garden', '記念館', 'きねんかん', 'memorial',
        '迎賓館', 'げいひんかん', 'スタジアム', 'stadium', 'ドーム', 'dome',
        'アリーナ', 'arena', '劇場', 'げきじょう', 'theater', 'ホール', 'hall',
        'プール', 'pool', 'スパ', 'spa', 'リゾート', 'resort'
      ],
      entertainment: [
        'カラオケ', 'karaoke', 'ボウリング', 'bowling', 'ビリヤード', 'billiard',
        'ダーツ', 'darts', 'ライブハウス', 'live', 'クラブ', 'club',
        '映画', 'えいが', 'cinema', 'シネマ', '劇場', 'theater',
        'スタジオ', 'studio', 'ジム', 'gym', 'フィットネス', 'fitness',
        'ヨガ', 'yoga', 'ダンス', 'dance', 'スクール', 'school',
        '教室', 'きょうしつ', 'レッスン', 'lesson', 'サロン', 'salon',
        'エステ', 'esthe', 'ネイル', 'nail', '美容', 'びよう', 'beauty'
      ]
    }
    
    // カテゴリを推定
    function guessCategory(name: string): string {
      const lowerName = name.toLowerCase()
      
      // 優先順位付きでチェック
      const categories = ['restaurant', 'cafe', 'shop', 'tourist', 'entertainment']
      for (const category of categories) {
        const keywords = categoryKeywords[category as keyof typeof categoryKeywords]
        if (keywords && keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
          return category
        }
      }
      return 'other'
    }
    
    // カテゴリごとに分類
    const categorized: { [key: string]: any[] } = {
      restaurant: [],
      cafe: [],
      shop: [],
      tourist: [],
      entertainment: [],
      other: []
    }
    
    realLocations.forEach(loc => {
      const category = guessCategory(loc.name)
      categorized[category].push(loc)
    })
    
    // カテゴリごとに表示
    const categoryLabels: { [key: string]: string } = {
      restaurant: '🍽️  レストラン・飲食店',
      cafe: '☕ カフェ・喫茶店',
      shop: '🛍️  ショップ・店舗',
      tourist: '🏛️  観光地・施設',
      entertainment: '🎮 エンタメ・娯楽',
      other: '❓ その他'
    }
    
    const allValidLocations: any[] = []
    
    for (const [category, locations] of Object.entries(categorized)) {
      if (locations.length > 0) {
        console.log(`\n${categoryLabels[category]} (${locations.length}件)`)
        console.log('-'.repeat(40))
        
        locations.forEach(loc => {
          console.log(`• ${loc.name}`)
          if (loc.address && loc.address !== '東京都内') {
            console.log(`  📍 ${loc.address}`)
          }
          allValidLocations.push({ ...loc, category })
        })
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('\n📝 サマリー:')
    console.log(`• 総数: ${locationsWithoutImages.length}件`)
    console.log(`• 実際のロケーション: ${realLocations.length}件`)
    console.log(`• レストラン: ${categorized.restaurant.length}件`)
    console.log(`• カフェ: ${categorized.cafe.length}件`)
    console.log(`• ショップ: ${categorized.shop.length}件`)
    console.log(`• 観光地: ${categorized.tourist.length}件`)
    console.log(`• エンタメ: ${categorized.entertainment.length}件`)
    console.log(`• その他: ${categorized.other.length}件`)
    
    return allValidLocations
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
    return []
  }
}

// 実行
analyzeRemainingLocations().then(locations => {
  if (locations.length > 0) {
    console.log('\n💡 これらのロケーションに画像を追加するには:')
    console.log('npm run images:add-more')
  }
}).catch(console.error)