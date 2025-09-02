const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 最終的なUnsplash 404エラー修正
async function fixFinalUnsplashErrors() {
  console.log('🌅 最終Unsplash 404エラー修正...\n');
  
  try {
    // photo-1565299624946-b28f40a0ca4b を検索
    const { data: locations, error } = await supabase
      .from('locations')
      .select('id, name, image_url')
      .like('image_url', '%photo-1565299624946-b28f40a0ca4b%');

    if (error) {
      console.error('❌ 検索エラー:', error.message);
      return;
    }

    if (locations && locations.length > 0) {
      console.log(`📋 見つかった壊れたUnsplash URL: ${locations.length}件\n`);
      
      for (const location of locations) {
        console.log(`🔧 修正中: ${location.name}`);
        console.log(`   旧URL: ${location.image_url}`);
        
        const { error: updateError } = await supabase
          .from('locations')
          .update({ 
            image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
          })
          .eq('id', location.id);

        if (!updateError) {
          console.log(`✅ ${location.name} 修正完了\n`);
        } else {
          console.error(`❌ ${location.name} 修正失敗:`, updateError.message);
        }
      }
    } else {
      console.log('✅ 壊れたUnsplash URLは見つかりませんでした');
    }
    
    console.log('🎉 最終Unsplash修正完了！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fixFinalUnsplashErrors();