#!/usr/bin/env node
/**
 * Netlify環境でどの環境変数が実際に使われているかテスト
 */

const https = require('https');

console.log('🔍 Netlify環境の環境変数テスト');
console.log('📍 URL検証');

// 環境変数の状況をログ出力（実際のNetlify環境で確認用）
console.log('🌐 Runtime Environment Check:');
console.log('- process.env.VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('- process.env.VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('- process.env.NODE_ENV:', process.env.NODE_ENV);

// Netlify固有の環境変数
console.log('- process.env.CONTEXT:', process.env.CONTEXT);
console.log('- process.env.BRANCH:', process.env.BRANCH);
console.log('- process.env.HEAD:', process.env.HEAD);

// 実際のSupabaseテスト
if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
  console.log('\n📡 Supabaseテスト...');
  
  const options = {
    headers: {
      'apikey': process.env.VITE_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
    }
  };

  const req = https.request(`${process.env.VITE_SUPABASE_URL}/rest/v1/celebrities?select=count&limit=1`, options, (res) => {
    console.log('📊 Response Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('📝 Response:', data);
    });
  });

  req.on('error', err => {
    console.log('❌ Request Error:', err.message);
  });

  req.end();
} else {
  console.log('\n❌ 環境変数が設定されていません');
}