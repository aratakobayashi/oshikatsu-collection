/**
 * usersテーブルにroleカラム追加と管理者権限設定
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function addAdminRole() {
  console.log('🔧 Admin Role システム追加')
  console.log('='.repeat(50))
  
  try {
    // 1. usersテーブルにroleカラムがあるか確認
    const { data: sampleUser } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single()
      
    console.log('📊 現在のusersテーブル構造:')
    if (sampleUser) {
      Object.keys(sampleUser).forEach(key => {
        console.log(`  - ${key}: ${typeof sampleUser[key]}`)
      })
    }
    
    // 2. admin@test.comユーザーをadminに設定
    console.log('\n👤 admin@test.comユーザー確認...')
    const { data: adminUser, error: adminFindError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@test.com')
      .single()
      
    if (adminFindError) {
      console.log('❌ Admin user not found:', adminFindError.message)
      
      // admin@test.comユーザーを作成
      console.log('\n🆕 admin@test.comユーザー作成中...')
      const { data: newAdmin, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'admin@test.com',
          username: 'admin',
          display_name: '管理者',
          is_verified: true
        })
        .select()
        .single()
        
      if (createError) {
        console.log('❌ Admin user creation error:', createError.message)
      } else {
        console.log('✅ Admin user created:', newAdmin?.email)
      }
    } else {
      console.log('✅ Admin user found:', adminUser.email)
      console.log('   Display name:', adminUser.display_name)
      console.log('   Verified:', adminUser.is_verified)
    }
    
    // 3. 全ユーザー一覧表示
    console.log('\n📋 全ユーザー一覧:')
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('email, username, display_name, is_verified')
      .order('created_at', { ascending: false })
      
    if (usersError) {
      console.log('❌ Users fetch error:', usersError.message)
    } else {
      allUsers?.forEach((user, idx) => {
        console.log(`  ${idx + 1}. ${user.email} (${user.display_name || user.username})${user.is_verified ? ' ✓' : ''}`)
      })
    }
    
    console.log('\n🎯 次のステップ:')
    console.log('1. usersテーブルにroleカラム追加するSQL実行が必要')
    console.log('2. 簡易認証コンポーネント実装')
    console.log('3. admin@test.comでログインテスト')
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  addAdminRole().catch(console.error)
}