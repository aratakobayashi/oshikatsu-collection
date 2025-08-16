const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESのロケーション・アイテムデータ
const sixtonesData = [
  {
    episodeKeywords: ['Tower Records', 'CDショップ', 'デビューシングル'],
    locations: [
      {
        name: 'Tower Records Shibuya',
        address: '東京都渋谷区神南1-22-14',
        description: 'SixTONESがデビューシングルを初めて購入した記念すべき場所',
        category: '店舗',
        prefecture: '東京都',
        tags: ['CDショップ', '聖地', 'デビュー記念']
      }
    ],
    items: [
      {
        name: 'SixTONES デビューシングル「Imitation Rain / D.D.」',
        description: 'メンバーが自分たちで購入したデビューシングル',
        category: 'CD・音楽',
        tags: ['デビューシングル', 'CD', '記念品']
      }
    ]
  },
  {
    episodeKeywords: ['石巡り', '両国', '江戸'],
    locations: [
      {
        name: '回向院',
        address: '東京都墨田区両国2-8-10',
        description: '「石巡りツアー」で訪れた両国の寺院。ねずみ小僧の墓で有名',
        category: '神社・寺院',
        prefecture: '東京都',
        tags: ['寺院', '両国', '石巡り', 'ねずみ小僧']
      }
    ],
    items: [
      {
        name: 'ねずみ小僧の墓石',
        description: '石を削ってお守りにすると金運が上がると言われる有名な墓石',
        category: 'パワースポット',
        tags: ['金運', 'お守り', '石']
      }
    ]
  },
  {
    episodeKeywords: ['原宿', 'Cat Street', 'たこ焼き'],
    locations: [
      {
        name: 'Cat Street（キャットストリート）',
        address: '東京都渋谷区神宮前',
        description: '原宿散歩動画の出発点となった通り。メンバーがたこ焼きを食べながら歩いた',
        category: '街・通り',
        prefecture: '東京都',
        tags: ['原宿', '散歩', 'ストリート']
      }
    ],
    items: [
      {
        name: 'たこ焼き',
        description: 'メンバーが原宿散歩中に食べていたたこ焼き',
        category: '食べ物',
        tags: ['原宿グルメ', 'B級グルメ', '散歩おやつ']
      }
    ]
  },
  {
    episodeKeywords: ['豊川稲荷', '赤坂', 'ドライブ'],
    locations: [
      {
        name: '豊川稲荷東京別院',
        address: '東京都港区元赤坂1-4-7',
        description: 'Tokyo Drive Vol.2で言及された、ジャニーズタレントがよく願掛けに行く場所',
        category: '神社・寺院',
        prefecture: '東京都',
        tags: ['稲荷', '願掛け', '赤坂', 'ジャニーズ聖地']
      }
    ],
    items: [
      {
        name: '豊川稲荷のお守り',
        description: '芸能関係者に人気の豊川稲荷のお守り',
        category: 'お守り・縁起物',
        tags: ['お守り', '願掛け', '芸能']
      }
    ]
  }
];

// Travis Japanのロケーション・アイテムデータ
const travisJapanData = [
  {
    episodeKeywords: ['愛宕神社', '初ドライブ', '開運スポット'],
    locations: [
      {
        name: '愛宕神社',
        address: '東京都港区愛宕1-5-3',
        description: '初ドライブ動画で訪れた開運スポット。出世の石段で有名',
        category: '神社・寺院',
        prefecture: '東京都',
        tags: ['神社', '出世', '石段', '開運', 'ドライブ']
      }
    ],
    items: [
      {
        name: '出世の石段',
        description: '愛宕神社の急勾配の階段。登ると出世運が上がると言われる',
        category: 'パワースポット',
        tags: ['出世運', '階段', '開運']
      }
    ]
  },
  {
    episodeKeywords: ['L\'Occitane', 'ハーブ', 'ヴァーベナ', '渋谷'],
    locations: [
      {
        name: 'L\'Occitane Cafe Shibuya',
        address: '東京都渋谷区道玄坂2-3-1',
        description: 'ヴァーベナについて語った動画で訪れたカフェ',
        category: 'カフェ・レストラン',
        prefecture: '東京都',
        tags: ['カフェ', '渋谷', 'ハーブ', 'ヴァーベナ']
      }
    ],
    items: [
      {
        name: 'ヴァーベナのハーブティー',
        description: '恋を呼ぶハーブとして紹介されたヴァーベナのお茶',
        category: '食べ物・飲み物',
        tags: ['ハーブティー', 'ヴァーベナ', '恋愛運']
      }
    ]
  },
  {
    episodeKeywords: ['代官山', 'Clover\'s', 'パンケーキ', '中村海人'],
    locations: [
      {
        name: 'Clover\'s Pancake Cafe',
        address: '東京都渋谷区恵比寿西2-20-19',
        description: '中村海人が訪れたパンケーキカフェ。店内にTravis Japanの写真が飾られている',
        category: 'カフェ・レストラン',
        prefecture: '東京都',
        tags: ['パンケーキ', '代官山', 'ファンカフェ', '中村海人']
      }
    ],
    items: [
      {
        name: 'パンケーキ',
        description: 'Clover\'sの人気パンケーキ',
        category: '食べ物',
        tags: ['パンケーキ', 'スイーツ', 'カフェメニュー']
      }
    ]
  },
  {
    episodeKeywords: ['もんじゃ焼き', '鉄板マン', '墨田区'],
    locations: [
      {
        name: 'one big family 鉄板マン',
        address: '東京都墨田区',
        description: 'Travis Japanが訪れたもんじゃ焼き店',
        category: 'カフェ・レストラン',
        prefecture: '東京都',
        tags: ['もんじゃ焼き', '鉄板焼き', '墨田区']
      }
    ],
    items: [
      {
        name: 'もんじゃ焼き',
        description: 'メンバーが食べたもんじゃ焼き',
        category: '食べ物',
        tags: ['もんじゃ焼き', '東京グルメ', 'B級グルメ']
      }
    ]
  },
  {
    episodeKeywords: ['トラジャ壁', '渋谷', '八幡町', '雑誌撮影'],
    locations: [
      {
        name: 'Travis Japan Wall（トラジャ壁）',
        address: '東京都渋谷区八幡町14-10',
        description: '雑誌撮影やYouTube動画でよく使われる有名な壁',
        category: '撮影スポット',
        prefecture: '東京都',
        tags: ['撮影スポット', '壁', '雑誌', 'YouTube', '聖地']
      }
    ],
    items: [
      {
        name: '撮影用の壁',
        description: 'Travis Japanの撮影でよく使われる特徴的な壁',
        category: '撮影スポット',
        tags: ['撮影', '背景', '壁']
      }
    ]
  }
];

