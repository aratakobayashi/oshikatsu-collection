const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japan特定エピソードのロケーション・アイテムデータ
const travisSpecificEpisodeData = [
  // 渋谷ランチ（ハンバーグ店）
  {
    episodeId: 'DFb-s8Mqs4k',
    episodeTitle: 'Travis Japan【渋谷ランチ】思い出のハンバーグ店',
    locations: [
      {
        name: '渋谷ハンバーグ店',
        address: '東京都渋谷区',
        description: 'Travis Japanが思い出のハンバーグを食べに訪れた渋谷のハンバーグ専門店',
        tags: ['渋谷', 'ハンバーグ', 'ランチ', 'グルメ', '思い出']
      },
      {
        name: '渋谷駅周辺',
        address: '東京都渋谷区',
        description: 'ハンバーグ店へ向かう渋谷の街並み',
        tags: ['渋谷', '駅周辺', '街歩き', 'ロケーション']
      }
    ],
    items: [
      {
        name: 'ハンバーグステーキ',
        description: '思い出のハンバーグ店の看板メニュー',
        category: '洋食',
        tags: ['ハンバーグ', 'ステーキ', 'メインディッシュ', '洋食']
      },
      {
        name: 'デミグラスソース',
        description: 'ハンバーグにかける定番ソース',
        category: '調味料',
        tags: ['デミグラス', 'ソース', 'ハンバーグ', '洋食']
      },
      {
        name: 'ライス',
        description: 'ハンバーグと一緒に食べるご飯',
        category: '主食',
        tags: ['ライス', 'ご飯', '主食', '洋食']
      },
      {
        name: 'サラダ',
        description: 'ランチセットのサラダ',
        category: '副菜',
        tags: ['サラダ', '野菜', '副菜', 'ヘルシー']
      },
      {
        name: 'スープ',
        description: 'ランチセットに付く温かいスープ',
        category: '汁物',
        tags: ['スープ', '汁物', 'ランチセット', '温かい']
      }
    ]
  },

  // ラーメン（河合くんコラボ）
  {
    episodeId: 'NIp-ChT5Ma0',
    episodeTitle: 'Travis Japan【ラーメン】河合くんとコラボ',
    locations: [
      {
        name: 'ラーメン店（河合コラボ）',
        address: '東京都内',
        description: 'Travis Japanが河合くんとコラボしたラーメン店',
        tags: ['ラーメン', 'コラボ', '河合', 'グルメ', 'ジャニーズ']
      },
      {
        name: 'ラーメン店内カウンター',
        address: '東京都内',
        description: 'ラーメンを食べたカウンター席',
        tags: ['カウンター', 'ラーメン店', '店内', '席']
      }
    ],
    items: [
      {
        name: '醤油ラーメン',
        description: '定番の醤油ベースラーメン',
        category: 'ラーメン',
        tags: ['醤油ラーメン', 'ラーメン', '醤油', '麺類']
      },
      {
        name: '味噌ラーメン',
        description: '濃厚な味噌ベースラーメン',
        category: 'ラーメン',
        tags: ['味噌ラーメン', 'ラーメン', '味噌', '麺類']
      },
      {
        name: '塩ラーメン',
        description: 'あっさりとした塩ベースラーメン',
        category: 'ラーメン',
        tags: ['塩ラーメン', 'ラーメン', '塩', '麺類']
      },
      {
        name: 'チャーシュー',
        description: 'ラーメンのトッピング',
        category: 'トッピング',
        tags: ['チャーシュー', 'トッピング', '豚肉', 'ラーメン']
      },
      {
        name: 'メンマ',
        description: 'ラーメンの定番トッピング',
        category: 'トッピング',
        tags: ['メンマ', 'トッピング', '筍', 'ラーメン']
      },
      {
        name: 'ネギ',
        description: 'ラーメンに乗せる薬味',
        category: 'トッピング',
        tags: ['ネギ', 'トッピング', '薬味', 'ラーメン']
      },
      {
        name: '餃子',
        description: 'ラーメンのサイドメニュー',
        category: 'サイドメニュー',
        tags: ['餃子', 'サイド', '点心', 'ラーメン店']
      }
    ]
  },

  // シン日本遺産（苫鵡・氷の村）
  {
    episodeId: 'JydlKpwQLZA',
    episodeTitle: '【JUST！シン日本遺産】苫鵡で氷でできた村',
    locations: [
      {
        name: '苫鵡（とまむ）',
        address: '北海道勇払郡占冠村',
        description: 'Travis Japanが訪れた北海道の観光地・苫鵡',
        tags: ['苫鵡', '北海道', '観光地', 'リゾート', '自然']
      },
      {
        name: '氷の村',
        address: '北海道勇払郡占冠村',
        description: '苫鵡にある氷でできた幻想的な村',
        tags: ['氷の村', '氷', '冬', '幻想的', '観光']
      },
      {
        name: 'アイスヴィレッジ',
        address: '北海道勇払郡占冠村',
        description: '星野リゾート トマムのアイスヴィレッジ',
        tags: ['アイスヴィレッジ', '星野リゾート', 'トマム', '氷', '体験']
      },
      {
        name: '氷のホテル',
        address: '北海道勇払郡占冠村',
        description: '氷でできた幻想的なホテル',
        tags: ['氷のホテル', '氷', 'ホテル', '宿泊', '体験']
      }
    ],
    items: [
      {
        name: '氷のグラス',
        description: '氷で作られた特別なグラス',
        category: '体験グッズ',
        tags: ['氷のグラス', '氷', 'グラス', '体験', '飲み物']
      },
      {
        name: '防寒着',
        description: '氷の村を見学するための防寒具',
        category: '衣類',
        tags: ['防寒着', '防寒', '寒さ対策', '冬服', '北海道']
      },
      {
        name: 'ホットドリンク',
        description: '寒い中で飲む温かい飲み物',
        category: '飲み物',
        tags: ['ホットドリンク', '温かい', '飲み物', '寒さ対策', 'ホット']
      },
      {
        name: '氷の彫刻',
        description: '氷の村に展示された氷のアート作品',
        category: 'アート',
        tags: ['氷の彫刻', '氷', 'アート', '彫刻', '芸術']
      },
      {
        name: 'イルミネーション',
        description: '氷の村を彩る美しい照明',
        category: '照明',
        tags: ['イルミネーション', '照明', '氷', '美しい', '夜景']
      },
      {
        name: '記念写真',
        description: '氷の村での思い出の写真',
        category: '記念品',
        tags: ['記念写真', '写真', '思い出', '記念', '氷の村']
      }
    ]
  },

  // 大食い検証（1.5kgステーキ）
  {
    episodeId: 'ynqNPi5O8sI',
    episodeTitle: 'Travis Japan【大食い検証】1.5kgステーキ',
    locations: [
      {
        name: 'ステーキハウス',
        address: '東京都内',
        description: 'Travis Japanが1.5kgステーキチャレンジを行ったステーキ専門店',
        tags: ['ステーキハウス', '大食い', 'チャレンジ', 'ステーキ', 'グルメ']
      },
      {
        name: 'ステーキ店内テーブル',
        address: '東京都内',
        description: '1.5kgステーキを食べたテーブル席',
        tags: ['テーブル席', 'ステーキ店', '店内', '大食い']
      }
    ],
    items: [
      {
        name: '1.5kgステーキ',
        description: '大食いチャレンジ用の巨大ステーキ',
        category: '肉料理',
        tags: ['1.5kgステーキ', 'ステーキ', '大食い', '巨大', '肉']
      },
      {
        name: 'ステーキソース',
        description: 'ステーキに付けるソース各種',
        category: '調味料',
        tags: ['ステーキソース', 'ソース', '調味料', 'ステーキ']
      },
      {
        name: 'ポテト',
        description: 'ステーキの付け合わせ',
        category: '付け合わせ',
        tags: ['ポテト', '付け合わせ', 'サイド', 'ステーキ']
      },
      {
        name: 'サラダ',
        description: 'ステーキセットのサラダ',
        category: '副菜',
        tags: ['サラダ', '野菜', '副菜', 'ステーキセット']
      },
      {
        name: 'ステーキナイフ',
        description: 'ステーキを切るための専用ナイフ',
        category: '食器',
        tags: ['ステーキナイフ', 'ナイフ', '食器', 'ステーキ']
      },
      {
        name: 'フォーク',
        description: 'ステーキを食べるためのフォーク',
        category: '食器',
        tags: ['フォーク', '食器', 'ステーキ', 'カトラリー']
      },
      {
        name: '水',
        description: '大食いチャレンジ中の水分補給',
        category: '飲み物',
        tags: ['水', '飲み物', '水分補給', '大食い']
      }
    ]
  },

  // まったり旅（横須賀ドライブ）
  {
    episodeId: 'EH2Rec_Z9jY',
    episodeTitle: 'Travis Japan【まったり旅】横須賀ドライブ',
    locations: [
      {
        name: '横須賀',
        address: '神奈川県横須賀市',
        description: 'Travis Japanがまったり旅で訪れた神奈川県横須賀市',
        tags: ['横須賀', '神奈川', 'ドライブ', '旅行', 'まったり']
      },
      {
        name: '横須賀港',
        address: '神奈川県横須賀市',
        description: '横須賀の美しい港エリア',
        tags: ['横須賀港', '港', '海', '横須賀', '景色']
      },
      {
        name: '三笠公園',
        address: '神奈川県横須賀市稲岡町82',
        description: '横須賀の代表的な観光スポット',
        tags: ['三笠公園', '公園', '観光', '横須賀', '歴史']
      },
      {
        name: 'ヴェルニー公園',
        address: '神奈川県横須賀市汐入町1-1',
        description: 'フランス式庭園で有名な横須賀の公園',
        tags: ['ヴェルニー公園', '公園', 'フランス式', 'バラ', '横須賀']
      },
      {
        name: '猿島',
        address: '神奈川県横須賀市猿島',
        description: '横須賀沖の無人島・猿島',
        tags: ['猿島', '無人島', '島', '観光', '横須賀']
      }
    ],
    items: [
      {
        name: 'ドライブカー',
        description: 'まったり旅で使用した車',
        category: '交通手段',
        tags: ['車', 'ドライブ', '移動', '旅行', 'レンタカー']
      },
      {
        name: '横須賀グルメ',
        description: '横須賀名物の海軍カレーなど',
        category: 'グルメ',
        tags: ['横須賀グルメ', '海軍カレー', '名物', 'ご当地', 'グルメ']
      },
      {
        name: '海軍カレー',
        description: '横須賀名物の海軍カレー',
        category: 'カレー',
        tags: ['海軍カレー', 'カレー', '横須賀', '名物', 'ご当地']
      },
      {
        name: '横須賀お土産',
        description: '横須賀旅行の記念品・お土産',
        category: 'お土産',
        tags: ['お土産', '記念品', '横須賀', '旅行', 'プレゼント']
      },
      {
        name: 'カメラ',
        description: '旅行の思い出を撮影するカメラ',
        category: '撮影機材',
        tags: ['カメラ', '撮影', '写真', '思い出', '旅行']
      },
      {
        name: '地図・ガイドブック',
        description: '横須賀観光用の地図やガイド',
        category: '旅行用品',
        tags: ['地図', 'ガイドブック', '観光', '旅行', '横須賀']
      },
      {
        name: 'ドリンク',
        description: 'ドライブ中の飲み物',
        category: '飲み物',
        tags: ['ドリンク', '飲み物', 'ドライブ', '水分補給', '旅行']
      }
    ]
  }
];

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
async function enrichTravisSpecificEpisodes() {
  console.log('🎯 Travis Japan 特定エピソードのデータ拡充開始！\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of travisSpecificEpisodeData) {
    console.log(`\n🎬 ${episodeData.episodeTitle} (${episodeData.episodeId})`);
    
    // エピソードIDで検索してデータベースのエピソードIDを取得
    const { data: episodes, error: episodeError } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', episodeData.episodeId);
    
    const episode = episodes && episodes.length > 0 ? episodes[0] : null;
    
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
  
  console.log('\n🎉 Travis Japan 特定エピソード拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理対象エピソード: ${travisSpecificEpisodeData.length}件`);
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
  
  console.log('\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${finalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${(finalLocations/finalEpisodes).toFixed(3)})`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${(finalItems/finalEpisodes).toFixed(3)})`);
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ 指定された5つのエピソードにロケーション・アイテムが追加');
  
  console.log('\n📋 追加されたコンテンツ:');
  console.log('🍔 渋谷ハンバーグ: ハンバーグ店、洋食メニュー');
  console.log('🍜 ラーメンコラボ: ラーメン店、麺類・トッピング');
  console.log('❄️ 苫鵡氷の村: リゾート地、氷の体験施設');
  console.log('🥩 1.5kgステーキ: ステーキハウス、大食い料理');
  console.log('🚗 横須賀ドライブ: 観光地、ご当地グルメ');
}

enrichTravisSpecificEpisodes();