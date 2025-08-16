const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkSpecificLocation() {
  console.log('🔗 特定のロケーションをエピソードに紐づけ中...\n');
  
  // 複数のロケーションとエピソードの紐づけ
  const linkMappings = [
    {
      locationName: '400°C 神楽坂',
      episodeId: '49ff9eca4d62ce40ed0c2e6b9f3951b6'
    },
    {
      locationName: 'スパイシーカレー魯珈',
      episodeId: 'bfbcf27e1684d8edadbd4b8f08d0a2c5'
    }
  ];
  
  for (const mapping of linkMappings) {
    await linkSingleLocation(mapping.locationName, mapping.episodeId);
    console.log(''); // 空行を追加
  }
}

async function linkSingleLocation(locationName, episodeId) {
  
  // ロケーションを検索
  console.log(`📍 ロケーション検索: ${locationName}`);
  const { data: locations, error: searchError } = await supabase
    .from('locations')
    .select('id, name, episode_id, celebrity_id')
    .ilike('name', `%${locationName}%`);
  
  if (searchError) {
    console.error('❌ 検索エラー:', searchError.message);
    return;
  }
  
  if (!locations || locations.length === 0) {
    console.log('⚠️ 該当するロケーションが見つかりません');
    return;
  }
  
  console.log(`✅ ${locations.length}件のロケーションを発見:`);
  locations.forEach(loc => {
    console.log(`  - ID: ${loc.id}`);
    console.log(`  - 名前: ${loc.name}`);
    console.log(`  - 現在のエピソードID: ${loc.episode_id || 'なし'}`);
    console.log(`  - セレブリティID: ${loc.celebrity_id}`);
    console.log('');
  });
  
  // エピソード情報を確認
  console.log(`🎬 エピソード確認: ${episodeId}`);
  const { data: episode, error: episodeError } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .eq('id', episodeId)
    .single();
  
  if (episodeError) {
    console.error('❌ エピソード検索エラー:', episodeError.message);
    return;
  }
  
  if (!episode) {
    console.log('⚠️ 指定されたエピソードが見つかりません');
    return;
  }
  
  console.log(`✅ エピソード確認完了:`);
  console.log(`  - タイトル: ${episode.title}`);
  console.log(`  - セレブリティID: ${episode.celebrity_id}`);
  console.log('');
  
  // ロケーションを更新
  for (const location of locations) {
    if (location.celebrity_id !== episode.celebrity_id) {
      console.log(`⚠️ スキップ: ${location.name} (セレブリティIDが異なります)`);
      continue;
    }
    
    if (location.episode_id === episodeId) {
      console.log(`ℹ️ ${location.name} は既に該当エピソードに紐づいています`);
      continue;
    }
    
    console.log(`🔄 更新中: ${location.name}`);
    const { error: updateError } = await supabase
      .from('locations')
      .update({ episode_id: episodeId })
      .eq('id', location.id);
    
    if (updateError) {
      console.error(`❌ 更新エラー: ${updateError.message}`);
    } else {
      console.log(`✅ 紐づけ成功: ${location.name} → ${episode.title.substring(0, 50)}...`);
    }
  }
  
  console.log('\n🎊 紐づけ作業完了！');
  console.log('\n🌐 確認方法:');
  console.log(`https://oshikatsu-collection.netlify.app/episodes/${episodeId}`);
  console.log('→ ロケーション一覧にかおたんラーメンえんとつ屋が表示されます');
}

linkSpecificLocation();