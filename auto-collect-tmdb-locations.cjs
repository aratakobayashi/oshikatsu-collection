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
    
    // 撮影場所情報（一部の作品で利用可能）
    let filmingLocations = [];
    
    // キャストとクルー情報
    const credits = await tmdbApiCall(`/${type}/${tmdbId}/credits`);
    
    // キーワード情報
    const keywords = await tmdbApiCall(`/${type}/${tmdbId}/keywords`);
    
    // 画像情報
    const images = await tmdbApiCall(`/${type}/${tmdbId}/images`);
    
    // 動画情報
    const videos = await tmdbApiCall(`/${type}/${tmdbId}/videos`);
    
    // ロケーション情報を推測
    const locations = extractLocationsFromDetails(details, credits, keywords);
    
    // アイテム情報を推測
    const items = extractItemsFromDetails(details, credits, keywords);
    
    console.log(`✅ ${details.title || details.name}: ロケーション${locations.length}件、アイテム${items.length}件`);
    
    return {
      details,
      credits,
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
function extractLocationsFromDetails(details, credits, keywords) {
  const locations = [];
  
  // 1. 撮影国・制作国から推測
  if (details.production_countries) {
    details.production_countries.forEach(country => {
      if (country.name === 'Japan') {
        locations.push({
          name: '日本（撮影地）',
          type: 'filming_country',
          source: 'TMDB',
          description: '作品の撮影が行われた国'
        });
      }
    });
  }
  
  // 2. 制作会社の所在地から推測
  if (details.production_companies) {
    details.production_companies.forEach(company => {
      if (company.origin_country === 'JP') {
        // 日本の制作会社の場合、東京または大阪の可能性が高い
        locations.push({
          name: '東京（制作拠点）',
          type: 'production_location',
          source: 'TMDB',
          description: `${company.name}による制作`
        });
      }
    });
  }
  
  // 3. ジャンルベースの推測
  if (details.genres) {
    details.genres.forEach(genre => {
      if (genre.name === 'アクション' || genre.name === 'Action') {
        locations.push({
          name: 'アクションシーン撮影地',
          type: 'scene_location',
          source: 'genre_inference',
          description: 'アクション映画の撮影に使用された可能性のある場所'
        });
      }
    });
  }
  
  // 4. キーワードから地名を抽出
  if (keywords.keywords || keywords.results) {
    const keywordList = keywords.keywords || keywords.results;
    keywordList.forEach(keyword => {
      const name = keyword.name.toLowerCase();
      
      // 日本の地名を検出
      const japaneseLocations = [
        'tokyo', '東京', 'osaka', '大阪', 'kyoto', '京都',
        'yokohama', '横浜', 'nagoya', '名古屋', 'kobe', '神戸',
        'shibuya', '渋谷', 'shinjuku', '新宿', 'harajuku', '原宿'
      ];
      
      japaneseLocations.forEach(location => {
        if (name.includes(location)) {
          locations.push({
            name: location,
            type: 'keyword_location',
            source: 'TMDB_keywords',
            description: `作品のキーワードから特定された地名`
          });
        }
      });
    });
  }
  
  return locations;
}

// 詳細情報からアイテム情報を抽出
function extractItemsFromDetails(details, credits, keywords) {
  const items = [];
  
  // 1. ジャンルベースのアイテム推測
  if (details.genres) {
    details.genres.forEach(genre => {
      switch (genre.name) {
        case 'アクション':
        case 'Action':
          items.push({
            name: 'アクション小道具',
            category: 'props',
            source: 'genre_inference',
            description: 'アクション映画で使用される小道具類'
          });
          break;
        case 'ロマンス':
        case 'Romance':
          items.push({
            name: 'ロマンチックアイテム',
            category: 'props',
            source: 'genre_inference', 
            description: 'ロマンス映画で登場するアイテム類'
          });
          break;
        case 'SF':
        case 'Science Fiction':
          items.push({
            name: 'SF小道具',
            category: 'props',
            source: 'genre_inference',
            description: 'SF映画で使用される未来的なアイテム'
          });
          break;
      }
    });
  }
  
  // 2. キーワードからアイテムを抽出
  if (keywords.keywords || keywords.results) {
    const keywordList = keywords.keywords || keywords.results;
    keywordList.forEach(keyword => {
      const name = keyword.name.toLowerCase();
      
      // アイテム関連キーワードを検出
      const itemKeywords = {
        'car': '劇中車',
        'motorcycle': 'バイク',
        'weapon': '武器',
        'sword': '剣',
        'gun': '銃',
        'phone': '携帯電話',
        'computer': 'コンピューター',
        'watch': '腕時計',
        'clothing': '衣装',
        'jewelry': 'アクセサリー'
      };
      
      Object.entries(itemKeywords).forEach(([keyword, itemName]) => {
        if (name.includes(keyword)) {
          items.push({
            name: itemName,
            category: 'movie_item',
            source: 'TMDB_keywords',
            description: `「${keyword}」キーワードから特定されたアイテム`
          });
        }
      });
    });
  }
  
  // 3. 制作年代からファッション推測
  const releaseYear = new Date(details.release_date || details.first_air_date).getFullYear();
  if (releaseYear >= 2010) {
    items.push({
      name: `${releaseYear}年代ファッション`,
      category: 'fashion',
      source: 'era_inference',
      description: `${releaseYear}年代の流行ファッション`
    });
  }
  
  return items;
}

// ロケーション情報をデータベースに保存
async function saveLocationToDatabase(locationData, episodeId) {
  // 既存の場所をチェック
  const { data: existingLocation } = await supabase
    .from('locations')
    .select('id')
    .eq('name', locationData.name)
    .single();
  
  let locationId;
  
  if (existingLocation) {
    locationId = existingLocation.id;
  } else {
    // 新しい場所を作成
    const newLocation = {
      id: crypto.randomUUID(),
      name: locationData.name,
      description: locationData.description,
      address: null, // API自動収集では住所は取得困難
      latitude: null,
      longitude: null,
      website_url: null,
      phone_number: null,
      business_hours: null,
      tags: [locationData.type, locationData.source],
      image_urls: [],
      menu_example: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertedLocation, error } = await supabase
      .from('locations')
      .insert(newLocation)
      .select()
      .single();
    
    if (error) {
      console.error('❌ ロケーション保存エラー:', error);
      return false;
    }
    
    locationId = insertedLocation.id;
  }
  
  // エピソード-ロケーション リンクを作成
  const { error: linkError } = await supabase
    .from('episode_locations')
    .insert({
      episode_id: episodeId,
      location_id: locationId,
      created_at: new Date().toISOString()
    });
  
  if (linkError && linkError.code !== '23505') { // 重複エラーは無視
    console.error('❌ エピソード-ロケーション リンクエラー:', linkError);
    return false;
  }
  
  return true;
}

// アイテム情報をデータベースに保存
async function saveItemToDatabase(itemData, episodeId) {
  // 既存のアイテムをチェック
  const { data: existingItem } = await supabase
    .from('items')
    .select('id')
    .eq('name', itemData.name)
    .single();
  
  let itemId;
  
  if (existingItem) {
    itemId = existingItem.id;
  } else {
    // 新しいアイテムを作成
    const newItem = {
      id: crypto.randomUUID(),
      name: itemData.name,
      description: itemData.description,
      brand: null,
      price: null,
      purchase_url: null,
      category: itemData.category,
      tags: [itemData.source],
      image_urls: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: insertedItem, error } = await supabase
      .from('items')
      .insert(newItem)
      .select()
      .single();
    
    if (error) {
      console.error('❌ アイテム保存エラー:', error);
      return false;
    }
    
    itemId = insertedItem.id;
  }
  
  // エピソード-アイテム リンクを作成
  const { error: linkError } = await supabase
    .from('episode_items')
    .insert({
      episode_id: episodeId,
      item_id: itemId,
      created_at: new Date().toISOString()
    });
  
  if (linkError && linkError.code !== '23505') { // 重複エラーは無視
    console.error('❌ エピソード-アイテム リンクエラー:', linkError);
    return false;
  }
  
  return true;
}

// メイン処理
async function autoCollectTmdbLocations() {
  console.log('🤖 TMDB作品の自動ロケーション・アイテム収集開始！\n');
  
  try {
    // TMDB由来のエピソードを取得
    const { data: tmdbEpisodes } = await supabase
      .from('episodes')
      .select('id, title, video_url')
      .like('video_url', '%themoviedb.org%');
    
    console.log(`📊 処理対象: ${tmdbEpisodes?.length || 0}件のTMDB作品\n`);
    
    if (!tmdbEpisodes || tmdbEpisodes.length === 0) {
      console.log('⚠️ TMDB作品が見つかりませんでした');
      return;
    }
    
    let processedCount = 0;
    let locationsAdded = 0;
    let itemsAdded = 0;
    
    for (const episode of tmdbEpisodes.slice(0, 10)) { // テスト用に最初の10件のみ
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
        const saved = await saveLocationToDatabase(location, episode.id);
        if (saved) {
          locationsAdded++;
          console.log(`   📍 ロケーション追加: ${location.name}`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // アイテム情報を保存
      for (const item of workData.items) {
        const saved = await saveItemToDatabase(item, episode.id);
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