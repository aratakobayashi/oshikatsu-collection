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

async function checkCategoryTables() {
  console.log('🔍 カテゴリ関連テーブルの確認中...\n');

  // 1. categoriesテーブルの確認
  console.log('=== 1. categoriesテーブル ===');
  try {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);

    if (categoriesError) {
      if (categoriesError.code === '42P01') {
        console.log('❌ categoriesテーブルは存在しません');
      } else {
        console.log('❌ categoriesテーブルエラー:', categoriesError.message);
      }
    } else {
      console.log('✅ categoriesテーブルが存在します');
      console.log(`📊 データ数: ${categoriesData?.length || 0}件`);
      if (categoriesData && categoriesData.length > 0) {
        console.log('サンプルデータ:');
        categoriesData.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ categoriesテーブル確認エラー:', error.message);
  }

  // 2. article_categoriesテーブルの確認
  console.log('\n=== 2. article_categoriesテーブル ===');
  try {
    const { data: articleCategoriesData, error: articleCategoriesError } = await supabase
      .from('article_categories')
      .select('*')
      .limit(5);

    if (articleCategoriesError) {
      if (articleCategoriesError.code === '42P01') {
        console.log('❌ article_categoriesテーブルは存在しません');
      } else {
        console.log('❌ article_categoriesテーブルエラー:', articleCategoriesError.message);
      }
    } else {
      console.log('✅ article_categoriesテーブルが存在します');
      console.log(`📊 データ数: ${articleCategoriesData?.length || 0}件`);
      if (articleCategoriesData && articleCategoriesData.length > 0) {
        console.log('サンプルデータ:');
        articleCategoriesData.forEach(cat => {
          console.log(`  - ${cat.name} (${cat.slug || 'no-slug'})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ article_categoriesテーブル確認エラー:', error.message);
  }

  // 3. articlesテーブルのcategory_id使用状況
  console.log('\n=== 3. articlesテーブルのcategory_id使用状況 ===');
  try {
    const { data: articlesWithCategory, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, category_id')
      .not('category_id', 'is', null)
      .limit(5);

    if (articlesError) {
      console.log('❌ articlesテーブル確認エラー:', articlesError.message);
    } else {
      console.log(`✅ category_idが設定されている記事: ${articlesWithCategory?.length || 0}件`);
      if (articlesWithCategory && articlesWithCategory.length > 0) {
        console.log('サンプル:');
        articlesWithCategory.forEach(article => {
          console.log(`  - ${article.title.substring(0, 30)}... (category_id: ${article.category_id})`);
        });
      }
    }
  } catch (error) {
    console.log('❌ articles確認エラー:', error.message);
  }

  // 4. 推奨アクション
  console.log('\n=== 4. 推奨アクション ===');

  // どちらのテーブルが使われているかを判定
  const hasCategoriesTable = categoriesData !== undefined && categoriesError?.code !== '42P01';
  const hasArticleCategoriesTable = articleCategoriesData !== undefined && articleCategoriesError?.code !== '42P01';

  if (hasArticleCategoriesTable && !hasCategoriesTable) {
    console.log('📋 現在はarticle_categoriesテーブルが使用されています');
    console.log('💡 推奨: 新しいcategoriesテーブルを作成し、段階的に移行');
    console.log('\n📝 Supabaseで実行するSQL:');
    console.log('```sql');
    console.log(`-- categoriesテーブルの作成
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(100) DEFAULT 'bg-gray-50 text-gray-700',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 基本カテゴリの挿入
INSERT INTO categories (name, slug, description, color) VALUES
('推し活入門', 'oshikatsu-basics', '推し活を始める人向けの基礎知識', 'bg-blue-50 text-blue-700'),
('イベント参加', 'event-guide', 'ライブやイベントの参加ガイド', 'bg-red-50 text-red-700'),
('グッズ・アイテム', 'goods-items', '推し活グッズや関連アイテム情報', 'bg-green-50 text-green-700'),
('SNS活用', 'sns-tips', 'SNSでの推し活テクニック', 'bg-purple-50 text-purple-700'),
('応援マナー', 'support-manner', 'ファンとしてのマナーや心得', 'bg-yellow-50 text-yellow-700'),
('タレント情報', 'talent-info', 'タレント・アイドルの詳細情報', 'bg-pink-50 text-pink-700'),
('ライブレポート', 'live-report', 'ライブやコンサートのレポート', 'bg-orange-50 text-orange-700')
ON CONFLICT (slug) DO NOTHING;

-- RLS (Row Level Security) の設定
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 公開読み取りポリシー
CREATE POLICY "Categories are publicly readable" ON categories
  FOR SELECT USING (true);
```);
  } else if (hasCategoriesTable) {
    console.log('✅ categoriesテーブルは既に存在します！');
    console.log('💡 アクション: SQLの実行は不要です。そのままデプロイできます。');
  } else {
    console.log('❓ カテゴリテーブルの状況が不明です');
    console.log('💡 推奨: categoriesテーブルを新規作成してください');
  }

  process.exit(0);
}

checkCategoryTables().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});