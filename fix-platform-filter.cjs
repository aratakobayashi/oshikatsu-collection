const { createClient } = require('@supabase/supabase-js');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeEpisodes() {
  console.log('🔍 エピソードのプラットフォーム分析\n');
  
  // 全エピソードを取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, video_url, title');
  
  if (error) {
    console.error('❌ エピソード取得エラー:', error);
    return;
  }
  
  console.log(`📊 総エピソード数: ${episodes.length}件\n`);
  
  // プラットフォーム別に分類
  const platforms = {
    youtube: [],
    tmdb: [],
    other: []
  };
  
  episodes.forEach(episode => {
    if (!episode.video_url) {
      platforms.other.push(episode);
    } else if (episode.video_url.includes('youtube.com') || episode.video_url.includes('youtu.be')) {
      platforms.youtube.push(episode);
    } else if (episode.video_url.includes('themoviedb.org')) {
      platforms.tmdb.push(episode);
    } else {
      platforms.other.push(episode);
    }
  });
  
  console.log('📋 プラットフォーム別統計:');
  console.log(`   📺 YouTube: ${platforms.youtube.length}件`);
  console.log(`   🎬 TMDB (映画・ドラマ): ${platforms.tmdb.length}件`);
  console.log(`   📱 その他: ${platforms.other.length}件`);
  
  // サンプル表示
  console.log('\n📺 YouTubeエピソードサンプル:');
  platforms.youtube.slice(0, 3).forEach(ep => {
    console.log(`   - ${ep.title}`);
  });
  
  console.log('\n🎬 TMDBエピソードサンプル:');
  platforms.tmdb.slice(0, 3).forEach(ep => {
    console.log(`   - ${ep.title}`);
  });
  
  console.log('\n⚠️ 問題の原因:');
  console.log('データベースに「platform」カラムが存在しないため、フィルタ機能が動作しません。');
  
  console.log('\n✅ 解決方法:');
  console.log('フロントエンド側でvideo_urlから動的にプラットフォームを判定するようにコードを修正します。');
}

analyzeEpisodes();