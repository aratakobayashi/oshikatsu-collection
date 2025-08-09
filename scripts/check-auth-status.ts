/**
 * 認証状態とユーザー情報の確認
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAuthStatus() {
  console.log('🔍 認証状態とユーザー情報の確認')
  console.log('='.repeat(60))
  
  try {
    // 現在の認証状態確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError)
      return
    }
    
    console.log('🔐 認証状態:')
    console.log('  セッション:', session ? '✅ 有効' : '❌ なし')
    
    if (session) {
      console.log('  ユーザーID:', session.user?.id)
      console.log('  メールアドレス:', session.user?.email)
      console.log('  作成日:', session.user?.created_at)
    }
    
    // ユーザー一覧を確認
    console.log('\n👥 登録ユーザー一覧:')
    console.log('-'.repeat(40))
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, username, display_name, created_at')
      .limit(10)
    
    if (usersError) {
      console.log('❌ ユーザー取得エラー:', usersError.message)
      
      // auth.usersテーブルを直接確認（管理者権限が必要）
      console.log('\n🔑 Supabase Auth ユーザーを確認中...')
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.log('❌ Auth ユーザー取得エラー:', authError.message)
        console.log('ℹ️  管理者権限が必要です')
      } else {
        console.log(`📊 Auth ユーザー数: ${authUsers.users?.length || 0}件`)
        authUsers.users?.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
        })
      }
    } else {
      console.log(`📊 アプリユーザー数: ${users?.length || 0}件`)
      users?.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.display_name || user.username} (${user.email || 'メールなし'})`)
      })
    }
    
    // テストユーザー作成の提案
    console.log('\n🔨 開発用ユーザーの作成方法:')
    console.log('-'.repeat(40))
    console.log('1. Supabase管理画面にアクセス')
    console.log('   https://supabase.com/dashboard')
    console.log('2. Authentication → Users → Invite User')
    console.log('3. テスト用メールアドレスを入力')
    console.log('4. または以下のスクリプトを実行:')
    console.log('   npx tsx scripts/create-test-user.ts')
    
    // 現在の認証設定確認
    console.log('\n⚙️  認証設定確認:')
    console.log('-'.repeat(40))
    console.log('環境変数:')
    console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定')
    console.log('  VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定')
    
  } catch (error: any) {
    console.error('❌ 確認エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  checkAuthStatus().catch(console.error)
}