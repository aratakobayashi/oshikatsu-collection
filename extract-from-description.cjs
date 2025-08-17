require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// YouTube API設定
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// 動画概要欄から店舗情報を抽出
function extractLocationFromDescription(description) {
  if (!description) return null;
  
  console.log('📝 概要欄内容をチェック中...');
  
  // 具体的な店舗情報を検索
  if (description.includes('もんろう') || description.includes('浅草')) {
    if (description.includes('台東区浅草')) {
      return {
        name: '浅草もんじゃ もんろう',
        address: '東京都台東区浅草１丁目４１−２',
        type: 'restaurant'
      };
    }
  }
  
  // 一般的なパターンも検索
  const locationPatterns = [
    // 住所パターン
    /(東京都|神奈川県|千葉県|埼玉県|大阪府|兵庫県|京都府|愛知県|福岡県)[^\n]{10,50}/g,
    // 店舗名パターン
    /([あ-んア-ンー一-龯A-Za-z0-9\s]{3,20}(店|屋|亭|館|カフェ|レストラン))/g
  ];
  
  for (const pattern of locationPatterns) {
    const matches = description.match(pattern);
    if (matches) {
      console.log('📍 パターンマッチ:', matches[0]);
      return {
        name: matches[0],
        type: 'general'
      };
    }
  }
  
  return null;
}

// YouTube動画の詳細情報を取得
async function getVideoDetails(videoId) {
  if (!YOUTUBE_API_KEY) {
    console.log('⚠️ YouTube API キーが設定されていません');
    return null;
  }
  
  try {
    const url = 'https://www.googleapis.com/youtube/v3/videos?key=' + YOUTUBE_API_KEY + '&id=' + videoId + '&part=snippet';
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet;
    }
  } catch (error) {
    console.error('❌ YouTube API エラー:', error.message);
  }
  
  return null;
}

// 特定のエピソードを分析
async function analyzeSpecificEpisode() {
  console.log('🎯 エピソード 9ZWbXuY-nc4 の概要欄分析\n');
  
  const episodeId = '9ZWbXuY-nc4';
  
  // エピソード情報を取得
  const { data: episode } = await supabase
    .from('episodes')
    .select('id, title, description, celebrity_id')
    .eq('id', episodeId)
    .single();
  
  if (!episode) {
    console.log('❌ エピソードが見つかりません');
    return;
  }
  
  console.log('📺 エピソード:', episode.title);
  
  // YouTube APIから詳細な概要欄を取得
  const videoDetails = await getVideoDetails(episodeId);
  
  if (videoDetails) {
    console.log('\n📝 YouTube概要欄の内容:');
    console.log('='.repeat(60));
    console.log(videoDetails.description);
    console.log('='.repeat(60));
    
    const locationInfo = extractLocationFromDescription(videoDetails.description);
    
    if (locationInfo) {
      console.log('\n✅ 発見された店舗情報:');
      console.log('   店名:', locationInfo.name);
      if (locationInfo.address) {
        console.log('   住所:', locationInfo.address);
      }
      console.log('   タイプ:', locationInfo.type);
    } else {
      console.log('\n❌ 明確な店舗情報が見つかりませんでした');
    }
  } else {
    console.log('\n❌ YouTube APIから概要欄を取得できませんでした');
    
    // データベースの情報を確認
    if (episode.description) {
      console.log('\n📝 データベースの概要欄:');
      console.log(episode.description);
    }
  }
  
  console.log('\n💡 今後の改善案:');
  console.log('1. YouTube概要欄からの自動抽出システム');
  console.log('2. 店舗名と住所の正規表現パターン改善');
  console.log('3. 手動キュレーションとの併用');
}

analyzeSpecificEpisode().catch(console.error);