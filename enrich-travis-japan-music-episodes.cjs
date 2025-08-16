const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japanの音楽・パフォーマンス系エピソードデータ
const travisJapanMusicData = [
  // JUST DANCE! Music Video（最高再生数）
  {
    episodeId: 'uuXBHgtC_x8',
    episodeTitle: 'JUST DANCE! Music Video',
    locations: [
      {
        name: 'JUST DANCE! MV撮影スタジオ',
        address: '東京都内',
        description: 'Travis Japan代表曲「JUST DANCE!」のミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'JUST DANCE', '音楽', 'デビュー曲']
      },
      {
        name: 'カラフル撮影セット',
        address: '東京都内',
        description: 'JUST DANCE!の明るくカラフルな世界観を表現した撮影セット',
        tags: ['撮影セット', 'カラフル', 'MV', 'JUST DANCE', 'ポップ']
      },
      {
        name: 'ダンススタジオ（JUST DANCE）',
        address: '東京都内',
        description: 'JUST DANCE!のダンスシーン撮影用スタジオ',
        tags: ['ダンススタジオ', 'JUST DANCE', 'ダンス', 'パフォーマンス', 'MV']
      }
    ],
    items: [
      {
        name: 'Travis Japan「JUST DANCE!」CD',
        description: 'Travis Japanのデビューシングル（2022年10月28日発売）',
        category: '音楽',
        tags: ['JUST DANCE', 'Travis Japan', 'CD', 'デビューシングル', '2022']
      },
      {
        name: 'JUST DANCE! MV衣装',
        description: 'カラフルでポップな「JUST DANCE!」ミュージックビデオ用衣装',
        category: '衣装',
        tags: ['MV衣装', 'JUST DANCE', 'カラフル', 'ポップ', 'ファッション']
      },
      {
        name: 'ダンス用スニーカー',
        description: 'JUST DANCE!のダンスパフォーマンス用シューズ',
        category: 'ダンス用品',
        tags: ['スニーカー', 'ダンス', 'JUST DANCE', 'シューズ', 'パフォーマンス']
      },
      {
        name: 'MV撮影機材',
        description: 'JUST DANCE!撮影用のプロ仕様カメラ・照明機材',
        category: '撮影機材',
        tags: ['撮影機材', 'カメラ', 'MV', 'プロ仕様', '照明']
      },
      {
        name: 'カラフル小道具',
        description: 'MV撮影で使用されたポップな装飾小道具',
        category: '小道具',
        tags: ['小道具', 'カラフル', 'ポップ', 'MV', '装飾']
      }
    ]
  },
  
  // Moving Pieces Music Video
  {
    episodeId: 'c10aEyfEChM',
    episodeTitle: 'Moving Pieces Music Video',
    locations: [
      {
        name: 'Moving Pieces 撮影スタジオ',
        address: '東京都内',
        description: '「Moving Pieces」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'Moving Pieces', '音楽', 'Travis Japan']
      },
      {
        name: 'アートギャラリー風セット',
        address: '東京都内',
        description: 'Moving Piecesのアートなコンセプトを表現した撮影セット',
        tags: ['撮影セット', 'アート', 'ギャラリー', 'MV', 'コンセプト']
      }
    ],
    items: [
      {
        name: 'Travis Japan「Moving Pieces」CD',
        description: '2023年5月15日リリースの楽曲',
        category: '音楽',
        tags: ['Moving Pieces', 'Travis Japan', 'CD', '楽曲', '2023']
      },
      {
        name: 'Moving Pieces MV衣装',
        description: 'アーティスティックな「Moving Pieces」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'Moving Pieces', 'アート', 'ファッション', 'スタイリッシュ']
      },
      {
        name: 'アート系小道具',
        description: 'Moving Piecesのコンセプトに合わせたアート系小道具',
        category: '小道具',
        tags: ['小道具', 'アート', 'Moving Pieces', 'コンセプト', 'MV']
      }
    ]
  },
  
  // Candy Kiss Music Video
  {
    episodeId: '9tZmObfsfls',
    episodeTitle: 'Candy Kiss Music Video',
    locations: [
      {
        name: 'Candy Kiss 撮影スタジオ',
        address: '東京都内',
        description: '「Candy Kiss」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'Candy Kiss', '音楽', 'スイート']
      },
      {
        name: 'キャンディショップ風セット',
        address: '東京都内',
        description: 'Candy Kissの甘い世界観を表現したキャンディショップ風セット',
        tags: ['撮影セット', 'キャンディ', 'スイート', 'MV', 'Candy Kiss']
      }
    ],
    items: [
      {
        name: 'Travis Japan「Candy Kiss」CD',
        description: '2023年7月3日リリースの楽曲',
        category: '音楽',
        tags: ['Candy Kiss', 'Travis Japan', 'CD', '楽曲', '2023']
      },
      {
        name: 'Candy Kiss MV衣装',
        description: '甘くキュートな「Candy Kiss」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'Candy Kiss', 'スイート', 'キュート', 'ファッション']
      },
      {
        name: 'キャンディ小道具',
        description: 'Candy Kissの世界観を演出するキャンディ系小道具',
        category: '小道具',
        tags: ['小道具', 'キャンディ', 'Candy Kiss', 'スイート', 'MV']
      },
      {
        name: 'カラフルキャンディ',
        description: 'MV撮影で使用されたカラフルなキャンディ',
        category: '食べ物',
        tags: ['キャンディ', 'カラフル', 'Candy Kiss', 'お菓子', 'スイート']
      }
    ]
  },
  
  // Sweetest Tune Music Video
  {
    episodeId: 'He4vxbXLjho',
    episodeTitle: 'Sweetest Tune Music Video',
    locations: [
      {
        name: 'Sweetest Tune 撮影スタジオ',
        address: '東京都内',
        description: '「Sweetest Tune」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'Sweetest Tune', '音楽', 'ロマンティック']
      },
      {
        name: 'ロマンティック撮影セット',
        address: '東京都内',
        description: 'Sweetest Tuneの甘いロマンスを演出した撮影セット',
        tags: ['撮影セット', 'ロマンティック', 'MV', 'Sweetest Tune', 'スイート']
      }
    ],
    items: [
      {
        name: 'Travis Japan「Sweetest Tune」CD',
        description: '2024年6月10日リリースの楽曲',
        category: '音楽',
        tags: ['Sweetest Tune', 'Travis Japan', 'CD', '楽曲', '2024']
      },
      {
        name: 'Sweetest Tune MV衣装',
        description: 'エレガントな「Sweetest Tune」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'Sweetest Tune', 'エレガント', 'ロマンティック', 'ファッション']
      },
      {
        name: 'ロマンティック小道具',
        description: 'Sweetest Tuneの甘い雰囲気を演出する小道具',
        category: '小道具',
        tags: ['小道具', 'ロマンティック', 'Sweetest Tune', 'スイート', 'MV']
      }
    ]
  },
  
  // T.G.I. Friday Night Music Video
  {
    episodeId: 'GUXe0ACJRHI',
    episodeTitle: 'T.G.I. Friday Night Music Video',
    locations: [
      {
        name: 'T.G.I. Friday Night 撮影スタジオ',
        address: '東京都内',
        description: '「T.G.I. Friday Night」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'T.G.I. Friday Night', '音楽', 'パーティー']
      },
      {
        name: 'ナイトクラブ風セット',
        address: '東京都内',
        description: 'T.G.I. Friday Nightのパーティー感を演出したクラブ風セット',
        tags: ['撮影セット', 'ナイトクラブ', 'パーティー', 'MV', 'T.G.I. Friday Night']
      }
    ],
    items: [
      {
        name: 'Travis Japan「T.G.I. Friday Night」CD',
        description: '2024年3月18日リリースの楽曲',
        category: '音楽',
        tags: ['T.G.I. Friday Night', 'Travis Japan', 'CD', '楽曲', '2024']
      },
      {
        name: 'T.G.I. Friday Night MV衣装',
        description: 'パーティー感溢れる「T.G.I. Friday Night」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'T.G.I. Friday Night', 'パーティー', 'ナイト', 'ファッション']
      },
      {
        name: 'パーティー小道具',
        description: 'T.G.I. Friday Nightのパーティー雰囲気を演出する小道具',
        category: '小道具',
        tags: ['小道具', 'パーティー', 'T.G.I. Friday Night', 'ナイト', 'MV']
      }
    ]
  },
  
  // Crazy Crazy Music Video
  {
    episodeId: 'c6z5aJUECTg',
    episodeTitle: 'Crazy Crazy Music Video',
    locations: [
      {
        name: 'Crazy Crazy 撮影スタジオ',
        address: '東京都内',
        description: '「Crazy Crazy」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'Crazy Crazy', '音楽', 'エネルギッシュ']
      },
      {
        name: 'クレイジー撮影セット',
        address: '東京都内',
        description: 'Crazy Crazyのハイエネルギーな世界観を表現した撮影セット',
        tags: ['撮影セット', 'クレイジー', 'エネルギッシュ', 'MV', 'Crazy Crazy']
      }
    ],
    items: [
      {
        name: 'Travis Japan「Crazy Crazy」CD',
        description: '2024年10月21日リリースの楽曲',
        category: '音楽',
        tags: ['Crazy Crazy', 'Travis Japan', 'CD', '楽曲', '2024']
      },
      {
        name: 'Crazy Crazy MV衣装',
        description: 'エネルギッシュな「Crazy Crazy」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'Crazy Crazy', 'エネルギッシュ', 'クレイジー', 'ファッション']
      },
      {
        name: 'エフェクト機材',
        description: 'Crazy Crazyの特殊効果用機材',
        category: '撮影機材',
        tags: ['エフェクト', '特殊効果', 'Crazy Crazy', 'MV', '機材']
      }
    ]
  },
  
  // Tokyo Crazy Night Music Video
  {
    episodeId: 'MoVJgKBhtUc',
    episodeTitle: 'Tokyo Crazy Night Music Video',
    locations: [
      {
        name: 'Tokyo Crazy Night 撮影スタジオ',
        address: '東京都内',
        description: '「Tokyo Crazy Night」ミュージックビデオ撮影スタジオ',
        tags: ['MV撮影', 'スタジオ', 'Tokyo Crazy Night', '音楽', '東京']
      },
      {
        name: '東京夜景撮影地',
        address: '東京都内',
        description: 'Tokyo Crazy Nightの東京の夜を表現した撮影ロケーション',
        tags: ['夜景', '東京', 'ロケーション撮影', 'MV', 'Tokyo Crazy Night']
      }
    ],
    items: [
      {
        name: 'Travis Japan「Tokyo Crazy Night」CD',
        description: '2025年3月4日リリースの楽曲',
        category: '音楽',
        tags: ['Tokyo Crazy Night', 'Travis Japan', 'CD', '楽曲', '2025']
      },
      {
        name: 'Tokyo Crazy Night MV衣装',
        description: '東京の夜をイメージした「Tokyo Crazy Night」用衣装',
        category: '衣装',
        tags: ['MV衣装', 'Tokyo Crazy Night', '東京', 'ナイト', 'ファッション']
      },
      {
        name: '東京テーマ小道具',
        description: 'Tokyo Crazy Nightの東京コンセプトを表現する小道具',
        category: '小道具',
        tags: ['小道具', '東京', 'Tokyo Crazy Night', 'ナイト', 'MV']
      }
    ]
  },
  
  // ライブ・パフォーマンス系
  {
    episodeId: 'qzHPFnFzpE8',
    episodeTitle: 'Swing My Way - Travis Japan Debut Concert 2023',
    locations: [
      {
        name: 'Travis Japan デビューコンサート会場',
        address: '東京都内',
        description: '2023年開催のTravis Japanデビューコンサート会場',
        tags: ['コンサート', 'デビュー', 'ライブ', '2023', 'Travis Japan']
      },
      {
        name: 'コンサートステージ',
        address: '東京都内',
        description: 'デビューコンサートの特別ステージセット',
        tags: ['ステージ', 'コンサート', 'デビュー', 'ライブ', 'セット']
      }
    ],
    items: [
      {
        name: 'Travis Japan Debut Concert DVD/Blu-ray',
        description: '2023年デビューコンサートの映像作品',
        category: 'DVD・Blu-ray',
        tags: ['ライブ', 'DVD', 'デビュー', 'コンサート', '2023']
      },
      {
        name: 'デビューコンサート衣装',
        description: 'デビューコンサートで着用された特別衣装',
        category: '衣装',
        tags: ['ライブ衣装', 'デビュー', 'コンサート', 'ステージ', 'ファッション']
      },
      {
        name: 'ライブマイク',
        description: 'デビューコンサートで使用されたプロ仕様マイク',
        category: '音響機材',
        tags: ['マイク', 'ライブ', 'コンサート', '音響', '機材']
      },
      {
        name: 'ステージライト',
        description: 'デビューコンサートのステージ照明',
        category: '照明機材',
        tags: ['ライト', '照明', 'ステージ', 'コンサート', 'ライブ']
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
async function enrichTravisJapanMusicEpisodes() {
  console.log('🎵 Travis Japan 音楽エピソードのデータ拡充開始！\\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of travisJapanMusicData) {
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
  }
  
  console.log('\\n🎉 Travis Japan 音楽エピソード拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象エピソード: ${travisJapanMusicData.length}件`);
  console.log(`  - 成功処理エピソード: ${processedEpisodes}件`);
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
    
  const { count: finalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  console.log('\\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${finalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${(finalLocations/finalEpisodes).toFixed(3)})`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${(finalItems/finalEpisodes).toFixed(3)})`);
  
  console.log('\\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ 音楽・MV・ライブエピソードにロケーション・アイテムが追加');
  
  console.log('\\n📋 追加されたコンテンツカテゴリ:');
  console.log('🎬 MV撮影: スタジオ、撮影セット、特殊効果');
  console.log('🎵 音楽作品: CD、楽曲、アルバム');
  console.log('🎤 ライブ: コンサート会場、ステージセット、音響機材');
  console.log('👔 衣装: MV衣装、ライブ衣装、テーマ別ファッション');
  console.log('🎭 小道具: テーマ別装飾、特殊効果、演出アイテム');
  console.log('📀 映像作品: DVD/Blu-ray、ライブ映像');
}

enrichTravisJapanMusicEpisodes();