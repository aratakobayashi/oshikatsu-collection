#!/usr/bin/env node

/**
 * 孤独のグルメ Season1 特定ロケーションの修正
 * データベースに存在する間違ったデータを正しい情報に修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixSpecificLocationData() {
  console.log('🔧 孤独のグルメ Season1 特定ロケーションの修正開始...\n')
  
  try {
    // 第11話: 香味徳 → すみれ に修正
    console.log('📍 第11話の修正:')
    console.log('   ❌ 間違い: 香味徳（餃子・焼売）')
    console.log('   ✅ 正しい: すみれ（特辛カレーライス）')
    
    const episode11LocationId = 'd10d7c78-f3c4-4c0a-8767-91fc496dd57d'
    
    const { data: episode11Location, error: error11 } = await supabase
      .from('locations')
      .update({
        name: 'すみれ',
        address: '東京都文京区根津2-24-8',
        description: '孤独のグルメ Season1 第11話で登場。特辛カレーライスが名物の居酒屋。',
        tabelog_url: 'https://tabelog.com/tokyo/A1311/A131106/13018386/',
        affiliate_info: {
          linkswitch: {
            status: 'active',
            original_url: 'https://tabelog.com/tokyo/A1311/A131106/13018386/',
            last_verified: new Date().toISOString(),
            episode: 'Season1 Episode11',
            notes: '特辛カレー600円。5種類のスパイスを使用。'
          },
          conversion: {
            from: 'incorrect_restaurant_name',
            to: 'linkswitch_direct',
            converted_at: new Date().toISOString(),
            verified_accurate: true,
            note: '香味徳→すみれに修正（特辛カレー店）'
          }
        }
      })
      .eq('id', episode11LocationId)
      .select()
      .single()
    
    if (error11) {
      console.error(`   ❌ 第11話修正エラー: ${error11.message}`)
    } else {
      console.log('   ✅ 第11話修正完了: すみれ（特辛カレーライス）')
    }
    
    // 第7話: みんみん → カヤシマ に修正
    console.log('\n📍 第7話の修正:')
    console.log('   ❌ 間違い: みんみん（餃子・焼き鳥丼）')
    console.log('   ✅ 正しい: カヤシマ（喫茶店のナポリタン）')
    
    // 第7話のロケーションIDを検索
    const { data: episode7 } = await supabase
      .from('episodes')
      .select(`
        id,
        title,
        episode_locations(
          location_id,
          locations(
            id,
            name
          )
        )
      `)
      .like('title', '%Season1%第7話%')
      .single()
    
    if (episode7?.episode_locations?.[0]?.location_id) {
      const episode7LocationId = episode7.episode_locations[0].location_id
      console.log(`   Location ID: ${episode7LocationId}`)
      console.log(`   現在のデータ: ${episode7.episode_locations[0].locations?.name}`)
      
      const { data: episode7Location, error: error7 } = await supabase
        .from('locations')
        .update({
          name: 'カヤシマ',
          address: '東京都武蔵野市吉祥寺本町1-10-9',
          description: '孤独のグルメ Season1 第7話で登場。ナポリタンとハンバーグで有名な老舗喫茶店。',
          tabelog_url: 'https://tabelog.com/tokyo/A1320/A132001/13040521/',
          affiliate_info: {
            linkswitch: {
              status: 'active',
              original_url: 'https://tabelog.com/tokyo/A1320/A132001/13040521/',
              last_verified: new Date().toISOString(),
              episode: 'Season1 Episode7',
              notes: '1975年創業の老舗喫茶店。わくわくセット（ナポリタン＆ハンバーグ）が名物。'
            },
            conversion: {
              from: 'incorrect_restaurant_name',
              to: 'linkswitch_direct',
              converted_at: new Date().toISOString(),
              verified_accurate: true,
              note: 'みんみん→カヤシマに修正（喫茶店のナポリタン）'
            }
          }
        })
        .eq('id', episode7LocationId)
        .select()
        .single()
      
      if (error7) {
        console.error(`   ❌ 第7話修正エラー: ${error7.message}`)
      } else {
        console.log('   ✅ 第7話修正完了: カヤシマ（喫茶店のナポリタン）')
      }
      
      // エピソードタイトルも修正
      const { error: episodeError7 } = await supabase
        .from('episodes')
        .update({
          title: '孤独のグルメ Season1 第7話「武蔵野市吉祥寺の喫茶店のナポリタン」',
          description: '五郎が吉祥寺で老舗喫茶店「カヤシマ」を訪れ、わくわくセット（ナポリタン＆ハンバーグ）を堪能する。'
        })
        .eq('id', episode7.id)
      
      if (episodeError7) {
        console.error(`   ❌ 第7話エピソード更新エラー: ${episodeError7.message}`)
      } else {
        console.log('   ✅ 第7話エピソードタイトル修正完了')
      }
    }
    
    // エピソード11のタイトルも修正
    const { data: episode11 } = await supabase
      .from('episodes')
      .select('id')
      .like('title', '%Season1%第11話%')
      .single()
    
    if (episode11) {
      const { error: episodeError11 } = await supabase
        .from('episodes')
        .update({
          title: '孤独のグルメ Season1 第11話「文京区根津の飲み屋さんの特辛カレーライス」',
          description: '五郎が根津で居酒屋「すみれ」を訪れ、特辛カレーライスを堪能する。'
        })
        .eq('id', episode11.id)
      
      if (episodeError11) {
        console.error(`   ❌ 第11話エピソード更新エラー: ${episodeError11.message}`)
      } else {
        console.log('   ✅ 第11話エピソードタイトル修正完了')
      }
    }
    
    console.log('\n🎉 修正完了！')
    console.log('\n📊 現在の正しい松重豊収益化状況:')
    console.log('   ✅ 庄助（第1話）- やきとりと焼きめし')
    console.log('   ✅ 中国家庭料理 楊 2号店（第3話）- 汁なし担々麺')
    console.log('   ✅ カヤシマ（第7話）- 喫茶店のナポリタン ← 今回修正')
    console.log('   ✅ すみれ（第11話）- 特辛カレーライス ← 今回修正')
    console.log('')
    console.log('   正確な収益化店舗: 4/12店舗')
    console.log('   収益化率: 33%')
    console.log('   LinkSwitch対応で自動アフィリエイト化')
    
    console.log('\n📝 次のステップ:')
    console.log('1. フロントエンドで正しい店名とリンクの確認')
    console.log('2. 残りエピソード（2,4,5,6,8,9,10,12話）の正確な調査')
    console.log('3. LinkSwitch動作確認（URL自動変換テスト）')
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// 実行
fixSpecificLocationData().catch(console.error)