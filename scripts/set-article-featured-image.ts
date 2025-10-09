import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function setFeaturedImage(slug: string, imageFileName: string) {
  console.log(`\n🔄 記事「${slug}」にアイキャッチ画像を設定中...`);

  // 画像URLを生成（publicフォルダ内のファイルはルートから参照）
  const imageUrl = `/articles/${encodeURIComponent(imageFileName)}`;

  // 記事を更新
  const { data, error } = await supabase
    .from('articles')
    .update({
      featured_image_url: imageUrl,
      updated_at: new Date().toISOString()
    })
    .eq('slug', slug)
    .select();

  if (error) {
    console.error('❌ エラー:', error);
    return false;
  }

  if (!data || data.length === 0) {
    console.error('❌ 記事が見つかりませんでした');
    return false;
  }

  console.log('✅ アイキャッチ画像を設定しました');
  console.log(`   画像URL: ${imageUrl}`);
  console.log(`   記事タイトル: ${data[0].title}`);

  return true;
}

async function main() {
  console.log('=== 記事アイキャッチ画像設定スクリプト ===\n');

  const result = await setFeaturedImage(
    '2025-debut-trainee-groups-complete-guide',
    '2025年デビュー予定の注目練習生グループ完全ガイド.png'
  );

  if (result) {
    console.log('\n✅ すべての設定が完了しました！');
  } else {
    console.log('\n❌ 設定に失敗しました');
  }
}

main();
