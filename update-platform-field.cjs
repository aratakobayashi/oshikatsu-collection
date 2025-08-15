const { createClient } = require('@supabase/supabase-js');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePlatformField() {
  console.log('🔧 エピソードのプラットフォームフィールドを更新中...\n');
  
  // まず全エピソードを取得
  const { data: episodes, error } = await supabase
    .from('episodes')
    .select('id, video_url, platform');
  
  if (error) {
    console.error('❌ エピソード取得エラー:', error);
    return;
  }
  
  console.log(`📊 総エピソード数: ${episodes.length}件\n`);
  
  let youtubeCount = 0;
  let tmdbCount = 0;
  let otherCount = 0;
  let updatedCount = 0;
  
  // プラットフォームを判定して更新
  for (const episode of episodes) {
    let platform = episode.platform;
    
    // video_urlからプラットフォームを判定
    if (episode.video_url) {
      if (episode.video_url.includes('youtube.com') || episode.video_url.includes('youtu.be')) {
        platform = 'youtube';
        youtubeCount++;
      } else if (episode.video_url.includes('themoviedb.org')) {
        platform = 'tmdb';
        tmdbCount++;
      } else if (episode.video_url.includes('twitter.com') || episode.video_url.includes('x.com')) {
        platform = 'twitter';
        otherCount++;
      } else if (episode.video_url.includes('instagram.com')) {
        platform = 'instagram';
        otherCount++;
      } else if (episode.video_url.includes('tiktok.com')) {
        platform = 'tiktok';
        otherCount++;
      } else {
        platform = 'other';
        otherCount++;
      }
    } else {
      // video_urlがない場合は'other'
      platform = 'other';
      otherCount++;
    }
    
    // platformが未設定または変更が必要な場合のみ更新
    if (episode.platform !== platform) {
      const { error: updateError } = await supabase
        .from('episodes')
        .update({ platform })
        .eq('id', episode.id);
      
      if (!updateError) {
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`   更新済み: ${updatedCount}件...`);
        }
      } else {
        console.error(`❌ 更新エラー (${episode.id.substring(0, 8)}):`, updateError.message);
      }
    }
    
    // API制限対策
    if (updatedCount % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n🎉 プラットフォーム更新完了！\n');
  console.log('📊 プラットフォーム別統計:');
  console.log(`   📺 YouTube: ${youtubeCount}件`);
  console.log(`   🎬 TMDB (映画・ドラマ): ${tmdbCount}件`);
  console.log(`   📱 その他 (SNS等): ${otherCount}件`);
  console.log(`\n✅ 更新されたレコード: ${updatedCount}件`);
  
  // 更新後の確認
  const { data: verifyData } = await supabase
    .from('episodes')
    .select('platform')
    .limit(100);
  
  const platformCounts = {};
  verifyData?.forEach(ep => {
    platformCounts[ep.platform || 'null'] = (platformCounts[ep.platform || 'null'] || 0) + 1;
  });
  
  console.log('\n📋 更新後のプラットフォーム分布（サンプル100件）:');
  Object.entries(platformCounts).forEach(([platform, count]) => {
    console.log(`   ${platform}: ${count}件`);
  });
  
  console.log('\n💡 フィルタ機能の確認方法:');
  console.log('1. https://oshikatsu-collection.netlify.app/celebrities/yamada-ryosuke');
  console.log('2. プラットフォームフィルタで「YouTube」や「すべて」を選択');
  console.log('3. 正しくフィルタリングされることを確認');
}

updatePlatformField();