const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// マッチングルール定義
const matchingRules = {
  'よにのちゃんねる': [
    {
      locationKeywords: ['スターバックス', '渋谷スカイ'],
      episodeKeywords: ['渋谷', 'スカイ', 'スタバ', 'カフェ'],
      description: '渋谷スカイのスターバックス関連'
    },
    {
      locationKeywords: ['築地本願寺', 'Tsumugi'],
      episodeKeywords: ['築地', '本願寺', 'カフェ', '寺'],
      description: '築地本願寺カフェ関連'
    },
    {
      locationKeywords: ['ポール・ボキューズ', '西新宿'],
      episodeKeywords: ['フレンチ', '新宿', 'ボキューズ', 'レストラン'],
      description: 'フレンチレストラン関連'
    },
    {
      locationKeywords: ['Blue Seal', 'アメリカンビレッジ'],
      episodeKeywords: ['沖縄', 'ブルーシール', 'アイス'],
      description: '沖縄・ブルーシール関連'
    },
    {
      locationKeywords: ['西公園'],
      episodeKeywords: ['公園', '散歩', '外'],
      description: '公園・屋外撮影関連'
    }
  ],
  'SixTONES': [
    {
      locationKeywords: ['銀座三越', 'ギンザシックス', 'ティファニー', 'ルイ・ヴィトン', '銀座'],
      episodeKeywords: ['銀座', 'ショッピング', '買い物', 'ブランド'],
      description: '銀座ショッピング関連'
    },
    {
      locationKeywords: ['ラーメン'],
      episodeKeywords: ['ラーメン', '麺', '食べる'],
      description: 'ラーメン企画関連'
    },
    {
      locationKeywords: ['アポなし', '旅'],
      episodeKeywords: ['アポなし', '旅', 'ドライブ'],
      description: 'アポなし旅関連'
    }
  ],
  'Travis Japan': [
    {
      locationKeywords: ['ベニスビーチ', 'グリフィス天文台', 'ロデオドライブ', 'ハリウッドサイン', 'LA', 'ロサンゼルス'],
      episodeKeywords: ['LA', 'ロサンゼルス', 'アメリカ', 'ハリウッド', '観光'],
      description: 'LA/ロサンゼルス関連'
    },
    {
      locationKeywords: ['ディズニー'],
      episodeKeywords: ['ディズニー', 'ディズニーランド', '夢の国'],
      description: 'ディズニーランド関連'
    },
    {
      locationKeywords: ['上海'],
      episodeKeywords: ['上海', '中国', 'Shanghai'],
      description: '上海関連'
    },
    {
      locationKeywords: ['渋谷'],
      episodeKeywords: ['渋谷', 'ランチ', '食事'],
      description: '渋谷関連'
    }
  ]
};

// アイテムマッチングルール
const itemMatchingRules = {
  'よにのちゃんねる': [
    {
      itemKeywords: ['ユニクロ', 'ヒートテック'],
      episodeKeywords: ['ユニクロ', '服', 'ファッション', '買い物'],
      description: 'ユニクロ関連'
    },
    {
      itemKeywords: ['Supreme', 'Box Logo'],
      episodeKeywords: ['Supreme', 'ストリート', 'ファッション'],
      description: 'Supreme関連'
    },
    {
      itemKeywords: ['PORTER', 'TANKER'],
      episodeKeywords: ['バッグ', 'ポーター', 'カバン'],
      description: 'PORTER関連'
    },
    {
      itemKeywords: ['New Balance', '993'],
      episodeKeywords: ['スニーカー', 'ニューバランス', '靴'],
      description: 'スニーカー関連'
    },
    {
      itemKeywords: ['G-SHOCK'],
      episodeKeywords: ['時計', 'G-SHOCK', 'ウォッチ'],
      description: '時計関連'
    }
  ],
  'SixTONES': [
    {
      itemKeywords: ['ルイ・ヴィトン', 'ティファニー', 'エルメス', 'バレンシアガ'],
      episodeKeywords: ['銀座', 'ブランド', 'ショッピング', '高級'],
      description: '高級ブランド関連'
    }
  ],
  'Travis Japan': [
    {
      itemKeywords: ['Supreme', 'ナイキ', 'エアジョーダン', 'ヴァンズ'],
      episodeKeywords: ['ファッション', 'ストリート', '服', '買い物'],
      description: 'ストリートファッション関連'
    },
    {
      itemKeywords: ['Ray-Ban', 'サングラス'],
      episodeKeywords: ['LA', 'サングラス', 'アメリカ'],
      description: 'サングラス関連'
    }
  ]
};

// エピソードとのマッチング処理
async function findMatchingEpisode(name, keywords, celebrityId) {
  for (const keyword of keywords) {
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', celebrityId)
      .ilike('title', `%${keyword}%`)
      .limit(5);
    
    if (episodes && episodes.length > 0) {
      // 最も関連性の高いエピソードを選択
      return episodes[0];
    }
  }
  return null;
}

