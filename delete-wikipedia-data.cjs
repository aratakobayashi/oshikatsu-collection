const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteWikipediaData() {
  console.log('🗑️ Wikipediaから取得した低品質データを削除中...\n');
  
  try {
    // Wikipediaタグのロケーションを削除
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .delete()
      .contains('tags', ['Wikipedia']);
    
    if (!locError) {
      console.log('✅ Wikipediaタグのロケーションを削除しました');
    }
    
    // Wikipediaタグのアイテムを削除
    const { data: items, error: itemError } = await supabase
      .from('items')
      .delete()
      .contains('tags', ['Wikipedia']);
    
    if (!itemError) {
      console.log('✅ Wikipediaタグのアイテムを削除しました');
    }
    
    // 抽象的で役に立たない地名を削除
    const vagueLocationNames = [
      '原宿', '神奈川県', '三重県', '赤坂',
      '東京都', '大阪府', '京都府', '北海道',
      '渋谷', '新宿', '銀座', '池袋'
    ];
    
    for (const name of vagueLocationNames) {
      await supabase.from('locations').delete().eq('name', name);
    }
    console.log('✅ 抽象的なロケーション名を削除しました');
    
    // 一般的すぎるアイテムを削除
    const vagueItemNames = [
      'Nintendo', 'iPhone', 'スーツ', 'ドレス'
    ];
    
    for (const name of vagueItemNames) {
      await supabase.from('items').delete().eq('name', name);
    }
    console.log('✅ 一般的すぎるアイテムを削除しました');
    
    console.log('\n🎉 Wikipedia削除完了！');
    console.log('💡 今後の方針: 手動での具体的なロケーション・アイテム登録を推奨');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

deleteWikipediaData();