const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigateOrphanData() {
  console.log('🔍 孤立データ（エピソード紐づけなし）の詳細調査\n');
  console.log('='.repeat(80));
  
  const celebrities = [
    { name: 'よにのちゃんねる', id: 'UC2alHD2WkakOiTxCxF-uMAg' },
    { name: 'SixTONES', id: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7' },
    { name: 'Travis Japan', id: '46ccba0d-742f-4152-9d87-f10cefadbb6d' }
  ];
  
  for (const celebrity of celebrities) {
    console.log(`\n📺 ${celebrity.name}:`);
    console.log('-'.repeat(50));
    
    // ロケーション調査
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name, episode_id, created_at')
      .eq('celebrity_id', celebrity.id);
    
    if (locations) {
      const withEpisode = locations.filter(loc => loc.episode_id !== null);
      const withoutEpisode = locations.filter(loc => loc.episode_id === null);
      
      console.log(`\n📍 ロケーション分析:`);
      console.log(`  総数: ${locations.length}件`);
      console.log(`  ✅ エピソード紐づけあり: ${withEpisode.length}件`);
      console.log(`  ❌ エピソード紐づけなし（孤立）: ${withoutEpisode.length}件`);
      
      if (withoutEpisode.length > 0) {
        console.log(`\n  孤立ロケーション例（最初の5件）:`);
        withoutEpisode.slice(0, 5).forEach(loc => {
          console.log(`    - ${loc.name}`);
        });
        if (withoutEpisode.length > 5) {
          console.log(`    ... 他 ${withoutEpisode.length - 5}件`);
        }
      }
    }
    
    // アイテム調査
    const { data: items } = await supabase
      .from('items')
      .select('id, name, episode_id, created_at')
      .eq('celebrity_id', celebrity.id);
    
    if (items) {
      const withEpisode = items.filter(item => item.episode_id !== null);
      const withoutEpisode = items.filter(item => item.episode_id === null);
      
      console.log(`\n🛍️ アイテム分析:`);
      console.log(`  総数: ${items.length}件`);
      console.log(`  ✅ エピソード紐づけあり: ${withEpisode.length}件`);
      console.log(`  ❌ エピソード紐づけなし（孤立）: ${withoutEpisode.length}件`);
      
      if (withoutEpisode.length > 0) {
        console.log(`\n  孤立アイテム例（最初の5件）:`);
        withoutEpisode.slice(0, 5).forEach(item => {
          console.log(`    - ${item.name}`);
        });
        if (withoutEpisode.length > 5) {
          console.log(`    ... 他 ${withoutEpisode.length - 5}件`);
        }
      }
    }
  }
  
  console.log('\n\n💡 問題の分析結果:');
  console.log('='.repeat(80));
  console.log('1. 多くのロケーション・アイテムがepisode_id=nullで登録されている');
  console.log('2. これらは「孤立データ」でエピソードから参照できない');
  console.log('3. celebrity_idは設定されているが、episode_idが設定されていない');
  console.log('\n📌 解決策:');
  console.log('- 孤立データを適切なエピソードに紐づける');
  console.log('- ロケーション名やアイテム名からエピソードを推測してマッチング');
  console.log('- または、孤立データを削除して正しく紐づけし直す');
}

investigateOrphanData();