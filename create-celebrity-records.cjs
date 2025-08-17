require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createCelebrityRecords() {
  console.log('👥 3グループのセレブリティレコード作成\n');
  
  const targetGroups = [
    { id: '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', name: '=LOVE', slug: 'equal-love' },
    { id: 'ed64611c-a6e5-4b84-a36b-7383b73913d5', name: '≠ME', slug: 'not-equal-me' },
    { id: '86c49fac-8236-4ee2-9d31-4e4a6472eb9a', name: '≒JOY', slug: 'nearly-equal-joy' }
  ];
  
  // まず既存のセレブリティレコードの構造を確認
  const { data: sampleCelebrity } = await supabase
    .from('celebrities')
    .select('*')
    .limit(1)
    .single();
  
  if (sampleCelebrity) {
    console.log('📋 既存セレブリティの構造:');
    console.log(JSON.stringify(sampleCelebrity, null, 2));
    console.log('');
  }
  
  // 最小限のフィールドでレコード作成
  for (const group of targetGroups) {
    console.log(`💾 ${group.name} レコードを作成中...`);
    
    const { data, error } = await supabase
      .from('celebrities')
      .insert({
        id: group.id,
        name: group.name,
        slug: group.slug,
        bio: `${group.name}の公式チャンネル`,
        type: 'youtube_channel',
        status: 'active'
      })
      .select();
    
    if (data && data.length > 0) {
      console.log(`✅ ${group.name} レコード作成成功`);
    } else {
      console.log(`❌ ${group.name} レコード作成失敗:`);
      if (error) console.log(`   エラー: ${error.message}`);
      if (error && error.details) console.log(`   詳細: ${error.details}`);
    }
  }
  
  // 作成確認
  console.log('\n🔍 作成後の確認:');
  const { data: allCelebrities } = await supabase
    .from('celebrities')
    .select('id, name, slug');
  
  if (allCelebrities) {
    allCelebrities.forEach(celebrity => {
      console.log(`- ${celebrity.name} (${celebrity.slug})`);
    });
  }
}

createCelebrityRecords().catch(console.error);