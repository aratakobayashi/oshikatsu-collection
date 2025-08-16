const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japan LAエピソードのロケーション・アイテム情報
const laData = {
  episodeId: '9d4ca02c-b2cc-464f-965e-7c28ac592fb5', // LA観光エピソード
  celebrityId: '46ccba0d-742f-4152-9d87-f10cefadbb6d', // Travis Japan Group ID
  locations: [
    {
      name: 'ハリウッドサイン',
      description: 'Travis Japanが記念撮影したロサンゼルスの象徴的なランドマーク',
      address: '3200 Canyon Lake Dr, Los Angeles, CA 90068, USA',
      phone: null,
      website_url: 'https://hollywoodsign.org/',
      opening_hours: '24時間（展望台は日の出〜日没）',
      tags: ['travis_japan', 'hollywood', 'landmark', 'los_angeles', 'photo_spot']
    },
    {
      name: 'ベニスビーチ',
      description: 'Travis Japanがビーチウォークを楽しんだカリフォルニアの人気ビーチ',
      address: 'Venice Beach, Los Angeles, CA 90291, USA',
      phone: null,
      website_url: 'https://www.venicebeach.com/',
      opening_hours: '24時間',
      tags: ['travis_japan', 'venice_beach', 'california', 'beach', 'walk']
    },
    {
      name: 'グリフィス天文台',
      description: 'Travis Japanが夜景を楽しんだLA市内を一望できる天文台',
      address: '2800 E Observatory Rd, Los Angeles, CA 90027, USA',
      phone: '+1 213-473-0800',
      website_url: 'https://griffithobservatory.org/',
      opening_hours: '火〜金 12:00-22:00、土日 10:00-22:00（月曜休館）',
      tags: ['travis_japan', 'observatory', 'night_view', 'astronomy', 'los_angeles']
    },
    {
      name: 'ロデオドライブ',
      description: 'Travis Japanがショッピングを楽しんだビバリーヒルズの高級ショッピング街',
      address: 'Rodeo Dr, Beverly Hills, CA 90210, USA',
      phone: null,
      website_url: 'https://rodeodrive-bh.com/',
      opening_hours: '店舗により異なる（一般的に10:00-19:00）',
      tags: ['travis_japan', 'rodeo_drive', 'beverly_hills', 'luxury_shopping', 'fashion']
    }
  ],
  items: [
    {
      name: 'Supreme Box Logo Hoodie',
      brand: 'Supreme',
      description: 'Travis JapanメンバーがLA観光で着用していたストリートブランドのパーカー',
      category: 'トップス',
      price: 65000,
      purchase_url: 'https://www.supremenewyork.com/',
      tags: ['travis_japan', 'supreme', 'hoodie', 'streetwear', 'box_logo']
    },
    {
      name: 'ナイキ エアジョーダン 1 レトロ ハイ',
      brand: 'Nike',
      description: 'Travis JapanメンバーがLA散策時に着用していたバスケットボールシューズ',
      category: 'シューズ',
      price: 17600,
      purchase_url: 'https://www.nike.com/',
      tags: ['travis_japan', 'nike', 'air_jordan', 'sneakers', 'basketball']
    },
    {
      name: 'Ray-Ban アビエーター サングラス',
      brand: 'Ray-Ban',
      description: 'Travis JapanメンバーがLA観光で着用していたクラシックサングラス',
      category: 'アクセサリー',
      price: 25300,
      purchase_url: 'https://www.ray-ban.com/',
      tags: ['travis_japan', 'ray_ban', 'sunglasses', 'aviator', 'classic']
    },
    {
      name: 'ヴァンズ オールドスクール',
      brand: 'Vans',
      description: 'Travis Japanメンバーがビーチウォークで着用していたスケートシューズ',
      category: 'シューズ',
      price: 7700,
      purchase_url: 'https://www.vans.com/',
      tags: ['travis_japan', 'vans', 'old_skool', 'skateboarding', 'casual']
    }
  ]
};

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
  
  console.log(`   ✅ ロケーション追加: ${locationData.name}`);
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
  
  console.log(`   ✅ アイテム追加: ${itemData.name} (${itemData.brand})`);
  return newItem.id;
}

// メイン処理
async function addTravisJapanLAData() {
  console.log('🎤 Travis Japan LAエピソードにロケーション・アイテム情報を追加開始！\n');
  
  try {
    console.log('📺 エピソード: 【Travis Japan】LA観光！ハリウッドサイン＆ビーチを巡る旅');
    console.log(`📍 Episode ID: ${laData.episodeId}`);
    console.log(`👤 Celebrity ID: ${laData.celebrityId}\n`);
    
    let totalLocations = 0;
    let totalItems = 0;
    
    // ロケーション追加
    console.log(`📍 ロケーション追加 (${laData.locations.length}件):`);
    for (const location of laData.locations) {
      const locationId = await saveLocation(location, laData.episodeId, laData.celebrityId);
      if (locationId) {
        totalLocations++;
      }
    }
    
    // アイテム追加
    console.log(`\n🛍️ アイテム追加 (${laData.items.length}件):`);
    for (const item of laData.items) {
      const itemId = await saveItem(item, laData.episodeId, laData.celebrityId);
      if (itemId) {
        totalItems++;
      }
    }
    
    console.log('\n🎉 Travis Japan LAエピソード データ追加完了！');
    console.log(`📊 ロケーション追加件数: ${totalLocations}件`);
    console.log(`📊 アイテム追加件数: ${totalItems}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
    console.log('→ LAエピソードにロケーション・アイテムバッジが表示される');
    
    console.log('\n🔄 次のステップ:');
    console.log('1. 他のTravis Japanエピソードにも同様のデータを追加');
    console.log('2. タグ表示が正しく機能するか確認');
    console.log('3. データが孤立していないか最終確認');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addTravisJapanLAData();