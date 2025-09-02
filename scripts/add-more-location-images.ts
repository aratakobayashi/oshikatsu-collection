#!/usr/bin/env node

/**
 * 大量の画像なしロケーションに画像を追加するスクリプト（第2弾）
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY)

// 追加する画像データ（レストラン・カフェ・観光地を優先）
const moreLocationImages = [
  // === レストラン（重要度順） ===
  {
    name: 'かおたんラーメンえんとつ屋',
    searchPatterns: ['かおたんラーメンえんとつ屋', 'えんとつ屋', '南青山'],
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=250&fit=crop&q=80', // ラーメン
      'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400&h=250&fit=crop&q=80', // とんこつラーメン
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&h=250&fit=crop&q=80'  // ラーメン店内
    ],
    description: '南青山にある人気ラーメン店。濃厚なとんこつスープが特徴'
  },
  {
    name: 'じゃんがら ラーメン',
    searchPatterns: ['じゃんがら', 'ラーメン', '原宿'],
    images: [
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1623341214825-9f4f963727da?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=250&fit=crop&q=80'
    ],
    description: '原宿の人気ラーメンチェーン。九州系のとんこつラーメンが名物'
  },
  {
    name: 'ステーキハウス リベラ',
    searchPatterns: ['ステーキハウス リベラ', 'リベラ', '五反田', '目黒'],
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80', // ステーキ
      'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=250&fit=crop&q=80'
    ],
    description: '五反田・目黒の老舗ステーキハウス。上質な和牛ステーキを提供'
  },
  {
    name: '博多もつ鍋 やま中',
    searchPatterns: ['博多もつ鍋', 'やま中', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1548366565-6bbab241282d?w=400&h=250&fit=crop&q=80', // もつ鍋
      'https://images.unsplash.com/photo-1504973960431-1c467e159aa4?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座で本格博多もつ鍋が楽しめる専門店。コラーゲンたっぷりのスープが人気'
  },
  {
    name: '焼肉トラジ',
    searchPatterns: ['焼肉トラジ', 'トラジ', '京橋'],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558030137-a56c1b004fa3?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&h=250&fit=crop&q=80'
    ],
    description: '京橋の高級焼肉店。最高級の黒毛和牛を提供'
  },
  {
    name: '土鍋ご飯いくしか',
    searchPatterns: ['土鍋ご飯いくしか', 'いくしか', '中目黒'],
    images: [
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=250&fit=crop&q=80', // 土鍋ご飯
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=250&fit=crop&q=80'
    ],
    description: '中目黒の土鍋ご飯専門店。こだわりの釜炊きご飯が自慢'
  },
  {
    name: '極味や',
    searchPatterns: ['極味や', '渋谷パルコ'],
    images: [
      'https://images.unsplash.com/photo-1584278860047-22db9ff82bed?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607330289024-1535c6b4e1c1?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷パルコにある鶏料理専門店。極上の親子丼が名物'
  },
  {
    name: '洋麺屋 五右衛門',
    searchPatterns: ['洋麺屋 五右衛門', '五右衛門', '赤坂'],
    images: [
      'https://images.unsplash.com/photo-1611270629569-8b357cb88da9?w=400&h=250&fit=crop&q=80', // パスタ
      'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=250&fit=crop&q=80'
    ],
    description: '赤坂の創作パスタ専門店。箸で食べる和風パスタが特徴'
  },
  {
    name: '築地 どんぶり市場',
    searchPatterns: ['築地 どんぶり市場', 'どんぶり市場', '築地'],
    images: [
      'https://images.unsplash.com/photo-1535007813616-79dc02ba4021?w=400&h=250&fit=crop&q=80', // 海鮮丼
      'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1625938145312-b3bb35a1a8f8?w=400&h=250&fit=crop&q=80'
    ],
    description: '築地で新鮮な海鮮丼が楽しめる人気店。豪快な盛り付けが特徴'
  },
  {
    name: '釣船茶屋ざうお',
    searchPatterns: ['釣船茶屋ざうお', 'ざうお', '渋谷'],
    images: [
      'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=400&h=250&fit=crop&q=80', // 釣り居酒屋
      'https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷にある釣り体験ができる居酒屋。釣った魚をその場で調理'
  },
  
  // === カフェ・スイーツ ===
  {
    name: "L'Occitane Cafe",
    searchPatterns: ["L'Occitane Cafe", 'ロクシタンカフェ', '渋谷'],
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80'
    ],
    description: 'ロクシタンがプロデュースするおしゃれカフェ。ハーブティーとオーガニックメニューが人気'
  },
  {
    name: 'スターバックス コーヒー 渋谷スカイ店',
    searchPatterns: ['スターバックス', 'スタバ', '渋谷スカイ'],
    images: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522012188892-24beb302783d?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷スカイ14階にあるスターバックス。東京の絶景を眺めながらコーヒーを楽しめる'
  },
  {
    name: 'スイーツパラダイス',
    searchPatterns: ['スイーツパラダイス', 'スイパラ', 'ケーキバイキング'],
    images: [
      'https://images.unsplash.com/photo-1587241321921-91a834d6d191?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=250&fit=crop&q=80'
    ],
    description: 'ケーキ食べ放題で人気のスイーツビュッフェ。コラボカフェも頻繁に開催'
  },
  {
    name: 'Paul Bassett',
    searchPatterns: ['Paul Bassett', 'ポールバセット', '新宿'],
    images: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80'
    ],
    description: '新宿にある世界的バリスタのカフェ。エスプレッソベースのドリンクが絶品'
  },
  
  // === 観光地・施設 ===
  {
    name: 'しながわ水族館',
    searchPatterns: ['しながわ水族館', '品川水族館'],
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574263867128-a3d06c4b2110?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop&q=80'
    ],
    description: '品川にある歴史ある水族館。イルカショーと熱帯魚の展示が人気'
  },
  {
    name: '横浜アリーナ',
    searchPatterns: ['横浜アリーナ', 'よこアリ'],
    images: [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80'
    ],
    description: '横浜の大型イベント会場。コンサートやスポーツイベントが開催される'
  },
  {
    name: '江島神社',
    searchPatterns: ['江島神社', '江の島神社', '江ノ島神社'],
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80'
    ],
    description: '江の島にある由緒ある神社。縁結びのパワースポットとして人気'
  },
  {
    name: '大庭神社',
    searchPatterns: ['大庭神社', '藤沢'],
    images: [
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80'
    ],
    description: '藤沢にある歴史ある神社。地域の守り神として親しまれる'
  },
  {
    name: '熱海城',
    searchPatterns: ['熱海城'],
    images: [
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578469550956-0e16b69c6a3d?w=400&h=250&fit=crop&q=80'
    ],
    description: '熱海の観光名所。天守閣からの相模湾の眺望が絶景'
  },
  {
    name: 'ホテルニューオータニ',
    searchPatterns: ['ホテルニューオータニ', 'ニューオータニ', 'ガーデンラウンジ'],
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&h=250&fit=crop&q=80'
    ],
    description: '東京を代表する高級ホテル。日本庭園とガーデンラウンジが有名'
  },
  {
    name: '豊川稲荷東京別院',
    searchPatterns: ['豊川稲荷', '赤坂'],
    images: [
      'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&h=250&fit=crop&q=80'
    ],
    description: '赤坂にある商売繁盛の神様。多くの芸能人も参拝する'
  },
  {
    name: 'サンリオピューロランド',
    searchPatterns: ['サンリオピューロランド', 'ピューロランド'],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605440777709-a0c699a82d1e?w=400&h=250&fit=crop&q=80'
    ],
    description: 'サンリオキャラクターのテーマパーク。キティちゃんやマイメロディに会える'
  },
  {
    name: 'よみうりランド',
    searchPatterns: ['よみうりランド', '読売ランド'],
    images: [
      'https://images.unsplash.com/photo-1504109586057-7a2ae83d1338?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516051662687-567d7c4e8f6a?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1460881680858-30d872d5b530?w=400&h=250&fit=crop&q=80'
    ],
    description: '東京の人気遊園地。ジェットコースターとイルミネーションが人気'
  },
  
  // === ショッピング・エンタメ ===
  {
    name: 'タワーレコード渋谷店',
    searchPatterns: ['タワーレコード', 'タワレコ', '渋谷'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷の音楽文化の中心。CD・レコードの品揃えは日本最大級'
  },
  {
    name: 'PLAZA',
    searchPatterns: ['PLAZA', 'プラザ'],
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
    ],
    description: '輸入雑貨とコスメの人気ショップ。海外のおしゃれアイテムが豊富'
  },
  {
    name: 'ティファニー',
    searchPatterns: ['ティファニー', 'TIFFANY', '銀座', '丸の内'],
    images: [
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=250&fit=crop&q=80'
    ],
    description: '世界的ジュエリーブランド。ティファニーブルーのボックスが憧れの的'
  },
  {
    name: 'ルイ・ヴィトン',
    searchPatterns: ['ルイ・ヴィトン', 'ルイヴィトン', 'LOUIS VUITTON', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
    ],
    description: 'フランスの高級ブランド。銀座並木通り店は日本最大級の店舗'
  },
  {
    name: 'ユザワヤ',
    searchPatterns: ['ユザワヤ', '新宿'],
    images: [
      'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400&h=250&fit=crop&q=80'
    ],
    description: '新宿の大型手芸材料店。布地、毛糸、ビーズなど手作り素材が豊富'
  },
  {
    name: '109渋谷',
    searchPatterns: ['109', 'マルキュー', '渋谷'],
    images: [
      'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572705824045-3dd0c9a47945?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷のファッションランドマーク。若者向けのトレンドファッションが集結'
  },
  {
    name: 'ギンザシックス',
    searchPatterns: ['ギンザシックス', 'GINZA SIX', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座の大型複合商業施設。高級ブランドと日本文化が融合'
  },
  
  // === その他重要ロケーション ===
  {
    name: '東京ミステリーサーカス',
    searchPatterns: ['東京ミステリーサーカス', 'ミステリーサーカス', '歌舞伎町'],
    images: [
      'https://images.unsplash.com/photo-1604177439146-3b906f750cf2?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80'
    ],
    description: '新宿歌舞伎町にある体験型エンターテイメント施設。謎解きゲームの聖地'
  },
  {
    name: 'ラウンドワンスタジアム',
    searchPatterns: ['ラウンドワン', 'ラウワン', '川崎'],
    images: [
      'https://images.unsplash.com/photo-1545056453-f0359c3df6db?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=250&fit=crop&q=80'
    ],
    description: '川崎の総合アミューズメント施設。ボウリング、カラオケ、ゲームセンター完備'
  },
  {
    name: '警視庁本庁舎',
    searchPatterns: ['警視庁', '警視庁本部', '霞が関'],
    images: [
      'https://images.unsplash.com/photo-1569163139394-de4798aa62b6?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1577741314755-048d8525d31e?w=400&h=250&fit=crop&q=80'
    ],
    description: '霞が関にある警視庁本部。ドラマのロケ地としても有名'
  }
]

// 統計情報
const stats = {
  processed: 0,
  updated: 0,
  notFound: 0,
  errors: 0
}

async function updateLocationImages(locationData: any) {
  try {
    const searchPatterns = locationData.searchPatterns || [locationData.name]
    
    let location = null
    
    for (const searchName of searchPatterns) {
      const { data: locations, error: searchError } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', `%${searchName}%`)
        .limit(5)
      
      if (searchError) {
        console.error(`❌ Error searching for ${searchName}:`, searchError.message)
        continue
      }
      
      if (locations && locations.length > 0) {
        location = locations.find(loc => 
          loc.name.includes(locationData.name) || 
          locationData.name.includes(loc.name) ||
          searchPatterns.some(pattern => loc.name.includes(pattern))
        ) || locations[0]
        
        console.log(`  📍 Found: ${location.name} (ID: ${location.id.substring(0, 8)}...)`)
        break
      }
    }
    
    if (!location) {
      console.log(`  ⚠️  Not found: ${locationData.name}`)
      stats.notFound++
      return false
    }
    
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        image_urls: locationData.images,
        description: locationData.description
      })
      .eq('id', location.id)
    
    if (updateError) {
      console.error(`  ❌ Update error for ${location.name}:`, updateError.message)
      stats.errors++
      return false
    }
    
    console.log(`  ✅ Updated with ${locationData.images.length} images`)
    stats.updated++
    return true
    
  } catch (error: any) {
    console.error(`  ❌ Unexpected error for ${locationData.name}:`, error.message)
    stats.errors++
    return false
  }
}

async function main() {
  console.log('🚀 More Location Images - Batch Update')
  console.log('=====================================')
  console.log(`Total locations to process: ${moreLocationImages.length}`)
  console.log('Categories: Restaurants, Cafes, Tourist spots, Shopping\n')
  
  // データベース接続テスト
  console.log('🔌 Testing database connection...')
  try {
    const { count, error } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
    
    if (error) throw error
    console.log(`✅ Connected successfully. Total locations in DB: ${count}\n`)
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
  
  // カテゴリごとに処理
  console.log('🍽️  Processing Restaurants & Food...')
  console.log('-'.repeat(40))
  
  for (const locationData of moreLocationImages) {
    stats.processed++
    console.log(`\n[${stats.processed}/${moreLocationImages.length}] ${locationData.name}`)
    await updateLocationImages(locationData)
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // 10件ごとに進捗表示
    if (stats.processed % 10 === 0) {
      console.log(`\n📊 Progress: ${stats.processed}/${moreLocationImages.length} (${Math.round(stats.processed/moreLocationImages.length*100)}%)`)
    }
  }
  
  // 結果サマリー
  console.log('\n' + '='.repeat(50))
  console.log('📊 Final Statistics')
  console.log('='.repeat(50))
  console.log(`✅ Successfully updated: ${stats.updated}`)
  console.log(`⚠️  Not found: ${stats.notFound}`)
  console.log(`❌ Errors: ${stats.errors}`)
  console.log(`📝 Total processed: ${stats.processed}`)
  console.log(`✔️  Success rate: ${((stats.updated / stats.processed) * 100).toFixed(1)}%`)
  
  // 残りのカウント
  console.log('\n📈 Coverage Progress:')
  const { count: withImages } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .not('image_urls', 'is', null)
  
  const { count: total } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  console.log(`Locations with images: ${withImages}/${total} (${Math.round((withImages!/total!)*100)}%)`)
  console.log(`Remaining without images: ${total! - withImages!}`)
  
  console.log('\n✨ Batch update completed!')
}

// 実行
main().catch(console.error)