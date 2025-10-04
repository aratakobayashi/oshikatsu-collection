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

async function checkArticlesDetails() {
  console.log('📝 記事関連の詳細情報を調査中...\n');

  // 記事の基本統計
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  console.log('=== 記事の基本情報 ===');
  console.log(`📝 総記事数: ${totalArticles}件\n`);

  // 記事の詳細情報を取得
  const { data: articles, error: articlesError } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (articlesError) {
    console.error('記事取得エラー:', articlesError);
    return;
  }

  // ステータス別の内訳
  const statusCounts = {};
  articles.forEach(article => {
    const status = article.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  console.log('【ステータス別内訳】');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}件`);
  });

  // カテゴリ別の内訳
  const categoryCounts = {};
  articles.forEach(article => {
    const category = article.category || '未分類';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  console.log('\n【カテゴリ別内訳】');
  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count}件`);
    });

  // 著者別の内訳
  const authorCounts = {};
  articles.forEach(article => {
    const author = article.author || '不明';
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  });

  console.log('\n【著者別内訳】');
  Object.entries(authorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([author, count]) => {
      console.log(`  ${author}: ${count}件`);
    });

  // 人気記事TOP10（ビュー数順）
  const popularArticles = articles
    .filter(a => a.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  if (popularArticles.length > 0) {
    console.log('\n【人気記事TOP10（ビュー数順）】');
    popularArticles.forEach((article, index) => {
      console.log(`  ${index + 1}. ${article.title}`);
      console.log(`     Views: ${article.views || 0}, Likes: ${article.likes || 0}`);
    });
  }

  // 最近公開された記事（5件）
  const recentArticles = articles
    .filter(a => a.published_at)
    .sort((a, b) => new Date(b.published_at) - new Date(a.published_at))
    .slice(0, 5);

  if (recentArticles.length > 0) {
    console.log('\n【最近公開された記事（5件）】');
    recentArticles.forEach(article => {
      const date = new Date(article.published_at).toLocaleDateString('ja-JP');
      console.log(`  ${date}: ${article.title}`);
      if (article.excerpt) {
        console.log(`    ${article.excerpt.substring(0, 50)}...`);
      }
    });
  }

  // タグ情報
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*');

  const { data: articleTags, error: articleTagsError } = await supabase
    .from('article_tags')
    .select(`
      article_id,
      tag_id,
      articles (title),
      tags (name)
    `);

  console.log('\n=== タグ情報 ===');
  console.log(`🏷️ 総タグ数: ${tags?.length || 0}件`);
  console.log(`🔗 記事×タグの紐付け: ${articleTags?.length || 0}件`);

  if (articleTags && articleTags.length > 0) {
    const tagUsageCounts = {};
    articleTags.forEach(at => {
      if (at.tags?.name) {
        tagUsageCounts[at.tags.name] = (tagUsageCounts[at.tags.name] || 0) + 1;
      }
    });

    console.log('\n【よく使われているタグ】');
    Object.entries(tagUsageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([tag, count]) => {
        console.log(`  ${tag}: ${count}記事`);
      });
  }

  // コンテンツの統計
  let totalContentLength = 0;
  let articlesWithContent = 0;
  let articlesWithImage = 0;

  articles.forEach(article => {
    if (article.content) {
      totalContentLength += article.content.length;
      articlesWithContent++;
    }
    if (article.featured_image) {
      articlesWithImage++;
    }
  });

  console.log('\n=== コンテンツ統計 ===');
  console.log(`📄 コンテンツありの記事: ${articlesWithContent}/${totalArticles}件`);
  console.log(`📷 サムネイル画像設定済み: ${articlesWithImage}/${totalArticles}件`);
  if (articlesWithContent > 0) {
    const avgLength = Math.round(totalContentLength / articlesWithContent);
    console.log(`📏 平均コンテンツ長: ${avgLength.toLocaleString()}文字`);
  }

  // 月別投稿数（過去6ヶ月）
  const monthlyPosts = {};
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  articles.forEach(article => {
    const date = new Date(article.created_at);
    if (date >= sixMonthsAgo) {
      const monthKey = `${date.getFullYear()}年${date.getMonth() + 1}月`;
      monthlyPosts[monthKey] = (monthlyPosts[monthKey] || 0) + 1;
    }
  });

  console.log('\n【月別投稿数（過去6ヶ月）】');
  Object.entries(monthlyPosts)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([month, count]) => {
      console.log(`  ${month}: ${count}件`);
    });

  // 記事のURL構造を確認
  console.log('\n【記事のURL（slug）サンプル（5件）】');
  articles.slice(0, 5).forEach(article => {
    console.log(`  /${article.slug || 'no-slug'} - ${article.title}`);
  });

  process.exit(0);
}

checkArticlesDetails().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});