require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function cleanupBadData() {
  console.log('🧹 低品質データのクリーンアップ開始\n');
  
  const groupIds = [
    '259e44a6-5a33-40cf-9d78-86cfbd9df2ac', // =LOVE
    'ed64611c-a6e5-4b84-a36b-7383b73913d5', // ≠ME
    '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'  // ≒JOY
  ];
  
  // 1. スコア表示を削除
  console.log('📝 スコア表示の削除...');
  const { data: scoreData } = await supabase
    .from('locations')
    .select('id, name, description')
    .in('celebrity_id', groupIds)
    .or('description.ilike.%スコア%,description.ilike.%分析%');
  
  if (scoreData) {
    for (const location of scoreData) {
      // descriptionからスコア部分を削除
      const cleanDescription = location.name; // 名前だけにする
      await supabase
        .from('locations')
        .update({ description: cleanDescription })
        .eq('id', location.id);
    }
    console.log(`  ✅ ${scoreData.length}件のスコア表示を削除`);
  }
  
  // アイテムも同様
  const { data: itemScoreData } = await supabase
    .from('items')
    .select('id, name, description')
    .in('celebrity_id', groupIds)
    .or('description.ilike.%スコア%,description.ilike.%分析%');
  
  if (itemScoreData) {
    for (const item of itemScoreData) {
      const cleanDescription = item.name;
      await supabase
        .from('items')
        .update({ description: cleanDescription })
        .eq('id', item.id);
    }
    console.log(`  ✅ ${itemScoreData.length}件のアイテムスコア表示を削除`);
  }
  
  // 2. 低品質なロケーションを削除
  console.log('\n🗑️ 低品質データの削除...');
  
  // 削除対象の名前パターン
  const badLocationNames = [
    'うしみと萌子', 'いおみり', 'コラボ', 'ハンバー', 'MEのコラボ',
    'ノイミーがコラボさせていただいている店', 'コラボハンバー',
    '釣りができる', '激ウマ', 'プチ旅行', 'わくわく', '一攫千金！',
    'グルメ女子旅', 'プレミアム', 'アウトレット', 'ヒルズ',
    'ボストン・テリア', '🐼新アバ配布', 'ロリータ体験', 'イコノイ',
    '今週のオススメ作品', '古きよき喫茶店', '元のを続けながら2号店',
    'ボートレース', 'in沖縄', '=LOVE', '≠ME', '≒JOY',
    'イコラブ', 'ノイミー', 'ニアジョイ', '博多Vlog', '絶叫注意',
    '出演メンバー', '踊ってみた', '夏休み', 'ませぎ商店',
    'ニアジョイ ... Aug 14, 2024 ... 浅草', '≠ME ... 0. 動画',
    'イコラブハンバー', '全国各地の有名店',
    '新横浜博物館で念願の有名店はしご', '横浜博物館で念願の有名店',
    '櫻井で釣りが楽しめる', 'かき氷が好きすぎる二人で大人気店'
  ];
  
  let deletedCount = 0;
  for (const badName of badLocationNames) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('name', badName)
      .in('celebrity_id', groupIds);
    
    if (!error) {
      deletedCount++;
      console.log(`  🗑️ "${badName}" を削除`);
    }
  }
  
  // 低品質なアイテムも削除
  const badItemNames = [
    'コラボカ', 'ノイミーコラボ', 'のコラボ', 'ノイミーがコラボ',
    '衣装本', '普段のかき氷', 'ヨッシャー大将の全力かき氷',
    '自分たちのぬいぐるみ', '中串丸丹主丼'
  ];
  
  for (const badName of badItemNames) {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('name', badName)
      .in('celebrity_id', groupIds);
    
    if (!error) {
      console.log(`  🗑️ アイテム "${badName}" を削除`);
    }
  }
  
  console.log(`\n✅ 合計 ${deletedCount}件の低品質ロケーションを削除`);
  
  // 3. 曖昧な店舗名を修正
  console.log('\n✏️ 曖昧な名前の修正...');
  
  const nameUpdates = [
    { old: '横浜博物館', new: '新横浜ラーメン博物館' },
    { old: '新横浜博物館', new: '新横浜ラーメン博物館' },
    { old: '栃木の老舗', new: '栃木の老舗ラーメン店' },
    { old: '渋谷店', new: '釣船茶屋 渋谷店' },
    { old: '福岡天神新天町店', new: 'サンキューマート 福岡天神新天町店' }
  ];
  
  for (const update of nameUpdates) {
    const { error } = await supabase
      .from('locations')
      .update({ 
        name: update.new,
        description: update.new
      })
      .eq('name', update.old)
      .in('celebrity_id', groupIds);
    
    if (!error) {
      console.log(`  ✏️ "${update.old}" → "${update.new}"`);
    }
  }
  
  console.log('\n🎉 クリーンアップ完了！');
}

cleanupBadData().catch(console.error);
