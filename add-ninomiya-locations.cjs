const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 二宮和也の主要作品のロケーション情報
const ninomiyaLocations = [
  // アナログ（映画）
  {
    workTitle: 'アナログ',
    locations: [
      {
        name: '志づや',
        description: '映画「アナログ」でそば作りのシーンで使用された老舗そば店',
        address: '〒110-0015 東京都台東区東上野2-4-3',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: 'JR上野駅より徒歩',
        tags: ['filming_location', 'restaurant', 'soba']
      },
      {
        name: '亀澤堂',
        description: '映画「アナログ」で使用された神保町の老舗和菓子店',
        address: '〒101-0051 東京都千代田区神田神保町1-12-1',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: '地下鉄神保町駅より徒歩',
        tags: ['filming_location', 'sweets', 'traditional']
      },
      {
        name: 'スタージュエリー銀座店',
        description: '映画「アナログ」で使用されたジュエリーショップ',
        address: '〒104-0061 東京都中央区銀座6-8-3',
        phone: null,
        website_url: 'https://www.star-jewelry.com/',
        opening_hours: '11:00-20:00',
        access: '地下鉄銀座駅より徒歩2分',
        tags: ['filming_location', 'jewelry', 'luxury']
      },
      {
        name: 'NEM COFFEE & ESPRESSO',
        description: '映画「アナログ」で使用されたオーガニックコーヒーショップ',
        address: '〒106-0047 東京都港区南麻布4-5-6',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: '地下鉄広尾駅より徒歩',
        tags: ['filming_location', 'cafe', 'organic']
      }
    ]
  },
  // マイファミリー（ドラマ）
  {
    workTitle: 'マイファミリー',
    locations: [
      {
        name: '小田原城址公園銅門広場',
        description: 'マイファミリー第1話で現金受け渡しシーンに使用',
        address: '〒250-0014 神奈川県小田原市城内3-22',
        phone: '0465-23-1373',
        website_url: 'https://odawaracastle.com/',
        opening_hours: '9:00-17:00',
        access: 'JR小田原駅より徒歩10分',
        tags: ['filming_location', 'castle', 'park']
      },
      {
        name: '大庭神社',
        description: 'マイファミリーで急な石段が印象的な現金受け渡し場所',
        address: '〒251-0861 神奈川県藤沢市大庭997',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: 'JR藤沢駅よりバス',
        tags: ['filming_location', 'shrine', 'stone_steps']
      },
      {
        name: '辻堂海水浴場',
        description: 'マイファミリーで家族が歩くシーンで使用された海岸',
        address: '〒251-0047 神奈川県藤沢市辻堂西海岸',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: 'JR辻堂駅より徒歩10分',
        tags: ['filming_location', 'beach', 'family_scene']
      },
      {
        name: 'ナビオス横浜',
        description: 'マイファミリー最終シーンで事件を振り返るレストラン',
        address: '〒231-0001 神奈川県横浜市中区新港2-1-1',
        phone: '045-633-6000',
        website_url: 'https://www.navios-yokohama.com/',
        opening_hours: '11:30-22:00',
        access: 'みなとみらい線馬車道駅より徒歩3分',
        tags: ['filming_location', 'hotel', 'restaurant', 'final_scene']
      },
      {
        name: '横須賀美術館',
        description: 'マイファミリーで現金受け渡しシーンに使用された美術館',
        address: '〒238-0016 神奈川県横須賀市鴨居4-1',
        phone: '046-845-1211',
        website_url: 'https://www.yokosuka-moa.jp/',
        opening_hours: '10:00-18:00（月曜休館）',
        access: '京急馬堀海岸駅よりバス10分',
        tags: ['filming_location', 'museum', 'art']
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
async function addNinomiyaLocations() {
  console.log('🎬 二宮和也作品にロケーション情報を追加開始！\n');
  
  try {
    // 二宮和也のセレブリティIDを取得
    const { data: ninomiyaCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', '二宮和也')
      .single();
      
    if (!ninomiyaCelebrity) {
      console.log('❌ 二宮和也のセレブリティ情報が見つかりません');
      return;
    }
    
    let totalAdded = 0;
    
    for (const work of ninomiyaLocations) {
      console.log(`\n📽️ 処理中: ${work.workTitle}`);
      
      // 該当するエピソードを検索
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .ilike('title', `%${work.workTitle}%`)
        .eq('celebrity_id', ninomiyaCelebrity.id);
      
      if (!episodes || episodes.length === 0) {
        console.log(`   ⚠️ エピソードが見つかりません: ${work.workTitle}`);
        continue;
      }
      
      const episode = episodes[0]; // 最初のマッチを使用
      console.log(`   📺 対象エピソード: ${episode.title}`);
      
      // ロケーション追加
      for (const location of work.locations) {
        const saved = await saveLocation(location, episode.id, ninomiyaCelebrity.id);
        if (saved) {
          console.log(`   ✅ ロケーション追加: ${location.name}`);
          totalAdded++;
        }
      }
    }
    
    console.log('\n🎉 二宮和也ロケーション追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/ninomiya-kazunari');
    console.log('→ 各エピソードにロケーションバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addNinomiyaLocations();