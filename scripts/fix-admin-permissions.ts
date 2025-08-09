/**
 * 管理者権限修正
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

async function fixAdminPermissions() {
  console.log('🔧 管理者権限修正開始')
  console.log('='.repeat(50))
  
  try {
    // 既存のadmin@test.comユーザー確認
    const { data: existingAdmin, error: adminCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@test.com')
      .single()
      
    if (adminCheckError && adminCheckError.code !== 'PGRST116') {
      console.log('❌ Admin確認エラー:', adminCheckError.message)
      return
    }
    
    if (existingAdmin) {
      console.log('✅ 既存adminユーザー発見:', existingAdmin.email)
      console.log('   現在のrole:', existingAdmin.role)
      
      if (existingAdmin.role !== 'admin') {
        // roleをadminに更新
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('email', 'admin@test.com')
          
        if (updateError) {
          console.log('❌ Role更新エラー:', updateError.message)
        } else {
          console.log('✅ Role更新完了: admin')
        }
      } else {
        console.log('✅ 既にadmin権限あり')
      }
    } else {
      console.log('❌ admin@test.comユーザーが見つかりません')
      
      // profilesテーブル構造確認
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('email, role')
        .limit(5)
        
      if (profilesError) {
        console.log('❌ Profiles確認エラー:', profilesError.message)
      } else {
        console.log('📊 既存profiles:')
        allProfiles?.forEach((profile, idx) => {
          console.log(`  ${idx + 1}. ${profile.email} (${profile.role})`)
        })
      }
    }
    
    // authテーブルも確認（もし存在する場合）
    console.log('\n🔍 認証情報確認中...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Auth確認エラー:', authError.message)
    } else {
      console.log('📊 認証ユーザー数:', authUsers.users?.length || 0)
      const adminUser = authUsers.users?.find(user => user.email === 'admin@test.com')
      if (adminUser) {
        console.log('✅ 認証admin発見:', adminUser.email)
        console.log('   ID:', adminUser.id)
      } else {
        console.log('❌ 認証adminが見つかりません')
      }
    }
    
  } catch (error: any) {
    console.error('❌ エラー:', error.message)
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAdminPermissions().catch(console.error)
}