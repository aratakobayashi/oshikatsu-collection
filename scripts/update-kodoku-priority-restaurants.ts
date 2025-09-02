#!/usr/bin/env node

/**
 * 孤独のグルメ優先度高い店舗のデータ更新スクリプト
 * 実際の店舗名と食べログURLを設定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// バリューコマース設定（実際のIDに置き換える必要があります）
const VALUECOMMERCE_CONFIG = {
  sid: '3703510',     // サイトID
  pid: '890594925',   // プログラムID
}

// バリューコマース経由のアフィリエイトURL生成
function generateAffiliateUrl(tabelogUrl: string): string {
  const affiliateBase = 'https://ck.jp.ap.valuecommerce.com/servlet/referral'
  const params = new URLSearchParams({
    sid: VALUECOMMERCE_CONFIG.sid,
    pid: VALUECOMMERCE_CONFIG.pid,
    vc_url: tabelogUrl
  })
  return `${affiliateBase}?${params.toString()}`
}

// 優先度の高い店舗データ（食べログURL付き）
const PRIORITY_UPDATES = [
  {
    location_id: null, // Season1 第1話のIDは後で検索
    episode_title: '孤独のグルメ Season1 第1話',
    old_name: 'やきとり門前仲町店',
    new_name: '庄や 門前仲町店',
    address: '東京都江東区門前仲町1-8-1',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13019733/',
    description: '孤独のグルメ第1話で登場した焼き鳥と焼きめしの店。シリーズの原点となる記念すべき店舗。',
  },
  {
    location_id: null,
    episode_title: '孤独のグルメ Season1 第3話',
    old_name: '池袋ラーメン 汁なし担々麺屋',
    new_name: '中国家庭料理 楊 2号店',
    address: '東京都豊島区西池袋1-38-1',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1305/A130501/13001651/',
    description: '汁なし担々麺が名物の中華料理店。五郎も虜になった濃厚な味わい。',
  },
  {
    location_id: null,
    episode_title: '孤独のグルメ Season1 第4話',
    old_name: '銀座そば処',
    new_name: '佐藤養助 銀座店',
    address: '東京都中央区銀座6-4-17',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1301/A130101/13002765/',
    description: '稲庭うどんの老舗。銀座で味わう秋田の伝統の味。',
  },
  {
    location_id: null,
    episode_title: '孤独のグルメ Season1 第7話',
    old_name: '吉祥寺中華料理店',
    new_name: 'みんみん',
    address: '東京都武蔵野市吉祥寺本町1-2-8',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13003625/',
    description: '餃子が名物の老舗中華料理店。焼き鳥丼も絶品。',
  },
  {
    location_id: '7ac022c5-35c3-48fd-b404-4aa31f656f93',
    episode_title: '孤独のグルメ Season2 第1話',
    old_name: '東陽町定食屋',
    new_name: 'だるま 東陽店',
    address: '東京都江東区東陽4-6-14',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1313/A131303/13043871/',
    description: 'カツ丼と冷やし中華で有名な定食屋。Season2の幕開けを飾った店。',
  },
  {
    location_id: '280eca12-1af1-41ac-99d3-2fe7aa159e35',
    episode_title: '孤独のグルメ Season2 第5話',
    old_name: '根津中華料理店',
    new_name: '中国家庭料理 山楽',
    address: '東京都文京区根津2-29-8',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1311/A131106/13003634/',
    description: '焼き餃子と焼売が名物の中華料理店。根津の隠れた名店。',
  },
  {
    location_id: '22a96645-fc26-4554-ac78-1e6c9cad8f29',
    episode_title: '孤独のグルメ Season3 第1話',
    old_name: '日暮里インド料理店',
    new_name: 'ザクロ',
    address: '東京都荒川区東日暮里5-51-11',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1311/A131105/13003732/',
    description: 'トルコ料理の専門店。ケバブとラッシーが絶品。Season3開始の記念店舗。',
  },
  {
    location_id: '2cce1126-d47d-41fe-bfaf-954cb3727316',
    episode_title: '孤独のグルメ Season3 第7話',
    old_name: '沼袋中華料理店',
    new_name: '阿佐',
    address: '東京都中野区沼袋3-27-15',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1321/A132105/13094693/',
    description: '本格四川料理の店。麻婆豆腐と酸辣湯麺が看板メニュー。',
  },
  {
    location_id: 'f4dd3900-b187-40e6-a817-3e4c40806b6f',
    episode_title: '孤独のグルメ Season4 第1話',
    old_name: '清瀬もつ焼き店',
    new_name: 'もつ焼き ばん',
    address: '東京都清瀬市松山1-15-1',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/tokyo/A1328/A132807/13125904/',
    description: 'もつ焼きの名店。Season4のスタートを飾った印象的な店舗。',
  },
  {
    location_id: 'cbdb61d3-7f3a-4159-8e7a-7b5e01b1df96',
    episode_title: '孤独のグルメ Season5 第1話',
    old_name: '白楽中華料理店',
    new_name: '玉泉亭',
    address: '神奈川県横浜市神奈川区白楽100',
    category: 'restaurant',
    tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140212/14002891/',
    description: 'サンマーメン発祥の店として知られる老舗中華料理店。Season5開始の記念店舗。',
  }
]

async function updatePriorityRestaurants() {
  console.log('🍜 孤独のグルメ優先店舗データ更新開始...\n')
  console.log('=' .repeat(60))
  
  let successCount = 0
  let errorCount = 0
  
  // 松重豊のIDを取得
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'matsushige-yutaka')
    .single()
  
  if (!celebrity) {
    console.error('❌ 松重豊のデータが見つかりません')
    return
  }

  for (const update of PRIORITY_UPDATES) {
    console.log(`\n📍 処理中: ${update.new_name}`)
    console.log(`   エピソード: ${update.episode_title}`)
    
    try {
      // location_idがない場合は、エピソードタイトルから検索
      let locationId = update.location_id
      
      if (!locationId) {
        const { data: episode } = await supabase
          .from('episodes')
          .select(`
            id,
            episode_locations(
              location_id,
              locations(
                id,
                name
              )
            )
          `)
          .eq('celebrity_id', celebrity.id)
          .like('title', `%${update.episode_title}%`)
          .single()
        
        if (episode?.episode_locations?.[0]?.location_id) {
          locationId = episode.episode_locations[0].location_id
          console.log(`   ✅ Location ID 取得: ${locationId}`)
        } else {
          console.log(`   ⚠️ エピソードが見つかりません: ${update.episode_title}`)
          errorCount++
          continue
        }
      }
      
      // アフィリエイトURL生成
      const affiliateUrl = generateAffiliateUrl(update.tabelog_url)
      
      // ロケーションデータを更新
      const { data, error } = await supabase
        .from('locations')
        .update({
          name: update.new_name,
          address: update.address,
          category: update.category,
          description: update.description,
          tabelog_url: affiliateUrl,
          reservation_url: affiliateUrl, // 互換性のため両方設定
          affiliate_info: {
            tabelog: {
              original_url: update.tabelog_url,
              affiliate_url: affiliateUrl,
              last_updated: new Date().toISOString()
            }
          }
        })
        .eq('id', locationId)
        .select()
        .single()
      
      if (error) {
        console.error(`   ❌ エラー: ${error.message}`)
        errorCount++
      } else {
        console.log(`   ✅ 更新成功`)
        console.log(`      - 旧名: ${update.old_name}`)
        console.log(`      - 新名: ${update.new_name}`)
        console.log(`      - 食べログ: ${update.tabelog_url}`)
        successCount++
      }
      
    } catch (error) {
      console.error(`   ❌ 予期しないエラー: ${error}`)
      errorCount++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 更新結果:')
  console.log(`   ✅ 成功: ${successCount}件`)
  console.log(`   ❌ エラー: ${errorCount}件`)
  
  if (successCount > 0) {
    console.log('\n🎉 更新が完了しました！')
    console.log('\n📝 次のステップ:')
    console.log('1. フロントエンドで表示確認')
    console.log('   → https://collection.oshikatsu-guide.com/celebrities/matsushige-yutaka')
    console.log('2. 食べログボタンのクリック動作確認')
    console.log('3. アフィリエイトトラッキングの確認')
  }
}

// 実行
updatePriorityRestaurants().catch(console.error)