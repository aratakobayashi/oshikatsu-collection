/**
 * ファビコン生成スクリプト
 * SVGから各サイズのPNG画像を生成
 */

const fs = require('fs');
const path = require('path');

// 「推」の文字を含むSVGを生成
function generateFaviconSVG(size) {
  const fontSize = Math.floor(size * 0.6);
  const y = Math.floor(size * 0.72);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ec4899;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#d946ef;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text
    x="${size / 2}"
    y="${y}"
    font-size="${fontSize}"
    font-weight="900"
    font-family="'Hiragino Sans', 'Yu Gothic', sans-serif"
    text-anchor="middle"
    fill="white">推</text>
</svg>`;
}

// ICO形式用の単純なSVG（16x16, 32x32用）
function generateSimpleSVG(size) {
  const fontSize = Math.floor(size * 0.7);
  const y = Math.floor(size * 0.75);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#ec4899"/>
  <text
    x="${size / 2}"
    y="${y}"
    font-size="${fontSize}"
    font-weight="900"
    font-family="'Hiragino Sans', 'Yu Gothic', sans-serif"
    text-anchor="middle"
    fill="white">推</text>
</svg>`;
}

// ファイル生成
const publicDir = path.join(__dirname, '../public');

// favicon.svg (メイン)
fs.writeFileSync(
  path.join(publicDir, 'favicon.svg'),
  generateFaviconSVG(100)
);
console.log('✅ favicon.svg を生成しました');

// apple-touch-icon.png用のSVG (180x180)
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon.svg'),
  generateFaviconSVG(180)
);
console.log('✅ apple-touch-icon.svg を生成しました');

// PWA用のアイコン (192x192, 512x512)
fs.writeFileSync(
  path.join(publicDir, 'icon-192.svg'),
  generateFaviconSVG(192)
);
console.log('✅ icon-192.svg を生成しました');

fs.writeFileSync(
  path.join(publicDir, 'icon-512.svg'),
  generateFaviconSVG(512)
);
console.log('✅ icon-512.svg を生成しました');

// 小さいサイズ用 (16x16, 32x32)
fs.writeFileSync(
  path.join(publicDir, 'favicon-16.svg'),
  generateSimpleSVG(16)
);
console.log('✅ favicon-16.svg を生成しました');

fs.writeFileSync(
  path.join(publicDir, 'favicon-32.svg'),
  generateSimpleSVG(32)
);
console.log('✅ favicon-32.svg を生成しました');

console.log('\n🎉 すべてのファビコンファイルを生成しました!');
console.log('\n次のステップ:');
console.log('1. index.html にファビコンの設定を追加');
console.log('2. ブラウザでテスト');
console.log('3. デプロイ');
