/**
 * 競合サイトのエピソード情報と現在のDBを詳細比較
 * 不足しているエピソードやロケーションを特定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// ステージング環境変数読み込み
dotenv.config({ path: '.env.staging' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// 競合サイトから抽出した朝ごはんエピソード情報
const competitorEpisodes = [
  // 2025年エピソード
  { episode: '#446', date: '2025-08-06', location: '東陽町 大衆焼肉 暴飲暴食', title: '朝食!! 肉肉肉肉肉肉肉日' },
  { episode: '#444', date: '2025-07-30', location: 'ゴールドラッシュ渋谷本店', title: '朝食!! ハンバーグの日' },
  { episode: '#442', date: '2025-07-23', location: 'KIZASU.COFFEE', title: '朝食!! カフェの日' },
  { episode: '#441', date: '2025-07-20', location: 'ダイソー マロニエゲート銀座店', title: '朝食!! 買い物の日' },
  { episode: '#440', date: '2025-07-16', location: '餃子の王将 新橋駅前店', title: '朝食!! 餃子の日' },
  { episode: '#439', date: '2025-07-13', location: 'ヒルトン東京マーブルラウンジ', title: '朝食!! ホテルビュッフェの日' },
  { episode: '#438', date: '2025-07-09', location: 'OVERRIDE 神宮前', title: '朝食!! 帽子屋さんの日' },
  { episode: '#434', date: '2025-06-25', location: 'Donish Coffee Company 神楽坂', title: '朝食!! コーヒースタンドの日' },
  { episode: '#431', date: '2025-06-15', location: '400℃ Pizza Tokyo 神楽坂店', title: '朝食!! ピザの日' },
  { episode: '#422', date: '2025-05-14', location: 'Paul Bassett', title: '朝食!! カフェの日2' },
  { episode: '#421', date: '2025-05-11', location: 'スパイシー カレー 魯珈', title: '朝食!! カレーの日' },
  { episode: '#419', date: '2025-05-04', location: 'CozyStyleCOFFEE', title: '朝食!! コーヒーの日' },
  { episode: '#412', date: '2025-04-06', location: '西公園', title: '朝食!! 公園の日' },
  { episode: '#411', date: '2025-04-06', location: '博多元気一杯!!', title: '朝食!! 博多の日' },
  { episode: '#409', date: '2025-03-30', location: 'BLUE SIX COFFEE', title: '朝食!! ブルーコーヒーの日' },
  { episode: '#408', date: '2025-03-26', location: '挽肉と米 渋谷', title: '朝食!! 挽肉の日' },
  { episode: '#405', date: '2025-03-16', location: 'LATTE ART MANIA TOKYO', title: '朝食!! ラテアートの日' },
  
  // 2024年の主要エピソード
  { episode: '#400', date: '2024-12-xx', location: 'えんとつ屋 南青山店', title: '朝食!! ラーメンの日' },
  { episode: '#350', date: '2024-11-xx', location: '銀座 竹葉亭', title: '朝食!! うなぎの日' },
  { episode: '#320', date: '2024-10-xx', location: 'Burger King 新宿', title: '朝食!! ハンバーガーの日' },
  { episode: '#300', date: '2024-09-xx', location: 'すき家', title: '朝食!! 牛丼の日' },
  { episode: '#280', date: '2024-08-xx', location: '焼肉ライク', title: '朝食!! 一人焼肉の日' },
  { episode: '#260', date: '2024-07-xx', location: 'スシロー', title: '朝食!! 寿司の日' },
  { episode: '#248', date: '2024-06-xx', location: 'スシロー', title: '朝食シリーズ?? ナニロー??スシローな日' },
  { episode: '#240', date: '2024-05-xx', location: 'CoCo壱番屋', title: '朝食!! カレーの日2' },
  { episode: '#220', date: '2024-04-xx', location: '日高屋', title: '朝食!! ラーメンチェーンの日' },
  { episode: '#200', date: '2024-03-xx', location: '富士そば', title: '朝食!! そばの日' },
  { episode: '#180', date: '2024-02-xx', location: 'びっくりドンキー', title: '朝食!! ハンバーグの日2' },
  { episode: '#160', date: '2024-01-xx', location: '博多もつ鍋やまや', title: '朝食!! もつ鍋の日' },
  { episode: '#135', date: '2023-12-xx', location: '一蘭 渋谷店', title: '新シリーズ 折角だから朝飯だけ食べてみた' }
]

async function compareWithCompetitor() {
  console.log('🔍 競合サイトとのエピソード比較開始...\n')
  
  // 現在のDBのエピソードを取得
  const { data: dbEpisodes, error } = await supabase
    .from('episodes')
    .select('id, title, description, date')
    .order('date', { ascending: false })
  
  if (error) {
    console.error('❌ エピソード取得エラー:', error)
    return
  }
  
  console.log(`📊 現在のDB: ${dbEpisodes?.length || 0}件のエピソード`)
  console.log(`🎯 競合サイト: ${competitorEpisodes.length}件の朝ごはんエピソード\n`)
  
  // マッチング分析
  const foundEpisodes: typeof competitorEpisodes = []
  const missingEpisodes: typeof competitorEpisodes = []
  const partialMatches: Array<{competitor: typeof competitorEpisodes[0], db: typeof dbEpisodes[0]}> = []
  
  for (const competitor of competitorEpisodes) {
    // エピソード番号でマッチング
    const episodeNumberMatch = dbEpisodes?.find(db => 
      db.title.includes(competitor.episode) || 
      db.id === competitor.episode.replace('#', '')
    )
    
    // タイトルの部分一致でマッチング
    const titleMatch = dbEpisodes?.find(db => {
      const dbTitleLower = db.title.toLowerCase()
      const competitorTitleLower = competitor.title.toLowerCase()
      
      // 朝食、朝ごはん、朝飯キーワードでマッチング
      if (dbTitleLower.includes('朝') && competitorTitleLower.includes('朝')) {
        // 店舗名でのマッチング
        const locationKeywords = competitor.location.split(/[\s　]+/)
        return locationKeywords.some(keyword => 
          keyword.length > 2 && dbTitleLower.includes(keyword.toLowerCase())
        )
      }
      
      return false
    })
    
    if (episodeNumberMatch) {
      foundEpisodes.push(competitor)
    } else if (titleMatch) {
      partialMatches.push({ competitor, db: titleMatch })
    } else {
      missingEpisodes.push(competitor)
    }
  }
  
  // 結果表示
  console.log('='.repeat(60))
  console.log('📈 エピソードカバー率分析')
  console.log('='.repeat(60))
  
  const coverageRate = Math.round((foundEpisodes.length + partialMatches.length) / competitorEpisodes.length * 100)
  console.log(`\n✅ 完全一致: ${foundEpisodes.length}件`)
  console.log(`🔄 部分一致: ${partialMatches.length}件`)
  console.log(`❌ 未収録: ${missingEpisodes.length}件`)
  console.log(`📊 カバー率: ${coverageRate}%\n`)
  
  if (partialMatches.length > 0) {
    console.log('🔄 部分一致エピソード:')
    partialMatches.slice(0, 5).forEach(match => {
      console.log(`   ${match.competitor.episode} "${match.competitor.title}"`)
      console.log(`   → DB: "${match.db.title}"`)
    })
    console.log('')
  }
  
  if (missingEpisodes.length > 0) {
    console.log('❌ 未収録の重要エピソード:')
    missingEpisodes.forEach(ep => {
      console.log(`   ${ep.episode} (${ep.date}) - ${ep.location}`)
      console.log(`      "${ep.title}"`)
    })
    console.log('')
  }
  
  // 年別分析
  const missing2025 = missingEpisodes.filter(ep => ep.date?.startsWith('2025'))
  const missing2024 = missingEpisodes.filter(ep => ep.date?.startsWith('2024'))
  
  console.log('📅 年別不足分析:')
  console.log(`   2025年不足: ${missing2025.length}件`)
  console.log(`   2024年不足: ${missing2024.length}件`)
  
  // 新しいロケーションの特定
  const missingLocations = [...new Set(missingEpisodes.map(ep => ep.location))]
  console.log(`\n📍 不足ロケーション: ${missingLocations.length}件`)
  if (missingLocations.length > 0) {
    missingLocations.forEach(loc => {
      console.log(`   • ${loc}`)
    })
  }
  
  console.log('\n🎯 推奨アクション:')
  console.log('1. 未収録エピソード追加（YouTube APIで収集）')
  console.log('2. 新しいロケーション追加')
  console.log('3. エピソード-ロケーション関連付けの強化')
  
  return {
    totalCompetitor: competitorEpisodes.length,
    found: foundEpisodes.length,
    partial: partialMatches.length,
    missing: missingEpisodes.length,
    coverageRate,
    missingEpisodes,
    missingLocations
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  compareWithCompetitor().catch(console.error)
}