const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 山田涼介の主要作品のアイテム情報
const yamadaItems = [
  // セミオトコ
  {
    workTitle: 'セミオトコ',
    items: [
      {
        name: 'セミオ（劇中ドリンク）',
        description: 'セミオトコ劇中で登場するドリンク。蓮月カフェで実際に注文可能',
        price: '500円',
        purchase_url: null,
        brand: '蓮月カフェ',
        category: 'food_drink',
        tags: ['drama_item', 'cafe_menu', 'fan_pilgrimage']
      },
      {
        name: 'セミの標本',
        description: 'セミオトコ劇中で重要な意味を持つセミの標本',
        price: null,
        purchase_url: null,
        brand: null,
        category: 'props',
        tags: ['drama_props', 'symbolic_item']
      }
    ]
  },
  // もみ消して冬
  {
    workTitle: 'もみ消して冬',
    items: [
      {
        name: '警察手帳',
        description: '北沢秀作（山田涼介）が使用する警察官の身分証明書',
        price: null,
        purchase_url: null,
        brand: '警視庁',
        category: 'props',
        tags: ['drama_props', 'police_item']
      },
      {
        name: 'スーツ（警察官制服）',
        description: '山田涼介演じる警察官が着用するビジネススーツ',
        price: null,
        purchase_url: null,
        brand: null,
        category: 'costume',
        tags: ['drama_costume', 'business_suit']
      }
    ]
  },
  // ナミヤ雑貨店の奇蹟
  {
    workTitle: 'ナミヤ雑貨店の奇蹟',
    items: [
      {
        name: '雑貨店の手紙',
        description: 'ナミヤ雑貨店で時を超えてやり取りされる重要な手紙',
        price: null,
        purchase_url: null,
        brand: null,
        category: 'props',
        tags: ['drama_props', 'key_item', 'letter']
      },
      {
        name: '昭和レトロ商品',
        description: '昭和の町で販売されている当時の商品（駄菓子、玩具など）',
        price: '100円〜',
        purchase_url: 'https://www.showa-no-machi.com/',
        brand: '豊後高田昭和の町',
        category: 'retro_goods',
        tags: ['retro_item', 'souvenir', 'filming_location_goods']
      }
    ]
  },
  // 金田一少年の事件簿
  {
    workTitle: '金田一少年の事件簿',
    items: [
      {
        name: '金田一少年の学生証',
        description: '金田一一（山田涼介）の不動高校学生証',
        price: null,
        purchase_url: null,
        brand: '不動高校',
        category: 'props',
        tags: ['drama_props', 'school_item']
      },
      {
        name: '推理ノート',
        description: '金田一少年が事件解決に使用する推理ノート',
        price: null,
        purchase_url: null,
        brand: null,
        category: 'props',
        tags: ['drama_props', 'detective_item']
      }
    ]
  },
  // 暗殺教室
  {
    workTitle: '暗殺教室',
    items: [
      {
        name: 'BB弾（対殺せんせー用）',
        description: '暗殺教室で生徒が使用する特殊なBB弾',
        price: null,
        purchase_url: null,
        brand: null,
        category: 'props',
        tags: ['movie_props', 'special_weapon']
      },
      {
        name: '3年E組制服',
        description: '椚ヶ丘中学校3年E組の制服',
        price: null,
        purchase_url: null,
        brand: '椚ヶ丘中学校',
        category: 'costume',
        tags: ['movie_costume', 'school_uniform']
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
    .replace(/^-+|-+$/g, '') || `item-${Date.now()}`;
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
    price: itemData.price,
    image_url: null,
    purchase_url: itemData.purchase_url,
    brand: itemData.brand,
    category: itemData.category,
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
    console.error(`❌ 保存エラー: ${error.message}`);
    return false;
  }
  
  return true;
}

// メイン処理
async function addYamadaItems() {
  console.log('🛍️ 山田涼介作品にアイテム情報を追加開始！\n');
  
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
    
    for (const work of yamadaItems) {
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
      
      // アイテム追加
      for (const item of work.items) {
        const saved = await saveItem(item, episode.id, yamadaCelebrity.id);
        if (saved) {
          console.log(`   ✅ アイテム追加: ${item.name}`);
          totalAdded++;
        }
      }
    }
    
    console.log('\n🎉 アイテム追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n🌐 確認方法:');
    console.log('https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
    console.log('→ 各エピソードにアイテムバッジが表示される');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addYamadaItems();