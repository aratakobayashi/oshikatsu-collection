import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Celebrity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  type: string;
  status: string;
}

async function cleanupCelebritiesWithoutImages() {
  console.log('🗑️  画像未設定セレブリティクリーンアップ開始');
  console.log('='.repeat(60));

  // 画像未設定のセレブリティを取得
  const { data: celebrities, error } = await supabase
    .from('celebrities')
    .select('id, name, slug, image_url, type, status')
    .or('image_url.is.null,image_url.eq.')
    .eq('status', 'active')
    .order('name');

  if (error) {
    console.error('❌ データ取得エラー:', error);
    return;
  }

  if (!celebrities || celebrities.length === 0) {
    console.log('✅ 画像未設定のアクティブセレブリティは見つかりませんでした');
    return;
  }

  console.log(`📊 削除対象: ${celebrities.length}人`);
  console.log('');

  // 削除対象をタイプ別に表示
  const groupedByType = celebrities.reduce((acc, celeb) => {
    if (!acc[celeb.type]) acc[celeb.type] = [];
    acc[celeb.type].push(celeb);
    return acc;
  }, {} as Record<string, Celebrity[]>);

  console.log('📝 削除対象詳細:');
  for (const [type, celebs] of Object.entries(groupedByType)) {
    console.log(`\n📱 ${type}タイプ (${celebs.length}人):`);
    celebs.forEach(celeb => {
      console.log(`   • ${celeb.name} (${celeb.slug})`);
    });
  }

  // 確認プロンプト
  console.log('');
  console.log('⚠️  この操作は以下のデータを削除します:');
  console.log('   - celebritiesテーブルからのレコード');
  console.log('   - 関連するepisodesテーブルのレコード');
  console.log('   - その他の関連データ');

  // 関連エピソード数を確認
  const celebrityIds = celebrities.map(c => c.id);
  const { count: episodeCount } = await supabase
    .from('episodes')
    .select('*', { count: 'exact', head: true })
    .in('celebrity_id', celebrityIds);

  console.log(`\n📺 関連エピソード数: ${episodeCount || 0}件`);

  // 実際の削除処理
  console.log('\n🗑️  削除処理開始...');

  let deletedCelebrities = 0;
  let deletedEpisodes = 0;

  for (const celebrity of celebrities) {
    try {
      // 1. 関連エピソードを削除
      const { count: relatedEpisodes, error: episodeDeleteError } = await supabase
        .from('episodes')
        .delete({ count: 'exact' })
        .eq('celebrity_id', celebrity.id);

      if (episodeDeleteError) {
        console.error(`❌ ${celebrity.name}の関連エピソード削除エラー:`, episodeDeleteError);
        continue;
      }

      deletedEpisodes += relatedEpisodes || 0;

      // 2. セレブリティを削除
      const { error: celebrityDeleteError } = await supabase
        .from('celebrities')
        .delete()
        .eq('id', celebrity.id);

      if (celebrityDeleteError) {
        console.error(`❌ ${celebrity.name}の削除エラー:`, celebrityDeleteError);
        continue;
      }

      deletedCelebrities++;
      console.log(`✅ 削除完了: ${celebrity.name} (関連エピソード: ${relatedEpisodes || 0}件)`);

    } catch (error) {
      console.error(`❌ ${celebrity.name}の削除中にエラー:`, error);
    }

    // API制限対策
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // 結果表示
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 クリーンアップ結果');
  console.log('='.repeat(60));
  console.log(`✅ 削除されたセレブリティ: ${deletedCelebrities}/${celebrities.length}人`);
  console.log(`📺 削除されたエピソード: ${deletedEpisodes}件`);

  if (deletedCelebrities === celebrities.length) {
    console.log('🎉 すべての画像未設定セレブリティの削除が完了しました');
  } else {
    console.log('⚠️  一部削除に失敗したセレブリティがあります');
  }

  // 最終確認
  const { count: remainingCelebrities } = await supabase
    .from('celebrities')
    .select('*', { count: 'exact', head: true })
    .or('image_url.is.null,image_url.eq.')
    .eq('status', 'active');

  console.log(`\n📊 残存する画像未設定セレブリティ: ${remainingCelebrities || 0}人`);

  console.log('');
  console.log('='.repeat(60));
  console.log('🗑️  クリーンアップ完了');
}

// メイン実行
cleanupCelebritiesWithoutImages().catch(console.error);

export { cleanupCelebritiesWithoutImages };