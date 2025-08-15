const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteGoogleSearchData() {
  console.log('🗑️ Google Search APIで取得した低品質データを削除中...\n');
  
  try {
    // Google_Searchタグのロケーションを削除
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .delete()
      .contains('tags', ['Google_Search']);
    
    if (!locError) {
      console.log('✅ Google_Searchタグのロケーションを削除しました');
    }
    
    // Google_Searchタグのアイテムを削除
    const { data: items, error: itemError } = await supabase
      .from('items')
      .delete()
      .contains('tags', ['Google_Search']);
    
    if (!itemError) {
      console.log('✅ Google_Searchタグのアイテムを削除しました');
    }
    
    // 特定の無意味なアイテムも削除
    const badItemNames = [
      'GOTO MALL', 'UWOWO', 'Ado', 'Prime Video',
      'アクション小道具', 'ロマンチックアイテム'
    ];
    
    for (const name of badItemNames) {
      await supabase.from('items').delete().eq('name', name);
    }
    console.log('✅ 無意味なアイテムを削除しました');
    
    // 特定の無意味なロケーションも削除
    const badLocationNames = [
      '8番出口', 'あんぱん', '東京（制作拠点）',
      'アクションシーン撮影地', '日本（撮影地）'
    ];
    
    for (const name of badLocationNames) {
      await supabase.from('locations').delete().eq('name', name);
    }
    console.log('✅ 無意味なロケーションを削除しました');
    
    console.log('\n🎉 削除完了！');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

deleteGoogleSearchData();