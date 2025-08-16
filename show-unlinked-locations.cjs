const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function showUnlinkedLocations() {
  console.log('📍 エピソード未紐づけロケーション一覧\n');
  console.log('='.repeat(80));
  
  const celebrities = [
    { name: 'よにのちゃんねる', id: 'UC2alHD2WkakOiTxCxF-uMAg' },
    { name: 'SixTONES', id: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7' },
    { name: 'Travis Japan', id: '46ccba0d-742f-4152-9d87-f10cefadbb6d' }
  ];
  
  for (const celebrity of celebrities) {
    console.log(`\n🎭 ${celebrity.name} の未紐づけロケーション`);
    console.log('-'.repeat(70));
    
    // エピソードIDがnullのロケーションを取得
    const { data: unlinkedLocations, error } = await supabase
      .from('locations')
      .select('id, name, address, description, tags, created_at')
      .eq('celebrity_id', celebrity.id)
      .is('episode_id', null)
      .order('name');
    
    if (error) {
      console.error(`❌ エラー: ${error.message}`);
      continue;
    }
    
    if (!unlinkedLocations || unlinkedLocations.length === 0) {
      console.log('✅ 全てのロケーションがエピソードに紐づいています！');
      continue;
    }
    
    console.log(`\n📊 未紐づけ件数: ${unlinkedLocations.length}件\n`);
    
    // カテゴリ別に分類
    const categories = {
      'ラーメン': [],
      'カフェ': [],
      'レストラン': [],
      'ショップ': [],
      'その他': []
    };
    
    unlinkedLocations.forEach(loc => {
      let categorized = false;
      
      if (loc.name.includes('ラーメン') || loc.name.includes('らーめん')) {
        categories['ラーメン'].push(loc);
        categorized = true;
      } else if (loc.name.includes('カフェ') || loc.name.includes('COFFEE') || 
                 loc.name.includes('Coffee') || loc.name.includes('スターバックス')) {
        categories['カフェ'].push(loc);
        categorized = true;
      } else if (loc.name.includes('食堂') || loc.name.includes('レストラン') || 
                 loc.name.includes('ごはん') || loc.name.includes('寿司') ||
                 loc.name.includes('焼肉') || loc.name.includes('鍋')) {
        categories['レストラン'].push(loc);
        categorized = true;
      } else if (loc.name.includes('ダイソー') || loc.name.includes('OVERRIDE') ||
                 loc.name.includes('ショップ') || loc.name.includes('店')) {
        categories['ショップ'].push(loc);
        categorized = true;
      }
      
      if (!categorized) {
        categories['その他'].push(loc);
      }
    });
    
    // カテゴリ別に表示
    for (const [category, locations] of Object.entries(categories)) {
      if (locations.length === 0) continue;
      
      console.log(`\n【${category}】${locations.length}件`);
      locations.forEach((loc, index) => {
        console.log(`${index + 1}. ${loc.name}`);
        if (loc.address) {
          console.log(`   📍 ${loc.address}`);
        }
        if (loc.description) {
          console.log(`   📝 ${loc.description.substring(0, 50)}...`);
        }
        if (loc.tags && loc.tags.length > 0) {
          console.log(`   🏷️ ${loc.tags.join(', ')}`);
        }
        console.log('');
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('💡 これらのロケーションをエピソードに紐づけることで、');
  console.log('   ユーザー体験が大幅に向上します！');
}

showUnlinkedLocations();