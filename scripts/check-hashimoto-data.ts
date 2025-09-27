import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function checkData() {
  console.log('🔍 橋本将生の記事データを確認中...');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('title, slug, content')
    .ilike('title', '%橋本将生%')
    .limit(1);

  if (error) {
    console.error('❌ エラー:', error);
    return;
  }

  if (!articles || articles.length === 0) {
    console.log('❌ 橋本将生の記事が見つかりません');
    return;
  }

  const article = articles[0];
  console.log('📄 記事タイトル:', article.title);
  console.log('📄 スラッグ:', article.slug);
  console.log('📄 コンテンツ長:', article.content.length, '文字');

  // YouTube検索
  const youtubeIframes = article.content.match(/<iframe[^>]*src="[^"]*youtube\.com\/embed\/[^"]*"[^>]*><\/iframe>/gi);
  const youtubeUrls = article.content.match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi);

  console.log('🎥 YouTube iframes:', youtubeIframes?.length || 0);
  console.log('🎥 YouTube URLs:', youtubeUrls?.length || 0);

  if (youtubeIframes) {
    console.log('🎬 最初のiframe:', youtubeIframes[0].substring(0, 100) + '...');
  }

  // Instagram検索
  const instagramIframes = article.content.match(/<iframe[^>]*src="[^"]*instagram\.com[^"]*"[^>]*><\/iframe>/gi);
  const instagramUrls = article.content.match(/https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel)\/[a-zA-Z0-9_-]+/gi);

  console.log('📱 Instagram iframes:', instagramIframes?.length || 0);
  console.log('📱 Instagram URLs:', instagramUrls?.length || 0);

  // 全体の埋め込みコンテンツ数をチェック
  const allYoutube = (youtubeIframes?.length || 0) + (youtubeUrls?.length || 0);
  const allInstagram = (instagramIframes?.length || 0) + (instagramUrls?.length || 0);

  console.log('📊 総YouTube埋め込み:', allYoutube);
  console.log('📊 総Instagram埋め込み:', allInstagram);
}

checkData().catch(console.error);