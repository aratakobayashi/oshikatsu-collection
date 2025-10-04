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

async function checkAllArticleImages() {
  console.log('🖼️ 記事の画像設定を完全チェック中...\n');

  // 記事データを取得
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, featured_image_url, featured_image_alt')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('エラー:', error);
    return;
  }

  console.log(`=== 画像設定状況 ===`);
  console.log(`総記事数: ${articles.length}件\n`);

  // 画像設定状況をチェック
  const withImage = articles.filter(a => a.featured_image_url);
  const withoutImage = articles.filter(a => !a.featured_image_url);
  const withAltText = articles.filter(a => a.featured_image_alt);

  console.log(`✅ 画像URL設定済み: ${withImage.length}件 (${Math.round(withImage.length / articles.length * 100)}%)`);
  console.log(`❌ 画像URL未設定: ${withoutImage.length}件 (${Math.round(withoutImage.length / articles.length * 100)}%)`);
  console.log(`📝 Alt text設定済み: ${withAltText.length}件 (${Math.round(withAltText.length / articles.length * 100)}%)\n`);

  // 画像URLのドメインを分析
  const domains = {};
  withImage.forEach(article => {
    try {
      const url = new URL(article.featured_image_url);
      const domain = url.hostname;
      domains[domain] = (domains[domain] || 0) + 1;
    } catch (e) {
      domains['invalid'] = (domains['invalid'] || 0) + 1;
    }
  });

  console.log('=== 画像URLのドメイン分布 ===');
  Object.entries(domains)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
      console.log(`  ${domain}: ${count}件`);
    });

  // 画像未設定の記事リスト
  if (withoutImage.length > 0) {
    console.log(`\n=== 画像未設定の記事（${withoutImage.length}件） ===`);
    withoutImage.slice(0, 10).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   slug: ${article.slug}`);
    });

    if (withoutImage.length > 10) {
      console.log(`\n...他${withoutImage.length - 10}件`);
    }
  }

  // 画像設定済みのサンプル
  if (withImage.length > 0) {
    console.log('\n=== 画像設定済みのサンプル（3件） ===');
    withImage.slice(0, 3).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   URL: ${article.featured_image_url}`);
      console.log(`   Alt: ${article.featured_image_alt || '未設定'}`);
    });
  }

  console.log('\n📊 結論:');
  if (withImage.length === articles.length) {
    console.log('✅ すべての記事に画像が設定されています！');
  } else if (withImage.length > 0) {
    console.log(`⚠️ ${withImage.length}/${articles.length}件の記事に画像が設定済みです。`);
    console.log(`残り${withoutImage.length}件の設定が必要です。`);
  } else {
    console.log('❌ まだ画像が設定されていません。');
  }

  process.exit(0);
}

checkAllArticleImages().catch(error => {
  console.error('エラー:', error);
  process.exit(1);
});