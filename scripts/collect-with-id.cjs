#!/usr/bin/env node
/**
 * ID付きデータ収集スクリプト（修正版）
 */

const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg';

console.log('🎯 ID付きデータ収集を開始...\n');

function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📡 ${res.statusCode}: ${url.split('/').pop()}`);
        if (res.statusCode >= 400) {
          console.log('❌ Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          return;
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

// UUID生成
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

// ISO 8601 duration to seconds converter
function parseDuration(duration) {
  if (!duration) return 0;
  
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
}

async function collectWithId() {
  try {
    // 1. セレブリティIDを確認・取得
    console.log('👤 セレブリティIDを取得...');
    const celebOptions = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    
    const celebrities = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?slug=eq.yonino-channel&select=id,name`,
      celebOptions
    );
    
    let celebrityId = celebrities[0]?.id;
    console.log(`✅ セレブリティID: ${celebrityId}\n`);
    
    // 2. 人気動画を20件取得
    console.log('🎥 人気動画を20件取得...');
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=viewCount&type=video&key=${YOUTUBE_API_KEY}`;
    const searchData = await httpsRequest(videosUrl);
    
    const videos = searchData.items || [];
    console.log(`✅ ${videos.length}件の動画を取得\n`);
    
    // 3. 各動画を個別保存（詳細ログ付き）
    console.log('💾 エピソードを保存中...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const videoId = video.id.videoId;
      
      try {
        console.log(`\n📋 ${i + 1}/${videos.length}: ${video.snippet.title.slice(0, 40)}...`);
        
        // 動画詳細を取得
        const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        const detailData = await httpsRequest(detailUrl);
        const videoDetail = detailData.items?.[0];
        
        if (!videoDetail) {
          console.log('   ⚠️ 動画詳細が取得できませんでした');
          continue;
        }
        
        // エピソードデータ作成（IDを明示的に設定）
        const episodeId = generateId();
        const episodeData = {
          id: episodeId, // 明示的にIDを設定
          celebrity_id: celebrityId,
          title: videoDetail.snippet.title,
          description: videoDetail.snippet.description?.slice(0, 1000) || '',
          date: videoDetail.snippet.publishedAt,
          video_url: `https://www.youtube.com/watch?v=${videoId}`,
          thumbnail_url: videoDetail.snippet.thumbnails?.high?.url || '',
          view_count: parseInt(videoDetail.statistics.viewCount || '0'),
          like_count: parseInt(videoDetail.statistics.likeCount || '0'),
          comment_count: parseInt(videoDetail.statistics.commentCount || '0'),
          duration: parseDuration(videoDetail.contentDetails.duration)
        };
        
        console.log(`   📝 ID: ${episodeId}`);
        console.log(`   👁️ ${(episodeData.view_count / 1000000).toFixed(1)}M views`);
        
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
        
        console.log(`   ✅ 保存成功: ${Array.isArray(response) ? response.length : 1}件`);
        successCount++;
        
      } catch (error) {
        console.log(`   ❌ エラー: ${error.message}`);
        errorCount++;
      }
      
      // API制限対策
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 結果: ${successCount}件成功、${errorCount}件エラー\n`);
    
    // 4. 最終確認
    console.log('🔍 保存データを確認...');
    const finalCheck = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?select=id,title,view_count&order=view_count.desc.nullslast&limit=10`,
      celebOptions
    );
    
    console.log('🏆 保存されたTOP動画:');
    finalCheck.forEach((ep, idx) => {
      const views = ep.view_count ? (ep.view_count / 1000000).toFixed(1) + 'M' : 'N/A';
      console.log(`   ${idx + 1}. ${ep.title?.slice(0, 50)}... (${views})`);
    });
    
    console.log('\n✨ データ収集完了！');
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app');
    console.log('   パスワード: staging123');
    
  } catch (error) {
    console.error('❌ 致命的エラー:', error.message);
  }
}

collectWithId();