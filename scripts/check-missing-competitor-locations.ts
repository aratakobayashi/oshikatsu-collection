/**
 * 競合サイト vs 本番環境ロケーション比較
 * 競合サイト（8888-info.hatenablog.com）の朝ごはんシリーズロケーションと
 * 本番環境のロケーションを詳細比較して不足分を特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// 本番環境変数読み込み
dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 競合サイトの朝ごはんシリーズロケーション（完全版）
const competitorBreakfastLocations = [
  // 2025年
  '大衆焼肉 暴飲暴食',
  'ゴールドラッシュ渋谷本店', 
  'KIZASU.COFFEE',
  'ダイソー マロニエゲート銀座店',
  '餃子の王将 新橋駅前店',
  'ヒルトン東京 マーブルラウンジ',
  'OVERRIDE 神宮前',
  'Donish Coffee Company 神楽坂',
  '400℃ Pizza Tokyo 神楽坂店',
  'Paul Bassett',
  'スパイシー カレー 魯珈',
  'CozyStyleCOFFEE',
  '西公園',
  '博多元気一杯!!',
  'BLUE SIX COFFEE',
  'LATTE ART MANIA TOKYO',
  '佐野みそ 亀戸本店',
  
  // 2024年以前
  '熟豚三代目蔵司',
  '洋麺屋 五右衛門 赤坂店', 
  'かおたんラーメンえんとつ屋 南青山店',
  'dancyu食堂',
  '挽肉と米 渋谷店',
  'トーキョーアジフライ',
  '食事処 相州屋',
  '二丁目食堂トレド',
  '土鍋炊ごはん なかよし',
  '手しおごはん玄 新宿南口店',
  '赤坂ごはん 山ね家',
  'キッチンオリジン 赤坂店',
  '東京都庁第一庁舎32階職員食堂',
  'おひつ膳田んぼ',
  
  // 朝食アワード関連
  '伊東食堂',
  'あん梅',
  '筋肉食堂',
  '胡同',
  '相撲茶屋 寺尾',
  '秋葉原カリガリ',
  
  // その他追加調査分
  'ル・パン・コティディアン',
  'iki ESPRESSO'
]

async function getCurrentProductionLocations() {
  console.log('📍 本番環境ロケーション取得中...\n')
  
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, address')
    .order('name')
  
  if (error) {
    console.error('❌ ロケーション取得エラー:', error)
    return []
  }
  
  console.log(`📊 本番環境ロケーション総数: ${locations?.length || 0}件`)
  
  if (locations && locations.length > 0) {
    console.log('\n📋 本番環境ロケーション一覧:')
    locations.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`)
      if (loc.address) {
        console.log(`   ${loc.address}`)
      }
    })
  }
  
  return locations || []
}

async function compareWithCompetitor(productionLocations: any[]) {
  console.log('\n🔍 競合サイト vs 本番環境比較...\n')
  
  // 本番環境のロケーション名リスト作成
  const productionLocationNames = new Set(
    productionLocations.map(loc => loc.name.trim().toLowerCase())
  )
  
  console.log('📊 競合サイト朝ごはんシリーズロケーション分析:')
  console.log('='.repeat(60))
  
  const foundInProduction: string[] = []
  const missingFromProduction: string[] = []
  
  for (const [index, competitorLoc] of competitorBreakfastLocations.entries()) {
    const normalizedCompetitorName = competitorLoc.trim().toLowerCase()
    
    // 完全一致をチェック
    let found = productionLocationNames.has(normalizedCompetitorName)
    
    // 完全一致しない場合、部分一致をチェック
    if (!found) {
      found = Array.from(productionLocationNames).some(prodName => 
        prodName.includes(normalizedCompetitorName.split(' ')[0]) ||
        normalizedCompetitorName.includes(prodName.split(' ')[0])
      )
    }
    
    const status = found ? '✅' : '❌'
    console.log(`${status} ${index + 1}. ${competitorLoc}`)
    
    if (found) {
      foundInProduction.push(competitorLoc)
    } else {
      missingFromProduction.push(competitorLoc)
    }
  }
  
  console.log('\n📊 比較結果サマリー:')
  console.log('='.repeat(40))
  console.log(`✅ 本番にあるロケーション: ${foundInProduction.length}件`)
  console.log(`❌ 本番にないロケーション: ${missingFromProduction.length}件`)
  console.log(`📈 カバー率: ${Math.round((foundInProduction.length / competitorBreakfastLocations.length) * 100)}%`)
  
  if (missingFromProduction.length > 0) {
    console.log('\n❌ 本番に不足しているロケーション:')
    missingFromProduction.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc}`)
    })
  }
  
  return {
    total: competitorBreakfastLocations.length,
    found: foundInProduction.length,
    missing: missingFromProduction.length,
    missingList: missingFromProduction,
    foundList: foundInProduction
  }
}

async function checkAdditionalProductionLocations(productionLocations: any[]) {
  console.log('\n📍 本番独自のロケーション確認...\n')
  
  const competitorLocationNamesLower = new Set(
    competitorBreakfastLocations.map(name => name.trim().toLowerCase())
  )
  
  const uniqueToProduction = productionLocations.filter(loc => {
    const normalizedName = loc.name.trim().toLowerCase()
    return !competitorLocationNamesLower.has(normalizedName) &&
           !Array.from(competitorLocationNamesLower).some(compName => 
             compName.includes(normalizedName.split(' ')[0]) ||
             normalizedName.includes(compName.split(' ')[0])
           )
  })
  
  console.log(`🎯 本番独自ロケーション: ${uniqueToProduction.length}件`)
  
  if (uniqueToProduction.length > 0) {
    console.log('\n📋 本番独自ロケーション一覧:')
    uniqueToProduction.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.name}`)
      if (loc.address) {
        console.log(`   ${loc.address}`)
      }
    })
  }
  
  return uniqueToProduction
}

async function generateLocationReport(comparisonResult: any, uniqueLocations: any[]) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 競合サイト vs 本番環境 最終レポート')
  console.log('='.repeat(60))
  
  console.log(`🎯 競合サイトロケーション総数: ${comparisonResult.total}件`)
  console.log(`✅ 本番環境でカバー済み: ${comparisonResult.found}件 (${Math.round((comparisonResult.found / comparisonResult.total) * 100)}%)`)
  console.log(`❌ 本番環境で不足: ${comparisonResult.missing}件`)
  console.log(`🆕 本番環境独自: ${uniqueLocations.length}件`)
  
  if (comparisonResult.missing > 0) {
    console.log('\n🔧 推奨アクション:')
    console.log('以下のロケーションを本番環境に追加することを検討してください:')
    comparisonResult.missingList.forEach((loc: string, i: number) => {
      console.log(`${i + 1}. ${loc}`)
    })
  } else {
    console.log('\n🎉 完璧！競合サイトの全ロケーションをカバーしています')
  }
  
  const overallScore = comparisonResult.missing === 0 ? '優秀' : 
                       comparisonResult.found / comparisonResult.total > 0.8 ? '良好' : '要改善'
  
  console.log(`\n📈 総合評価: ${overallScore}`)
}

// メイン実行
async function main() {
  try {
    console.log('🔍 競合サイト vs 本番環境ロケーション比較開始\n')
    
    const productionLocations = await getCurrentProductionLocations()
    
    const comparisonResult = await compareWithCompetitor(productionLocations)
    
    const uniqueLocations = await checkAdditionalProductionLocations(productionLocations)
    
    await generateLocationReport(comparisonResult, uniqueLocations)
    
  } catch (error) {
    console.error('❌ 比較処理でエラー:', error)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}