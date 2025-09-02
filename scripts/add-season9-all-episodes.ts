#!/usr/bin/env node

/**
 * 孤独のグルメ Season9 全12話エピソード・ロケーション一括追加スクリプト
 * 
 * 2021年7月-9月に放送されたSeason9の完全データベース化
 * Season7-8と同じフォーマットでUUID生成し、エピソードとロケーションを関連付け
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { randomUUID } from 'crypto'

dotenv.config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Season9エピソードID（新規生成UUID）
const SEASON9_EPISODE_IDS = {
  episode1: randomUUID(),  // とんかつしお田
  episode2: randomUUID(),  // 軽食喫茶 山小屋 & 魚処 にしけん
  episode3: randomUUID(),  // ギリシャ料理 タベルナ ミリュウ
  episode4: randomUUID(),  // 中国料理 Sincerity
  episode5: randomUUID(),  // 焼肉ふじ
  episode6: randomUUID(),  // 割烹・定食 さがら
  episode7: randomUUID(),  // 貴州火鍋
  episode8: randomUUID(),  // おにぎり処 えんむすび
  episode9: randomUUID(),  // 舞木ドライブイン
  episode10: randomUUID(), // 居酒屋 庄助
  episode11: randomUUID(), // SHILINGOL
  episode12: randomUUID()  // トルーヴィル
}

async function addSeason9AllEpisodesAndLocations() {
  console.log('🎬 孤独のグルメSeason9 全12話データベース化開始...\n')
  console.log('📅 放送期間: 2021年7月-9月')
  console.log('📺 テレビ東京系「ドラマ24」')
  console.log('=' .repeat(80))
  
  try {
    // 1. 松重豊のCelebrity情報を取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('id, name')
      .eq('slug', 'matsushige-yutaka')
      .single()
    
    if (!celebrity) {
      console.error('❌ 松重豊のセレブリティデータが見つかりません')
      return
    }
    
    console.log(`✅ Celebrity確認: ${celebrity.name} (${celebrity.id})`)
    
    // 2. Season9エピソードデータ
    const episodes = [
      {
        id: SEASON9_EPISODE_IDS.episode1,
        celebrity_id: celebrity.id,
        title: '神奈川県川崎市宮前平のひれかつ御膳と魚介クリームコロッケ',
        date: '2021-07-09',
        description: 'Season9第1話。神奈川県川崎市宮前平のとんかつ専門店「とんかつしお田」を訪問。ひれかつ御膳と魚介クリームコロッケ、エビフライを堪能。',
        tags: ['孤独のグルメ', 'Season9', 'とんかつ', '宮前平', '神奈川県']
      },
      {
        id: SEASON9_EPISODE_IDS.episode2,
        celebrity_id: celebrity.id,
        title: '神奈川県中郡二宮の金目鯛の煮付けと五郎オリジナルパフェ',
        date: '2021-07-16',
        description: 'Season9第2話。神奈川県二宮町の軽食喫茶「山小屋」と魚処「にしけん」を訪問。金目鯛の煮付けと特製パフェを楽しむ。',
        tags: ['孤独のグルメ', 'Season9', '金目鯛', 'パフェ', '二宮町']
      },
      {
        id: SEASON9_EPISODE_IDS.episode3,
        celebrity_id: celebrity.id,
        title: '東京都港区東麻布のムサカとドルマーデス',
        date: '2021-07-23',
        description: 'Season9第3話。東京都港区東麻布のギリシャ料理「タベルナ ミリュウ」を訪問。本格ギリシャ料理のムサカとドルマーデスを味わう。',
        tags: ['孤独のグルメ', 'Season9', 'ギリシャ料理', 'ムサカ', '東麻布']
      },
      {
        id: SEASON9_EPISODE_IDS.episode4,
        celebrity_id: celebrity.id,
        title: '東京都府中市新町の鰻の蒲焼チャーハンとカキとニラの辛し炒め',
        date: '2021-07-30',
        description: 'Season9第4話。東京都府中市新町の中国料理「Sincerity」を訪問。鰻の蒲焼チャーハンとカキとニラの辛し炒めを堪能。',
        tags: ['孤独のグルメ', 'Season9', '中国料理', '鰻', '府中市']
      },
      {
        id: SEASON9_EPISODE_IDS.episode5,
        celebrity_id: celebrity.id,
        title: '静岡県伊東市宇佐美の牛焼きしゃぶと豚焼きしゃぶ',
        date: '2021-08-06',
        description: 'Season9第5話。静岡県伊東市宇佐美の焼肉店「焼肉ふじ」を訪問。牛焼きしゃぶと豚焼きしゃぶという珍しいスタイルの焼肉を楽しむ。',
        tags: ['孤独のグルメ', 'Season9', '焼肉', '焼きしゃぶ', '伊東市']
      },
      {
        id: SEASON9_EPISODE_IDS.episode6,
        celebrity_id: celebrity.id,
        title: '東京都豊島区南長崎の肉とナスの醤油炒め定食と鳥唐揚げ',
        date: '2021-08-13',
        description: 'Season9第6話。東京都豊島区南長崎の「割烹・定食 さがら」を訪問。肉とナスの醤油炒め定食と鳥唐揚げを味わう。',
        tags: ['孤独のグルメ', 'Season9', '定食', '唐揚げ', '南長崎']
      },
      {
        id: SEASON9_EPISODE_IDS.episode7,
        celebrity_id: celebrity.id,
        title: '東京都葛飾区新小岩の貴州家庭式回鍋肉と納豆火鍋',
        date: '2021-08-20',
        description: 'Season9第7話。東京都葛飾区新小岩の「貴州火鍋」を訪問。貴州家庭式回鍋肉と納豆火鍋という珍しい組み合わせを堪能。',
        tags: ['孤独のグルメ', 'Season9', '火鍋', '回鍋肉', '新小岩']
      },
      {
        id: SEASON9_EPISODE_IDS.episode8,
        celebrity_id: celebrity.id,
        title: '群馬県高崎市のおむすびと鮎の塩焼き',
        date: '2021-08-27',
        description: 'Season9第8話。群馬県高崎市の「おにぎり処 えんむすび」を訪問。おむすび各種と鮎の塩焼きを楽しむ。',
        tags: ['孤独のグルメ', 'Season9', 'おにぎり', '鮎', '高崎市']
      },
      {
        id: SEASON9_EPISODE_IDS.episode9,
        celebrity_id: celebrity.id,
        title: '福島県郡山市舞木町ドライブインの焼肉定食',
        date: '2021-09-03',
        description: 'Season9第9話。福島県郡山市舞木町の「舞木ドライブイン」を訪問。懐かしいドライブインスタイルで焼肉定食を味わう。',
        tags: ['孤独のグルメ', 'Season9', 'ドライブイン', '焼肉定食', '郡山市']
      },
      {
        id: SEASON9_EPISODE_IDS.episode10,
        celebrity_id: celebrity.id,
        title: '栃木県宇都宮市のもつ煮込みとハムカツ',
        date: '2021-09-10',
        description: 'Season9第10話。栃木県宇都宮市の居酒屋「庄助」を訪問。もつ煮込み、ハムカツ、庄助ギョウザなど豊富なメニューを堪能。',
        tags: ['孤独のグルメ', 'Season9', 'もつ煮込み', 'ハムカツ', '宇都宮市']
      },
      {
        id: SEASON9_EPISODE_IDS.episode11,
        celebrity_id: celebrity.id,
        title: '東京都豊島区巣鴨のチャンサンマハと羊肉ジャージャー麺',
        date: '2021-09-17',
        description: 'Season9第11話。東京都豊島区巣鴨の「SHILINGOL」を訪問。モンゴル料理のチャンサンマハと羊肉ジャージャー麺を味わう。',
        tags: ['孤独のグルメ', 'Season9', 'モンゴル料理', '羊肉', '巣鴨']
      },
      {
        id: SEASON9_EPISODE_IDS.episode12,
        celebrity_id: celebrity.id,
        title: '神奈川県伊勢佐木長者町のチーズハンバーグと牛ヒレの生姜焼き',
        date: '2021-09-25',
        description: 'Season9最終話。神奈川県横浜市南区の「トルーヴィル」を訪問。チーズハンバーグと牛ヒレの生姜焼きでシーズンを締めくくる。',
        tags: ['孤独のグルメ', 'Season9', 'ハンバーグ', '生姜焼き', '伊勢佐木町']
      }
    ]
    
    console.log('\n📺 エピソード追加中...')
    let episodeCount = 0
    
    for (const episode of episodes) {
      const { error } = await supabase
        .from('episodes')
        .insert(episode)
      
      if (error) {
        console.error(`❌ エピソード追加エラー (${episode.title}):`, error.message)
      } else {
        episodeCount++
        console.log(`✅ Episode${episodeCount}: ${episode.title}`)
      }
    }
    
    // 3. ロケーションデータ
    const locations = [
      // 第1話: とんかつしお田
      {
        name: 'とんかつしお田',
        slug: 'tonkatsu-shioda-miyamaedaira-season9-episode1',
        address: '神奈川県川崎市宮前区宮前平3-10-17',
        description: '神奈川県川崎市宮前平のとんかつ専門店。ひれかつ御膳と魚介クリームコロッケが名物。丁寧に揚げられたとんかつと手作りコロッケが自慢の地域密着型の名店。孤独のグルメSeason9第1話の舞台。',
        category: 'とんかつ・揚げ物',
        phone: '044-877-5145',
        opening_hours: '11:00-14:00、17:00-20:00',
        tags: ['とんかつ', 'ひれかつ', 'コロッケ', '宮前平', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode1
      },
      
      // 第2話: 軽食喫茶 山小屋
      {
        name: '軽食喫茶 山小屋',
        slug: 'yamagoya-ninomiya-season9-episode2-1',
        address: '神奈川県中郡二宮町二宮222',
        description: '神奈川県二宮町の軽食喫茶店。五郎オリジナルパフェが名物。昭和レトロな雰囲気の中で手作りスイーツが楽しめる。孤独のグルメSeason9第2話の舞台。',
        category: '喫茶店・カフェ',
        phone: '0463-72-4941',
        opening_hours: '11:30-18:00（月）、11:30-21:00（木-日）',
        tags: ['喫茶店', 'パフェ', 'スイーツ', '二宮町', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode2
      },
      
      // 第3話: ギリシャ料理 タベルナ ミリュウ
      {
        name: 'ギリシャ料理 タベルナ ミリュウ',
        slug: 'taberna-miriu-azabu-season9-episode3',
        address: '東京都港区東麻布2-23-12 1F',
        description: '東京都港区東麻布の本格ギリシャ料理店。ムサカとドルマーデスが名物。地中海の味を忠実に再現した料理が楽しめる隠れ家的レストラン。孤独のグルメSeason9第3話の舞台。',
        category: 'ギリシャ料理・地中海料理',
        phone: '03-3568-7850',
        opening_hours: '11:30-15:00（ランチ）、17:30-21:00（ディナー）',
        tags: ['ギリシャ料理', 'ムサカ', 'ドルマーデス', '東麻布', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode3
      },
      
      // 第4話: 中国料理 Sincerity
      {
        name: '中国料理 Sincerity（しんせらてぃ）',
        slug: 'sincerity-fuchu-season9-episode4',
        address: '東京都府中市新町1-78-2',
        description: '東京都府中市新町の中国料理店。鰻の蒲焼チャーハンとカキとニラの辛し炒めが名物。創作中華料理で独創的なメニューが楽しめる。孤独のグルメSeason9第4話の舞台。',
        category: '中国料理・中華料理',
        opening_hours: '営業時間要確認',
        tags: ['中国料理', '鰻チャーハン', 'カキ炒め', '府中市', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode4
      },
      
      // 第5話: 焼肉ふじ
      {
        name: '焼肉ふじ',
        slug: 'yakiniku-fuji-ito-season9-episode5',
        address: '静岡県伊東市宇佐美',
        description: '静岡県伊東市宇佐美の焼肉店。牛焼きしゃぶと豚焼きしゃぶが名物。焼肉とシャブシャブを組み合わせた独特のスタイルが楽しめる地方の隠れた名店。孤独のグルメSeason9第5話の舞台。',
        category: '焼肉・焼きしゃぶ',
        tags: ['焼肉', '焼きしゃぶ', '牛肉', '豚肉', '伊東市', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode5
      },
      
      // 第6話: 割烹・定食 さがら
      {
        name: '割烹・定食 さがら',
        slug: 'sagara-minaminagasaki-season9-episode6',
        address: '東京都豊島区南長崎',
        description: '東京都豊島区南長崎の割烹・定食店。肉とナスの醤油炒め定食と鳥唐揚げが名物。家庭的な雰囲気で手作りの和食が楽しめる地域密着の食堂。孤独のグルメSeason9第6話の舞台。',
        category: '割烹・定食・和食',
        tags: ['定食', '唐揚げ', '肉ナス炒め', '南長崎', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode6
      },
      
      // 第7話: 貴州火鍋
      {
        name: '貴州火鍋',
        slug: 'kizou-hotpot-shinkoiwa-season9-episode7',
        address: '東京都葛飾区新小岩',
        description: '東京都葛飾区新小岩の中国貴州料理専門店。貴州家庭式回鍋肉と納豆火鍋が名物。本格的な貴州料理と日本風アレンジを組み合わせたユニークな料理が楽しめる。孤独のグルメSeason9第7話の舞台。',
        category: '中国料理・火鍋',
        tags: ['火鍋', '回鍋肉', '納豆', '貴州料理', '新小岩', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode7
      },
      
      // 第8話: おにぎり処 えんむすび
      {
        name: 'おにぎり処 えんむすび',
        slug: 'enmusubi-takasaki-season9-episode8',
        address: '群馬県高崎市',
        description: '群馬県高崎市のおにぎり専門店。各種おむすびと鮎の塩焼きが名物。具材にこだわったおむすびと季節の川魚料理が楽しめる。孤独のグルメSeason9第8話の舞台。',
        category: 'おにぎり・和食',
        tags: ['おにぎり', '鮎', '塩焼き', '高崎市', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode8
      },
      
      // 第9話: 舞木ドライブイン
      {
        name: '舞木（もうぎ）ドライブイン',
        slug: 'mougi-drivein-koriyama-season9-episode9',
        address: '福島県郡山市舞木町',
        description: '福島県郡山市舞木町のドライブイン。焼肉定食が名物。昭和レトロなドライブインの雰囲気で、ボリューム満点の焼肉定食が楽しめる地方の名店。孤独のグルメSeason9第9話の舞台。',
        category: 'ドライブイン・定食',
        tags: ['ドライブイン', '焼肉定食', '昭和レトロ', '郡山市', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode9
      },
      
      // 第10話: 居酒屋 庄助
      {
        name: '居酒屋 庄助',
        slug: 'shosuke-utsunomiya-season9-episode10',
        address: '栃木県宇都宮市',
        description: '栃木県宇都宮市の居酒屋。もつ煮込み、ハムカツ、庄助ギョウザが名物。地元に愛される居酒屋で、宇都宮名物のギョウザをはじめ豊富なメニューが楽しめる。孤独のグルメSeason9第10話の舞台。',
        category: '居酒屋・和食',
        tags: ['居酒屋', 'もつ煮込み', 'ハムカツ', 'ギョウザ', '宇都宮市', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode10
      },
      
      // 第11話: SHILINGOL
      {
        name: 'SHILINGOL',
        slug: 'shilingol-sugamo-season9-episode11',
        address: '東京都豊島区巣鴨',
        description: '東京都豊島区巣鴨のモンゴル料理店。チャンサンマハと羊肉ジャージャー麺が名物。本格的なモンゴル料理が楽しめる珍しい専門店。孤独のグルメSeason9第11話の舞台。',
        category: 'モンゴル料理・アジア料理',
        tags: ['モンゴル料理', 'チャンサンマハ', '羊肉', 'ジャージャー麺', '巣鴨', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode11
      },
      
      // 第12話: トルーヴィル
      {
        name: 'トルーヴィル',
        slug: 'trouville-isezakicho-season9-episode12',
        address: '神奈川県横浜市南区真金町2-21-17',
        description: '神奈川県横浜市南区（伊勢佐木長者町）の洋食店。チーズハンバーグと牛ヒレの生姜焼きが名物。伊勢佐木長者町駅から徒歩6分の隠れ家的洋食店。孤独のグルメSeason9最終話の舞台。',
        category: '洋食・ハンバーグ',
        tags: ['洋食', 'チーズハンバーグ', '牛ヒレ', '生姜焼き', '伊勢佐木町', '孤独のグルメ', 'Season9'],
        episode_id: SEASON9_EPISODE_IDS.episode12
      }
    ]
    
    console.log('\n🏪 ロケーション追加中...')
    let locationCount = 0
    
    for (const location of locations) {
      const { error } = await supabase
        .from('locations')
        .insert(location)
      
      if (error) {
        console.error(`❌ ロケーション追加エラー (${location.name}):`, error.message)
      } else {
        locationCount++
        console.log(`✅ Location${locationCount}: ${location.name}`)
      }
    }
    
    // 4. Episode-Location関連付け（episode_locationsテーブル）
    console.log('\n🔗 エピソード-ロケーション関連付け中...')
    let linkCount = 0
    
    for (const location of locations) {
      // ロケーションIDを取得
      const { data: insertedLocation } = await supabase
        .from('locations')
        .select('id')
        .eq('slug', location.slug)
        .single()
      
      if (insertedLocation) {
        const { error } = await supabase
          .from('episode_locations')
          .insert({
            episode_id: location.episode_id,
            location_id: insertedLocation.id
          })
        
        if (error) {
          console.error(`❌ 関連付けエラー (${location.name}):`, error.message)
        } else {
          linkCount++
          console.log(`✅ Link${linkCount}: Episode-${location.name}`)
        }
      }
    }
    
    // 5. 結果サマリー
    console.log('\n' + '=' .repeat(80))
    console.log('🎉 孤独のグルメSeason9 完全データベース化完了!')
    console.log('=' .repeat(80))
    console.log('📊 追加結果サマリー:')
    console.log(`   📺 エピソード: ${episodeCount}/12話`)
    console.log(`   🏪 ロケーション: ${locationCount}箇所`)
    console.log(`   🔗 関連付け: ${linkCount}件`)
    console.log('')
    console.log('🏆 Season9の特徴:')
    console.log('   - 地域拡大: 東京・神奈川・静岡・群馬・栃木・福島')
    console.log('   - 料理多様化: 和洋中・ギリシャ・モンゴル料理まで')
    console.log('   - 魚料理豊富: 金目鯛、鰻、鮎など海川の恵み')
    console.log('   - 地方グルメ: ドライブインなど地域色豊か')
    console.log('')
    console.log('🚀 次のステップ:')
    console.log('   - Season10以降のデータ調査')
    console.log('   - 各店舗の営業状況確認・更新')
    console.log('   - LinkSwitch対応でマネタイズ強化')
    console.log('   - ユーザー向けSeason9ガイドページ作成')
    
  } catch (error) {
    console.error('❌ データベース追加中にエラーが発生:', error)
  }
}

// 実行
addSeason9AllEpisodesAndLocations().catch(console.error)