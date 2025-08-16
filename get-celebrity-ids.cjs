const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCelebrityIds() {
  console.log('🔍 セレブリティID確認\n');
  
  try {
    const { data: celebrities } = await supabase
      .from('celebrities')
      .select('id, name, slug')
      .in('name', ['二宮和也', '菊池風磨', 'よにのちゃんねる']);

    if (!celebrities || celebrities.length === 0) {
      console.log('❌ セレブリティ情報が見つかりません');
      return;
    }

    console.log('👤 セレブリティ情報:');
    celebrities.forEach(celebrity => {
      console.log(`   ${celebrity.name}: ${celebrity.id} (slug: ${celebrity.slug})`);
    });
    
    console.log('\n🔍 各セレブリティのロケーション・アイテム数確認:\n');
    
    for (const celebrity of celebrities) {
      // ロケーション数
      const { count: locationCount } = await supabase
        .from('locations')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrity.id);
      
      // アイテム数
      const { count: itemCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrity.id);
        
      // エピソード数
      const { count: episodeCount } = await supabase
        .from('episodes')
        .select('*', { count: 'exact', head: true })
        .eq('celebrity_id', celebrity.id);

      console.log(`👤 ${celebrity.name}:`);
      console.log(`   エピソード: ${episodeCount}件`);
      console.log(`   ロケーション: ${locationCount}件`);
      console.log(`   アイテム: ${itemCount}件`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

getCelebrityIds();