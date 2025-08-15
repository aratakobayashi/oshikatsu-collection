const https = require('https');

// Spotify API設定
const SPOTIFY_CLIENT_ID = 'your_spotify_client_id'; // 要設定
const SPOTIFY_CLIENT_SECRET = 'your_spotify_client_secret'; // 要設定

async function getSpotifyToken() {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    
    const options = {
      hostname: 'accounts.spotify.com',
      path: '/api/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.access_token);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write('grant_type=client_credentials');
    req.end();
  });
}

async function searchSpotifyArtist(artistName, token) {
  return new Promise((resolve, reject) => {
    const query = encodeURIComponent(artistName);
    const options = {
      hostname: 'api.spotify.com',
      path: `/v1/search?q=${query}&type=artist&limit=5`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.artists.items);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function searchCelebrityImages() {
  console.log('🎵 Spotify APIで推しのアーティスト情報を検索中...\n');

  const celebrities = [
    { name: '嵐', searchTerm: 'Arashi' },
    { name: '二宮和也', searchTerm: 'Ninomiya Kazunari' },
    { name: 'KAT-TUN', searchTerm: 'KAT-TUN' }, 
    { name: 'Hey! Say! JUMP', searchTerm: 'Hey Say JUMP' },
    { name: 'Sexy Zone', searchTerm: 'Sexy Zone' }
  ];

  try {
    // 注意：実際のSpotify API認証情報が必要
    console.log('⚠️  Spotify API使用にはクライアントID・シークレットが必要です');
    console.log('📝 https://developer.spotify.com/dashboard でアプリ登録が必要');
    console.log('');

    // デモ用のサンプル検索結果
    console.log('📋 期待される検索結果（サンプル）:');
    
    celebrities.forEach((celebrity, i) => {
      console.log(`${i + 1}. ${celebrity.name} (${celebrity.searchTerm})`);
      console.log(`   想定画像: https://i.scdn.co/image/[spotify_image_id]`);
      console.log(`   ジャンル: J-Pop, Japanese`);
      console.log(`   人気度: 85/100`);
      console.log('');
    });

    console.log('🎯 実装手順:');
    console.log('1. Spotify Developer Dashboardでアプリ作成');
    console.log('2. Client ID・Client Secretを環境変数に設定');
    console.log('3. このスクリプトで実際のAPI呼び出し');
    console.log('4. 取得した画像URLをデータベースに保存');
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

// 実行
searchCelebrityImages();