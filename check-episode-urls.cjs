const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEpisodeUrls() {
  console.log('🔍 エピソードのvideo_urlを確認中...\n');
  
  // 山田涼介のエピソードを確認
  const { data: celebrity } = await supabase
    .from('celebrities')
    .select('id')
    .eq('slug', 'yamada-ryosuke')
    .single();
    
  const { data: episodes } = await supabase
    .from('episodes')
    .select('title, video_url')
    .eq('celebrity_id', celebrity.id);
  
  console.log(`📊 山田涼介の総エピソード数: ${episodes.length}件\n`);
  
  const platforms = {
    youtube: [],
    tmdb: [],
    other: [],
    noUrl: []
  };
  
  episodes?.forEach(ep => {
    if (!ep.video_url) {
      platforms.noUrl.push(ep);
    } else if (ep.video_url.includes('youtube.com') || ep.video_url.includes('youtu.be')) {
      platforms.youtube.push(ep);
    } else if (ep.video_url.includes('themoviedb.org')) {
      platforms.tmdb.push(ep);
    } else {
      platforms.other.push(ep);
    }
  });
  
  console.log('📋 プラットフォーム別統計:');
  console.log(`   📺 YouTube: ${platforms.youtube.length}件`);
  console.log(`   🎬 TMDB: ${platforms.tmdb.length}件`);
  console.log(`   📱 その他: ${platforms.other.length}件`);
  console.log(`   ❌ URLなし: ${platforms.noUrl.length}件\n`);
  
  // サンプル表示
  console.log('📺 YouTubeエピソードサンプル:');
  platforms.youtube.slice(0, 3).forEach(ep => {
    console.log(`   ${ep.title}`);
    console.log(`   URL: ${ep.video_url}`);
  });
  
  console.log('\n🎬 TMDBエピソードサンプル:');
  platforms.tmdb.slice(0, 3).forEach(ep => {
    console.log(`   ${ep.title}`);
    console.log(`   URL: ${ep.video_url}`);
  });
  
  // データベースのカラムを確認
  console.log('\n📊 データベース構造の確認:');
  const { data: sampleEpisode } = await supabase
    .from('episodes')
    .select('*')
    .limit(1)
    .single();
  
  console.log('エピソードのカラム:');
  Object.keys(sampleEpisode || {}).forEach(key => {
    const value = sampleEpisode[key];
    const type = typeof value;
    console.log(`   ${key}: ${type} (値: ${JSON.stringify(value)?.substring(0, 50)}...)`);
  });
}

checkEpisodeUrls();