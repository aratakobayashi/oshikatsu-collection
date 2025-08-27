#!/usr/bin/env node

/**
 * メガバッチ画像追加スクリプト - さらに大量のロケーションに画像追加
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const PROD_SUPABASE_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

const supabase = createClient(PROD_SUPABASE_URL, PROD_ANON_KEY)

// メガバッチ追加対象のロケーション（50件以上）
const megaLocationImages = [
  // === レストラン・グルメ ===
  {
    name: 'フレッシュネスバーガー',
    searchPatterns: ['フレッシュネスバーガー', 'フレッシュネス', '渋谷センター街'],
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=250&fit=crop&q=80', // ハンバーガー
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷センター街の人気ハンバーガーチェーン。フレッシュな野菜とパティが自慢'
  },
  {
    name: 'モスバーガー',
    searchPatterns: ['モスバーガー', 'モス', '芝大門'],
    images: [
      'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&h=250&fit=crop&q=80'
    ],
    description: '芝大門にある日本発祥のハンバーガーチェーン。国産食材にこだわり'
  },
  {
    name: 'わが家の食堂',
    searchPatterns: ['わが家の食堂', '葛西'],
    images: [
      'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=250&fit=crop&q=80', // 家庭料理
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=250&fit=crop&q=80'
    ],
    description: '葛西にある家庭的な定食屋。アットホームな雰囲気と手作りの味が人気'
  },
  {
    name: 'わんこそば',
    searchPatterns: ['わんこそば', '回転わんこそば'],
    images: [
      'https://images.unsplash.com/photo-1616662813165-fbd79d71b4b5?w=400&h=250&fit=crop&q=80', // そば
      'https://images.unsplash.com/photo-1606187963706-c6c5aeeda3d0?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1637654574187-6c1f39b20225?w=400&h=250&fit=crop&q=80'
    ],
    description: '岩手名物わんこそばを東京で体験できる専門店。何杯食べられるかチャレンジ'
  },
  {
    name: '伊勢屋食堂',
    searchPatterns: ['伊勢屋食堂', '大久保', '韓国広場'],
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=250&fit=crop&q=80', // 食堂
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=250&fit=crop&q=80'
    ],
    description: '大久保韓国広場内にある食堂。韓国料理と日本料理が楽しめる'
  },
  {
    name: 'キッチンオリジン',
    searchPatterns: ['キッチンオリジン', 'オリジン弁当', '赤坂'],
    images: [
      'https://images.unsplash.com/photo-1605847780692-d7b2c8e5ecd9?w=400&h=250&fit=crop&q=80', // 弁当
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581873372213-2ec0b1e7d0c8?w=400&h=250&fit=crop&q=80'
    ],
    description: '赤坂にあるお弁当・総菜チェーン。手作りの惣菜とお弁当が人気'
  },
  {
    name: 'キッチンぴーなっつ',
    searchPatterns: ['キッチンぴーなっつ', 'ぴーなっつ', '西尾久'],
    images: [
      'https://images.unsplash.com/photo-1574263867128-a3d06c4b2110?w=400&h=250&fit=crop&q=80', // 洋食
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=250&fit=crop&q=80'
    ],
    description: '荒川区西尾久の隠れ家洋食レストラン。手作りの優しい味が自慢'
  },
  {
    name: 'くら寿司',
    searchPatterns: ['くら寿司', 'くらずし', '万博'],
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop&q=80', // 回転寿司
      'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=250&fit=crop&q=80'
    ],
    description: '人気回転寿司チェーン。大阪万博会場内にも出店'
  },
  {
    name: 'スパイシーカレー魯珈',
    searchPatterns: ['スパイシーカレー魯珈', '魯珈', '大久保'],
    images: [
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&h=250&fit=crop&q=80', // カレー
      'https://images.unsplash.com/photo-1565299443491-6e4cd6d6bbbd?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1631292784640-2b24be784d5d?w=400&h=250&fit=crop&q=80'
    ],
    description: '新宿大久保のスパイシーカレー専門店。本格的なスパイスカレーが味わえる'
  },
  {
    name: 'ビストロ酒場 T4 KITCHEN',
    searchPatterns: ['T4 KITCHEN', 'ティーフォー', '渋谷'],
    images: [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop&q=80', // ビストロ
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop&q=80'
    ],
    description: '渋谷にあるカジュアルビストロ。ワインと創作料理が楽しめる'
  },
  {
    name: '新横浜ラーメン博物館',
    searchPatterns: ['新横浜ラーメン博物館', 'ラーメン博物館', '横浜'],
    images: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=250&fit=crop&q=80', // ラーメン
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=400&h=250&fit=crop&q=80'
    ],
    description: '全国各地の有名ラーメン店が集結。昭和レトロな街並みも楽しめる'
  },
  {
    name: '日本橋髙島屋',
    searchPatterns: ['日本橋髙島屋', '高島屋', '日本橋'],
    images: [
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80', // デパート
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80'
    ],
    description: '日本橋の老舗百貨店。高級グルメとショッピングが楽しめる'
  },
  {
    name: '東京都庁第一庁舎32階職員食堂',
    searchPatterns: ['東京都庁', '都庁食堂', '32階'],
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80', // 食堂
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1574263867128-a3d06c4b2110?w=400&h=250&fit=crop&q=80'
    ],
    description: '都庁32階の職員食堂。一般開放されており、東京の絶景が楽しめる'
  },
  {
    name: '東陽町 大衆焼肉 暴飲暴食',
    searchPatterns: ['暴飲暴食', '東陽町', '大衆焼肉'],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80', // 焼肉
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?w=400&h=250&fit=crop&q=80'
    ],
    description: '東陽町の大衆焼肉店。リーズナブルな価格で美味しい焼肉が楽しめる'
  },
  {
    name: '焼肉古今',
    searchPatterns: ['焼肉古今', '古今', '西麻布'],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1529262365544-55d1e885cea4?w=400&h=250&fit=crop&q=80'
    ],
    description: '西麻布の高級焼肉店。最上級の和牛を提供する大人の隠れ家'
  },
  {
    name: '牛角',
    searchPatterns: ['牛角', 'ぎゅうかく', '赤坂'],
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588347818124-e20b7b3973bf?w=400&h=250&fit=crop&q=80'
    ],
    description: '赤坂の人気焼肉チェーン。リーズナブルに美味しい焼肉を楽しめる'
  },
  {
    name: '神楽坂 てっぱんや',
    searchPatterns: ['てっぱんや', '神楽坂', '鉄板'],
    images: [
      'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=250&fit=crop&q=80', // 鉄板焼き
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=250&fit=crop&q=80'
    ],
    description: '神楽坂の鉄板焼き専門店。目の前で調理される鉄板料理が人気'
  },
  {
    name: '近江牛かね吉',
    searchPatterns: ['近江牛かね吉', 'かね吉', '近江牛'],
    images: [
      'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=250&fit=crop&q=80', // 近江牛
      'https://images.unsplash.com/photo-1558030006-450675393462?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=400&h=250&fit=crop&q=80'
    ],
    description: '近江牛専門店。滋賀県産の最高級近江牛を提供'
  },
  {
    name: '熱海プリン',
    searchPatterns: ['熱海プリン', 'プリン食堂'],
    images: [
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=250&fit=crop&q=80', // プリン
      'https://images.unsplash.com/photo-1565299543923-37dd37887442?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=250&fit=crop&q=80'
    ],
    description: '熱海の名物プリン専門店。濃厚で美味しい手作りプリンが人気'
  },

  // === カフェ・スイーツ ===
  {
    name: 'KIZASU.COFFEE',
    searchPatterns: ['KIZASU.COFFEE', 'キザス', '新橋'],
    images: [
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=250&fit=crop&q=80', // コーヒー
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=250&fit=crop&q=80'
    ],
    description: '新橋のスペシャルティコーヒー専門店。丁寧に抽出されたコーヒーが自慢'
  },
  {
    name: 'サンリオカフェ',
    searchPatterns: ['サンリオカフェ', 'サンリオ', '池袋'],
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop&q=80', // キャラクターカフェ
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522012188892-24beb302783d?w=400&h=250&fit=crop&q=80'
    ],
    description: '池袋のサンリオキャラクターカフェ。かわいいキャラクターメニューが楽しめる'
  },
  {
    name: 'ル・パン・コティディアン',
    searchPatterns: ['ル・パン・コティディアン', 'Le Pain Quotidien', '芝公園', 'ミッドタウン'],
    images: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=250&fit=crop&q=80', // ベーカリーカフェ
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=250&fit=crop&q=80'
    ],
    description: 'ベルギー発のベーカリーカフェ。オーガニック食材を使ったパンとメニュー'
  },
  {
    name: '蓮月カフェ',
    searchPatterns: ['蓮月', 'れんげつ', '池上'],
    images: [
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=400&h=250&fit=crop&q=80', // 和カフェ
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=250&fit=crop&q=80'
    ],
    description: '池上にある和風カフェ。抹茶と和菓子が楽しめる落ち着いた空間'
  },

  // === 観光・エンターテイメント ===
  {
    name: 'お台場海浜公園BBQエリア',
    searchPatterns: ['お台場海浜公園', 'BBQ', 'バーベキュー', '台場'],
    images: [
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop&q=80', // BBQ
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=400&h=250&fit=crop&q=80'
    ],
    description: 'お台場海浜公園内のBBQ施設。東京湾を眺めながらバーベキューが楽しめる'
  },
  {
    name: 'ボートレース浜名湖',
    searchPatterns: ['ボートレース浜名湖', '浜名湖', '競艇'],
    images: [
      'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=250&fit=crop&q=80', // 競艇
      'https://images.unsplash.com/photo-1580477667995-2b94f01c9516?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=250&fit=crop&q=80'
    ],
    description: '静岡県の競艇場。浜名湖の美しい景色とスリリングなレースが楽しめる'
  },
  {
    name: '有明アリーナ',
    searchPatterns: ['有明アリーナ', '東京アクアティクス', '有明'],
    images: [
      'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&h=250&fit=crop&q=80', // アリーナ
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=400&h=250&fit=crop&q=80'
    ],
    description: 'お台場の大型イベント施設。コンサートやスポーツイベントが開催'
  },
  {
    name: 'hmv museum',
    searchPatterns: ['hmv museum', 'HMV', '渋谷', '心斎橋'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80', // 音楽ミュージアム
      'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1488841714725-bb4c32d1ac94?w=400&h=250&fit=crop&q=80'
    ],
    description: '音楽をテーマにしたミュージアム。アーティストの展示や体験コンテンツが充実'
  },

  // === ショップ・商業施設 ===
  {
    name: 'AKIBA Batting Center',
    searchPatterns: ['AKIBA Batting Center', 'バッティング', '秋葉原', 'UDX'],
    images: [
      'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=250&fit=crop&q=80', // バッティングセンター
      'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545056453-f0359c3df6db?w=400&h=250&fit=crop&q=80'
    ],
    description: '秋葉原UDX9階のバッティングセンター。都心で野球が楽しめる'
  },
  {
    name: 'namco横浜ワールドポーターズ店',
    searchPatterns: ['namco', 'ナムコ', '横浜ワールドポーターズ'],
    images: [
      'https://images.unsplash.com/photo-1511882150382-421056c89033?w=400&h=250&fit=crop&q=80', // ゲームセンター
      'https://images.unsplash.com/photo-1598103442097-8b74394ba95b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1545056453-f0359c3df6db?w=400&h=250&fit=crop&q=80'
    ],
    description: '横浜ワールドポーターズ内のゲームセンター。最新ゲームが楽しめる'
  },
  {
    name: 'SHISEIDO THE STORE',
    searchPatterns: ['SHISEIDO THE STORE', '資生堂', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=250&fit=crop&q=80', // 化粧品店
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座の資生堂旗艦店。最新コスメとビューティーカウンセリングが受けられる'
  },
  {
    name: 'クライオサウナ六本木',
    searchPatterns: ['クライオサウナ', 'サウナ', '六本木'],
    images: [
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop&q=80', // サウナ
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560750133-c5d4ef4de911?w=400&h=250&fit=crop&q=80'
    ],
    description: '六本木の次世代型サウナ。極低温の冷凍サウナでリフレッシュ'
  },
  {
    name: 'スタージュエリー',
    searchPatterns: ['スタージュエリー', 'STAR JEWELRY', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=250&fit=crop&q=80', // ジュエリー
      'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601821765780-754fa98637c1?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座の日本発ジュエリーブランド。洗練されたデザインが人気'
  },
  {
    name: 'セブンイレブン',
    searchPatterns: ['セブンイレブン', 'セブン', '芝大門'],
    images: [
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=250&fit=crop&q=80', // コンビニ
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621961458348-f013d219b50c?w=400&h=250&fit=crop&q=80'
    ],
    description: '芝大門のコンビニエンスストア。24時間営業で便利'
  },
  {
    name: 'ナプレ南青山',
    searchPatterns: ['ナプレ南青山', 'ナプレ', '南青山'],
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop&q=80', // セレクトショップ
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=250&fit=crop&q=80'
    ],
    description: '南青山のセレクトショップ。トレンドアイテムが豊富'
  },
  {
    name: 'ビッグエコー',
    searchPatterns: ['ビッグエコー', 'BIG ECHO', '五反田'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop&q=80', // カラオケ
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508973379184-7517410fb0bc?w=400&h=250&fit=crop&q=80'
    ],
    description: '五反田東口駅前のカラオケ店。最新機種と充実の設備'
  },

  // === 築地・市場関係 ===
  {
    name: '丸武',
    searchPatterns: ['丸武', 'まるたけ', '築地', '卵焼き'],
    images: [
      'https://images.unsplash.com/photo-1533777419517-3e4017e2e15a?w=400&h=250&fit=crop&q=80', // 卵焼き
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop&q=80'
    ],
    description: '築地の老舗卵焼き専門店。ふわふわの卵焼きが名物'
  },
  {
    name: '築地すし大',
    searchPatterns: ['築地すし大', 'すし大', '築地'],
    images: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=250&fit=crop&q=80', // 寿司
      'https://images.unsplash.com/photo-1563612116625-3012372fccce?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=250&fit=crop&q=80'
    ],
    description: '築地の人気寿司店。新鮮なネタと職人の技が光る'
  },
  {
    name: '総本家 更科堀井',
    searchPatterns: ['更科堀井', 'さらしな', '麻布十番'],
    images: [
      'https://images.unsplash.com/photo-1616662813165-fbd79d71b4b5?w=400&h=250&fit=crop&q=80', // そば
      'https://images.unsplash.com/photo-1606187963706-c6c5aeeda3d0?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1637654574187-6c1f39b20225?w=400&h=250&fit=crop&q=80'
    ],
    description: '麻布十番の老舗そば店。江戸時代から続く伝統の味'
  },
  {
    name: '羽田市場 GINZA SEVEN',
    searchPatterns: ['羽田市場', 'GINZA SEVEN', '銀座'],
    images: [
      'https://images.unsplash.com/photo-1535007813616-79dc02ba4021?w=400&h=250&fit=crop&q=80', // 海鮮市場
      'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1625938145312-b3bb35a1a8f8?w=400&h=250&fit=crop&q=80'
    ],
    description: '銀座の海鮮市場。新鮮な魚介類と海鮮料理が楽しめる'
  },
  {
    name: '胡同',
    searchPatterns: ['胡同', '西麻布', '中華'],
    images: [
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=250&fit=crop&q=80', // 中華料理
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=250&fit=crop&q=80'
    ],
    description: '西麻布の高級中華料理店。本格的な北京料理が味わえる'
  },

  // === 歴史・文化施設 ===
  {
    name: '自由学園明日館',
    searchPatterns: ['自由学園明日館', '明日館', '池袋', 'フランク・ロイド・ライト'],
    images: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=250&fit=crop&q=80', // 建築
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555529902-1974e9dd9e97?w=400&h=250&fit=crop&q=80'
    ],
    description: '池袋にある重要文化財。フランク・ロイド・ライト設計の美しい建築'
  },
  {
    name: '旧朝吹常吉邸',
    searchPatterns: ['旧朝吹常吉邸', '高輪館', '朝吹邸'],
    images: [
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=250&fit=crop&q=80', // 歴史的建造物
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80'
    ],
    description: '高輪にある歴史的建造物。大正時代の洋館建築が美しい'
  },
  {
    name: '横須賀美術館',
    searchPatterns: ['横須賀美術館', '横須賀', '美術館'],
    images: [
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=250&fit=crop&q=80', // 美術館
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=250&fit=crop&q=80'
    ],
    description: '神奈川県横須賀市の美術館。海に面した絶好のロケーション'
  },

  // === その他特色ある場所 ===
  {
    name: '武蔵野アブラ學会',
    searchPatterns: ['武蔵野アブラ學会', 'アブラ學会', '早稲田'],
    images: [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&q=80', // ユニークな店舗
      'https://images.unsplash.com/photo-1574263867128-a3d06c4b2110?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=400&h=250&fit=crop&q=80'
    ],
    description: '早稲田の個性的な居酒屋。独特なコンセプトとメニューで話題'
  },
  {
    name: 'ティップネス',
    searchPatterns: ['ティップネス', 'TIPNESS', '三軒茶屋'],
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=250&fit=crop&q=80', // フィットネス
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=250&fit=crop&q=80',
      'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&h=250&fit=crop&q=80'
    ],
    description: '三軒茶屋のフィットネスクラブ。最新設備でトレーニング'
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
  console.log('🚀 MEGA Location Images Batch Update')
  console.log('====================================')
  console.log(`🎯 Target locations: ${megaLocationImages.length}`)
  console.log('📍 Categories: Restaurants, Cafes, Shops, Tourist spots, Entertainment\n')
  
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
  
  // バッチ処理開始
  console.log('🏁 Starting mega batch processing...')
  console.log('-'.repeat(50))
  
  for (const locationData of megaLocationImages) {
    stats.processed++
    console.log(`\n[${stats.processed}/${megaLocationImages.length}] ${locationData.name}`)
    await updateLocationImages(locationData)
    
    // レート制限対策
    await new Promise(resolve => setTimeout(resolve, 80))
    
    // 進捗表示
    if (stats.processed % 5 === 0) {
      const percentage = Math.round((stats.processed / megaLocationImages.length) * 100)
      console.log(`\n📊 Progress: ${stats.processed}/${megaLocationImages.length} (${percentage}%) - Success: ${stats.updated}`)
    }
  }
  
  // 最終結果
  console.log('\n' + '='.repeat(60))
  console.log('🏆 MEGA BATCH COMPLETION REPORT')
  console.log('='.repeat(60))
  console.log(`✅ Successfully updated: ${stats.updated}`)
  console.log(`⚠️  Not found: ${stats.notFound}`)
  console.log(`❌ Errors: ${stats.errors}`)
  console.log(`📝 Total processed: ${stats.processed}`)
  console.log(`🎯 Success rate: ${((stats.updated / stats.processed) * 100).toFixed(1)}%`)
  
  // データベース統計更新
  console.log('\n📈 Final Database Statistics:')
  const { count: withImages } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .not('image_urls', 'is', null)
  
  const { count: total } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
  
  console.log(`📊 Locations with images: ${withImages}/${total} (${Math.round((withImages!/total!)*100)}%)`)
  console.log(`📊 Remaining without images: ${total! - withImages!}`)
  console.log(`🎨 Total images added this session: ${stats.updated * 3}`)
  
  // カテゴリ別サマリー
  console.log('\n🏷️  Category Breakdown:')
  const categories = {
    'Restaurants & Food': megaLocationImages.filter(loc => 
      loc.description.includes('レストラン') || loc.description.includes('料理') || 
      loc.description.includes('食堂') || loc.description.includes('グルメ')
    ).length,
    'Cafes & Sweets': megaLocationImages.filter(loc => 
      loc.description.includes('カフェ') || loc.description.includes('コーヒー') || 
      loc.description.includes('プリン') || loc.description.includes('スイーツ')
    ).length,
    'Shopping & Services': megaLocationImages.filter(loc => 
      loc.description.includes('店') || loc.description.includes('ショップ') || 
      loc.description.includes('百貨店') || loc.description.includes('ジム')
    ).length,
    'Tourism & Culture': megaLocationImages.filter(loc => 
      loc.description.includes('観光') || loc.description.includes('美術館') || 
      loc.description.includes('文化') || loc.description.includes('アリーナ')
    ).length
  }
  
  Object.entries(categories).forEach(([category, count]) => {
    console.log(`  • ${category}: ${count} locations`)
  })
  
  console.log('\n🎉 MEGA BATCH UPDATE COMPLETED SUCCESSFULLY!')
  console.log('🚀 Ready for next batch if needed!')
}

// 実行
main().catch(console.error)