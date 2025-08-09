/**
 * 管理者ユーザー作成スクリプト
 * admin@test.com / password123 のユーザーを作成
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function createAdminUser() {
  console.log('🔐 管理者ユーザー作成スクリプト')
  console.log('='.repeat(50))
  
  const adminEmail = 'admin@test.com'
  const adminPassword = 'password123'
  
  try {
    // まずサインイン試行（既存ユーザーかチェック）
    console.log(`🔄 サインイン試行: ${adminEmail}`)
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    
    if (signInData.user && !signInError) {
      console.log('✅ 管理者ユーザーは既に存在し、ログイン成功')
      console.log(`   User ID: ${signInData.user.id}`)
      console.log(`   Email: ${signInData.user.email}`)
      console.log(`   作成日: ${new Date(signInData.user.created_at).toLocaleString('ja-JP')}`)
      return
    }
    
    // 新規ユーザー作成
    console.log('👤 新規管理者ユーザー作成中...')
    
    const { data, error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          username: 'admin',
          display_name: 'Administrator',
          is_admin: true
        }
      }
    })
    
    if (error) {
      console.error('❌ ユーザー作成エラー:', error.message)
      console.log('💡 このエラーは、ユーザーが既に存在するか、メール確認が必要な場合に発生します')
    } else {
      console.log('✅ 管理者ユーザー作成成功！')
      console.log(`   User ID: ${data.user?.id}`)
      console.log(`   Email: ${data.user?.email}`)
      console.log('📧 確認メールが送信される場合がありますが、開発環境では不要です')
    }
    
    console.log('\n🔐 管理者ログイン情報:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   管理画面URL: http://localhost:5173/admin`)
    
  } catch (error: any) {
    console.error('❌ スクリプト実行エラー:', error.message)
  }
}

// Run script
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser().catch(console.error)
}