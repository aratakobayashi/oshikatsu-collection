require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function analyzeLocationStatus() {
  console.log('🔍 418エピソードのロケーション付与状況分析\n');
  console.log('='.repeat(60));
  
  const groups = [
    { id: '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', name: '=LOVE', slug: 'equal-love' },
    { id: 'ed64611c-a6e5-4b84-a36b-7383b73913d5', name: '≠ME', slug: 'not-equal-me' },
    { id: '86c49fac-8236-4ee2-9d31-4e4a6472eb9a', name: '≒JOY', slug: 'nearly-equal-joy' }
  ];
  
  let totalEpisodes = 0;
  let totalLocations = 0;
  let totalItems = 0;
  
  for (const group of groups) {
    console.log('\n📊 ' + group.name);
    console.log('-'.repeat(40));
    
    // エピソード数を取得
    const { count: episodeCount } = await supabase
      .from('episodes')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', group.id);
      
    // ロケーション詳細を取得
    const { data: locations } = await supabase
      .from('locations')
      .select('*')
      .eq('celebrity_id', group.id);
      
    // アイテム数を取得
    const { count: itemCount } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('celebrity_id', group.id);
    
    console.log('  📺 エピソード数: ' + episodeCount + '件');
    console.log('  📍 ロケーション数: ' + (locations?.length || 0) + '件');
    console.log('  🛍️ アイテム数: ' + (itemCount || 0) + '件');
    
    if (locations && locations.length > 0) {
      console.log('\n  📍 登録済みロケーション:');
      
      // YouTube概要欄タグでフィルタ
      const youtubeLocations = locations.filter(loc => 
        loc.tags && loc.tags.includes('YouTube概要欄')
      );
      const otherLocations = locations.filter(loc => 
        !loc.tags || !loc.tags.includes('YouTube概要欄')
      );
      
      if (youtubeLocations.length > 0) {
        console.log('    ✅ YouTube概要欄から抽出（新システム）: ' + youtubeLocations.length + '件');
        youtubeLocations.forEach(loc => {
          console.log('      - ' + loc.name + ': ' + loc.address);
        });
      }
      
      if (otherLocations.length > 0) {
        console.log('    ⚠️ その他の方法で登録: ' + otherLocations.length + '件');
        otherLocations.forEach(loc => {
          console.log('      - ' + loc.name + ': ' + (loc.address || '住所不明'));
        });
      }
    }
    
    console.log('\n  🔗 確認URL:');
    console.log('  https://oshikatsu-collection.netlify.app/celebrities/' + group.slug);
    
    totalEpisodes += episodeCount || 0;
    totalLocations += locations?.length || 0;
    totalItems += itemCount || 0;
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 総合統計:');
  console.log('  📺 全エピソード数: ' + totalEpisodes + '件');
  console.log('  📍 全ロケーション数: ' + totalLocations + '件');
  console.log('  🛍️ 全アイテム数: ' + totalItems + '件');
  
  // ロケーション付与率
  const locationRate = totalEpisodes > 0 ? 
    ((totalLocations / totalEpisodes) * 100).toFixed(1) : 0;
  console.log('\n  📈 ロケーション付与率: ' + locationRate + '%');
  
  // 処理対象のグルメ系エピソード数を確認
  const { count: foodEpisodes } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', groups.map(g => g.id))
    .or('title.ilike.%食%,title.ilike.%ラーメン%,title.ilike.%カフェ%,title.ilike.%もんじゃ%,title.ilike.%グルメ%,title.ilike.%お店%,title.ilike.%レストラン%,title.ilike.%スイパラ%,title.ilike.%コストコ%,title.ilike.%くら寿司%,title.ilike.%ボート%,title.ilike.%ハンバーガー%');
  
  console.log('\n  🍜 グルメ・お出かけ系エピソード: ' + (foodEpisodes || 0) + '件');
  console.log('  （これらが主な抽出対象）');
  
  // 問題点と改善案
  console.log('\n💡 状況分析:');
  if (totalLocations < 10) {
    console.log('  ⚠️ ロケーション数が非常に少ない');
    console.log('  → YouTube API呼び出しが制限されている可能性');
    console.log('  → または概要欄に店舗情報が記載されていない');
  } else if (totalLocations < 50) {
    console.log('  ⚠️ ロケーション数が期待値より少ない');
    console.log('  → 抽出パターンの改善が必要');
  } else {
    console.log('  ✅ 適切な数のロケーションが抽出されています');
  }
  
  console.log('\n🎯 今後の改善提案:');
  console.log('  1. 抽出パターンの拡充（店舗名パターンの追加）');
  console.log('  2. 手動キュレーション（重要な店舗の手動追加）');
  console.log('  3. SerenaのMCP活用（公式サイトからの詳細情報取得）');
}

analyzeLocationStatus().catch(console.error);