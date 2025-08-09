# 🛠️ 開発用Supabaseプロジェクト設定ガイド

## 🎯 目的
本番環境に影響を与えずに、安全にAPIテストやデータ拡充を行うための開発環境構築

## 📋 手順

### ステップ1: Supabaseプロジェクト作成
1. https://supabase.com にアクセス
2. "New Project" をクリック
3. 以下の設定で作成:
   ```
   プロジェクト名: oshikatsu-development
   データベースパスワード: [安全なパスワード]
   地域: Northeast Asia (Tokyo)
   ```

### ステップ2: プロジェクト情報取得
プロジェクト作成完了後、以下の情報をコピー:

1. **Settings** → **API** に移動
2. **Project URL** をコピー
3. **anon public** キーをコピー

### ステップ3: 環境設定ファイル更新
`.env.development` ファイルの以下の行を更新:

```bash
VITE_SUPABASE_URL=YOUR_DEVELOPMENT_SUPABASE_URL_HERE
VITE_SUPABASE_ANON_KEY=YOUR_DEVELOPMENT_SUPABASE_ANON_KEY_HERE
```

実際の値に置き換えてください。

### ステップ4: 環境切り替え
```bash
# 開発環境に切り替え
./switch-env.sh
# 「1」を選択

# 開発サーバー再起動
npm run dev
```

### ステップ5: データベース設定
開発環境に本番のスキーマとテストデータをコピーします。

## 🔄 日常的な使い方

### 💡 安全なテスト環境で作業
```bash
./switch-env.sh  # 「1」で開発環境
npm run dev
# http://localhost:5174 でテスト
```

### 🚀 本番確認（慎重に）
```bash
./switch-env.sh  # 「2」で本番環境  
npm run dev
# 注意: 本番データに影響
```

### 📊 現在の環境確認
```bash
./switch-env.sh  # 「3」で確認
```

## 🆘 トラブルシューティング

### 環境がうまく切り替わらない
```bash
# 手動で切り替え
cp .env.development .env
npm run dev
```

### データベース接続エラー
1. Supabaseプロジェクトが正常に作成されているか確認
2. URL/API Keyが正しくコピーされているか確認
3. `.env` ファイルの設定を再確認

## 📞 次のステップ
1. スキーマのコピー
2. テストデータの作成
3. APIテスト環境の準備