const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONES銀座エピソードのロケーション・アイテム情報
const ginzaData = {
  episodeId: '4ccead67-b051-4c37-8a47-6468f6600096',
  celebrityId: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7',
  locations: [
    {
      name: '銀座三越',
      description: 'SixTONESが高級ブランドショッピングを楽しんだ老舗デパート',
      address: '〒104-8212 東京都中央区銀座4-6-16',
      phone: '03-3562-1111',
      website_url: 'https://www.mitsukoshi.mistore.jp/ginza.html',
      opening_hours: '10:00-20:00',
      tags: ['sixtones', 'ginza', 'department_store', 'luxury', 'shopping']
    },
    {
      name: 'ギンザシックス',
      description: 'SixTONESが最新ファッションをチェックした銀座の新名所',
      address: '〒104-0061 東京都中央区銀座6-10-1',
      phone: '03-6891-3390',
      website_url: 'https://ginza6.tokyo/',
      opening_hours: '10:30-20:30（レストランフロア11:00-23:00）',
      tags: ['sixtones', 'ginza', 'shopping_mall', 'fashion', 'modern']
    },
    {
      name: 'ティファニー銀座本店',
      description: 'SixTONESメンバーが訪れた世界的ジュエリーブランドの旗艦店',
      address: '〒104-0061 東京都中央区銀座2-7-17',
      phone: '03-3224-5111',
      website_url: 'https://www.tiffany.co.jp/',
      opening_hours: '11:00-19:00',
      tags: ['sixtones', 'ginza', 'jewelry', 'luxury', 'tiffany']
    },
    {
      name: 'ルイ・ヴィトン銀座並木通り店',
      description: 'SixTONESが高級レザーグッズを見学したブランドストア',
      address: '〒104-0061 東京都中央区銀座7-6-1',
      phone: '0120-00-1854',
      website_url: 'https://jp.louisvuitton.com/',
      opening_hours: '11:00-20:00',
      tags: ['sixtones', 'ginza', 'luxury', 'leather_goods', 'louis_vuitton']
    }
  ],
  items: [
    {
      name: 'ルイ・ヴィトン ダミエ・キャンバス ポルトフォイユ・ブラザ',
      brand: 'ルイ・ヴィトン',
      description: 'SixTONESメンバーが購入検討していた高級二つ折り財布',
      category: '財布・小物',
      price: 87400,
      purchase_url: 'https://jp.louisvuitton.com/',
      tags: ['sixtones', 'louis_vuitton', 'wallet', 'damier', 'luxury']
    },
    {
      name: 'ティファニー Tワイヤー ブレスレット',
      brand: 'ティファニー',
      description: 'SixTONESメンバーが試着していたシルバーブレスレット',
      category: 'アクセサリー',
      price: 52800,
      purchase_url: 'https://www.tiffany.co.jp/',
      tags: ['sixtones', 'tiffany', 'bracelet', 'silver', 'jewelry']
    },
    {
      name: 'エルメス Hベルト',
      brand: 'エルメス',
      description: 'SixTONESメンバーが着用していた象徴的なHバックルベルト',
      category: 'ファッション小物',
      price: 98000,
      purchase_url: null,
      tags: ['sixtones', 'hermes', 'belt', 'luxury', 'h_buckle']
    },
    {
      name: 'バレンシアガ トリプルS スニーカー',
      brand: 'バレンシアガ',
      description: 'SixTONESメンバーが銀座散策時に着用していたチャンキースニーカー',
      category: 'シューズ',
      price: 132000,
      purchase_url: 'https://www.balenciaga.com/',
      tags: ['sixtones', 'balenciaga', 'sneakers', 'chunky', 'streetwear']
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
async function addSixTONESGinzaData() {
  console.log('🎤 SixTONES銀座エピソードにロケーション・アイテム情報を追加開始！\n');
  
  try {
    console.log('📺 エピソード: 【SixTONES】銀座ショッピング！高級ブランド店めぐり');
    console.log(`📍 Episode ID: ${ginzaData.episodeId}`);
    console.log(`👤 Celebrity ID: ${ginzaData.celebrityId}\n`);
    
    let totalLocations = 0;
    let totalItems = 0;
    
    // ロケーション追加
    console.log(`📍 ロケーション追加 (${ginzaData.locations.length}件):`);
    for (const location of ginzaData.locations) {
      const locationId = await saveLocation(location, ginzaData.episodeId, ginzaData.celebrityId);
      if (locationId) {
        totalLocations++;
      }
    }
    
    // アイテム追加
    console.log(`\n🛍️ アイテム追加 (${ginzaData.items.length}件):`);
    for (const item of ginzaData.items) {
      const itemId = await saveItem(item, ginzaData.episodeId, ginzaData.celebrityId);
      if (itemId) {
        totalItems++;
      }
    }
    
    console.log('\n🎉 SixTONES銀座エピソード データ追加完了！');
    console.log(`📊 ロケーション追加件数: ${totalLocations}件`);
    console.log(`📊 アイテム追加件数: ${totalItems}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
    console.log('→ 銀座エピソードにロケーション・アイテムバッジが表示される');
    
    console.log('\n🔄 次のステップ:');
    console.log('1. Travis Japanのエピソードにも同様のデータを追加');
    console.log('2. タグ表示が正しく機能するか確認');
    console.log('3. データが孤立していないか最終確認');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addSixTONESGinzaData();