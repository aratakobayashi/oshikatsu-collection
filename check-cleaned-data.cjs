require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function checkCleanedData() {
  console.log('✨ クリーンアップ後のデータ品質チェック\n');
  
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  // 残っているロケーションを確認
  const { data: locations } = await supabase
    .from('locations')
    .select('name, description')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (locations) {
    console.log('🏢 残っているロケーション（高品質）:');
    console.log('='.repeat(60));
    locations.forEach(loc => {
      console.log(`📍 ${loc.name}`);
    });
  }
  
  // アイテムも確認
  const { data: items } = await supabase
    .from('items')
    .select('name, description')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(15);
  
  if (items) {
    console.log('\n🍔 残っているアイテム（高品質）:');
    console.log('='.repeat(60));
    items.forEach(item => {
      console.log(`🛍️ ${item.name}`);
    });
  }
  
  // 統計
  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', groupIds);
  
  const { count: itemCount } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', groupIds);
  
  console.log('\n📊 最終統計:');
  console.log('='.repeat(60));
  console.log(`🏢 総ロケーション数: ${locationCount}件`);
  console.log(`🛍️ 総アイテム数: ${itemCount}件`);
}

checkCleanedData().catch(console.error);
