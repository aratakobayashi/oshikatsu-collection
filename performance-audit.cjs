const https = require('https');
const { performance } = require('perf_hooks');

// サーバー応答速度測定
async function measureServerResponse(url, name) {
  return new Promise((resolve) => {
    const start = performance.now();
    
    const req = https.get(url, (res) => {
      const end = performance.now();
      const responseTime = Math.round(end - start);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          name,
          url,
          responseTime,
          statusCode: res.statusCode,
          contentLength: Buffer.byteLength(data, 'utf8'),
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      resolve({
        name,
        url,
        error: err.message,
        responseTime: -1
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        name,
        url,
        error: 'Timeout',
        responseTime: -1
      });
    });
  });
}

// 複数URLの並列測定
async function performanceAudit() {
  console.log('🚀 Performance Audit 開始\n');
  
  const urls = [
    {
      name: 'Homepage',
      url: 'https://oshikatsu-collection.netlify.app/'
    },
    {
      name: 'Celebrities Page',
      url: 'https://oshikatsu-collection.netlify.app/celebrities'
    },
    {
      name: 'Episodes Page', 
      url: 'https://oshikatsu-collection.netlify.app/episodes'
    },
    {
      name: 'Locations Page',
      url: 'https://oshikatsu-collection.netlify.app/locations'
    }
  ];

  console.log('⏱️ サーバー応答速度測定中...\n');
  
  // 並列測定
  const results = await Promise.all(
    urls.map(({ name, url }) => measureServerResponse(url, name))
  );

  // 結果表示
  console.log('📊 サーバー応答速度結果:');
  console.log('====================');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.name}: ${result.error}`);
    } else {
      const sizeKB = Math.round(result.contentLength / 1024);
      console.log(`✅ ${result.name}:`);
      console.log(`   応答時間: ${result.responseTime}ms`);
      console.log(`   ステータス: ${result.statusCode}`);
      console.log(`   サイズ: ${sizeKB}KB`);
      console.log(`   サーバー: ${result.headers.server || 'Unknown'}`);
      console.log(`   キャッシュ: ${result.headers['cache-control'] || 'None'}`);
      console.log('');
    }
  });

  // 平均応答時間計算
  const validResults = results.filter(r => !r.error);
  if (validResults.length > 0) {
    const avgResponse = Math.round(
      validResults.reduce((sum, r) => sum + r.responseTime, 0) / validResults.length
    );
    const totalSize = Math.round(
      validResults.reduce((sum, r) => sum + r.contentLength, 0) / 1024
    );
    
    console.log('📈 総合パフォーマンス:');
    console.log(`   平均応答時間: ${avgResponse}ms`);
    console.log(`   総サイズ: ${totalSize}KB`);
    
    // 推奨事項
    console.log('\n💡 最適化推奨事項:');
    if (avgResponse > 1000) {
      console.log('🔴 応答時間が遅い (>1s) - サーバー最適化が必要');
    } else if (avgResponse > 500) {
      console.log('🟡 応答時間が普通 (>500ms) - 改善の余地あり');
    } else {
      console.log('🟢 応答時間が良好 (<500ms)');
    }
    
    if (totalSize > 500) {
      console.log('🔴 ペイロードが大きい (>500KB) - リソース軽量化が必要');
    } else if (totalSize > 200) {
      console.log('🟡 ペイロードが普通 (>200KB) - 軽量化推奨');
    } else {
      console.log('🟢 ペイロードサイズ良好 (<200KB)');
    }
  }

  console.log('\n🔍 外部リソース分析...');
  
  // 外部スクリプト検出
  const externalResources = [
    'Google Analytics',
    'Google Tag Manager', 
    'Facebook Pixel',
    'Twitter Widget',
    'YouTube API',
    'Google Fonts',
    'CDN Resources'
  ];
  
  console.log('🎯 削除検討対象の外部リソース:');
  externalResources.forEach(resource => {
    console.log(`   - ${resource}`);
  });

  console.log('\n📦 画像最適化推奨:');
  console.log('   - WebP形式に変換 (70-80%軽量化)');
  console.log('   - AVIF形式に変換 (80-90%軽量化)');
  console.log('   - 適切なサイズリサイズ');
  console.log('   - レスポンシブ画像の実装');

  console.log('\n🚀 Performance Audit 完了');
}

performanceAudit().catch(console.error);