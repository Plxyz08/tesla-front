"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import * as SecureStore from "expo-secure-store"
import { Alert } from "react-native"

// Define user types
type UserRole = "admin" | "technician" | "client"

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUserProfile: (data: Partial<User>) => Promise<User>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const userJson = await SecureStore.getItemAsync("user")

        if (userJson) {
          const userData = JSON.parse(userJson)
          setUser(userData)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error("Error checking auth state:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthState()
  }, [])

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true)

    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate authentication

      let userData: User | null = null

      // Demo users
      if (email === "admin@example.com" && password === "admin123") {
        userData = {
          id: "admin-1",
          name: "Administrador",
          email: "admin@example.com",
          role: "admin",
        }
      } else if (email === "tecnico@example.com" && password === "tecnico123") {
        userData = {
          id: "tech-1",
          name: "Técnico Demo",
          email: "tecnico@example.com",
          role: "technician",
        }
      } else if (email === "cliente@example.com" && password === "cliente123") {
        userData = {
          id: "client-1",
          name: "Cliente Demo",
          email: "cliente@example.com",
          role: "client",
        }
      } else {
        // In a real app, this would be an API call to validate credentials
        throw new Error("Credenciales inválidas")
      }

      if (userData) {
        // Save user data to secure storage
        await SecureStore.setItemAsync("user", JSON.stringify(userData))

        // Update state
        setUser(userData)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Login error:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync("user")

      // Update state
      setUser(null)
      setIsAuthenticated(false)
    } catch (error) {
      console.error("Logout error:", error)
      Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.")
    }
  }

  // Update user profile
  const updateUserProfile = async (data: Partial<User>) => {
    try {
      if (!user) throw new Error("No user logged in")

      // Update user data
      const updatedUser = { ...user, ...data }

      // Save to secure storage
      await SecureStore.setItemAsync("user", JSON.stringify(updatedUser))

      // Update state
      setUser(updatedUser)

      return updatedUser
    } catch (error) {
      console.error("Update profile error:", error)
      throw error
    }
  }

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
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

