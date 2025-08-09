# 🆕 新しいSupabaseプロジェクト設定ガイド

## 🎯 目的
完全に独立した開発環境を構築し、本番データに影響を与えることなく安全にAPIテストを実行

## 📋 作成手順

### ステップ1: プロジェクト作成
1. https://supabase.com にアクセス
2. 既存アカウントでログイン
3. "New Project" をクリック
4. 以下の設定で作成:
   ```
   プロジェクト名: oshikatsu-development
   データベースパスワード: [メモしてください]
   地域: Northeast Asia (Tokyo) - ap-northeast-1
   ```

### ステップ2: API情報取得
プロジェクト作成完了後（2-5分）:

1. **Settings** → **API** をクリック
2. **Project URL** をコピー
   - 例: `https://abcdefgh.supabase.co`
3. **anon public** キーをコピー
   - 例: `eyJhbGciOiJIUzI1NiIs...`

### ステップ3: 環境設定ファイル更新
`.env.development` ファイルの以下の行を更新:

```bash
# この行を更新
VITE_SUPABASE_URL=YOUR_NEW_DEVELOPMENT_PROJECT_URL_HERE
# ↓ 実際のURLに置き換え
VITE_SUPABASE_URL=https://あなたのプロジェクトID.supabase.co

# この行を更新  
VITE_SUPABASE_ANON_KEY=YOUR_NEW_DEVELOPMENT_PROJECT_ANON_KEY_HERE
# ↓ 実際のキーに置き換え
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### ステップ4: 環境切り替えテスト
```bash
# 開発環境に切り替え
cp .env.development .env

# 接続テスト
npx tsx scripts/test-api-environment.ts
```

## 📊 期待する結果

### 成功時の表示:
```
🧪 API開発環境テスト
🌍 環境: development  
🔗 Supabase URL: https://新しいプロジェクトID.supabase.co
📊 データ読み取りテスト:
✅ 新しいプロジェクトに接続成功
```

### 次のステップ:
1. 本番データのスキーマコピー
2. テストデータ作成
3. API開発開始

## 🆘 トラブルシューティング

### プロジェクト作成エラー
- 数分待ってからリトライ
- 異なるプロジェクト名を試す

### 接続エラー  
- URL/APIキーの再確認
- タイポがないかチェック

## 📞 完了報告
プロジェクト作成完了後、以下をお知らせください:
- ✅ プロジェクト作成完了
- 📋 新しいProject URL  
- 🔑 新しいanon public キー