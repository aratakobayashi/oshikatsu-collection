const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Travis Japanメンバー情報
const travisJapanMembers = [
  {
    name: '川島如恵留',
    slug: 'kawashima-noeru',
    birth_date: '1994-11-22',
    bio: 'Travis Japanのメンバー。メンバーカラーは白。最年長メンバー。',
    member_color: '白'
  },
  {
    name: '七五三掛龍也',
    slug: 'shimekake-ryuya',
    birth_date: '1995-06-23',
    bio: 'Travis Japanのメンバー。メンバーカラーはピンク。',
    member_color: 'ピンク'
  },
  {
    name: '吉澤閑也',
    slug: 'yoshizawa-shizuya',
    birth_date: '1995-08-10',
    bio: 'Travis Japanのメンバー。メンバーカラーはオレンジ。',
    member_color: 'オレンジ'
  },
  {
    name: '中村海人',
    slug: 'nakamura-kaito',
    birth_date: '1997-04-15',
    bio: 'Travis Japanのメンバー。メンバーカラーは緑。',
    member_color: '緑'
  },
  {
    name: '宮近海斗',
    slug: 'miyachika-kaito',
    birth_date: '1997-09-22',
    bio: 'Travis Japanのメンバー。メンバーカラーは赤。リーダー兼センター。',
    member_color: '赤'
  },
  {
    name: '松倉海斗',
    slug: 'matsukura-kaito',
    birth_date: '1997-11-14',
    bio: 'Travis Japanのメンバー。メンバーカラーは橙。',
    member_color: '橙'
  },
  {
    name: '松田元太',
    slug: 'matsuda-genta',
    birth_date: '1999-04-19',
    bio: 'Travis Japanのメンバー。メンバーカラーは青。グループ最年少。',
    member_color: '青'
  }
];

// Travis Japanグループとしても追加
const travisJapanGroup = {
  name: 'Travis Japan',
  slug: 'travis-japan',
  birth_date: '2022-10-28', // 世界メジャーデビュー日
  bio: 'Starto Entertainment所属の7人組アイドルグループ。2022年10月28日に世界メジャーデビュー。グループ名はアメリカの振付師Travis Payneへのトリビュート。'
};

// セレブリティ保存関数
async function saveCelebrity(celebrityData) {
  // 既存チェック
  const { data: existing } = await supabase
    .from('celebrities')
    .select('id')
    .eq('name', celebrityData.name)
    .single();
  
  if (existing) {
    console.log(`   👤 既存: ${celebrityData.name}`);
    return existing.id;
  }
  
  const newCelebrity = {
    id: crypto.randomUUID(),
    name: celebrityData.name,
    slug: celebrityData.slug,
    birth_date: celebrityData.birth_date,
    bio: celebrityData.bio,
    image_url: null, // 後でTMDBから取得
    type: 'celebrity',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('celebrities')
    .insert(newCelebrity);
  
  if (error) {
    console.error(`❌ 保存エラー: ${error.message}`);
    return null;
  }
  
  console.log(`   ✅ セレブリティ追加: ${celebrityData.name}`);
  return newCelebrity.id;
}

// メイン処理
async function addTravisJapanCelebrities() {
  console.log('🎤 Travis Japanメンバーをセレブリティとして追加開始！\n');
  
  try {
    let totalAdded = 0;
    const addedIds = [];
    
    // グループとして追加
    console.log('👥 Travis Japanグループ情報追加:');
    const groupId = await saveCelebrity(travisJapanGroup);
    if (groupId) {
      addedIds.push({ name: travisJapanGroup.name, id: groupId });
      totalAdded++;
    }
    
    console.log('\n👤 Travis Japanメンバー個別追加:');
    
    // 各メンバーを追加
    for (const member of travisJapanMembers) {
      const memberId = await saveCelebrity(member);
      if (memberId) {
        addedIds.push({ name: member.name, id: memberId });
        totalAdded++;
      }
    }
    
    console.log('\n🎉 Travis Japanセレブリティ追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n📋 追加されたセレブリティ:');
    addedIds.forEach(celebrity => {
      console.log(`   - ${celebrity.name}: ${celebrity.id}`);
    });
    
    console.log('\n🔄 次のステップ:');
    console.log('1. Travis JapanのYouTubeチャンネルからエピソード情報を取得');
    console.log('2. 各エピソードにロケーション・アイテム情報を追加');
    console.log('3. TMDBから画像情報を取得');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addTravisJapanCelebrities();