#!/usr/bin/env node

/**
 * ロケーションデータ品質調査
 * 誤分類データの特定とクリーニングの必要性評価
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeLocationDataQuality() {
  console.log('🔍 ロケーションデータ品質調査')
  console.log('='.repeat(60))

  // 全ロケーションデータを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone, opening_hours,
      episode_locations(
        episodes(id, title, celebrity_id, celebrities(name))
      )
    `)

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 総ロケーション数: ${locations.length}箇所`)

  // 1. 基本的な品質チェック
  const qualityIssues = {
    no_address: locations.filter(loc => !loc.address).length,
    no_description: locations.filter(loc => !loc.description).length,
    no_episodes: locations.filter(loc => !loc.episode_locations || loc.episode_locations.length === 0).length,
    suspicious_names: locations.filter(loc => 
      loc.name?.match(/^(場所|スポット|ロケ地|不明|未設定|テスト|test)/i) ||
      loc.name?.length < 3 ||
      loc.name?.match(/^\d+$/)
    ).length,
    duplicate_names: new Set(locations.map(loc => loc.name)).size < locations.length
  }

  console.log('\n⚠️  【データ品質問題】')
  console.log('='.repeat(40))
  console.log(`住所なし: ${qualityIssues.no_address}件 (${Math.round(qualityIssues.no_address/locations.length*100)}%)`)
  console.log(`説明文なし: ${qualityIssues.no_description}件 (${Math.round(qualityIssues.no_description/locations.length*100)}%)`)
  console.log(`エピソード紐付けなし: ${qualityIssues.no_episodes}件 (${Math.round(qualityIssues.no_episodes/locations.length*100)}%)`)
  console.log(`疑わしい名称: ${qualityIssues.suspicious_names}件 (${Math.round(qualityIssues.suspicious_names/locations.length*100)}%)`)

  // 2. 非レストラン・非店舗の特定
  const nonRestaurantKeywords = [
    '駅', 'ホーム', '公園', '神社', '寺', '橋', '川', '山', '海', '港',
    '学校', '病院', '役所', '図書館', '美術館', '博物館',
    'ビル', 'マンション', 'アパート', '住宅', '家',
    '撮影所', 'スタジオ', 'セット', '会場'
  ]

  const probablyNotRestaurants = locations.filter(loc => {
    const name = loc.name?.toLowerCase() || ''
    const description = loc.description?.toLowerCase() || ''
    const address = loc.address?.toLowerCase() || ''
    
    return nonRestaurantKeywords.some(keyword => 
      name.includes(keyword) || description.includes(keyword) || address.includes(keyword)
    )
  })

  console.log(`\n🏢 【非レストラン・非店舗と推定】: ${probablyNotRestaurants.length}件`)
  
  // サンプル表示
  console.log('\nサンプル:')
  probablyNotRestaurants.slice(0, 10).forEach((loc, i) => {
    console.log(`  ${i+1}. ${loc.name} - ${loc.address || '住所なし'}`)
  })

  // 3. レストラン・店舗と推定される箇所
  const restaurantKeywords = [
    'レストラン', '食堂', 'カフェ', '喫茶', 'バー', '居酒屋',
    '寿司', 'ラーメン', 'うどん', 'そば', '焼肉', '焼鳥',
    '中華', 'イタリアン', 'フレンチ', '和食', '洋食',
    '店', 'ショップ', '商店', 'デパート', '百貨店'
  ]

  const probablyRestaurants = locations.filter(loc => {
    const name = loc.name?.toLowerCase() || ''
    const description = loc.description?.toLowerCase() || ''
    const tags = loc.tags?.join(' ').toLowerCase() || ''
    
    return restaurantKeywords.some(keyword => 
      name.includes(keyword) || description.includes(keyword) || tags.includes(keyword)
    ) && !nonRestaurantKeywords.some(keyword => 
      name.includes(keyword) || description.includes(keyword)
    )
  })

  console.log(`\n🍽️ 【レストラン・店舗と推定】: ${probablyRestaurants.length}件`)

  // 4. タベログURL対応の実際の必要性
  const tabelogCandidates = probablyRestaurants.filter(loc => !loc.tabelog_url)
  console.log(`\n📊 【タベログURL対応候補】: ${tabelogCandidates.length}件`)
  console.log(`  既にタベログURL設定済み: ${probablyRestaurants.filter(loc => loc.tabelog_url).length}件`)

  // 5. 高優先度の特定（エピソード数による）
  const tabelogPriority = tabelogCandidates
    .map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      episode_count: loc.episode_locations?.length || 0,
      celebrities: [...new Set(loc.episode_locations?.map(el => 
        el.episodes?.celebrities?.name).filter(Boolean) || [])],
      priority_score: (loc.episode_locations?.length || 0) * 10
    }))
    .filter(loc => loc.episode_count > 0)
    .sort((a, b) => b.priority_score - a.priority_score)

  console.log('\n🎯 【タベログURL対応 TOP10】')
  console.log('='.repeat(50))
  tabelogPriority.slice(0, 10).forEach((loc, i) => {
    console.log(`${i+1}. ${loc.name}`)
    console.log(`   📍 ${loc.address || '住所不明'}`)
    console.log(`   🎬 エピソード: ${loc.episode_count}件`)
    console.log(`   ⭐ セレブ: ${loc.celebrities.slice(0, 2).join(', ')}${loc.celebrities.length > 2 ? '...' : ''}`)
    console.log(`   💰 優先度: ${loc.priority_score}ポイント`)
  })

  // 6. データクリーニングの提案
  console.log('\n🧹 【データクリーニング提案】')
  console.log('='.repeat(40))
  console.log(`✅ 削除推奨: ${probablyNotRestaurants.length}件（非店舗）`)
  console.log(`✅ 保持・タベログ対応: ${tabelogCandidates.length}件（店舗系）`)
  console.log(`⚠️  要確認: ${locations.length - probablyNotRestaurants.length - probablyRestaurants.length}件（判定困難）`)

  // 7. ROI計算
  const estimatedRevenue = tabelogPriority.slice(0, 50)
    .reduce((sum, loc) => sum + (loc.episode_count * 2), 0) // エピソード数×2円/月と仮定
  
  console.log('\n💰 【ROI予測】')
  console.log(`上位50件対応時の月額収益見込み: ${estimatedRevenue}円`)
  console.log(`作業時間見込み: ${Math.ceil(tabelogPriority.slice(0, 50).length * 0.5)}時間`)
  console.log(`時給換算: ${Math.round(estimatedRevenue / Math.ceil(tabelogPriority.slice(0, 50).length * 0.5))}円`)

  return {
    total_locations: locations.length,
    quality_issues: qualityIssues,
    non_restaurants: probablyNotRestaurants.length,
    restaurant_candidates: tabelogCandidates.length,
    high_priority_candidates: tabelogPriority.slice(0, 50),
    estimated_monthly_revenue: estimatedRevenue
  }
}

// 実行
analyzeLocationDataQuality()
  .then(results => {
    console.log(`\n✅ 調査完了!`)
    console.log(`   総箇所数: ${results.total_locations}`)
    console.log(`   タベログ対応候補: ${results.restaurant_candidates}`)
    console.log(`   削除推奨（非店舗）: ${results.non_restaurants}`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })
