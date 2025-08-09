const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Development Server Test</title>
      </head>
      <body>
        <h1>開発サーバーテスト</h1>
        <p>サーバーが正常に動作しています！</p>
        <p>時刻: ${new Date().toLocaleString('ja-JP')}</p>
        <div>
          <h2>リンクテスト</h2>
          <a href="/admin">管理画面</a><br>
          <a href="/debug/auth">認証デバッグ</a>
        </div>
      </body>
      </html>
    `);
  } else if (req.url === '/admin') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>管理画面テスト</h1>
      <p>管理画面へのアクセスが可能です</p>
      <p>本来ここでログインフォームが表示されます</p>
    `);
  } else if (req.url === '/debug/auth') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>認証デバッグテスト</h1>
      <p>認証状態確認ページです</p>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 Not Found</h1>');
  }
});

const PORT = 3000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`✅ Simple server running at http://127.0.0.1:${PORT}/`);
  console.log(`✅ Admin test: http://127.0.0.1:${PORT}/admin`);
  console.log(`✅ Debug test: http://127.0.0.1:${PORT}/debug/auth`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});