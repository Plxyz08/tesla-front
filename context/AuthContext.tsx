"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import type { Session } from "@supabase/supabase-js"
import { getSupabaseClient } from "../lib/supabase"
import { Alert } from "react-native"

// Define user types
export type UserRole = "admin" | "technician" | "client"

export interface UserProfile {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
  phone?: string
  photo?: string
  status?: string
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (data: Partial<UserProfile>) => Promise<UserProfile>
  register: (userData: any, role: UserRole) => Promise<boolean>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = getSupabaseClient()

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Verificar si hay una sesión activa
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          throw error
        }

        if (session) {
          setSession(session)

          // Obtener el perfil del usuario
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (profileError) {
            throw profileError
          }

          if (profile) {
            setUser({
              id: profile.id,
              name: profile.name,
              email: profile.email,
              role: profile.role as UserRole,
              profileImage: profile.profile_image || undefined,
              phone: profile.phone || undefined,
              photo: profile.photo || undefined,
              status: profile.status || undefined,
            })
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        console.error("Error checking auth state:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Suscribirse a cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)

      if (event === "SIGNED_IN" && session) {
        // Obtener el perfil del usuario
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          return
        }

        if (profile) {
          setUser({
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role as UserRole,
            profileImage: profile.profile_image || undefined,
            phone: profile.phone || undefined,
            photo: profile.photo || undefined,
            status: profile.status || undefined,
          })
          setIsAuthenticated(true)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setIsAuthenticated(false)
      }
    })

    checkAuthState()

    // Cleanup
    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // El perfil del usuario se obtendrá automáticamente a través del listener onAuthStateChange
    } catch (error: any) {
      console.error("Login error:", error)
      Alert.alert("Error", error.message || "No se pudo iniciar sesión. Inténtalo de nuevo.")
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        throw error
      }

      // El estado se actualizará automáticamente a través del listener onAuthStateChange
    } catch (error: any) {
      console.error("Logout error:", error)
      Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.")
      throw error
    }
  }

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error("No user logged in")

      // Convertir datos del perfil al formato de la base de datos
      const dbData = {
        name: data.name,
        email: data.email,
        profile_image: data.profileImage,
        phone: data.phone,
        photo: data.photo,
        status: data.status,
      }

      // Actualizar en la base de datos
      const { data: updatedProfile, error } = await supabase
        .from("users")
        .update(dbData)
        .eq("id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Actualizar estado local
      const updatedUser = {
        ...user,
        ...data,
      }
      setUser(updatedUser)

      return updatedUser
    } catch (error: any) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  // Register function
  const register = async (userData: any, role: UserRole): Promise<boolean> => {
    setIsLoading(true)
    try {
      // 1. Registrar el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario")
      }

      // 2. Crear el perfil del usuario
      const { error: profileError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: role,
        profile_image: userData.profileImage,
        phone: userData.phone,
        status: "active",
      })

      if (profileError) {
        // Si falla la creación del perfil, eliminar el usuario de Auth
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      // 3. Si es cliente o técnico, crear el registro correspondiente
      if (role === "client") {
        const { error: clientError } = await supabase.from("clients").insert({
          user_id: authData.user.id,
          ruc: userData.ruc,
          address: userData.address,
          building_name: userData.buildingName,
          elevator_brand: userData.elevatorBrand,
          elevator_count: userData.elevatorCount || 1,
          floor_count: userData.floorCount,
        })

        if (clientError) {
          throw clientError
        }
      } else if (role === "technician") {
        const { error: techError } = await supabase.from("technicians").insert({
          user_id: authData.user.id,
          specializations: userData.specializations || [],
        })

        if (techError) {
          throw techError
        }
      }

      return true
    } catch (error: any) {
      console.error("Registration error:", error)
      Alert.alert("Error", error.message || "No se pudo completar el registro. Inténtalo de nuevo.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Context value
  const value = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
