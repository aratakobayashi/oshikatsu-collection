/**
 * 認証フック
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface User {
  id: string
  email: string
  username?: string
  display_name?: string
  is_admin: boolean
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 初回ロード時にセッション確認
    checkUser()
    
    // 認証状態変更の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // usersテーブルから追加情報を取得
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('username, display_name')
          .eq('email', session.user.email)
          .single()
        
        // 管理者メールアドレスのリスト（実際のメールアドレスを追加可能）
        const adminEmails = [
          'admin@test.com',
          'arata.kobayashi.1014@gmail.com', // あなたのメールアドレスを追加
        ]
        const isAdmin = adminEmails.includes(session.user.email || '')
        
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: userProfile?.username,
          display_name: userProfile?.display_name,
          is_admin: isAdmin
        })
        
        console.log('✅ User authenticated:', {
          email: session.user.email,
          is_admin: isAdmin
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('❌ Auth check error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      throw error
    }
    
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }
    setUser(null)
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    isAdmin: user?.is_admin || false,
    isAuthenticated: !!user
  }
}