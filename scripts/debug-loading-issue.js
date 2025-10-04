import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Load production environment variables
dotenv.config({ path: join(projectRoot, '.env.production') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugLoadingIssue() {
  console.log('🔍 無限ローディング問題をデバッグ中...\n');

  try {
    // 1. カテゴリの確認
    console.log('=== 1. カテゴリデータの確認 ===');
    const { data: categories, error: catError } = await supabase
      .from('article_categories')
      .select('*')
      .order('name');

    if (catError) {
      console.error('❌ カテゴリエラー:', catError);
      return;
    }
    console.log('✅ カテゴリ取得成功:', categories?.length, '件');

    // 2. タグの確認
    console.log('\n=== 2. タグデータの確認 ===');
    const { data: tags, error: tagError } = await supabase
      .from('article_tags')
      .select('*')
      .order('name');

    if (tagError) {
      console.error('❌ タグエラー:', tagError);
      return;
    }
    console.log('✅ タグ取得成功:', tags?.length, '件');

    // 3. ArticlesList.tsxと同じクエリを実行
    console.log('\n=== 3. ArticlesList.tsxと同じクエリ実行 ===');

    let query = supabase
      .from('articles')
      .select('id, title, slug, excerpt, published_at, featured_image_url, category_id, tag_ids', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(0, 8); // 最初の9件

    console.log('クエリ実行中...');
    const { data: articles, error: articlesError, count } = await query;

    if (articlesError) {
      console.error('❌ 記事取得エラー:', articlesError);
      console.log('🔍 これが無限ローディングの原因の可能性があります');
      return;
    }

    console.log('✅ 記事取得成功:', articles?.length, '件 / 総数:', count);

    // 4. 各記事のcategory_idの整合性確認
    console.log('\n=== 4. 記事のcategory_id整合性確認 ===');
    const categoryIds = categories.map(c => c.id);

    for (const article of articles || []) {
      if (article.category_id && !categoryIds.includes(article.category_id)) {
        console.log(`⚠️ 無効なcategory_id: ${article.title} (category_id: ${article.category_id})`);
      }
    }

    // 5. tag_idsの整合性確認
    console.log('\n=== 5. 記事のtag_ids整合性確認 ===');
    const tagIds = tags.map(t => t.id);

    for (const article of articles || []) {
      if (article.tag_ids && Array.isArray(article.tag_ids)) {
        const invalidTags = article.tag_ids.filter(tagId => !tagIds.includes(tagId));
        if (invalidTags.length > 0) {
          console.log(`⚠️ 無効なtag_ids: ${article.title} (無効なtag_ids: ${invalidTags.join(', ')})`);
        }
      }
    }

    // 6. 実際の条件でのクエリテスト
    console.log('\n=== 6. 条件付きクエリテスト ===');

    // カテゴリフィルターテスト
    if (categories.length > 0) {
      const testCategory = categories[0];
      console.log(`カテゴリ "${testCategory.name}" でフィルタリングテスト...`);

      const { data: filteredByCategory, error: catFilterError } = await supabase
        .from('articles')
        .select('id, title, category_id')
        .eq('status', 'published')
        .eq('category_id', testCategory.id)
        .limit(5);

      if (catFilterError) {
        console.error('❌ カテゴリフィルターエラー:', catFilterError);
      } else {
        console.log('✅ カテゴリフィルター成功:', filteredByCategory?.length, '件');
      }
    }

    console.log('\n🎯 問題の特定:');
    console.log('- データベースクエリは正常に動作している');
    console.log('- 問題はフロントエンドのuseEffectの無限ループの可能性が高い');
    console.log('- ブラウザのコンソールで "🔥 fetchArticles関数が実行されました" が繰り返し表示されるか確認してください');

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

debugLoadingIssue().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});