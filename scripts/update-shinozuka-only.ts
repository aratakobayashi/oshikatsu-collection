import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

function cleanSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

async function fetchWordPressContent(slug: string): Promise<string | null> {
  try {
    console.log(`🔍 WordPressから取得中: ${slug}`);

    const response = await fetch(`https://oshikatsu-guide.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=true`);

    if (!response.ok) {
      console.log(`❌ WordPress API エラー: ${response.status}`);
      return null;
    }

    const posts = await response.json();

    if (!posts || posts.length === 0) {
      console.log(`❌ 記事が見つかりません: ${slug}`);
      return null;
    }

    const post = posts[0];
    console.log(`✅ WordPress記事を取得: ${post.title.rendered}`);

    return post.content.rendered;
  } catch (error) {
    console.error(`❌ エラー (${slug}):`, error);
    return null;
  }
}

async function updateShinozukaArticle() {
  console.log('🚀 篠塚大輝記事の更新開始');

  // 篠塚大輝の記事を取得
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, content')
    .ilike('title', '%篠塚大輝%')
    .limit(1);

  if (error) {
    console.error('❌ データベースエラー:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('❌ 篠塚大輝の記事が見つかりません');
    return;
  }

  const article = articles[0];
  console.log('📄 記事:', article.title);
  console.log('📄 現在の長さ:', article.content.length, '文字');

  // WordPressから元コンテンツを取得
  const cleanedSlug = cleanSlug(article.slug);
  const wordpressContent = await fetchWordPressContent(cleanedSlug);

  if (!wordpressContent) {
    console.log('❌ WordPress コンテンツ取得失敗');
    return;
  }

  console.log('📄 WordPress長さ:', wordpressContent.length, '文字');

  // YouTube/Instagram分析
  const youtubeIframes = wordpressContent.match(/<iframe[^>]*src="[^"]*youtube\.com\/embed\/[^"]*"[^>]*><\/iframe>/gi);
  const instagramIframes = wordpressContent.match(/<iframe[^>]*src="[^"]*instagram\.com[^"]*"[^>]*><\/iframe>/gi);

  console.log('🎥 YouTube iframes:', youtubeIframes?.length || 0);
  console.log('📱 Instagram iframes:', instagramIframes?.length || 0);

  // データベースを更新
  console.log('🔄 データベース更新試行中...');

  try {
    const { error: updateError } = await supabase
      .from('articles')
      .update({
        content: wordpressContent,
        updated_at: new Date().toISOString()
      })
      .eq('id', article.id);

    if (updateError) {
      console.log('❌ 更新エラー:', updateError.message);
    } else {
      console.log('✅ 更新成功！');
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
}

updateShinozukaArticle().catch(console.error);