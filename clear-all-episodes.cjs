require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function clearAllEpisodes() {
  console.log('🧹 全エピソードデータの削除開始\n');
  
  // 1. 現在のエピソード数確認
  const { count: currentCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 削除前のエピソード数: ${currentCount}件`);
  
  if (currentCount === 0) {
    console.log('✅ 削除対象のエピソードはありません');
    return;
  }
  
  // 2. 全エピソードを削除
  console.log('\n🗑️ 全エピソードを削除中...');
  
  const { count: deletedCount, error } = await supabase
    .from('episodes')
    .delete()
    .neq('id', 'dummy'); // 全件削除（dummyは存在しない値）
  
  if (error) {
    console.log('❌ 削除エラー:', error.message);
    return;
  }
  
  console.log(`✅ ${deletedCount || currentCount}件のエピソードを削除しました`);
  
  // 3. 削除後の確認
  const { count: afterCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 削除後のエピソード数: ${afterCount}件`);
  
  if (afterCount === 0) {
    console.log('\n🎉 全エピソードの削除が完了しました！');
    console.log('✅ これで=LOVE・≠ME・≒JOYの動画データを新規に取得できます');
  } else {
    console.log(`⚠️ ${afterCount}件のエピソードが残っています`);
  }
}

clearAllEpisodes().catch(console.error);