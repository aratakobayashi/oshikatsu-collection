#!/usr/bin/env node

/**
 * ロングテール強化・タベログ情報抽出の実行可能性調査
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function analyzeLongtailOpportunities() {
  console.log('🔍 ロングテール・タベログ情報抽出の実行可能性調査')
  console.log('='.repeat(60))

  // セレブリティ別のロケーション数を調査
  const { data: celebrities } = await supabase
    .from('celebrities')
    .select(`
      id, name, slug,
      episode_locations(
        location_id,
        locations(id, name, address, tabelog_url)
      )
    `)

  if (!celebrities) return

  console.log('📊 【ロングテール機会分析】')
  console.log('='.repeat(40))

  const longtailOpportunities = celebrities
    .map(celeb => {
      const locations = celeb.episode_locations?.map(el => el.locations).filter(Boolean) || []
      const withTabelog = locations.filter(loc => loc.tabelog_url).length
      
      return {
        name: celeb.name,
        slug: celeb.slug,
        total_locations: locations.length,
        with_tabelog: withTabelog,
        tabelog_percentage: locations.length > 0 ? Math.round((withTabelog / locations.length) * 100) : 0,
        potential_pages: locations.length > 2 ? 2 : 0, // ロケ地 + 行きつけ店
        seo_value: locations.length * (celeb.name.includes('Snow Man') || celeb.name.includes('SixTONES') ? 10 : 5)
      }
    })
    .filter(celeb => celeb.total_locations >= 3) // 3箇所以上のセレブのみ
    .sort((a, b) => b.seo_value - a.seo_value)

  console.log('🏆 【TOP10】ロングテールページ作成候補:')
  longtailOpportunities.slice(0, 10).forEach((celeb, i) => {
    console.log(`\n${i + 1}. ${celeb.name}`)
    console.log(`   📍 関連ロケーション: ${celeb.total_locations}箇所`)
    console.log(`   🍽️  タベログ対応: ${celeb.with_tabelog}箇所 (${celeb.tabelog_percentage}%)`)
    console.log(`   📄 作成可能ページ: ${celeb.potential_pages}ページ`)
    console.log(`   💰 SEO価値スコア: ${celeb.seo_value}`)
    console.log(`   🔗 予想URL: /celebrities/${celeb.slug}/locations, /celebrities/${celeb.slug}/restaurants`)
  })

  // タベログ情報抽出の現実性調査
  console.log('\n🍽️ 【タベログ情報抽出の現実性調査】')
  console.log('='.repeat(40))

  const { data: tabelogLocations } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, phone, opening_hours')
    .not('tabelog_url', 'is', null)

  if (tabelogLocations) {
    const totalWithTabelog = tabelogLocations.length
    const missingPhone = tabelogLocations.filter(loc => !loc.phone).length
    const missingHours = tabelogLocations.filter(loc => !loc.opening_hours).length

    console.log(`📊 タベログURL設定済み: ${totalWithTabelog}箇所`)
    console.log(`📞 電話番号不足: ${missingPhone}箇所 (${Math.round((missingPhone/totalWithTabelog)*100)}%)`)
    console.log(`🕐 営業時間不足: ${missingHours}箇所 (${Math.round((missingHours/totalWithTabelog)*100)}%)`)

    // サンプルのタベログURLを調査
    console.log('\n📋 【サンプルタベログURL】（情報抽出可能性確認用）:')
    tabelogLocations.slice(0, 5).forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`)
      console.log(`   URL: ${loc.tabelog_url}`)
      console.log(`   現在の情報: 電話${loc.phone ? 'あり' : 'なし'} / 営業時間${loc.opening_hours ? 'あり' : 'なし'}`)
    })

    console.log('\n🤖 【情報抽出の技術的アプローチ】')
    console.log('Option A: 手動コピペ（最も確実）')
    console.log(`  - 作業量: ${missingPhone}箇所 × 2分 = ${Math.ceil(missingPhone * 2 / 60)}時間`)
    console.log(`  - 成功率: 95%以上`)
    console.log(`  - リスク: なし`)

    console.log('\nOption B: タベログAPIの調査')
    console.log(`  - 公式API存在確認が必要`)
    console.log(`  - パートナー契約の可能性`)
    console.log(`  - 成功率: 不明（要調査）`)

    console.log('\nOption C: 構造化データの活用')
    console.log(`  - タベログページ内の構造化データを調査`)
    console.log(`  - schema.orgマークアップの有無確認`)
    console.log(`  - 成功率: 要調査`)
  }

  // 具体的なロングテールページのモックアップ
  console.log('\n📄 【具体的なページ例】')
  console.log('='.repeat(40))
  
  const topCeleb = longtailOpportunities[0]
  if (topCeleb) {
    console.log(`\n🎬 ${topCeleb.name}の聖地巡礼ガイド`)
    console.log(`URL: /celebrities/${topCeleb.slug}/locations`)
    console.log(``)
    console.log(`内容例:`)
    console.log(`- ${topCeleb.name}関連ロケ地 ${topCeleb.total_locations}箇所の地図`)
    console.log(`- 各ロケ地の詳細（住所・アクセス・エピソード）`)
    console.log(`- おすすめ聖地巡礼ルート`)
    console.log(`- ファンの投稿写真・レビュー`)
    console.log(`- 関連グッズ・アイテム情報`)
    console.log(``)
    console.log(`SEO効果:`)
    console.log(`- 「${topCeleb.name} ロケ地」での上位表示`)
    console.log(`- 「${topCeleb.name} 聖地巡礼」でのロングテール獲得`)
    console.log(`- 月間検索数: 推定1,000-5,000回`)
  }

  console.log('\n💡 【実装の現実性評価】')
  console.log('='.repeat(40))
  console.log('✅ ロングテールページ作成: 実装容易（既存データ活用）')
  console.log('✅ 手動でのタベログ情報追加: 確実で低リスク')
  console.log('❓ 自動情報抽出: 技術調査が必要')
  console.log('🎯 推奨: 手動作業 + 段階的自動化')

  return {
    longtail_opportunities: longtailOpportunities.slice(0, 10),
    tabelog_info_gap: { phone: missingPhone, hours: missingHours }
  }
}

// 実行
analyzeLongtailOpportunities()
  .then(results => {
    if (results) {
      console.log(`\n✅ 分析完了!`)
      console.log(`   ロングテール機会: ${results.longtail_opportunities.length}セレブリティ`)
      console.log(`   タベログ情報不足: 電話${results.tabelog_info_gap.phone}件、営業時間${results.tabelog_info_gap.hours}件`)
    }
  })
  .catch(error => {
    console.error('❌ エラー:', error)
  })