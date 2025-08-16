const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 優先度の高いSixTONESエピソードのロケーション・アイテムデータ
const priorityEpisodeData = [
  // 最強トースト選手権
  {
    episodeId: 'XWTSbJZHJnY',
    episodeTitle: '最強トースト選手権',
    locations: [
      {
        name: 'SixTONESキッチンスタジオ',
        address: '東京都内',
        description: '最強トースト選手権が行われたキッチンスタジオ',
        tags: ['スタジオ', 'キッチン', 'トースト', '企画', 'SixTONES']
      }
    ],
    items: [
      {
        name: '食パン各種',
        description: 'トースト選手権で使用された様々な食パン',
        category: '食材',
        tags: ['食パン', 'トースト', 'パン', '食材']
      },
      {
        name: 'バター',
        description: 'トーストに塗る定番のバター',
        category: '食材',
        tags: ['バター', 'トースト', '調味料', '食材']
      },
      {
        name: 'ジャム各種',
        description: 'いちごジャム、ブルーベリージャムなど',
        category: '食材',
        tags: ['ジャム', 'トースト', '調味料', '甘味']
      },
      {
        name: 'ハチミツ',
        description: 'トーストの甘味付けに使用',
        category: '食材',
        tags: ['ハチミツ', 'トースト', '調味料', '甘味']
      },
      {
        name: 'アボカド',
        description: 'アボカドトースト用の食材',
        category: '食材',
        tags: ['アボカド', 'トースト', '野菜', '食材']
      },
      {
        name: 'チーズ',
        description: 'チーズトースト用のチーズ',
        category: '食材',
        tags: ['チーズ', 'トースト', '乳製品', '食材']
      },
      {
        name: 'トースター',
        description: 'パンを焼くためのトースター',
        category: '調理器具',
        tags: ['トースター', '調理器具', 'キッチン', '家電']
      },
      {
        name: 'バターナイフ',
        description: 'バターやジャムを塗るためのナイフ',
        category: '調理器具',
        tags: ['ナイフ', '調理器具', 'キッチン', 'バター']
      },
      {
        name: 'まな板',
        description: '食材カット用のまな板',
        category: '調理器具',
        tags: ['まな板', '調理器具', 'キッチン', '下準備']
      }
    ]
  },
  
  // ポケモンセンターできょもの誕プレ選び
  {
    episodeId: 'uEgar-cPtkQ',
    episodeTitle: 'ポケモンセンターできょもの誕プレ選び',
    locations: [
      {
        name: 'ポケモンセンタートウキョー',
        address: '東京都中央区日本橋2-11-2 日本橋髙島屋S.C.東館5階',
        description: 'SixTONESが京本大我の誕生日プレゼントを選んだポケモン公式ショップ',
        tags: ['ポケモンセンター', '日本橋', 'ショッピング', '誕生日', 'ギフト']
      },
      {
        name: '日本橋髙島屋S.C.',
        address: '東京都中央区日本橋2-4-1',
        description: 'ポケモンセンターが入っている商業施設',
        tags: ['高島屋', '日本橋', 'デパート', 'ショッピング']
      }
    ],
    items: [
      {
        name: 'ポケモンぬいぐるみ',
        description: '京本大我の誕生日プレゼント候補のポケモンぬいぐるみ',
        category: 'ぬいぐるみ・玩具',
        tags: ['ポケモン', 'ぬいぐるみ', 'プレゼント', '誕生日']
      },
      {
        name: 'ポケモンカードゲーム',
        description: 'ポケモンセンターで購入検討したトレーディングカード',
        category: 'ゲーム・カード',
        tags: ['ポケモンカード', 'TCG', 'カードゲーム', 'プレゼント']
      },
      {
        name: 'ポケモンフィギュア',
        description: 'コレクション用のポケモンフィギュア',
        category: 'フィギュア・模型',
        tags: ['ポケモン', 'フィギュア', 'コレクション', 'プレゼント']
      },
      {
        name: 'ポケモン文房具',
        description: 'ポケモンデザインの文房具セット',
        category: '文房具',
        tags: ['ポケモン', '文房具', 'ステーショナリー', 'プレゼント']
      },
      {
        name: 'ポケモンTシャツ',
        description: 'ポケモンキャラクターのデザインTシャツ',
        category: 'ファッション',
        tags: ['ポケモン', 'Tシャツ', 'ファッション', 'プレゼント']
      },
      {
        name: 'ポケモンバッグ',
        description: 'ポケモンデザインのバッグ・リュック',
        category: 'バッグ',
        tags: ['ポケモン', 'バッグ', 'リュック', 'プレゼント']
      }
    ]
  },
  
  // メンバーセレクトの最強酒のあて
  {
    episodeId: 'vQg4QDvrZr4',
    episodeTitle: 'メンバーセレクトの最強酒のあて',
    locations: [
      {
        name: 'SixTONES会議室スタジオ',
        address: '東京都内',
        description: 'メンバーが酒のあてを紹介・試食したスタジオ',
        tags: ['スタジオ', '会議室', '試食', '企画', 'SixTONES']
      }
    ],
    items: [
      {
        name: '柿の種',
        description: '定番の米菓スナック',
        category: 'おつまみ',
        tags: ['柿の種', 'おつまみ', 'スナック', '米菓']
      },
      {
        name: 'ナッツ各種',
        description: 'アーモンド、カシューナッツなど',
        category: 'おつまみ',
        tags: ['ナッツ', 'おつまみ', 'アーモンド', 'カシューナッツ']
      },
      {
        name: '乾き物',
        description: 'するめ、ビーフジャーキーなど',
        category: 'おつまみ',
        tags: ['乾き物', 'するめ', 'ビーフジャーキー', 'おつまみ']
      },
      {
        name: 'チーズ',
        description: 'ワインに合うチーズ各種',
        category: 'おつまみ',
        tags: ['チーズ', 'おつまみ', 'ワイン', '乳製品']
      },
      {
        name: 'ドライフルーツ',
        description: 'レーズン、ドライマンゴーなど',
        category: 'おつまみ',
        tags: ['ドライフルーツ', 'おつまみ', 'レーズン', 'フルーツ']
      },
      {
        name: '缶詰',
        description: 'ツナ缶、サバ缶などのおつまみ缶詰',
        category: 'おつまみ',
        tags: ['缶詰', 'おつまみ', 'ツナ', 'サバ']
      },
      {
        name: 'お酒各種',
        description: 'おつまみと一緒に楽しむアルコール飲料',
        category: '飲み物',
        tags: ['お酒', 'アルコール', 'ビール', '日本酒']
      }
    ]
  },
  
  // 早押しイントロクイズ
  {
    episodeId: 'Is0IYkfXDos',
    episodeTitle: '早押しイントロクイズ',
    locations: [
      {
        name: 'SixTONESクイズスタジオ',
        address: '東京都内',
        description: '早押しイントロクイズが行われたスタジオ',
        tags: ['スタジオ', 'クイズ', '音楽', '企画', 'SixTONES']
      }
    ],
    items: [
      {
        name: '早押しボタン',
        description: 'クイズ用の早押し機材',
        category: 'ゲーム機材',
        tags: ['早押し', 'ボタン', 'クイズ', '機材']
      },
      {
        name: '音響機材',
        description: 'イントロ再生用のスピーカー・音響システム',
        category: '音響機材',
        tags: ['音響', 'スピーカー', '音楽', 'イントロ']
      },
      {
        name: 'SixTONES楽曲コレクション',
        description: 'クイズで使用されたSixTONESの楽曲データ',
        category: '音楽',
        tags: ['SixTONES', '楽曲', '音楽', 'デビュー5周年']
      }
    ]
  },
  
  // 6つのキャラに仕分けせよ
  {
    episodeId: 'MmBd29ZVKA8',
    episodeTitle: '６つのキャラに仕分けせよ',
    locations: [
      {
        name: 'SixTONES企画スタジオ',
        address: '東京都内',
        description: 'キャラクター診断企画が行われたスタジオ',
        tags: ['スタジオ', '企画', 'キャラクター', '診断', 'SixTONES']
      }
    ],
    items: [
      {
        name: 'キャラクター診断シート',
        description: 'メンバーの性格を分析する診断用紙',
        category: '企画道具',
        tags: ['診断', 'キャラクター', '性格', '分析']
      },
      {
        name: '分類ボード',
        description: 'キャラクターを6つに分類するためのボード',
        category: '企画道具',
        tags: ['分類', 'ボード', 'キャラクター', '企画']
      }
    ]
  }
];

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
async function enrichSixTONESPriorityEpisodes() {
  console.log('🎯 SixTONES 優先エピソードのデータ拡充開始！\\n');
  
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of priorityEpisodeData) {
    console.log(`\\n🎬 ${episodeData.episodeTitle} (${episodeData.episodeId})`);
    
    // エピソードIDで検索してデータベースのエピソードIDを取得
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', episodeData.episodeId)
      .single();
    
    if (!episode) {
      console.log('⚠️ エピソードがデータベースに存在しません');
      continue;
    }
    
    console.log(`✅ エピソード見つかりました: ${episode.title.substring(0, 50)}...`);
    processedEpisodes++;
    
    // ロケーション追加
    for (const locationData of episodeData.locations) {
      const { data, error } = await addLocation(locationData, episode.id, sixtonesId);
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
      const { data, error } = await addItem(itemData, episode.id, sixtonesId);
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
  }
  
  console.log('\\n🎉 SixTONES 優先エピソード拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象エピソード: ${priorityEpisodeData.length}件`);
  console.log(`  - 成功処理エピソード: ${processedEpisodes}件`);
  console.log(`  - 追加ロケーション: ${totalLocations}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  // 最終状況確認
  const { count: finalLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
    
  const { count: finalItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
    
  const { count: finalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', sixtonesId);
  
  console.log('\\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${finalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${(finalLocations/finalEpisodes).toFixed(3)})`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${(finalItems/finalEpisodes).toFixed(3)})`);
  
  console.log('\\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('→ 高再生数エピソードにロケーション・アイテムが追加されています');
  
  console.log('\\n📋 追加されたコンテンツ:');
  console.log('🍞 トースト選手権: キッチン設備、食材、調理器具');
  console.log('🎁 ポケモンセンター: ショップ、グッズ、プレゼント商品');
  console.log('🍺 酒のあて: おつまみ各種、アルコール類');
  console.log('🎵 イントロクイズ: 音響機材、早押し設備');
  console.log('🎭 キャラ診断: 企画道具、分析ツール');
}

enrichSixTONESPriorityEpisodes();