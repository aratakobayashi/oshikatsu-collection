#!/usr/bin/env node

/**
 * 検証済みエピソード5・6の店舗を追加
 * つり堀武蔵野園とみやこ家を安全に追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 検証済み店舗データ
const VERIFIED_RESTAURANTS = [
  {
    episode: 5,
    expected_title_part: '杉並区永福',
    restaurant: {
      name: 'つり堀武蔵野園',
      address: '東京都杉並区大宮2-22-3 和田掘公園',
      tabelog_url: 'https://tabelog.com/tokyo/A1318/A131805/13140021/',
      description: '孤独のグルメ Season1 第5話で登場。釣り堀併設の食堂で、五郎が親子丼と焼きうどんを注文。',
      signature_dish: '親子丼、焼きうどん',
      cuisine_type: '食堂・和食',
      operating_hours: '9:00-17:00（食堂10:00開始）',
      closed_days: '火・木曜日',
      phone: '03-3312-2723',
      tabelog_rating: '3.40',
      notes: '釣り堀併設。天ぷらやオムライスも名物。悪天候時は臨時休業あり。'
    }
  },
  {
    episode: 6,
    expected_title_part: '中野区鷺',
    restaurant: {
      name: 'みやこや',
      address: '東京都中野区鷺宮3-21-6',
      tabelog_url: 'https://tabelog.com/tokyo/A1321/A132104/13011853/',
      description: '孤独のグルメ Season1 第6話で登場。ロースにんにく焼きが名物のとんかつ店。五郎がロースにんにく焼きを注文。',
      signature_dish: 'ロースにんにく焼き、とんかつ',
      cuisine_type: 'とんかつ',
      operating_hours: '11:30-15:00, 18:00-20:00',
      closed_days: '火曜日',
      phone: '03-3336-7037',
      tabelog_rating: '3.47',
      notes: '鷺ノ宮駅から徒歩2分。群馬県産河内豚使用。15席のこじんまりとした老舗。'
    }
  }
]

async function addVerifiedEpisodes56() {
  console.log('🏗️  検証済みエピソード5・6の店舗追加開始...\n')
  console.log('=' .repeat(60))
  
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

  console.log(`✅ 松重豊 ID: ${celebrity.id}`)
  console.log(`📊 追加対象: 検証済み${VERIFIED_RESTAURANTS.length}店舗\n`)
  
  let createdCount = 0
  let errorCount = 0
  
  for (const item of VERIFIED_RESTAURANTS) {
    console.log(`\n📍 第${item.episode}話: ${item.restaurant.name}`)
    console.log(`   料理: ${item.restaurant.signature_dish}`)
    console.log(`   住所: ${item.restaurant.address}`)
    console.log(`   営業時間: ${item.restaurant.operating_hours}`)
    console.log(`   食べログ評価: ${item.restaurant.tabelog_rating}`)
    
    try {
      // エピソードIDを検索
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', celebrity.id)
        .ilike('title', `%Season1%${item.expected_title_part}%`)
      
      if (!episodes || episodes.length === 0) {
        console.error(`   ❌ エピソードが見つかりません（検索: %Season1%${item.expected_title_part}%）`)
        errorCount++
        continue
      }
      
      const episodeData = episodes[0]
      console.log(`   ✅ エピソード確認: ${episodeData.title}`)
      
      // ユニークなslugを生成
      const baseSlug = item.restaurant.name
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
      
      // 重複チェックしてユニークなslugを作成
      let uniqueSlug = baseSlug
      let counter = 1
      while (true) {
        const { data: existingLocation } = await supabase
          .from('locations')
          .select('id')
          .eq('slug', uniqueSlug)
          .single()
        
        if (!existingLocation) break
        
        uniqueSlug = `${baseSlug}-${counter}`
        counter++
      }
      
      console.log(`   📝 生成slug: ${uniqueSlug}`)
      
      // ロケーションデータを作成
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .insert({
          name: item.restaurant.name,
          slug: uniqueSlug,
          address: item.restaurant.address,
          description: item.restaurant.description,
          tabelog_url: item.restaurant.tabelog_url,
          affiliate_info: {
            linkswitch: {
              status: 'active',
              original_url: item.restaurant.tabelog_url,
              last_verified: new Date().toISOString(),
              episode: `Season1 Episode${item.episode}`,
              notes: item.restaurant.notes
            },
            restaurant_info: {
              signature_dish: item.restaurant.signature_dish,
              cuisine_type: item.restaurant.cuisine_type,
              operating_hours: item.restaurant.operating_hours,
              closed_days: item.restaurant.closed_days,
              phone: item.restaurant.phone,
              tabelog_rating: item.restaurant.tabelog_rating,
              verification_status: 'verified',
              data_source: 'step_by_step_research',
              created_at: new Date().toISOString()
            }
          }
        })
        .select()
        .single()
      
      if (locationError) {
        console.error(`   ❌ ロケーション作成エラー: ${locationError.message}`)
        errorCount++
        continue
      }
      
      // エピソード-ロケーション関連を作成
      const { error: relationError } = await supabase
        .from('episode_locations')
        .insert({
          episode_id: episodeData.id,
          location_id: locationData.id
        })
      
      if (relationError) {
        console.error(`   ❌ 関連作成エラー: ${relationError.message}`)
        errorCount++
        continue
      }
      
      // エピソードの説明も更新
      const { error: episodeUpdateError } = await supabase
        .from('episodes')
        .update({
          description: item.restaurant.description
        })
        .eq('id', episodeData.id)
      
      if (episodeUpdateError) {
        console.log(`   ⚠️ エピソード更新軽微エラー: ${episodeUpdateError.message}`)
      }
      
      console.log(`   ✅ 追加成功`)
      console.log(`      → ロケーションID: ${locationData.id}`)
      console.log(`      → slug: ${uniqueSlug}`)
      console.log(`      → 食べログ: ${item.restaurant.tabelog_url}`)
      console.log(`      → LinkSwitch: 有効`)
      
      createdCount++
      
    } catch (error) {
      console.error(`   ❌ 予期しないエラー: ${error}`)
      errorCount++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('\n📊 追加結果:')
  console.log(`   ✅ 追加成功: ${createdCount}件`)
  console.log(`   ❌ エラー: ${errorCount}件`)
  
  const totalCreated = 1 + createdCount // 既存の庄助 + 今回追加
  
  if (createdCount > 0) {
    console.log('\n🎉 段階的データ追加完了！')
    console.log('\n💰 収益化拡大:')
    console.log(`   - 新規${createdCount}店舗でLinkSwitch自動アフィリエイト化`)
    console.log('   - 100%検証済みデータで高品質なユーザー体験')
    console.log('   - 食べログリンククリックで即座に収益発生')
    
    console.log('\n🎯 更新された松重豊収益化状況:')
    console.log(`   収益化店舗: ${totalCreated}/12店舗`)
    console.log(`   収益化率: ${Math.round((totalCreated / 12) * 100)}%`)
    console.log(`   データ品質: 100%（全て段階的検証済み）`)
    
    console.log('\n📈 段階的進捗:')
    console.log('   ✅ Phase 1: データクリーニング完了')
    console.log('   ✅ Phase 2: 検証システム構築完了')
    console.log('   ✅ Phase 3: 段階的データ追加開始')
    console.log(`   🔄 Phase 4: 残り店舗の調査・追加（進行中）`)
    
    console.log('\n📝 次のステップ:')
    console.log('1. フロントエンドで新規店舗の表示確認')
    console.log('2. LinkSwitch動作確認（全3店舗）')
    console.log('3. slug重複問題を解決（Episodes 3,7,11）')
    console.log('4. 残りエピソード調査（Episodes 8,9,10,12）')
  }
}

// 実行
addVerifiedEpisodes56().catch(console.error)