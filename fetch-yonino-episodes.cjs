const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const crypto = require('crypto');

// 設定
const supabaseUrl = 'https://awaarykghpylggygkiyp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE';
const youtubeApiKey = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const yoniChannelId = 'UC2alHD2WkakOiTxCxF-uMAg';

const supabase = createClient(supabaseUrl, supabaseKey);

// YouTube API呼び出し関数
async function youtubeApiCall(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `https://www.googleapis.com/youtube/v3/${endpoint}&key=${youtubeApiKey}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            resolve(response);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// チャンネル情報を取得
async function getChannelInfo() {
  console.log('📺 よにのちゃんねる情報を取得中...');
  
  const endpoint = `channels?part=snippet,statistics&id=${yoniChannelId}`;
  const response = await youtubeApiCall(endpoint);
  
  if (response.items && response.items.length > 0) {
    const channel = response.items[0];
    console.log(`✅ チャンネル名: ${channel.snippet.title}`);
    console.log(`   登録者数: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}人`);
    console.log(`   総動画数: ${parseInt(channel.statistics.videoCount).toLocaleString()}本`);
    console.log(`   総再生回数: ${parseInt(channel.statistics.viewCount).toLocaleString()}回`);
    return channel;
  }
  throw new Error('チャンネル情報が取得できませんでした');
}

// 動画一覧を取得（ページネーション対応）
async function getAllVideos() {
  console.log('🎬 よにのちゃんねる全動画を取得中...');
  
  let allVideos = [];
  let nextPageToken = '';
  let pageCount = 0;
  const maxPages = 10; // API使用量制限のため最大10ページ（約500動画）
  
  do {
    pageCount++;
    console.log(`   ページ ${pageCount} を処理中...`);
    
    let endpoint = `search?part=snippet&channelId=${yoniChannelId}&maxResults=50&order=date&type=video`;
    if (nextPageToken) {
      endpoint += `&pageToken=${nextPageToken}`;
    }
    
    const response = await youtubeApiCall(endpoint);
    
    if (response.items) {
      allVideos = allVideos.concat(response.items);
      console.log(`     ${response.items.length}本の動画を取得`);
    }
    
    nextPageToken = response.nextPageToken || '';
    
    // API制限を考慮して1秒待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } while (nextPageToken && pageCount < maxPages);
  
  console.log(`✅ 合計 ${allVideos.length}本の動画を取得完了`);
  return allVideos;
}

// 山田涼介出演回を特定
function identifyYamadaEpisodes(videos) {
  console.log('🔍 山田涼介出演回を特定中...');
  
  const yamadaKeywords = [
    '山田涼介', '山田', 'やまだ', 'ヤマダ', 'YAMADA',
    'Hey! Say! JUMP', 'ヘイセイジャンプ', 'HSJ'
  ];
  
  const yamadaEpisodes = videos.filter(video => {
    const title = video.snippet.title.toLowerCase();
    const description = video.snippet.description.toLowerCase();
    const searchText = `${title} ${description}`;
    
    return yamadaKeywords.some(keyword => 
      searchText.includes(keyword.toLowerCase())
    );
  });
  
  console.log(`✅ 山田涼介出演回: ${yamadaEpisodes.length}本を特定`);
  
  // 特定されたエピソードを表示
  yamadaEpisodes.slice(0, 5).forEach((episode, i) => {
    console.log(`   ${i + 1}. ${episode.snippet.title}`);
    console.log(`      投稿日: ${episode.snippet.publishedAt.split('T')[0]}`);
  });
  
  if (yamadaEpisodes.length > 5) {
    console.log(`   ... 他 ${yamadaEpisodes.length - 5}本`);
  }
  
  return yamadaEpisodes;
}

// エピソードをデータベースに保存
async function saveEpisodesToDatabase(videos, yamadaEpisodes) {
  console.log('💾 エピソードをデータベースに保存中...');
  
  // よにのちゃんねるのセレブリティIDを取得
  const { data: yoniCelebrity } = await supabase
    .from('celebrities')
    .select('id')
    .or('slug.eq.yoni-no-channel,name.ilike.%よにの%')
    .single();
  
  if (!yoniCelebrity) {
    throw new Error('よにのちゃんねるのセレブリティ情報が見つかりません');
  }
  
  let savedCount = 0;
  let yamadaTaggedCount = 0;
  
  for (const video of videos.slice(0, 50)) { // 最初の50本をテスト
    const videoId = video.id.videoId || video.id;
    
    // 既存チェック
    const { data: existing } = await supabase
      .from('episodes')
      .select('id')
      .eq('video_url', `https://www.youtube.com/watch?v=${videoId}`)
      .single();
    
    if (existing) {
      continue; // 既に存在する場合はスキップ
    }
    
    // 山田涼介出演回かチェック
    const isYamadaEpisode = yamadaEpisodes.some(ep => 
      (ep.id.videoId || ep.id) === videoId
    );
    
    const episodeData = {
      id: crypto.randomUUID(),
      title: video.snippet.title,
      description: video.snippet.description,
      date: video.snippet.publishedAt,
      thumbnail_url: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      celebrity_id: yoniCelebrity.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('episodes')
      .insert(episodeData);
    
    if (!error) {
      savedCount++;
      if (isYamadaEpisode) {
        yamadaTaggedCount++;
        console.log(`✅ 山田回保存: ${video.snippet.title.substring(0, 50)}...`);
      }
    }
    
    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`✅ 保存完了: ${savedCount}本のエピソード`);
  console.log(`🎭 山田涼介出演回: ${yamadaTaggedCount}本`);
  
  return { savedCount, yamadaTaggedCount };
}

async function main() {
  console.log('🚀 よにのちゃんねる全エピソード取得開始！\n');
  
  try {
    // 1. チャンネル情報取得
    const channelInfo = await getChannelInfo();
    console.log('');
    
    // 2. 全動画取得
    const allVideos = await getAllVideos();
    console.log('');
    
    // 3. 山田涼介出演回特定
    const yamadaEpisodes = identifyYamadaEpisodes(allVideos);
    console.log('');
    
    // 4. データベース保存
    const result = await saveEpisodesToDatabase(allVideos, yamadaEpisodes);
    
    console.log('\n🎉 Phase 1 完了！');
    console.log('📊 結果サマリー:');
    console.log(`   取得動画数: ${allVideos.length}本`);
    console.log(`   山田涼介出演回: ${yamadaEpisodes.length}本`);
    console.log(`   データベース保存: ${result.savedCount}本`);
    console.log(`   山田回データベース: ${result.yamadaTaggedCount}本`);
    
    console.log('\n🎯 次のステップ:');
    console.log('1. 本番サイトで山田涼介の個別ページを確認');
    console.log('2. よにのちゃんねる出演回が表示されることを確認');
    console.log('3. ユーザージャーニーテスト実行');
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error.message);
  }
}

main();