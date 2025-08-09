# 🔧 トラブルシューティングガイド

よくある問題と解決方法をまとめました。

## 🚀 開発環境の問題

### ポート競合エラー

#### 症状
```bash
Error: Port 3000 is already in use
```

#### 解決方法
```bash
# 1. 使用中のプロセスを確認
lsof -i :3000

# 2. プロセスを終了
kill -9 [PID]

# 3. または別のポートを使用
npm run dev -- --port 3001

# 4. または package.json で固定ポートを変更
"dev": "vite --port 3001"
```

### npm install エラー

#### 症状
```bash
npm ERR! peer dep missing: react@^18.0.0
npm ERR! network timeout
```

#### 解決方法
```bash
# 1. Node.js バージョン確認（18+ 必要）
node --version

# 2. npm キャッシュクリア
npm cache clean --force

# 3. node_modules と lock file 削除
rm -rf node_modules package-lock.json

# 4. 再インストール
npm install

# 5. それでもダメな場合は npm バージョン更新
npm install -g npm@latest
```

### TypeScript エラー

#### 症状
```bash
npm run typecheck
error TS2307: Cannot find module 'vite/client'
```

#### 解決方法
```bash
# 1. vite/client.d.ts が存在するか確認
ls src/

# 2. 存在しない場合は作成
cat > src/vite-env.d.ts << EOF
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_ENVIRONMENT: string
  readonly APP_ENV: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
EOF

# 3. TypeScript 設定確認
cat tsconfig.json
```

## 🌐 環境変数の問題

### 環境変数が読み込まれない

#### 症状
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL) // undefined
```

#### 診断手順
```bash
# 1. ファイル存在確認
ls -la .env*

# 2. ファイル内容確認（秘匿情報に注意）
head .env.development

# 3. 環境変数名確認（VITEプレフィックス必須）
grep "VITE_" .env.development
```

#### 解決方法
```bash
# 1. 正しいファイル名で作成
cp .env.example .env.development

# 2. 正しいプレフィックスを使用
# ❌ SUPABASE_URL=xxx
# ✅ VITE_SUPABASE_URL=xxx

# 3. 開発サーバーを再起動
# Ctrl+C で停止 → npm run dev で再起動

# 4. ブラウザキャッシュをクリア
# Shift+Cmd+R (Mac) / Shift+Ctrl+R (Win)
```

### 本番環境で環境変数エラー

#### 症状
```bash
Netlify Deploy: Build failed
Environment variable not found: VITE_SUPABASE_URL
```

#### 解決方法（Netlify）
```bash
# 1. Netlify Dashboard にログイン
# 2. Site settings → Environment variables
# 3. 必要な変数を追加

# Production環境で必要な変数:
APP_ENV=production
VITE_ENVIRONMENT=production
VITE_APP_URL=https://collection.oshikatsu-guide.com
VITE_SUPABASE_URL=[本番URL]
VITE_SUPABASE_ANON_KEY=[本番キー]

# 4. Deploy をトリガー
# Site overview → Trigger deploy
```

## 🗄️ データベース接続の問題

### Supabase 接続エラー

#### 症状
```bash
Error: Invalid API key
Error: Row Level Security policy violation
```

#### 診断コード
```typescript
// scripts/test-db-connection.ts
import { supabase } from '../src/lib/supabase'

async function diagnose() {
  console.log('🔍 Database Diagnosis')
  console.log('Environment:', import.meta.env.VITE_ENVIRONMENT)
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('Has Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  
  try {
    // 1. 基本接続テスト
    const { data, error } = await supabase
      .from('celebrities')
      .select('count(*)')
      .single()
    
    if (error) {
      console.error('❌ Query failed:', error)
      return
    }
    
    console.log('✅ Connection successful')
    console.log('📊 Data count:', data)
    
  } catch (error) {
    console.error('💥 Connection error:', error)
  }
}

diagnose()
```

#### 解決方法
```bash
# 1. 環境変数確認
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# 2. Supabase Dashboard で確認
# - Project Settings → API
# - URL と Key が正しいか確認

# 3. RLS 設定確認
# - Database → Policies
# - 適切な読み取りポリシーがあるか確認

# 4. 本番キーを非本番環境で使っていないか確認
# URLs例:
# 本番: https://prod-xxx.supabase.co
# 開発: https://staging-xxx.supabase.co
```

### データが表示されない

#### 症状
```bash
セレブリティ一覧が空
エピソードが0件表示
```

#### 診断手順
```typescript
// ブラウザの開発者ツール > Console で実行
const testQuery = async () => {
  const { data, error } = await supabase
    .from('celebrities')
    .select('*')
  
  console.log('Data:', data)
  console.log('Error:', error)
  console.log('Count:', data?.length || 0)
}

testQuery()
```

#### 解決方法
```bash
# 1. 正しいデータベースに接続しているか確認
# staging環境にはテストデータが必要

# 2. データ作成スクリプト実行
npm run scripts/create-sample-data.ts

# 3. RLS ポリシー確認
# 匿名ユーザーが読み取り可能か確認
```

## 🔐 認証・権限の問題

### Basic認証が効かない

#### 症状
```bash
Staging環境でBasic認証が表示されない
認証後もアクセスできない
```

#### 解決方法
```bash
# 1. Netlify環境変数確認
# Site settings → Environment variables
# Branch deploysまたはDeploy previews に以下が設定されているか:
BASIC_AUTH=username:password

# 2. netlify.toml 確認
cat netlify.toml | grep -A 5 "auth"

# 3. Netlify Functions の動作確認
# ブラウザで直接アクセス:
# https://your-site.netlify.app/.netlify/functions/auth

# 4. 環境判定の確認
# APP_ENV が正しく設定されているか
```

### 管理画面アクセス権限エラー

#### 症状
```bash
「アクセス権限がありません」エラー
管理者メールが認識されない
```

#### 解決方法
```typescript
// 1. 現在のユーザー情報を確認
const checkCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  console.log('Current user:', user)
  console.log('Email:', user?.email)
}

