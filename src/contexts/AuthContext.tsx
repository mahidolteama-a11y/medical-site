import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { signUp as dummySignUp, signIn as dummySignIn, signOut as dummySignOut, getCurrentSession, AuthSession } from '../lib/dummyAuth'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const existingSession = getCurrentSession()
    if (existingSession) {
      setSession(existingSession)
      setUser(existingSession.user)
    }
    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { data, error } = await dummySignUp(email, password, fullName, role)
    
    if (data && !error) {
      setSession(data.session)
      setUser(data.user)
    }
    
    return { data, error }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await dummySignIn(email, password)
    
    if (data && !error) {
      setSession(data.session)
      setUser(data.user)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await dummySignOut()
    
    if (!error) {
      setSession(null)
      setUser(null)
    }
    
    return { error }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}