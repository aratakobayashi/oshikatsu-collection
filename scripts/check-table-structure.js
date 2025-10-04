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

async function checkTableStructure() {
  console.log('🔍 テーブル構造を確認中...\n');

  // tagsテーブルの構造を確認
  try {
    const { data: tagSample } = await supabase
      .from('tags')
      .select('*')
      .limit(1);

    console.log('=== tagsテーブル構造 ===');
    if (tagSample && tagSample.length > 0) {
      console.log('カラム:', Object.keys(tagSample[0]).join(', '));
      console.log('サンプルデータ:', tagSample[0]);
    } else {
      console.log('tagsテーブルにデータがありません。カラム構造を確認します...');

      // 空のinsertを試してエラーからカラム構造を推測
      const { error } = await supabase.from('tags').insert([{}]);
      console.log('Insert error (カラム情報):', error?.message);
    }
  } catch (error) {
    console.log('tagsテーブルエラー:', error.message);
  }

  // categoriesテーブルの確認
  try {
    const { data: catSample, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(1);

    console.log('\n=== categoriesテーブル構造 ===');
    if (catError) {
      console.log('categoriesテーブルエラー:', catError.message);
      if (catError.code === '42P01') {
        console.log('categoriesテーブルが存在しません。');
      }
    } else if (catSample && catSample.length > 0) {
      console.log('カラム:', Object.keys(catSample[0]).join(', '));
      console.log('サンプルデータ:', catSample[0]);
    } else {
      console.log('categoriesテーブルは存在しますが、データがありません。');
    }
  } catch (error) {
    console.log('categoriesテーブルエラー:', error.message);
  }

  // articlesテーブルの関連カラムを確認
  try {
    const { data: articleSample } = await supabase
      .from('articles')
      .select('id, title, category_id, tag_ids')
      .limit(1);

    console.log('\n=== articlesテーブル関連カラム ===');
    if (articleSample && articleSample.length > 0) {
      console.log('関連カラム:', Object.keys(articleSample[0]).join(', '));
      console.log('サンプルデータ:', articleSample[0]);
    }
  } catch (error) {
    console.log('articlesテーブルエラー:', error.message);
  }

  // article_tagsテーブルの確認
  try {
    const { data: atSample } = await supabase
      .from('article_tags')
      .select('*')
      .limit(1);

    console.log('\n=== article_tagsテーブル構造 ===');
    if (atSample && atSample.length > 0) {
      console.log('カラム:', Object.keys(atSample[0]).join(', '));
      console.log('サンプルデータ:', atSample[0]);
    } else {
      console.log('article_tagsテーブルにデータがありません。');
    }
  } catch (error) {
    console.log('article_tagsテーブルエラー:', error.message);
  }

  process.exit(0);
}

checkTableStructure().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});