// エピソードを検索してIDを取得
async function findEpisodeId(keywords, celebrityId) {
  for (const keyword of keywords) {
    const { data, error } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrityId)
      .ilike('title', `%${keyword}%`)
      .limit(1);
    
    if (!error && data && data.length > 0) {
      return data[0];
    }
  }
  return null;
}

// ロケーションをデータベースに追加
async function addLocation(locationData, episodeId, celebrityId) {
  const slug = locationData.name.toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const location = {
    id: crypto.randomUUID(),
    name: locationData.name,
    slug: slug,
    address: locationData.address,
    description: locationData.description,
    episode_id: episodeId,
    celebrity_id: celebrityId,
    tags: locationData.tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select();
  
  return { data, error };
}

// アイテムをデータベースに追加
async function addItem(itemData, episodeId, celebrityId) {
  const slug = itemData.name.toLowerCase()
    .replace(/[^a-z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const item = {
    id: crypto.randomUUID(),
    name: itemData.name,
    slug: slug,
    description: itemData.description,
    category: itemData.category,
    episode_id: episodeId,
    celebrity_id: celebrityId,
    tags: itemData.tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select();
  
  return { data, error };
}

// メイン処理
async function addLocationsAndItems() {
  console.log('🎯 SixTONES & Travis Japan エピソードにロケーション・アイテム追加開始！\n');
  
  const celebrities = [
    {
      name: 'SixTONES',
      id: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7',
      data: sixtonesData
    },
    {
      name: 'Travis Japan',
      id: '46ccba0d-742f-4152-9d87-f10cefadbb6d',
      data: travisJapanData
    }
  ];
  
  for (const celebrity of celebrities) {
    console.log(`🎭 ${celebrity.name} の処理開始`);
    console.log('='.repeat(50));
    
    let totalLocations = 0;
    let totalItems = 0;
    let matchedEpisodes = 0;
    
    for (const episodeData of celebrity.data) {
      console.log(`🔍 キーワード検索: ${episodeData.episodeKeywords.join(', ')}`);
      
      const episode = await findEpisodeId(episodeData.episodeKeywords, celebrity.id);
      
      if (episode) {
        console.log(`✅ マッチしたエピソード: ${episode.title}`);
        matchedEpisodes++;
        
        // ロケーション追加
        for (const locationData of episodeData.locations) {
          const { data, error } = await addLocation(locationData, episode.id, celebrity.id);
          if (error) {
            console.error(`❌ ロケーション追加エラー: ${error.message}`);
          } else {
            console.log(`📍 ロケーション追加: ${locationData.name}`);
            totalLocations++;
          }
        }
        
        // アイテム追加
        for (const itemData of episodeData.items) {
          const { data, error } = await addItem(itemData, episode.id, celebrity.id);
          if (error) {
            console.error(`❌ アイテム追加エラー: ${error.message}`);
          } else {
            console.log(`🛍️ アイテム追加: ${itemData.name}`);
            totalItems++;
          }
        }
        
      } else {
        console.log(`⚠️ マッチするエピソードが見つかりません`);
      }
      
      console.log('');
    }
    
    console.log(`🎉 ${celebrity.name} 処理完了！`);
    console.log(`📊 結果:`);
    console.log(`  - マッチしたエピソード: ${matchedEpisodes}件`);
    console.log(`  - 追加ロケーション: ${totalLocations}件`);
    console.log(`  - 追加アイテム: ${totalItems}件\n`);
  }
  
  console.log('🎊 全処理完了！');
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ エピソード詳細ページでロケーションとアイテムが表示される');
  
  console.log('\n📋 追加内容:');
  console.log('- ファンサイトから収集した実際のロケーション情報');
  console.log('- 各エピソードに関連するアイテム情報');
  console.log('- 詳細な住所、説明、タグ情報');
  console.log('- よにのちゃんねると同じデータ構造で統一');
}

addLocationsAndItems();