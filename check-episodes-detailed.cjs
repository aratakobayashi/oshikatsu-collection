require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkEpisodesDetailed() {
  console.log('🔍 詳細なエピソードデータ確認\n');
  
  // 1. 全エピソードを取得
  const { data: allEpisodes, error } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .limit(20);
  
  if (error) {
    console.log('❌ エピソード取得エラー:', error.message);
    return;
  }
  
  if (!allEpisodes || allEpisodes.length === 0) {
    console.log('❌ エピソードが全く見つかりません');
    return;
  }
  
  console.log(`📺 全エピソード (最新20件):`);
  allEpisodes.forEach(ep => {
    console.log(`  ${ep.id}: ${ep.title.substring(0, 50)}...`);
    console.log(`    celebrity_id: ${ep.celebrity_id}`);
  });
  
  // 2. セレブリティIDでグループ化
  const groupedEpisodes = {};
  allEpisodes.forEach(ep => {
    if (!groupedEpisodes[ep.celebrity_id]) {
      groupedEpisodes[ep.celebrity_id] = [];
    }
    groupedEpisodes[ep.celebrity_id].push(ep);
  });
  
  console.log('\n📊 セレブリティID別エピソード数:');
  for (const [celebrityId, episodes] of Object.entries(groupedEpisodes)) {
    console.log(`  ${celebrityId}: ${episodes.length}件`);
    
    // セレブリティ名を取得
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name')
      .eq('id', celebrityId)
      .single();
    
    if (celebrity) {
      console.log(`    → ${celebrity.name}`);
    } else {
      console.log(`    → 不明なセレブリティ`);
    }
  }
  
  // 3. 特定の動画IDを検索
  const testVideoIds = ['9ZWbXuY-nc4', 'nT0R_Mhkb_g', 'ZQrZ8RSsdA0'];
  console.log('\n🎯 特定動画ID検索:');
  
  for (const videoId of testVideoIds) {
    const { data: episode } = await supabase
      .from('episodes')
      .select('id, title, celebrity_id')
      .eq('id', videoId)
      .single();
    
    if (episode) {
      console.log(`✅ ${videoId}: ${episode.title}`);
      console.log(`   celebrity_id: ${episode.celebrity_id}`);
    } else {
      console.log(`❌ ${videoId}: 見つかりません`);
    }
  }
}

checkEpisodesDetailed().catch(console.error);