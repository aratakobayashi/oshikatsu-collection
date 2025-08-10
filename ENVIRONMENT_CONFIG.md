# 🌐 環境設定ドキュメント

## プロジェクト概要
**「みんなで作る推し活辞典」** - よにのちゃんねる特化ファン活動プラットフォーム

## 環境構成

### 🎭 Staging環境 (開発用)
- **URL**: https://develop--oshikatsu-collection.netlify.app
- **ブランチ**: develop
- **用途**: 機能開発・テスト・データ実験

### 🚀 Production環境 (本番)
- **URL**: https://collection.oshikatsu-guide.com
- **ブランチ**: main  
- **用途**: 実際のユーザー向けサービス

## Supabase設定

### 📋 共通設定 (Staging & Production)
```
プロジェクトID: ounloyykptsqzdpbsnpn
URL: https://ounloyykptsqzdpbsnpn.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91bmxveXlrcHRzcXpkcGJzbnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3MjIzODMsImV4cCI6MjA3MDI5ODM4M30.VpSq034vLWHH3n_W-ikJyho6BuwY6UahN52V9US5n0U
```

**⚠️ 注意**: staging と production は同じSupabaseプロジェクトを共有しています

### 🔐 管理画面アクセス
```
Supabase Dashboard: https://app.supabase.com/project/ounloyykptsqzdpbsnpn
```

## API設定

### 🎬 YouTube Data API v3
```
API Key: AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag
Channel ID: UC2alHD2WkakOiTxCxF-uMAg (よにのちゃんねる)
```

### 🔍 Google Custom Search API
```
API Key: AIzaSyA1OvAT6So7y1c-1ooExEg6cv5dSoPp6ag
Search Engine ID: 3649ae354f33b4553
```

## データベーススキーマ

### 📊 主要テーブル
- `episodes` - エピソード情報（73件）
- `items` - アイテム情報
- `locations` - ロケーション情報
- `episode_items` - エピソード↔アイテム関連（Junction Table）
- `episode_locations` - エピソード↔ロケーション関連（Junction Table）

### 🔗 関連機能
- **RLS (Row Level Security)** 有効
- **外部キー制約** 設定済み
- **インデックス** 最適化済み

## デプロイメント設定

### 🚢 Netlify設定
```toml
# netlify.toml で環境別設定管理
[context."develop"]
environment = { 
  APP_ENV = "staging", 
  VITE_ENVIRONMENT = "staging",
  VITE_SUPABASE_URL = "https://ounloyykptsqzdpbsnpn.supabase.co",
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

[context."main"]
environment = { 
  APP_ENV = "production", 
  VITE_ENVIRONMENT = "production",
  VITE_SUPABASE_URL = "https://ounloyykptsqzdpbsnpn.supabase.co",
  VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 開発ワークフロー

### 🔄 ブランチ戦略
1. **develop** → staging環境に自動デプロイ
2. **develop → main** → production環境に自動デプロイ

### 🛠️ ローカル開発
```bash
# staging環境で開発
VITE_ENVIRONMENT=staging npm run dev

# production設定で確認
VITE_ENVIRONMENT=production npm run dev
```

## データ管理方針

### 📝 データ種別
- **Test Data**: 開発・テスト用（staging/production共通）
- **Real Data**: 実際のユーザー向けデータ（今後追加）

### 🔄 データ同期
- 現在は手動管理
- 今後は環境別データ分離を検討

---
**最終更新**: 2025-08-10  
**更新者**: Claude Code  
**バージョン**: v1.0