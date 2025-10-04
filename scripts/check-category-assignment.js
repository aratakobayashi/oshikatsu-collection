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

async function checkCategoryAssignment() {
  console.log('🔍 カテゴリ割り当て状況を確認中...\n');

  // 1. 既存カテゴリの確認
  const { data: categories, error: catError } = await supabase
    .from('article_categories')
    .select('*')
    .order('name');

  if (catError) {
    console.error('❌ カテゴリ取得エラー:', catError);
    return;
  }

  console.log('=== 既存カテゴリ ===');
  categories.forEach((cat, index) => {
    console.log(`${index + 1}. ${cat.name} (ID: ${cat.id}, slug: ${cat.slug})`);
  });

  // 2. 記事のカテゴリ割り当て状況
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('id, title, category_id')
    .order('created_at', { ascending: false });

  if (articlesError) {
    console.error('❌ 記事取得エラー:', articlesError);
    return;
  }

  console.log('\n=== 記事のカテゴリ割り当て状況 ===');
  const articlesWithCategory = articles.filter(a => a.category_id);
  const articlesWithoutCategory = articles.filter(a => !a.category_id);

  console.log(`総記事数: ${articles.length}件`);
  console.log(`カテゴリ割り当て済み: ${articlesWithCategory.length}件`);
  console.log(`カテゴリ未割り当て: ${articlesWithoutCategory.length}件`);

  // 3. カテゴリ別記事数
  console.log('\n=== カテゴリ別記事数 ===');
  for (const category of categories) {
    const count = articles.filter(a => a.category_id === category.id).length;
    console.log(`${category.name}: ${count}件`);
  }

  // 4. カテゴリ未割り当ての記事サンプル
  if (articlesWithoutCategory.length > 0) {
    console.log('\n=== カテゴリ未割り当て記事（サンプル10件） ===');
    articlesWithoutCategory.slice(0, 10).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
    });
  }

  // 5. 自動割り当て提案
  if (articlesWithoutCategory.length > 0) {
    console.log('\n=== 自動カテゴリ割り当て提案 ===');
    console.log('未割り当ての記事にカテゴリを自動で割り当てますか？');
    console.log('実行するには次のスクリプトを使用:');
    console.log('npx tsx scripts/assign-categories-to-articles.js');
  }

  process.exit(0);
}

checkCategoryAssignment().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});