// 2. 管理者リスト確認
// src/hooks/useAuth.ts の adminEmails 配列を確認

// 3. 一時的な認証無効化確認
// src/components/AdminRoute.tsx でコメントアウトされているか
```

## 🚀 デプロイ・ビルドの問題

### Netlify ビルドエラー

#### 症状
```bash
Build failed: Command failed with exit code 1
Module not found error
```

#### 解決手順
```bash
# 1. ローカルでビルドテスト
npm run build

# 2. 依存関係チェック
npm audit
npm update

# 3. Node.js バージョン確認
# netlify.toml で指定されているバージョンと一致するか
cat netlify.toml | grep NODE_VERSION

# 4. Netlify ビルドログ確認
# Deploy details → Function logs
```

### GitHub Actions CI 失敗

#### 症状
```bash
Workflow failed: Lint errors found
TypeScript compilation failed
```

#### 解決方法
```bash
# 1. ローカルで同じチェックを実行
npm run lint
npm run typecheck
npm run build

# 2. 問題を修正してコミット
npm run lint -- --fix
git add .
git commit -m "fix: linting errors"

# 3. 再度プッシュ
git push origin feature/your-branch
```

## 🌐 ネットワーク・API の問題

### YouTube API エラー

#### 症状
```bash
API quota exceeded
Invalid API key
CORS error
```

#### 解決方法
```bash
# 1. API キー確認
echo $VITE_YOUTUBE_API_KEY

# 2. Google Cloud Console でクォータ確認
# APIs & Services → Quotas
# YouTube Data API v3 の使用量を確認

# 3. CORS設定確認（通常は問題なし）
# YouTube APIはブラウザから直接呼び出し可能

# 4. テスト用APIキーを使用
# 開発環境では別のキーを使用することを検討
```

### 外部API接続エラー

#### 症状
```bash
Fetch failed: Network error
Request blocked by CORS
```

#### 診断コード
```typescript
// scripts/test-external-apis.ts
async function testAPIs() {
  // YouTube API テスト
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=UC2alHD2WkakOiTxCxF-uMAg&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
    )
    console.log('YouTube API:', response.status)
  } catch (error) {
    console.error('YouTube API Error:', error)
  }
  
  // Google Search API テスト
  // 同様のテストを実行
}

testAPIs()
```

## 🔍 パフォーマンスの問題

### アプリが遅い

#### 症状
```bash
ページロードが遅い
データ取得に時間がかかる
```

#### 診断方法
```bash
# 1. Chrome DevTools を使用
# Network タブでリクエスト時間を確認
# Performance タブでボトルネックを特定

# 2. Lighthouse でスコア確認
# Chrome DevTools → Lighthouse → Analyze page load

# 3. バンドルサイズ確認
npm run build
# dist/ フォルダのサイズを確認
```

#### 最適化方法
```typescript
// 1. React.lazy でコード分割
const AdminPanel = React.lazy(() => import('./components/AdminPanel'))

// 2. useCallback でメモ化
const handleClick = useCallback(() => {
  // イベントハンドラー
}, [dependencies])

// 3. useMemo で重い計算をキャッシュ
const expensiveValue = useMemo(() => {
  return heavyCalculation(data)
}, [data])

// 4. データ取得の最適化
const { data, isLoading } = useSWR(
  '/api/celebrities',
  fetcher,
  { revalidateOnFocus: false }
)
```

## 🆘 緊急時の対処

### サイトがダウン

```bash
# 1. Netlify Status 確認
# https://www.netlifystatus.com/

# 2. 最後のデプロイをロールバック
# Netlify Dashboard → Deploys → Previous deploy → Publish deploy

# 3. エラーログ確認
# Netlify Dashboard → Functions → View logs

# 4. 緊急パッチの場合
git checkout main
git pull origin main
# 修正作業
git add .
git commit -m "hotfix: critical bug fix"
git push origin main
```

### データベースエラー

```bash
# 1. Supabase Status 確認
# https://status.supabase.com/

# 2. 接続テスト
npm run test:db-connection

# 3. バックアップからの復旧
# Supabase Dashboard → Database → Backups

# 4. 代替手段
# モックデータで一時的に運用
```

## 📞 サポート連絡先

### 内部サポート
- **Slack**: #oshikatsu-tech-support
- **GitHub Issues**: 技術的な問題報告

### 外部サービス
- **Netlify Support**: https://docs.netlify.com/
- **Supabase Support**: https://supabase.com/docs
- **Google Cloud Support**: API関連問題