// 孤立ロケーションを紐づけ
async function linkOrphanLocations(celebrityId, celebrityName) {
  console.log(`\n📍 ${celebrityName}の孤立ロケーションを紐づけ中...`);
  
  // 孤立ロケーション取得
  const { data: orphanLocations } = await supabase
    .from('locations')
    .select('id, name')
    .eq('celebrity_id', celebrityId)
    .is('episode_id', null);
  
  if (!orphanLocations || orphanLocations.length === 0) {
    console.log('  孤立ロケーションなし');
    return { linked: 0, failed: 0 };
  }
  
  let linked = 0;
  let failed = 0;
  const rules = matchingRules[celebrityName] || [];
  
  for (const location of orphanLocations) {
    let matched = false;
    
    // ルールベースでマッチング
    for (const rule of rules) {
      const locationMatches = rule.locationKeywords.some(keyword => 
        location.name.includes(keyword)
      );
      
      if (locationMatches) {
        const episode = await findMatchingEpisode(
          location.name, 
          rule.episodeKeywords, 
          celebrityId
        );
        
        if (episode) {
          // エピソードIDを更新
          const { error } = await supabase
            .from('locations')
            .update({ episode_id: episode.id })
            .eq('id', location.id);
          
          if (!error) {
            console.log(`  ✅ 紐づけ成功: ${location.name} → ${episode.title.substring(0, 30)}...`);
            linked++;
            matched = true;
            break;
          }
        }
      }
    }
    
    if (!matched) {
      console.log(`  ⚠️ 紐づけ失敗: ${location.name} (適切なエピソードが見つかりません)`);
      failed++;
    }
  }
  
  return { linked, failed };
}

// 孤立アイテムを紐づけ
async function linkOrphanItems(celebrityId, celebrityName) {
  console.log(`\n🛍️ ${celebrityName}の孤立アイテムを紐づけ中...`);
  
  // 孤立アイテム取得
  const { data: orphanItems } = await supabase
    .from('items')
    .select('id, name')
    .eq('celebrity_id', celebrityId)
    .is('episode_id', null);
  
  if (!orphanItems || orphanItems.length === 0) {
    console.log('  孤立アイテムなし');
    return { linked: 0, failed: 0 };
  }
  
  let linked = 0;
  let failed = 0;
  const rules = itemMatchingRules[celebrityName] || [];
  
  for (const item of orphanItems) {
    let matched = false;
    
    // ルールベースでマッチング
    for (const rule of rules) {
      const itemMatches = rule.itemKeywords.some(keyword => 
        item.name.includes(keyword)
      );
      
      if (itemMatches) {
        const episode = await findMatchingEpisode(
          item.name, 
          rule.episodeKeywords, 
          celebrityId
        );
        
        if (episode) {
          // エピソードIDを更新
          const { error } = await supabase
            .from('items')
            .update({ episode_id: episode.id })
            .eq('id', item.id);
          
          if (!error) {
            console.log(`  ✅ 紐づけ成功: ${item.name} → ${episode.title.substring(0, 30)}...`);
            linked++;
            matched = true;
            break;
          }
        }
      }
    }
    
    if (!matched) {
      console.log(`  ⚠️ 紐づけ失敗: ${item.name} (適切なエピソードが見つかりません)`);
      failed++;
    }
  }
  
  return { linked, failed };
}

// メイン処理
async function linkOrphanData() {
  console.log('🔗 孤立データのエピソード紐づけ開始！');
  console.log('='.repeat(80));
  
  const celebrities = [
    { name: 'よにのちゃんねる', id: 'UC2alHD2WkakOiTxCxF-uMAg' },
    { name: 'SixTONES', id: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7' },
    { name: 'Travis Japan', id: '46ccba0d-742f-4152-9d87-f10cefadbb6d' }
  ];
  
  let totalStats = {
    locationsLinked: 0,
    locationsFailed: 0,
    itemsLinked: 0,
    itemsFailed: 0
  };
  
  for (const celebrity of celebrities) {
    console.log(`\n🎭 ${celebrity.name} の処理`);
    console.log('-'.repeat(50));
    
    // ロケーション紐づけ
    const locStats = await linkOrphanLocations(celebrity.id, celebrity.name);
    totalStats.locationsLinked += locStats.linked;
    totalStats.locationsFailed += locStats.failed;
    
    // アイテム紐づけ
    const itemStats = await linkOrphanItems(celebrity.id, celebrity.name);
    totalStats.itemsLinked += itemStats.linked;
    totalStats.itemsFailed += itemStats.failed;
    
    console.log(`\n📊 ${celebrity.name} 結果:`);
    console.log(`  ロケーション: ${locStats.linked}件成功 / ${locStats.failed}件失敗`);
    console.log(`  アイテム: ${itemStats.linked}件成功 / ${itemStats.failed}件失敗`);
  }
  
  console.log('\n🎊 全体結果サマリー');
  console.log('='.repeat(80));
  console.log(`📍 ロケーション紐づけ:`);
  console.log(`  ✅ 成功: ${totalStats.locationsLinked}件`);
  console.log(`  ❌ 失敗: ${totalStats.locationsFailed}件`);
  console.log(`🛍️ アイテム紐づけ:`);
  console.log(`  ✅ 成功: ${totalStats.itemsLinked}件`);
  console.log(`  ❌ 失敗: ${totalStats.itemsFailed}件`);
  
  const totalLinked = totalStats.locationsLinked + totalStats.itemsLinked;
  const totalFailed = totalStats.locationsFailed + totalStats.itemsFailed;
  console.log(`\n🎯 合計: ${totalLinked}件の孤立データを紐づけ成功！`);
  
  if (totalFailed > 0) {
    console.log(`⚠️ ${totalFailed}件は適切なエピソードが見つからず紐づけ失敗`);
    console.log('   → より詳細なキーワードマッチングが必要です');
  }
}

linkOrphanData();