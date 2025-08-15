const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Wikipedia API呼び出し
async function wikipediaApiCall(url) {
  return new Promise((resolve, reject) => {
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

// Wikipedia検索
async function searchWikipedia(query) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodedQuery}&format=json&srlimit=3`;
  
  try {
    const response = await wikipediaApiCall(url);
    return response.query?.search || [];
  } catch (error) {
    console.error(`Wikipedia検索エラー: ${error.message}`);
    return [];
  }
}

// Wikipediaページコンテンツ取得
async function getWikipediaContent(pageId) {
  const url = `https://ja.wikipedia.org/w/api.php?action=query&prop=extracts&pageids=${pageId}&format=json&exintro=1&explaintext=1&exchars=1200`;
  
  try {
    const response = await wikipediaApiCall(url);
    const pages = response.query?.pages;
    if (pages && pages[pageId]) {
      return pages[pageId].extract || '';
    }
    return '';
  } catch (error) {
    console.error(`Wikipediaコンテンツ取得エラー: ${error.message}`);
    return '';
  }
}

// テキストからロケーション情報を抽出
function extractLocationsFromText(text, workTitle) {
  const locations = [];
  
  // 日本の地名パターン
  const locationPatterns = [
    // 都道府県
    { pattern: /北海道/g, name: '北海道' },
    { pattern: /青森(?:県)?/g, name: '青森県' },
    { pattern: /岩手(?:県)?/g, name: '岩手県' },
    { pattern: /宮城(?:県)?/g, name: '宮城県' },
    { pattern: /秋田(?:県)?/g, name: '秋田県' },
    { pattern: /山形(?:県)?/g, name: '山形県' },
    { pattern: /福島(?:県)?/g, name: '福島県' },
    { pattern: /茨城(?:県)?/g, name: '茨城県' },
    { pattern: /栃木(?:県)?/g, name: '栃木県' },
    { pattern: /群馬(?:県)?/g, name: '群馬県' },
    { pattern: /埼玉(?:県)?/g, name: '埼玉県' },
    { pattern: /千葉(?:県)?/g, name: '千葉県' },
    { pattern: /東京(?:都)?/g, name: '東京都' },
    { pattern: /神奈川(?:県)?/g, name: '神奈川県' },
    { pattern: /新潟(?:県)?/g, name: '新潟県' },
    { pattern: /富山(?:県)?/g, name: '富山県' },
    { pattern: /石川(?:県)?/g, name: '石川県' },
    { pattern: /福井(?:県)?/g, name: '福井県' },
    { pattern: /山梨(?:県)?/g, name: '山梨県' },
    { pattern: /長野(?:県)?/g, name: '長野県' },
    { pattern: /岐阜(?:県)?/g, name: '岐阜県' },
    { pattern: /静岡(?:県)?/g, name: '静岡県' },
    { pattern: /愛知(?:県)?/g, name: '愛知県' },
    { pattern: /三重(?:県)?/g, name: '三重県' },
    { pattern: /滋賀(?:県)?/g, name: '滋賀県' },
    { pattern: /京都(?:府)?/g, name: '京都府' },
    { pattern: /大阪(?:府)?/g, name: '大阪府' },
    { pattern: /兵庫(?:県)?/g, name: '兵庫県' },
    { pattern: /奈良(?:県)?/g, name: '奈良県' },
    { pattern: /和歌山(?:県)?/g, name: '和歌山県' },
    { pattern: /沖縄(?:県)?/g, name: '沖縄県' },
    
    // 主要都市・エリア
    { pattern: /渋谷/g, name: '渋谷' },
    { pattern: /新宿/g, name: '新宿' },
    { pattern: /原宿/g, name: '原宿' },
    { pattern: /銀座/g, name: '銀座' },
    { pattern: /浅草/g, name: '浅草' },
    { pattern: /上野/g, name: '上野' },
    { pattern: /池袋/g, name: '池袋' },
    { pattern: /品川/g, name: '品川' },
    { pattern: /六本木/g, name: '六本木' },
    { pattern: /赤坂/g, name: '赤坂' },
    { pattern: /表参道/g, name: '表参道' },
    { pattern: /恵比寿/g, name: '恵比寿' },
    { pattern: /代官山/g, name: '代官山' },
    { pattern: /自由が丘/g, name: '自由が丘' },
    { pattern: /お台場/g, name: 'お台場' },
    { pattern: /横浜/g, name: '横浜' },
    { pattern: /鎌倉/g, name: '鎌倉' },
    { pattern: /大阪(?:市)?/g, name: '大阪市' },
    { pattern: /神戸(?:市)?/g, name: '神戸市' },
    { pattern: /名古屋(?:市)?/g, name: '名古屋市' },
    { pattern: /福岡(?:市)?/g, name: '福岡市' },
    { pattern: /仙台(?:市)?/g, name: '仙台市' },
    { pattern: /札幌(?:市)?/g, name: '札幌市' },
    
    // 著名な建物・スポット
    { pattern: /東京タワー/g, name: '東京タワー' },
    { pattern: /東京スカイツリー|スカイツリー/g, name: '東京スカイツリー' },
    { pattern: /東京駅/g, name: '東京駅' },
    { pattern: /新宿駅/g, name: '新宿駅' },
    { pattern: /渋谷駅/g, name: '渋谷駅' },
    { pattern: /羽田空港/g, name: '羽田空港' },
    { pattern: /成田空港/g, name: '成田空港' },
    { pattern: /皇居/g, name: '皇居' },
    { pattern: /明治神宮/g, name: '明治神宮' },
    { pattern: /浅草寺/g, name: '浅草寺' },
    { pattern: /清水寺/g, name: '清水寺' },
    { pattern: /金閣寺/g, name: '金閣寺' },
    { pattern: /銀閣寺/g, name: '銀閣寺' },
    { pattern: /伏見稲荷/g, name: '伏見稲荷大社' },
    { pattern: /大阪城/g, name: '大阪城' },
    { pattern: /姫路城/g, name: '姫路城' },
    { pattern: /富士山/g, name: '富士山' }
  ];
  
  // 撮影関連キーワードの周辺をチェック
  const filmingKeywords = ['撮影', 'ロケ', 'ロケーション', '舞台', '設定'];
  const filmingContext = filmingKeywords.some(keyword => text.includes(keyword));
  
  locationPatterns.forEach(location => {
    if (location.pattern.test(text)) {
      // 重複チェック
      const exists = locations.some(loc => loc.name === location.name);
      if (!exists) {
        locations.push({
          name: location.name,
          description: filmingContext ? 
            `${workTitle}に関連する撮影地・舞台設定地` : 
            `${workTitle}に関連する地域`,
          source: 'Wikipedia',
          context: filmingContext ? 'filming_related' : 'general_reference'
        });
      }
    }
  });
  
  return locations;
}

// テキストからアイテム情報を抽出
function extractItemsFromText(text, workTitle) {
  const items = [];
  
  // 具体的なブランド・アイテムパターン
  const itemPatterns = [
    // ファッションブランド
    { pattern: /グッチ|Gucci/gi, name: 'グッチ', category: 'fashion' },
    { pattern: /プラダ|Prada/gi, name: 'プラダ', category: 'fashion' },
    { pattern: /シャネル|Chanel/gi, name: 'シャネル', category: 'fashion' },
    { pattern: /エルメス|Hermes/gi, name: 'エルメス', category: 'fashion' },
    { pattern: /ルイヴィトン|Louis Vuitton/gi, name: 'ルイヴィトン', category: 'fashion' },
    { pattern: /ユニクロ|UNIQLO/gi, name: 'ユニクロ', category: 'fashion' },
    { pattern: /ZARA/gi, name: 'ZARA', category: 'fashion' },
    
    // 時計ブランド
    { pattern: /ロレックス|Rolex/gi, name: 'ロレックス', category: 'accessories' },
    { pattern: /オメガ|Omega/gi, name: 'オメガ', category: 'accessories' },
    { pattern: /セイコー|SEIKO/gi, name: 'セイコー', category: 'accessories' },
    { pattern: /カシオ|CASIO/gi, name: 'カシオ', category: 'accessories' },
    
    // 車・乗り物
    { pattern: /トヨタ|Toyota/gi, name: 'トヨタ', category: 'vehicle' },
    { pattern: /ホンダ|Honda/gi, name: 'ホンダ', category: 'vehicle' },
    { pattern: /BMW/gi, name: 'BMW', category: 'vehicle' },
    { pattern: /メルセデス|Mercedes/gi, name: 'メルセデス・ベンツ', category: 'vehicle' },
    { pattern: /フェラーリ|Ferrari/gi, name: 'フェラーリ', category: 'vehicle' },
    
    // 電子機器
    { pattern: /iPhone/gi, name: 'iPhone', category: 'electronics' },
    { pattern: /iPad/gi, name: 'iPad', category: 'electronics' },
    { pattern: /MacBook/gi, name: 'MacBook', category: 'electronics' },
    { pattern: /PlayStation|プレステ/gi, name: 'PlayStation', category: 'electronics' },
    { pattern: /Nintendo|任天堂/gi, name: 'Nintendo', category: 'electronics' },
    
    // 一般的なアイテム（より具体的なもの）
    { pattern: /学生服|制服/g, name: '学生服', category: 'costume' },
    { pattern: /和服|着物/g, name: '着物', category: 'costume' },
    { pattern: /浴衣/g, name: '浴衣', category: 'costume' },
    { pattern: /スーツ/g, name: 'スーツ', category: 'fashion' },
    { pattern: /ドレス/g, name: 'ドレス', category: 'fashion' }
  ];
  
  itemPatterns.forEach(item => {
    if (item.pattern.test(text)) {
      // 重複チェック
      const exists = items.some(itm => itm.name === item.name);
      if (!exists) {
        items.push({
          name: item.name,
          description: `${workTitle}に関連するアイテム`,
          category: item.category,
          source: 'Wikipedia'
        });
      }
    }
  });
  
  return items;
}

// スラッグ生成
function generateSlug(name) {
  return name
    .replace(/[ぁ-ん]/g, '') // ひらがな除去
    .replace(/[ァ-ン]/g, '') // カタカナ除去
    .replace(/[一-龯]/g, '') // 漢字除去
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
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
    tags: ['Wikipedia', locationData.context],
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
    tags: ['Wikipedia'],
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
async function collectFromWikipedia() {
  console.log('📚 Wikipedia APIでロケーション・アイテム情報を収集開始！\n');
  
  try {
    // TMDB作品を取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .like('video_url', '%themoviedb.org%')
      .limit(3); // テスト用に3件
    
    console.log(`📊 処理対象: ${episodes?.length || 0}件の作品\n`);
    
    let totalLocations = 0;
    let totalItems = 0;
    
    for (const episode of episodes || []) {
      console.log(`\n🎬 検索中: ${episode.title}`);
      
      // Wikipedia検索
      const searchResults = await searchWikipedia(episode.title);
      console.log(`   📖 Wikipedia検索結果: ${searchResults.length}件`);
      
      let episodeLocations = [];
      let episodeItems = [];
      
      // 検索結果から情報を抽出
      for (const result of searchResults.slice(0, 2)) { // 上位2件のみ
        console.log(`   📄 分析中: ${result.title}`);
        
        const content = await getWikipediaContent(result.pageid);
        if (content) {
          const locations = extractLocationsFromText(content, episode.title);
          const items = extractItemsFromText(content, episode.title);
          
          episodeLocations.push(...locations);
          episodeItems.push(...items);
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // 重複除去
      const uniqueLocations = episodeLocations.filter((loc, index, self) => 
        self.findIndex(l => l.name === loc.name) === index
      );
      const uniqueItems = episodeItems.filter((item, index, self) => 
        self.findIndex(i => i.name === item.name) === index
      );
      
      console.log(`   📊 発見: ロケーション${uniqueLocations.length}件、アイテム${uniqueItems.length}件`);
      
      // ロケーション保存（最大3件）
      for (const location of uniqueLocations.slice(0, 3)) {
        const saved = await saveLocation(location, episode.id, episode.celebrity_id);
        if (saved) {
          console.log(`   ✅ ロケーション追加: ${location.name}`);
          totalLocations++;
        }
      }
      
      // アイテム保存（最大3件）
      for (const item of uniqueItems.slice(0, 3)) {
        const saved = await saveItem(item, episode.id, episode.celebrity_id);
        if (saved) {
          console.log(`   ✅ アイテム追加: ${item.name}`);
          totalItems++;
        }
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Wikipedia収集完了！');
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

collectFromWikipedia();