require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function checkExtractedData() {
  console.log('📊 抽出データの品質チェック\n');
  
  // イコノイジョイ関連のセレブリティID
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  // 最近追加されたロケーションをチェック
  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('name, description, episode_id')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(30);
  
  if (locations) {
    console.log('🏢 最近追加されたロケーション:');
    console.log('='.repeat(60));
    locations.forEach(loc => {
      console.log(`📍 ${loc.name}`);
      if (loc.description) {
        console.log(`   説明: ${loc.description}`);
      }
    });
  }
  
  // 最近追加されたアイテムをチェック
  const { data: items, error: itemError } = await supabase
    .from('items')
    .select('name, description, episode_id')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(30);
  
  if (items) {
    console.log('\n🎁 最近追加されたアイテム:');
    console.log('='.repeat(60));
    items.forEach(item => {
      console.log(`🛍️ ${item.name}`);
      if (item.description) {
        console.log(`   説明: ${item.description}`);
      }
    });
  }
  
  // 問題のあるデータを特定
  console.log('\n⚠️ 問題のあるデータ:');
  console.log('='.repeat(60));
  
  // スコア表示があるものを探す
  const { data: scoreLocations } = await supabase
    .from('locations')
    .select('id, name, description')
    .in('celebrity_id', groupIds)
    .or('description.ilike.%スコア%,description.ilike.%分析%,description.ilike.%自動抽出%');
  
  if (scoreLocations && scoreLocations.length > 0) {
    console.log(`\n❌ スコア/分析表示があるロケーション: ${scoreLocations.length}件`);
    scoreLocations.forEach(loc => {
      console.log(`  - ${loc.name}: ${loc.description}`);
    });
  }
  
  // 意味不明な名前のロケーション
  const { data: badLocations } = await supabase
    .from('locations')
    .select('id, name')
    .in('celebrity_id', groupIds)
    .or('name.ilike.%する%,name.ilike.%いおみり%,name.ilike.%うしみと%,name.ilike.%ハンバー%,name.ilike.%コラボ%,name.ilike.%釣りができる%,name.ilike.%の有名店%,name.ilike.%博物館で%');
  
  if (badLocations && badLocations.length > 0) {
    console.log(`\n❌ 品質の低いロケーション名: ${badLocations.length}件`);
    badLocations.forEach(loc => {
      console.log(`  - ${loc.name} (ID: ${loc.id})`);
    });
  }
}

checkExtractedData().catch(console.error);
