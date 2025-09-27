import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function checkInstagramContent() {
  console.log('🔍 Instagram埋め込みコンテンツを調査中...');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('title, content')
    .ilike('title', '%橋本将生%')
    .limit(1);

  if (error || !articles || articles.length === 0) {
    console.error('❌ エラー:', error);
    return;
  }

  const article = articles[0];
  console.log('📄 記事:', article.title);

  // Instagram関連のコンテンツを探す
  const instagramIframes = article.content.match(/<iframe[^>]*src="[^"]*instagram[^"]*"[^>]*>[\s\S]*?<\/iframe>/gi);
  const instagramBlockquotes = article.content.match(/<blockquote[^>]*instagram[^>]*>[\s\S]*?<\/blockquote>/gi);
  const instagramUrls = article.content.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s<>]+/gi);

  console.log('\n📊 Instagram コンテンツ分析:');
  console.log('━'.repeat(60));

  if (instagramIframes) {
    console.log(`\n📱 Instagram iframes: ${instagramIframes.length}個`);
    instagramIframes.forEach((iframe, index) => {
      console.log(`\n[iframe ${index + 1}]`);
      // srcを抽出
      const srcMatch = iframe.match(/src="([^"]+)"/);
      if (srcMatch) {
        console.log(`  URL: ${srcMatch[1]}`);
      }
      // 最初の200文字を表示
      console.log(`  HTML: ${iframe.substring(0, 200)}...`);
    });
  }

  if (instagramBlockquotes) {
    console.log(`\n📱 Instagram blockquotes: ${instagramBlockquotes.length}個`);
    instagramBlockquotes.forEach((blockquote, index) => {
      console.log(`\n[blockquote ${index + 1}]`);
      console.log(`  HTML: ${blockquote.substring(0, 200)}...`);
    });
  }

  if (instagramUrls) {
    console.log(`\n📱 Instagram URLs: ${instagramUrls.length}個`);
    instagramUrls.forEach((url, index) => {
      console.log(`  [${index + 1}] ${url}`);
    });
  }

  if (!instagramIframes && !instagramBlockquotes && !instagramUrls) {
    console.log('❌ Instagramコンテンツが見つかりません');
  }
}

checkInstagramContent().catch(console.error);