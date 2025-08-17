require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function deleteAllExtractedData() {
  console.log('🗑️ 3グループの全ロケーション・アイテムデータ削除開始\n');
  
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  const groupNames = {
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac': '=LOVE',
    'ed64611c-a6e5-4b84-a36b-7383b73913d5': '≠ME',
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a': '≒JOY'
  };
  
  // 1. 現在のデータ件数を確認
  console.log('📊 削除前のデータ件数確認:');
  console.log('='.repeat(60));
  
  for (const groupId of groupIds) {
    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', groupId);
    
    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', groupId);
    
    console.log(`${groupNames[groupId]}:`);
    console.log(`  📍 ロケーション: ${locationCount}件`);
    console.log(`  🛍️ アイテム: ${itemCount}件`);
  }
  
  // 2. 全ロケーションデータを削除
  console.log('\n🗑️ ロケーションデータの削除中...');
  
  let totalDeletedLocations = 0;
  for (const groupId of groupIds) {
    const { count, error } = await supabase
      .from('locations')
      .delete()
      .eq('celebrity_id', groupId);
    
    if (!error) {
      console.log(`✅ ${groupNames[groupId]} のロケーション削除完了`);
      totalDeletedLocations += count || 0;
    } else {
      console.log(`❌ ${groupNames[groupId]} のロケーション削除エラー:`, error.message);
    }
  }
  
  // 3. 全アイテムデータを削除
  console.log('\n🗑️ アイテムデータの削除中...');
  
  let totalDeletedItems = 0;
  for (const groupId of groupIds) {
    const { count, error } = await supabase
      .from('items')
      .delete()
      .eq('celebrity_id', groupId);
    
    if (!error) {
      console.log(`✅ ${groupNames[groupId]} のアイテム削除完了`);
      totalDeletedItems += count || 0;
    } else {
      console.log(`❌ ${groupNames[groupId]} のアイテム削除エラー:`, error.message);
    }
  }
  
  // 4. 削除後の確認
  console.log('\n📊 削除後の確認:');
  console.log('='.repeat(60));
  
  for (const groupId of groupIds) {
    const { count: locationCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', groupId);
    
    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', groupId);
    
    console.log(`${groupNames[groupId]}:`);
    console.log(`  📍 ロケーション: ${locationCount}件`);
    console.log(`  🛍️ アイテム: ${itemCount}件`);
  }
  
  console.log('\n🎉 データ削除完了！');
  console.log(`📊 削除サマリー:`);
  console.log(`  - 削除ロケーション: 推定${totalDeletedLocations}件`);
  console.log(`  - 削除アイテム: 推定${totalDeletedItems}件`);
  
  console.log('\n✅ これで新しいアプローチでクリーンなデータ構築が可能です');
  console.log('次のステップ: YouTube概要欄ベースの正確な抽出システム');
}

deleteAllExtractedData().catch(console.error);
