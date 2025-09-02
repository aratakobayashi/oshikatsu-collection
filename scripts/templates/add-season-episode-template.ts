#!/usr/bin/env node

/**
 * 新規エピソード追加テンプレート
 * Season5以降のエピソード追加時に使用
 * 
 * 使用方法:
 * 1. このファイルをコピーして新しい名前で保存
 * 2. 必要な情報を正確に入力
 * 3. 全ての検証項目をチェック
 * 4. 実行前に再度確認
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ==========================================
// 🚨 必須入力項目 - 正確な情報を入力してください
// ==========================================

const EPISODE_INFO = {
  // エピソード情報（例：Season5 第1話）
  season: 'Season5',
  episodeNumber: 1,
  title: 'Season5 第1話「エリア名の料理名」', // 正確なタイトル
  description: 'エピソードの説明文',
  
  // エピソードから抽出した期待値
  expectedArea: 'エリア名', // タイトルから抽出（例：渋谷区、横浜市）
  expectedCuisine: '料理ジャンル', // タイトルから抽出（例：ラーメン、寿司）
}

const RESTAURANT_DATA = {
  // 店舗情報（🚨要事前調査・検証🚨）
  name: '正確な店舗名',
  slug: 'restaurant-slug-season5-ep1', // 英数字とハイフンのみ
  address: '完全な住所（郵便番号から）',
  description: 'エピソード内容と一致する説明文。孤独のグルメSeason5第X話で松重豊が訪問し、[料理名]を堪能した実際のロケ地。',
  
  // タベログ情報（🚨必須検証🚨）
  tabelog_url: 'https://tabelog.com/.../', // 実際にアクセス確認済み
  tabelog_rating: '3.XX', // タベログの評価
  
  // 店舗詳細（🚨正確性必須🚨）
  restaurant_type: '料理ジャンル・店舗タイプ',
  signature_dish: 'エピソードで登場した料理名、その他名物料理',
  price_range: '1000-2000円', // 価格帯
  business_hours: '営業時間',
  closed: '定休日',
  phone: '電話番号',
  
  // 営業状況（🚨要確認🚨）
  business_status: 'active', // active|moved|permanently_closed
  
  // アクセス情報
  access: '最寄り駅からのアクセス情報'
}

// ==========================================
// 🔍 事前検証チェックリスト - 全て確認済みですか？
// ==========================================

const PRE_VALIDATION_CHECKLIST = {
  // エピソード情報確認
  episodeTitleAccurate: false, // ✅ エピソードタイトルが正確
  episodeAreaExtracted: false, // ✅ エリア情報をタイトルから正確に抽出
  episodeCuisineExtracted: false, // ✅ 料理ジャンルをタイトルから正確に抽出
  
  // 店舗情報確認  
  restaurantNameVerified: false, // ✅ 店舗名がエピソード内容と一致
  restaurantAddressVerified: false, // ✅ 住所がエピソードエリアと一致
  restaurantCuisineMatched: false, // ✅ 料理ジャンルがエピソード内容と一致
  
  // タベログURL確認
  tabelogUrlAccessed: false, // ✅ タベログURLにアクセスして内容確認済み
  tabelogRestaurantNameMatch: false, // ✅ タベログの店舗名が一致
  tabelogAddressMatch: false, // ✅ タベログの住所がエピソードエリアと一致
  tabelogCuisineMatch: false, // ✅ タベログの料理ジャンルが一致
  
  // 営業状況確認
  businessStatusConfirmed: false, // ✅ 営業状況を最新情報で確認済み
  
  // データ品質確認
  noSimilarMistakesAsSeason1to4: false // ✅ Season1-4で発生した問題パターンでないことを確認
}

// ==========================================
// 🚨 実行前最終チェック
// ==========================================
function validateBeforeExecution() {
  console.log('🔍 事前検証チェックリスト確認...\n')
  
  const allChecked = Object.entries(PRE_VALIDATION_CHECKLIST).every(([key, value]) => {
    if (!value) {
      console.log(`❌ ${key}: 未確認`)
      return false
    }
    console.log(`✅ ${key}: 確認済み`)
    return true
  })
  
  if (!allChecked) {
    console.log('\n🚨 事前検証が完了していません。全ての項目を確認してから実行してください。')
    process.exit(1)
  }
  
  console.log('\n✅ 事前検証完了 - データ追加を開始します\n')
}

// ==========================================
// データ追加メイン処理
// ==========================================
async function addNewSeasonEpisode() {
  console.log(`🍽️ ${EPISODE_INFO.title} データ追加開始...\n`)
  console.log('=' .repeat(70))
  
  try {
    // 事前検証
    validateBeforeExecution()
    
    // 松重豊のcelebrity_idを取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊が見つかりません')
      return
    }
    
    console.log('✅ Celebrity ID取得完了')
    
    // エピソードを追加
    const { data: newEpisode, error: episodeError } = await supabase
      .from('episodes')
      .insert({
        title: EPISODE_INFO.title,
        description: EPISODE_INFO.description,
        celebrity_id: celebrity.id,
        season: EPISODE_INFO.season,
        episode_number: EPISODE_INFO.episodeNumber
      })
      .select('id')
      .single()
    
    if (episodeError) {
      console.error('❌ エピソード追加エラー:', episodeError)
      return
    }
    
    console.log(`✅ エピソード追加完了: ${newEpisode.id}`)
    
    // 店舗データを追加
    const locationData = {
      name: RESTAURANT_DATA.name,
      slug: RESTAURANT_DATA.slug,
      address: RESTAURANT_DATA.address,
      description: RESTAURANT_DATA.description,
      tabelog_url: RESTAURANT_DATA.tabelog_url,
      affiliate_info: {
        linkswitch: {
          status: RESTAURANT_DATA.business_status === 'active' ? 'active' : 'inactive',
          original_url: RESTAURANT_DATA.tabelog_url,
          last_verified: new Date().toISOString(),
          episode: `${EPISODE_INFO.season} Episode${EPISODE_INFO.episodeNumber}`,
          notes: `${RESTAURANT_DATA.restaurant_type}。${RESTAURANT_DATA.signature_dish}が名物。`,
          verification_method: 'guidelines_compliant_manual_research'
        },
        restaurant_info: {
          signature_dish: RESTAURANT_DATA.signature_dish,
          verification_status: 'verified_new_addition',
          data_source: 'accurate_manual_research_guidelines_compliant',
          tabelog_rating: RESTAURANT_DATA.tabelog_rating,
          restaurant_type: RESTAURANT_DATA.restaurant_type,
          price_range: RESTAURANT_DATA.price_range,
          cuisine_type: EPISODE_INFO.expectedCuisine,
          celebrity_association: 'matsushige_yutaka',
          season_association: EPISODE_INFO.season,
          special_features: RESTAURANT_DATA.access,
          business_hours: RESTAURANT_DATA.business_hours,
          closed: RESTAURANT_DATA.closed,
          phone: RESTAURANT_DATA.phone,
          business_status: RESTAURANT_DATA.business_status,
          updated_at: new Date().toISOString()
        }
      }
    }
    
    const { data: newLocation, error: locationError } = await supabase
      .from('locations')
      .insert(locationData)
      .select('id')
      .single()
    
    if (locationError) {
      console.error('❌ ロケーション追加エラー:', locationError)
      return
    }
    
    console.log(`✅ ロケーション追加完了: ${newLocation.id}`)
    
    // エピソード・ロケーション関連付け
    const { error: relationError } = await supabase
      .from('episode_locations')
      .insert({
        episode_id: newEpisode.id,
        location_id: newLocation.id
      })
    
    if (relationError) {
      console.error('❌ 関連付けエラー:', relationError)
      return
    }
    
    console.log('✅ エピソード・ロケーション関連付け完了')
    
    // 完了報告
    console.log('\n' + '=' .repeat(70))
    console.log(`\n🎊 ${EPISODE_INFO.title} データ追加完了！`)
    
    console.log(`\n🏪 ${RESTAURANT_DATA.name} 詳細情報:`)
    console.log(`   📍 ${RESTAURANT_DATA.address}`)
    console.log(`   ⭐ タベログ${RESTAURANT_DATA.tabelog_rating}点`)
    console.log(`   🍽️ 名物：${RESTAURANT_DATA.signature_dish}`)
    console.log(`   💰 価格帯：${RESTAURANT_DATA.price_range}`)
    console.log(`   🔗 タベログ：${RESTAURANT_DATA.tabelog_url}`)
    console.log(`   📺 ${EPISODE_INFO.title}の実際のロケ地`)
    
    console.log('\n💼 データ品質保証:')
    console.log('   ✅ エリア情報完全一致確認済み')
    console.log('   ✅ 料理ジャンル完全一致確認済み')
    console.log('   ✅ タベログURL検証済み')
    console.log('   ✅ ガイドライン準拠データ')
    
    console.log('\n🏆 高品質データベースへの追加が完了しました！')
    
  } catch (error) {
    console.error('❌ エラー:', error)
  }
}

// ==========================================
// 🚨 重要な注意事項
// ==========================================
console.log(`
🚨 重要な注意事項 🚨

このスクリプトを実行する前に：

1. 全ての入力項目が正確であることを確認
2. タベログURLに実際にアクセスして内容確認
3. エピソードタイトルとロケ地の完全一致を確認
4. Season1-4の問題パターンと照合
5. PRE_VALIDATION_CHECKLIST の全項目をtrueに設定

間違ったデータを追加すると後で大規模な修正が必要になります。
疑問があれば追加を急がず、必ず再調査を行ってください。

品質 > スピード
`)

// 実行
// addNewSeasonEpisode().catch(console.error)

// 🚨 実行前に上記の注意事項を全て確認し、
// 最後の行のコメントアウトを外してから実行してください