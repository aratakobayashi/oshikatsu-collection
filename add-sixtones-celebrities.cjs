const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// SixTONESメンバー情報
const sixtonesMembers = [
  {
    name: '髙地優吾',
    slug: 'kouchi-yugo',
    birth_date: '1994-03-08',
    bio: 'SixTONESのメンバー。神奈川県出身。メンバーカラーは黄色。',
    tags: ['sixtones', 'johnny', 'idol', 'youtube'],
    member_color: '黄',
    birthplace: '神奈川県'
  },
  {
    name: '京本大我',
    slug: 'kyomoto-taiga',
    birth_date: '1994-12-03',
    bio: 'SixTONESのメンバー。東京都出身。メンバーカラーはピンク。',
    tags: ['sixtones', 'johnny', 'idol', 'actor', 'youtube'],
    member_color: 'ピンク',
    birthplace: '東京都'
  },
  {
    name: '田中樹',
    slug: 'tanaka-juri',
    birth_date: '1995-06-15',
    bio: 'SixTONESのメンバー。千葉県出身。メンバーカラーは青。',
    tags: ['sixtones', 'johnny', 'idol', 'youtube'],
    member_color: '青',
    birthplace: '千葉県'
  },
  {
    name: '松村北斗',
    slug: 'matsumura-hokuto',
    birth_date: '1995-06-18',
    bio: 'SixTONESのメンバー。静岡県出身。メンバーカラーは黒。',
    tags: ['sixtones', 'johnny', 'idol', 'actor', 'youtube'],
    member_color: '黒',
    birthplace: '静岡県'
  },
  {
    name: 'ジェシー',
    slug: 'jesse',
    birth_date: '1996-06-11',
    bio: 'SixTONESのメンバー。東京都出身。メンバーカラーは赤。父がアメリカ人、母が日本人のハーフ。',
    tags: ['sixtones', 'johnny', 'idol', 'bilingual', 'youtube'],
    member_color: '赤',
    birthplace: '東京都'
  },
  {
    name: '森本慎太郎',
    slug: 'morimoto-shintaro',
    birth_date: '1997-07-15',
    bio: 'SixTONESのメンバー。神奈川県出身。メンバーカラーは緑。',
    tags: ['sixtones', 'johnny', 'idol', 'youtube'],
    member_color: '緑',
    birthplace: '神奈川県'
  }
];

// SixTONESグループとしても追加
const sixtonesGroup = {
  name: 'SixTONES',
  slug: 'sixtones',
  birth_date: '2020-01-22', // デビュー日
  bio: 'ジャニーズ事務所所属の6人組アイドルグループ。2015年結成、2020年デビュー。YouTubeチャンネルでも活発に活動。',
  member_color: null,
  birthplace: '日本'
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
async function addSixTONESCelebrities() {
  console.log('🎤 SixTONESメンバーをセレブリティとして追加開始！\n');
  
  try {
    let totalAdded = 0;
    const addedIds = [];
    
    // グループとして追加
    console.log('👥 SixTONESグループ情報追加:');
    const groupId = await saveCelebrity(sixtonesGroup);
    if (groupId) {
      addedIds.push({ name: sixtonesGroup.name, id: groupId });
      totalAdded++;
    }
    
    console.log('\n👤 SixTONESメンバー個別追加:');
    
    // 各メンバーを追加
    for (const member of sixtonesMembers) {
      const memberId = await saveCelebrity(member);
      if (memberId) {
        addedIds.push({ name: member.name, id: memberId });
        totalAdded++;
      }
    }
    
    console.log('\n🎉 SixTONESセレブリティ追加完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    console.log('\n📋 追加されたセレブリティ:');
    addedIds.forEach(celebrity => {
      console.log(`   - ${celebrity.name}: ${celebrity.id}`);
    });
    
    console.log('\n🔄 次のステップ:');
    console.log('1. SixTONESのYouTubeチャンネルからエピソード情報を取得');
    console.log('2. 各エピソードにロケーション・アイテム情報を追加');
    console.log('3. TMDBから画像情報を取得');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

addSixTONESCelebrities();