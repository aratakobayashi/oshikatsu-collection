require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function diagnoseDatabaseIssue() {
  console.log('🔍 データベース接続とテーブル診断\n');
  
  // 1. 接続テスト
  try {
    const { data, error } = await supabase.from('celebrities').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ データベース接続エラー:', error.message);
      return;
    }
    console.log('✅ データベース接続成功\n');
  } catch (err) {
    console.log('❌ 致命的接続エラー:', err.message);
    return;
  }
  
  // 2. 各テーブルの全体状況
  const tables = ['celebrities', 'episodes', 'locations', 'items'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}テーブルエラー:`, error.message);
      } else {
        console.log(`📊 ${table}: ${count}件`);
      }
    } catch (err) {
      console.log(`❌ ${table}テーブル致命的エラー:`, err.message);
    }
  }
  
  console.log('\n');
  
  // 3. celebrities詳細確認
  const { data: allCelebrities } = await supabase
    .from('celebrities')
    .select('id, name, slug');
  
  if (allCelebrities) {
    console.log('👥 登録セレブリティ:');
    allCelebrities.forEach(celebrity => {
      console.log(`  ${celebrity.name} (${celebrity.id})`);
    });
    console.log('');
  }
  
  // 4. episodes テーブルを直接調査
  console.log('📺 episodesテーブル直接調査:');
  
  const { data: sampleEpisodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id, created_at')
    .limit(5);
  
  if (sampleEpisodes && sampleEpisodes.length > 0) {
    console.log('✅ 直接取得したエピソード:');
    sampleEpisodes.forEach(ep => {
      console.log(`  ${ep.id}: ${ep.title}`);
      console.log(`    セレブリティID: ${ep.celebrity_id}`);
    });
  } else {
    console.log('❌ 直接取得でもエピソードなし');
  }
  
  // 5. 特定のセレブリティIDでの検索テスト
  const targetGroupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  console.log('\n🎯 特定グループIDでの検索テスト:');
  
  for (const groupId of targetGroupIds) {
    const { data: groupEpisodes, error } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('celebrity_id', groupId)
      .limit(3);
    
    if (error) {
      console.log(`❌ ${groupId} 検索エラー:`, error.message);
    } else {
      console.log(`📺 ${groupId}: ${groupEpisodes ? groupEpisodes.length : 0}件`);
      if (groupEpisodes && groupEpisodes.length > 0) {
        groupEpisodes.forEach(ep => {
          console.log(`    ${ep.id}: ${ep.title.substring(0, 40)}...`);
        });
      }
    }
  }
  
  // 6. 権限・RLSの確認
  console.log('\n🔒 権限・RLSチェック:');
  
  try {
    const { data: rlsTest } = await supabase.rpc('version'); // システム関数でRLS状態確認
    console.log('✅ RPC呼び出し成功 - 基本権限OK');
  } catch (err) {
    console.log('❌ RPC呼び出し失敗:', err.message);
  }
}

diagnoseDatabaseIssue().catch(console.error);