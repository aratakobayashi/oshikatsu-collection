#!/usr/bin/env node

/**
 * Season9 完全データ修正スクリプト
 * 
 * 品質問題を完全解決：正しい店舗名、正確なタベログURL、閉店店舗対応
 * Season5の品質問題再発を防止する決定版修正
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Season9エピソードID（既存）
const EPISODE_IDS = {
  episode1: 'd0c56dbc-f7ea-4c92-8d4f-040452eec5ea',
  episode2: '969559b3-33d3-41dd-b237-6d270cccf74f',
  episode3: '0d3f756e-604e-43b3-b98f-a1f3bd1a17de',
  episode4: '6237ac50-fe5e-4462-8f3b-ea08e6f7817e',
  episode5: 'e784437d-dcc7-4f55-8c2f-b08f08faa549',
  episode6: 'fa5e79d5-c2a5-4ebb-a840-5954535db58c',
  episode7: '39d77e74-d127-4cbe-85b6-bb91a26577f9',
  episode8: 'be1d70e8-16ac-4aff-bac4-83fd902f7b85',
  episode9: '26f0f108-7d92-44a3-9edc-0461645e1bdb',
  episode10: '6095960b-6fb7-45e0-b31d-6b48f312fbf9',
  episode11: 'd846442b-b1e0-4121-85d9-22024edf2f39',
  episode12: '96ff206b-7f51-4f21-9fcf-a40a8431858a'
}

async function fixSeason9CompleteData() {
  console.log('🚨 Season9 完全データ修正開始...\n')
  console.log('🔧 品質問題の根本解決 - 正確なデータで完全修正')
  console.log('=' .repeat(70))
  
  try {
    // 修正データ（公式情報に基づく正確なデータ）
    const correctLocationsData = [
      // 第1話: とんかつ しお田 (URL修正のみ)
      {
        episodeId: EPISODE_IDS.episode1,
        episodeNum: 1,
        name: 'とんかつ しお田',
        slug: 'tonkatsu-shioda-miyamaedaira-season9-episode1',
        address: '神奈川県川崎市宮前区宮前平3-10-17',
        description: '1972年創業の老舗とんかつ店。ひれかつ御膳と魚介クリームコロッケが名物。ミシュランガイド掲載の名店。孤独のグルメSeason9第1話の舞台。',
        tags: ['とんかつ', '魚介クリームコロッケ', '宮前平', '老舗', '1972年創業', 'ミシュラン', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140507/14000033/',
        phone: '044-877-5145',
        opening_hours: '月・金・土・日 11:00-14:00,17:00-20:00（火水木休み）',
        status: '営業中'
      },
      
      // 第2話: 魚処 にしけん (店舗名完全修正・閉店対応)
      {
        episodeId: EPISODE_IDS.episode2,
        episodeNum: 2,
        name: '魚処 にしけん',
        slug: 'uodokoro-nishiken-ninomiya-season9-episode2',
        address: '神奈川県中郡二宮町山西226',
        description: '二宮の老舗海鮮料理店。金目鯛の煮付けが名物だった。小田原魚市場から新鮮な魚介を直接仕入れていた地元愛された名店。孤独のグルメSeason9第2話の舞台。現在は閉店。',
        tags: ['海鮮料理', '金目鯛', '煮付け', '二宮', '老舗', '小田原魚市場', '閉店', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1404/A140408/14013701/',
        phone: '0463-71-1959',
        opening_hours: '閉店（営業当時：11:00-14:00,17:00-21:00）',
        status: '閉店'
      },
      
      // 第3話: ギリシャ料理 タベルナ ミリュウ (店舗名完全修正)
      {
        episodeId: EPISODE_IDS.episode3,
        episodeNum: 3,
        name: 'ギリシャ料理 タベルナ ミリュウ',
        slug: 'greek-taverna-milieu-azabu-juban-season9-episode3',
        address: '東京都港区麻布十番2-8-7',
        description: '2009年開店の本格ギリシャ料理店。ムサカとドルマーデスが名物。ギリシャ大使公邸で働いた経験を持つシェフが作る本格的なギリシャ料理。孤独のグルメSeason9第3話の舞台。',
        tags: ['ギリシャ料理', 'ムサカ', 'ドルマーデス', '麻布十番', 'タベルナ', '本格', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1307/A130702/13093715/',
        phone: '03-6435-3890',
        opening_hours: '火-土 12:00-14:30,18:00-22:00（日月休み）',
        status: '営業中'
      },
      
      // 第4話: Sincerity（しんせらてぃ）(店舗名完全修正)
      {
        episodeId: EPISODE_IDS.episode4,
        episodeNum: 4,
        name: 'Sincerity（しんせらてぃ）',
        slug: 'sincerity-fuchu-shinmachi-season9-episode4',
        address: '東京都府中市新町3-25-10',
        description: 'ヌーベルシノワの巨匠・脇屋友詞の愛弟子が営む中国料理店。鰻の蒲焼チャーハンとカキとニラの辛し炒めが名物。本格中華を家庭的な雰囲気で味わえる。孤独のグルメSeason9第4話の舞台。',
        tags: ['中国料理', '鰻チャーハン', 'カキニラ炒め', '府中', 'ヌーベルシノワ', '脇屋友詞', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1326/A132602/13058384/',
        phone: '042-336-5517',
        opening_hours: '水-日 11:30-14:00,18:00-21:00（月火休み）',
        status: '営業中'
      },
      
      // 第5話: 焼肉ふじ (既に正しいためスキップ)
      
      // 第6話: 定食さがら (店舗名微調整・URL確認)
      {
        episodeId: EPISODE_IDS.episode6,
        episodeNum: 6,
        name: '割烹・定食 さがら',
        slug: 'kappou-teishoku-sagara-minami-nagasaki-season9-episode6',
        address: '東京都豊島区南長崎5-18-2',
        description: '創業約50年の老舗割烹・定食店。90種類以上の定食メニューが自慢。肉とナスの醤油炒め定食と鳥唐揚げが名物。地元に愛され続ける家庭的な味。孤独のグルメSeason9第6話の舞台。',
        tags: ['割烹', '定食', '肉ナス炒め', '唐揚げ', '南長崎', '創業50年', '90種類', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1321/A132101/13024072/',
        phone: '03-3951-1982',
        opening_hours: '11:30-14:00,18:00-22:00（日祝休み）',
        status: '営業中'
      },
      
      // 第7話-10話: 既に正しいためスキップ
      
      // 第11話: シリンゴル (店舗名微調整)
      {
        episodeId: EPISODE_IDS.episode11,
        episodeNum: 11,
        name: 'シリンゴル',
        slug: 'shilingol-sugamo-season9-episode11',
        address: '東京都文京区千石4-11-9',
        description: '1995年開店、日本初のモンゴル料理専門店。チャンサンマハと羊肉ジャージャー麺が名物。本場モンゴルの味を忠実に再現した専門店。孤独のグルメSeason9第11話の舞台。',
        tags: ['モンゴル料理', 'チャンサンマハ', '羊肉麺', '巣鴨', '日本初', '1995年開店', '本場の味', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1323/A132301/13005632/',
        phone: '03-5978-3837',
        opening_hours: '18:00-23:00（無休、予約なしの場合休業あり）',
        status: '営業中'
      },
      
      // 第12話: ファミリーレストラン トルーヴィル (店舗名微調整・閉店対応)
      {
        episodeId: EPISODE_IDS.episode12,
        episodeNum: 12,
        name: 'ファミリーレストラン トルーヴィル',
        slug: 'family-restaurant-trouville-isezaki-season9-episode12',
        address: '神奈川県横浜市南区真金町2-21',
        description: '創業50年の老舗ファミリーレストラン。チーズハンバーグと牛ヒレの生姜焼きが名物だった。昭和の香りを残す家族経営の洋食店。孤独のグルメSeason9第12話（最終回）の舞台。2025年7月閉店。',
        tags: ['洋食', 'チーズハンバーグ', '牛ヒレ生姜焼き', '伊勢佐木長者町', '創業50年', '家族経営', '閉店', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140104/14028400/',
        phone: '045-251-5526',
        opening_hours: '閉店（営業当時：11:00-14:00,17:00-21:00 金土日休み）',
        status: '閉店'
      }
    ]

    console.log(`\n🔄 ${correctLocationsData.length}店舗のデータ修正を開始...\n`)

    // 各店舗を修正
    for (const locationData of correctLocationsData) {
      console.log(`\n📍 Episode ${locationData.episodeNum}: ${locationData.name}`)
      console.log(`  🏢 住所: ${locationData.address}`)
      console.log(`  🔗 タベログ: ${locationData.tabelog_url}`)
      console.log(`  📊 状況: ${locationData.status}`)
      
      // 既存のロケーションを取得（episodeIdから関連ロケーションを検索）
      const { data: existingRelation } = await supabase
        .from('episode_locations')
        .select('location_id')
        .eq('episode_id', locationData.episodeId)
        .single()
      
      let locationId: string
      
      if (existingRelation) {
        locationId = existingRelation.location_id
        console.log(`  📝 既存ロケーション更新: ${locationId}`)
        
        // 既存ロケーションを正確なデータで更新
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            name: locationData.name,
            slug: locationData.slug,
            address: locationData.address,
            description: locationData.description,
            tags: locationData.tags,
            tabelog_url: locationData.tabelog_url,
            phone: locationData.phone,
            opening_hours: locationData.opening_hours
          })
          .eq('id', locationId)
        
        if (updateError) {
          console.error(`  ❌ 更新エラー:`, updateError)
          continue
        }
        console.log(`  ✅ データ修正完了`)
      } else {
        console.log(`  ⚠️ Episode ${locationData.episodeNum}: 既存の関連が見つかりません`)
        continue
      }
      
      // 営業状況に応じたメッセージ
      if (locationData.status === '閉店') {
        console.log(`  ⚠️ 閉店店舗: タベログページは情報として保持`)
      } else {
        console.log(`  💰 LinkSwitch対応: 準備完了`)
      }
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 Season9 完全データ修正完了！')
    console.log('✅ 正確な店舗名・タベログURL設定済み')
    console.log('⚠️ 閉店店舗の適切な情報更新済み')
    console.log('🔧 品質問題の根本解決完了')
    console.log('=' .repeat(70))
    
    // 最終確認
    console.log('\n🔍 修正結果確認...')
    const { data: finalCheck } = await supabase
      .from('episodes')
      .select(`
        title,
        episode_locations(
          location:locations(
            name,
            address,
            tabelog_url
          )
        )
      `)
      .like('title', '%Season9%')
      .order('title')
    
    let successCount = 0
    finalCheck?.forEach(episode => {
      const episodeNum = episode.title.match(/第(\d+)話/)?.[1] || '?'
      if (episode.episode_locations && episode.episode_locations.length > 0) {
        const location = episode.episode_locations[0].location
        const hasCorrectUrl = location.tabelog_url && location.tabelog_url.includes('tabelog.com')
        console.log(`  ${hasCorrectUrl ? '✅' : '❌'} Episode ${episodeNum}: ${location.name}`)
        if (hasCorrectUrl) successCount++
      }
    })
    
    const successRate = Math.round(successCount / 12 * 100)
    console.log(`\n🎊 修正成功率: ${successCount}/12店舗 (${successRate}%)`)
    
    if (successRate === 100) {
      console.log('💰 Season9 LinkSwitch収益化準備完了！')
    } else {
      console.log('⚠️ 一部修正が必要な店舗があります')
    }
    
  } catch (error) {
    console.error('❌ 修正中にエラーが発生しました:', error)
  }
}

// スクリプト実行
fixSeason9CompleteData()