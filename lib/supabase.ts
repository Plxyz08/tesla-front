import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/supabase"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Singleton pattern para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

// Cliente para uso en el lado del cliente (React Native)
export const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  })

  return supabaseInstance
}

// Cliente para uso en el lado del servidor (Server Actions, API Routes)
export const getServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
