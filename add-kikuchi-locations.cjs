const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 菊池風磨の主要作品のロケーション情報
const kikuchiLocations = [
  // ウソ婚（ドラマ）
  {
    workTitle: 'ウソ婚',
    locations: [
      {
        name: 'ティファニー丸の内店',
        description: 'ウソ婚第1話で主人公が指輪を購入したシーンで使用',
        address: '〒100-0005 東京都千代田区丸の内2-1-1 丸ノ内MY PLAZA',
        phone: '03-5224-5671',
        website_url: 'https://www.tiffany.co.jp/',
        opening_hours: '11:00-20:00',
        access: 'JR東京駅より徒歩3分',
        tags: ['filming_location', 'jewelry', 'luxury', 'ring_scene']
      },
      {
        name: '青山迎賓館',
        description: 'ウソ婚第3話で誕生日パーティー会場として使用',
        address: '〒107-0062 東京都港区南青山4-9-26',
        phone: '03-3403-3131',
        website_url: null,
        opening_hours: null,
        access: '地下鉄表参道駅より徒歩5分',
        tags: ['filming_location', 'party_venue', 'guest_house']
      },
      {
        name: 'COCKTAIL WORKS 神保町',
        description: 'ウソ婚第3-4話でキャラクターの会話シーンに使用されたバー',
        address: '〒101-0052 東京都千代田区神田小川町3-7-13 ヴァンサンクビル1F',
        phone: null,
        website_url: null,
        opening_hours: '18:00-深夜',
        access: '地下鉄神保町駅より徒歩3分',
        tags: ['filming_location', 'bar', 'conversation_scene']
      },
      {
        name: 'ビストロ酒場 T4 KITCHEN 渋谷店',
        description: 'ウソ婚第11話でカフェシーンに使用',
        address: '〒150-0041 東京都渋谷区神南1-12-16',
        phone: null,
        website_url: null,
        opening_hours: '11:30-23:00',
        access: 'JR渋谷駅より徒歩3分',
        tags: ['filming_location', 'cafe', 'bistro']
      },
      {
        name: '下北沢2号踏切',
        description: 'ウソ婚第11話で告白シーンに使用された踏切',
        address: '〒155-0033 東京都世田谷区代田5-31-2',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: '小田急線下北沢駅より徒歩2分',
        tags: ['filming_location', 'crossing', 'confession_scene', 'romantic']
      }
    ]
  },
  // 推しの子（映画）
  {
    workTitle: '【推しの子】',
    locations: [
      {
        name: '原宿竹下通り',
        description: '推しの子でアイドル文化の象徴的な場所として登場',
        address: '〒150-0001 東京都渋谷区神宮前1丁目',
        phone: null,
        website_url: null,
        opening_hours: '店舗により異なる',
        access: 'JR原宿駅より徒歩1分',
        tags: ['filming_location', 'idol_culture', 'harajuku', 'youth']
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
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `location-${Date.now()}`;
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
    console.error(`❌ 保存エラー: ${error.message}`);
    return false;
  }
  
  return true;
}

// メイン処理
async function addKikuchiLocations() {
  console.log('🎬 菊池風磨作品にロケーション情報を追加開始！\n');
  
  try {
    // 菊池風磨のセレブリティIDを取得
    const { data: kikuchiCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', '菊池風磨')
      .single();
      
    if (!kikuchiCelebrity) {
      console.log('❌ 菊池風磨のセレブリティ情報が見つかりません');
      return;
    }
    
    let totalAdded = 0;
    
    for (const work of kikuchiLocations) {
      console.log(`\n📽️ 処理中: ${work.workTitle}`);
      
      // 該当するエピソードを検索
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .ilike('title', `%${work.workTitle.replace('【】', '')}%`)
        .eq('celebrity_id', kikuchiCelebrity.id);
      
      if (!episodes || episodes.length === 0) {
        console.log(`   ⚠️ エピソードが見つかりません: ${work.workTitle}`);
        continue;
      }
      
      const episode = episodes[0]; // 最初のマッチを使用
      console.log(`   📺 対象エピソード: ${episode.title}`);
      
      // ロケーション追加
      for (const location of work.locations) {
        const saved = await saveLocation(location, episode.id, kikuchiCelebrity.id);
        if (saved) {
          console.log(`   ✅ ロケーション追加: ${location.name}`);
          totalAdded++;
        }
      }
    }
    
    console.log('\n🎉 菊池風磨ロケーション追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/kikuchi-fuma');
    console.log('→ 各エピソードにロケーションバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addKikuchiLocations();