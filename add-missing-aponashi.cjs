const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

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

// エピソードデータを作成
function createEpisodeData(video, celebrityId) {
  const snippet = video.snippet;
  const statistics = video.statistics || {};
  const contentDetails = video.contentDetails || {};
  
  return {
    id: video.id,
    title: snippet.title,
    description: snippet.description || '',
    date: snippet.publishedAt,
    duration: parseDuration(contentDetails.duration),
    thumbnail_url: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
    video_url: `https://www.youtube.com/watch?v=${video.id}`,
    view_count: parseInt(statistics.viewCount || '0'),
    like_count: parseInt(statistics.likeCount || '0'),
    comment_count: parseInt(statistics.commentCount || '0'),
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function addMissingAponashiEpisodes() {
  console.log('🎯 不足している「アポなし旅」シリーズを追加開始！\n');
  
  const sixtonesChannelId = 'UCwjAKjycHHT1QzHrQN5Stww';
  const sixtonesId = 'aaecc5fd-67d6-40ef-846c-6c4f914785b7';
  
  // YouTube APIでアポなし旅シリーズを検索
  console.log('📺 YouTube APIで「アポなし旅」関連動画を取得中...');
  
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${sixtonesChannelId}&q=アポなし旅 OR 開運の旅 OR ドライブ OR 朝メシ OR 朝ラー OR わんこ&type=video&maxResults=50&order=date&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(searchUrl);
    const searchData = await response.json();
    
    if (!searchData.items) {
      console.log('❌ YouTube API検索結果が空です');
      return;
    }
    
    console.log(`✅ YouTube APIで${searchData.items.length}件の関連動画を発見\n`);
    
    // 詳細情報を取得
    const videoIds = searchData.items.map(item => item.id.videoId);
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    // 1分以上の動画のみをフィルタリング
    const validVideos = detailsData.items.filter(video => {
      const duration = parseDuration(video.contentDetails.duration);
      return duration > 1; // 1分超の動画のみ
    });
    
    console.log(`🎯 1分超の動画: ${validVideos.length}件`);
    
    let addedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const video of validVideos) {
      const duration = parseDuration(video.contentDetails.duration);
      const publishDate = new Date(video.snippet.publishedAt).toLocaleDateString('ja-JP');
      
      console.log(`\n📹 ${video.snippet.title}`);
      console.log(`   📅 ${publishDate} | ⏱️ ${duration}分`);
      
      // データベースに存在するかチェック
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', video.id)
        .single();
      
      if (existing) {
        console.log('   ✅ 既に存在 - スキップ');
        skippedCount++;
        continue;
      }
      
      // エピソードデータを作成
      try {
        const episode = createEpisodeData(video, sixtonesId);
        
        const { error: insertError } = await supabase
          .from('episodes')
          .insert(episode);
        
        if (insertError) {
          console.log(`   ❌ 追加エラー: ${insertError.message}`);
          errorCount++;
        } else {
          console.log(`   🎉 追加成功！`);
          addedCount++;
        }
        
        // API制限対策
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.log(`   ❌ 処理エラー: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n🎊 不足エピソード追加完了！');
    console.log('='.repeat(60));
    console.log(`📊 結果サマリー:`);
    console.log(`  - 対象動画（1分超）: ${validVideos.length}件`);
    console.log(`  - 新規追加: ${addedCount}件`);
    console.log(`  - 既存スキップ: ${skippedCount}件`);
    console.log(`  - エラー: ${errorCount}件`);
    
    if (addedCount > 0) {
      console.log('\n🌐 確認方法:');
      console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
      console.log('→ 大幅にエピソード数が増加しているはずです！');
      
      console.log('\n🎯 追加されたコンテンツ:');
      console.log('- 最新の「開運の旅2025」シリーズ');
      console.log('- 「アポなし旅 2024夏」の不足分');
      console.log('- 朝食・ドライブ関連の企画動画');
      console.log('- その他のバラエティ企画');
    }
    
  } catch (error) {
    console.error('❌ YouTube API エラー:', error.message);
  }
}

addMissingAponashiEpisodes();