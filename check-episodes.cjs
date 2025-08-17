require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEpisodes() {
  console.log('📺 エピソードデータの確認\n');
  
  // 特定のエピソードを検索
  const { data: specificEpisode } = await supabase
    .from('episodes')
    .select('*')
    .eq('id', '9ZWbXuY-nc4')
    .single();
  
  if (specificEpisode) {
    console.log('✅ エピソード 9ZWbXuY-nc4 が見つかりました:');
    console.log('   タイトル:', specificEpisode.title);
    console.log('   グループID:', specificEpisode.celebrity_id);
  } else {
    console.log('❌ エピソード 9ZWbXuY-nc4 が見つかりません');
  }
  
  // 似たタイトルのエピソードを検索
  const { data: similarEpisodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .ilike('title', '%浅草%')
    .limit(5);
  
  if (similarEpisodes && similarEpisodes.length > 0) {
    console.log('\n📺 浅草関連のエピソード:');
    similarEpisodes.forEach(ep => {
      console.log(`   ${ep.id}: ${ep.title}`);
    });
  }
  
  // もんじゃ関連のエピソード
  const { data: monjaEpisodes } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .ilike('title', '%もんじゃ%')
    .limit(5);
  
  if (monjaEpisodes && monjaEpisodes.length > 0) {
    console.log('\n🍳 もんじゃ関連のエピソード:');
    monjaEpisodes.forEach(ep => {
      console.log(`   ${ep.id}: ${ep.title}`);
    });
  }
  
  // 全体的な統計
  const { count: totalEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', [
      '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
      'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
      '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
    ]);
  
  console.log(`\n📊 合計エピソード数: ${totalEpisodes}件`);
}

checkEpisodes().catch(console.error);
