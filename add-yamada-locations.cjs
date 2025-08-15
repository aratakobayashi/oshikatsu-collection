const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 山田涼介の主要作品のロケーション情報
const yamadaLocations = [
  // セミオトコ
  {
    workTitle: 'セミオトコ',
    locations: [
      {
        name: '蓮月（れんげつ）カフェ',
        description: 'セミオトコで登場する古民家カフェ。劇中ドリンク「セミオ」も実際に提供',
        address: '〒143-0041 東京都大田区池上2-20-11',
        phone: null,
        website_url: null,
        opening_hours: '10:00-18:00（L.O.17:30）不定休',
        access: '東急池上線池上駅より徒歩8分',
        tags: ['fan_pilgrimage', 'cafe', 'drama_location']
      },
      {
        name: '東京大学生態調和農学機構',
        description: 'セミオトコでうつせみ荘のアパート外観として使用された撮影地',
        address: '〒188-0002 東京都西東京市緑町1-1-1',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: '西武新宿線田無駅より徒歩8分',
        tags: ['filming_location', 'apartment']
      }
    ]
  },
  // もみ消して冬
  {
    workTitle: 'もみ消して冬',
    locations: [
      {
        name: '旧朝吹常吉邸（高輪館）',
        description: 'もみ消して冬で北沢家の洋館として使用されたメインロケ地',
        address: '〒108-0074 東京都港区高輪3丁目',
        phone: null,
        website_url: null,
        opening_hours: null,
        access: '地下鉄各線高輪台駅より徒歩',
        tags: ['filming_location', 'main_location', 'mansion']
      },
      {
        name: '警視庁本庁舎',
        description: '北沢秀作（山田涼介）が勤務する警察庁の外観撮影地',
        address: '〒100-8929 東京都千代田区霞が関2-1-1',
        phone: '03-3581-4321',
        website_url: 'https://www.keishicho.metro.tokyo.lg.jp/',
        opening_hours: null,
        access: '地下鉄桜田門駅より徒歩2分',
        tags: ['filming_location', 'government']
      },
      {
        name: 'ティップネス三軒茶屋店',
        description: 'もみ消して冬でスポーツジムのシーンで使用されたと推測される場所',
        address: '〒154-0024 東京都世田谷区三軒茶屋2-2-16',
        phone: '03-5787-1811',
        website_url: 'https://tip.tipness.co.jp/shop_info/SHP013/',
        opening_hours: '平日9:00-23:00、土日祝9:00-21:00',
        access: '東急田園都市線三軒茶屋駅より徒歩2分',
        tags: ['filming_location', 'gym', 'fitness']
      }
    ]
  },
  // ビリオンスクール
  {
    workTitle: 'ビリオンスクール',
    locations: [
      {
        name: '流山市立おおぐろの森中学校',
        description: 'ビリオンスクールの学校シーンで使用された撮影地',
        address: '〒270-0122 千葉県流山市大畔581',
        phone: '04-7152-5557',
        website_url: null,
        opening_hours: null,
        access: 'JR武蔵野線南流山駅よりバス',
        tags: ['filming_location', 'school']
      },
      {
        name: '小田原三の丸ホール',
        description: 'ビリオンスクール第1話で使用された撮影地',
        address: '〒250-0012 神奈川県小田原市本町1-7-50',
        phone: '0465-20-4152',
        website_url: 'https://www.sannomaru-hall.com/',
        opening_hours: '9:00-22:00',
        access: 'JR小田原駅東口より徒歩10分',
        tags: ['filming_location', 'hall']
      },
      {
        name: '旧華頂宮邸',
        description: 'ビリオンスクール第1話で使用された歴史的建造物',
        address: '〒248-0003 神奈川県鎌倉市浄明寺2-6-37',
        phone: '0467-61-3857',
        website_url: null,
        opening_hours: '10:00-16:00（木金土日のみ開館）',
        access: 'JR鎌倉駅よりバス10分',
        tags: ['filming_location', 'historical']
      }
    ]
  },
  // ナミヤ雑貨店の奇蹟
  {
    workTitle: 'ナミヤ雑貨店の奇蹟',
    locations: [
      {
        name: '豊後高田昭和の町',
        description: 'ナミヤ雑貨店の奇蹟のメイン撮影地として使用された昭和レトロな商店街',
        address: '〒872-1104 大分県豊後高田市新町',
        phone: '0978-23-1860',
        website_url: 'https://www.showa-no-machi.com/',
        opening_hours: '9:00-18:00',
        access: 'JR宇佐駅よりバス20分',
        tags: ['filming_location', 'main_location', 'retro_town']
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
async function addYamadaLocations() {
  console.log('🎬 山田涼介作品にロケーション情報を追加開始！\n');
  
  try {
    // 山田涼介のセレブリティIDを取得
    const { data: yamadaCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('slug', 'yamada-ryosuke')
      .single();
      
    if (!yamadaCelebrity) {
      console.log('❌ 山田涼介のセレブリティ情報が見つかりません');
      return;
    }
    
    let totalAdded = 0;
    
    for (const work of yamadaLocations) {
      console.log(`\n📽️ 処理中: ${work.workTitle}`);
      
      // 該当するエピソードを検索
      const { data: episodes } = await supabase
        .from('episodes')
        .select('id, title')
        .ilike('title', `%${work.workTitle}%`)
        .eq('celebrity_id', yamadaCelebrity.id);
      
      if (!episodes || episodes.length === 0) {
        console.log(`   ⚠️ エピソードが見つかりません: ${work.workTitle}`);
        continue;
      }
      
      const episode = episodes[0]; // 最初のマッチを使用
      console.log(`   📺 対象エピソード: ${episode.title}`);
      
      // ロケーション追加
      for (const location of work.locations) {
        const saved = await saveLocation(location, episode.id, yamadaCelebrity.id);
        if (saved) {
          console.log(`   ✅ ロケーション追加: ${location.name}`);
          totalAdded++;
        }
      }
    }
    
    console.log('\n🎉 ロケーション追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
    console.log('→ 各エピソードにロケーションバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addYamadaLocations();