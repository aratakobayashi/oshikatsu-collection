#!/usr/bin/env node
/**
 * 中規模データ収集スクリプト（人気動画20件）
 */

const https = require('https');

// 環境変数
const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';
const YOUTUBE_API_KEY = 'AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag';
const CHANNEL_ID = 'UC2alHD2WkakOiTxCxF-uMAg';

console.log('📊 中規模データ収集を開始...');
console.log('🎯 目標: 人気動画20件 + 関連情報\n');

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

async function collectPopularVideos() {
  try {
    // 1. 人気動画を20件取得（視聴回数順）
    console.log('🎥 人気動画を20件取得中...');
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=20&order=viewCount&type=video&key=${YOUTUBE_API_KEY}`;
    const searchData = await httpsRequest(videosUrl);
    
    const videos = searchData.items || [];
    console.log(`✅ ${videos.length}件の人気動画を取得\n`);
    
    // 2. 各動画の詳細情報を取得して保存
    console.log('💾 エピソードデータを保存中...');
    let savedCount = 0;
    
    for (const video of videos) {
      const videoId = video.id.videoId;
      
      // 動画詳細を取得
      const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
      const detailData = await httpsRequest(detailUrl);
      const videoDetail = detailData.items?.[0];
      
      if (!videoDetail) continue;
      
      const episodeData = {
        title: videoDetail.snippet.title,
        description: videoDetail.snippet.description?.slice(0, 1000),
        date: videoDetail.snippet.publishedAt,
        video_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: videoDetail.snippet.thumbnails?.high?.url,
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
          'Prefer': 'return=representation,resolution=merge-duplicates'
        },
        body: JSON.stringify(episodeData)
      };
      
      const response = await httpsRequest(
        `${SUPABASE_URL}/rest/v1/episodes?on_conflict=video_url`,
        episodeOptions
      );
      
      savedCount++;
      const viewCount = parseInt(videoDetail.statistics.viewCount || '0');
      console.log(`   ${savedCount}. ${videoDetail.snippet.title.slice(0, 40)}... (${(viewCount/1000000).toFixed(1)}M views)`);
      
      // API制限対策：少し待機
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ ${savedCount}件のエピソードを保存完了！`);
    
    // 3. データ統計を表示
    console.log('\n📈 データ収集統計:');
    
    // セレブリティ数を確認
    const celebOptions = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    };
    
    const celebData = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?select=*`,
      celebOptions
    );
    
    const episodeData = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?select=*`,
      celebOptions
    );
    
    console.log(`   📺 セレブリティ: ${Array.isArray(celebData) ? celebData.length : 0}件`);
    console.log(`   🎬 エピソード: ${Array.isArray(episodeData) ? episodeData.length : 0}件`);
    
    console.log('\n✨ 中規模データ収集完了！');
    console.log('🌐 確認URL: https://develop--oshikatsu-collection.netlify.app');
    console.log('   認証: staging123');
    console.log('\n📝 次のステップ:');
    console.log('   1. Staging環境でUI/UXを確認');
    console.log('   2. 検索・フィルター機能をテスト');
    console.log('   3. 問題なければProduction環境へ反映');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

collectPopularVideos();