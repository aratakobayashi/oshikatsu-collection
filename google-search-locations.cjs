const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

// Google Custom Search API設定（.envから取得済み）
const googleApiKey = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const searchEngineId = '3649ae354f33b4553';

const supabase = createClient(supabaseUrl, supabaseKey);

// Google Custom Search API呼び出し
async function googleSearch(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodedQuery}&num=10&hl=ja`;
    
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

// 検索結果からロケーション情報を抽出
function extractLocationsFromSearchResults(results, workTitle) {
  const locations = [];
  const locationKeywords = [
    '撮影地', 'ロケ地', '撮影場所', 'ロケーション',
    '舞台', '聖地', '撮影現場', 'ロケ現場'
  ];
  
  if (results.items) {
    results.items.forEach(item => {
      const title = item.title || '';
      const snippet = item.snippet || '';
      const content = `${title} ${snippet}`.toLowerCase();
      
      // ロケ地キーワードが含まれているか確認
      const hasLocationKeyword = locationKeywords.some(keyword => 
        content.includes(keyword)
      );
      
      if (hasLocationKeyword) {
        // 具体的な場所名を抽出
        const placePatterns = [
          /「([^」]+)」/g,  // 「」で囲まれた部分
          /『([^』]+)』/g,  // 『』で囲まれた部分
          /【([^】]+)】/g,  // 【】で囲まれた部分
        ];
        
        placePatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(snippet)) !== null) {
            const placeName = match[1];
            
            // 場所名っぽいものをフィルタリング
            if (placeName.length > 1 && placeName.length < 30 &&
                !placeName.includes('撮影') && !placeName.includes('ロケ')) {
              
              // 既に追加済みでないか確認
              const exists = locations.some(loc => loc.name === placeName);
              if (!exists) {
                locations.push({
                  name: placeName,
                  description: `${workTitle}の撮影で使用された場所`,
                  source: 'Google Search',
                  snippet: snippet.substring(0, 200)
                });
              }
            }
          }
        });
        
        // 地名パターンでも抽出
        const japaneseLocations = [
          { pattern: /渋谷/g, name: '渋谷' },
          { pattern: /新宿/g, name: '新宿' },
          { pattern: /原宿/g, name: '原宿' },
          { pattern: /東京タワー/g, name: '東京タワー' },
          { pattern: /スカイツリー/g, name: '東京スカイツリー' },
          { pattern: /浅草/g, name: '浅草' },
          { pattern: /お台場/g, name: 'お台場' },
          { pattern: /横浜/g, name: '横浜' },
          { pattern: /鎌倉/g, name: '鎌倉' },
          { pattern: /京都/g, name: '京都' },
          { pattern: /大阪/g, name: '大阪' },
          { pattern: /神戸/g, name: '神戸' },
          { pattern: /沖縄/g, name: '沖縄' },
          { pattern: /北海道/g, name: '北海道' },
        ];
        
        japaneseLocations.forEach(location => {
          if (location.pattern.test(content)) {
            const exists = locations.some(loc => loc.name === location.name);
            if (!exists) {
              locations.push({
                name: location.name,
                description: `${workTitle}に関連する場所`,
                source: 'Google Search',
                snippet: snippet.substring(0, 200)
              });
            }
          }
        });
      }
    });
  }
  
  return locations;
}

// 検索結果からアイテム情報を抽出
function extractItemsFromSearchResults(results, workTitle) {
  const items = [];
  const itemKeywords = [
    '衣装', '服装', 'ファッション', 'コスチューム',
    '小道具', 'アイテム', 'グッズ', '着用',
    'ブランド', '時計', 'バッグ', '靴', 'アクセサリー'
  ];
  
  if (results.items) {
    results.items.forEach(item => {
      const title = item.title || '';
      const snippet = item.snippet || '';
      const content = `${title} ${snippet}`.toLowerCase();
      
      // アイテムキーワードが含まれているか確認
      const hasItemKeyword = itemKeywords.some(keyword => 
        content.includes(keyword)
      );
      
      if (hasItemKeyword) {
        // ブランド名を抽出
        const brandPatterns = [
          /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/g, // 英語のブランド名
          /「([^」]+)」の(?:衣装|服|バッグ|時計)/g,
          /ブランド「([^」]+)」/g,
        ];
        
        brandPatterns.forEach(pattern => {
          let match;
          while ((match = pattern.exec(snippet)) !== null) {
            const itemName = match[1];
            
            if (itemName.length > 2 && itemName.length < 50) {
              const exists = items.some(item => item.name === itemName);
              if (!exists) {
                items.push({
                  name: itemName,
                  description: `${workTitle}で使用されたアイテム`,
                  category: 'fashion',
                  source: 'Google Search',
                  snippet: snippet.substring(0, 200)
                });
              }
            }
          }
        });
        
        // 具体的なアイテム名を抽出
        const specificItems = [
          { pattern: /腕時計/g, name: '腕時計', category: 'accessories' },
          { pattern: /ネックレス/g, name: 'ネックレス', category: 'accessories' },
          { pattern: /指輪/g, name: '指輪', category: 'accessories' },
          { pattern: /スーツ/g, name: 'スーツ', category: 'fashion' },
          { pattern: /ドレス/g, name: 'ドレス', category: 'fashion' },
          { pattern: /制服/g, name: '制服', category: 'fashion' },
          { pattern: /メガネ/g, name: 'メガネ', category: 'accessories' },
          { pattern: /カバン/g, name: 'カバン', category: 'accessories' },
          { pattern: /リュック/g, name: 'リュック', category: 'accessories' },
        ];
        
        specificItems.forEach(item => {
          if (item.pattern.test(content)) {
            const itemFullName = `${workTitle}の${item.name}`;
            const exists = items.some(i => i.name === itemFullName);
            if (!exists) {
              items.push({
                name: itemFullName,
                description: `${workTitle}で登場した${item.name}`,
                category: item.category,
                source: 'Google Search',
                snippet: snippet.substring(0, 200)
              });
            }
          }
        });
      }
    });
  }
  
  return items;
}

// スラッグ生成
function generateSlug(name) {
  // 日本語をローマ字に変換する簡易版
  const romaji = name
    .replace(/[ぁ-ん]/g, '') // ひらがな除去
    .replace(/[ァ-ン]/g, '') // カタカナ除去
    .replace(/[一-龯]/g, '') // 漢字除去
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // 空の場合はランダム文字列
  return romaji || `location-${Date.now()}`;
}

// ロケーション保存
async function saveLocation(locationData, episodeId, celebrityId) {
  const slug = generateSlug(locationData.name);
  
  // 既存チェック
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', locationData.name)
    .single();
  
  if (existing) {
    console.log(`   📍 既存: ${locationData.name}`);
    return false;
  }
  
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
    tags: ['Google_Search', 'auto_collected'],
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('locations')
    .insert(newLocation);
  
  if (error) {
    console.error(`❌ 保存エラー: ${error.message}`);
    return false;
  }
  
  return true;
}

// アイテム保存
async function saveItem(itemData, episodeId, celebrityId) {
  const slug = generateSlug(itemData.name);
  
  // 既存チェック
  const { data: existing } = await supabase
    .from('items')
    .select('id')
    .eq('name', itemData.name)
    .single();
  
  if (existing) {
    console.log(`   🛍️ 既存: ${itemData.name}`);
    return false;
  }
  
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
    tags: ['Google_Search', 'auto_collected'],
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('items')
    .insert(newItem);
  
  if (error) {
    console.error(`❌ 保存エラー: ${error.message}`);
    return false;
  }
  
  return true;
}

// メイン処理
async function googleSearchLocations() {
  console.log('🔍 Google Custom Search APIで作品情報を自動収集開始！\n');
  
  try {
    // TMDB作品を取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .like('video_url', '%themoviedb.org%')
      .limit(5); // テスト用に5件
    
    console.log(`📊 処理対象: ${episodes?.length || 0}件の作品\n`);
    
    let totalLocations = 0;
    let totalItems = 0;
    
    for (const episode of episodes || []) {
      console.log(`\n🎬 検索中: ${episode.title}`);
      
      // ロケ地検索
      const locationQuery = `${episode.title} 撮影地 ロケ地`;
      console.log(`   検索1: "${locationQuery}"`);
      const locationResults = await googleSearch(locationQuery);
      const locations = extractLocationsFromSearchResults(locationResults, episode.title);
      
      // アイテム検索
      const itemQuery = `${episode.title} 衣装 ファッション アイテム`;
      console.log(`   検索2: "${itemQuery}"`);
      const itemResults = await googleSearch(itemQuery);
      const items = extractItemsFromSearchResults(itemResults, episode.title);
      
      console.log(`   📊 発見: ロケ地${locations.length}件、アイテム${items.length}件`);
      
      // ロケーション保存
      for (const location of locations.slice(0, 3)) { // 最大3件
        const saved = await saveLocation(location, episode.id, episode.celebrity_id);
        if (saved) {
          console.log(`   ✅ ロケ地追加: ${location.name}`);
          totalLocations++;
        }
      }
      
      // アイテム保存
      for (const item of items.slice(0, 3)) { // 最大3件
        const saved = await saveItem(item, episode.id, episode.celebrity_id);
        if (saved) {
          console.log(`   ✅ アイテム追加: ${item.name}`);
          totalItems++;
        }
      }
      
      // API制限対策（1秒待機）
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Google Search収集完了！');
    console.log('📊 結果サマリー:');
    console.log(`   追加ロケーション: ${totalLocations}件`);
    console.log(`   追加アイテム: ${totalItems}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
    console.log('→ 映画・ドラマエピソードにロケ地・アイテムバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

googleSearchLocations();