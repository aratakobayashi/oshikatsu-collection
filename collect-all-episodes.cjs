const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';

const supabase = createClient(supabaseUrl, supabaseKey);

// delay関数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// YouTube API関数
async function fetchYouTubeData(endpoint) {
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}&key=${YOUTUBE_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube API Error: ${response.status} - ${response.statusText}`);
  }
  return response.json();
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

// ショート動画かどうかを判定
function isShortVideo(duration, title) {
  const durationMinutes = parseDuration(duration);
  const isShortByDuration = durationMinutes <= 1; // 1分以下
  const isShortByTitle = title.toLowerCase().includes('#shorts') || 
                        title.includes('ショート') || 
                        title.includes('Short');
  return isShortByDuration || isShortByTitle;
}

// チャンネルの全動画を取得（ページ分割対応）
async function getAllVideosFromChannel(channelId, channelName) {
  console.log(`📺 ${channelName} の全動画を取得中...`);
  
  let allVideos = [];
  let nextPageToken = '';
  let pageCount = 0;
  const maxPages = 20; // 安全制限（最大約1000動画）
  
  do {
    try {
      pageCount++;
      console.log(`  📄 ページ ${pageCount} を取得中...`);
      
      const searchParams = [
        `search?part=snippet`,
        `channelId=${channelId}`,
        `maxResults=50`,
        `order=date`,
        `type=video`,
        nextPageToken ? `pageToken=${nextPageToken}` : ''
      ].filter(Boolean).join('&');
      
      const searchData = await fetchYouTubeData(searchParams);
      
      if (!searchData.items || searchData.items.length === 0) {
        console.log(`  ⚠️ ページ ${pageCount} に動画がありません`);
        break;
      }
      
      console.log(`  📹 ${searchData.items.length}件の動画を発見`);
      allVideos = allVideos.concat(searchData.items);
      
      nextPageToken = searchData.nextPageToken || '';
      
      // API制限対策
      await delay(300);
      
    } catch (error) {
      console.error(`  ❌ ページ ${pageCount} 取得エラー:`, error.message);
      break;
    }
    
  } while (nextPageToken && pageCount < maxPages);
  
  console.log(`✅ ${channelName}: 合計 ${allVideos.length}件の動画を取得完了\n`);
  return allVideos;
}

// 動画の詳細情報を取得
async function getVideoDetails(videoIds) {
  if (videoIds.length === 0) return [];
  
  const chunks = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }
  
  let allDetails = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  🔍 詳細情報取得 (${i + 1}/${chunks.length}): ${chunk.length}件`);
    
    try {
      const detailsData = await fetchYouTubeData(
        `videos?part=snippet,statistics,contentDetails&id=${chunk.join(',')}`
      );
      
      if (detailsData.items) {
        allDetails = allDetails.concat(detailsData.items);
      }
      
      // API制限対策
      await delay(300);
      
    } catch (error) {
      console.error(`  ❌ 詳細情報取得エラー (チャンク ${i + 1}):`, error.message);
    }
  }
  
  return allDetails;
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

// メイン処理
async function collectAllEpisodes() {
  console.log('🎬 SixTONES & Travis Japan 全エピソード収集開始！\n');
  
  const channels = [
    {
      name: 'SixTONES',
      channelId: 'UCwjAKjycHHT1QzHrQN5Stww',
      celebrityId: 'aaecc5fd-67d6-40ef-846c-6c4f914785b7'
    },
    {
      name: 'Travis Japan',
      channelId: 'UCoEIdZkDEZdrCDCJSqwifzw',
      celebrityId: '46ccba0d-742f-4152-9d87-f10cefadbb6d'
    }
  ];
  
  for (const channel of channels) {
    console.log(`\n🎭 ${channel.name} の処理開始`);
    console.log('='.repeat(50));
    
    try {
      // 既存エピソードを削除
      console.log(`🗑️ 既存エピソードを削除中...`);
      const { error: deleteError } = await supabase
        .from('episodes')
        .delete()
        .eq('celebrity_id', channel.celebrityId);
      
      if (deleteError) {
        console.error(`❌ 削除エラー:`, deleteError.message);
        continue;
      }
      console.log(`✅ 既存エピソード削除完了\n`);
      
      // 全動画を取得
      const allVideos = await getAllVideosFromChannel(channel.channelId, channel.name);
      
      if (allVideos.length === 0) {
        console.log(`⚠️ ${channel.name} の動画が見つかりません`);
        continue;
      }
      
      // 動画IDを抽出
      const videoIds = allVideos.map(item => item.id.videoId);
      console.log(`📋 動画ID抽出完了: ${videoIds.length}件\n`);
      
      // 動画詳細を取得
      console.log(`🔍 動画詳細情報を取得中...`);
      const videoDetails = await getVideoDetails(videoIds);
      console.log(`✅ 詳細情報取得完了: ${videoDetails.length}件\n`);
      
      // ショート動画をフィルタリング
      console.log(`🎯 ショート動画をフィルタリング中...`);
      const regularVideos = videoDetails.filter(video => {
        const isShort = isShortVideo(video.contentDetails?.duration, video.snippet.title);
        if (isShort) {
          console.log(`  ⏭️ スキップ (ショート): ${video.snippet.title.substring(0, 50)}...`);
        }
        return !isShort;
      });
      
      console.log(`✅ フィルタリング完了:`);
      console.log(`  - 総動画数: ${videoDetails.length}件`);
      console.log(`  - ショート動画: ${videoDetails.length - regularVideos.length}件 (除外)`);
      console.log(`  - 通常動画: ${regularVideos.length}件 (保存対象)\n`);
      
      // エピソードとして保存
      console.log(`💾 エピソード保存中...`);
      let savedCount = 0;
      let errorCount = 0;
      
      for (const video of regularVideos) {
        try {
          const episode = createEpisodeData(video, channel.celebrityId);
          
          const { error: insertError } = await supabase
            .from('episodes')
            .insert(episode);
          
          if (insertError) {
            console.error(`  ❌ 保存エラー: ${video.snippet.title.substring(0, 30)}... - ${insertError.message}`);
            errorCount++;
          } else {
            console.log(`  ✅ 保存完了: ${video.snippet.title.substring(0, 50)}...`);
            savedCount++;
          }
          
          // 保存間隔を空ける
          await delay(100);
          
        } catch (error) {
          console.error(`  ❌ エピソード作成エラー: ${video.snippet.title.substring(0, 30)}... - ${error.message}`);
          errorCount++;
        }
      }
      
      console.log(`\n🎉 ${channel.name} 処理完了！`);
      console.log(`📊 結果:`);
      console.log(`  - 保存成功: ${savedCount}件`);
      console.log(`  - 保存失敗: ${errorCount}件`);
      console.log(`  - 成功率: ${Math.round((savedCount / (savedCount + errorCount)) * 100)}%`);
      
    } catch (error) {
      console.error(`❌ ${channel.name} 処理中にエラー:`, error.message);
    }
  }
  
  console.log('\n🎊 全チャンネル処理完了！');
  console.log('\n🌐 確認方法:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/sixtones');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/travis-japan');
  console.log('→ 大量のエピソードが追加されているはずです！');
  
  console.log('\n📋 実行内容:');
  console.log('- YouTube Data API v3で全動画を取得');
  console.log('- ショート動画を自動除外');
  console.log('- 通常動画のみをエピソードとして保存');
  console.log('- 正しいサムネイル画像URL形式');
}

collectAllEpisodes();