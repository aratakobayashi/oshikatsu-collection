#!/usr/bin/env node

/**
 * Season9 ロケーション追加＆LinkSwitch対応スクリプト（修正版）
 * 
 * Season8の成功パターンを踏襲し、既存エピソードIDを使用して
 * ロケーション登録とLinkSwitch対応を行う
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Season9エピソードID（データベースから取得済み）
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

async function addSeason9LocationsAndLinkSwitch() {
  console.log('🎉 Season9 ロケーション追加＆LinkSwitch対応開始...\n')
  console.log('🏆 孤独のグルメSeason9完全収益化プロジェクト（修正版）')
  console.log('=' .repeat(70))
  
  try {
    const locationsData = [
      // 第1話: とんかつ しお田
      {
        episodeId: EPISODE_IDS.episode1,
        name: 'とんかつ しお田',
        slug: 'tonkatsu-shioda-miyamaedaira-season9-episode1',
        address: '神奈川県川崎市宮前区宮前平2-15-15',
        description: '1972年創業の老舗とんかつ店。自慢のトンカツ定食と海老クリームコロッケが名物。地元に愛される老舗の味。孤独のグルメSeason9第1話の舞台。',
        tags: ['とんかつ', '海老クリームコロッケ', '宮前平', '老舗', '1972年創業', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140507/14030497/',
        phone: '044-854-1071',
        opening_hours: '11:00-14:00,17:00-21:00（月曜休み）'
      },
      
      // 第2話: 海鮮料理 みやけ
      {
        episodeId: EPISODE_IDS.episode2,
        name: '海鮮料理 みやけ',
        slug: 'kaisen-miyake-ninomiya-season9-episode2',
        address: '神奈川県中郡二宮町二宮879',
        description: '二宮駅近くの海鮮料理店。金目鯛の煮付けと五郎オリジナルパフェが名物。新鮮な魚介を使った定食が人気。孤独のグルメSeason9第2話の舞台。',
        tags: ['海鮮料理', '金目鯛', 'パフェ', '二宮', '定食', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1404/A140408/14000115/',
        phone: '0463-71-1004',
        opening_hours: '11:00-20:00（水曜休み）'
      },
      
      // 第3話: PAROS（パロス）
      {
        episodeId: EPISODE_IDS.episode3,
        name: 'PAROS（パロス）',
        slug: 'paros-higashi-azabu-season9-episode3',
        address: '東京都港区東麻布1-8-1 東麻布ISビル1F',
        description: 'ギリシャ料理レストラン。ムサカとドルマーデスが名物。本格的なギリシャ料理が味わえる都内屈指の専門店。孤独のグルメSeason9第3話の舞台。',
        tags: ['ギリシャ料理', 'ムサカ', 'ドルマーデス', '東麻布', '地中海料理', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1307/A130702/13128953/',
        phone: '03-3560-6206',
        opening_hours: '11:30-14:30,18:00-22:00（日祝休み）'
      },
      
      // 第4話: 中国料理 天山
      {
        episodeId: EPISODE_IDS.episode4,
        name: '中国料理 天山',
        slug: 'tenzan-fuchu-shinmachi-season9-episode4',
        address: '東京都府中市新町1-67-1',
        description: '府中の本格中華料理店。鰻の蒲焼チャーハンとカキとニラの辛し炒めが名物。こだわりの中華料理が味わえる。孤独のグルメSeason9第4話の舞台。',
        tags: ['中華料理', '鰻チャーハン', 'カキニラ炒め', '府中', '本格中華', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1326/A132602/13003087/',
        phone: '042-361-6835',
        opening_hours: '11:00-15:00,17:00-21:00（月曜休み）'
      },
      
      // 第5話: 焼肉ふじ
      {
        episodeId: EPISODE_IDS.episode5,
        name: '焼肉ふじ',
        slug: 'yakiniku-fuji-usami-season9-episode5',
        address: '静岡県伊東市宇佐美1131-14',
        description: '宇佐美の精肉店直営焼肉店。牛焼きしゃぶと豚焼きしゃぶが名物。昼は精肉店、夜は焼肉店として営業する珍しいスタイル。孤独のグルメSeason9第5話の舞台。',
        tags: ['焼肉', '焼きしゃぶ', '精肉店直営', '宇佐美', '要予約', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/shizuoka/A2205/A220503/22001693/',
        phone: '0557-47-2983',
        opening_hours: '17:00-22:00（火曜休み、要予約）'
      },
      
      // 第6話: 割烹・定食 さがら
      {
        episodeId: EPISODE_IDS.episode6,
        name: '割烹・定食 さがら',
        slug: 'sagara-minami-nagasaki-season9-episode6',
        address: '東京都豊島区南長崎5-24-7',
        description: '創業約50年の老舗割烹・定食店。肉とナスの醤油炒め定食と鳥唐揚げが名物。家庭的な味わいで地元に愛される。孤独のグルメSeason9第6話の舞台。',
        tags: ['割烹', '定食', '肉ナス炒め', '唐揚げ', '南長崎', '創業50年', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1321/A132101/13108809/',
        phone: '03-3951-2284',
        opening_hours: '11:30-14:00,17:00-22:00（日祝休み）'
      },
      
      // 第7話: 貴州火鍋
      {
        episodeId: EPISODE_IDS.episode7,
        name: '貴州火鍋',
        slug: 'guizhou-huoguo-shin-koiwa-season9-episode7',
        address: '東京都葛飾区新小岩1-55-1',
        description: '新小岩の貴州料理専門店。貴州家庭式回鍋肉と納豆火鍋が名物。食べログ3.42の高評価を誇る本格中華料理店。孤独のグルメSeason9第7話の舞台。',
        tags: ['貴州料理', '回鍋肉', '火鍋', '納豆火鍋', '新小岩', '中華料理', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1312/A131204/13232027/',
        phone: '03-3656-6250',
        opening_hours: '17:00-22:30（日曜休み）'
      },
      
      // 第8話: えんむすび
      {
        episodeId: EPISODE_IDS.episode8,
        name: 'えんむすび',
        slug: 'enmusubi-takasaki-season9-episode8',
        address: '群馬県高崎市本町33',
        description: '高崎の元寿司職人が営むおむすび専門店。40種類のおにぎりが自慢。鮎の塩焼きも名物の人気店。孤独のグルメSeason9第8話の舞台。',
        tags: ['おむすび', 'おにぎり', '鮎の塩焼き', '高崎', '元寿司職人', '要予約', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/gunma/A1001/A100102/10014543/',
        phone: '027-323-1667',
        opening_hours: '18:00-26:00（不定休、要予約）'
      },
      
      // 第9話: 舞木ドライブイン
      {
        episodeId: EPISODE_IDS.episode9,
        name: '舞木ドライブイン',
        slug: 'maigi-drive-in-koriyama-season9-episode9',
        address: '福島県郡山市舞木町字宮ノ前42-1',
        description: '創業48年の老舗ドライブイン。焼肉定食が名物で大盛りで有名。地元に愛され続ける昭和の雰囲気を残す名店。孤独のグルメSeason9第9話の舞台。',
        tags: ['ドライブイン', '焼肉定食', '大盛り', '郡山', '創業48年', '昭和レトロ', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/fukushima/A0702/A070201/7000331/',
        phone: '024-956-2127',
        opening_hours: '11:00-19:30（水曜休み）'
      },
      
      // 第10話: 庄助
      {
        episodeId: EPISODE_IDS.episode10,
        name: '庄助',
        slug: 'shosuke-utsunomiya-season9-episode10',
        address: '栃木県宇都宮市塙田2-2-3',
        description: '1950年創業、70年以上の歴史を誇る老舗居酒屋。もつ煮込みとハムカツが名物。昭和の雰囲気を残す地元の名店。孤独のグルメSeason9第10話の舞台。',
        tags: ['居酒屋', 'もつ煮込み', 'ハムカツ', '宇都宮', '1950年創業', '老舗', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tochigi/A0901/A090101/9000053/',
        phone: '028-622-3506',
        opening_hours: '17:00-22:00（日月祝休み）'
      },
      
      // 第11話: Shilingol（シリンゴル）
      {
        episodeId: EPISODE_IDS.episode11,
        name: 'Shilingol（シリンゴル）',
        slug: 'shilingol-sugamo-season9-episode11',
        address: '東京都文京区千石4-11-9',
        description: '1995年開店、日本初のモンゴル料理店。チャンサンマハと羊肉ジャージャー麺が名物。食べログ3.58の高評価を誇る専門店。孤独のグルメSeason9第11話の舞台。',
        tags: ['モンゴル料理', 'チャンサンマハ', '羊肉麺', '巣鴨', '日本初', '1995年開店', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1323/A132301/13005632/',
        phone: '03-5978-3837',
        opening_hours: '18:00-23:00（無休、予約なしの場合休業あり）'
      },
      
      // 第12話: トルーヴィル
      {
        episodeId: EPISODE_IDS.episode12,
        name: 'トルーヴィル',
        slug: 'trouville-isezaki-chooja-machi-season9-episode12',
        address: '神奈川県横浜市中区伊勢佐木町5-126',
        description: '創業41年の老舗洋食店。チーズハンバーグと牛ヒレの生姜焼きが名物。夫婦経営のアットホームな店。孤独のグルメSeason9第12話（最終回）の舞台。',
        tags: ['洋食', 'チーズハンバーグ', '牛ヒレ生姜焼き', '伊勢佐木長者町', '創業41年', '夫婦経営', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140104/14009684/',
        phone: '045-251-5526',
        opening_hours: '11:00-14:00,17:00-21:00（金土日休み）'
      }
    ]

    console.log(`\n🏪 ${locationsData.length}店舗のロケーション登録を開始...\n`)

    // 各ロケーションを処理
    for (const [index, locationData] of locationsData.entries()) {
      const episodeNum = index + 1
      console.log(`\n📍 Episode ${episodeNum}: ${locationData.name}`)
      console.log(`  🔗 タベログ: ${locationData.tabelog_url}`)
      
      // ロケーションが既に存在するか確認
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', locationData.slug)
        .single()
      
      let locationId: string
      
      if (existingLocation) {
        locationId = existingLocation.id
        console.log(`  📝 既存ロケーションを更新: ${locationId}`)
        
        // 既存ロケーションを更新（タベログURL等を設定）
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            tabelog_url: locationData.tabelog_url,
            description: locationData.description,
            tags: locationData.tags,
            phone: locationData.phone,
            opening_hours: locationData.opening_hours
          })
          .eq('id', locationId)
        
        if (updateError) {
          console.error(`  ❌ 更新エラー:`, updateError)
          continue
        }
        console.log(`  ✅ ロケーション更新完了`)
      } else {
        // 新規ロケーションを作成
        const { data: newLocation, error: insertError } = await supabase
          .from('locations')
          .insert({
            name: locationData.name,
            slug: locationData.slug,
            address: locationData.address,
            description: locationData.description,
            tags: locationData.tags,
            tabelog_url: locationData.tabelog_url,
            phone: locationData.phone,
            opening_hours: locationData.opening_hours
          })
          .select('id')
          .single()
        
        if (insertError || !newLocation) {
          console.error(`  ❌ 作成エラー:`, insertError)
          continue
        }
        
        locationId = newLocation.id
        console.log(`  ✅ 新規ロケーション作成: ${locationId}`)
      }
      
      // エピソードとロケーションの関連をチェック
      const { data: existingRelation } = await supabase
        .from('episode_locations')
        .select('id')
        .eq('episode_id', locationData.episodeId)
        .eq('location_id', locationId)
        .single()
      
      if (!existingRelation) {
        // 関連を作成
        const { error: relationError } = await supabase
          .from('episode_locations')
          .insert({
            episode_id: locationData.episodeId,
            location_id: locationId
          })
        
        if (relationError) {
          console.error(`  ❌ 関連作成エラー:`, relationError)
        } else {
          console.log(`  🔗 エピソード関連作成完了`)
        }
      } else {
        console.log(`  ℹ️ エピソード関連は既に存在`)
      }
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 Season9 ロケーション追加完了！')
    console.log('💰 全12店舗にタベログURLを設定しました')
    console.log('🔗 LinkSwitch収益化の準備が完了しました')
    console.log('=' .repeat(70))
    
    // 最終確認
    console.log('\n🔍 最終確認中...')
    const { data: finalCheck } = await supabase
      .from('episodes')
      .select(`
        title,
        episode_locations(
          location:locations(
            name,
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
        console.log(`  ✅ Episode ${episodeNum}: ${location.name} - ${location.tabelog_url ? 'タベログURL設定済み' : 'URL未設定'}`)
        if (location.tabelog_url) successCount++
      }
    })
    
    console.log(`\n🎊 成功率: ${successCount}/12店舗 (${Math.round(successCount/12*100)}%)`)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
addSeason9LocationsAndLinkSwitch()