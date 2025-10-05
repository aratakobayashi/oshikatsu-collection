import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://awaarykghpylggygkiyp.supabase.co', process.env.VITE_SUPABASE_ANON_KEY);

async function testYouTubeContent() {
  const { data: article } = await supabase
    .from('articles')
    .select('content')
    .eq('slug', 'kyomoto-taiga-sixtones-vocal-guide')
    .single();

  if (article) {
    console.log('=== Testing YouTube embed tag processing ===');

    // Test the youtube-embed regex from ArticleContent.tsx
    const youtubeEmbedRegex = /<youtube-embed\s+video-id="([^"]+)"(?:\s+title="([^"]+)")?\s*><\/youtube-embed>/g;

    let match;
    let count = 0;
    while ((match = youtubeEmbedRegex.exec(article.content)) !== null) {
      count++;
      console.log(`YouTube Embed ${count}:`);
      console.log(`  Full match: ${match[0]}`);
      console.log(`  Video ID: ${match[1]}`);
      console.log(`  Title: ${match[2] || 'No title'}`);
      console.log(`  Thumbnail: https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
      console.log('');
    }

    console.log(`Total YouTube embeds found: ${count}`);

    // Show sample of the content to see how it's stored
    console.log('=== Sample content ===');
    console.log(article.content.substring(0, 800) + '...');
  } else {
    console.log('Article not found');
  }
}

testYouTubeContent().catch(console.error);