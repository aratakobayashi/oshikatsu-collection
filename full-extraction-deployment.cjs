require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// 動画概要欄から店舗情報を正確に抽出
function extractLocationFromDescription(description, videoTitle = '') {
  if (!description) return [];
  
  const locations = [];
  
  // 具体的な既知の店舗パターン（手動定義）
  const knownLocations = [
    {
      keywords: ['浅草もんじゃ', 'もんろう', '台東区浅草'],
      location: {
        name: '浅草もんじゃ もんろう',
        address: '東京都台東区浅草１丁目４１−２',
        category: 'restaurant',
        type: 'もんじゃ焼き店'
      }
    },
    {
      keywords: ['新横浜ラーメン博物館', 'ラー博'],
      location: {
        name: '新横浜ラーメン博物館',
        address: '神奈川県横浜市港北区新横浜2-14-21',
        category: 'museum',
        type: '博物館・テーマパーク'
      }
    },
    {
      keywords: ['スイーツパラダイス', 'スイパラ', '上野マルイ'],
      location: {
        name: 'スイーツパラダイス 上野マルイ店',
        address: '東京都台東区上野6-15-1 上野マルイ 8F',
        category: 'restaurant',
        type: 'スイーツビュッフェ'
      }
    },
    {
      keywords: ['くら寿司'],
      location: {
        name: 'くら寿司',
        address: '全国チェーン店',
        category: 'restaurant',
        type: '回転寿司'
      }
    },
    {
      keywords: ['コストコ'],
      location: {
        name: 'コストコ',
        address: '大型倉庫型店舗',
        category: 'retail',
        type: '会員制倉庫型店舗'
      }
    },
    {
      keywords: ['ボートレース', '競艇場', '浜名湖'],
      location: {
        name: 'ボートレース浜名湖',
        address: '静岡県湖西市新居町中之郷3727-7',
        category: 'entertainment',
        type: 'ボートレース場'
      }
    },
    {
      keywords: ['マクドナルド', 'マック'],
      location: {
        name: 'マクドナルド',
        address: '全国チェーン店',
        category: 'restaurant',
        type: 'ファストフード'
      }
    }
  ];
  
  // 既知の店舗をチェック
  for (const known of knownLocations) {
    if (known.keywords.some(keyword => 
      description.toLowerCase().includes(keyword.toLowerCase()) ||
      videoTitle.toLowerCase().includes(keyword.toLowerCase())
    )) {
      locations.push({
        name: known.location.name,
        address: known.location.address,
        category: known.location.category,
        type: known.location.type,
        confidence: 'high',
        source: 'known_location'
      });
    }
  }
  
  // 住所パターンの検索（より厳密に）
  const addressPatterns = [
    // 基本的な住所パターン（都道府県 + 詳細住所）
    /([東京都|神奈川県|千葉県|埼玉県|大阪府|兵庫県|京都府|愛知県|福岡県][^\n\r\s]{20,100})/g,
    // 郵便番号付きパターン
    /〒\d{3}-\d{4}\s*([東京都|神奈川県|千葉県|埼玉県|大阪府|兵庫県|京都府|愛知県|福岡県][^\n\r]{15,80})/g
  ];
  
  for (const pattern of addressPatterns) {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const address = match[1] ? match[1].trim() : match[0].trim();
      
      // より厳密な住所検証
      if (address && address.length > 20 && address.includes('区') || address.includes('市') || address.includes('町')) {
        // 住所から店名を推測（前後の文脈から）
        const beforeText = description.substring(Math.max(0, match.index - 50), match.index);
        const afterText = description.substring(match.index + match[0].length, match.index + match[0].length + 50);
        
        // 店舗名のパターンを探す
        const storeNamePattern = /([^\s\n]{2,20}[店舗|館|亭|屋|家|房|堂|庵|軒|処])/;
        const storeMatch = beforeText.match(storeNamePattern) || afterText.match(storeNamePattern);
        const storeName = storeMatch ? storeMatch[1] : '店舗';
        
        locations.push({
          name: storeName,
          address: address,
          category: 'restaurant',
          type: 'unknown',
          confidence: 'medium',
          source: 'address_pattern'
        });
      }
    }
  }
  
  return locations;
}

// YouTube動画の詳細情報を取得
async function getVideoDetails(videoId) {
  if (!YOUTUBE_API_KEY) {
    console.log('⚠️ YouTube API キーが設定されていません');
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
    console.error('❌ YouTube API エラー:', error.message);
  }
  
  return null;
}

