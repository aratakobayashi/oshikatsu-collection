#!/usr/bin/env node

/**
 * SEOコンテンツ分析スクリプト
 * 現在のコンテンツ状況とSEO戦略の評価
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeSEOContent() {
  console.log('🔍 SEOコンテンツ分析レポート')
  console.log('='.repeat(50))

  try {
    // 1. セレブリティデータ分析
    console.log('\n👨‍🎤 セレブリティデータ分析:')
    const { data: celebrities, error: celError } = await supabase
      .from('celebrities')
      .select('id, name, slug, description, image_url')

    if (!celError && celebrities) {
      const totalCelebrities = celebrities.length
      const withImages = celebrities.filter(c => c.image_url).length
      const withDescriptions = celebrities.filter(c => c.description).length
      const withSlugs = celebrities.filter(c => c.slug).length

      console.log(`  📊 総数: ${totalCelebrities}名`)
      console.log(`  🖼️  画像あり: ${withImages}/${totalCelebrities} (${Math.round(withImages/totalCelebrities*100)}%)`)
      console.log(`  📝 説明文あり: ${withDescriptions}/${totalCelebrities} (${Math.round(withDescriptions/totalCelebrities*100)}%)`)
      console.log(`  🔗 SEO対応スラッグ: ${withSlugs}/${totalCelebrities} (${Math.round(withSlugs/totalCelebrities*100)}%)`)

      // 人気セレブリティのサンプル
      console.log('\n  📈 代表的なセレブリティ:')
      celebrities.slice(0, 5).forEach(cel => {
        const seoScore = [cel.image_url, cel.description, cel.slug].filter(Boolean).length
        console.log(`    - ${cel.name}: SEOスコア ${seoScore}/3`)
      })
    }

    // 2. エピソードデータ分析
    console.log('\n🎬 エピソードデータ分析:')
    const { data: episodes, error: epError } = await supabase
      .from('episodes')
      .select('id, title, description, thumbnail_url, created_at')

    if (!epError && episodes) {
      const totalEpisodes = episodes.length
      const withThumbnails = episodes.filter(e => e.thumbnail_url).length
      const withDescriptions = episodes.filter(e => e.description).length
      const recentEpisodes = episodes.filter(e => 
        new Date(e.created_at) > new Date('2024-01-01')
      ).length

      console.log(`  📊 総数: ${totalEpisodes}話`)
      console.log(`  🖼️  サムネイルあり: ${withThumbnails}/${totalEpisodes} (${Math.round(withThumbnails/totalEpisodes*100)}%)`)
      console.log(`  📝 説明文あり: ${withDescriptions}/${totalEpisodes} (${Math.round(withDescriptions/totalEpisodes*100)}%)`)
      console.log(`  🆕 2024年以降: ${recentEpisodes}/${totalEpisodes} (${Math.round(recentEpisodes/totalEpisodes*100)}%)`)
    }

    // 3. ロケーションデータ分析
    console.log('\n📍 ロケーションデータ分析:')
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, address, description, tabelog_url, phone, opening_hours, tags')

    if (!locError && locations) {
      const totalLocations = locations.length
      const withAddress = locations.filter(l => l.address).length
      const withDescription = locations.filter(l => l.description).length
      const withTabelog = locations.filter(l => l.tabelog_url).length
      const withPhone = locations.filter(l => l.phone).length
      const withHours = locations.filter(l => l.opening_hours).length
      const withTags = locations.filter(l => l.tags && l.tags.length > 0).length

      console.log(`  📊 総数: ${totalLocations}箇所`)
      console.log(`  🏠 住所あり: ${withAddress}/${totalLocations} (${Math.round(withAddress/totalLocations*100)}%)`)
      console.log(`  📝 説明文あり: ${withDescription}/${totalLocations} (${Math.round(withDescription/totalLocations*100)}%)`)
      console.log(`  🍽️ タベログURL: ${withTabelog}/${totalLocations} (${Math.round(withTabelog/totalLocations*100)}%)`)
      console.log(`  📞 電話番号: ${withPhone}/${totalLocations} (${Math.round(withPhone/totalLocations*100)}%)`)
      console.log(`  🕒 営業時間: ${withHours}/${totalLocations} (${Math.round(withHours/totalLocations*100)}%)`)
      console.log(`  🏷️ タグ設定: ${withTags}/${totalLocations} (${Math.round(withTags/totalLocations*100)}%)`)
    }

    // 4. アイテムデータ分析
    console.log('\n👕 アイテムデータ分析:')
    const { data: items, error: itemError } = await supabase
      .from('items')
      .select('id, name, description, brand, price, purchase_url, category, tags')

    if (!itemError && items) {
      const totalItems = items.length
      const withBrand = items.filter(i => i.brand).length
      const withPrice = items.filter(i => i.price).length
      const withPurchaseUrl = items.filter(i => i.purchase_url).length
      const withCategory = items.filter(i => i.category).length
      const withTags = items.filter(i => i.tags && i.tags.length > 0).length

      console.log(`  📊 総数: ${totalItems}件`)
      console.log(`  🏷️ ブランド情報: ${withBrand}/${totalItems} (${Math.round(withBrand/totalItems*100)}%)`)
      console.log(`  💰 価格情報: ${withPrice}/${totalItems} (${Math.round(withPrice/totalItems*100)}%)`)
      console.log(`  🛒 購入URL: ${withPurchaseUrl}/${totalItems} (${Math.round(withPurchaseUrl/totalItems*100)}%)`)
      console.log(`  📂 カテゴリ: ${withCategory}/${totalItems} (${Math.round(withCategory/totalItems*100)}%)`)
      console.log(`  🏷️ タグ設定: ${withTags}/${totalItems} (${Math.round(withTags/totalItems*100)}%)`)
    }

    // 5. SEO課題と優先施策の特定
    console.log('\n🎯 SEO分析結果とおすすめ施策:')
    console.log('='.repeat(50))

    console.log('\n✅ 既に対応済み（優秀！）:')
    console.log('  • メタタグ・OGP設定システム')
    console.log('  • 構造化データ実装')
    console.log('  • サイトマップ生成')
    console.log('  • URLスラッグ最適化')
    console.log('  • 画像最適化システム')

    console.log('\n🚀 優先度【高】施策:')
    const highPriorityTasks = []
    
    if (locations && locations.filter(l => l.description).length / locations.length < 0.8) {
      highPriorityTasks.push('ロケーション詳細説明の拡充')
    }
    if (locations && locations.filter(l => l.tabelog_url).length / locations.length < 0.9) {
      highPriorityTasks.push('タベログURLの完全対応')
    }
    if (celebrities && celebrities.filter(c => c.description).length / celebrities.length < 0.9) {
      highPriorityTasks.push('セレブリティプロフィールの拡充')
    }

    highPriorityTasks.forEach((task, index) => {
      console.log(`  ${index + 1}. ${task}`)
    })

    console.log('\n⭐ 優先度【中】施策:')
    console.log('  1. ロングテールキーワード対応記事の追加')
    console.log('  2. 店舗営業時間・電話番号の情報拡充')
    console.log('  3. ユーザーレビュー・評価機能の追加')
    console.log('  4. パンくずナビゲーションの改善')

    console.log('\n💡 優先度【低】施策:')
    console.log('  1. 多言語対応（英語版）')
    console.log('  2. AMP対応')
    console.log('  3. PWA機能の拡張')

    console.log('\n🎯 具体的なターゲットキーワード提案:')
    if (celebrities) {
      const topCelebs = celebrities.slice(0, 3)
      topCelebs.forEach(celeb => {
        console.log(`\n  "${celeb.name}" 関連:`)
        console.log(`    • "${celeb.name} ロケ地"`)
        console.log(`    • "${celeb.name} 行きつけの店"`)
        console.log(`    • "${celeb.name} 推し活 聖地巡礼"`)
        console.log(`    • "${celeb.name} 私服 ブランド"`)
      })
    }

    console.log('\n📈 SEO効果測定のおすすめ:')
    console.log('  • Google Analytics 4 のコンバージョン設定')
    console.log('  • Search Console パフォーマンス監視')
    console.log('  • Core Web Vitals の定期チェック')
    console.log('  • 競合サイトとのキーワード比較')

  } catch (error) {
    console.error('❌ 分析エラー:', error)
  }
}

analyzeSEOContent()