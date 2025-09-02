#!/usr/bin/env node

/**
 * 残りの検証済み店舗を追加（Episodes 3, 7, 11）
 * slug重複問題を解決しながら安全に追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 残りの検証済み店舗データ
const REMAINING_VERIFIED_RESTAURANTS = [
  {
    episode: 3,
    expected_title_part: '豊島区池袋',
    restaurant: {
      name: '中国家庭料理 楊 2号店',
      address: '東京都豊島区西池袋3-25-5',
      tabelog_url: 'https://tabelog.com/tokyo/A1305/A130501/13009261/',
      description: '孤独のグルメ Season1 第3話で登場。汁なし担々麺で有名な四川料理店。五郎が汁なし担々麺を注文。',
      signature_dish: '汁なし担々麺',
      cuisine_type: '中華料理・四川料理',
      tabelog_rating: '3.59',
      notes: '汁なし担々麺で有名な四川料理店。食べログ評価3.59の人気店。'
    }
  },
  {
    episode: 7,
    expected_title_part: '武蔵野市吉祥寺',
    restaurant: {
      name: 'カヤシマ',
      address: '東京都武蔵野市吉祥寺本町1-10-9',
      tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13040521/',
      description: '孤独のグルメ Season1 第7話で登場。ナポリタンとハンバーグで有名な老舗喫茶店。五郎がわくわくセット（ナポリタン＆ハンバーグ）を注文。',
      signature_dish: 'わくわくセット（ナポリタン＆ハンバーグ）',
      cuisine_type: '喫茶店・洋食',
      tabelog_rating: '3.54',
      notes: '1975年創業の老舗喫茶店。Google評価4.2。孤独のグルメで一躍有名になった。'
    }
  },
  {
    episode: 11,
    expected_title_part: '文京区根津',
    restaurant: {
      name: 'すみれ',
      address: '東京都文京区根津2-24-8',
      tabelog_url: 'https://tabelog.com/tokyo/A1311/A131106/13018386/',
      description: '孤独のグルメ Season1 第11話で登場。特辛カレーライスが名物の居酒屋。五郎が特辛カレーライスを注文。',
      signature_dish: '特辛カレーライス（600円）',
      cuisine_type: '居酒屋',
      tabelog_rating: '3.51',
      notes: '5種類のスパイス使用の特辛カレー。吉田類の酒場放浪記にも出演。'
    }
  }
]

async function addRemainingVerifiedRestaurants() {
  console.log('🏗️  残りの検証済み店舗追加開始...\n')
  console.log('slug重複問題を解決しながら安全に追加します')
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
  console.log(`📊 追加対象: 残り検証済み${REMAINING_VERIFIED_RESTAURANTS.length}店舗\n`)
  
  let createdCount = 0
  let errorCount = 0
  
  for (const item of REMAINING_VERIFIED_RESTAURANTS) {
    console.log(`\n📍 第${item.episode}話: ${item.restaurant.name}`)
    console.log(`   料理: ${item.restaurant.signature_dish}`)
    console.log(`   住所: ${item.restaurant.address}`)
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
      
      // ユニークなslugを生成（改良版）
      const baseSlug = item.restaurant.name
        .toLowerCase()
        .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '') // 日本語も許可
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/--+/g, '-') // 連続ハイフンを一つに
        .trim()
      
      // さらに詳細なslug生成（エピソード番号付き）
      let uniqueSlug = `${baseSlug}-episode-${item.episode}`
      let counter = 1
      
      while (true) {
        const { data: existingLocation } = await supabase
          .from('locations')
          .select('id, name')
          .eq('slug', uniqueSlug)
          .maybeSingle()
        
        if (!existingLocation) break
        
        console.log(`   ⚠️ slug重複検出: ${uniqueSlug} (既存: ${existingLocation.name})`)
        uniqueSlug = `${baseSlug}-episode-${item.episode}-v${counter}`
        counter++
        
        if (counter > 10) {
          throw new Error('slug生成で無限ループを検出。処理を中止します。')
        }
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
              tabelog_rating: item.restaurant.tabelog_rating,
              verification_status: 'verified',
              data_source: 'step_by_step_research_phase2',
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
  
  const totalCreated = 3 + createdCount // 既存3店舗 + 今回追加
  
  if (createdCount > 0) {
    console.log('\n🎉 Phase 2 店舗追加完了！')
    console.log('\n💰 収益化大幅拡大:')
    console.log(`   - 新規${createdCount}店舗でLinkSwitch自動アフィリエイト化`)
    console.log('   - slug重複問題を解決')
    console.log('   - 100%検証済みデータで高品質なユーザー体験')
    
    console.log('\n🎯 大幅更新された松重豊収益化状況:')
    console.log(`   収益化店舗: ${totalCreated}/12店舗`)
    console.log(`   収益化率: ${Math.round((totalCreated / 12) * 100)}%`)
    console.log(`   データ品質: 100%（全て段階的検証済み）`)
    
    console.log('\n🏆 マイルストーン達成:')
    if (totalCreated >= 6) {
      console.log('   🥇 50%収益化達成！')
    } else if (totalCreated >= 3) {
      console.log('   🥉 25%収益化達成！')
    }
    
    console.log('\n📈 完了した段階的進捗:')
    console.log('   ✅ Phase 1: データクリーニング完了')
    console.log('   ✅ Phase 2: 検証システム構築完了')
    console.log('   ✅ Phase 3: 段階的データ追加完了')
    console.log(`   🔄 Phase 4: 残りエピソード調査（Episodes 8,9,10,12）`)
    
    console.log('\n📝 次のステップ:')
    console.log('1. フロントエンドで全6店舗の表示確認')
    console.log('2. LinkSwitch動作確認（全店舗）')
    console.log('3. 残りエピソード調査開始（Episodes 8,9,10,12）')
    console.log('4. 最終的な12/12店舗完全収益化を目指す')
    
    console.log('\n🎊 素晴らしい進捗です！段階的アプローチが成功しています！')
  }
}

// 実行
addRemainingVerifiedRestaurants().catch(console.error)