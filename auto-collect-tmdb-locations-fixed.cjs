const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

// TMDB API設定
const tmdbApiKey = '4573ec6c37323f6f89002cb24c690875';
const tmdbBaseUrl = 'https://api.themoviedb.org/3';

const supabase = createClient(supabaseUrl, supabaseKey);

// TMDB API呼び出し
async function tmdbApiCall(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${tmdbBaseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${tmdbApiKey}&language=ja`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// TMDB映画IDを抽出
function extractTmdbId(videoUrl) {
  const movieMatch = videoUrl.match(/themoviedb\.org\/movie\/(\d+)/);
  const tvMatch = videoUrl.match(/themoviedb\.org\/tv\/(\d+)/);
  
  if (movieMatch) return { id: movieMatch[1], type: 'movie' };
  if (tvMatch) return { id: tvMatch[1], type: 'tv' };
  return null;
}

// TMDB作品の詳細情報を取得
async function getTmdbWorkDetails(tmdbId, type) {
  console.log(`🎬 TMDB ${type} ${tmdbId}の詳細情報を取得中...`);
  
  try {
    // 基本情報
    const details = await tmdbApiCall(`/${type}/${tmdbId}`);
    
    // キーワード情報
    const keywords = await tmdbApiCall(`/${type}/${tmdbId}/keywords`);
    
    // ロケーション情報を推測
    const locations = extractLocationsFromDetails(details, keywords);
    
    // アイテム情報を推測
    const items = extractItemsFromDetails(details, keywords);
    
    console.log(`✅ ${details.title || details.name}: ロケーション${locations.length}件、アイテム${items.length}件`);
    
    return {
      details,
      keywords,
      locations,
      items
    };
    
  } catch (error) {
    console.error(`❌ TMDB ${type} ${tmdbId} 取得エラー:`, error.message);
    return null;
  }
}

// 詳細情報からロケーション情報を抽出
function extractLocationsFromDetails(details, keywords) {
  const locations = [];
  
  // 1. 撮影国・制作国から推測
  if (details.production_countries) {
    details.production_countries.forEach(country => {
      if (country.name === 'Japan') {
        locations.push({
          name: '日本（撮影地）',
          description: '作品の撮影が行われた国',
          source: 'TMDB'
        });
      }
    });
  }
  
  // 2. キーワードから地名を抽出
  if (keywords.keywords || keywords.results) {
    const keywordList = keywords.keywords || keywords.results;
    keywordList.forEach(keyword => {
      const name = keyword.name.toLowerCase();
      
      // 日本の地名を検出
      const japaneseLocations = [
        { keyword: 'tokyo', name: '東京' },
        { keyword: '東京', name: '東京' },
        { keyword: 'osaka', name: '大阪' },
        { keyword: '大阪', name: '大阪' },
        { keyword: 'kyoto', name: '京都' },
        { keyword: '京都', name: '京都' },
        { keyword: 'shibuya', name: '渋谷' },
        { keyword: '渋谷', name: '渋谷' },
        { keyword: 'shinjuku', name: '新宿' },
        { keyword: '新宿', name: '新宿' }
      ];
      
      japaneseLocations.forEach(location => {
        if (name.includes(location.keyword)) {
          locations.push({
            name: location.name,
            description: `作品のキーワード「${keyword.name}」から特定された地名`,
            source: 'TMDB_keywords'
          });
        }
      });
    });
  }
  
  return locations;
}

// 詳細情報からアイテム情報を抽出
function extractItemsFromDetails(details, keywords) {
  const items = [];
  
  // 1. ジャンルベースのアイテム推測
  if (details.genres) {
    details.genres.forEach(genre => {
      switch (genre.name) {
        case 'アクション':
        case 'Action':
          items.push({
            name: 'アクション小道具',
            description: 'アクション映画で使用される小道具類',
            category: 'props'
          });
          break;
        case 'ロマンス':
        case 'Romance':
          items.push({
            name: 'ロマンチックアイテム',
            description: 'ロマンス映画で登場するアイテム類',
            category: 'props'
          });
          break;
      }
    });
  }
  
  // 2. 制作年代からファッション推測
  const releaseYear = new Date(details.release_date || details.first_air_date).getFullYear();
  if (releaseYear >= 2010) {
    items.push({
      name: `${releaseYear}年代ファッション`,
      description: `${releaseYear}年代の流行ファッション`,
      category: 'fashion'
    });
  }
  
  return items;
}

// スラッグ生成
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ロケーション情報をデータベースに保存（新しいスキーマ対応）
async function saveLocationToDatabase(locationData, episodeId, celebrityId) {
  const slug = generateSlug(locationData.name);
  
  // 既存の場所をチェック
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('id')
    .eq('name', locationData.name)
    .single();
  
  if (existingLocation) {
    console.log(`   📍 既存ロケーション: ${locationData.name}`);
    return false; // 既に存在するためスキップ
  }
  
  // 新しい場所を作成
  const newLocation = {
    id: crypto.randomUUID(),
    name: locationData.name,
    slug: slug,
    description: locationData.description,
    address: null,
    latitude: null,
    longitude: null,
    image_url: null,
    website_url: null,
    phone: null,
    opening_hours: null,
    tags: [locationData.source],
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('locations')
    .insert(newLocation);
  
  if (error) {
    console.error('❌ ロケーション保存エラー:', error);
    return false;
  }
  
  return true;
}

// アイテム情報をデータベースに保存（新しいスキーマ対応）
async function saveItemToDatabase(itemData, episodeId, celebrityId) {
  const slug = generateSlug(itemData.name);
  
  // 既存のアイテムをチェック
  const { data: existingItem } = await supabase
    .from('items')
    .select('id')
    .eq('name', itemData.name)
    .single();
  
  if (existingItem) {
    console.log(`   🛍️ 既存アイテム: ${itemData.name}`);
    return false; // 既に存在するためスキップ
  }
  
  // 新しいアイテムを作成
  const newItem = {
    id: crypto.randomUUID(),
    name: itemData.name,
    slug: slug,
    description: itemData.description,
    price: null,
    image_url: null,
    purchase_url: null,
    brand: null,
    category: itemData.category,
    tags: ['TMDB_auto'],
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('items')
    .insert(newItem);
  
  if (error) {
    console.error('❌ アイテム保存エラー:', error);
    return false;
  }
  
  return true;
}

// メイン処理
async function autoCollectTmdbLocations() {
  console.log('🤖 TMDB作品の自動ロケーション・アイテム収集開始！\n');
  
  try {
    // TMDB由来のエピソードを取得（セレブリティ情報も含む）
    const { data: tmdbEpisodes } = await supabase
      .from('episodes')
      .select('id, title, video_url, celebrity_id')
      .like('video_url', '%themoviedb.org%');
    
    console.log(`📊 処理対象: ${tmdbEpisodes?.length || 0}件のTMDB作品\n`);
    
    if (!tmdbEpisodes || tmdbEpisodes.length === 0) {
      console.log('⚠️ TMDB作品が見つかりませんでした');
      return;
    }
    
    let processedCount = 0;
    let locationsAdded = 0;
    let itemsAdded = 0;
    
    for (const episode of tmdbEpisodes.slice(0, 5)) { // テスト用に最初の5件のみ
      console.log(`\n📽️ 処理中: ${episode.title}`);
      
      const tmdbInfo = extractTmdbId(episode.video_url);
      if (!tmdbInfo) {
        console.log('⚠️ TMDB IDを抽出できませんでした');
        continue;
      }
      
      const workData = await getTmdbWorkDetails(tmdbInfo.id, tmdbInfo.type);
      if (!workData) {
        continue;
      }
      
      // ロケーション情報を保存
      for (const location of workData.locations) {
        const saved = await saveLocationToDatabase(location, episode.id, episode.celebrity_id);
        if (saved) {
          locationsAdded++;
          console.log(`   📍 ロケーション追加: ${location.name}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // アイテム情報を保存
      for (const item of workData.items) {
        const saved = await saveItemToDatabase(item, episode.id, episode.celebrity_id);
        if (saved) {
          itemsAdded++;
          console.log(`   🛍️ アイテム追加: ${item.name}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      processedCount++;
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 自動収集完了！');
    console.log('📊 結果サマリー:');
    console.log(`   処理済み作品: ${processedCount}件`);
    console.log(`   追加ロケーション: ${locationsAdded}件`);
    console.log(`   追加アイテム: ${itemsAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('1. https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
    console.log('2. 映画・ドラマエピソードにロケーション・アイテムバッジが表示される');
    
    console.log('\n💡 収集された情報の特徴:');
    console.log('• 撮影国・制作地情報');
    console.log('• ジャンルベースの推測データ');
    console.log('• キーワードから抽出した地名・アイテム');
    console.log('• 制作年代ベースのファッション情報');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

autoCollectTmdbLocations();