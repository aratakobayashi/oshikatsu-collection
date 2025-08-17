require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkLocationsSchema() {
  console.log('🔍 locationsテーブルのスキーマ確認\n');
  
  // 既存のロケーションレコードの構造を確認
  const { data: sampleLocation } = await supabase
    .from('locations')
    .select('*')
    .limit(1)
    .single();
  
  if (sampleLocation) {
    console.log('📋 既存ロケーションの構造:');
    console.log(JSON.stringify(sampleLocation, null, 2));
    console.log('\n📝 利用可能なフィールド:');
    Object.keys(sampleLocation).forEach(key => {
      console.log(`  - ${key}: ${typeof sampleLocation[key]}`);
    });
  } else {
    console.log('❌ 既存のロケーションレコードが見つかりません');
    console.log('テストレコードを作成してスキーマを確認します...');
    
    const testLocation = {
      name: 'テスト店舗',
      slug: 'test-store',
      address: 'テスト住所',
      description: 'テスト説明',
      episode_id: '9ZWbXuY-nc4',
      celebrity_id: '259e44a6-5a33-40cf-9d78-86cfbd9df2ac'
    };
    
    const { data, error } = await supabase
      .from('locations')
      .insert(testLocation)
      .select()
      .single();
    
    if (data) {
      console.log('✅ テストレコード作成成功:');
      console.log(JSON.stringify(data, null, 2));
      
      // テストレコードを削除
      await supabase
        .from('locations')
        .delete()
        .eq('id', data.id);
      console.log('✅ テストレコード削除完了');
    } else {
      console.log('❌ テストレコード作成失敗:', error?.message);
    }
  }
}

checkLocationsSchema().catch(console.error);