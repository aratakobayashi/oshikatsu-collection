const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteBadItems() {
  console.log('🗑️ 無意味なアイテムデータを削除中...');
  
  const { error } = await supabase
    .from('items')
    .delete()
    .like('name', '%年代ファッション%');
  
  if (!error) {
    console.log('✅ 年代ファッションアイテムを削除しました');
  } else {
    console.error('❌ 削除エラー:', error);
  }
}

deleteBadItems();