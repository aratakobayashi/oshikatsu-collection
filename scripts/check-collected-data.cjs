#!/usr/bin/env node
/**
 * 収集されたデータを確認するスクリプト
 */

const https = require('https');

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';

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
    req.end();
  });
}

async function checkData() {
  console.log('📊 収集データの確認\n');
  console.log('='.repeat(60));
  
  try {
    // エピソードデータを取得
    const episodeOptions = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const episodes = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?select=*&order=view_count.desc`,
      episodeOptions
    );
    
    console.log(`📺 エピソード総数: ${episodes.length}件\n`);
    
    // TOP 10を表示
    console.log('🏆 TOP 10 人気動画:');
    console.log('='.repeat(60));
    
    episodes.slice(0, 10).forEach((ep, index) => {
      const views = ep.view_count ? (ep.view_count / 1000000).toFixed(1) + 'M' : 'N/A';
      const title = ep.title?.slice(0, 50) || 'タイトルなし';
      console.log(`${index + 1}. ${title}...`);
      console.log(`   👁️ ${views} views | 👍 ${ep.like_count || 0} likes`);
      console.log(`   📅 ${new Date(ep.date).toLocaleDateString('ja-JP')}`);
      console.log(`   🔗 ${ep.video_url}`);
      console.log();
    });
    
    // 統計情報
    console.log('='.repeat(60));
    console.log('📈 統計情報:');
    
    const totalViews = episodes.reduce((sum, ep) => sum + (ep.view_count || 0), 0);
    const avgViews = Math.round(totalViews / episodes.length);
    const maxViews = Math.max(...episodes.map(ep => ep.view_count || 0));
    
    console.log(`   総再生回数: ${(totalViews / 1000000).toFixed(1)}M回`);
    console.log(`   平均再生回数: ${(avgViews / 1000000).toFixed(1)}M回`);
    console.log(`   最高再生回数: ${(maxViews / 1000000).toFixed(1)}M回`);
    
    // セレブリティデータも確認
    const celebrities = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?select=*`,
      episodeOptions
    );
    
    console.log(`\n👤 セレブリティ: ${celebrities.length}件`);
    celebrities.forEach(celeb => {
      console.log(`   - ${celeb.name} (${celeb.type})`);
    });
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

checkData();