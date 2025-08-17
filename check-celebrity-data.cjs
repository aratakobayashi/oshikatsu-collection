require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCelebrityData() {
  console.log('👥 セレブリティデータ確認\n');
  
  const targetGroups = [
    { id: '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', name: '=LOVE', slug: 'equal-love' },
    { id: 'ed64611c-a6e5-4b84-a36b-7383b73913d5', name: '≠ME', slug: 'not-equal-me' },
    { id: '86c49fac-8236-4ee2-9d31-4e4a6472eb9a', name: '≒JOY', slug: 'nearly-equal-joy' }
  ];
  
  // 1. 各グループが存在するかチェック
  console.log('🔍 各グループの存在確認:');
  for (const group of targetGroups) {
    const { data, error } = await supabase
      .from('celebrities')
      .select('*')
      .eq('id', group.id)
      .single();
    
    if (data) {
      console.log(`✅ ${group.name}: 存在`);
      console.log(`   ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Slug: ${data.slug}`);
    } else {
      console.log(`❌ ${group.name}: 不存在`);
      if (error) console.log(`   エラー: ${error.message}`);
    }
  }
  
  // 2. 全セレブリティ一覧表示
  console.log('\n📋 全セレブリティ一覧:');
  const { data: allCelebrities } = await supabase
    .from('celebrities')
    .select('*');
  
  if (allCelebrities) {
    allCelebrities.forEach(celebrity => {
      console.log(`- ${celebrity.name} (${celebrity.slug})`);
      console.log(`  ID: ${celebrity.id}`);
    });
  }
  
  // 3. 不足しているセレブリティレコードを作成
  console.log('\n🔧 不足レコードの作成:');
  
  for (const group of targetGroups) {
    const { data: existingGroup } = await supabase
      .from('celebrities')
      .select('id')
      .eq('id', group.id)
      .single();
    
    if (!existingGroup) {
      console.log(`💾 ${group.name} レコードを作成中...`);
      
      const { data, error } = await supabase
        .from('celebrities')
        .insert({
          id: group.id,
          name: group.name,
          slug: group.slug,
          description: `${group.name}の公式チャンネル`,
          category: 'idol_group',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (data) {
        console.log(`✅ ${group.name} レコード作成成功`);
      } else {
        console.log(`❌ ${group.name} レコード作成失敗:`, error?.message);
      }
    } else {
      console.log(`✅ ${group.name} レコードは既存`);
    }
  }
}

checkCelebrityData().catch(console.error);