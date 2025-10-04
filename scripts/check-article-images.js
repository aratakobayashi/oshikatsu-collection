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

async function checkArticleImages() {
  console.log('🖼️ 記事の画像設定状況を詳しく調査中...\n');

  // まずカラム名を確認
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('エラー:', error);
    return;
  }

  console.log(`総記事数: ${articles.length}件\n`);

  // まず利用可能なカラムを確認
  if (articles.length > 0) {
    console.log('=== 記事テーブルのカラム一覧 ===');
    const sampleArticle = articles[0];
    const columns = Object.keys(sampleArticle);
    console.log('利用可能なカラム:', columns.join(', '));
    console.log('');

    // 画像関連のカラムを探す
    const imageColumns = columns.filter(col =>
      col.toLowerCase().includes('image') ||
      col.toLowerCase().includes('thumbnail') ||
      col.toLowerCase().includes('img') ||
      col.toLowerCase().includes('photo') ||
      col.toLowerCase().includes('pic')
    );

    if (imageColumns.length > 0) {
      console.log('画像関連と思われるカラム:', imageColumns.join(', '));
    } else {
      console.log('画像関連のカラムが見つかりません');
    }
    console.log('');

    // サンプルデータを表示
    console.log('=== サンプル記事のデータ（1件目） ===');
    console.log(`タイトル: ${sampleArticle.title}`);
    Object.entries(sampleArticle).forEach(([key, value]) => {
      if (value && (
        key.toLowerCase().includes('image') ||
        key.toLowerCase().includes('thumbnail') ||
        key.toLowerCase().includes('img') ||
        key.toLowerCase().includes('url') && typeof value === 'string' && (value.includes('.jpg') || value.includes('.png') || value.includes('.webp'))
      )) {
        console.log(`${key}: ${value}`);
      }
    });
  }

  // フロントエンドのコンポーネントも確認
  console.log('\n=== フロントエンドの画像表示実装を確認 ===');
  console.log('src/components/ArticleCard.tsx や src/pages/Articles.tsx を確認することを推奨');

  process.exit(0);
}

checkArticleImages().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});