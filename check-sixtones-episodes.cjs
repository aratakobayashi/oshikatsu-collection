const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSixTONESEpisodes() {
  console.log('🔍 SixTONESのエピソード確認\n');
  
  try {
    // SixTONESのセレブリティIDを取得
    const { data: sixtoneCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'SixTONES')
      .single();
      
    if (!sixtoneCelebrity) {
      console.log('❌ SixTONESのセレブリティ情報が見つかりません');
      return;
    }
    
    console.log(`👤 SixTONES Celebrity ID: ${sixtoneCelebrity.id}\n`);
    
    // SixTONESのエピソードを取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title, date')
      .eq('celebrity_id', sixtoneCelebrity.id)
      .order('date', { ascending: false });
    
    if (!episodes || episodes.length === 0) {
      console.log('❌ SixTONESのエピソードが見つかりません');
      return;
    }
    
    console.log(`📺 SixTONESのエピソード (${episodes.length}件):`);
    episodes.forEach((episode, index) => {
      console.log(`   ${index + 1}. ${episode.title}`);
      console.log(`      ID: ${episode.id}`);
      console.log(`      日付: ${episode.date}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkSixTONESEpisodes();