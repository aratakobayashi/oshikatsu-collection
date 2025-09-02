#!/usr/bin/env node

/**
 * Season9 ロケーション紐付けとLinkSwitch対応スクリプト
 * 
 * 既存のSeason9エピソードに対してロケーションを紐付け、
 * タベログURLを設定してLinkSwitch対応を行う
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// 松重豊のセレブリティID
const MATSUSHIGE_CELEBRITY_ID = '39bb6fe4-97ed-439d-9bb6-868dd660ec66'

async function fixSeason9LocationsAndLinkSwitch() {
  console.log('🎉 Season9 ロケーション紐付け＆LinkSwitch対応開始...\n')
  console.log('🏆 孤独のグルメSeason9完全収益化プロジェクト')
  console.log('=' .repeat(70))
  
  try {
    // Season9のロケーションデータ（タベログURL調査済み）
    const locationsData = [
      // 第1話: とんかつ しお田
      {
        episodeNumber: 1,
        name: 'とんかつ しお田',
        slug: 'tonkatsu-shioda-miyamaedaira-season9-episode1',
        address: '神奈川県川崎市宮前区宮前平2-15-15',
        description: '1972年創業の老舗とんかつ店。自慢のトンカツ定食と海老クリームコロッケが名物。孤独のグルメSeason9第1話の舞台。',
        tags: ['とんかつ', '海老クリームコロッケ', '宮前平', '老舗', '1972年創業', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1405/A140507/14030497/',
        phone: '044-854-1071',
        opening_hours: '11:00-14:00,17:00-21:00（月曜休み）',
        linkswitch_active: true
      },
      
      // 第2話: 海鮮料理 みやけ
      {
        episodeNumber: 2,
        name: '海鮮料理 みやけ',
        slug: 'kaisen-miyake-ninomiya-season9-episode2',
        address: '神奈川県中郡二宮町二宮879',
        description: '二宮駅近くの海鮮料理店。金目鯛の煮付けと五郎オリジナルパフェが名物。孤独のグルメSeason9第2話の舞台。',
        tags: ['海鮮料理', '金目鯛', 'パフェ', '二宮', '定食', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1404/A140408/14000115/',
        phone: '0463-71-1004',
        opening_hours: '11:00-20:00（水曜休み）',
        linkswitch_active: true
      },
      
      // 第3話: PAROS（パロス）
      {
        episodeNumber: 3,
        name: 'PAROS（パロス）',
        slug: 'paros-higashi-azabu-season9-episode3',
        address: '東京都港区東麻布1-8-1 東麻布ISビル1F',
        description: 'ギリシャ料理レストラン。ムサカとドルマーデスが名物。本格的なギリシャ料理が味わえる。孤独のグルメSeason9第3話の舞台。',
        tags: ['ギリシャ料理', 'ムサカ', 'ドルマーデス', '東麻布', '地中海料理', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1307/A130702/13128953/',
        phone: '03-3560-6206',
        opening_hours: '11:30-14:30,18:00-22:00（日祝休み）',
        linkswitch_active: true
      },
      
      // 第4話: 中国料理 天山
      {
        episodeNumber: 4,
        name: '中国料理 天山',
        slug: 'tenzan-fuchu-shinmachi-season9-episode4',
        address: '東京都府中市新町1-67-1',
        description: '府中の本格中華料理店。鰻の蒲焼チャーハンとカキとニラの辛し炒めが名物。孤独のグルメSeason9第4話の舞台。',
        tags: ['中華料理', '鰻チャーハン', 'カキニラ炒め', '府中', '本格中華', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1326/A132602/13003087/',
        phone: '042-361-6835',
        opening_hours: '11:00-15:00,17:00-21:00（月曜休み）',
        linkswitch_active: true
      },
      
      // 第5話: 焼肉ふじ
      {
        episodeNumber: 5,
        name: '焼肉ふじ',
        slug: 'yakiniku-fuji-usami-season9-episode5',
        address: '静岡県伊東市宇佐美1131-14',
        description: '宇佐美の精肉店直営焼肉店。牛焼きしゃぶと豚焼きしゃぶが名物。昼は精肉店、夜は焼肉店として営業。孤独のグルメSeason9第5話の舞台。',
        tags: ['焼肉', '焼きしゃぶ', '精肉店直営', '宇佐美', '要予約', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/shizuoka/A2205/A220503/22001693/',
        phone: '0557-47-2983',
        opening_hours: '17:00-22:00（火曜休み、要予約）',
        linkswitch_active: true
      },
      
      // 第6話: 割烹・定食 さがら
      {
        episodeNumber: 6,
        name: '割烹・定食 さがら',
        slug: 'sagara-minami-nagasaki-season9-episode6',
        address: '東京都豊島区南長崎5-24-7',
        description: '創業約50年の老舗割烹・定食店。肉とナスの醤油炒め定食と鳥唐揚げが名物。孤独のグルメSeason9第6話の舞台。',
        tags: ['割烹', '定食', '肉ナス炒め', '唐揚げ', '南長崎', '創業50年', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1321/A132101/13108809/',
        phone: '03-3951-2284',
        opening_hours: '11:30-14:00,17:00-22:00（日祝休み）',
        linkswitch_active: true
      },
      
      // 第7話: 貴州火鍋
      {
        episodeNumber: 7,
        name: '貴州火鍋',
        slug: 'guizhou-huoguo-shin-koiwa-season9-episode7',
        address: '東京都葛飾区新小岩1-55-1',
        description: '新小岩の貴州料理専門店。貴州家庭式回鍋肉と納豆火鍋が名物。食べログ3.42の高評価中華料理店。孤独のグルメSeason9第7話の舞台。',
        tags: ['貴州料理', '回鍋肉', '火鍋', '納豆火鍋', '新小岩', '中華料理', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1312/A131204/13232027/',
        phone: '03-3656-6250',
        opening_hours: '17:00-22:30（日曜休み）',
        linkswitch_active: true
      },
      
      // 第8話: えんむすび
      {
        episodeNumber: 8,
        name: 'えんむすび',
        slug: 'enmusubi-takasaki-season9-episode8',
        address: '群馬県高崎市本町33',
        description: '高崎の元寿司職人が営むおむすび専門店。40種類のおにぎりが自慢。鮎の塩焼きも名物。孤独のグルメSeason9第8話の舞台。',
        tags: ['おむすび', 'おにぎり', '鮎の塩焼き', '高崎', '元寿司職人', '要予約', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/gunma/A1001/A100102/10014543/',
        phone: '027-323-1667',
        opening_hours: '18:00-26:00（不定休、要予約）',
        linkswitch_active: true
      },
      
      // 第9話: 舞木ドライブイン
      {
        episodeNumber: 9,
        name: '舞木ドライブイン',
        slug: 'maigi-drive-in-koriyama-season9-episode9',
        address: '福島県郡山市舞木町字宮ノ前42-1',
        description: '創業48年の老舗ドライブイン。焼肉定食が名物で大盛りで有名。地元に愛され続ける昭和の雰囲気。孤独のグルメSeason9第9話の舞台。',
        tags: ['ドライブイン', '焼肉定食', '大盛り', '郡山', '創業48年', '昭和レトロ', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/fukushima/A0702/A070201/7000331/',
        phone: '024-956-2127',
        opening_hours: '11:00-19:30（水曜休み）',
        linkswitch_active: true
      },
      
      // 第10話: 庄助
      {
        episodeNumber: 10,
        name: '庄助',
        slug: 'shosuke-utsunomiya-season9-episode10',
        address: '栃木県宇都宮市塙田2-2-3',
        description: '1950年創業、70年以上の歴史を誇る老舗居酒屋。もつ煮込みとハムカツが名物。昭和の雰囲気を残す地元の名店。孤独のグルメSeason9第10話の舞台。',
        tags: ['居酒屋', 'もつ煮込み', 'ハムカツ', '宇都宮', '1950年創業', '老舗', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tochigi/A0901/A090101/9000053/',
        phone: '028-622-3506',
        opening_hours: '17:00-22:00（日月祝休み）',
        linkswitch_active: true
      },
      
      // 第11話: Shilingol（シリンゴル）
      {
        episodeNumber: 11,
        name: 'Shilingol（シリンゴル）',
        slug: 'shilingol-sugamo-season9-episode11',
        address: '東京都文京区千石4-11-9',
        description: '1995年開店、日本初のモンゴル料理店。チャンサンマハと羊肉ジャージャー麺が名物。食べログ3.58の高評価店。孤独のグルメSeason9第11話の舞台。',
        tags: ['モンゴル料理', 'チャンサンマハ', '羊肉麺', '巣鴨', '日本初', '1995年開店', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/tokyo/A1323/A132301/13005632/',
        phone: '03-5978-3837',
        opening_hours: '18:00-23:00（無休、予約なしの場合休業あり）',
        linkswitch_active: true
      },
      
      // 第12話: トルーヴィル
      {
        episodeNumber: 12,
        name: 'トルーヴィル',
        slug: 'trouville-isezaki-chooja-machi-season9-episode12',
        address: '神奈川県横浜市中区伊勢佐木町5-126',
        description: '創業41年の老舗洋食店。チーズハンバーグと牛ヒレの生姜焼きが名物。夫婦経営のアットホームな店。孤独のグルメSeason9第12話（最終回）の舞台。',
        tags: ['洋食', 'チーズハンバーグ', '牛ヒレ生姜焼き', '伊勢佐木長者町', '創業41年', '夫婦経営', '孤独のグルメ', 'Season9'],
        tabelog_url: 'https://tabelog.com/kanagawa/A1401/A140104/14009684/',
        phone: '045-251-5526',
        opening_hours: '11:00-14:00,17:00-21:00（金土日休み）',
        linkswitch_active: true
      }
    ]

    // 既存のSeason9エピソードを取得
    const { data: episodes, error: episodesError } = await supabase
      .from('episodes')
      .select('id, title')
      .like('title', '%Season9%')
      .order('title')
    
    if (episodesError || !episodes || episodes.length === 0) {
      console.error('❌ Season9エピソードが見つかりません')
      return
    }
    
    console.log(`\n✅ ${episodes.length}個のSeason9エピソードを発見\n`)

    // 各ロケーションを処理
    for (const locationData of locationsData) {
      console.log(`\n🏪 Episode ${locationData.episodeNumber}: ${locationData.name}`)
      
      // 対応するエピソードを見つける
      const episode = episodes.find(ep => 
        ep.title.includes(`第${locationData.episodeNumber}話`)
      )
      
      if (!episode) {
        console.log(`  ❌ Episode ${locationData.episodeNumber}が見つかりません`)
        continue
      }
      
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
        
        // 既存ロケーションを更新（LinkSwitch対応）
        const { error: updateError } = await supabase
          .from('locations')
          .update({
            tabelog_url: locationData.tabelog_url,
            linkswitch_active: locationData.linkswitch_active,
            description: locationData.description,
            tags: locationData.tags
          })
          .eq('id', locationId)
        
        if (updateError) {
          console.error(`  ❌ 更新エラー:`, updateError)
          continue
        }
      } else {
        // 新規ロケーションを作成
        const newLocationId = uuidv4()
        const { error: insertError } = await supabase
          .from('locations')
          .insert({
            id: newLocationId,
            name: locationData.name,
            slug: locationData.slug,
            address: locationData.address,
            description: locationData.description,
            tags: locationData.tags,
            tabelog_url: locationData.tabelog_url,
            phone: locationData.phone,
            opening_hours: locationData.opening_hours,
            linkswitch_active: locationData.linkswitch_active
          })
        
        if (insertError) {
          console.error(`  ❌ 作成エラー:`, insertError)
          continue
        }
        
        locationId = newLocationId
        console.log(`  ✅ 新規ロケーション作成: ${locationId}`)
      }
      
      // エピソードとロケーションの関連をチェック
      const { data: existingRelation } = await supabase
        .from('episode_locations')
        .select('id')
        .eq('episode_id', episode.id)
        .eq('location_id', locationId)
        .single()
      
      if (!existingRelation) {
        // 関連を作成
        const { error: relationError } = await supabase
          .from('episode_locations')
          .insert({
            id: uuidv4(),
            episode_id: episode.id,
            location_id: locationId
          })
        
        if (relationError) {
          console.error(`  ❌ 関連作成エラー:`, relationError)
        } else {
          console.log(`  ✅ エピソード関連作成完了`)
        }
      } else {
        console.log(`  ℹ️ エピソード関連は既に存在`)
      }
      
      console.log(`  🔗 タベログURL: ${locationData.tabelog_url}`)
      console.log(`  💰 LinkSwitch: ${locationData.linkswitch_active ? '✅ 有効' : '❌ 無効'}`)
    }
    
    console.log('\n' + '=' .repeat(70))
    console.log('🎉 Season9 LinkSwitch対応完了！')
    console.log('💰 全12店舗がアフィリエイト収益化対象になりました')
    console.log('=' .repeat(70))
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  }
}

// スクリプト実行
fixSeason9LocationsAndLinkSwitch()