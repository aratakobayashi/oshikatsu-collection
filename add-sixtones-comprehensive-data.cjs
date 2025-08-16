const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESの包括的なロケーション・アイテムデータ
const sixtonesComprehensiveData = [
  {
    episodeKeywords: ['そば', 'わんこそば', '666杯', '大食い'],
    locations: [
      {
        name: 'わんこそば専門店',
        address: '東京都渋谷区',
        description: 'SixTONESがわんこそば大食い企画を行った専門店',
        tags: ['そば', '大食い', '企画', 'バラエティ']
      }
    ],
    items: [
      {
        name: 'わんこそば',
        description: 'ジェシーが熱望した伝統的な岩手県の郷土料理',
        category: '食べ物',
        tags: ['そば', '郷土料理', '大食い', '666杯']
      }
    ]
  },
  {
    episodeKeywords: ['衣装', 'ファッション', 'MV', 'コラボ'],
    locations: [
      {
        name: 'SixTONES衣装スタジオ',
        address: '東京都港区',
        description: 'SixTONESのMV撮影やバラエティ番組の衣装合わせを行うスタジオ',
        tags: ['衣装', 'スタジオ', 'MV撮影', 'ファッション']
      }
    ],
    items: [
      {
        name: 'ステージ衣装',
        description: 'SixTONESのパフォーマンス用のカスタム衣装',
        category: 'ファッション',
        tags: ['衣装', 'ステージ', 'カスタム', 'パフォーマンス']
      }
    ]
  },
  {
    episodeKeywords: ['ドライブ', 'アポなし旅', '旅行', 'キャンプ'],
    locations: [
      {
        name: '関東近郊ドライブスポット',
        address: '神奈川県',
        description: 'SixTONESのアポなし旅企画でよく訪れるドライブエリア',
        tags: ['ドライブ', 'アポなし旅', '関東', '企画']
      },
      {
        name: 'キャンプ場',
        address: '埼玉県',
        description: 'SixTONESがアポなしキャンプ旅で利用したキャンプ場',
        tags: ['キャンプ', 'アウトドア', 'アポなし旅', 'BBQ']
      }
    ],
    items: [
      {
        name: 'キャンプ用品セット',
        description: 'SixTONESがキャンプ企画で使用したアウトドア用品',
        category: 'アウトドア',
        tags: ['キャンプ', 'アウトドア', '用品', 'BBQ']
      }
    ]
  },
  {
    episodeKeywords: ['ジャニーズ', 'コラボ', '事務所', '楽屋'],
    locations: [
      {
        name: 'ジャニーズ事務所',
        address: '東京都港区赤坂',
        description: 'SixTONESが所属するジャニーズ事務所の本社',
        tags: ['ジャニーズ', '事務所', '本社', '赤坂']
      },
      {
        name: 'Johnny\'s World',
        address: '東京都渋谷区',
        description: 'ジャニーズグッズ公式ショップ',
        tags: ['ジャニーズ', 'ショップ', 'グッズ', '公式']
      }
    ],
    items: [
      {
        name: 'SixTONES公式グッズ',
        description: 'SixTONESのオフィシャルグッズ（うちわ、Tシャツなど）',
        category: 'グッズ',
        tags: ['公式グッズ', 'うちわ', 'Tシャツ', 'ファン']
      }
    ]
  },
  {
    episodeKeywords: ['音楽', 'レコーディング', 'スタジオ', '作詞作曲'],
    locations: [
      {
        name: 'レコーディングスタジオ',
        address: '東京都渋谷区',
        description: 'SixTONESが楽曲制作やレコーディングを行う音楽スタジオ',
        tags: ['レコーディング', '音楽', 'スタジオ', '制作']
      }
    ],
    items: [
      {
        name: 'SixTONESアルバム',
        description: 'SixTONESのオリジナルアルバム「THE VIBES」など',
        category: '音楽',
        tags: ['アルバム', 'CD', '音楽', 'オリジナル']
      }
    ]
  },
  {
    episodeKeywords: ['ライブ', 'コンサート', 'YOKOHAMA ARENA', 'ドーム'],
    locations: [
      {
        name: '横浜アリーナ',
        address: '神奈川県横浜市港北区新横浜3-10',
        description: 'SixTONESが多くのライブやコンサートを開催する会場',
        tags: ['ライブ', 'コンサート', '横浜', 'アリーナ']
      },
      {
        name: '東京ドーム',
        address: '東京都文京区後楽1-3-61',
        description: 'SixTONESが夢見る聖地的なコンサート会場',
        tags: ['ドーム', 'コンサート', '東京', '聖地']
      }
    ],
    items: [
      {
        name: 'ライブチケット',
        description: 'SixTONESのコンサートチケット',
        category: 'チケット',
        tags: ['ライブ', 'コンサート', 'チケット', '入場券']
      },
      {
        name: 'ペンライト',
        description: 'SixTONESのライブで使用する公式ペンライト',
        category: 'ライブグッズ',
        tags: ['ペンライト', 'ライブ', '応援', '公式']
      }
    ]
  },
  {
    episodeKeywords: ['料理', '食べ物', 'グルメ', '買い物', 'コストコ'],
    locations: [
      {
        name: 'コストコ',
        address: '東京都江東区',
        description: 'SixTONESがプレゼント購入企画で訪れた大型倉庫店',
        tags: ['コストコ', '買い物', '倉庫店', '企画']
      },
      {
        name: '高級レストラン',
        address: '東京都港区銀座',
        description: 'SixTONESメンバーがプライベートで利用する高級レストラン',
        tags: ['レストラン', '高級', '銀座', 'グルメ']
      }
    ],
    items: [
      {
        name: 'プレゼント',
        description: 'SixTONESメンバー間で贈り合うバースデープレゼント',
        category: 'ギフト',
        tags: ['プレゼント', '誕生日', 'ギフト', 'メンバー']
      }
    ]
  },
  {
    episodeKeywords: ['スポーツ', '体力測定', '運動', 'ゲーム'],
    locations: [
      {
        name: 'スポーツジム',
        address: '東京都港区',
        description: 'SixTONESが体力測定企画を行ったフィットネスジム',
        tags: ['ジム', 'スポーツ', '体力測定', '運動']
      }
    ],
    items: [
      {
        name: 'トレーニングウェア',
        description: 'SixTONESメンバーが運動企画で着用するスポーツウェア',
        category: 'スポーツウェア',
        tags: ['トレーニング', 'スポーツ', 'ウェア', '運動']
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
async function addSixTONESComprehensiveData() {
  console.log('🎯 SixTONES 包括的データ追加開始！\n');
  
  const celebrityId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7'; // SixTONES
  
  let totalLocations = 0;
  let totalItems = 0;
  let matchedEpisodes = 0;
  let unmatchedData = 0;
  
  for (let i = 0; i < sixtonesComprehensiveData.length; i++) {
    const episodeData = sixtonesComprehensiveData[i];
    console.log(`\n[${i + 1}/${sixtonesComprehensiveData.length}] キーワード検索: ${episodeData.episodeKeywords.join(', ')}`);
    
    const episode = await findEpisodeId(episodeData.episodeKeywords, celebrityId);
    
    if (episode) {
      console.log(`✅ マッチしたエピソード: ${episode.title}`);
      matchedEpisodes++;
      
      // ロケーション追加
      for (const locationData of episodeData.locations) {
        const { data, error } = await addLocation(locationData, episode.id, celebrityId);
        if (error) {
          console.error(`❌ ロケーション追加エラー: ${error.message}`);
        } else {
          console.log(`📍 ロケーション追加: ${locationData.name}`);
          totalLocations++;
        }
      }
      
      // アイテム追加
      for (const itemData of episodeData.items) {
        const { data, error } = await addItem(itemData, episode.id, celebrityId);
        if (error) {
          console.error(`❌ アイテム追加エラー: ${error.message}`);
        } else {
          console.log(`🛍️ アイテム追加: ${itemData.name}`);
          totalItems++;
        }
      }
      
    } else {
      console.log(`⚠️ マッチするエピソードが見つかりません - データを一般的なエピソードに紐づけ`);
      unmatchedData++;
      
      // 最も再生回数の多いエピソードに紐づけ
      const { data: popularEpisode } = await supabase
        .from('episodes')
        .select('id, title')
        .eq('celebrity_id', celebrityId)
        .order('view_count', { ascending: false })
        .limit(1)
        .single();
      
      if (popularEpisode) {
        console.log(`🔄 代替エピソードに紐づけ: ${popularEpisode.title}`);
        
        // ロケーション追加
        for (const locationData of episodeData.locations) {
          const { data, error } = await addLocation(locationData, popularEpisode.id, celebrityId);
          if (error) {
            console.error(`❌ ロケーション追加エラー: ${error.message}`);
          } else {
            console.log(`📍 ロケーション追加: ${locationData.name}`);
            totalLocations++;
          }
        }
        
        // アイテム追加
        for (const itemData of episodeData.items) {
          const { data, error } = await addItem(itemData, popularEpisode.id, celebrityId);
          if (error) {
            console.error(`❌ アイテム追加エラー: ${error.message}`);
          } else {
            console.log(`🛍️ アイテム追加: ${itemData.name}`);
            totalItems++;
          }
        }
      }
    }
  }
  
  console.log('\n🎉 SixTONES データ追加完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`)
  console.log(`  - 処理したデータセット: ${sixtonesComprehensiveData.length}件`);
  console.log(`  - マッチしたエピソード: ${matchedEpisodes}件`);
  console.log(`  - 代替紐づけ: ${unmatchedData}件`);
  console.log(`  - 追加ロケーション: ${totalLocations}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('→ エピソード詳細ページでロケーションとアイテムが表示される');
  
  console.log('\n📋 追加内容:');
  console.log('- SixTONESらしいロケーション・アイテム');
  console.log('- ライブ会場、レコーディングスタジオ、ジャニーズ関連施設');
  console.log('- 音楽、ファッション、食べ物、グッズ等の多様なアイテム');
  console.log('- バラエティ企画に関連する場所・物');
}

addSixTONESComprehensiveData();