require('dotenv').config({ path: '.env.staging' });
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');

// YouTube API設定
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const IKONOI_CHANNEL_ID = 'UCWHh6SdvJWrPuf1oJrHbX3A'; // @ikonoijoy の実際のチャンネルID

// Supabase設定
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// グループID（先ほど追加したもの）
const GROUP_IDS = {
  'equal-love': '259e44a6-5a33-40cf-9d78-86cfbd9df2ac',
  'not-equal-me': 'ed64611c-a6e5-4b84-a36b-7383b73913d5',
  'nearly-equal-joy': '86c49fac-8236-4ee2-9d31-4e4a6472eb9a'
};

// グループ判別関数（合同チャンネル対応）
function detectGroupFromVideo(title, description = '') {
  const text = (title + ' ' + description).toLowerCase();
  
  // 優先順位付きでチェック（より具体的なものを先に）
  if (text.includes('≒joy') || text.includes('ニアジョイ') || text.includes('ニアジョ') || text.includes('ニア') || text.includes('≒')) {
    return 'nearly-equal-joy';
  }
  if (text.includes('≠me') || text.includes('ノイミー') || text.includes('ノット') || text.includes('≠')) {
    return 'not-equal-me';
  }
  if (text.includes('=love') || text.includes('イコラブ') || text.includes('イコール') || text.includes('=')) {
    return 'equal-love';
  }
  
  // キーワードベース判別
  const keywords = {
    'nearly-equal-joy': ['joy', 'ジョイ', '≒joy'],
    'not-equal-me': ['≠me', 'ノットイコール', 'ノイミー'],
    'equal-love': ['=love', 'イコールラブ', 'イコラブ']
  };
  
  for (const [group, words] of Object.entries(keywords)) {
    if (words.some(word => text.includes(word))) {
      return group;
    }
  }
  
  // デフォルトは=LOVE（メイングループ）
  return 'equal-love';
}

// ショート動画判定（60秒以下を除外）
function isShortVideo(duration) {
  if (!duration) return false;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return false;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  return totalSeconds <= 60; // 60秒以下はショート
}

// YouTube duration (PT4M13S) を分に変換
function parseDuration(duration) {
  if (!duration) return null;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  return hours * 60 + minutes + Math.round(seconds / 60);
}

// チャンネルの全動画を取得（ページネーション対応）
async function getAllChannelVideos(channelId, maxPages = 5) {
  if (!YOUTUBE_API_KEY) {
    console.error('❌ YOUTUBE_API_KEY が設定されていません');
    return [];
  }

  console.log(`🔍 チャンネル ${channelId} の全動画を取得中...`);
  console.log(`📄 最大 ${maxPages} ページまで取得します`);
  
  let allVideos = [];
  let nextPageToken = '';
  let pageCount = 0;

  try {
    while (pageCount < maxPages) {
      pageCount++;
      console.log(`\n📄 ページ ${pageCount} を取得中...`);
      
      // チャンネルの動画リストを取得
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet&type=video&order=date&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.error) {
        console.error('❌ YouTube API エラー:', data.error.message);
        break;
      }
      
      if (!data.items || data.items.length === 0) {
        console.log('📺 これ以上動画がありません');
        break;
      }
      
      console.log(`✅ ${data.items.length}件の動画を発見`);
      
      // 各動画の詳細統計を取得
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=snippet,statistics,contentDetails`;
      
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();
      
      if (statsData.error) {
        console.error('❌ YouTube統計取得エラー:', statsData.error.message);
        break;
      }
      
      // データを整形
      const videos = statsData.items.map(video => ({
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        publishedAt: video.snippet.publishedAt,
        thumbnailUrl: video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url,
        videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
        viewCount: parseInt(video.statistics.viewCount || 0),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0),
        duration: video.contentDetails.duration,
        group: detectGroupFromVideo(video.snippet.title, video.snippet.description)
      }));
      
      // ショート動画を除外
      const regularVideos = videos.filter(video => !isShortVideo(video.duration));
      const shortVideos = videos.filter(video => isShortVideo(video.duration));
      
      console.log(`📹 通常動画: ${regularVideos.length}件`);
      console.log(`🩳 ショート動画（除外）: ${shortVideos.length}件`);
      
      allVideos.push(...regularVideos);
      
      // 次のページがあるかチェック
      nextPageToken = data.nextPageToken;
      if (!nextPageToken) {
        console.log('📺 全ページを取得完了');
        break;
      }
      
      // API制限対策で少し待つ
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎬 合計 ${allVideos.length}件の動画を取得（ショート除外済み）`);
    
    // グループ別統計
    const groupStats = {};
    allVideos.forEach(video => {
      groupStats[video.group] = (groupStats[video.group] || 0) + 1;
    });
    
    console.log('\n📊 グループ別動画数:');
    Object.entries(groupStats).forEach(([group, count]) => {
      const groupName = {
        'equal-love': '=LOVE',
        'not-equal-me': '≠ME',
        'nearly-equal-joy': '≒JOY'
      }[group] || group;
      console.log(`  ${groupName}: ${count}件`);
    });
    
    return allVideos;
    
  } catch (error) {
    console.error('❌ APIリクエストエラー:', error);
    return allVideos;
  }
}

