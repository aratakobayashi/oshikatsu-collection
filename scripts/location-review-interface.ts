#!/usr/bin/env node

/**
 * 残存ロケーションの手動確認インターフェース
 * 実際の店舗かどうかを効率的に判定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createLocationReviewList() {
  console.log('🔍 残存ロケーションの確認リスト作成')
  console.log('='.repeat(60))

  // 残存データを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select(`
      id, name, address, description, tags,
      tabelog_url, website_url, phone,
      episode_locations(
        episodes(id, title, celebrities(name))
      )
    `)
    .order('name')

  if (error) {
    throw new Error(`データ取得エラー: ${error.message}`)
  }

  console.log(`📊 確認対象: ${locations.length}件`)

  // 店舗判定のヒント生成
  const reviewList = locations.map(loc => {
    const episodeCount = loc.episode_locations?.length || 0
    const celebrities = [...new Set(loc.episode_locations?.map(el => 
      el.episodes?.celebrities?.name).filter(Boolean) || [])]
    
    // 店舗らしさスコア算出
    const restaurantScore = calculateRestaurantScore(loc)
    
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      description: loc.description,
      episodeCount,
      celebrities: celebrities.slice(0, 2),
      restaurantScore,
      hasTabelog: !!loc.tabelog_url,
      hasPhone: !!loc.phone,
      googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(loc.name + ' ' + (loc.address || ''))}`
    }
  }).sort((a, b) => b.restaurantScore - a.restaurantScore)

  // CSVファイル出力
  const csvContent = [
    'RestaurantScore,Name,Address,Episodes,Celebrities,HasTabelog,HasPhone,GoogleSearchURL,Recommendation',
    ...reviewList.map(loc => [
      loc.restaurantScore,
      `"${loc.name}"`,
      `"${loc.address || ''}"`,
      loc.episodeCount,
      `"${loc.celebrities.join(', ')}"`,
      loc.hasTabelog ? 'Yes' : 'No',
      loc.hasPhone ? 'Yes' : 'No',
      `"${loc.googleSearchUrl}"`,
      loc.restaurantScore >= 7 ? 'KEEP' : loc.restaurantScore >= 4 ? 'REVIEW' : 'DELETE'
    ].join(','))
  ].join('\n')

  const csvFilename = `location-review-${new Date().toISOString().split('T')[0]}.csv`
  const fs = await import('fs')
  fs.writeFileSync(csvFilename, csvContent)

  // 結果サマリー
  const keepCount = reviewList.filter(l => l.restaurantScore >= 7).length
  const reviewCount = reviewList.filter(l => l.restaurantScore >= 4 && l.restaurantScore < 7).length
  const deleteCount = reviewList.filter(l => l.restaurantScore < 4).length

  console.log('\n📋 【判定結果サマリー】')
  console.log('='.repeat(40))
  console.log(`✅ 店舗確実（保持推奨）: ${keepCount}件`)
  console.log(`🔍 要確認: ${reviewCount}件`)
  console.log(`❌ 非店舗（削除推奨）: ${deleteCount}件`)

  console.log('\n📄 【CSVファイル出力】')
  console.log(`ファイル: ${csvFilename}`)
  console.log('Excelで開いて効率的に確認可能!')

  console.log('\n🏆 【店舗確実 TOP10】')
  reviewList.filter(l => l.restaurantScore >= 7).slice(0, 10).forEach((loc, i) => {
    console.log(`${i+1}. ${loc.name} (スコア: ${loc.restaurantScore})`)
    console.log(`   📍 ${loc.address || '住所不明'}`)
    console.log(`   🎬 ${loc.episodeCount}エピソード | ${loc.celebrities.join(', ')}`)
    console.log('')
  })

  console.log('\n❌ 【削除推奨 TOP10】')
  reviewList.filter(l => l.restaurantScore < 4).slice(0, 10).forEach((loc, i) => {
    console.log(`${i+1}. ${loc.name} (スコア: ${loc.restaurantScore})`)
    console.log(`   📍 ${loc.address || '住所不明'}`)
    console.log(`   🎬 ${loc.episodeCount}エピソード`)
    console.log('')
  })

  return {
    total: locations.length,
    keep: keepCount,
    review: reviewCount,
    delete: deleteCount,
    csv_file: csvFilename
  }
}

function calculateRestaurantScore(location: any): number {
  let score = 0
  const name = location.name?.toLowerCase() || ''
  const description = location.description?.toLowerCase() || ''
  const tags = location.tags?.join(' ').toLowerCase() || ''
  const address = location.address?.toLowerCase() || ''

  // 明確な店舗キーワード（高得点）
  const strongRestaurantKeywords = [
    'レストラン', '食堂', 'カフェ', '喫茶', 'バー', '居酒屋',
    'ラーメン', 'うどん', 'そば', '寿司', '焼肉', '焼鳥',
    '定食', '弁当', 'ピザ', 'ハンバーガー'
  ]
  
  if (strongRestaurantKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword) || tags.includes(keyword)
  )) {
    score += 8
  }

  // 店舗系キーワード（中程度）
  const mediumKeywords = ['店', 'ショップ', 'デリ', 'ベーカリー', 'スイーツ']
  if (mediumKeywords.some(keyword => name.includes(keyword))) {
    score += 5
  }

  // 料理系キーワード
  const cuisineKeywords = ['中華', 'イタリアン', 'フレンチ', '和食', '洋食', 'アジアン']
  if (cuisineKeywords.some(keyword => 
    name.includes(keyword) || description.includes(keyword)
  )) {
    score += 3
  }

  // タベログURLあり（信頼度高い）
  if (location.tabelog_url) {
    score += 6
  }

  // 電話番号あり
  if (location.phone) {
    score += 2
  }

  // 住所の具体性
  if (location.address && location.address.length > 10 && 
      !location.address.includes('東京都内') && 
      !location.address.includes('各店舗')) {
    score += 2
  }

  // 減点要素
  const negativeKeywords = [
    'ビル', 'マンション', 'アパート', '住宅', '駅', 'ホーム',
    '公園', '神社', '寺', '教会', '学校', '病院', '役所',
    '美術館', '博物館', '図書館', 'スタジオ', 'セット'
  ]

  if (negativeKeywords.some(keyword => 
    name.includes(keyword) || address.includes(keyword)
  )) {
    score -= 5
  }

  return Math.max(0, Math.min(10, score))
}

// 実行
createLocationReviewList()
  .then(result => {
    console.log(`\n✅ 確認リスト作成完了!`)
    console.log(`   総数: ${result.total}件`)
    console.log(`   保持推奨: ${result.keep}件`)
    console.log(`   要確認: ${result.review}件`)
    console.log(`   削除推奨: ${result.delete}件`)
    console.log(`   CSVファイル: ${result.csv_file}`)
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })
