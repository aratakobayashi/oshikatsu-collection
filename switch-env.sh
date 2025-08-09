#!/bin/bash

# 環境切り替えスクリプト（非エンジニア向け）

echo "🔄 環境切り替えスクリプト"
echo "=========================="
echo "1) 開発環境 (development)"
echo "2) 本番環境 (production)" 
echo "3) 現在の設定確認"
echo ""
read -p "選択してください (1-3): " choice

case $choice in
    1)
        cp .env.development .env
        echo "✅ 開発環境に切り替えました"
        echo "📌 これで本番データに影響しません"
        ;;
    2)
        cp .env.production .env
        echo "⚠️  本番環境に切り替えました"
        echo "🚨 注意: 本番データを触ります"
        ;;
    3)
        echo "📋 現在の設定:"
        echo "Environment: $(grep VITE_ENVIRONMENT .env)"
        echo "Supabase URL: $(grep VITE_SUPABASE_URL .env)"
        ;;
    *)
        echo "❌ 無効な選択です"
        ;;
esac

echo ""
echo "💡 開発サーバーを再起動してください: npm run dev"