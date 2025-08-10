#!/usr/bin/env node
/**
 * 修正版：人気動画収集スクリプト
 */

const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg';

console.log('🎯 修正版：人気動画収集を開始...\n');

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

// UUID生成（簡易版）
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

async function collectPopularVideos() {
  try {
    // 1. セレブリティIDを取得
    console.log('👤 セレブリティIDを取得...');
    const celebOptions = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    
    const celebrities = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?slug=eq.yonino-channel&select=id`,
      celebOptions
    );
    
    let celebrityId = celebrities[0]?.id;
    
    if (!celebrityId) {
      console.log('   セレブリティが見つからないため作成...');
      // よにのちゃんねる作成
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${CHANNEL_ID}&key=${YOUTUBE_API_KEY}`;
      const channelData = await httpsRequest(channelUrl);
      const channel = channelData.items?.[0];
      
      celebrityId = generateId();
      const celebrityData = {
        id: celebrityId,
        name: channel.snippet.title,
        slug: 'yonino-channel',
        bio: channel.snippet.description?.slice(0, 500),
        image_url: channel.snippet.thumbnails?.high?.url,
        type: 'youtube_channel',
        subscriber_count: parseInt(channel.statistics.subscriberCount),
        video_count: parseInt(channel.statistics.videoCount)
      };
      
      const createOptions = {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(celebrityData)
      };
      
      await httpsRequest(`${SUPABASE_URL}/rest/v1/celebrities`, createOptions);
      console.log('   ✅ セレブリティ作成完了');
    }
    
    console.log(`   Celebrity ID: ${celebrityId}\n`);
    
    // 2. 人気動画を取得
    console.log('🎥 人気動画TOP20を取得...');
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=viewCount&type=video&key=${YOUTUBE_API_KEY}`;
    const searchData = await httpsRequest(videosUrl);
    
    const videos = searchData.items || [];
    console.log(`✅ ${videos.length}件の動画を取得\n`);
    
    // 3. 各動画を保存
    console.log('💾 エピソードを保存中...');
    let savedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoId = video.id.videoId;
      
      try {
        // 動画詳細を取得
        const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const detailData = await httpsRequest(detailUrl);
        const videoDetail = detailData.items?.[0];
        
        if (!videoDetail) continue;
        
        const episodeData = {
          id: `YT_${videoId}`, // YouTube動画IDをベースにID生成
          celebrity_id: celebrityId,
          title: videoDetail.snippet.title,
          description: videoDetail.snippet.description?.slice(0, 1000) || '',
          date: videoDetail.snippet.publishedAt,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: videoDetail.snippet.thumbnails?.high?.url || '',
          view_count: parseInt(videoDetail.statistics.viewCount || '0'),
          like_count: parseInt(videoDetail.statistics.likeCount || '0'),
          comment_count: parseInt(videoDetail.statistics.commentCount || '0'),
          duration: videoDetail.contentDetails.duration
        };
        
        const episodeOptions = {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(episodeData)
        };
        
        const response = await httpsRequest(
          `${SUPABASE_URL}/rest/v1/episodes?on_conflict=id`,
          episodeOptions
        );
        
        savedCount++;
        const views = (videoDetail.statistics.viewCount / 1000000).toFixed(1);
        console.log(`   ${savedCount}. ${videoDetail.snippet.title.slice(0, 40)}... (${views}M views)`);
        
      } catch (error) {
        errorCount++;
        console.log(`   ❌ エラー: ${video.snippet.title}`);
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\n✅ 完了: ${savedCount}件保存、${errorCount}件エラー`);
    
    // 4. 保存データの確認
    console.log('\n📊 データ確認中...');
    const checkData = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?select=id,title,view_count&order=view_count.desc.nullslast&limit=5`,
      celebOptions
    );
    
    console.log('🏆 TOP 5 人気動画:');
    checkData.forEach((ep, idx) => {
      const views = ep.view_count ? (ep.view_count / 1000000).toFixed(1) + 'M' : 'N/A';
      console.log(`   ${idx + 1}. ${ep.title?.slice(0, 40)}... (${views} views)`);
    });
    
    console.log('\n✨ データ収集完了！');
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app');
    console.log('   パスワード: staging123');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

collectPopularVideos();