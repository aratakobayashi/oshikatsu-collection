#!/bin/bash

# プレースホルダー画像作成スクリプト
echo "🖼️ プレースホルダー画像作成中..."

# publicディレクトリに移動
cd public

# 問題の画像ファイル名でプレースホルダーを作成（SVG形式）
cat > assassination_classroom.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="200" y="140" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">画像準備中</text>
  <text x="200" y="160" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Assassination Classroom</text>
</svg>
EOF

cat > assassination_classroom_2.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="200" y="140" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">画像準備中</text>
  <text x="200" y="160" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Assassination Classroom 2</text>
</svg>
EOF

cat > kindaichi.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="200" y="140" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">画像準備中</text>
  <text x="200" y="160" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Kindaichi</text>
</svg>
EOF

cat > momikeshite_fuyu.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="200" y="140" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">画像準備中</text>
  <text x="200" y="160" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Momikeshite Fuyu</text>
</svg>
EOF

cat > semi_otoko.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <rect x="50" y="50" width="300" height="200" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="200" y="140" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">画像準備中</text>
  <text x="200" y="160" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">Semi Otoko</text>
</svg>
EOF

# 基本プレースホルダー画像も作成（存在しない場合）
if [ ! -f placeholder-celebrity.jpg ]; then
cat > placeholder-celebrity.jpg << 'EOF'
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f9fafb"/>
  <circle cx="150" cy="120" r="40" fill="#e5e7eb"/>
  <rect x="110" y="170" width="80" height="60" rx="10" fill="#e5e7eb"/>
  <text x="150" y="250" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">Celebrity</text>
</svg>
EOF
fi

if [ ! -f placeholder-location.jpg ]; then
cat > placeholder-location.jpg << 'EOF'
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#f3f4f6"/>
  <path d="M200 80 L220 130 L170 130 Z" fill="#ec4899"/>
  <circle cx="200" cy="130" r="15" fill="#be185d"/>
  <text x="200" y="180" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="16">Location</text>
  <text x="200" y="200" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">聖地巡礼スポット</text>
</svg>
EOF
fi

if [ ! -f placeholder-item.jpg ]; then
cat > placeholder-item.jpg << 'EOF'
<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
  <rect width="300" height="300" fill="#f9fafb"/>
  <rect x="100" y="80" width="100" height="120" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <rect x="120" y="100" width="60" height="20" fill="#ec4899"/>
  <text x="150" y="230" text-anchor="middle" fill="#6b7280" font-family="Arial" font-size="14">Item</text>
  <text x="150" y="250" text-anchor="middle" fill="#9ca3af" font-family="Arial" font-size="12">推しアイテム</text>
</svg>
EOF
fi

if [ ! -f placeholder-video.jpg ]; then
cat > placeholder-video.jpg << 'EOF'
<svg width="480" height="360" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
  <rect width="480" height="360" fill="#1f2937"/>
  <polygon points="200,150 200,210 250,180" fill="#ec4899"/>
  <text x="240" y="240" text-anchor="middle" fill="#f9fafb" font-family="Arial" font-size="16">Video</text>
  <text x="240" y="260" text-anchor="middle" fill="#d1d5db" font-family="Arial" font-size="12">動画準備中</text>
</svg>
EOF
fi

echo "✅ プレースホルダー画像作成完了！"
echo "📁 作成されたファイル:"
ls -la *.jpg | grep -E "(assassination|kindaichi|momikeshi|semi|placeholder)" || echo "プレースホルダー画像が作成されました"