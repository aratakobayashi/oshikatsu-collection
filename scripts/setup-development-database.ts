/**
 * 開発環境データベースセットアップ
 * 本番環境のスキーマを新しい開発環境にコピー
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 本番環境の設定
const PRODUCTION_URL = 'https://awaarykghpylggygkiyp.supabase.co'
const PRODUCTION_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3YWFyeWtnaHB5bGdneWdraXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTE0MDksImV4cCI6MjA2NzM2NzQwOX0.J1dXm0eHB8RaqT_UnOI_zY7q1UyTaV4lLJtQT6EHhOE'

// 開発環境の設定（現在の.env）
config({ path: '.env' })

const productionSupabase = createClient(PRODUCTION_URL, PRODUCTION_KEY)
const developmentSupabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function setupDevelopmentDatabase() {
  console.log('🛠️ 開発環境データベースセットアップ')
  console.log('='.repeat(50))
  
  console.log('🔗 本番環境:', PRODUCTION_URL)
  console.log('🆕 開発環境:', process.env.VITE_SUPABASE_URL)
  
  try {
    // Step 1: 本番環境からサンプルデータを取得
    console.log('\n📊 本番データサンプル取得中...')
    
    const { data: celebrities, error: celebError } = await productionSupabase
      .from('celebrities')
      .select('*')
      .limit(1)
    
    if (celebError) {
      console.log('❌ 本番データ取得エラー:', celebError.message)
      return
    }
    
    console.log('✅ 本番データ確認完了:', celebrities?.length || 0, 'celebrities')
    
    // Step 2: 開発環境の状態確認
    console.log('\n🔍 開発環境の状態確認...')
    
    const { data: devTest, error: devError } = await developmentSupabase
      .from('celebrities')
      .select('*')
      .limit(1)
    
    if (devError) {
      console.log('✅ 期待通り: 開発環境は空のデータベース')
      console.log('   エラー:', devError.message)
    } else {
      console.log('ℹ️ 開発環境に既存データ:', devTest?.length || 0, 'records')
    }
    
    console.log('\n🎯 次のステップ:')
    console.log('1. Supabaseダッシュボードで開発環境にテーブル作成')
    console.log('2. 本番スキーマのコピー')
    console.log('3. テストデータのインポート')
    
    // SQL生成のためのガイド表示
    console.log('\n📝 手動セットアップガイド:')
    console.log('1. 開発環境Supabaseダッシュボードを開く')
    console.log('2. SQL Editorに移動')
    console.log('3. scripts/supabase-production-schema.sql を実行')
    
  } catch (error: any) {
    console.error('❌ セットアップエラー:', error.message)
  }
}

// Run setup
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDevelopmentDatabase().catch(console.error)
}