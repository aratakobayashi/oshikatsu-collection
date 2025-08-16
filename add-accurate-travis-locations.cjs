const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 調査で特定した正確なロケーション・アイテムデータ
const accurateTravisData = [
  // 渋谷ハンバーグ店
  {
    episodeId: 'DFb-s8Mqs4k',
    episodeTitle: 'Travis Japan【渋谷ランチ】思い出のハンバーグ店',
    locations: [
      {
        name: '極味や 渋谷パルコ店',
        address: '東京都渋谷区宇田川町15-1 渋谷PARCO B1F',
        description: '自分で焼く新感覚ハンバーグ店。ライス・サラダ・スープ・ソフトクリーム食べ放題。福岡発の人気店が2019年に東京初出店。',
        phone: '03-5422-3122',
        business_hours: '11:30-22:00',
        website: 'https://tabelog.com/tokyo/A1303/A130301/13241227/',
        tags: ['渋谷', 'パルコ', 'ハンバーグ', '極味や', '自分で焼く', '食べ放題', 'Travis Japan', 'ランチ']
      }
    ],
    items: [
      {
        name: '極味やハンバーグ',
        description: '鉄板で自分好みの焼き加減に調整できる新感覚ハンバーグ',
        category: 'ハンバーグ',
        tags: ['ハンバーグ', '極味や', '自分で焼く', '鉄板', 'メイン料理']
      },
      {
        name: 'ライス食べ放題',
        description: '極味やのハンバーグセットに含まれるライス食べ放題',
        category: '主食',
        tags: ['ライス', '食べ放題', 'ご飯', '主食', '極味や']
      },
      {
        name: 'サラダ食べ放題',
        description: '極味やのサラダバー食べ放題',
        category: 'サラダ',
        tags: ['サラダ', '食べ放題', '野菜', 'サラダバー', '極味や']
      },
      {
        name: 'スープ食べ放題',
        description: '極味やのスープ食べ放題',
        category: 'スープ',
        tags: ['スープ', '食べ放題', '汁物', '極味や']
      },
      {
        name: 'ソフトクリーム食べ放題',
        description: '極味やのデザート・ソフトクリーム食べ放題',
        category: 'デザート',
        tags: ['ソフトクリーム', '食べ放題', 'デザート', 'アイス', '極味や']
      }
    ]
  },

  // ステーキチャレンジ店
  {
    episodeId: 'ynqNPi5O8sI',
    episodeTitle: 'Travis Japan【大食い検証】1.5kgステーキ',
    locations: [
      {
        name: 'ステーキハウス リベラ 目黒店',
        address: '東京都目黒区下目黒6-17-20',
        description: '1.5kgステーキチャレンジで有名なステーキハウス。1ポンドステーキ×3枚+ライス大盛り×3を30分以内に完食するチャレンジがある。',
        phone: '03-3793-9955',
        business_hours: '17:00～24:00（L.O.23:30）',
        website: 'https://tabelog.com/tokyo/A1316/A131601/13003855/',
        tags: ['目黒', 'ステーキ', 'リベラ', '大食いチャレンジ', '1.5kg', 'Travis Japan', '吉澤閑也']
      },
      {
        name: 'ステーキハウス リベラ 五反田店（本店）',
        address: '東京都品川区東五反田3-6-18',
        description: 'ステーキハウス リベラの本店。大食いチャレンジでも有名。',
        phone: '03-3446-6941',
        business_hours: '18:00～22:30',
        website: 'https://tabelog.com/tokyo/A1316/A131603/13003854/',
        tags: ['五反田', 'ステーキ', 'リベラ', '本店', '大食いチャレンジ', 'Travis Japan']
      }
    ],
    items: [
      {
        name: '1ポンドステーキ×3枚',
        description: 'リベラの大食いチャレンジメニュー。1ポンド（約450g）×3枚=約1.35kg',
        category: 'ステーキ',
        tags: ['1ポンドステーキ', 'ステーキ', '大食いチャレンジ', 'リベラ', '肉料理']
      },
      {
        name: 'ライス大盛り×3',
        description: 'ステーキチャレンジに含まれるライス大盛り3杯',
        category: '主食',
        tags: ['ライス', '大盛り', '主食', 'チャレンジ', 'リベラ']
      },
      {
        name: 'チャレンジ賞金10,000円',
        description: '30分以内完食成功時の賞金',
        category: 'チャレンジ特典',
        tags: ['賞金', 'チャレンジ', '10000円', '特典', 'リベラ']
      },
      {
        name: 'チャレンジ料金免除（9,900円）',
        description: '30分以内完食成功時の料金免除',
        category: 'チャレンジ特典',
        tags: ['料金免除', 'チャレンジ', '9900円', '特典', 'リベラ']
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
  
  // 詳細情報をdescriptionに含める
  const fullDescription = `${locationData.description}${locationData.phone ? `\n電話: ${locationData.phone}` : ''}${locationData.business_hours ? `\n営業時間: ${locationData.business_hours}` : ''}${locationData.website ? `\nWebサイト: ${locationData.website}` : ''}`;
  
  const location = {
    id: crypto.randomUUID(),
    name: locationData.name,
    slug: slug,
    address: locationData.address,
    description: fullDescription,
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
async function addAccurateTravisLocations() {
  console.log('🎯 Travis Japan 正確なロケーション・アイテムデータの追加開始！\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  
  let totalLocations = 0;
  let totalItems = 0;
  let processedEpisodes = 0;
  
  for (const episodeData of accurateTravisData) {
    console.log(`\n🎬 ${episodeData.episodeTitle} (${episodeData.episodeId})`);
    
    // エピソード存在確認
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', episodeData.episodeId);
    
    const episode = episodes && episodes.length > 0 ? episodes[0] : null;
    
    if (!episode) {
      console.log('⚠️ エピソードがデータベースに存在しません');
      continue;
    }
    
    console.log(`✅ エピソード確認: ${episode.title.substring(0, 50)}...`);
    processedEpisodes++;
    
    // ロケーション追加
    console.log(`\n📍 ロケーション追加（${episodeData.locations.length}件）:`);
    for (const locationData of episodeData.locations) {
      const { data, error } = await addLocation(locationData, episode.id, travisJapanId);
      if (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⚠️ ロケーション既存: ${locationData.name}`);
        } else {
          console.error(`❌ ロケーション追加エラー: ${error.message}`);
        }
      } else {
        console.log(`✅ ${locationData.name}`);
        console.log(`   📍 ${locationData.address}`);
        console.log(`   📞 ${locationData.phone || 'なし'}`);
        console.log(`   🕒 ${locationData.business_hours || 'なし'}`);
        console.log(`   🌐 ${locationData.website || 'なし'}`);
        totalLocations++;
      }
    }
    
    // アイテム追加
    console.log(`\n🛍️ アイテム追加（${episodeData.items.length}件）:`);
    for (const itemData of episodeData.items) {
      const { data, error } = await addItem(itemData, episode.id, travisJapanId);
      if (error) {
        if (error.message.includes('duplicate')) {
          console.log(`⚠️ アイテム既存: ${itemData.name}`);
        } else {
          console.error(`❌ アイテム追加エラー: ${error.message}`);
        }
      } else {
        console.log(`✅ ${itemData.name} (${itemData.category})`);
        totalItems++;
      }
    }
  }
  
  console.log('\n🎉 正確なデータ追加完了！');
  console.log('='.repeat(70));
  console.log(`📊 追加結果:`);
  console.log(`  - 処理対象エピソード: ${accurateTravisData.length}件`);
  console.log(`  - 成功処理エピソード: ${processedEpisodes}件`);
  console.log(`  - 追加ロケーション: ${totalLocations}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  // Travis Japan最終状況確認
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
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${finalEpisodes > 0 ? (finalLocations/finalEpisodes).toFixed(3) : '0.000'})`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${finalEpisodes > 0 ? (finalItems/finalEpisodes).toFixed(3) : '0.000'})`);
  
  console.log('\n🏪 追加された店舗:');
  console.log('1. 極味や 渋谷パルコ店 - 自分で焼くハンバーグ店');
  console.log('   📍 東京都渋谷区宇田川町15-1 渋谷PARCO B1F');
  console.log('   📞 03-5422-3122');
  console.log('   🌐 食べログ: https://tabelog.com/tokyo/A1303/A130301/13241227/');
  
  console.log('\n2. ステーキハウス リベラ 目黒店 - 1.5kgステーキチャレンジ');
  console.log('   📍 東京都目黒区下目黒6-17-20');
  console.log('   📞 03-3793-9955');
  console.log('   🌐 食べログ: https://tabelog.com/tokyo/A1316/A131601/13003855/');
  
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ 具体的な店舗情報でユーザーが実際に訪問可能');
}

addAccurateTravisLocations();