# 開発環境セットアップガイド

## 🔒 安全な開発環境の構築

### 1. ローカルSupabase環境のセットアップ

```bash
# 1. Supabase CLIのインストール
npm install -g @supabase/cli

# 2. プロジェクトディレクトリで初期化
supabase init

# 3. ローカルSupabaseの起動
supabase start

# 4. データベースのリセット（必要時）
supabase db reset
```

### 2. 環境変数の設定

```bash
# .envファイルを.env.exampleからコピー
cp .env.example .env

# ローカルSupabaseの認証情報を設定
# supabase start後に表示される情報を使用：
# - API URL: http://127.0.0.1:54321
# - anon key: 表示されたキー
```

### 3. よにのチャンネルデータの安全な開発

#### ✅ 推奨アプローチ

**A. ローカル環境での開発**
- ローカルSupabaseを使用
- 実データと分離された安全な環境
- マイグレーションで管理されたテストデータ

**B. 仮名データでの開発**
```typescript
// 開発時の安全なテストデータ例
const testYouTuberData = {
  name: "テスト配信者A",
  type: "youtube_channel",
  subscriber_count: 100000,
  agency: "テスト事務所",
  // 実在する情報は使用しない
}
```

#### ❌ 避けるべき方法
- 実在のYouTuberの個人情報を直接使用
- 本番データベースでの直接開発
- 公開リポジトリでの実データ保存

### 4. 開発用データ作成スクリプト

```typescript
// scripts/create-dev-data.ts
export const createDevelopmentData = async () => {
  // 仮名でのテストデータ作成
  const testChannels = [
    {
      name: "配信者テスト01",
      slug: "test-youtuber-01",
      type: "youtube_channel",
      subscriber_count: 50000,
      agency: "テスト事務所A"
    },
    {
      name: "配信者テスト02", 
      slug: "test-youtuber-02",
      type: "youtube_channel",
      subscriber_count: 200000,
      agency: "テスト事務所B"
    }
  ]
  
  // ローカルDBにのみ挿入
  return await db.celebrities.createMany(testChannels)
}
```

### 5. 環境分離の実装

```typescript
// lib/config.ts
export const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development'
export const isLocalSupabase = import.meta.env.VITE_SUPABASE_URL?.includes('127.0.0.1')

// データ作成時の安全チェック
export const canCreateRealData = () => {
  return isDevelopment && isLocalSupabase
}
```

## 🚀 推奨開発フロー

1. **ローカル環境セットアップ**
   ```bash
   supabase start
   npm run dev
   ```

2. **テストデータ作成**
   ```bash
   npm run create-dev-data
   ```

3. **機能開発**
   - 仮名データで機能実装
   - ローカル環境でテスト

4. **本番デプロイ準備**
   - 実データマイグレーション用スクリプト作成
   - 環境変数の本番設定

## 🔐 セキュリティ対策

- [ ] ローカルSupabaseの使用
- [ ] 実データの.gitignore追加
- [ ] 環境変数の適切な管理
- [ ] テストデータのみ使用
- [ ] 本番環境との分離

## 📂 ディレクトリ構造
```
project/
├── .env.example          # 環境変数テンプレート
├── .env                  # ローカル環境変数（git無視）
├── supabase/
│   ├── config.toml       # ローカルSupabase設定
│   └── migrations/       # データベースマイグレーション
└── scripts/
    └── dev-data/         # 開発用データ作成
```