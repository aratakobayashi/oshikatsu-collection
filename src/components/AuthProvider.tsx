import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { auth } from '../lib/auth'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: { username: string; display_name: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    auth.getCurrentUser().then(async (user) => {
      if (user) {
        // Ensure user exists in users table
        await ensureUserProfile(user)
      }
      setUser(user)
    }).finally(() => setLoading(false))

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (user) => {
      if (user) {
        // Ensure user exists in users table
        await ensureUserProfile(user)
      }
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function ensureUserProfile(user: any) {
    try {
      // Check if user exists in users table
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()
      
      // If user doesn't exist, create profile
      if (!existingUser && !error) {
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user'
        const displayName = user.user_metadata?.display_name || user.user_metadata?.username || username
        
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email,
            username: username,
            display_name: displayName
          }])
        
        if (insertError) {
          // If it's a duplicate key error, that's OK - user already exists
          if (!insertError.message.includes('duplicate key')) {
            console.error('Error creating user profile:', insertError)
          }
        }
      } else if (error) {
        // If there's an error checking for existing user, log it but don't throw
        console.error('Error checking user profile:', error)
      }
      // If existingUser is found, do nothing - user already exists
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      // Don't throw error - this is a background operation
    }
  }

  const signIn = async (email: string, password: string) => {
    await auth.signIn(email, password)
  }

  const signUp = async (email: string, password: string, userData: { username: string; display_name: string }) => {
    await auth.signUp(email, password, userData)
  }

  const signOut = async () => {
    await auth.signOut()
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}