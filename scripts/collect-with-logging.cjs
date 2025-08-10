#!/usr/bin/env node
/**
 * ログ付きデータ収集（エラー詳細確認用）
 */

const https = require('https');

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg';

console.log('🔍 ログ付きデータ収集開始...\n');

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        if (res.statusCode !== 200 && res.statusCode !== 201) {
          console.log('❌ Response:', data);
        }
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function collectWithLogging() {
  try {
    // 1. 最新動画1件だけテスト
    console.log('🎥 最新動画1件を取得...');
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=1&order=date&type=video&key=${YOUTUBE_API_KEY}`;
    const searchData = await httpsRequest(videosUrl);
    
    const video = searchData.items?.[0];
    if (!video) {
      console.log('❌ 動画が見つかりません');
      return;
    }
    
    const videoId = video.id.videoId;
    console.log(`✅ 動画ID: ${videoId}`);
    console.log(`   タイトル: ${video.snippet.title}`);
    
    // 2. 動画詳細を取得
    console.log('\n📋 動画詳細を取得...');
    const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const detailData = await httpsRequest(detailUrl);
    const videoDetail = detailData.items?.[0];
    
    if (!videoDetail) {
      console.log('❌ 詳細が取得できません');
      return;
    }
    
    console.log('✅ 詳細取得成功');
    console.log(`   再生回数: ${parseInt(videoDetail.statistics.viewCount).toLocaleString()}`);
    
    // 3. Supabaseに保存
    console.log('\n💾 Supabaseに保存...');
    
    const episodeData = {
      title: videoDetail.snippet.title,
      description: videoDetail.snippet.description?.slice(0, 500) || '',
      date: videoDetail.snippet.publishedAt,
      video_url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail_url: videoDetail.snippet.thumbnails?.high?.url || '',
      view_count: parseInt(videoDetail.statistics.viewCount || '0'),
      like_count: parseInt(videoDetail.statistics.likeCount || '0'),
      comment_count: parseInt(videoDetail.statistics.commentCount || '0')
    };
    
    console.log('📝 送信データ:', JSON.stringify(episodeData, null, 2));
    
    const episodeOptions = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(episodeData)
    };
    
    const response = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes`,
      episodeOptions
    );
    
    console.log('\n📬 Supabase応答:', JSON.stringify(response, null, 2));
    
    // 4. 保存確認
    console.log('\n🔍 保存データを確認...');
    const checkOptions = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    
    const savedData = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?video_url=eq.https://www.youtube.com/watch?v=${videoId}&select=*`,
      checkOptions
    );
    
    console.log('✅ 確認結果:', JSON.stringify(savedData, null, 2));
    
  } catch (error) {
    console.error('❌ エラー詳細:', error);
  }
}

collectWithLogging();