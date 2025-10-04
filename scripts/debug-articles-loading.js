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

async function debugArticlesLoading() {
  console.log('🔍 記事一覧のローディング問題をデバッグ中...\n');

  try {
    // 1. article_categories テーブルの確認
    console.log('=== 1. article_categories テーブル確認 ===');
    const { data: categories, error: catError } = await supabase
      .from('article_categories')
      .select('*')
      .order('name');

    if (catError) {
      console.error('❌ カテゴリエラー:', catError);
    } else {
      console.log('✅ カテゴリ取得成功:', categories?.length, '件');
    }

    // 2. article_tags テーブルの確認
    console.log('\n=== 2. article_tags テーブル確認 ===');
    const { data: tags, error: tagError } = await supabase
      .from('article_tags')
      .select('*')
      .order('name');

    if (tagError) {
      console.error('❌ タグエラー:', tagError);
    } else {
      console.log('✅ タグ取得成功:', tags?.length, '件');
    }

    // 3. articles テーブルの確認（記事一覧と同じクエリ）
    console.log('\n=== 3. articles テーブル確認（記事一覧と同じクエリ） ===');
    const { data: articles, error: articlesError, count } = await supabase
      .from('articles')
      .select('id, title, slug, excerpt, published_at, featured_image_url, category_id, tag_ids', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(0, 8); // 最初の9件

    if (articlesError) {
      console.error('❌ 記事取得エラー:', articlesError);
    } else {
      console.log('✅ 記事取得成功:', articles?.length, '件 / 総数:', count);

      // サンプル記事の tag_ids を確認
      if (articles && articles.length > 0) {
        console.log('\n--- サンプル記事のtag_ids ---');
        articles.slice(0, 3).forEach((article, index) => {
          console.log(`${index + 1}. ${article.title.substring(0, 40)}...`);
          console.log(`   tag_ids: ${JSON.stringify(article.tag_ids)} (型: ${typeof article.tag_ids})`);

          // tag_idsが配列でない場合は問題
          if (article.tag_ids && !Array.isArray(article.tag_ids)) {
            console.log('   ⚠️ tag_idsが配列ではありません！');
          }
        });
      }
    }

    // 4. 特定のタグIDでのoverlaps検索テスト
    if (tags && tags.length > 0) {
      console.log('\n=== 4. タグフィルタリングテスト ===');
      const testTagId = tags[0].id;
      console.log(`テスト用タグ: ${tags[0].name} (ID: ${testTagId})`);

      const { data: filteredArticles, error: filterError } = await supabase
        .from('articles')
        .select('id, title, tag_ids')
        .eq('status', 'published')
        .overlaps('tag_ids', [testTagId])
        .limit(5);

      if (filterError) {
        console.error('❌ タグフィルタリングエラー:', filterError);
        console.log('🔍 これがローディング問題の原因の可能性があります');
      } else {
        console.log('✅ タグフィルタリング成功:', filteredArticles?.length, '件');
      }
    }

    // 5. カテゴリフィルタリングテスト
    if (categories && categories.length > 0) {
      console.log('\n=== 5. カテゴリフィルタリングテスト ===');
      const testCategoryId = categories[0].id;
      console.log(`テスト用カテゴリ: ${categories[0].name} (ID: ${testCategoryId})`);

      const { data: filteredByCategory, error: categoryFilterError } = await supabase
        .from('articles')
        .select('id, title, category_id')
        .eq('status', 'published')
        .eq('category_id', testCategoryId)
        .limit(5);

      if (categoryFilterError) {
        console.error('❌ カテゴリフィルタリングエラー:', categoryFilterError);
      } else {
        console.log('✅ カテゴリフィルタリング成功:', filteredByCategory?.length, '件');
      }
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }

  process.exit(0);
}

debugArticlesLoading().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});