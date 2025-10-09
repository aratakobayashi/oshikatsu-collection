import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://awaarykghpylggygkiyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'
);

async function checkArticleImages() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, featured_image_url, status')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const withoutImage = articles.filter(a => {
    return !a.featured_image_url;
  });
  const withImage = articles.filter(a => {
    return a.featured_image_url;
  });

  console.log('=== 記事のアイキャッチ画像状況 ===');
  console.log('総記事数:', articles.length);
  console.log('アイキャッチあり:', withImage.length);
  console.log('アイキャッチなし:', withoutImage.length);
  console.log('');
  console.log('=== アイキャッチがない記事 ===');
  withoutImage.forEach((a, i) => {
    console.log(`${i + 1}. ${a.title} (slug: ${a.slug}, status: ${a.status})`);
  });
}

checkArticleImages();
