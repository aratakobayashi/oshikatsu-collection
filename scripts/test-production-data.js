// 本番環境のSupabaseから記事データを取得するテスト
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testArticleData() {
  console.log('=== 本番環境の記事データテスト ===');

  try {
    // 1. 記事一覧の取得テスト
    console.log('\n1. 記事一覧の取得...');
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .limit(5);

    if (articlesError) {
      console.error('記事一覧取得エラー:', articlesError);
    } else {
      console.log(`記事数: ${articles.length}`);
      articles.forEach(article => {
        console.log(`- ${article.title} (slug: ${article.slug})`);
      });
    }

    // 2. 特定記事の取得テスト
    console.log('\n2. 京本大我記事の取得...');
    const { data: kyomotoArticle, error: kyomotoError } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', 'kyomoto-taiga-sixtones-vocal-guide')
      .single();

    if (kyomotoError) {
      console.error('京本大我記事取得エラー:', kyomotoError);
    } else if (kyomotoArticle) {
      console.log('記事が見つかりました:');
      console.log(`タイトル: ${kyomotoArticle.title}`);
      console.log(`スラッグ: ${kyomotoArticle.slug}`);
      console.log(`コンテンツの最初の100文字: ${kyomotoArticle.content.substring(0, 100)}...`);
      console.log(`マークダウン記法チェック:`);
      console.log(`- ### 見出し: ${kyomotoArticle.content.includes('###') ? '含まれている' : '含まれていない'}`);
      console.log(`- ** 太字: ${kyomotoArticle.content.includes('**') ? '含まれている' : '含まれていない'}`);
    } else {
      console.log('記事が見つかりませんでした');
    }

    // 3. データベース接続テスト
    console.log('\n3. データベース接続テスト...');
    const { data: testQuery, count } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });

    console.log(`データベース接続: 正常 (総記事数: ${count})`);

  } catch (error) {
    console.error('テスト実行エラー:', error);
  }
}

testArticleData();