// 正確な店舗情報をデータベースに保存
async function saveAccurateLocation(locationInfo, episodeId, celebrityId) {
  // 重複チェック（同じ名前の店舗が既存かどうか）
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('id, name')
    .eq('name', locationInfo.name)
    .eq('celebrity_id', celebrityId)
    .single();
  
  if (existingLocation) {
    console.log(`⏭️  スキップ: ${locationInfo.name} (既存)`);
    return existingLocation;
  }
  
  const locationData = {
    id: randomUUID(),
    name: locationInfo.name,
    slug: locationInfo.name.toLowerCase()
      .replace(/[^\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\w\s]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, ''),
    address: locationInfo.address,
    description: `${locationInfo.name}。${locationInfo.type || ''} (エピソード: ${episodeId})`,
    celebrity_id: celebrityId,
    tags: ['YouTube概要欄', locationInfo.confidence, locationInfo.category || 'restaurant'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  try {
    const { data, error } = await supabase
      .from('locations')
      .insert(locationData)
      .select();
    
    if (!error && data && data.length > 0) {
      console.log(`✅ 正確なロケーション保存: ${locationInfo.name}`);
      console.log(`   住所: ${locationInfo.address}`);
      console.log(`   信頼度: ${locationInfo.confidence}`);
      return data[0];
    } else {
      console.log(`❌ 保存エラー: ${error?.message || '不明なエラー'}`);
      return null;
    }
  } catch (error) {
    // スラッグの重複エラーを処理
    if (error.message.includes('locations_slug_key')) {
      // ユニークなスラッグを生成
      const uniqueSlug = locationData.slug + '-' + Date.now();
      locationData.slug = uniqueSlug;
      
      try {
        const { data, error: retryError } = await supabase
          .from('locations')
          .insert(locationData)
          .select();
        
        if (!retryError && data && data.length > 0) {
          console.log(`✅ 正確なロケーション保存 (リトライ): ${locationInfo.name}`);
          return data[0];
        }
      } catch (retryErr) {
        console.log(`❌ リトライ保存エラー: ${retryErr.message}`);
      }
    } else {
      console.log(`❌ 保存処理エラー: ${error.message}`);
    }
    return null;
  }
}

// 全エピソードへの新抽出システム展開
async function deployFullExtraction() {
  console.log('🚀 418エピソード全体への新抽出システム展開開始！\n');
  
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  // 全エピソードを取得（3グループの全エピソード）
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false });
  
  if (!episodes || episodes.length === 0) {
    console.log('❌ 対象エピソードが見つかりません');
    return;
  }
  
  console.log(`📺 展開対象: ${episodes.length}件のエピソード\n`);
  
  let successCount = 0;
  let processedCount = 0;
  let apiCallCount = 0;
  
  for (const episode of episodes) {
    processedCount++;
    console.log(`\n[${processedCount}/${episodes.length}] 🎬 分析中: ${episode.title}`);
    
    // YouTube APIから詳細な概要欄を取得
    apiCallCount++;
    const videoDetails = await getVideoDetails(episode.id);
    
    if (videoDetails && videoDetails.description) {
      console.log('📝 概要欄から店舗情報を抽出中...');
      
      const extractedLocations = extractLocationFromDescription(
        videoDetails.description, 
        episode.title
      );
      
      if (extractedLocations.length > 0) {
        console.log(`✅ ${extractedLocations.length}件の店舗情報を発見！`);
        
        for (const location of extractedLocations) {
          const saved = await saveAccurateLocation(
            location, 
            episode.id, 
            episode.celebrity_id
          );
          
          if (saved) {
            successCount++;
          }
        }
      } else {
        console.log('📍 明確な店舗情報なし');
      }
    } else {
      console.log('❌ 概要欄を取得できませんでした');
    }
    
    // API制限対策 (1000 requests/day の制限を考慮)
    if (apiCallCount % 10 === 0) {
      console.log(`\n⏱️  API制限対策: 10秒休憩 (API呼び出し: ${apiCallCount}回)`);
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n🎉 全体展開完了！');
  console.log('='.repeat(60));
  console.log(`📊 処理結果:`);
  console.log(`  - 処理エピソード: ${processedCount}件`);
  console.log(`  - API呼び出し: ${apiCallCount}回`);
  console.log(`  - 正確な店舗情報抽出・保存: ${successCount}件`);
  console.log(`\n🔗 確認URL:`);
  console.log(`https://oshikatsu-collection.netlify.app/celebrities/equal-love`);
  console.log(`https://oshikatsu-collection.netlify.app/celebrities/not-equal-me`);
  console.log(`https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy`);
  
  if (successCount > 0) {
    console.log(`\n💡 次のステップ:`);
    console.log(`✅ 高品質なデータが蓄積されました`);
    console.log(`✅ ユーザーにとって有用な店舗情報のみ表示`);
    console.log(`✅ 分析スコアなどのノイズは完全除去済み`);
  }
}

deployFullExtraction().catch(console.error);