// データベースに保存
async function saveVideosToDatabase(videos) {
  console.log(`\n💾 ${videos.length}件の動画をデータベースに保存中...`);
  
  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const groupCounts = {};

  for (const video of videos) {
    try {
      // 重複チェック（videoIdベース）
      const { data: existing } = await supabase
        .from('episodes')
        .select('id')
        .eq('id', video.videoId)
        .single();
      
      if (existing) {
        console.log(`⏭️  スキップ: ${video.title.substring(0, 50)}...（既存）`);
        skippedCount++;
        continue;
      }
      
      const celebrityId = GROUP_IDS[video.group];
      if (!celebrityId) {
        console.error(`❌ グループID不明: ${video.group}`);
        errorCount++;
        continue;
      }
      
      // 新規エピソードを挿入
      const { data, error } = await supabase
        .from('episodes')
        .insert({
          id: video.videoId, // YouTubeのvideoIdをそのまま使用
          title: video.title,
          description: video.description?.substring(0, 1000), // 長すぎる説明文をトリム
          date: video.publishedAt,
          celebrity_id: celebrityId,
          video_url: video.videoUrl,
          thumbnail_url: video.thumbnailUrl,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          duration: parseDuration(video.duration),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error(`❌ 保存エラー (${video.title.substring(0, 30)}...):`, error.message);
        errorCount++;
      } else {
        const groupName = {
          'equal-love': '=LOVE',
          'not-equal-me': '≠ME', 
          'nearly-equal-joy': '≒JOY'
        }[video.group];
        
        console.log(`✅ [${groupName}] ${video.title.substring(0, 50)}...`);
        savedCount++;
        groupCounts[video.group] = (groupCounts[video.group] || 0) + 1;
      }
      
    } catch (error) {
      console.error(`❌ 処理エラー (${video.title.substring(0, 30)}...):`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n🎉 データベース保存完了！');
  console.log('='.repeat(60));
  console.log(`📊 処理結果:`);
  console.log(`  - 新規保存: ${savedCount}件`);
  console.log(`  - 既存スキップ: ${skippedCount}件`);
  console.log(`  - エラー: ${errorCount}件`);
  
  console.log('\n📈 グループ別保存数:');
  Object.entries(groupCounts).forEach(([group, count]) => {
    const groupName = {
      'equal-love': '=LOVE',
      'not-equal-me': '≠ME',
      'nearly-equal-joy': '≒JOY'
    }[group];
    console.log(`  ${groupName}: ${count}件`);
  });
}

// メイン処理
async function main() {
  console.log('🎭 =LOVE・≠ME・≒JOY 合同チャンネル動画取得開始！\n');
  
  // グループが正しく追加されているか確認
  console.log('👥 対象グループ確認:');
  for (const [slug, id] of Object.entries(GROUP_IDS)) {
    const { data: celebrity } = await supabase
      .from('celebrities')
      .select('name, slug')
      .eq('id', id)
      .single();
    
    if (celebrity) {
      console.log(`✅ ${celebrity.name} (${celebrity.slug})`);
    } else {
      console.log(`❌ ID ${id} のグループが見つかりません`);
    }
  }
  
  // 実際のチャンネルIDを取得（手動で設定）
  console.log('\n📺 チャンネル情報:');
  console.log(`チャンネルID: ${IKONOI_CHANNEL_ID}`);
  console.log('チャンネル名: =LOVE・≠ME・≒JOY 合同公式チャンネル');
  console.log('URL: https://www.youtube.com/@ikonoijoy');
  
  // YouTube動画データを取得
  const videos = await getAllChannelVideos(IKONOI_CHANNEL_ID, 10); // 最大10ページ（約500動画）
  
  if (videos.length === 0) {
    console.log('📺 取得できる動画がありませんでした');
    return;
  }
  
  // データベースに保存
  await saveVideosToDatabase(videos);
  
  console.log('\n🌐 確認URL:');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/equal-love');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/not-equal-me');
  console.log('https://oshikatsu-collection.netlify.app/celebrities/nearly-equal-joy');
  
  console.log('\n🚀 次のステップ:');
  console.log('1. コメント分析による店舗・商品情報の抽出');
  console.log('2. ファンサイトからの追加情報収集');
  console.log('3. 各エピソードへのロケーション・アイテム紐づけ');
}

// 実際のチャンネルIDを取得するヘルパー関数
async function getActualChannelId() {
  console.log('🔍 @ikonoijoy の実際のチャンネルIDを取得中...');
  
  // ChannelでforUsernameを使って検索
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${YOUTUBE_API_KEY}&forUsername=ikonoijoy&part=id,snippet`;
  
  try {
    const response = await fetch(channelUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const actualChannelId = data.items[0].id;
      console.log(`✅ 実際のチャンネルID: ${actualChannelId}`);
      return actualChannelId;
    }
  } catch (error) {
    console.log('⚠️ 自動取得に失敗。手動でチャンネルIDを確認してください');
  }
  
  return IKONOI_CHANNEL_ID; // フォールバック
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { getAllChannelVideos, saveVideosToDatabase, detectGroupFromVideo };