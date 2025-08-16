const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 削除対象の5つのエピソードID
const targetEpisodeIds = [
  'DFb-s8Mqs4k', // 渋谷ハンバーグ
  'NIp-ChT5Ma0', // ラーメン河合コラボ
  'JydlKpwQLZA', // 苫鵡氷の村
  'ynqNPi5O8sI', // 1.5kgステーキ
  'EH2Rec_Z9jY'  // 横須賀ドライブ
];

async function deleteInaccurateTravisData() {
  console.log('🗑️ 不正確なTravis Japanロケーション・アイテムデータの削除開始！\n');
  
  const travisJapanId = '46ccba0d-742f-4152-9d87-f10cefadbb6d';
  let totalDeletedLocations = 0;
  let totalDeletedItems = 0;
  
  for (const episodeId of targetEpisodeIds) {
    console.log(`\n🎬 エピソード: ${episodeId}`);
    
    // エピソード情報取得
    const { data: episodes } = await supabase
      .from('episodes')
      .select('id, title')
      .eq('id', episodeId);
    
    const episode = episodes && episodes.length > 0 ? episodes[0] : null;
    
    if (!episode) {
      console.log('⚠️ エピソードが見つかりません');
      continue;
    }
    
    console.log(`📺 ${episode.title.substring(0, 60)}...`);
    
    // このエピソードのロケーション削除
    const { data: deletedLocations, error: locationError } = await supabase
      .from('locations')
      .delete()
      .eq('episode_id', episode.id)
      .eq('celebrity_id', travisJapanId)
      .select();
    
    if (locationError) {
      console.error(`❌ ロケーション削除エラー: ${locationError.message}`);
    } else {
      const deletedCount = deletedLocations ? deletedLocations.length : 0;
      console.log(`🗑️ ロケーション削除: ${deletedCount}件`);
      totalDeletedLocations += deletedCount;
      
      if (deletedLocations) {
        deletedLocations.forEach(loc => {
          console.log(`   - ${loc.name}`);
        });
      }
    }
    
    // このエピソードのアイテム削除
    const { data: deletedItems, error: itemError } = await supabase
      .from('items')
      .delete()
      .eq('episode_id', episode.id)
      .eq('celebrity_id', travisJapanId)
      .select();
    
    if (itemError) {
      console.error(`❌ アイテム削除エラー: ${itemError.message}`);
    } else {
      const deletedCount = deletedItems ? deletedItems.length : 0;
      console.log(`🗑️ アイテム削除: ${deletedCount}件`);
      totalDeletedItems += deletedCount;
      
      if (deletedItems) {
        deletedItems.forEach(item => {
          console.log(`   - ${item.name}`);
        });
      }
    }
  }
  
  console.log('\n🎉 不正確データ削除完了！');
  console.log('='.repeat(60));
  console.log(`📊 削除結果:`);
  console.log(`  - 削除ロケーション: ${totalDeletedLocations}件`);
  console.log(`  - 削除アイテム: ${totalDeletedItems}件`);
  
  // Travis Japan最終状況確認
  const { count: finalLocations } = await supabase
    .from('locations')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
    
  const { count: finalItems } = await supabase
    .from('items')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
    
  const { count: finalEpisodes } = await supabase
    .from('episodes')
    .select('id', { count: 'exact' })
    .eq('celebrity_id', travisJapanId);
  
  console.log('\n📈 削除後データ状況:');
  console.log(`  - エピソード総数: ${finalEpisodes}件`);
  console.log(`  - ロケーション総数: ${finalLocations}件 (L/E: ${finalEpisodes > 0 ? (finalLocations/finalEpisodes).toFixed(3) : '0.000'})`);
  console.log(`  - アイテム総数: ${finalItems}件 (I/E: ${finalEpisodes > 0 ? (finalItems/finalEpisodes).toFixed(3) : '0.000'})`);
  
  console.log('\n✅ 次のステップ:');
  console.log('1. YouTubeコメント分析でロケーション特定');
  console.log('2. ファンサイト・ブログ分析でロケーション特定');
  console.log('3. ぐるなび等の詳細ページと紐づけ');
  console.log('\n🌐 確認:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
}

deleteInaccurateTravisData();