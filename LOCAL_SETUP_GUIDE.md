# 🏠 ローカル開発環境セットアップガイド（非エンジニア向け）

このガイドは、安全にAPIテストやデータ拡充作業を行うためのローカル環境構築手順です。

## 🎯 目的
- 本番データに影響を与えずにテスト
- APIの動作確認
- 新機能の安全な開発

## 📋 現在の状況
✅ Docker: インストール済み  
✅ Supabase CLI: インストール済み  
✅ ローカル設定ファイル: 作成済み

## 🚀 ステップバイステップ手順

### ステップ1: ローカルSupabaseの起動確認
```bash
# ターミナルで実行
supabase status
```

**期待する結果:**
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

### ステップ2: 環境設定の切り替え
本番環境を使いたい時:
```bash
cp .env .env.active
```

ローカル環境を使いたい時:
```bash
cp .env.local .env.active
```

### ステップ3: 開発サーバーの再起動
```bash
# 現在のサーバーを停止 (Ctrl+C)
# 新しい環境設定で再起動
npm run dev
```

## 🔄 日常的な使い分け

### 🧪 **テスト・実験時（推奨）**
1. `.env.local` → `.env.active` にコピー
2. `npm run dev` で開発サーバー起動
3. `http://localhost:5174` でテスト
4. **本番データに影響なし！**

### 🚀 **本番確認時（慎重に）**
1. `.env` → `.env.active` にコピー  
2. `npm run dev` で開発サーバー起動
3. **注意：本番データを触ります**

## 🛠️ トラブルシューティング

### Supabaseが起動しない場合
```bash
supabase stop
supabase start
```

### 環境設定がうまくいかない場合
```bash
# 現在の設定確認
cat .env.active

# ローカル設定に戻す
cp .env.local .env.active
```

## 🆘 困った時の連絡先
- 技術的な問題が発生した場合は、現在の状況をお知らせください
- エラーメッセージをコピーして共有してください

## 📚 次のステップ
1. ローカル環境でのデータインポート
2. APIテスト環境の構築  
3. 安全なデータ拡充ワークフロー