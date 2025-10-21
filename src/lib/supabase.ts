import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Gracefully handle environments where Supabase is not configured.
// Instead of throwing at import time ("supabaseUrl is required"),
// we create a client with a stub fetch that always responds with
// a 503 error. This keeps the app running, while any Supabase
// calls return an error object the UI can handle.
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('http://localhost', 'public-anon-key', {
      global: {
        fetch: async () => {
          const body = {
            message: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
          }
          return new Response(JSON.stringify(body), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })

export const signUp = async (email: string, password: string, fullName: string, role: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}
