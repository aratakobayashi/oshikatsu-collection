require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixEpisodeData() {
  const episodeId = '9ZWbXuY-nc4';
  console.log('🧹 エピソード 9ZWbXuY-nc4 のデータ修正開始\n');
  
  // 1. 現在の関連データを確認
  const { data: currentLocations } = await supabase
    .from('locations')
    .select('id, name, description')
    .eq('episode_id', episodeId);
  
  const { data: currentItems } = await supabase
    .from('items')
    .select('id, name, description')
    .eq('episode_id', episodeId);
  
  console.log('❌ 削除対象の現在のデータ:');
  console.log('ロケーション:');
  if (currentLocations) {
    currentLocations.forEach(loc => console.log(`  - ${loc.name}`));
  }
  console.log('アイテム:');
  if (currentItems) {
    currentItems.forEach(item => console.log(`  - ${item.name}`));
  }
  
  // 2. 不正確なデータを削除
  console.log('\n🗑️ 不正確なデータを削除中...');
  
  const { error: deleteLocError } = await supabase
    .from('locations')
    .delete()
    .eq('episode_id', episodeId);
  
  const { error: deleteItemError } = await supabase
    .from('items')
    .delete()
    .eq('episode_id', episodeId);
  
  if (!deleteLocError) {
    console.log('✅ ロケーション削除完了');
  }
  if (!deleteItemError) {
    console.log('✅ アイテム削除完了');
  }
  
  // 3. 正確なロケーション情報を追加
  console.log('\n📍 正確なロケーション情報を追加中...');
  
  const correctLocation = {
    id: randomUUID(),
    name: '浅草もんじゃ もんろう',
    slug: 'asakusa-monjya-monrou',
    address: '東京都台東区浅草１丁目４１−２',
    description: '浅草にあるもんじゃ焼きの老舗店。≒JOYのメンバーが訪れた人気店。',
    episode_id: episodeId,
    celebrity_id: '86c49fac-8236-4ee2-9d31-4e4a6472eb9a', // ≒JOY
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { data: newLocation, error: addLocationError } = await supabase
    .from('locations')
    .insert(correctLocation)
    .select();
  
  if (!addLocationError) {
    console.log('✅ 正確なロケーション追加完了:');
    console.log(`   店名: ${correctLocation.name}`);
    console.log(`   住所: ${correctLocation.address}`);
  } else {
    console.log('❌ ロケーション追加エラー:', addLocationError.message);
  }
  
  // 4. もんじゃ焼きアイテムを追加
  const correctItem = {
    id: randomUUID(),
    name: 'もんじゃ焼き',
    slug: 'monjyayaki',
    description: '浅草の老舗で食べた本格的なもんじゃ焼き',
    category: '食べ物',
    episode_id: episodeId,
    celebrity_id: '86c49fac-8236-4ee2-9d31-4e4a6472eb9a', // ≒JOY
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error: addItemError } = await supabase
    .from('items')
    .insert(correctItem);
  
  if (!addItemError) {
    console.log('✅ 正確なアイテム追加完了:');
    console.log(`   アイテム: ${correctItem.name}`);
    console.log(`   カテゴリ: ${correctItem.category}`);
  }
  
  console.log('\n🎉 修正完了！');
  console.log('動画概要欄ベースの正確なデータに更新されました。');
}

fixEpisodeData().catch(console.error);