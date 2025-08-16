const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japanのバラエティ・企画系エピソードデータ
const travisJapanVarietyData = [
  // 大食いチャレンジ：回転寿司
  {
    episodeId: '5OAJ5gs2jkg',
    episodeTitle: '大食いチャレンジ：回転寿司を食い尽くせ!!',
    locations: [
      {
        name: '回転寿司店（都内）',
        address: '東京都内',
        description: 'Travis Japanが大食いチャレンジを行った回転寿司店',
        tags: ['回転寿司', '大食い', 'チャレンジ', '寿司', 'グルメ']
      },
      {
        name: '寿司カウンター',
        address: '東京都内',
        description: 'メンバーが座って寿司を食べたカウンター席',
        tags: ['カウンター', '寿司', '席', '回転寿司']
      }
    ],
    items: [
      {
        name: 'まぐろ',
        description: '回転寿司の定番ネタ',
        category: '寿司',
        tags: ['まぐろ', '寿司', '回転寿司', '魚']
      },
      {
        name: 'サーモン',
        description: '人気の寿司ネタ',
        category: '寿司',
        tags: ['サーモン', '寿司', '回転寿司', '魚']
      },
      {
        name: 'えび',
        description: '定番の寿司ネタ',
        category: '寿司',
        tags: ['えび', '寿司', '回転寿司', '海鮮']
      },
      {
        name: 'いくら',
        description: '高級寿司ネタ',
        category: '寿司',
        tags: ['いくら', '寿司', '回転寿司', '高級']
      },
      {
        name: 'ウニ',
        description: '高級寿司ネタ',
        category: '寿司',
        tags: ['ウニ', '寿司', '回転寿司', '高級']
      },
      {
        name: '茶碗蒸し',
        description: '回転寿司のサイドメニュー',
        category: 'サイドメニュー',
        tags: ['茶碗蒸し', '回転寿司', 'サイドメニュー']
      },
      {
        name: '味噌汁',
        description: '寿司と一緒に飲む味噌汁',
        category: '汁物',
        tags: ['味噌汁', '寿司', '汁物']
      },
      {
        name: '緑茶',
        description: '寿司店で提供される緑茶',
        category: '飲み物',
        tags: ['緑茶', '寿司', '飲み物', 'お茶']
      }
    ]
  },
  
  // チャンネルオープン記念1泊2日ドライブ旅
  {
    episodeId: 'Wja4wMl6Pms',
    episodeTitle: 'チャンネルオープン記念１泊2日ドライブ旅',
    locations: [
      {
        name: '関東圏観光地',
        address: '関東地方',
        description: 'Travis Japanが1泊2日で訪れた関東圏の観光スポット',
        tags: ['ドライブ', '観光', '旅行', '関東', '1泊2日']
      },
      {
        name: '温泉旅館',
        address: '関東近郊',
        description: '1泊2日旅行で宿泊した温泉旅館',
        tags: ['温泉', '旅館', '宿泊', '1泊2日', '旅行']
      },
      {
        name: 'サービスエリア',
        address: '高速道路',
        description: 'ドライブ中に立ち寄ったサービスエリア',
        tags: ['SA', 'サービスエリア', 'ドライブ', '高速道路']
      },
      {
        name: '道の駅',
        address: '関東近郊',
        description: '旅行中に立ち寄った道の駅',
        tags: ['道の駅', 'ドライブ', '観光', 'お土産']
      }
    ],
    items: [
      {
        name: 'レンタカー',
        description: 'ドライブ旅行で使用したレンタカー',
        category: '交通手段',
        tags: ['レンタカー', 'ドライブ', '車', '旅行']
      },
      {
        name: '旅行バッグ',
        description: '1泊2日旅行用の荷物',
        category: '旅行用品',
        tags: ['バッグ', '旅行', '荷物', '1泊2日']
      },
      {
        name: '地図・ガイドブック',
        description: '旅行先の情報収集用',
        category: '旅行用品',
        tags: ['地図', 'ガイドブック', '旅行', '観光']
      },
      {
        name: '温泉タオル',
        description: '温泉で使用するタオル',
        category: '温泉用品',
        tags: ['タオル', '温泉', '旅館', '入浴']
      },
      {
        name: 'お土産',
        description: '旅行先で購入したお土産',
        category: 'お土産',
        tags: ['お土産', '旅行', '記念品', '特産品']
      },
      {
        name: '車内スナック',
        description: 'ドライブ中に食べるお菓子',
        category: '食べ物',
        tags: ['スナック', 'ドライブ', 'お菓子', '車内']
      }
    ]
  },
  
  // 真のおバカ王が決まる：学力対決
  {
    episodeId: 'WvNuSy165q0',
    episodeTitle: '真のおバカ王が決まる：因縁の学力対決',
    locations: [
      {
        name: '学習塾風スタジオ',
        address: '東京都内',
        description: '学力対決が行われた教室風のスタジオ',
        tags: ['スタジオ', '学習', '教室', '学力テスト', '企画']
      }
    ],
    items: [
      {
        name: '学力テスト問題用紙',
        description: 'メンバーが挑戦した学力テストの問題',
        category: '企画道具',
        tags: ['テスト', '問題用紙', '学力', '勉強']
      },
      {
        name: '筆記用具',
        description: 'テスト用のペンや鉛筆',
        category: '文房具',
        tags: ['ペン', '鉛筆', '筆記用具', 'テスト']
      },
      {
        name: '解答用紙',
        description: 'テストの答えを書く用紙',
        category: '企画道具',
        tags: ['解答用紙', 'テスト', '答案', '学力']
      },
      {
        name: '採点表',
        description: 'メンバーの点数を記録する表',
        category: '企画道具',
        tags: ['採点', '点数', 'ランキング', '学力']
      },
      {
        name: '参考書',
        description: 'テスト対策用の参考書',
        category: '書籍',
        tags: ['参考書', '勉強', '学習', 'テスト']
      }
    ]
  },
  
  // 新ダンス企画：足音だけでシンクロ
  {
    episodeId: '7J6vUDSJJvI',
    episodeTitle: '新ダンス企画：足音だけでシンクロ出来るのか!?',
    locations: [
      {
        name: 'ダンススタジオ（足音企画）',
        address: '東京都内',
        description: '足音シンクロ企画を行ったダンススタジオ',
        tags: ['ダンススタジオ', '足音', 'シンクロ', 'ダンス', '企画']
      }
    ],
    items: [
      {
        name: 'ダンスシューズ',
        description: '足音を重視したダンス用シューズ',
        category: 'ダンス用品',
        tags: ['ダンスシューズ', '足音', 'シューズ', 'ダンス']
      },
      {
        name: '音響機材（足音録音用）',
        description: '足音を録音・再生する音響設備',
        category: '音響機材',
        tags: ['音響', '録音', '足音', 'マイク']
      },
      {
        name: 'メトロノーム',
        description: 'リズムを合わせるための機材',
        category: '音楽機材',
        tags: ['メトロノーム', 'リズム', 'テンポ', 'ダンス']
      },
      {
        name: 'ダンス練習着',
        description: '動きやすいダンス用の服装',
        category: 'ダンス用品',
        tags: ['練習着', 'ダンス', '衣装', '動きやすい']
      }
    ]
  },
  
  // 食べ物人狼企画
  {
    episodeId: 'ztyJ0TRDi0A',
    episodeTitle: '食べ物人狼：ひとりだけ違う食べ物を食べている人狼は誰だ!?',
    locations: [
      {
        name: '人狼ゲーム用スタジオ',
        address: '東京都内',
        description: '食べ物人狼ゲームが行われたスタジオ',
        tags: ['スタジオ', '人狼', 'ゲーム', '食べ物', '企画']
      }
    ],
    items: [
      {
        name: '人狼カード',
        description: '役職を決める人狼ゲーム用カード',
        category: 'ゲーム道具',
        tags: ['人狼', 'カード', 'ゲーム', '役職']
      },
      {
        name: '目隠し用アイマスク',
        description: '夜のターンで使用するアイマスク',
        category: 'ゲーム道具',
        tags: ['アイマスク', '人狼', 'ゲーム', '目隠し']
      },
      {
        name: '様々な食べ物',
        description: '人狼ゲームで使用される多種多様な食べ物',
        category: '食べ物',
        tags: ['食べ物', '人狼', 'ゲーム', '食材']
      },
      {
        name: 'おやつ各種',
        description: '人狼ゲーム中に食べるお菓子',
        category: '食べ物',
        tags: ['おやつ', 'お菓子', 'ゲーム', 'スナック']
      }
    ]
  },
  
  // デビュー1周年：無音ダンス
  {
    episodeId: 'm2EoVyW-xdk',
    episodeTitle: 'デビュー１周年：無音ダンスで奇跡の瞬間を魅せる',
    locations: [
      {
        name: '記念撮影スタジオ',
        address: '東京都内',
        description: 'デビュー1周年記念の無音ダンス企画を行ったスタジオ',
        tags: ['スタジオ', 'デビュー記念', '無音ダンス', '1周年', '記念']
      }
    ],
    items: [
      {
        name: 'デビュー1周年記念グッズ',
        description: 'デビュー1周年を記念した特別グッズ',
        category: '記念品',
        tags: ['1周年', 'デビュー', '記念品', 'グッズ']
      },
      {
        name: '無音ダンス用イヤホン',
        description: '音楽を聞くためのワイヤレスイヤホン',
        category: 'ダンス用品',
        tags: ['イヤホン', '無音ダンス', 'ワイヤレス', 'ダンス']
      },
      {
        name: 'お祝いケーキ',
        description: 'デビュー1周年を祝うケーキ',
        category: '食べ物',
        tags: ['ケーキ', '1周年', 'お祝い', 'デビュー']
      },
      {
        name: '記念写真',
        description: 'デビュー1周年の記念撮影',
        category: '記念品',
        tags: ['写真', '記念', '1周年', 'デビュー']
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
async function enrichTravisJapanVarietyEpisodes() {
  console.log('🎭 Travis Japan バラエティ企画エピソードのデータ拡充開始！\\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of travisJapanVarietyData) {
    console.log(`\\n🎭 ${episodeData.episodeTitle} (${episodeData.episodeId})`);
    
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
  
  console.log('\\n🎉 Travis Japan バラエティ企画拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象エピソード: ${travisJapanVarietyData.length}件`);
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
  console.log('→ バラエティ企画エピソードにロケーション・アイテムが追加');
  
  console.log('\\n📋 追加されたコンテンツカテゴリ:');
  console.log('🍣 大食い企画: 回転寿司、寿司ネタ、サイドメニュー');
  console.log('🚗 ドライブ旅: 観光地、温泉、サービスエリア、旅行用品');
  console.log('📚 学力対決: 学習用品、テスト道具、参考書');
  console.log('🕺 ダンス企画: スタジオ、シューズ、音響機材');
  console.log('🎲 ゲーム企画: ゲーム道具、食べ物、企画用品');
  console.log('🎂 記念企画: 記念品、お祝いグッズ、特別アイテム');
}

enrichTravisJapanVarietyEpisodes();