const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCelebritiesSchema() {
  console.log('🔍 celebritiesテーブルのスキーマ確認\n');
  
  try {
    // 既存のセレブリティを1件取得してスキーマを確認
    const { data: sampleCelebrity } = await supabase
      .from('celebrities')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleCelebrity) {
      console.log('📋 celebritiesテーブルの利用可能カラム:');
      Object.keys(sampleCelebrity).forEach(key => {
        console.log(`   - ${key}: ${typeof sampleCelebrity[key]} (${sampleCelebrity[key]})`);
      });
    } else {
      console.log('❌ セレブリティデータが見つかりません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkCelebritiesSchema();