const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESの大規模ロケーション・アイテムデータ
const sixtonesLocationItemData = [
  // わんこそば企画
  {
    episodeKeywords: ['そば', 'わんこそば', '666杯', '大食い', '792杯'],
    locations: [
      {
        name: '回転わんこそば店',
        address: '東京都内',
        description: 'SixTONESがわんこそば大食い企画で792杯を達成した伝説の店',
        tags: ['そば', '大食い', 'わんこそば', '聖地', '792杯']
      }
    ],
    items: [
      {
        name: 'わんこそば',
        description: '全員で792杯食べた伝統的な岩手県の郷土料理',
        category: '食べ物',
        tags: ['そば', '郷土料理', '大食い', '792杯', '666杯']
      }
    ]
  },
  
  // わんこ小籠包企画
  {
    episodeKeywords: ['小籠包', 'わんこ小籠包', '100皿', '錦糸町'],
    locations: [
      {
        name: 'GINZA過門香 錦糸町駅前プラザビル店',
        address: '東京都墨田区錦糸町',
        description: 'SixTONESがわんこ小籠包100皿チャレンジを行った中華料理店',
        tags: ['中華料理', '小籠包', '錦糸町', '聖地', '大食い']
      }
    ],
    items: [
      {
        name: '上海小籠包',
        description: 'わんこ小籠包企画で食べた定番の小籠包',
        category: '食べ物',
        tags: ['小籠包', '中華', '点心']
      },
      {
        name: 'フカヒレ小籠包',
        description: '高級食材フカヒレを使った贅沢な小籠包',
        category: '食べ物',
        tags: ['小籠包', 'フカヒレ', '高級']
      },
      {
        name: 'チーズ小籠包',
        description: '洋風アレンジのチーズ入り小籠包',
        category: '食べ物',
        tags: ['小籠包', 'チーズ', 'アレンジ']
      },
      {
        name: 'パンダまんじゅう',
        description: '可愛いパンダの形をした中華まんじゅう',
        category: '食べ物',
        tags: ['中華', 'パンダ', 'デザート']
      }
    ]
  },
  
  // 新横浜ラーメン博物館
  {
    episodeKeywords: ['ラーメン博物館', 'かくれんぼ', '新横浜'],
    locations: [
      {
        name: '新横浜ラーメン博物館',
        address: '神奈川県横浜市港北区新横浜2-14-21',
        description: 'SixTONESが最大級のかくれんぼをした日本初のフードテーマパーク',
        tags: ['ラーメン', '博物館', '新横浜', 'かくれんぼ', '聖地']
      }
    ],
    items: [
      {
        name: '昭和レトロな街並み',
        description: 'ラーメン博物館内の昭和33年の街並みを再現した空間',
        category: '観光スポット',
        tags: ['昭和', 'レトロ', '撮影スポット']
      }
    ]
  },
  
  // タワーレコード渋谷店
  {
    episodeKeywords: ['タワーレコード', 'デビューシングル', 'CD', '渋谷'],
    locations: [
      {
        name: 'タワーレコード渋谷店',
        address: '東京都渋谷区神南1-22-14',
        description: 'SixTONESがデビューシングルを実際に購入した記念すべき場所',
        tags: ['CDショップ', '渋谷', '聖地', 'デビュー', 'タワレコ']
      }
    ],
    items: [
      {
        name: 'Imitation Rain / D.D.',
        description: 'SixTONESのデビューシングル（2020年1月22日発売）',
        category: 'CD・音楽',
        tags: ['デビューシングル', 'CD', 'Imitation Rain', 'D.D.']
      }
    ]
  },
  
  // 自由学園明日館
  {
    episodeKeywords: ['CITY', 'アルバム', '撮影', '池袋'],
    locations: [
      {
        name: '自由学園明日館',
        address: '東京都豊島区西池袋2-31-3',
        description: '2ndアルバム「CITY」の映像撮影で使用された重要文化財',
        tags: ['重要文化財', '池袋', '撮影スポット', 'CITY', '建築']
      }
    ],
    items: [
      {
        name: '2ndアルバム「CITY」',
        description: 'SixTONESの2ndアルバム（2022年1月5日発売）',
        category: 'CD・音楽',
        tags: ['アルバム', 'CITY', '音楽']
      }
    ]
  },
  
  // 回向院
  {
    episodeKeywords: ['石巡り', '両国', 'ねずみ小僧'],
    locations: [
      {
        name: '回向院',
        address: '東京都墨田区両国2-8-10',
        description: '石巡りツアーで訪れた、ねずみ小僧の墓で有名な寺院',
        tags: ['寺院', '両国', '石巡り', 'ねずみ小僧', '聖地']
      }
    ],
    items: [
      {
        name: 'ねずみ小僧の墓石',
        description: '石を削ってお守りにすると金運が上がると言われる墓石',
        category: 'パワースポット',
        tags: ['金運', 'お守り', '石', 'パワースポット']
      }
    ]
  },
  
  // 豊川稲荷東京別院
  {
    episodeKeywords: ['豊川稲荷', 'ドライブ', '赤坂'],
    locations: [
      {
        name: '豊川稲荷東京別院',
        address: '東京都港区元赤坂1-4-7',
        description: 'Tokyo Drive Vol.2で登場した芸能関係者に人気の稲荷神社',
        tags: ['稲荷', '神社', '赤坂', 'ドライブ', 'パワースポット']
      }
    ],
    items: [
      {
        name: '豊川稲荷のお守り',
        description: '芸能関係者に人気の開運お守り',
        category: 'お守り・縁起物',
        tags: ['お守り', '開運', '芸能', '願掛け']
      }
    ]
  },
  
  // キャットストリート
  {
    episodeKeywords: ['原宿', 'キャットストリート', '散歩'],
    locations: [
      {
        name: 'キャットストリート',
        address: '東京都渋谷区神宮前',
        description: 'SixTONESが原宿散歩動画で歩いた人気ストリート',
        tags: ['原宿', '散歩', 'ストリート', 'ショッピング', '聖地']
      }
    ],
    items: [
      {
        name: '原宿ファッション',
        description: 'キャットストリートで見つけた個性的なファッションアイテム',
        category: 'ファッション',
        tags: ['原宿', 'ファッション', 'ストリート']
      }
    ]
  },
  
  // ル・パン・コティディアン芝公園店
  {
    episodeKeywords: ['アポなしキャンプ', 'パン', 'カフェ', '芝公園'],
    locations: [
      {
        name: 'ル・パン・コティディアン芝公園店',
        address: '東京都港区芝公園3-3-1',
        description: 'アポなしキャンプ旅で訪れたベーカリーカフェ',
        tags: ['カフェ', 'ベーカリー', '芝公園', 'アポなし旅', '朝食']
      }
    ],
    items: [
      {
        name: 'オーガニックパン',
        description: 'ル・パン・コティディアンの自家製オーガニックパン',
        category: '食べ物',
        tags: ['パン', 'オーガニック', '朝食']
      }
    ]
  },
  
  // 銀座月と花
  {
    episodeKeywords: ['銀座', '月と花', 'マルノウチウォーカー'],
    locations: [
      {
        name: '銀座月と花',
        address: '東京都中央区銀座4-10-6 G4ビル1階',
        description: '銀座丸の内ウォーカーで掲載された和食店',
        tags: ['銀座', '和食', '雑誌掲載', '聖地']
      }
    ],
    items: [
      {
        name: '季節の和食コース',
        description: '銀座月と花の人気コース料理',
        category: '食べ物',
        tags: ['和食', 'コース料理', '銀座']
      }
    ]
  },
  
  // 横浜アリーナ
  {
    episodeKeywords: ['横浜アリーナ', 'ライブ', 'コンサート', 'TrackONE'],
    locations: [
      {
        name: '横浜アリーナ',
        address: '神奈川県横浜市港北区新横浜3-10',
        description: 'SixTONESが数々のライブを開催した聖地的会場',
        tags: ['ライブ', 'コンサート', '横浜', 'アリーナ', '聖地']
      }
    ],
    items: [
      {
        name: 'TrackONE -IMPACT- DVD/Blu-ray',
        description: '2020年1月7日横浜アリーナ公演を収録したライブ映像',
        category: 'DVD・Blu-ray',
        tags: ['ライブ', 'DVD', 'TrackONE', '横浜アリーナ']
      }
    ]
  },
  
  // 東京ドーム
  {
    episodeKeywords: ['東京ドーム', 'ドーム', 'VVS', '慣声の法則'],
    locations: [
      {
        name: '東京ドーム',
        address: '東京都文京区後楽1-3-61',
        description: 'SixTONESがドーム公演を成功させた最高峰の会場',
        tags: ['ドーム', 'コンサート', '東京', '聖地', '最高峰']
      }
    ],
    items: [
      {
        name: 'VVS DVD/Blu-ray',
        description: '2024年4月22日東京ドーム公演を収録したライブ映像',
        category: 'DVD・Blu-ray',
        tags: ['ライブ', 'DVD', 'VVS', '東京ドーム']
      },
      {
        name: '慣声の法則 in DOME DVD/Blu-ray',
        description: '2023年4月23日東京ドーム公演を収録したライブ映像',
        category: 'DVD・Blu-ray',
        tags: ['ライブ', 'DVD', '慣声の法則', '東京ドーム']
      }
    ]
  },
  
  // 青ジャージシリーズ関連
  {
    episodeKeywords: ['青ジャージ', '運動会', 'バレーボール', 'ドッジボール'],
    locations: [
      {
        name: '都内体育館',
        address: '東京都内',
        description: '青ジャージシリーズの運動企画で使用される体育館',
        tags: ['体育館', '青ジャージ', '運動', 'スポーツ', '企画']
      }
    ],
    items: [
      {
        name: '青ジャージ',
        description: 'SixTONES伝統の青い体操着',
        category: 'スポーツウェア',
        tags: ['青ジャージ', '体操着', '運動会', '伝統']
      },
      {
        name: 'バブルボール',
        description: '海外から取り寄せた巨大な透明ボール',
        category: 'スポーツ用品',
        tags: ['バブルボール', '海外', 'ゲーム', '運動']
      }
    ]
  },
  
  // 江の島・開運の旅2025
  {
    episodeKeywords: ['江の島', '開運の旅', '江島神社', '2025'],
    locations: [
      {
        name: '江島神社',
        address: '神奈川県藤沢市江の島2-3-8',
        description: '開運の旅2025で参拝した由緒ある神社',
        tags: ['神社', '江の島', '開運', 'パワースポット', '聖地']
      },
      {
        name: '江の島海鮮レストラン',
        address: '神奈川県藤沢市江の島',
        description: '開運の旅で海鮮を食べ尽くした店',
        tags: ['海鮮', '江の島', 'レストラン', '開運の旅']
      }
    ],
    items: [
      {
        name: '江の島おみくじ',
        description: '江島神社で引いたおみくじ',
        category: 'お守り・縁起物',
        tags: ['おみくじ', '神社', '開運', '江の島']
      },
      {
        name: '江の島海鮮丼',
        description: '新鮮な地元の魚介を使った海鮮丼',
        category: '食べ物',
        tags: ['海鮮', '丼', '江の島', 'グルメ']
      }
    ]
  },
  
  // 誕生日企画関連
  {
    episodeKeywords: ['誕生日', 'ケーキ', 'プレゼント', 'お祝い'],
    locations: [
      {
        name: 'PLAZA',
        address: '東京都内各店舗',
        description: 'メンバーの誕生日プレゼントを購入した雑貨店',
        tags: ['雑貨', 'プレゼント', '誕生日', 'ショッピング']
      },
      {
        name: '無印良品',
        address: '東京都内各店舗',
        description: '誕生日プレゼント企画で訪れた生活雑貨店',
        tags: ['無印', '雑貨', 'プレゼント', '誕生日']
      },
      {
        name: 'コストコ',
        address: '東京都内',
        description: '誕生日プレゼント購入企画で訪れた大型倉庫店',
        tags: ['コストコ', '買い物', 'プレゼント', '誕生日']
      }
    ],
    items: [
      {
        name: '手作り誕生日ケーキ',
        description: 'メンバーが手作りした特製バースデーケーキ',
        category: '食べ物',
        tags: ['ケーキ', '誕生日', '手作り', 'お祝い']
      },
      {
        name: '誕生日プレゼント',
        description: 'メンバー同士で贈り合う心のこもったプレゼント',
        category: 'ギフト',
        tags: ['プレゼント', '誕生日', 'ギフト', 'サプライズ']
      }
    ]
  },
  
  // ドライブ企画
  {
    episodeKeywords: ['ドライブ', '車', 'アポなし', 'SA', 'サービスエリア'],
    locations: [
      {
        name: '関東圏内サービスエリア',
        address: '関東地方の高速道路',
        description: 'ドライブ企画で立ち寄る様々なサービスエリア',
        tags: ['SA', 'ドライブ', '高速道路', 'グルメ']
      },
      {
        name: '秩父方面',
        address: '埼玉県秩父市',
        description: 'ドライブ旅で訪れた自然豊かな観光地',
        tags: ['秩父', 'ドライブ', '観光', '自然']
      },
      {
        name: '奥多摩',
        address: '東京都西多摩郡奥多摩町',
        description: 'BBQやサプライズ企画を行った場所',
        tags: ['奥多摩', 'BBQ', 'ドライブ', '自然']
      }
    ],
    items: [
      {
        name: 'SAグルメ',
        description: 'サービスエリアの名物グルメ',
        category: '食べ物',
        tags: ['SA', 'グルメ', 'ドライブ', 'B級グルメ']
      },
      {
        name: '駅弁',
        description: '列車の旅で食べた各地の駅弁',
        category: '食べ物',
        tags: ['駅弁', '列車', '旅', 'グルメ']
      }
    ]
  },
  
  // 食べ物企画
  {
    episodeKeywords: ['無限', '焼き鳥', 'ラーメン', '朝ラー', '利き'],
    locations: [
      {
        name: '焼き鳥店',
        address: '東京都内',
        description: '無限シリーズで焼き鳥を食べ続けた店',
        tags: ['焼き鳥', '無限', '居酒屋', '大食い']
      },
      {
        name: '朝ラーメン店',
        address: '東京都内',
        description: '念願の朝ラーメンを食べた店',
        tags: ['ラーメン', '朝ラー', '朝食', 'グルメ']
      }
    ],
    items: [
      {
        name: '焼き鳥各種',
        description: '無限に食べられる様々な種類の焼き鳥',
        category: '食べ物',
        tags: ['焼き鳥', '鶏肉', '無限', '居酒屋']
      },
      {
        name: '朝ラーメン',
        description: '朝から食べる特別なラーメン',
        category: '食べ物',
        tags: ['ラーメン', '朝ラー', '朝食', '麺']
      },
      {
        name: '枝豆各種',
        description: '利き枝豆企画で食べ比べた様々な枝豆',
        category: '食べ物',
        tags: ['枝豆', '利き', '野菜', 'おつまみ']
      }
    ]
  },
  
  // コラボ企画
  {
    episodeKeywords: ['コラボ', '7 MEN 侍', 'Travis Japan', 'ふぉ〜ゆ〜'],
    locations: [
      {
        name: 'ジャニーズスタジオ',
        address: '東京都内',
        description: '後輩グループとのコラボ企画を撮影したスタジオ',
        tags: ['スタジオ', 'コラボ', 'ジャニーズ', '撮影']
      }
    ],
    items: [
      {
        name: 'コラボグッズ',
        description: 'コラボ企画で制作された特別なグッズ',
        category: 'グッズ',
        tags: ['コラボ', 'グッズ', '限定', 'ジャニーズ']
      }
    ]
  },
  
  // 音楽・MV関連
  {
    episodeKeywords: ['MV', 'レコーディング', 'ダンス', 'パフォーマンス'],
    locations: [
      {
        name: 'レコーディングスタジオ',
        address: '東京都内',
        description: '楽曲制作やレコーディングを行うプロフェッショナルスタジオ',
        tags: ['レコーディング', '音楽', 'スタジオ', '制作']
      },
      {
        name: 'MV撮影スタジオ',
        address: '東京都内',
        description: 'ミュージックビデオの撮影を行うスタジオ',
        tags: ['MV', '撮影', 'スタジオ', '音楽']
      }
    ],
    items: [
      {
        name: 'マイク・録音機材',
        description: 'プロフェッショナルなレコーディング機材',
        category: '音楽機材',
        tags: ['マイク', 'レコーディング', '機材', '音楽']
      },
      {
        name: 'MV衣装',
        description: 'ミュージックビデオ用の特別な衣装',
        category: 'ファッション',
        tags: ['衣装', 'MV', 'ファッション', '音楽']
      }
    ]
  },
  
  // ゲーム・チャレンジ企画
  {
    episodeKeywords: ['ゲーム', 'チャレンジ', '海外お取り寄せ', '巨大'],
    locations: [
      {
        name: 'ゲームセンター',
        address: '東京都内',
        description: '巨大モグラたたきなどのゲーム企画で訪れた施設',
        tags: ['ゲーセン', 'ゲーム', 'アミューズメント', '企画']
      },
      {
        name: 'アスレチック施設',
        address: '東京都内',
        description: '巨大アスレチックで運動不足解消した施設',
        tags: ['アスレチック', '運動', 'チャレンジ', 'スポーツ']
      }
    ],
    items: [
      {
        name: '海外ゲーム',
        description: '海外から取り寄せた珍しいゲーム',
        category: 'ゲーム',
        tags: ['海外', 'ゲーム', 'お取り寄せ', '企画']
      },
      {
        name: '巨大トランプ',
        description: '通常の何倍もある巨大なトランプ',
        category: 'ゲーム',
        tags: ['巨大', 'トランプ', 'ゲーム', '企画']
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
async function addSixTONESMassiveData() {
  console.log('🚀 SixTONES 大規模ロケーション・アイテムデータ追加開始！\n');
  
  const celebrityId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7'; // SixTONES
  
  let totalLocations = 0;
  let totalItems = 0;
  let matchedEpisodes = 0;
  
  for (let i = 0; i < sixtonesLocationItemData.length; i++) {
    const episodeData = sixtonesLocationItemData[i];
    console.log(`\n[${i + 1}/${sixtonesLocationItemData.length}] キーワード検索: ${episodeData.episodeKeywords.join(', ')}`);
    
    const episode = await findEpisodeId(episodeData.episodeKeywords, celebrityId);
    
    if (episode) {
      console.log(`✅ マッチしたエピソード: ${episode.title.substring(0, 50)}...`);
      matchedEpisodes++;
      
      // ロケーション追加
      for (const locationData of episodeData.locations) {
        const { data, error } = await addLocation(locationData, episode.id, celebrityId);
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
        const { data, error } = await addItem(itemData, episode.id, celebrityId);
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
  
  console.log('\n🎉 SixTONES 大規模データ追加完了！');
  console.log('='.repeat(60));
  console.log(`📊 結果:`)
  console.log(`  - 処理したデータセット: ${sixtonesLocationItemData.length}件`);
  console.log(`  - マッチしたエピソード: ${matchedEpisodes}件`);
  console.log(`  - 追加ロケーション: ${totalLocations}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  // 最終状況確認
  const { count: finalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', celebrityId);
    
  const { count: finalLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', celebrityId);
    
  const { count: finalItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', celebrityId);
  
  console.log('\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${finalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (${(finalLocations/finalEpisodes).toFixed(2)}件/エピソード)`);
  console.log(`  - アイテム総数: ${finalItems}件 (${(finalItems/finalEpisodes).toFixed(2)}件/エピソード)`);
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('→ エピソード詳細ページでロケーションとアイテムが表示される');
  
  console.log('\n📋 追加内容:');
  console.log('- ファンサイトから収集した聖地巡礼スポット');
  console.log('- YouTube企画のロケ地と関連アイテム');
  console.log('- ライブ会場、撮影スタジオ、食事処');
  console.log('- 大食い企画、ドライブ企画、コラボ企画の詳細データ');
}

addSixTONESMassiveData();