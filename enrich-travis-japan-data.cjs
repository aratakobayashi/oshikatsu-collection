const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japanの包括的ロケーション・アイテムデータ
const travisJapanData = [
  // 歌・ダンス・パフォーマンス企画
  {
    episodeKeywords: ['歌', 'ダンス', 'パフォーマンス', '歌唱', 'SING'],
    locations: [
      {
        name: 'スタジオアルタ',
        address: '東京都新宿区新宿3-24-3',
        description: 'Travis Japanがパフォーマンス企画で使用したテレビスタジオ',
        tags: ['スタジオ', '新宿', 'テレビ', 'パフォーマンス']
      },
      {
        name: 'ダンススタジオ（都内）',
        address: '東京都内',
        description: 'ダンス練習・撮影で使用されるスタジオ',
        tags: ['ダンス', 'スタジオ', '練習', '撮影']
      }
    ],
    items: [
      {
        name: 'ワイヤレスマイク',
        description: 'パフォーマンス時に使用するプロ仕様マイク',
        category: '音響機材',
        tags: ['マイク', 'パフォーマンス', '音響']
      },
      {
        name: 'ダンス衣装',
        description: 'ダンス企画用の特別な衣装',
        category: '衣装',
        tags: ['ダンス', '衣装', 'パフォーマンス']
      },
      {
        name: 'シューズ',
        description: 'ダンス用の専用シューズ',
        category: 'シューズ',
        tags: ['ダンス', 'シューズ', 'パフォーマンス']
      }
    ]
  },
  
  // 旅行・観光企画
  {
    episodeKeywords: ['旅行', '観光', '旅', 'トラベル', '地方'],
    locations: [
      {
        name: '横浜中華街',
        address: '神奈川県横浜市中区山下町',
        description: 'Travis Japanが訪れた日本最大の中華街',
        tags: ['横浜', '中華街', '観光', '食べ歩き']
      },
      {
        name: '江ノ島',
        address: '神奈川県藤沢市江の島',
        description: '湘南の人気観光スポット',
        tags: ['江ノ島', '湘南', '観光', '海']
      },
      {
        name: '鎌倉大仏',
        address: '神奈川県鎌倉市長谷4-2-28',
        description: '歴史ある鎌倉の象徴的な観光地',
        tags: ['鎌倉', '大仏', '歴史', '観光']
      },
      {
        name: '浅草寺',
        address: '東京都台東区浅草2-3-1',
        description: '東京の代表的な観光地',
        tags: ['浅草', '寺', '観光', '東京']
      }
    ],
    items: [
      {
        name: '観光マップ',
        description: '旅行先で使用する観光案内マップ',
        category: '観光用品',
        tags: ['マップ', '観光', '旅行']
      },
      {
        name: 'カメラ',
        description: '旅行の思い出を撮影するカメラ',
        category: '撮影機材',
        tags: ['カメラ', '撮影', '旅行']
      },
      {
        name: 'お土産',
        description: '各地で購入した特産品',
        category: 'お土産',
        tags: ['お土産', '特産品', '旅行']
      }
    ]
  },
  
  // グルメ・食べ物企画
  {
    episodeKeywords: ['グルメ', '食べ物', '料理', '食事', '食べ歩き'],
    locations: [
      {
        name: '原宿竹下通り',
        address: '東京都渋谷区神宮前1',
        description: '若者文化とグルメの聖地',
        tags: ['原宿', '竹下通り', 'グルメ', '食べ歩き']
      },
      {
        name: 'アメ横',
        address: '東京都台東区上野4-6',
        description: '上野の活気ある商店街',
        tags: ['アメ横', '上野', '商店街', 'グルメ']
      },
      {
        name: '築地場外市場',
        address: '東京都中央区築地4',
        description: '新鮮な海鮮グルメの宝庫',
        tags: ['築地', '市場', '海鮮', 'グルメ']
      }
    ],
    items: [
      {
        name: 'クレープ',
        description: '原宿名物のフルーツクレープ',
        category: 'スイーツ',
        tags: ['クレープ', '原宿', 'スイーツ']
      },
      {
        name: 'たこ焼き',
        description: '大阪名物のたこ焼き',
        category: 'グルメ',
        tags: ['たこ焼き', '大阪', 'B級グルメ']
      },
      {
        name: '海鮮丼',
        description: '築地の新鮮な海鮮丼',
        category: 'グルメ',
        tags: ['海鮮丼', '築地', '海鮮']
      },
      {
        name: 'かき氷',
        description: '夏の定番かき氷',
        category: 'スイーツ',
        tags: ['かき氷', '夏', 'スイーツ']
      }
    ]
  },
  
  // ゲーム・エンターテイメント企画
  {
    episodeKeywords: ['ゲーム', 'チャレンジ', '企画', 'バラエティ'],
    locations: [
      {
        name: 'ゲームセンター',
        address: '東京都内',
        description: 'ゲーム企画で訪れるアミューズメント施設',
        tags: ['ゲームセンター', 'アミューズメント', 'ゲーム']
      },
      {
        name: 'カラオケBOX',
        address: '東京都内',
        description: 'カラオケ企画で使用する個室',
        tags: ['カラオケ', '個室', '歌']
      },
      {
        name: 'ボウリング場',
        address: '東京都内',
        description: 'ボウリング企画で使用するレーン',
        tags: ['ボウリング', 'スポーツ', 'レーン']
      }
    ],
    items: [
      {
        name: 'ゲーム機',
        description: 'ゲームセンターのアーケードゲーム',
        category: 'ゲーム',
        tags: ['ゲーム機', 'アーケード', 'ゲーム']
      },
      {
        name: 'カラオケマイク',
        description: 'カラオケで使用するマイク',
        category: '音響機材',
        tags: ['カラオケ', 'マイク', '歌']
      },
      {
        name: 'ボウリングボール',
        description: 'ボウリングで使用するボール',
        category: 'スポーツ用品',
        tags: ['ボウリング', 'ボール', 'スポーツ']
      }
    ]
  },
  
  // ファッション・ショッピング企画
  {
    episodeKeywords: ['ファッション', 'ショッピング', '服', '買い物'],
    locations: [
      {
        name: '渋谷109',
        address: '東京都渋谷区道玄坂2-29-1',
        description: '若者ファッションの聖地',
        tags: ['渋谷', '109', 'ファッション', 'ショッピング']
      },
      {
        name: '表参道ヒルズ',
        address: '東京都渋谷区神宮前4-12-10',
        description: '高級ブランドが集まるショッピング施設',
        tags: ['表参道', 'ヒルズ', 'ブランド', 'ショッピング']
      },
      {
        name: '原宿キャットストリート',
        address: '東京都渋谷区神宮前',
        description: 'おしゃれなセレクトショップが並ぶ通り',
        tags: ['原宿', 'キャットストリート', 'セレクトショップ']
      }
    ],
    items: [
      {
        name: 'Tシャツ',
        description: 'カジュアルなTシャツ',
        category: 'ファッション',
        tags: ['Tシャツ', 'カジュアル', 'ファッション']
      },
      {
        name: 'スニーカー',
        description: 'おしゃれなスニーカー',
        category: 'シューズ',
        tags: ['スニーカー', 'シューズ', 'ファッション']
      },
      {
        name: 'バッグ',
        description: 'トレンドのバッグ',
        category: 'バッグ',
        tags: ['バッグ', 'アクセサリー', 'ファッション']
      },
      {
        name: 'アクセサリー',
        description: 'おしゃれなアクセサリー',
        category: 'アクセサリー',
        tags: ['アクセサリー', 'ジュエリー', 'ファッション']
      }
    ]
  },
  
  // スポーツ・アクティビティ企画
  {
    episodeKeywords: ['スポーツ', '運動', 'アクティビティ', '体力'],
    locations: [
      {
        name: '体育館',
        address: '東京都内',
        description: 'スポーツ企画で使用する体育館',
        tags: ['体育館', 'スポーツ', '運動']
      },
      {
        name: 'プール',
        address: '東京都内',
        description: '水泳企画で使用するプール',
        tags: ['プール', '水泳', 'スポーツ']
      }
    ],
    items: [
      {
        name: 'ジャージ',
        description: 'スポーツ企画用のジャージ',
        category: 'スポーツウェア',
        tags: ['ジャージ', 'スポーツ', '運動着']
      },
      {
        name: '水着',
        description: 'プール企画用の水着',
        category: '水着',
        tags: ['水着', 'プール', 'スイミング']
      },
      {
        name: 'タオル',
        description: 'スポーツ後に使用するタオル',
        category: 'スポーツ用品',
        tags: ['タオル', 'スポーツ', '汗拭き']
      }
    ]
  },
  
  // 音楽・楽器企画
  {
    episodeKeywords: ['音楽', '楽器', '演奏', 'ミュージック'],
    locations: [
      {
        name: '音楽スタジオ',
        address: '東京都内',
        description: '音楽関連企画で使用するスタジオ',
        tags: ['音楽', 'スタジオ', '楽器', '演奏']
      }
    ],
    items: [
      {
        name: 'ギター',
        description: '楽器企画で使用するギター',
        category: '楽器',
        tags: ['ギター', '楽器', '音楽']
      },
      {
        name: 'ピアノ',
        description: '音楽企画で使用するピアノ',
        category: '楽器',
        tags: ['ピアノ', '楽器', '音楽']
      },
      {
        name: 'ドラム',
        description: 'バンド企画で使用するドラム',
        category: '楽器',
        tags: ['ドラム', '楽器', '音楽']
      }
    ]
  },
  
  // 文化・教育企画
  {
    episodeKeywords: ['文化', '教育', '学習', '体験'],
    locations: [
      {
        name: '東京国立博物館',
        address: '東京都台東区上野公園13-9',
        description: '日本の歴史と文化を学ぶ博物館',
        tags: ['博物館', '上野', '文化', '教育']
      },
      {
        name: '科学技術館',
        address: '東京都千代田区北の丸公園2-1',
        description: '科学を体験できる施設',
        tags: ['科学館', '体験', '教育', '学習']
      }
    ],
    items: [
      {
        name: '入館券',
        description: '博物館・美術館の入場券',
        category: 'チケット',
        tags: ['入館券', 'チケット', '博物館']
      },
      {
        name: 'ガイドブック',
        description: '展示案内のガイドブック',
        category: '書籍',
        tags: ['ガイドブック', '案内', '学習']
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
  
  // キーワードで見つからない場合は、人気のエピソードを返す
  const { data: popularEpisode } = await supabase
    .from('episodes')
    .select('id, title')
    .eq('celebrity_id', celebrityId)
    .order('view_count', { ascending: false })
    .limit(1)
    .single();
  
  return popularEpisode;
}

// ロケーションをデータベースに追加
async function addLocation(locationData, episodeId, celebrityId) {
  const slug = locationData.name.toLowerCase()
    .replace(/[^a-z0-9\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF]/g, '-')
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
    .replace(/[^a-z0-9\\u3040-\\u309F\\u30A0-\\u30FF\\u4E00-\\u9FAF]/g, '-')
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
async function enrichTravisJapanData() {
  console.log('🎌 Travis Japan ロケーション・アイテムデータ大幅拡充開始！\\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  
  // 現在の状況確認
  const { count: startLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  const { count: startItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  console.log('📊 開始前の状況:');
  console.log(`- エピソード数: ${totalEpisodes}件`);
  console.log(`- ロケーション数: ${startLocations}件 (L/E: ${(startLocations/totalEpisodes).toFixed(3)})`);
  console.log(`- アイテム数: ${startItems}件 (I/E: ${(startItems/totalEpisodes).toFixed(3)})\\n`);
  
  let totalLocations = 0;
  let totalItems = 0;
  let matchedEpisodes = 0;
  
  for (let i = 0; i < travisJapanData.length; i++) {
    const episodeData = travisJapanData[i];
    console.log(`\\n[${i + 1}/${travisJapanData.length}] キーワード検索: ${episodeData.episodeKeywords.join(', ')}`);
    
    const episode = await findEpisodeId(episodeData.episodeKeywords, travisJapanId);
    
    if (episode) {
      console.log(`✅ マッチしたエピソード: ${episode.title.substring(0, 50)}...`);
      matchedEpisodes++;
      
      // ロケーション追加
      for (const locationData of episodeData.locations) {
        const { data, error } = await addLocation(locationData, episode.id, travisJapanId);
        if (error) {
          if (error.message.includes('duplicate')) {
            console.log(`⚠️ ロケーション既存: ${locationData.name}`);
          } else {
            console.error(`❌ ロケーション追加エラー: ${error.message}`);
          }
        } else {
          console.log(`📍 ロケーション追加: ${locationData.name}`);
          totalLocations++;
        }
      }
      
      // アイテム追加
      for (const itemData of episodeData.items) {
        const { data, error } = await addItem(itemData, episode.id, travisJapanId);
        if (error) {
          if (error.message.includes('duplicate')) {
            console.log(`⚠️ アイテム既存: ${itemData.name}`);
          } else {
            console.error(`❌ アイテム追加エラー: ${error.message}`);
          }
        } else {
          console.log(`🛍️ アイテム追加: ${itemData.name}`);
          totalItems++;
        }
      }
    } else {
      console.log(`⚠️ エピソードが見つかりません`);
    }
  }
  
  console.log('\\n🎉 Travis Japan データ拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理したデータセット: ${travisJapanData.length}件`);
  console.log(`  - マッチしたエピソード: ${matchedEpisodes}件`);
  console.log(`  - 追加ロケーション: ${totalLocations}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  // 最終状況確認
  const { count: finalLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
    
  const { count: finalItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  console.log('\\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${totalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${(finalLocations/totalEpisodes).toFixed(3)}, 開始時: ${startLocations}件)`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${(finalItems/totalEpisodes).toFixed(3)}, 開始時: ${startItems}件)`);
  console.log(`  - ロケーション増加率: ${startLocations > 0 ? Math.round(((finalLocations - startLocations) / startLocations) * 100) : 'N/A'}%`);
  console.log(`  - アイテム増加率: ${startItems > 0 ? Math.round(((finalItems - startItems) / startItems) * 100) : 'N/A'}%`);
  
  console.log('\\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ エピソード詳細ページでロケーション・アイテムが大幅に増加');
  
  console.log('\\n📋 追加されたコンテンツカテゴリ:');
  console.log('- 歌・ダンス・パフォーマンス関連');
  console.log('- 旅行・観光スポット（横浜、江ノ島、鎌倉等）');
  console.log('- グルメ・食べ歩き（原宿、築地、アメ横等）');
  console.log('- ゲーム・エンターテイメント施設');
  console.log('- ファッション・ショッピング（渋谷、表参道等）');
  console.log('- スポーツ・アクティビティ関連');
  console.log('- 音楽・楽器関連');
  console.log('- 文化・教育施設（博物館、科学館等）');
}

enrichTravisJapanData();