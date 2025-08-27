#!/usr/bin/env node

/**
 * 画像がないロケーションを特定するスクリプト
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 環境変数を読み込み
dotenv.config({ path: '.env.production' })

// 本番環境のSupabase設定
const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY)

async function findLocationsWithoutImages() {
  console.log('🔍 画像がないロケーションを検索中...\n')
  
  try {
    // 画像がないロケーションを取得
    const { data: locationsWithoutImages, error } = await supabase
      .from('locations')
      .select('id, name, address, description')
      .or('image_urls.is.null,image_urls.eq.{}')
      .order('name')
      .limit(100)
    
    if (error) throw error
    
    if (!locationsWithoutImages || locationsWithoutImages.length === 0) {
      console.log('✅ 全てのロケーションに画像が設定されています！')
      return
    }
    
    console.log(`📊 画像がないロケーション: ${locationsWithoutImages.length}件\n`)
    console.log('=' .repeat(60))
    
    // カテゴリ推定のためのキーワード
    const categoryKeywords = {
      restaurant: ['レストラン', 'ラーメン', '寿司', '焼肉', 'すき焼き', '定食', '食堂', '屋', 'kitchen', '料理', 'ダイニング', '亭', 'グリル', '鉄板', '天ぷら', 'うどん', 'そば', '丼', '串', 'バー', 'bar', 'バル', '居酒屋', '酒場', '割烹', '懐石'],
      cafe: ['カフェ', 'cafe', 'coffee', 'コーヒー', '珈琲', '喫茶', 'tea', 'ティー', '茶', 'パンケーキ', 'ケーキ', 'スイーツ', 'パフェ', 'アイス', 'ドリンク', 'ジュース', 'スムージー', 'タピオカ', 'ベーカリー', 'パン'],
      shop: ['ショップ', 'shop', 'store', '店', 'ストア', 'マート', '市場', '商店', '百貨店', 'デパート', '専門店', 'ブティック', '問屋', '商会', '本舗', '堂', '館', 'センター', 'モール', 'プラザ', 'マーケット'],
      tourist: ['公園', '神社', '寺', '城', '博物館', '美術館', '水族館', '動物園', 'タワー', '展望台', 'ビーチ', '海岸', '山', '湖', '温泉', 'ホテル', '旅館', '観光', 'ランドマーク', 'パーク', '庭園', '記念館', '迎賓館', 'スタジアム', 'ドーム', 'アリーナ', '劇場', 'ホール']
    }
    
    // カテゴリを推定
    function guessCategory(name: string): string {
      const lowerName = name.toLowerCase()
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
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
      other: []
    }
    
    locationsWithoutImages.forEach(loc => {
      const category = guessCategory(loc.name)
      categorized[category].push(loc)
    })
    
    // カテゴリごとに表示
    const categoryLabels: { [key: string]: string } = {
      restaurant: '🍽️  レストラン・飲食店',
      cafe: '☕ カフェ・喫茶店',
      shop: '🛍️  ショップ・店舗',
      tourist: '🏛️  観光地・施設',
      other: '❓ その他'
    }
    
    for (const [category, locations] of Object.entries(categorized)) {
      if (locations.length > 0) {
        console.log(`\n${categoryLabels[category]} (${locations.length}件)`)
        console.log('-'.repeat(40))
        
        locations.slice(0, 10).forEach(loc => {
          console.log(`• ${loc.name}`)
          if (loc.address) {
            console.log(`  📍 ${loc.address}`)
          }
        })
        
        if (locations.length > 10) {
          console.log(`  ... 他 ${locations.length - 10}件`)
        }
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('\n📝 サマリー:')
    console.log(`• 総数: ${locationsWithoutImages.length}件`)
    console.log(`• レストラン: ${categorized.restaurant.length}件`)
    console.log(`• カフェ: ${categorized.cafe.length}件`)
    console.log(`• ショップ: ${categorized.shop.length}件`)
    console.log(`• 観光地: ${categorized.tourist.length}件`)
    console.log(`• その他: ${categorized.other.length}件`)
    
    // 優先度の高いロケーションを提案
    console.log('\n🎯 優先的に画像を追加すべきロケーション:')
    const priorityLocations = [
      ...categorized.restaurant.slice(0, 5),
      ...categorized.cafe.slice(0, 3),
      ...categorized.tourist.slice(0, 2)
    ]
    
    priorityLocations.forEach((loc, index) => {
      console.log(`${index + 1}. ${loc.name}`)
    })
    
    // CSVエクスポート用のデータ作成
    console.log('\n💾 CSVエクスポート用データ:')
    console.log('以下のコマンドで画像追加スクリプトを生成できます:')
    console.log('npm run images:generate-missing')
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
findLocationsWithoutImages().catch(console.error)