const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEpisodesSchema() {
  console.log('🔍 episodesテーブルのスキーマ確認\n');
  
  try {
    // 既存のエピソードを1件取得してスキーマを確認
    const { data: sampleEpisode } = await supabase
      .from('episodes')
      .select('*')
      .limit(1)
      .single();
    
    if (sampleEpisode) {
      console.log('📋 episodesテーブルの利用可能カラム:');
      Object.keys(sampleEpisode).forEach(key => {
        const value = sampleEpisode[key];
        const type = typeof value;
        const displayValue = value ? (type === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
        console.log(`   - ${key}: ${type} (${displayValue})`);
      });
    } else {
      console.log('❌ エピソードデータが見つかりません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkEpisodesSchema();