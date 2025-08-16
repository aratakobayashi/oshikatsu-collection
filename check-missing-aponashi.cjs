const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMissingAponashi() {
  console.log('🔍 SixTONES「アポなし旅」シリーズの不足動画調査\n');
  
  const sixtonesChannelId = 'UCwjAKjycHHT1QzHrQN5Stww';
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  // YouTube APIでアポなし旅シリーズを検索
  console.log('📺 YouTube APIで「アポなし旅」を検索中...');
  
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${sixtonesChannelId}&q=アポなし旅&type=video&maxResults=50&order=date&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const searchData = await response.json();
    
    if (!searchData.items) {
      console.log('❌ YouTube API検索結果が空です');
      return;
    }
    
    console.log(`✅ YouTube APIで${searchData.items.length}件の「アポなし旅」動画を発見\n`);
    
    // 詳細情報を取得
    const videoIds = searchData.items.map(item => item.id.videoId);
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    console.log('📋 YouTube上の全「アポなし旅」シリーズ:');
    console.log('='.repeat(80));
    
    for (const video of detailsData.items) {
      const duration = parseDuration(video.contentDetails.duration);
      const publishDate = new Date(video.snippet.publishedAt).toLocaleDateString('ja-JP');
      
      console.log(`📹 ${video.snippet.title}`);
      console.log(`   📅 ${publishDate}`);
      console.log(`   ⏱️ ${duration}分`);
      console.log(`   🆔 ${video.id}`);
      
      // データベースに存在するかチェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', video.id)
        .single();
      
      if (existing) {
        console.log('   ✅ データベースに存在');
      } else {
        console.log('   ❌ データベースに不足');
      }
      console.log('');
    }
    
    // 不足している動画をカウント
    const missingVideos = [];
    for (const video of detailsData.items) {
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', video.id)
        .single();
      
      if (!existing) {
        missingVideos.push(video);
      }
    }
    
    console.log('\n📊 結果サマリー:');
    console.log(`- YouTube上の「アポなし旅」: ${detailsData.items.length}件`);
    console.log(`- データベース内の「アポなし旅」: ${detailsData.items.length - missingVideos.length}件`);
    console.log(`- 不足している動画: ${missingVideos.length}件`);
    
    if (missingVideos.length > 0) {
      console.log('\n⚠️ 不足している「アポなし旅」動画:');
      missingVideos.forEach((video, index) => {
        const duration = parseDuration(video.contentDetails.duration);
        console.log(`${index + 1}. ${video.snippet.title} (${duration}分)`);
      });
      
      console.log('\n💡 不足理由の推測:');
      console.log('- ショート動画フィルター（1分以下除外）で除外された');
      console.log('- API取得時のページ制限で取得されなかった');
      console.log('- タイトルにキーワードが含まれず検索対象外だった');
    }
    
  } catch (error) {
    console.error('❌ YouTube API エラー:', error.message);
  }
}

// 期間をISO 8601から分に変換
function parseDuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return Math.round(hours * 60 + minutes + seconds / 60);
  }
  return 0;
}

checkMissingAponashi();