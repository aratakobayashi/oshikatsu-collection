# 🗄️ データベースガイド

Supabaseを使用したデータベース接続と環境切り替えについて説明します。

## 🏗️ データベース構成

### Supabaseプロジェクト構成

| 環境 | プロジェクト名 | URL例 | 用途 |
|------|---------------|--------|------|
| **Production** | `oshikatsu-prod` | `https://prod-xxx.supabase.co` | 本番データ |
| **Staging** | `oshikatsu-staging` | `https://staging-xxx.supabase.co` | テストデータ |
| **Development** | Local or Staging | `http://localhost:54321` | 開発データ |

### データベーススキーマ

```sql
-- 主要テーブル構成
celebrities (セレブリティ)
├── id (UUID, Primary Key)
├── name (Text, セレブ名)
├── slug (Text, URL用スラッグ)
└── created_at (Timestamp)

episodes (エピソード)
├── id (UUID, Primary Key)
├── celebrity_id (UUID, FK → celebrities.id)
├── title (Text, エピソードタイトル)
├── date (Date, 公開日)
└── created_at (Timestamp)

items (アイテム)
├── id (UUID, Primary Key)
├── name (Text, アイテム名)
├── category (Text, カテゴリ)
└── episode_id (UUID, FK → episodes.id)

locations (ロケーション)
├── id (UUID, Primary Key)
├── name (Text, ロケーション名)
├── address (Text, 住所)
└── episode_id (UUID, FK → episodes.id)
```

## 🔧 環境別データベース設定

### 1. Production環境設定

```bash
# Netlify Environment Variables (Production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# 本番データの特徴
# - よにのちゃんねるの実データ
# - YouTube APIから収集した実際のエピソード
# - 実際のアイテム・ロケーション情報
```

### 2. Staging環境設定

```bash
# Netlify Environment Variables (Staging)
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# ステージングデータの特徴
# - 本番のコピー または サンプルデータ
# - テスト用のダミーデータも含む
# - 新機能のテストに使用
```

### 3. Local環境設定

```bash
# .env.development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# または、Stagingを直接使用
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
```

## 🚨 重要な注意点

### ⚠️ 本番データの保護

```typescript
// ❌ 絶対にやってはいけない
const productionUrl = "https://prod-xxx.supabase.co"
// staging/preview環境で本番URLを使用

// ✅ 正しい環境分離
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const isProduction = import.meta.env.APP_ENV === 'production'

if (!isProduction && supabaseUrl.includes('prod')) {
  throw new Error('❌ Production database cannot be used in non-production environment!')
}
```

### 🔒 RLS (Row Level Security) 設定

```sql
-- users テーブルのRLS設定例
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 管理者のみアクセス可能なテーブル
CREATE POLICY "Admins only" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND email IN ('admin@test.com', 'arata.kobayashi.1014@gmail.com')
    )
  );
```

## 🔄 データベース接続切り替え

### 環境別接続設定

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!
const appEnv = import.meta.env.APP_ENV || import.meta.env.VITE_ENVIRONMENT

// 環境チェック
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(`Missing Supabase credentials for ${appEnv} environment`)
}

