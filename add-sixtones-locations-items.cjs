const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESエピソード別のロケーション・アイテム情報
const sixtonesData = [
  {
    episodeTitle: '【SixTONES】東京観光を満喫！浅草めぐり',
    locations: [
      {
        name: '浅草寺',
        description: 'SixTONESが訪れた東京最古の寺院。雷門で有名な観光名所',
        address: '〒111-0032 東京都台東区浅草2-3-1',
        phone: '03-3842-0181',
        website_url: 'https://www.sensoji.jp/',
        opening_hours: '6:00-17:00（4月-9月は6:30-17:00）',
        tags: ['sixtones', 'temple', 'asakusa', 'tourism', 'traditional']
      },
      {
        name: '雷門',
        description: 'SixTONESが記念撮影した浅草のシンボル',
        address: '〒111-0032 東京都台東区浅草2-3-1',
        phone: null,
        website_url: null,
        opening_hours: '24時間',
        tags: ['sixtones', 'landmark', 'asakusa', 'photo_spot']
      },
      {
        name: '仲見世通り',
        description: 'SixTONESがお土産を購入した伝統的な商店街',
        address: '〒111-0032 東京都台東区浅草1-36-3',
        phone: null,
        website_url: null,
        opening_hours: '9:00-19:00（店舗により異なる）',
        tags: ['sixtones', 'shopping', 'asakusa', 'traditional', 'souvenir']
      }
    ],
    items: [
      {
        name: 'ユニクロ エアリズムTシャツ',
        brand: 'ユニクロ',
        description: 'SixTONESメンバーが浅草散策時に着用していた涼しいTシャツ',
        category: 'トップス',
        price: 1500,
        purchase_url: 'https://www.uniqlo.com/',
        tags: ['sixtones', 'uniqlo', 'tshirt', 'summer', 'casual']
      },
      {
        name: 'ナイキ エアフォース1',
        brand: 'Nike',
        description: 'SixTONESメンバーが着用していた定番スニーカー',
        category: 'シューズ',
        price: 12100,
        purchase_url: 'https://www.nike.com/',
        tags: ['sixtones', 'nike', 'sneakers', 'white', 'classic']
      }
    ]
  },
  {
    episodeTitle: '【SixTONES】新宿グルメツアー！話題のレストラン巡り',
    locations: [
      {
        name: 'ルミネエスト新宿レストラン街',
        description: 'SixTONESが訪れた新宿の人気レストランフロア',
        address: '〒160-0022 東京都新宿区新宿3-38-1',
        phone: '03-5269-1111',
        website_url: 'https://www.lumine.ne.jp/est/',
        opening_hours: '11:00-22:30（店舗により異なる）',
        tags: ['sixtones', 'restaurant', 'shinjuku', 'shopping_mall']
      },
      {
        name: '新宿高島屋タイムズスクエア',
        description: 'SixTONESがグルメを楽しんだ新宿の大型商業施設',
        address: '〒151-8580 東京都渋谷区千駄ヶ谷5-24-2',
        phone: '03-5361-1111',
        website_url: 'https://www.takashimaya.co.jp/shinjuku/',
        opening_hours: '10:00-20:30（レストランフロア11:00-23:00）',
        tags: ['sixtones', 'department_store', 'shinjuku', 'gourmet']
      }
    ],
    items: [
      {
        name: 'アディダス トラックジャケット',
        brand: 'アディダス',
        description: 'SixTONESメンバーが新宿で着用していたスポーティなジャケット',
        category: 'アウター',
        price: 8900,
        purchase_url: 'https://shop.adidas.jp/',
        tags: ['sixtones', 'adidas', 'jacket', 'sporty', 'streetwear']
      }
    ]
  },
  {
    episodeTitle: '【SixTONES】原宿ファッション散策 最新トレンドをチェック',
    locations: [
      {
        name: '竹下通り',
        description: 'SixTONESがファッションショッピングを楽しんだ原宿の中心街',
        address: '〒150-0001 東京都渋谷区神宮前1丁目',
        phone: null,
        website_url: null,
        opening_hours: '店舗により異なる',
        tags: ['sixtones', 'harajuku', 'fashion', 'shopping', 'youth_culture']
      },
      {
        name: 'ラフォーレ原宿',
        description: 'SixTONESが最新ファッションをチェックしたファッションビル',
        address: '〒150-0001 東京都渋谷区神宮前1-11-6',
        phone: '03-3475-0411',
        website_url: 'https://www.laforet.ne.jp/',
        opening_hours: '11:00-20:00',
        tags: ['sixtones', 'harajuku', 'fashion_building', 'trendy']
      }
    ],
    items: [
      {
        name: 'ワコマリア ハワイアンシャツ',
        brand: 'WACKO MARIA',
        description: 'SixTONESメンバーが原宿で購入した個性的なシャツ',
        category: 'トップス',
        price: 35000,
        purchase_url: 'https://wackomaria.jp/',
        tags: ['sixtones', 'wacko_maria', 'hawaiian_shirt', 'streetwear', 'unique']
      },
      {
        name: 'クロムハーツ シルバーリング',
        brand: 'Chrome Hearts',
        description: 'SixTONESメンバーが着用していた高級シルバーアクセサリー',
        category: 'アクセサリー',
        price: 85000,
        purchase_url: null,
        tags: ['sixtones', 'chrome_hearts', 'ring', 'silver', 'luxury']
      }
    ]
  }
];

// スラッグ生成
function generateSlug(name) {
  return name
    .replace(/[ぁ-ん]/g, '') // ひらがな除去
    .replace(/[ァ-ン]/g, '') // カタカナ除去  
    .replace(/[一-龯]/g, '') // 漢字除去
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
}

// ロケーション保存
async function saveLocation(locationData, episodeId, celebrityId) {
  const slug = generateSlug(locationData.name);
  
  const { data: existing } = await supabase
    .from('locations')
    .select('id')
    .eq('name', locationData.name)
    .eq('episode_id', episodeId)
    .single();
  
  if (existing) {
    console.log(`   📍 既存: ${locationData.name}`);
    return existing.id;
  }
  
  const newLocation = {
    id: crypto.randomUUID(),
    name: locationData.name,
    slug: slug,
    description: locationData.description,
    address: locationData.address,
    latitude: null,
    longitude: null,
    image_url: null,
    website_url: locationData.website_url,
    phone: locationData.phone,
    opening_hours: locationData.opening_hours,
    tags: locationData.tags,
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('locations')
    .insert(newLocation);
  
  if (error) {
    console.error(`❌ ロケーション保存エラー: ${error.message}`);
    return null;
  }
  
  return newLocation.id;
}

// アイテム保存
async function saveItem(itemData, episodeId, celebrityId) {
  const slug = generateSlug(itemData.name);
  
  const { data: existing } = await supabase
    .from('items')
    .select('id')
    .eq('name', itemData.name)
    .eq('episode_id', episodeId)
    .single();
  
  if (existing) {
    console.log(`   🛍️ 既存: ${itemData.name}`);
    return existing.id;
  }
  
  const newItem = {
    id: crypto.randomUUID(),
    name: itemData.name,
    slug: slug,
    brand: itemData.brand,
    description: itemData.description,
    category: itemData.category,
    price: itemData.price,
    purchase_url: itemData.purchase_url,
    image_url: null,
    tags: itemData.tags,
    episode_id: episodeId,
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('items')
    .insert(newItem);
  
  if (error) {
    console.error(`❌ アイテム保存エラー: ${error.message}`);
    return null;
  }
  
  return newItem.id;
}

// メイン処理
async function addSixTONESLocationsItems() {
  console.log('🎤 SixTONESエピソードにロケーション・アイテム情報を追加開始！\n');
  
  try {
    // SixTONESのセレブリティIDを取得
    const { data: sixtoneCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'SixTONES')
      .single();
      
    if (!sixtoneCelebrity) {
      console.log('❌ SixTONESのセレブリティ情報が見つかりません');
      return;
    }
    
    let totalLocations = 0;
    let totalItems = 0;
    
    for (const episodeData of sixtonesData) {
      console.log(`\\n📺 処理中: ${episodeData.episodeTitle}`);
      
      // エピソードIDを取得
      const { data: episode } = await supabase
        .from('episodes')
        .select('id')
        .eq('title', episodeData.episodeTitle)
        .eq('celebrity_id', sixtoneCelebrity.id)
        .single();
      
      if (!episode) {
        console.log(`   ⚠️ エピソードが見つかりません: ${episodeData.episodeTitle}`);
        continue;
      }
      
      // ロケーション追加
      console.log(`   📍 ロケーション追加 (${episodeData.locations.length}件):`);
      for (const location of episodeData.locations) {
        const locationId = await saveLocation(location, episode.id, sixtoneCelebrity.id);
        if (locationId) {
          console.log(`     ✅ ${location.name}`);
          totalLocations++;
        }
      }
      
      // アイテム追加
      if (episodeData.items && episodeData.items.length > 0) {
        console.log(`   🛍️ アイテム追加 (${episodeData.items.length}件):`);
        for (const item of episodeData.items) {
          const itemId = await saveItem(item, episode.id, sixtoneCelebrity.id);
          if (itemId) {
            console.log(`     ✅ ${item.name} (${item.brand})`);
            totalItems++;
          }
        }
      }
    }
    
    console.log('\\n🎉 SixTONESロケーション・アイテム追加完了！');
    console.log(`📊 ロケーション追加件数: ${totalLocations}件`);
    console.log(`📊 アイテム追加件数: ${totalItems}件`);
    
    console.log('\\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('→ 各エピソードにロケーション・アイテムバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addSixTONESLocationsItems();