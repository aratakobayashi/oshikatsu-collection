const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTube Data API v3キー
const YOUTUBE_API_KEY = 'AIzaSyDJg67fCmpZd9t8fQQr1rDWWFzWc0XeFWM';

// SixTONESのYouTubeチャンネルID
const SIXTONES_CHANNEL_ID = 'UCwjAKjycHHT1QzHrQN5Stww';

// プラットフォーム検出
function getPlatformFromUrl(url) {
  if (url?.includes('youtube.com') || url?.includes('youtu.be')) {
    return 'youtube';
  }
  return 'unknown';
}

// 動画時間を秒から分に変換
function parseDuration(duration) {
  if (!duration) return null;
  
  // ISO 8601 duration format (PT4M13S) をパース
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 60 + minutes + Math.round(seconds / 60);
}

// YouTubeから動画リストを取得
async function fetchYouTubeVideos(channelId, maxResults = 50) {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${maxResults}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      console.error('YouTube API エラー:', data.error);
      return [];
    }
    
    // 詳細情報を取得（動画時間、再生回数など）
    const videoIds = data.items.map(item => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    return detailsData.items || [];
  } catch (error) {
    console.error('YouTube API取得エラー:', error);
    return [];
  }
}

// エピソード保存
async function saveEpisode(episodeData, celebrityId) {
  const videoUrl = `https://www.youtube.com/watch?v=${episodeData.id}`;
  
  // 既存チェック
  const { data: existing } = await supabase
    .from('episodes')
    .select('id')
    .eq('video_url', videoUrl)
    .single();
  
  if (existing) {
    console.log(`   📺 既存: ${episodeData.snippet.title.substring(0, 50)}...`);
    return existing.id;
  }
  
  const publishedAt = new Date(episodeData.snippet.publishedAt);
  const duration = parseDuration(episodeData.contentDetails?.duration);
  const viewCount = parseInt(episodeData.statistics?.viewCount || 0);
  
  const newEpisode = {
    id: crypto.randomUUID(),
    title: episodeData.snippet.title,
    date: publishedAt.toISOString().split('T')[0],
    video_url: videoUrl,
    thumbnail_url: episodeData.snippet.thumbnails?.high?.url || episodeData.snippet.thumbnails?.default?.url,
    duration: duration,
    view_count: viewCount,
    description: episodeData.snippet.description?.substring(0, 500) || null, // 説明を500文字に制限
    platform: getPlatformFromUrl(videoUrl),
    celebrity_id: celebrityId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('episodes')
    .insert(newEpisode);
  
  if (error) {
    console.error(`❌ 保存エラー: ${error.message}`);
    return null;
  }
  
  return newEpisode.id;
}

// メイン処理
async function fetchSixTONESEpisodes() {
  console.log('📺 SixTONESのYouTubeエピソードを収集開始！\n');
  
  try {
    // SixTONESグループのセレブリティIDを取得
    const { data: sixtoneCelebrity } = await supabase
      .from('celebrities')
      .select('id')
      .eq('name', 'SixTONES')
      .single();
      
    if (!sixtoneCelebrity) {
      console.log('❌ SixTONESのセレブリティ情報が見つかりません');
      return;
    }
    
    console.log('🔍 YouTubeから動画情報を取得中...');
    const videos = await fetchYouTubeVideos(SIXTONES_CHANNEL_ID, 30); // 最新30本を取得
    
    if (videos.length === 0) {
      console.log('❌ 動画が取得できませんでした');
      return;
    }
    
    console.log(`📺 取得した動画数: ${videos.length}件\n`);
    
    let totalAdded = 0;
    const addedEpisodes = [];
    
    for (const video of videos) {
      const episodeId = await saveEpisode(video, sixtoneCelebrity.id);
      if (episodeId) {
        console.log(`   ✅ エピソード追加: ${video.snippet.title.substring(0, 50)}...`);
        addedEpisodes.push({
          id: episodeId,
          title: video.snippet.title,
          date: video.snippet.publishedAt.split('T')[0]
        });
        totalAdded++;
      }
    }
    
    console.log('\n🎉 SixTONESエピソード取得完了！');
    console.log(`📊 追加件数: ${totalAdded}件`);
    
    if (addedEpisodes.length > 0) {
      console.log('\n📋 追加されたエピソード（最新5件）:');
      addedEpisodes.slice(0, 5).forEach(episode => {
        console.log(`   - ${episode.title.substring(0, 60)}... (${episode.date})`);
      });
    }
    
    console.log('\n🔄 次のステップ:');
    console.log('1. Travis JapanのYouTubeエピソードも同様に取得');
    console.log('2. 各エピソードにロケーション・アイテム情報を手動で追加');
    console.log('3. セレブリティ画像をTMDBから取得');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

fetchSixTONESEpisodes();