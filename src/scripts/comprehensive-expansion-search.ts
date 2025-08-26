#!/usr/bin/env npx tsx

/**
 * 包括的拡大候補検索
 * データベース全体から実在レストランを幅広く検索
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: resolve(__dirname, '../../.env.production') })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function comprehensiveExpansionSearch() {
  console.log('🔍 包括的拡大候補検索開始')
  console.log('🎯 データベース全体から有望な店舗を発見')
  console.log('=' .repeat(60))
  
  // 現在の設定済み店舗確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id, name')
    .not('tabelog_url', 'is', null)
  
  console.log(`📊 現在の設定済み: ${currentStores?.length || 0}件`)
  
  // より包括的なレストラン検索キーワード
  const restaurantKeywords = [
    // ファストフード・チェーン
    'ケンタッキー', 'KFC', 'ピザハット', 'Pizza Hut',
    'ドミノピザ', 'Domino', 'ピザーラ', 
    
    // 牛丼・丼チェーン
    '吉野家', '松屋', 'なか卯', '天丼',
    
    // カフェ・コーヒー
    'タリーズ', 'TULLY', 'コメダ', 'KOMEDA',
    'ベローチェ', 'VELOCE', 'プロント', 'PRONTO',
    'エクセルシオール', 'EXCELSIOR',
    
    // ファミレス
    'ガスト', 'GUSTO', 'サイゼリヤ', 'Saizeriya',
    'デニーズ', 'DENNY', 'ココス', 'COCO',
    'ジョナサン', 'Jonathan', 'バーミヤン',
    
    // ラーメン・うどん
    'リンガーハット', '丸亀製麺', 'はなまるうどん',
    '幸楽苑', '天下一品',
    
    // 寿司・回転寿司
    'スシロー', 'はま寿司', 'かっぱ寿司',
    
    // 居酒屋
    'ワタミ', '白木屋', '魚民', '笑笑',
    'とりあえず吾平', '鳥貴族',
    
    // ベーカリー・パン
    'サンマルクカフェ', 'ヴィ・ド・フランス',
    'アンデルセン',
    
    // その他チェーン
    '一風堂', '大戸屋', '和食さと', '温野菜',
    'しゃぶしゃぶ温野菜', 'カレーハウス',
    
    // 一般的なレストラン名
    'レストラン', 'カフェ', 'Cafe', 'CAFE',
    'グリル', 'ダイニング', 'ビストロ', 'Bistro',
    'ラウンジ', 'Lounge', 'バー', 'Bar',
    'イタリアン', 'フレンチ', '中華', '洋食',
    '和食', '寿司', '焼肉', 'ステーキ',
    'パスタ', 'ピザ', 'Pizza', 'ハンバーガー'
  ]
  
  const foundCandidates: Array<{
    keyword: string,
    stores: Array<{id: string, name: string, address?: string}>
  }> = []
  
  console.log(`🔍 ${restaurantKeywords.length}キーワードで検索中...`)
  
  for (const keyword of restaurantKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null) // 未設定のみ
      .limit(5)
    
    if (stores && stores.length > 0) {
      // 除外キーワード（撮影場所や非レストラン）
      const excludeKeywords = [
        '場所（', '撮影（', 'CV：', '#', 'feat.', 'MV', 'PV',
        'コスメ', 'ジュエリー', 'スタジオ', '美術館', 'museum',
        'ジム', 'Gym', 'アリーナ', 'Arena', 'ホール', 'Hall',
        'ショップ', 'Shop', '駅', 'Station', '空港', 'Airport',
        '病院', 'Hospital', 'クリニック', 'Clinic',
        '学校', 'School', '大学', 'University',
        '公園', 'Park', 'プール', 'Pool',
        'コンビニ', 'セブン', 'ローソン', 'ファミマ',
        'スーパー', 'イオン', 'イトーヨーカドー'
      ]
      
      const validStores = stores.filter(store => {
        return !excludeKeywords.some(exclude => store.name.includes(exclude))
      })
      
      if (validStores.length > 0) {
        foundCandidates.push({
          keyword,
          stores: validStores
        })
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 30))
  }
  
  console.log(`✅ 拡大候補発見: ${foundCandidates.length}カテゴリー`)
  
  // 優先度順で表示（候補数が多い順）
  const sortedCandidates = foundCandidates.sort((a, b) => b.stores.length - a.stores.length)
  
  console.log('\n📋 拡大候補一覧（優先度順）:')
  sortedCandidates.slice(0, 15).forEach((candidate, index) => {
    console.log(`\n${index + 1}. 【${candidate.keyword}】 (${candidate.stores.length}候補)`)
    candidate.stores.forEach((store, storeIndex) => {
      console.log(`   ${storeIndex + 1}. ${store.name}`)
      console.log(`      住所: ${store.address || '未設定'}`)
      console.log(`      ID: ${store.id}`)
    })
  })
  
  // 実装推奨TOP10
  console.log('\n' + '=' .repeat(60))
  console.log('🏆 実装推奨TOP10（次の拡大候補）')
  console.log('=' .repeat(60))
  
  const topCandidates = sortedCandidates.slice(0, 10)
  topCandidates.forEach((candidate, index) => {
    const bestStore = candidate.stores[0]
    console.log(`${index + 1}. 【${candidate.keyword}】${bestStore?.name}`)
    console.log(`   住所: ${bestStore?.address || '未設定'}`)
    console.log(`   候補数: ${candidate.stores.length}件`)
    console.log(`   推奨理由: 有名キーワード・複数候補`)
    console.log()
  })
  
  console.log('✨ 次のステップ:')
  console.log('1️⃣ TOP10から3-5店舗を選択')
  console.log('2️⃣ WebSearchで営業状況確認')
  console.log('3️⃣ Tabelogで正確なURL取得')
  console.log('4️⃣ 品質保証プロセスで実装')
  console.log('5️⃣ 15店舗達成で月間¥1,800目指す')
  
  return {
    total_categories: foundCandidates.length,
    total_candidates: foundCandidates.reduce((sum, cat) => sum + cat.stores.length, 0),
    top_recommendations: topCandidates.slice(0, 5).map(c => ({
      keyword: c.keyword,
      store_name: c.stores[0]?.name,
      store_id: c.stores[0]?.id,
      candidate_count: c.stores.length
    }))
  }
}

comprehensiveExpansionSearch()