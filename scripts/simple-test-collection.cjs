#!/usr/bin/env node
/**
 * シンプルなテストデータ収集スクリプト
 * Node.js環境で直接実行
 */

const https = require('https');

// 環境変数（直接設定）
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg';

console.log('🚀 シンプルテスト収集を開始...\n');

// HTTPSリクエストヘルパー
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
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

async function testCollection() {
  try {
    // 1. YouTube APIでチャンネル情報取得
    console.log('📺 YouTubeチャンネル情報を取得...');
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
    const channelData = await httpsRequest(channelUrl);
    
    const channel = channelData.items?.[0];
    if (!channel) {
      throw new Error('チャンネル情報が取得できませんでした');
    }
    
    console.log(`✅ ${channel.snippet.title}`);
    console.log(`   登録者: ${parseInt(channel.statistics.subscriberCount).toLocaleString()}人`);
    console.log(`   動画数: ${channel.statistics.videoCount}本\n`);
    
    // 2. Supabaseにセレブリティデータを保存
    console.log('💾 Supabaseにデータを保存...');
    
    const celebrityData = {
      name: channel.snippet.title,
      slug: 'yonino-channel',
      bio: channel.snippet.description?.slice(0, 500),
      image_url: channel.snippet.thumbnails?.high?.url,
      type: 'youtube_channel',
      subscriber_count: parseInt(channel.statistics.subscriberCount),
      video_count: parseInt(channel.statistics.videoCount),
      view_count: parseInt(channel.statistics.viewCount)
    };
    
    const supabaseOptions = {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify(celebrityData)
    };
    
    const celebrityResponse = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?on_conflict=slug`,
      supabaseOptions
    );
    
    console.log('✅ セレブリティデータ保存成功');
    
    // 3. 最新動画を取得
    console.log('\n🎥 最新動画を2件取得...');
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=2&order=date&type=video&key=${YOUTUBE_API_KEY}`;
    const videosData = await httpsRequest(videosUrl);
    
    const videos = videosData.items || [];
    console.log(`📹 ${videos.length}件の動画を取得`);
    
    // 4. エピソードデータを保存
    for (const video of videos) {
      const episodeData = {
        title: video.snippet.title,
        description: video.snippet.description?.slice(0, 500),
        date: video.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        thumbnail_url: video.snippet.thumbnails?.high?.url
      };
      
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
      
      await httpsRequest(
        `${SUPABASE_URL}/rest/v1/episodes`,
        episodeOptions
      );
      
      console.log(`   ✅ ${video.snippet.title.slice(0, 40)}...`);
    }
    
    console.log('\n✨ テスト完了！');
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app');
    console.log('   認証: staging123');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testCollection();