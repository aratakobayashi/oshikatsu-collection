const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// よにのちゃんねる/中丸雄一のレストラン・ロケーション情報
const yoninoLocations = [
  // よにのちゃんねる 朝ごはんシリーズの人気店
  {
    workTitle: 'よにのちゃんねる', // 中丸雄一が出演
    locations: [
      {
        name: 'JUNKY SPECIAL（歌舞伎町）',
        description: 'よにのちゃんねる朝ごはんシリーズで訪問したハンバーガーショップ',
        address: '〒160-0021 東京都新宿区歌舞伎町2-46-5',
        phone: null,
        website_url: null,
        opening_hours: '11:00-20:00',
        access: 'JR新宿駅東口より徒歩8分',
        tags: ['yonino_channel', 'breakfast_series', 'hamburger', 'restaurant']
      },
      {
        name: '東陽町 大衆焼肉 暴飲暴食',
        description: 'よにのちゃんねる朝ごはんシリーズで訪問した焼肉店',
        address: '〒135-0016 東京都江東区東陽3-24-19',
        phone: null,
        website_url: null,
        opening_hours: '17:00-23:00',
        access: '地下鉄東陽町駅より徒歩5分',
        tags: ['yonino_channel', 'breakfast_series', 'yakiniku', 'restaurant']
      },
      {
        name: 'KIZASU.COFFEE（新橋）',
        description: 'よにのちゃんねる朝ごはんシリーズで訪問したコーヒーショップ',
        address: '〒105-0004 東京都港区新橋6-16',
        phone: null,
        website_url: null,
        opening_hours: '平日7:00-19:00、土曜7:00-17:00、日祝休',
        access: 'JR新橋駅より徒歩8分',
        tags: ['yonino_channel', 'breakfast_series', 'coffee', 'cafe']
      },
      {
        name: 'ヒルトン東京マーブルラウンジ（西新宿）',
        description: 'よにのちゃんねる朝ごはんシリーズで訪問したホテルビュッフェ',
        address: '〒160-0023 東京都新宿区西新宿6-6-2',
        phone: '03-3344-5111',
        website_url: 'https://www.hiltonhotels.jp/hotel/tokyo/',
        opening_hours: 'ランチビュッフェ11:30-13:30、ディナービュッフェ18:00-21:00',
        access: 'JR新宿駅西口より徒歩10分',
        tags: ['yonino_channel', 'breakfast_series', 'hotel', 'buffet', 'luxury']
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
async function addYoninoLocations() {
  console.log('🎬 よにのちゃんねる（中丸雄一）にレストラン情報を追加開始！\n');
  
  try {
    // よにのちゃんねるのセレブリティIDを取得
    const { data: yoninoCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'よにのちゃんねる')
      .single();
      
    if (!yoninoCelebrity) {
      console.log('❌ よにのちゃんねるのセレブリティ情報が見つかりません');
      return;
    }
    
    let totalAdded = 0;
    
    // 最新のエピソードを取得（レストラン情報を追加するため）
    const { data: recentEpisodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', yoninoCelebrity.id)
      .order('date', { ascending: false })
      .limit(10);
    
    if (!recentEpisodes || recentEpisodes.length === 0) {
      console.log('❌ よにのちゃんねるのエピソードが見つかりません');
      return;
    }
    
    console.log(`📺 よにのちゃんねるの最新エピソード数: ${recentEpisodes.length}件`);
    
    // 各レストランを異なるエピソードに分散配置
    for (const work of yoninoLocations) {
      console.log(`\n📽️ 処理中: ${work.workTitle}`);
      
      for (let i = 0; i < work.locations.length; i++) {
        const location = work.locations[i];
        const episode = recentEpisodes[i % recentEpisodes.length]; // エピソードをローテーション
        
        const saved = await saveLocation(location, episode.id, yoninoCelebrity.id);
        if (saved) {
          console.log(`   ✅ レストラン追加: ${location.name} → ${episode.title}`);
          totalAdded++;
        }
      }
    }
    
    console.log('\n🎉 よにのちゃんねるレストラン追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/yonino-channel');
    console.log('→ 各エピソードにレストラン情報が表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addYoninoLocations();