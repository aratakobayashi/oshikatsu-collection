import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function emergencyFixBatch1Tabelog() {
  console.log('🚨 緊急修正: Batch 1 タベログURL削除');
  console.log('='.repeat(60));

  // Batch 1で追加した問題のあるロケーションを取得
  const { data: locations, error } = await supabase
    .from('locations')
    .select('id, name, tabelog_url, affiliate_info')
    .contains('tags', ['batch1'])
    .not('tabelog_url', 'is', null);

  if (error || !locations) {
    console.error('❌ ロケーション取得エラー:', error);
    return;
  }

  console.log(`🔍 修正対象: ${locations.length}件のロケーション`);

  for (const location of locations) {
    console.log(`\n📍 修正中: ${location.name}`);
    console.log(`   問題URL: ${location.tabelog_url}`);

    // タベログURL とアフィリエイト情報を削除
    const { error: updateError } = await supabase
      .from('locations')
      .update({
        tabelog_url: null,
        affiliate_info: {},
        // 修正履歴をメモに追加
        description: location.name === 'Restaurant KEI' ?
          '主人公が告白するレストランシーン（タベログURL要調査）' :
          location.name === 'カフェ・ベローチェ 参宮橋店' ?
          '映画内でのカフェシーン撮影地（推定）（タベログURL要調査）' :
          'ドラマ内重要ディナーシーン撮影地（タベログURL要調査）'
      })
      .eq('id', location.id);

    if (updateError) {
      console.error(`   ❌ 修正エラー: ${location.name}`, updateError);
    } else {
      console.log(`   ✅ 修正完了: タベログURL削除`);
      console.log(`   ✅ アフィリエイトリンク無効化`);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 修正結果の確認
  console.log('\n📊 修正結果確認');
  console.log('='.repeat(60));

  const { data: updatedLocations } = await supabase
    .from('locations')
    .select('name, tabelog_url, affiliate_info')
    .contains('tags', ['batch1']);

  updatedLocations?.forEach((loc, index) => {
    console.log(`${index + 1}. ${loc.name}`);
    console.log(`   タベログURL: ${loc.tabelog_url || 'なし ✅'}`);
    console.log(`   アフィリエイト: ${Object.keys(loc.affiliate_info || {}).length === 0 ? 'なし ✅' : '要確認'}`);
  });

  console.log('\n🎯 次のアクション');
  console.log('='.repeat(60));
  console.log('✅ 間違ったタベログURLを削除完了');
  console.log('✅ 誤ったアフィリエイトリンクを無効化完了');
  console.log('🔍 今後: 実在する店舗の正しいタベログURLを調査・追加');
  console.log('📝 品質管理: テストデータと本番データの分離徹底');

  console.log('\n='.repeat(60));
  console.log('🚨 緊急修正完了');
}

emergencyFixBatch1Tabelog().catch(console.error);