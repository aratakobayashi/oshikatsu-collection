const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLocationEpisodeLinks() {
  console.log('🔍 ロケーション・エピソード連携確認\n');
  
  try {
    // 3人のセレブリティのロケーション・エピソード情報を取得
    const { data: locations } = await supabase
      .from('locations')
      .select(`
        name,
        episode_id,
        celebrities:celebrity_id (name),
        episodes:episode_id (id, title)
      `)
      .in('celebrity_id', [
        '325f9910-5de0-4eae-afe3-e2b688bdfe8b', // 二宮和也
        '16585925-7558-4064-92ac-3022abd4aa6f', // 菊池風磨
        'UC2alHD2WkakOiTxCxF-uMAg'              // よにのちゃんねる
      ]);

    if (!locations || locations.length === 0) {
      console.log('❌ ロケーション情報が見つかりません');
      return;
    }

    console.log(`📊 総ロケーション数: ${locations.length}件\n`);

    // セレブリティごとにグループ化
    const groupedByCelebrity = locations.reduce((acc, location) => {
      const celebrityName = location.celebrities?.name || '不明';
      if (!acc[celebrityName]) {
        acc[celebrityName] = [];
      }
      acc[celebrityName].push(location);
      return acc;
    }, {});

    // 各セレブリティのロケーション情報を表示
    for (const [celebrityName, celebrityLocations] of Object.entries(groupedByCelebrity)) {
      console.log(`👤 ${celebrityName} (${celebrityLocations.length}件)`);
      
      celebrityLocations.forEach((location, index) => {
        const episodeTitle = location.episodes?.title || 'エピソード未設定';
        const episodeId = location.episode_id || 'なし';
        
        console.log(`   ${index + 1}. ${location.name}`);
        console.log(`      エピソード: ${episodeTitle} (ID: ${episodeId})`);
      });
      console.log('');
    }

    // 孤立したロケーション（エピソードに紐づいていない）をチェック
    const orphanedLocations = locations.filter(location => !location.episode_id);
    
    if (orphanedLocations.length > 0) {
      console.log('⚠️ エピソードに紐づいていないロケーション:');
      orphanedLocations.forEach(location => {
        console.log(`   - ${location.name} (${location.celebrities?.name})`);
      });
    } else {
      console.log('✅ すべてのロケーションがエピソードに正しく紐づいています');
    }

    // アイテムも同様にチェック
    console.log('\n🛍️ アイテム・エピソード連携確認\n');
    
    const { data: items } = await supabase
      .from('items')
      .select(`
        name,
        episode_id,
        celebrities:celebrity_id (name),
        episodes:episode_id (id, title)
      `)
      .in('celebrity_id', [
        '325f9910-5de0-4eae-afe3-e2b688bdfe8b', // 二宮和也
        '16585925-7558-4064-92ac-3022abd4aa6f', // 菊池風磨
        'UC2alHD2WkakOiTxCxF-uMAg'              // よにのちゃんねる
      ]);

    if (!items || items.length === 0) {
      console.log('📦 これらのセレブリティにはアイテム情報がありません');
    } else {
      console.log(`📊 総アイテム数: ${items.length}件`);
      
      const orphanedItems = items.filter(item => !item.episode_id);
      
      if (orphanedItems.length > 0) {
        console.log('\n⚠️ エピソードに紐づいていないアイテム:');
        orphanedItems.forEach(item => {
          console.log(`   - ${item.name} (${item.celebrities?.name})`);
        });
      } else {
        console.log('\n✅ すべてのアイテムがエピソードに正しく紐づいています');
      }
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkLocationEpisodeLinks();