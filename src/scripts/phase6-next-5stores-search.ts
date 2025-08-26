#!/usr/bin/env npx tsx

/**
 * Phase 6: 次の5店舗検索（20店舗達成に向けて）
 * より多様なキーワードで実在レストランを検索
 * 目標: 15店舗 → 20店舗（月間¥2,400達成）
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

async function phase6Next5StoresSearch() {
  console.log('🚀 Phase 6: 次の5店舗検索開始')
  console.log('🎯 20店舗達成で月間¥2,400目指す')
  console.log('📊 現在15店舗 → 目標20店舗')
  console.log('=' .repeat(60))
  
  // 現在の設定済み店舗確認
  const { data: currentStores } = await supabase
    .from('locations')
    .select('id, name')
    .not('tabelog_url', 'is', null)
  
  console.log(`📊 現在の設定済み: ${currentStores?.length || 0}件`)
  
  // より多様で詳細なレストラン検索キーワード
  const advancedKeywords = [
    // 高級レストラン・ホテル
    '帝国ホテル', 'Imperial Hotel', 'ホテルオークラ', 
    'パークハイアット', 'Park Hyatt', 'リッツカールトン',
    'コンラッド', 'Conrad', 'グランドハイアット',
    
    // 有名チェーン（まだ未実装）
    'ケンタッキー', 'KFC', 'ピザハット', 'Pizza Hut',
    'ドミノピザ', "Domino's", 'ピザーラ', 
    
    // カジュアルダイニング
    '大戸屋', 'OOTOYA', 'やよい軒', 'YAYOIKEN',
    'ココイチ', 'CoCo壱番屋', 'サブウェイ', 'SUBWAY',
    
    // 回転寿司・寿司
    'スシロー', 'Sushiro', 'はま寿司', 'かっぱ寿司',
    '魚べい', '元気寿司',
    
    // カフェ・コーヒー（新規）
    'タリーズ', 'TULLY', 'コメダ珈琲', 'KOMEDA',
    'ベローチェ', 'VELOCE', 'プロント', 'PRONTO',
    
    // 焼肉・韓国料理
    '叙々苑', '牛角', '安楽亭', '焼肉きんぐ',
    '焼肉ライク', '韓国料理', '韓国焼肉',
    
    // イタリアン・洋食
    'サイゼリヤ', 'Saizeriya', 'カプリチョーザ',
    'パスタ', 'イタリアン', 'ピッツェリア',
    
    // 和食・料亭
    '料亭', '割烹', '天ぷら', '蕎麦', 'うどん',
    '懐石', '会席', '日本料理',
    
    // バー・居酒屋
    'ワタミ', '白木屋', '魚民', '笑笑', '鳥貴族',
    'とりあえず吾平', '居酒屋', 'バー', 'Bar',
    
    // ベーカリー・スイーツ
    'アンデルセン', 'ANDERSEN', 'ヴィ・ド・フランス',
    'サンマルクカフェ', 'ケーキ', 'パティスリー',
    
    // 地域特色レストラン
    '銀座', '新宿', '渋谷', '六本木', '表参道',
    '恵比寿', '代官山', '青山', '麻布', '赤坂',
    
    // 料理ジャンル別
    'フレンチ', 'French', 'イタリアン', 'Italian',
    '中華', 'Chinese', 'タイ料理', 'Thai',
    'インド料理', 'Indian', 'メキシカン', 'Mexican'
  ]
  
  const foundCandidates: Array<{
    keyword: string,
    stores: Array<{id: string, name: string, address?: string}>
  }> = []
  
  console.log(`🔍 ${advancedKeywords.length}キーワードで詳細検索中...`)
  
  for (const keyword of advancedKeywords) {
    const { data: stores } = await supabase
      .from('locations')
      .select('id, name, address')
      .ilike('name', `%${keyword}%`)
      .is('tabelog_url', null) // 未設定のみ
      .limit(3)
    
    if (stores && stores.length > 0) {
      // より詳細な除外キーワード
      const excludeKeywords = [
        // 撮影・エンタメ関連
        '場所（', '撮影（', 'CV：', '#', 'feat.', 'MV', 'PV',
        'ミュージック', 'Music', 'ライブ', 'Live', 'コンサート',
        
        // 非レストラン施設
        'コスメ', 'ジュエリー', 'スタジオ', 'Studio', 
        '美術館', 'Museum', 'ギャラリー', 'Gallery',
        'ジム', 'Gym', 'フィットネス', 'Fitness',
        'アリーナ', 'Arena', 'ホール', 'Hall', '劇場',
        
        // 商業施設
        'ショップ', 'Shop', '店舗', '駅', 'Station', 
        '空港', 'Airport', 'ターミナル', 'Terminal',
        
        // 医療・教育
        '病院', 'Hospital', 'クリニック', 'Clinic',
        '学校', 'School', '大学', 'University', '専門学校',
        
        // 公共施設
        '公園', 'Park', 'プール', 'Pool', '図書館', 'Library',
        '市役所', '区役所', '役場',
        
        // 小売店
        'コンビニ', 'セブン', 'ローソン', 'ファミマ',
        'スーパー', 'イオン', 'イトーヨーカドー', 'マルエツ',
        
        // その他除外
        'ホテル客室', '会議室', 'オフィス', 'Office',
        '工場', 'Factory', '倉庫', 'Warehouse'
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
    
    await new Promise(resolve => setTimeout(resolve, 25))
  }
  
  console.log(`✅ 拡大候補発見: ${foundCandidates.length}カテゴリー`)
  
  // 多様性を重視した優先度順（候補数 × キーワードの質）
  const sortedCandidates = foundCandidates.sort((a, b) => {
    // 有名チェーンを優先
    const famousChains = ['KFC', 'ケンタッキー', 'ピザハット', 'サイゼリヤ', 'スシロー', '牛角', 'タリーズ']
    const aIsFamous = famousChains.some(chain => a.keyword.includes(chain))
    const bIsFamous = famousChains.some(chain => b.keyword.includes(chain))
    
    if (aIsFamous && !bIsFamous) return -1
    if (!aIsFamous && bIsFamous) return 1
    
    return b.stores.length - a.stores.length
  })
  
  console.log('\n📋 Phase 6拡大候補一覧（優先度順）:')
  sortedCandidates.slice(0, 20).forEach((candidate, index) => {
    console.log(`\n${index + 1}. 【${candidate.keyword}】 (${candidate.stores.length}候補)`)
    candidate.stores.forEach((store, storeIndex) => {
      console.log(`   ${storeIndex + 1}. ${store.name}`)
      console.log(`      住所: ${store.address || '未設定'}`)
      console.log(`      ID: ${store.id}`)
    })
  })
  
  // 実装推奨TOP15（多様性重視）
  console.log('\n' + '=' .repeat(60))
  console.log('🎯 Phase 6実装推奨TOP15（次の5店舗候補）')
  console.log('=' .repeat(60))
  
  const topCandidates = sortedCandidates.slice(0, 15)
  topCandidates.forEach((candidate, index) => {
    const bestStore = candidate.stores[0]
    console.log(`${index + 1}. 【${candidate.keyword}】${bestStore?.name}`)
    console.log(`   住所: ${bestStore?.address || '未設定'}`)
    console.log(`   候補数: ${candidate.stores.length}件`)
    console.log(`   ジャンル: ${getRestaurantGenre(candidate.keyword)}`)
    console.log(`   優先度: ${getFamousChainPriority(candidate.keyword)}`)
    console.log()
  })
  
  console.log('✨ Phase 6次のステップ:')
  console.log('1️⃣ TOP15から最も有望な5店舗を選択')
  console.log('2️⃣ WebSearchで各店舗の営業状況確認')
  console.log('3️⃣ Tabelogで正確なURL・評価確認')
  console.log('4️⃣ 品質保証プロセスで実装')
  console.log('5️⃣ 20店舗達成で月間¥2,400達成')
  
  return {
    total_categories: foundCandidates.length,
    total_candidates: foundCandidates.reduce((sum, cat) => sum + cat.stores.length, 0),
    top_recommendations: topCandidates.slice(0, 5).map(c => ({
      keyword: c.keyword,
      store_name: c.stores[0]?.name,
      store_id: c.stores[0]?.id,
      candidate_count: c.stores.length,
      genre: getRestaurantGenre(c.keyword)
    }))
  }
}

function getRestaurantGenre(keyword: string): string {
  if (['ケンタッキー', 'KFC', 'ピザハット'].includes(keyword)) return 'ファストフード'
  if (['スシロー', 'はま寿司'].includes(keyword)) return '回転寿司'
  if (['タリーズ', 'コメダ'].includes(keyword)) return 'カフェ'
  if (['牛角', '焼肉'].includes(keyword)) return '焼肉'
  if (['サイゼリヤ'].includes(keyword)) return 'ファミレス'
  if (['帝国ホテル', 'ホテル'].includes(keyword)) return 'ホテルレストラン'
  return 'その他レストラン'
}

function getFamousChainPriority(keyword: string): string {
  const famousChains = ['KFC', 'ケンタッキー', 'ピザハット', 'サイゼリヤ', 'スシロー', '牛角', 'タリーズ']
  return famousChains.some(chain => keyword.includes(chain)) ? '高（有名チェーン）' : '中（一般）'
}

phase6Next5StoresSearch()