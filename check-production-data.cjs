const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://awaarykghpylggygkiyp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE');

async function checkProductionData() {
  console.log('🔍 本番環境データ確認中...\n');
  
  // 山田涼介のセレブリティID取得
  const { data: yamada } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'yamada-ryosuke')
    .single();
  
  if (!yamada) {
    console.log('❌ 山田涼介データが見つかりません');
    return;
  }
  
  // 追加されたロケーション
  const { data: locations } = await supabase
    .from('locations')
    .select('name, address, opening_hours')
    .eq('celebrity_id', yamada.id);
  
  console.log('📍 本番環境のロケーション:');
  locations?.forEach(loc => {
    console.log(`  - ${loc.name}`);
    console.log(`    住所: ${loc.address || '未設定'}`);
    console.log(`    営業時間: ${loc.opening_hours || '未設定'}`);
  });
  
  // 追加されたアイテム
  const { data: items } = await supabase
    .from('items')
    .select('name, price, brand, category')
    .eq('celebrity_id', yamada.id);
  
  console.log('\n🛍️ 本番環境のアイテム:');
  items?.forEach(item => {
    console.log(`  - ${item.name} (${item.category})`);
    if (item.price) console.log(`    価格: ${item.price}円`);
    if (item.brand) console.log(`    ブランド: ${item.brand}`);
  });
  
  console.log(`\n📊 本番環境データ合計:`);
  console.log(`   ロケーション: ${locations?.length || 0}件`);
  console.log(`   アイテム: ${items?.length || 0}件`);
  
  console.log('\n🌐 確認URL:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
}

checkProductionData();