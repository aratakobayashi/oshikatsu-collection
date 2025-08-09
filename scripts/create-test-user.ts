/**
 * 開発用テストユーザーの作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// 環境変数を読み込み
config({ path: '.env.production' })

const supabaseUrl = process.env.VITE_SUPABASE_URL!
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('👤 開発用テストユーザーの作成')
  console.log('='.repeat(60))
  
  const testUsers = [
    {
      email: 'admin@test.com',
      password: 'password123',
      username: 'admin',
      display_name: '管理者',
      role: 'admin'
    },
    {
      email: 'user@test.com', 
      password: 'password123',
      username: 'testuser',
      display_name: 'テストユーザー',
      role: 'user'
    }
  ]
  
  for (const userData of testUsers) {
    try {
      console.log(`\n🔧 作成中: ${userData.email}`)
      
      // ユーザー登録
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            display_name: userData.display_name
          }
        }
      })
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          console.log(`⚠️  ユーザー ${userData.email} は既に存在します`)
          
          // 既存ユーザーのサインイン試行
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: userData.password
          })
          
          if (signInError) {
            console.log(`❌ サインインエラー: ${signInError.message}`)
          } else {
            console.log(`✅ 既存ユーザーでサインイン成功`)
            console.log(`   ユーザーID: ${signInData.user?.id}`)
          }
        } else {
          console.error(`❌ 登録エラー: ${signUpError.message}`)
        }
        continue
      }
      
      if (authData.user) {
        console.log(`✅ 認証ユーザー作成成功`)
        console.log(`   ユーザーID: ${authData.user.id}`)
        console.log(`   メール確認: ${authData.user.email_confirmed_at ? '確認済み' : '未確認'}`)
        
        // アプリケーションのusersテーブルにもレコード作成
        try {
          const { data: userRecord, error: userError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email: userData.email,
              username: userData.username,
              display_name: userData.display_name,
              is_verified: true
            })
          
          if (userError) {
            if (userError.code === '23505') { // Unique constraint violation
              console.log(`ℹ️  usersテーブルのレコードは既に存在します`)
            } else {
              console.error(`❌ usersテーブル挿入エラー: ${userError.message}`)
            }
          } else {
            console.log(`✅ usersテーブルにレコード作成`)
          }
        } catch (userTableError: any) {
          console.error(`❌ usersテーブル操作エラー: ${userTableError.message}`)
        }
      }
      
    } catch (error: any) {
      console.error(`❌ ユーザー作成エラー (${userData.email}):`, error.message)
    }
  }
  
  console.log('\n📋 作成されたテストユーザー:')
  console.log('=' .repeat(40))
  console.log('🔑 管理者アカウント:')
  console.log('   メール: admin@test.com')
  console.log('   パスワード: password123')
  console.log('')
  console.log('👤 一般ユーザーアカウント:')
  console.log('   メール: user@test.com')
  console.log('   パスワード: password123')
  console.log('')
  console.log('🌐 ログインURL:')
  console.log('   http://localhost:5173/login')
  console.log('')
  console.log('⚙️  管理画面URL:')
  console.log('   http://localhost:5173/admin')
  console.log('')
  console.log('ℹ️  ログイン後、以下のURLにアクセスできます:')
  console.log('   - 投稿画面: http://localhost:5173/submit')
  console.log('   - プロフィール: http://localhost:5173/celebrities/よにのちゃんねる')
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestUser().catch(console.error)
}