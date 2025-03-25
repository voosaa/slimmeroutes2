"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  created_at?: string
  updated_at?: string
}

interface ProfileUpdateData {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  isLoading: boolean
  isSupabaseAvailable: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, firstName?: string, lastName?: string, company?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  updateProfile: (data: ProfileUpdateData) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const setData = async () => {
      try {
        if (!supabase) {
          console.error('Supabase client not initialized')
          setLoading(false)
          return
        }
        
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    const setupAuthListener = () => {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return { unsubscribe: () => {} }
      }
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      })
      
      return subscription
    }

    setData()
    const subscription = setupAuthListener()

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to handle the case when no rows are returned
      
      if (error) throw error
      
      if (data) {
        setProfile(data)
      } else {
        // If no profile exists, create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ id: userId }])
          .select()
          .single()
          
        if (createError) throw createError
        
        setProfile(newProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return { error: new Error('Supabase client not initialized') }
      }
      
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error signing in:', error)
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, company?: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return { error: new Error('Supabase client not initialized') }
      }
      
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: firstName,
            last_name: lastName,
            company
          }
        }
      })
      
      if (error) throw error
      
      return { error: null }
    } catch (error) {
      console.error('Error signing up:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not initialized')
        return { error: new Error('Supabase client not initialized') }
      }
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error as Error }
    }
  }
  
  const updateProfile = async (data: ProfileUpdateData) => {
    try {
      if (!user) throw new Error('User not authenticated')
      
      if (!supabase) {
        console.error('Supabase client not initialized')
        return { error: new Error('Supabase client not initialized') }
      }
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...data,
          updated_at: new Date().toISOString()
        })
      
      if (error) throw error
      
      // Update local profile state
      setProfile(prev => prev ? { ...prev, ...data } : null)
      
      return { error: null }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: error as Error }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading: loading,
    isSupabaseAvailable: !!supabase,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