// 本番キーの誤用防止
if (appEnv !== 'production' && supabaseUrl.includes('prod')) {
  console.error('❌ Production database detected in non-production environment!')
  throw new Error('Environment configuration error')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// デバッグ情報
console.log('🔗 Supabase client initialized:', {
  environment: appEnv,
  url: supabaseUrl,
  hasKey: !!supabaseAnonKey
})
```

### データベース接続テスト

```typescript
// scripts/test-database-connection.ts
import { supabase } from '../src/lib/supabase'

async function testConnection() {
  try {
    // 接続テスト
    const { data, error } = await supabase
      .from('celebrities')
      .select('count(*)')
      .single()
    
    if (error) throw error
    
    console.log('✅ Database connection successful')
    console.log('📊 Celebrities count:', data?.count || 0)
    
    // 環境情報表示
    const env = import.meta.env.APP_ENV || 'unknown'
    const url = import.meta.env.VITE_SUPABASE_URL
    console.log('🌍 Environment:', env)
    console.log('🔗 Database URL:', url?.replace(/\/\/.*@/, '//***@'))
    
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }
}

testConnection()
```

## 📊 データ移行・同期

### Staging環境のデータ作成

```typescript
// scripts/sync-production-to-staging.ts
async function syncData() {
  // ⚠️ 注意: 実際の実装では本番データに直接アクセスしない
  // 代わりに、エクスポート/インポート機能を使用
  
  console.log('📋 Creating sample data for staging...')
  
  // サンプルデータ作成
  const sampleCelebrities = [
    {
      name: 'よにのちゃんねる（サンプル）',
      slug: 'yoni-sample',
      type: 'youtube_channel'
    }
  ]
  
  // ステージング環境にデータ挿入
  const { error } = await supabase
    .from('celebrities')
    .insert(sampleCelebrities)
  
  if (error) {
    console.error('❌ Sample data creation failed:', error)
  } else {
    console.log('✅ Sample data created successfully')
  }
}
```

### マイグレーションスクリプト

```sql
-- supabase/migrations/20240101000000_initial_schema.sql
CREATE TABLE celebrities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('individual', 'group', 'youtube_channel')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS有効化
ALTER TABLE celebrities ENABLE ROW LEVEL SECURITY;

-- 公開読み取り許可
CREATE POLICY "Public read access" ON celebrities
  FOR SELECT USING (true);
```

## 🔍 データベース監視・デバッグ

### ログ監視

```typescript
// データベースクエリのログ監視
const supabaseWithLogging = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: import.meta.env.VITE_ENVIRONMENT !== 'production'
  }
})

// クエリ実行時のログ
export async function queryWithLogging<T>(
  query: Promise<{ data: T | null; error: any }>,
  operation: string
) {
  const startTime = Date.now()
  console.log(`🔍 DB Query started: ${operation}`)
  
  try {
    const result = await query
    const duration = Date.now() - startTime
    
    if (result.error) {
      console.error(`❌ DB Query failed: ${operation}`, {
        error: result.error,
        duration: `${duration}ms`
      })
    } else {
      console.log(`✅ DB Query success: ${operation}`, {
        duration: `${duration}ms`,
        rows: Array.isArray(result.data) ? result.data.length : 1
      })
    }
    
    return result
  } catch (error) {
    console.error(`💥 DB Query error: ${operation}`, error)
    throw error
  }
}
```

### パフォーマンス監視

```typescript
// データベースパフォーマンスの監視
export class DatabaseMonitor {
  private static queries: Array<{
    operation: string
    duration: number
    timestamp: number
  }> = []
  
  static logQuery(operation: string, duration: number) {
    this.queries.push({
      operation,
      duration,
      timestamp: Date.now()
    })
    
    // 直近10件のクエリの平均時間を監視
    if (this.queries.length > 10) {
      const recent = this.queries.slice(-10)
      const avgDuration = recent.reduce((sum, q) => sum + q.duration, 0) / recent.length
      
      if (avgDuration > 1000) { // 1秒以上
        console.warn('⚠️ Slow database queries detected:', {
          averageDuration: `${avgDuration}ms`,
          recentQueries: recent
        })
      }
    }
  }
  
  static getStats() {
    return {
      totalQueries: this.queries.length,
      averageDuration: this.queries.reduce((sum, q) => sum + q.duration, 0) / this.queries.length,
      slowQueries: this.queries.filter(q => q.duration > 1000)
    }
  }
}
```

## 🛠️ トラブルシューティング

### よくある問題

#### 1. 接続エラー

```bash
# エラー: "Invalid API key"
# 対処: 環境変数の確認
echo $VITE_SUPABASE_ANON_KEY

# エラー: "Database connection failed"  
# 対処: URL形式の確認
echo $VITE_SUPABASE_URL
```

#### 2. RLS エラー

```bash
# エラー: "Row level security policy violation"
# 対処: RLS ポリシーの確認・修正

# Supabase ダッシュボードで確認:
# Authentication > Users (ユーザー認証状況)
# Database > Policies (RLS ポリシー)
```

#### 3. データが見つからない

```typescript
// デバッグ用クエリ
async function debugQuery() {
  // テーブル存在確認
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
  
  console.log('📊 Available tables:', tables)
  
  // データ件数確認  
  const { count } = await supabase
    .from('celebrities')
    .select('*', { count: 'exact', head: true })
  
  console.log('📊 Celebrities count:', count)
}
```