require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const ILOVE_GROUP_ID = '259e44a6-5a33-40cf-9d78-86cfbd9df2ac';

// Step 1: 既存データの削除
async function cleanILoveData() {
  console.log('🧹 =LOVE 既存データのクリーンアップ開始\n');
  
  // ロケーション削除
  const { count: locationCount } = await supabase
    .from('locations')
    .delete()
    .eq('celebrity_id', ILOVE_GROUP_ID);
    
  console.log(`✅ ${locationCount || 0}件のロケーションを削除`);
  
  // アイテム削除
  const { count: itemCount } = await supabase
    .from('items')
    .delete()
    .eq('celebrity_id', ILOVE_GROUP_ID);
    
  console.log(`✅ ${itemCount || 0}件のアイテムを削除\n`);
}

// Step 2: 拡充された店舗パターン
const KNOWN_LOCATIONS = [
  // レストラン・カフェ
  { keywords: ['浅草もんじゃ', 'もんろう'], name: '浅草もんじゃ もんろう', address: '東京都台東区浅草１丁目４１−２', type: 'もんじゃ焼き店' },
  { keywords: ['スイパラ', 'スイーツパラダイス'], name: 'スイーツパラダイス', address: '全国チェーン店', type: 'スイーツビュッフェ' },
  { keywords: ['くら寿司'], name: 'くら寿司', address: '全国チェーン店', type: '回転寿司' },
  { keywords: ['マクドナルド', 'マック'], name: 'マクドナルド', address: '全国チェーン店', type: 'ファストフード' },
  { keywords: ['牛角'], name: '牛角', address: '全国チェーン店', type: '焼肉' },
  { keywords: ['トラジ'], name: 'トラジ', address: '全国チェーン店', type: '焼肉' },
  { keywords: ['新横浜ラーメン博物館', 'ラー博'], name: '新横浜ラーメン博物館', address: '神奈川県横浜市港北区新横浜2-14-21', type: '博物館・フードテーマパーク' },
  { keywords: ['天下一品'], name: '天下一品', address: '全国チェーン店', type: 'ラーメン' },
  { keywords: ['一蘭'], name: '一蘭', address: '全国チェーン店', type: 'ラーメン' },
  { keywords: ['サンリオカフェ'], name: 'サンリオカフェ', address: '東京都', type: 'キャラクターカフェ' },
  
  // ショッピング
  { keywords: ['コストコ', 'COSTCO'], name: 'コストコ', address: '会員制倉庫型店舗', type: 'ショッピング' },
  { keywords: ['ロフト', 'LOFT'], name: 'ロフト', address: '全国チェーン店', type: 'バラエティショップ' },
  { keywords: ['ZARA'], name: 'ZARA', address: '全国チェーン店', type: 'ファッション' },
  { keywords: ['ユニクロ', 'UNIQLO'], name: 'UNIQLO', address: '全国チェーン店', type: 'ファッション' },
  { keywords: ['GU'], name: 'GU', address: '全国チェーン店', type: 'ファッション' },
  { keywords: ['WEGO'], name: 'WEGO', address: '全国チェーン店', type: 'ファッション' },
  
  // テーマパーク・観光
  { keywords: ['ボートレース', '競艇'], name: 'ボートレース場', address: '各地', type: 'ボートレース場' },
  { keywords: ['USJ', 'ユニバ'], name: 'ユニバーサル・スタジオ・ジャパン', address: '大阪府大阪市此花区', type: 'テーマパーク' },
  { keywords: ['ピューロランド', 'サンリオピューロランド'], name: 'サンリオピューロランド', address: '東京都多摩市', type: 'テーマパーク' },
  { keywords: ['八景島シーパラダイス'], name: '八景島シーパラダイス', address: '神奈川県横浜市金沢区', type: '水族館・遊園地' },
  
  // 地域特定
  { keywords: ['原宿', '竹下通り'], name: '原宿・竹下通り', address: '東京都渋谷区', type: 'ショッピングエリア' },
  { keywords: ['下北沢'], name: '下北沢', address: '東京都世田谷区', type: 'ショッピング・カルチャーエリア' },
  { keywords: ['中華街'], name: '横浜中華街', address: '神奈川県横浜市中区', type: '観光・グルメエリア' },
  { keywords: ['鎌倉'], name: '鎌倉', address: '神奈川県鎌倉市', type: '観光地' },
  { keywords: ['熱海'], name: '熱海', address: '静岡県熱海市', type: '温泉観光地' },
  { keywords: ['箱根'], name: '箱根', address: '神奈川県足柄下郡箱根町', type: '温泉観光地' }
];

