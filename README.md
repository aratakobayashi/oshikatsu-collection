# 🌸 oshikatsu-collection

> よにのちゃんねる推し活情報を収集・共有するWebアプリケーション

[![Deploy Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/oshikatsu-collection/deploys)
[![CI/CD](https://github.com/aratakobayashi/oshikatsu-collection/actions/workflows/ci.yml/badge.svg)](https://github.com/aratakobayashi/oshikatsu-collection/actions/workflows/ci.yml)

## 🚀 プロジェクト概要

oshikatsu-collectionは、よにのちゃんねるのエピソードに登場するアイテムやロケーションを収集・共有するプラットフォームです。YouTube APIやWikipedia APIを活用してデータを自動収集し、ファンが聖地巡礼やファッション情報を簡単に見つけられるサービスを提供します。

### 主な機能

- 📺 **エピソード管理** - よにのちゃんねるの動画情報を自動収集
- 👗 **アイテム情報** - 動画に登場するファッション・グッズの詳細
- 🗺️ **ロケーション情報** - 聖地巡礼のための場所情報
- 🔍 **検索・フィルター** - 豊富な検索オプション
- 👥 **ユーザー投稿** - コミュニティによる情報共有
- 🛡️ **管理機能** - データ管理・承認システム

## 🌍 環境・デプロイ

| 環境 | ブランチ | URL | 用途 |
|------|---------|-----|------|
| **Production** | `main` | https://collection.oshikatsu-guide.com | 本番運用 |
| **Staging** | `develop` | https://develop--oshikatsu-collection.netlify.app | 検証・テスト |
| **Preview** | PR branches | 自動生成URL | PR単位テスト |

## 🛠️ 技術スタック

### Frontend
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - ビルドツール・開発サーバー
- **Tailwind CSS** - スタイリング
- **React Router** - ルーティング

### Backend & Database
- **Supabase** - PostgreSQL + 認証 + リアルタイム
- **Row Level Security** - データアクセス制御

### Deploy & CI/CD
- **Netlify** - ホスティング・デプロイ
- **GitHub Actions** - CI/CD パイプライン
- **Netlify Functions** - Basic認証・robots.txt

### APIs
- **YouTube Data API v3** - 動画メタデータ取得
- **Wikipedia API** - エンリッチメントデータ
- **Google Custom Search** - 関連情報検索

## 🚀 クイックスタート

### 前提条件
- Node.js 18+
- npm
- Git

### セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/aratakobayashi/oshikatsu-collection.git
cd oshikatsu-collection

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env.development
# .env.developmentを編集（管理者から提供される値を設定）

# 4. 開発サーバー起動
npm run dev

# 5. ブラウザでアクセス
# http://localhost:3000
```

### 環境変数

```bash
# 必須設定
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_YOUTUBE_API_KEY=your_youtube_api_key

# 開発環境設定
APP_ENV=development
VITE_ENVIRONMENT=development
VITE_APP_URL=http://localhost:3000
```

詳細は [`.env.example`](./.env.example) を参照してください。

## 🔄 開発フロー

### ブランチ戦略

```
main (本番)
├── develop (ステージング)
    ├── feature/new-feature (機能開発)
    ├── bugfix/fix-issue (バグ修正)
    └── hotfix/emergency (緊急修正)
```

### 開発手順

1. **ブランチ作成**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```

2. **開発・テスト**
   ```bash
   # コード品質チェック
   npm run lint
   npm run typecheck
   npm run build
   ```

3. **PR作成**
   - Base: `develop`
   - Preview環境で動作確認
   - CI/CDチェック通過

4. **マージ・デプロイ**
   - `develop` → Staging環境
   - `main` → Production環境

## 📋 スクリプトコマンド

```bash
# 開発
npm run dev          # 開発サーバー起動 (port 3000)
npm run build        # プロダクションビルド
npm run preview      # プレビューサーバー
npm start           # プロダクション起動 (port 3000)

# コード品質
npm run lint         # ESLint実行
npm run typecheck    # TypeScript型チェック

# データ管理
npm run collect:yoni-basic    # よにの基本データ収集
npm run collect:yoni-videos   # 動画データ収集
npm run validate:production-data  # 本番データ検証
```

## 🏗️ プロジェクト構造

```
oshikatsu-collection/
├── src/
│   ├── components/          # Reactコンポーネント
│   │   ├── ui/             # 基本UIコンポーネント
│   │   └── AdminRoute.tsx  # 管理者権限ルート
│   ├── pages/              # ページコンポーネント
│   │   ├── public/         # 一般ページ
│   │   └── admin/          # 管理者ページ
│   ├── lib/                # ユーティリティ・API
│   │   ├── supabase.ts     # データベース接続
│   │   └── auth.ts         # 認証関連
│   └── hooks/              # カスタムフック
│       └── useAuth.ts      # 認証フック
├── docs/                   # プロジェクトドキュメント
│   ├── environments.md     # 環境構成
│   ├── deployment.md       # デプロイメント
│   ├── database.md         # データベース
│   ├── onboarding.md       # オンボーディング
│   └── troubleshooting.md  # トラブルシューティング
├── netlify/
│   └── functions/          # Netlify Functions
│       ├── auth.js         # Basic認証
│       └── robots.js       # robots.txt生成
├── scripts/                # 管理・データ収集スクリプト
├── .github/
│   └── workflows/
│       └── ci.yml          # CI/CDワークフロー
├── netlify.toml            # Netlify設定
├── .env.example            # 環境変数テンプレート
└── package.json
```

## 🔒 セキュリティ・認証

### Basic認証
- **Staging/Preview環境** でのみ有効
- Netlify Functions で実装
- 環境変数 `BASIC_AUTH=username:password` で設定

### 管理者権限
```typescript
// 管理者メールアドレス（src/hooks/useAuth.ts）
const adminEmails = [
  'admin@test.com',
  'arata.kobayashi.1014@gmail.com'
]
```

### データアクセス制御
- Supabase Row Level Security (RLS) を使用
- 匿名ユーザー：読み取りのみ
- 認証ユーザー：投稿・編集
- 管理者：全データアクセス

## 📊 データベース

### 主要テーブル

- **celebrities** - セレブリティ情報
- **episodes** - エピソード（動画）情報
- **items** - アイテム（ファッション・グッズ）
- **locations** - ロケーション（聖地）
- **users** - ユーザー情報
- **user_posts** - ユーザー投稿

### 環境別DB

| 環境 | Supabase Project |
|------|------------------|
| Production | `oshikatsu-prod` |
| Staging | `oshikatsu-staging` |
| Development | Local or Staging |

⚠️ **重要**: 本番データベースを開発・テスト環境で使用しないこと

## 🌐 Netlify設定

### 環境変数（Netlify Dashboard で設定）

**Production:**
```bash
APP_ENV=production
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_key
```

**Branch Deploys (Staging):**
```bash
APP_ENV=staging
BASIC_AUTH=admin:staging_password
VITE_SUPABASE_URL=https://staging-project.supabase.co
```

**Deploy Previews:**
```bash
APP_ENV=preview
BASIC_AUTH=admin:preview_password
```

### Context別デプロイ設定

```toml
# netlify.toml
[context.production]
  environment = { APP_ENV = "production" }

[context."develop"]
  environment = { APP_ENV = "staging" }

[context.deploy-preview]  
  environment = { APP_ENV = "preview" }
```

## 🧪 テスト・品質管理

### 自動チェック（GitHub Actions）

- ✅ **ESLint** - コードスタイル
- ✅ **TypeScript** - 型チェック  
- ✅ **Build Test** - 3環境でビルドテスト
- ✅ **Security Scan** - 脆弱性スキャン

### ローカルでのチェック

```bash
# 全チェック実行
npm run lint && npm run typecheck && npm run build

# 個別実行
npm run lint -- --fix    # 自動修正
npm run typecheck        # 型チェックのみ
```

## 📚 ドキュメント

詳細なドキュメントは [`docs/`](./docs/) フォルダにあります：

- 📖 **[環境構成](./docs/environments.md)** - 環境別設定・URL一覧
- 🚀 **[デプロイメント](./docs/deployment.md)** - CI/CD・ブランチ戦略  
- 🗄️ **[データベース](./docs/database.md)** - Supabase設定・接続
- 👋 **[オンボーディング](./docs/onboarding.md)** - 新メンバー向け手順
- 🔧 **[トラブルシューティング](./docs/troubleshooting.md)** - よくある問題・解決策

## 🤝 コントリビュート

### PR作成時の注意

1. **Base ブランチ**: `develop`（本番緊急修正時は `main`）
2. **命名規則**: `feature/`, `bugfix/`, `hotfix/` プレフィックス
3. **コミットメッセージ**: [Conventional Commits](https://www.conventionalcommits.org/) 形式
4. **テスト**: CI/CD チェックの通過必須

### コミットメッセージ例

```bash
feat: ユーザー投稿機能を追加
fix: 管理画面のログインバグを修正  
docs: APIドキュメントを更新
style: ESLintルールに準拠
refactor: データ取得ロジックを改善
```

## 🆘 サポート

### 問題・バグ報告
- **GitHub Issues**: https://github.com/aratakobayashi/oshikatsu-collection/issues
- **緊急時**: [管理者連絡先]

### よくある問題
- 🔧 [トラブルシューティングガイド](./docs/troubleshooting.md) を参照
- 💬 Slack `#oshikatsu-development` で質問

## 📄 ライセンス

このプロジェクトは [MIT License](./LICENSE) のもとで公開されています。

## 🙏 謝辞

- **よにのちゃんねる** - 素晴らしいコンテンツの提供
- **Supabase** - バックエンドインフラ
- **Netlify** - ホスティング・CI/CD
- **React Community** - 開発ツール・ライブラリ

---

**Made with ❤️ for よにのちゃんねる fans**