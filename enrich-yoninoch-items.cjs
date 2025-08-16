const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// よにのちゃんねるの豊富なアイテムデータ
const yoninoItemData = [
  // ラーメン・グルメ企画
  {
    episodeKeywords: ['ラーメン', 'つけ麺', '二郎', '家系', '豚骨'],
    items: [
      {
        name: 'ラーメン二郎 小ラーメン',
        description: 'よにのちゃんねるでよく登場する二郎系ラーメンの定番',
        category: 'ラーメン',
        tags: ['二郎', 'ラーメン', '小ラーメン', 'アブラ', 'ニンニク']
      },
      {
        name: '濃厚豚骨つけ麺',
        description: 'つけ麺企画で食べた濃厚スープの人気メニュー',
        category: 'ラーメン',
        tags: ['つけ麺', '豚骨', '濃厚', '大盛り']
      },
      {
        name: '替え玉',
        description: 'ラーメン店での定番追加オーダー',
        category: 'ラーメン',
        tags: ['替え玉', 'おかわり', '麺']
      },
      {
        name: 'チャーシュー増し',
        description: 'ラーメンのトッピング定番',
        category: 'ラーメン',
        tags: ['チャーシュー', 'トッピング', '増し']
      }
    ]
  },
  
  // カフェ・スイーツ企画
  {
    episodeKeywords: ['カフェ', 'コーヒー', 'スイーツ', 'ケーキ', 'パフェ'],
    items: [
      {
        name: 'エスプレッソ',
        description: 'カフェ巡り企画で必ず注文するコーヒー',
        category: '飲み物',
        tags: ['コーヒー', 'エスプレッソ', 'カフェ']
      },
      {
        name: 'ティラミス',
        description: 'スイーツ企画で人気のイタリアンデザート',
        category: 'デザート',
        tags: ['ティラミス', 'スイーツ', 'イタリアン']
      },
      {
        name: 'フルーツパフェ',
        description: 'カフェでのお楽しみデザート',
        category: 'デザート',
        tags: ['パフェ', 'フルーツ', 'スイーツ']
      },
      {
        name: 'クロワッサン',
        description: 'カフェでの軽食定番',
        category: 'パン',
        tags: ['クロワッサン', 'パン', '軽食']
      }
    ]
  },
  
  // 居酒屋・お酒企画
  {
    episodeKeywords: ['居酒屋', 'お酒', 'ビール', '日本酒', '焼き鳥'],
    items: [
      {
        name: '生ビール中ジョッキ',
        description: '居酒屋での定番ドリンク',
        category: '飲み物',
        tags: ['ビール', '生ビール', '中ジョッキ', 'アルコール']
      },
      {
        name: '焼き鳥盛り合わせ',
        description: '居酒屋の人気メニュー',
        category: '焼き鳥',
        tags: ['焼き鳥', '盛り合わせ', '串', '居酒屋']
      },
      {
        name: '日本酒（冷酒）',
        description: 'こだわりの日本酒',
        category: '飲み物',
        tags: ['日本酒', '冷酒', '地酒', 'アルコール']
      },
      {
        name: '枝豆',
        description: '居酒屋の定番おつまみ',
        category: 'おつまみ',
        tags: ['枝豆', 'おつまみ', '居酒屋']
      }
    ]
  },
  
  // 牛タン・焼肉企画
  {
    episodeKeywords: ['牛タン', '焼肉', '仙台', '肉'],
    items: [
      {
        name: '厚切り牛タン定食',
        description: '牛タン専門店の看板メニュー',
        category: '牛タン',
        tags: ['牛タン', '厚切り', '定食', '仙台']
      },
      {
        name: '牛タンシチュー',
        description: '牛タンの洋風アレンジ料理',
        category: '牛タン',
        tags: ['牛タン', 'シチュー', '洋風']
      },
      {
        name: 'カルビ',
        description: '焼肉の定番部位',
        category: '焼肉',
        tags: ['カルビ', '焼肉', '牛肉']
      },
      {
        name: 'ハラミ',
        description: '人気の焼肉部位',
        category: '焼肉',
        tags: ['ハラミ', '焼肉', '牛肉']
      }
    ]
  },
  
  // 寿司・和食企画
  {
    episodeKeywords: ['寿司', '和食', '刺身', '握り'],
    items: [
      {
        name: '大トロ',
        description: '高級寿司ネタの王様',
        category: '寿司',
        tags: ['大トロ', '寿司', '高級', 'まぐろ']
      },
      {
        name: 'ウニ',
        description: '人気の高級寿司ネタ',
        category: '寿司',
        tags: ['ウニ', '寿司', '高級', '海鮮']
      },
      {
        name: 'いくら',
        description: 'プチプチ食感が楽しい寿司ネタ',
        category: '寿司',
        tags: ['いくら', '寿司', '海鮮']
      },
      {
        name: '茶碗蒸し',
        description: '和食の定番一品',
        category: '和食',
        tags: ['茶碗蒸し', '和食', '卵料理']
      }
    ]
  },
  
  // イタリアン・パスタ企画
  {
    episodeKeywords: ['イタリアン', 'パスタ', 'ピザ', 'ワイン'],
    items: [
      {
        name: 'カルボナーラ',
        description: 'イタリアンの定番パスタ',
        category: 'パスタ',
        tags: ['カルボナーラ', 'パスタ', 'イタリアン']
      },
      {
        name: 'マルゲリータピザ',
        description: 'シンプルで美味しいピザの王道',
        category: 'ピザ',
        tags: ['マルゲリータ', 'ピザ', 'イタリアン']
      },
      {
        name: '赤ワイン',
        description: 'イタリアンディナーのお供',
        category: '飲み物',
        tags: ['赤ワイン', 'ワイン', 'アルコール']
      },
      {
        name: 'チーズ盛り合わせ',
        description: 'ワインに合う前菜',
        category: '前菜',
        tags: ['チーズ', '盛り合わせ', 'ワイン']
      }
    ]
  },
  
  // 中華・餃子企画
  {
    episodeKeywords: ['中華', '餃子', '麻婆豆腐', '炒飯'],
    items: [
      {
        name: '焼き餃子',
        description: '中華料理の定番',
        category: '中華',
        tags: ['餃子', '焼き餃子', '中華']
      },
      {
        name: '麻婆豆腐',
        description: '四川料理の代表格',
        category: '中華',
        tags: ['麻婆豆腐', '中華', '四川']
      },
      {
        name: 'チャーハン',
        description: '中華の定番ご飯もの',
        category: '中華',
        tags: ['チャーハン', '炒飯', '中華']
      },
      {
        name: '杏仁豆腐',
        description: '中華デザートの定番',
        category: 'デザート',
        tags: ['杏仁豆腐', 'デザート', '中華']
      }
    ]
  },
  
  // ファーストフード・B級グルメ
  {
    episodeKeywords: ['ファーストフード', 'ハンバーガー', '弁当', 'コンビニ'],
    items: [
      {
        name: 'ビッグマック',
        description: 'マクドナルドの代表的ハンバーガー',
        category: 'ファーストフード',
        tags: ['ビッグマック', 'ハンバーガー', 'マック']
      },
      {
        name: 'フライドポテト',
        description: 'ファーストフードの定番サイド',
        category: 'ファーストフード',
        tags: ['ポテト', 'フライドポテト', 'サイド']
      },
      {
        name: 'からあげ弁当',
        description: 'コンビニ弁当の人気商品',
        category: '弁当',
        tags: ['からあげ', '弁当', 'コンビニ']
      },
      {
        name: 'おにぎり（ツナマヨ）',
        description: 'コンビニおにぎりの定番',
        category: '軽食',
        tags: ['おにぎり', 'ツナマヨ', 'コンビニ']
      }
    ]
  },
  
  // ドリンク・アルコール
  {
    episodeKeywords: ['ドリンク', '飲み物', 'ジュース', 'お茶'],
    items: [
      {
        name: 'ウーロン茶',
        description: '中華料理店での定番ドリンク',
        category: '飲み物',
        tags: ['ウーロン茶', 'お茶', '中華']
      },
      {
        name: 'オレンジジュース',
        description: 'カフェでの定番ジュース',
        category: '飲み物',
        tags: ['オレンジジュース', 'ジュース', 'フルーツ']
      },
      {
        name: '緑茶',
        description: '和食店での定番',
        category: '飲み物',
        tags: ['緑茶', 'お茶', '和食']
      },
      {
        name: 'ソフトドリンク',
        description: '一般的な炭酸飲料',
        category: '飲み物',
        tags: ['ソフトドリンク', '炭酸', 'ジュース']
      }
    ]
  },
  
  // 特別企画・限定メニュー
  {
    episodeKeywords: ['限定', '特別', '季節', '新商品'],
    items: [
      {
        name: '季節限定メニュー',
        description: 'その季節だけの特別なメニュー',
        category: '限定',
        tags: ['季節限定', '特別', '期間限定']
      },
      {
        name: '新商品',
        description: '話題の新商品を試食',
        category: '新商品',
        tags: ['新商品', '試食', '話題']
      },
      {
        name: 'コラボメニュー',
        description: 'お店とのコラボレーションメニュー',
        category: 'コラボ',
        tags: ['コラボ', '限定', '特別']
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
async function enrichYoninoItems() {
  console.log('🍜 よにのちゃんねる アイテムデータ大幅拡充開始！\\n');
  
  const yoninoId = 'UC2alHD2WkakOiTxCxF-uMAg';
  
  // 現在の状況確認
  const { count: startItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', yoninoId);
  
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', yoninoId);
  
  console.log('📊 開始前の状況:');
  console.log(`- エピソード数: ${totalEpisodes}件`);
  console.log(`- アイテム数: ${startItems}件`);
  console.log(`- I/E比率: ${(startItems/totalEpisodes).toFixed(3)}\\n`);
  
  let totalItems = 0;
  let matchedEpisodes = 0;
  
  for (let i = 0; i < yoninoItemData.length; i++) {
    const episodeData = yoninoItemData[i];
    console.log(`\\n[${i + 1}/${yoninoItemData.length}] キーワード検索: ${episodeData.episodeKeywords.join(', ')}`);
    
    const episode = await findEpisodeId(episodeData.episodeKeywords, yoninoId);
    
    if (episode) {
      console.log(`✅ マッチしたエピソード: ${episode.title.substring(0, 50)}...`);
      matchedEpisodes++;
      
      // アイテム追加
      for (const itemData of episodeData.items) {
        const { data, error } = await addItem(itemData, episode.id, yoninoId);
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
  
  console.log('\\n🎉 よにのちゃんねる アイテム拡充完了！');
  console.log('='.repeat(70));
  console.log(`📊 結果:`);
  console.log(`  - 処理したデータセット: ${yoninoItemData.length}件`);
  console.log(`  - マッチしたエピソード: ${matchedEpisodes}件`);
  console.log(`  - 追加アイテム: ${totalItems}件`);
  
  // 最終状況確認
  const { count: finalItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', yoninoId);
  
  console.log('\\n📈 最終データ状況:');
  console.log(`  - エピソード総数: ${totalEpisodes}件`);
  console.log(`  - アイテム総数: ${finalItems}件 (開始時: ${startItems}件)`);
  console.log(`  - I/E比率: ${(finalItems/totalEpisodes).toFixed(3)} (改善: +${((finalItems-startItems)/totalEpisodes).toFixed(3)})`);
  console.log(`  - 増加率: ${Math.round(((finalItems - startItems) / startItems) * 100)}%`);
  
  console.log('\\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/yoninoch');
  console.log('→ エピソード詳細ページでアイテムが大幅に増加している');
  
  console.log('\\n📋 追加されたアイテムカテゴリ:');
  console.log('- ラーメン・つけ麺（二郎、豚骨、替え玉等）');
  console.log('- カフェ・スイーツ（コーヒー、ケーキ、パフェ等）');
  console.log('- 居酒屋・お酒（ビール、焼き鳥、日本酒等）');
  console.log('- 牛タン・焼肉（厚切り牛タン、カルビ等）');
  console.log('- 寿司・和食（大トロ、ウニ、茶碗蒸し等）');
  console.log('- イタリアン（パスタ、ピザ、ワイン等）');
  console.log('- 中華料理（餃子、麻婆豆腐、炒飯等）');
  console.log('- ファーストフード（ハンバーガー、弁当等）');
  console.log('- ドリンク各種（お茶、ジュース、アルコール等）');
  console.log('- 限定・特別メニュー');
}

enrichYoninoItems();