// Step 3: 概要欄から店舗情報を抽出（改良版）
function extractLocationsFromDescription(description, title = '') {
  if (!description && !title) return [];
  
  const fullText = `${title} ${description || ''}`;
  const locations = [];
  const addedNames = new Set();
  
  // 既知の店舗をチェック
  for (const known of KNOWN_LOCATIONS) {
    if (known.keywords.some(keyword => 
      fullText.toLowerCase().includes(keyword.toLowerCase())
    )) {
      if (!addedNames.has(known.name)) {
        locations.push({
          name: known.name,
          address: known.address,
          type: known.type,
          confidence: 'high',
          source: 'known_pattern'
        });
        addedNames.add(known.name);
      }
    }
  }
  
  return locations;
}

// Step 4: YouTube APIから動画詳細を取得
async function getVideoDetails(videoId) {
  if (!YOUTUBE_API_KEY) {
    return null;
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoId}&part=snippet`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet;
    }
  } catch (error) {
    console.error('YouTube API エラー:', error.message);
  }
  
  return null;
}

// Step 5: ロケーションを保存
async function saveLocation(locationInfo, episodeId) {
  // 重複チェック
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', locationInfo.name)
    .eq('celebrity_id', ILOVE_GROUP_ID)
    .single();
    
  if (existing) {
    return null;
  }
  
  const locationData = {
    id: randomUUID(),
    name: locationInfo.name,
    slug: locationInfo.name.toLowerCase()
      .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now(),
    address: locationInfo.address,
    description: `${locationInfo.name} - ${locationInfo.type}`,
    celebrity_id: ILOVE_GROUP_ID,
    tags: ['YouTube概要欄', locationInfo.confidence, locationInfo.type],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('locations')
    .insert(locationData)
    .select();
    
  if (error) {
    console.log(`  ❌ エラー: ${error.message}`);
    return null;
  }
  
  return data[0];
}

// Step 6: =LOVEの全エピソードを処理
async function processILoveEpisodes() {
  console.log('🎯 =LOVE エピソード処理開始（85件）\n');
  
  // 全エピソードを取得
  const { data: episodes } = await supabase
    .from('episodes')
    .select('id, title')
    .eq('celebrity_id', ILOVE_GROUP_ID)
    .order('created_at', { ascending: false });
    
  if (!episodes || episodes.length === 0) {
    console.log('❌ エピソードが見つかりません');
    return;
  }
  
  console.log(`📺 処理対象: ${episodes.length}件のエピソード\n`);
  
  let successCount = 0;
  let apiCallCount = 0;
  const locationsFound = new Map();
  
  for (let i = 0; i < episodes.length; i++) {
    const episode = episodes[i];
    console.log(`[${i + 1}/${episodes.length}] 🎬 ${episode.title.substring(0, 50)}...`);
    
    // YouTube APIから詳細を取得
    apiCallCount++;
    const videoDetails = await getVideoDetails(episode.id);
    
    if (videoDetails) {
      const locations = extractLocationsFromDescription(
        videoDetails.description,
        episode.title
      );
      
      if (locations.length > 0) {
        console.log(`  ✅ ${locations.length}件の店舗情報を発見`);
        
        for (const location of locations) {
          const saved = await saveLocation(location, episode.id);
          if (saved) {
            successCount++;
            locationsFound.set(location.name, location);
            console.log(`  📍 保存: ${location.name}`);
          }
        }
      } else {
        console.log(`  ⚪ 店舗情報なし`);
      }
    } else {
      console.log(`  ⚠️ 概要欄取得失敗`);
    }
    
    // API制限対策（10件ごとに長めの休憩）
    if (apiCallCount % 10 === 0) {
      console.log(`\n⏱️ API制限対策: 10秒休憩中...\n`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 =LOVE処理完了！');
  console.log(`📊 結果:`);
  console.log(`  - 処理エピソード: ${episodes.length}件`);
  console.log(`  - API呼び出し: ${apiCallCount}回`);
  console.log(`  - 抽出・保存: ${successCount}件`);
  
  if (locationsFound.size > 0) {
    console.log(`\n📍 発見した店舗一覧:`);
    for (const [name, info] of locationsFound) {
      console.log(`  - ${name}: ${info.type}`);
    }
  }
  
  console.log(`\n🔗 確認URL:`);
  console.log(`https://oshikatsu-collection.netlify.app/celebrities/equal-love`);
}

// メイン処理
async function main() {
  console.log('🚀 =LOVE 専用処理プログラム\n');
  console.log('='.repeat(60) + '\n');
  
  // Step 1: クリーンアップ
  await cleanILoveData();
  
  // Step 2: エピソード処理
  await processILoveEpisodes();
}

main().catch(console.error);