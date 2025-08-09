#!/bin/bash

echo "🚀 Vite開発サーバー起動スクリプト"
echo "======================================"

# 環境確認
echo "📁 作業ディレクトリ: $(pwd)"
echo "🔧 Node.js: $(node --version)"
echo "📦 npm: $(npm --version)"

# ポートクリーンアップ
echo "🧹 ポート3001をクリーンアップ中..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "   ポート3001は空いています"

echo "🧹 ポート5173をクリーンアップ中..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || echo "   ポート5173は空いています"

# 環境変数確認
echo "🔍 環境変数確認..."
if [ -f ".env" ]; then
    echo "   ✅ .env ファイル存在"
else
    echo "   ❌ .env ファイルなし"
fi

# Vite起動
echo "🚀 Viteサーバー起動中..."
echo "   URL: http://localhost:5173"
echo "   終了するには Ctrl+C を押してください"
echo ""

npx vite --host --port 5173