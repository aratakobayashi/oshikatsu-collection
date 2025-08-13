/**
 * 朝ごはんシリーズのロケーションカバー率検証
 * 競合サイトと比較して不足分を特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 競合サイトから抽出した朝ごはんロケーション（主要な店舗）
const competitorLocations = [
  // 2025年の主要店舗
  { name: '大衆焼肉 暴飲暴食', area: '東陽町', type: '焼肉' },
  { name: 'ゴールドラッシュ渋谷本店', area: '渋谷', type: 'ハンバーグ' },
  { name: 'KIZASU.COFFEE', area: '新橋', type: 'カフェ' },
  { name: '餃子の王将 新橋駅前店', area: '新橋', type: '中華' },
  { name: 'ヒルトン東京マーブルラウンジ', area: '西新宿', type: 'ホテル' },
  { name: 'Donish Coffee Company 神楽坂', area: '神楽坂', type: 'カフェ' },
  { name: '400℃ Pizza Tokyo 神楽坂店', area: '神楽坂', type: 'ピザ' },
  { name: 'スパイシー カレー 魯珈', area: '新宿', type: 'カレー' },
  { name: '挽肉と米 渋谷', area: '渋谷', type: '定食' },
  { name: '佐野みそ 亀戸本店', area: '亀戸', type: 'ラーメン' },
  
  // 2024年の主要店舗
  { name: 'えんとつ屋', area: '南青山', type: 'ラーメン' },
  { name: '南青山 えんとつ屋', area: '南青山', type: 'ラーメン' },
  { name: '銀座 竹葉亭', area: '銀座', type: 'うなぎ' },
  { name: 'Burger King', area: '新宿', type: 'ハンバーガー' },
  { name: 'すき家', area: '各地', type: '牛丼' },
  { name: '焼肉ライク', area: '新宿西口', type: '焼肉' },
  { name: 'スシロー', area: '渋谷', type: '寿司' },
  { name: 'CoCo壱番屋', area: '新宿', type: 'カレー' },
  { name: '日高屋', area: '渋谷', type: 'ラーメン' },
  { name: '富士そば', area: '新宿', type: 'そば' },
  
  // その他の重要店舗
  { name: 'びっくりドンキー', area: '渋谷', type: 'ハンバーグ' },
  { name: '博多もつ鍋やまや', area: '新宿', type: 'もつ鍋' },
  { name: '一蘭', area: '渋谷', type: 'ラーメン' },
  { name: '海老名SA', area: '海老名', type: 'サービスエリア' }
]

async function verifyBreakfastLocations() {
  console.log('🔍 朝ごはんロケーションのカバー率検証開始...\n')
  
  // 現在のDBのロケーションを取得
  const { data: dbLocations, error } = await supabase
    .from('locations')
    .select('*')
  
  if (error) {
    console.error('❌ ロケーション取得エラー:', error)
    return
  }
  
  console.log(`📊 現在のDB: ${dbLocations?.length || 0}件のロケーション`)
  console.log(`🎯 競合サイト: ${competitorLocations.length}件の主要朝ごはんロケーション\n`)
  
  // マッチング分析
  const found: typeof competitorLocations = []
  const notFound: typeof competitorLocations = []
  const partialMatch: typeof competitorLocations = []
  
  for (const competitor of competitorLocations) {
    const dbMatch = dbLocations?.find(db => {
      const dbNameLower = db.name.toLowerCase()
      const competitorNameLower = competitor.name.toLowerCase()
      
      // 完全一致または部分一致をチェック
      if (dbNameLower === competitorNameLower) return true
      if (dbNameLower.includes(competitorNameLower)) return true
      if (competitorNameLower.includes(dbNameLower)) return true
      
      // 主要キーワードでマッチング
      const keywords = competitor.name.split(/[\s　]+/)
      return keywords.some(keyword => 
        keyword.length > 2 && dbNameLower.includes(keyword.toLowerCase())
      )
    })
    
    if (dbMatch) {
      if (dbMatch.name.toLowerCase() === competitor.name.toLowerCase()) {
        found.push(competitor)
      } else {
        partialMatch.push(competitor)
        console.log(`🔄 部分一致: "${competitor.name}" → "${dbMatch.name}"`)
      }
    } else {
      notFound.push(competitor)
    }
  }
  
  // 結果表示
  console.log('\n' + '='.repeat(60))
  console.log('📈 カバー率分析結果')
  console.log('='.repeat(60))
  
  const coverageRate = Math.round((found.length + partialMatch.length) / competitorLocations.length * 100)
  console.log(`\n✅ 完全一致: ${found.length}件`)
  console.log(`🔄 部分一致: ${partialMatch.length}件`)
  console.log(`❌ 未登録: ${notFound.length}件`)
  console.log(`📊 カバー率: ${coverageRate}%\n`)
  
  if (found.length > 0) {
    console.log('✅ 登録済みの主要店舗:')
    found.slice(0, 5).forEach(loc => {
      console.log(`   • ${loc.name} (${loc.area})`)
    })
  }
  
  if (notFound.length > 0) {
    console.log('\n❌ 未登録の重要店舗（追加が必要）:')
    notFound.forEach(loc => {
      console.log(`   • ${loc.name} (${loc.area}) - ${loc.type}`)
    })
  }
  
  // 朝ごはんエピソードの確認
  console.log('\n📺 朝ごはん関連エピソードを確認中...')
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title, description')
    .or('title.ilike.%朝%,title.ilike.%モーニング%,title.ilike.%breakfast%')
    .limit(10)
  
  console.log(`   朝ごはん関連エピソード: ${episodes?.length || 0}件`)
  
  if (episodes && episodes.length > 0) {
    console.log('\n📝 朝ごはんエピソード例:')
    episodes.slice(0, 3).forEach(ep => {
      console.log(`   • ${ep.title.substring(0, 50)}...`)
    })
  }
  
  // 改善提案
  console.log('\n🎯 改善提案:')
  console.log('1. 未登録の重要店舗を優先的に追加')
  console.log('2. 特に「えんとつ屋（南青山）」「銀座 竹葉亭」など人気店を追加')
  console.log('3. エピソードとロケーションの関連付けを強化')
  console.log('4. 朝ごはんシリーズ専用のタグやカテゴリを導入')
  
  return {
    total: competitorLocations.length,
    found: found.length,
    partial: partialMatch.length,
    missing: notFound.length,
    coverageRate,
    missingLocations: notFound
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  verifyBreakfastLocations().catch(console.error)
}