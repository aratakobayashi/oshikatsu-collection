import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  loading: boolean
}

export const auth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },
  
  async signUp(email: string, password: string, userData?: { username: string; display_name: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(userData && {
        options: {
          data: userData
        }
      })
    })
    
    if (error) throw error
    return data
  },
  
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    // If there's no active session, return null instead of throwing
    if (error && error.message === 'Auth session missing!') {
      return null
    }
    if (error) throw error
    return user
  },
  
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null)
    })
  }
}