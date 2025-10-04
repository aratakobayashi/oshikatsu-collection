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

async function reassignCategories() {
  console.log('🔄 記事のカテゴリを再配分中...\n');

  // 1. カテゴリとカテゴリIDマップを作成
  const { data: categories } = await supabase
    .from('article_categories')
    .select('*');

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
  });

  console.log('=== 利用可能カテゴリ ===');
  categories.forEach(cat => {
    console.log(`${cat.name} (${cat.slug})`);
  });

  // 2. 全記事を取得
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, content, category_id');

  console.log(`\n📄 総記事数: ${articles.length}件`);

  let updateCount = 0;

  // 3. 記事のタイトルと内容を分析してカテゴリを再配分
  for (const article of articles) {
    const title = article.title.toLowerCase();
    const content = (article.content || '').toLowerCase();
    const combined = title + ' ' + content;

    let newCategoryId = null;

    // カテゴリ判定ロジック
    if (combined.includes('timelesz') || title.includes('篠塚') || title.includes('橋本') || title.includes('猪俣')) {
      newCategoryId = categoryMap['idol-introduction']; // アイドル紹介
    } else if (combined.includes('レポ') || combined.includes('公演') || combined.includes('コンサート') && combined.includes('セット')) {
      newCategoryId = categoryMap['live-report']; // ライブレポート
    } else if (combined.includes('攻略ガイド') || combined.includes('アクセス') || combined.includes('座席') || combined.includes('会場')) {
      newCategoryId = categoryMap['venue-guide']; // ライブ会場ガイド
    } else if (combined.includes('準備') || combined.includes('持ち物') || combined.includes('コーデ') || combined.includes('痛バ') || combined.includes('うちわ')) {
      newCategoryId = categoryMap['live-preparation']; // 参戦準備・コーデ
    } else if (combined.includes('節約') || combined.includes('お得') || combined.includes('費用') || combined.includes('wi-fi')) {
      newCategoryId = categoryMap['saving-tips']; // 推し活×節約・お得術
    } else if (combined.includes('初心者') || combined.includes('始め') || combined.includes('とは') || combined.includes('入門') || combined.includes('基本')) {
      newCategoryId = categoryMap['beginner-oshi']; // はじめての推し活
    } else {
      // デフォルトはライブ関連が多いので「はじめての推し活」に
      newCategoryId = categoryMap['beginner-oshi'];
    }

    // カテゴリが変更される場合のみ更新
    if (newCategoryId && newCategoryId !== article.category_id) {
      const { error } = await supabase
        .from('articles')
        .update({ category_id: newCategoryId })
        .eq('id', article.id);

      if (error) {
        console.error(`❌ ${article.title}: ${error.message}`);
      } else {
        const newCategory = categories.find(c => c.id === newCategoryId);
        const oldCategory = categories.find(c => c.id === article.category_id);
        console.log(`✅ ${article.title.substring(0, 50)}...`);
        console.log(`   ${oldCategory?.name} → ${newCategory?.name}`);
        updateCount++;
      }
    }
  }

  // 4. 結果確認
  console.log(`\n🎉 ${updateCount}件の記事カテゴリを更新しました`);

  // 5. 更新後のカテゴリ別記事数を確認
  console.log('\n=== 更新後のカテゴリ別記事数 ===');
  for (const category of categories) {
    const { count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    console.log(`${category.name}: ${count}件`);
  }

  process.exit(0);
}

reassignCategories().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});