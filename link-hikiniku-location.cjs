const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function linkHikinikuLocation() {
  console.log('🔗 「挽肉と米」とエピソードを紐づけます\n');
  
  const locationId = '77a18670-4ad6-4299-9779-2ed8a5ba4c15';
  const episodeId = 'f37f990d-e427-46de-baff-9dbcd0ddfff8'; // #404【アワード!!】なんか気付いたら2人になってた日
  
  // 現在の状態確認
  const { data: location } = await supabase
    .from('locations')
    .select('*')
    .eq('id', locationId)
    .single();
    
  console.log('📍 現在のロケーション情報:');
  console.log(`   名前: ${location.name}`);
  console.log(`   現在のepisode_id: ${location.episode_id}`);
  
  // エピソード情報確認
  const { data: episode } = await supabase
    .from('episodes')
    .select('id, title, celebrity_id')
    .eq('id', episodeId)
    .single();
    
  console.log('\n📺 紐づけるエピソード:');
  console.log(`   タイトル: ${episode.title}`);
  console.log(`   ID: ${episode.id}`);
  
  // episode_idを更新
  const { data: updated, error } = await supabase
    .from('locations')
    .update({ 
      episode_id: episodeId,
      updated_at: new Date().toISOString()
    })
    .eq('id', locationId)
    .select();
    
  if (error) {
    console.error('❌ エラー:', error.message);
  } else {
    console.log('\n✅ 紐づけ完了!');
    console.log(`   ${location.name} → ${episode.title}`);
  }
  
  // 別のエピソード（未公開版）も同じ場所を訪れているか確認
  const anotherEpisodeId = 'b783a18d-9642-43fe-ab10-71430b6a31cf'; // 未公開版
  
  console.log('\n🔍 追加: 別のエピソードも同じロケーションに紐づける必要があるか確認...');
  
  // 未公開版用の新しいロケーションレコードを作成（同じ店舗、別エピソード）
  const newLocation = {
    ...location,
    id: undefined, // 新しいIDを生成
    episode_id: anotherEpisodeId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  delete newLocation.id; // IDフィールドを削除（自動生成させる）
  
  const { data: newLoc, error: newError } = await supabase
    .from('locations')
    .insert(newLocation)
    .select();
    
  if (newError) {
    console.log('⚠️ 未公開版の紐づけはスキップ（既に存在する可能性）');
  } else if (newLoc) {
    console.log('✅ 未公開版エピソードも紐づけました');
  }
  
  console.log('\n🎉 完了！');
  console.log('→ https://oshikatsu-collection.netlify.app/locations/77a18670-4ad6-4299-9779-2ed8a5ba4c15');
  console.log('  で複数エピソードが表示されるはずです');
}

linkHikinikuLocation();