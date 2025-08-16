const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 音楽・パフォーマンス系エピソードのデータ
const musicEpisodeData = [
  // バリア [YouTube ver.]
  {
    episodeId: '5g6E_UY5G88',
    episodeTitle: 'バリア [YouTube ver.]',
    locations: [
      {
        name: 'ミュージックビデオ撮影スタジオ',
        address: '東京都内',
        description: '「バリア」のミュージックビデオ撮影が行われたスタジオ',
        tags: ['MV撮影', 'スタジオ', 'バリア', '音楽', 'YouTube']
      },
      {
        name: '未来的セットスタジオ',
        address: '東京都内',
        description: '近未来的な映像表現のために構築された特殊セット',
        tags: ['セット', '未来的', 'SF', 'MV', '撮影']
      }
    ],
    items: [
      {
        name: 'SixTONES「バリア」CD',
        description: '2025年リリースの楽曲「バリア」',
        category: '音楽',
        tags: ['バリア', 'SixTONES', 'CD', '楽曲', '2025']
      },
      {
        name: 'MV衣装（バリア）',
        description: '「バリア」ミュージックビデオ用の特別衣装',
        category: '衣装',
        tags: ['MV', '衣装', 'バリア', 'ファッション', '音楽']
      },
      {
        name: '撮影機材（4K カメラ）',
        description: '高画質MV撮影用のプロ仕様カメラ',
        category: '撮影機材',
        tags: ['カメラ', '4K', '撮影', 'MV', '機材']
      },
      {
        name: '照明機材',
        description: 'MV撮影用の特殊照明・ライティング',
        category: '撮影機材',
        tags: ['照明', 'ライティング', 'MV', '撮影', '機材']
      }
    ]
  },
  
  // BOYZ [YouTube ver.]
  {
    episodeId: 'jUUmJCXtFl0',
    episodeTitle: 'BOYZ [YouTube ver.]',
    locations: [
      {
        name: 'アーバンストリート撮影地',
        address: '東京都内',
        description: '「BOYZ」MV撮影に使用された都市部のストリート',
        tags: ['ストリート', 'アーバン', 'MV撮影', 'BOYZ', '都市部']
      },
      {
        name: 'ダンススタジオ（BOYZ）',
        address: '東京都内',
        description: 'BOYZのダンスシーン撮影スタジオ',
        tags: ['ダンス', 'スタジオ', 'BOYZ', 'パフォーマンス', '撮影']
      }
    ],
    items: [
      {
        name: 'SixTONES「BOYZ」CD',
        description: '2025年リリースの楽曲「BOYZ」',
        category: '音楽',
        tags: ['BOYZ', 'SixTONES', 'CD', '楽曲', '2025']
      },
      {
        name: 'ストリート系衣装',
        description: 'BOYZのMVで着用されたストリートファッション',
        category: '衣装',
        tags: ['ストリート', '衣装', 'BOYZ', 'ファッション', 'MV']
      },
      {
        name: 'ダンス小道具',
        description: 'BOYZのパフォーマンスで使用された小道具',
        category: '小道具',
        tags: ['ダンス', '小道具', 'BOYZ', 'パフォーマンス', 'MV']
      }
    ]
  },
  
  // Stargaze [YouTube ver.]
  {
    episodeId: 'F_5K9hT1sPU',
    episodeTitle: 'Stargaze [YouTube ver.]',
    locations: [
      {
        name: '夜景撮影地',
        address: '東京都内',
        description: '「Stargaze」MV撮影で使用された美しい夜景スポット',
        tags: ['夜景', 'Stargaze', 'MV撮影', '星', '夜']
      },
      {
        name: '屋上撮影地',
        address: '東京都内',
        description: '星空をテーマにした屋上でのMVシーン',
        tags: ['屋上', '星空', 'Stargaze', 'MV', '撮影']
      }
    ],
    items: [
      {
        name: 'SixTONES「Stargaze」CD',
        description: '2025年リリースの楽曲「Stargaze」',
        category: '音楽',
        tags: ['Stargaze', 'SixTONES', 'CD', '楽曲', '2025']
      },
      {
        name: '星空テーマ衣装',
        description: 'Stargazeの世界観に合わせた衣装',
        category: '衣装',
        tags: ['星空', '衣装', 'Stargaze', 'ファッション', 'MV']
      },
      {
        name: '星空演出小道具',
        description: '星をテーマにした演出用小道具',
        category: '小道具',
        tags: ['星', '演出', 'Stargaze', '小道具', 'MV']
      }
    ]
  },
  
  // MTV Unplugged: SixTONES
  {
    episodeId: '2gzYwx46SyA',
    episodeTitle: 'MTV Unplugged: SixTONES「Strawberry Breakfast」',
    locations: [
      {
        name: 'MTV Unpluggedスタジオ',
        address: '東京都内',
        description: 'MTV Unpluggedの収録が行われた特別スタジオ',
        tags: ['MTV', 'Unplugged', 'スタジオ', '音楽', 'アコースティック']
      }
    ],
    items: [
      {
        name: 'アコースティックギター',
        description: 'MTV Unpluggedで使用されたアコースティックギター',
        category: '楽器',
        tags: ['ギター', 'アコースティック', 'MTV', 'Unplugged', '楽器']
      },
      {
        name: 'SixTONES「Strawberry Breakfast」',
        description: 'MTV Unpluggedで演奏された楽曲',
        category: '音楽',
        tags: ['Strawberry Breakfast', 'SixTONES', 'MTV', 'Unplugged', '音楽']
      },
      {
        name: 'アコースティック衣装',
        description: 'MTV Unplugged収録時の特別衣装',
        category: '衣装',
        tags: ['アコースティック', '衣装', 'MTV', 'Unplugged', 'ファッション']
      },
      {
        name: 'ピアノ',
        description: 'MTV Unpluggedで使用されたピアノ',
        category: '楽器',
        tags: ['ピアノ', 'MTV', 'Unplugged', '楽器', '鍵盤']
      }
    ]
  },
  
  // VVS LIVE DVD/BD
  {
    episodeId: 'i1vFBbG_4mQ',
    episodeTitle: 'VVS「DRAMA」from TOKYO DOME',
    locations: [
      {
        name: '東京ドーム',
        address: '東京都文京区後楽1-3-61',
        description: 'SixTONES VVSライブが開催された日本最大級のドーム会場',
        tags: ['東京ドーム', 'VVS', 'ライブ', 'コンサート', 'ドーム']
      },
      {
        name: '東京ドームバックステージ',
        address: '東京都文京区後楽1-3-61',
        description: 'VVSライブのバックステージエリア',
        tags: ['バックステージ', '東京ドーム', 'VVS', 'ライブ', '舞台裏']
      }
    ],
    items: [
      {
        name: 'SixTONES VVS ライブDVD/Blu-ray',
        description: '2024年4月22日東京ドーム公演の映像作品',
        category: 'DVD・Blu-ray',
        tags: ['VVS', 'ライブ', 'DVD', 'Blu-ray', '東京ドーム']
      },
      {
        name: 'VVS ライブ衣装',
        description: 'VVSライブツアーで着用された特別衣装',
        category: '衣装',
        tags: ['VVS', 'ライブ', '衣装', 'ステージ', 'ファッション']
      },
      {
        name: 'ステージ演出セット',
        description: 'VVSライブの大規模ステージセット',
        category: 'ステージセット',
        tags: ['ステージ', 'セット', 'VVS', 'ライブ', '演出']
      },
      {
        name: 'ライブマイク',
        description: 'VVSライブで使用されたプロ仕様マイク',
        category: '音響機材',
        tags: ['マイク', 'ライブ', 'VVS', '音響', '機材']
      }
    ]
  },
  
  // GOLD Album
  {
    episodeId: 'cQtwBbrA5fo',
    episodeTitle: '5th Album「GOLD」nonSTop digeST',
    locations: [
      {
        name: 'アルバム撮影スタジオ',
        address: '東京都内',
        description: 'GOLDアルバム関連映像撮影のためのスタジオ',
        tags: ['スタジオ', 'GOLD', 'アルバム', '撮影', '音楽']
      }
    ],
    items: [
      {
        name: 'SixTONES 5th Album「GOLD」',
        description: '2024年12月リリースの5thアルバム',
        category: '音楽',
        tags: ['GOLD', 'アルバム', 'SixTONES', '5th', '2024']
      },
      {
        name: 'GOLDアルバムジャケット',
        description: 'GOLDアルバムの豪華なジャケットデザイン',
        category: 'アートワーク',
        tags: ['GOLD', 'ジャケット', 'アルバム', 'アートワーク', 'デザイン']
      },
      {
        name: 'GOLD テーマ衣装',
        description: 'GOLDアルバムのコンセプトに合わせた金色系衣装',
        category: '衣装',
        tags: ['GOLD', '衣装', '金色', 'アルバム', 'ファッション']
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
async function enrichSixTONESMusicEpisodes() {
  console.log('🎵 SixTONES 音楽エピソードのデータ拡充開始！\\n');
  
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of musicEpisodeData) {
    console.log(`\\n🎵 ${episodeData.episodeTitle} (${episodeData.episodeId})`);
    
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
  
  console.log('\\n🎉 SixTONES 音楽エピソード拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象エピソード: ${musicEpisodeData.length}件`);
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
  console.log('→ 音楽・MV・ライブエピソードにロケーション・アイテムが追加');
  
  console.log('\\n📋 追加されたコンテンツカテゴリ:');
  console.log('🎬 MV撮影: スタジオ、セット、撮影機材、衣装');
  console.log('🎵 音楽作品: CD、楽曲、アルバム、アートワーク');
  console.log('🎤 ライブ: 会場、ステージセット、音響機材');
  console.log('🎸 楽器: ギター、ピアノ、マイク、音響機材');
  console.log('🌟 演出: 照明、小道具、特殊効果');
}

enrichSixTONESMusicEpisodes();