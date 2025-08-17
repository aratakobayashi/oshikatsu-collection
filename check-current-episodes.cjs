require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCurrentEpisodes() {
  console.log('📊 現在のエピソード状況確認\n');
  
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  // 各グループのエピソード数
  for (const groupId of groupIds) {
    const { count } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', groupId);
    
    const { data: groupInfo } = await supabase
      .from('celebrities')
      .select('name')
      .eq('id', groupId)
      .single();
    
    console.log((groupInfo?.name || 'Unknown') + ': ' + count + '件');
  }
  
  // 全エピソード数
  const { count: totalCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', groupIds);
  
  console.log('\n📺 合計エピソード数: ' + totalCount + '件');
  
  // 最新のエピソードをいくつか表示
  const { data: recentEpisodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .in('celebrity_id', groupIds)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (recentEpisodes && recentEpisodes.length > 0) {
    console.log('\n📺 最新エピソード:');
    recentEpisodes.forEach(ep => {
      console.log('- ' + ep.title.substring(0, 50) + '...');
    });
  }
  
  // データがない場合の対処提案
  if (totalCount === 0) {
    console.log('\n💡 エピソードデータがありません。');
    console.log('次のステップ:');
    console.log('1. fetch-ikonoi-videos.cjs を再実行してエピソードデータを取得');
    console.log('2. その後、新しい抽出システムをテスト');
  }
}

checkCurrentEpisodes().catch(console.error);
