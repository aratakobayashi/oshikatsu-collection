#!/usr/bin/env node
/**
 * フロントエンド向けデータ取得テスト
 */

const https = require('https');

const SUPABASE_URL = 'https://ounloyykptsqzdpbsnpn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U';

console.log('🔍 フロントエンド向けデータ取得テスト\n');

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

async function testFrontendData() {
  try {
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };

    console.log('👤 セレブリティデータ取得...');
    const celebrities = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/celebrities?select=*`,
      options
    );
    console.log(`✅ セレブリティ: ${celebrities.length}件`);
    celebrities.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.type})`);
    });

    console.log('\n🎬 エピソードデータ取得（celebrity情報を含む）...');
    const episodes = await httpsRequest(
      `${SUPABASE_URL}/rest/v1/episodes?select=*,celebrity:celebrities(id,name,slug,image_url)&order=view_count.desc.nullslast&limit=5`,
      options
    );
    console.log(`✅ エピソード: ${episodes.length}件`);
    episodes.forEach((e, i) => {
      const views = e.view_count ? `${(e.view_count / 1000000).toFixed(1)}M` : 'N/A';
      console.log(`   ${i + 1}. ${e.title?.slice(0, 50)}... (${views} views)`);
      console.log(`      セレブリティ: ${e.celebrity?.name || 'N/A'}`);
    });

    console.log('\n📊 フロントエンド表示判定:');
    console.log(`   セレブリティセクション: ${celebrities.length > 0 ? '✅ 表示される' : '❌ 表示されない（空配列）'}`);
    console.log(`   エピソードセクション: ${episodes.length > 0 ? '✅ 表示される' : '❌ 表示されない（空配列）'}`);

    if (celebrities.length === 0) {
      console.log('\n⚠️  セレブリティが0件のため、ホームページに「まだ推しが登録されていません」メッセージが表示されます');
    }
    
    if (episodes.length === 0) {
      console.log('\n⚠️  エピソードが0件のため、ホームページに「まだエピソードが登録されていません」メッセージが表示されます');
    }

    console.log('\n🌐 確認方法:');
    console.log('   1. ブラウザで https://develop--oshikatsu-collection.netlify.app にアクセス');
    console.log('   2. パスワード「staging123」を入力');
    console.log('   3. トップページでデータの表示を確認');

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testFrontendData();