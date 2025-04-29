"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"
import * as SecureStore from "expo-secure-store"
import { Alert } from "react-native"

// Define user types
export type UserRole = "admin" | "technician" | "client"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  profileImage?: string
  phone?: string
  // Añadir propiedades adicionales que pueden tener todos los usuarios
  photo?: string
  status?: string
  // Propiedades específicas para clientes
  ruc?: string
  address?: string
  buildingName?: string
  elevatorBrand?: string
  elevatorCount?: number
  floorCount?: number
  contractType?: string
  invoiceStatus?: string
  // Estado de pago (añadido para solucionar el error)
  paymentStatus?: "paid" | "debt"
  // Campos financieros (Fase 5.1)
  duracionContratoMeses?: number
  totalCuentaCliente?: number
  abonosPago?: Array<{
    monto: number
    fecha: string
    concepto?: string
  }>
  // Propiedades específicas para técnicos
  specialization?: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  updateUserProfile: (data: Partial<User>) => Promise<User>
  register: (userData: any, role: UserRole) => Promise<boolean>
  users: User[] // Add users to the AuthContextType
  updateUser: (user: Partial<User>) => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [users, setUsers] = useState<User[]>([]) // Add users state

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

  // Register function
  const register = async (userData: any, role: UserRole): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create a new user object
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: role,
        profileImage: userData.profileImage,
        phone: userData.phone,
        ...(role === "technician" ? { specialization: [] } : {}),
      }

      // Save user data to secure storage
      await SecureStore.setItemAsync("user", JSON.stringify(newUser))

      // Update state
      setUser(newUser)
      setIsAuthenticated(true)

      // Update users list
      setUsers((prevUsers) => [...prevUsers, newUser])

      return true
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Error", "No se pudo completar el registro. Inténtalo de nuevo.")
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const updateUser = async (updatedUser: Partial<User>) => {
    try {
      if (!updatedUser.id) {
        throw new Error("User ID is required for update")
      }

      // Actualizar el usuario en la lista de usuarios
      const updatedUsers = users.map((user) => (user.id === updatedUser.id ? { ...user, ...updatedUser } : user))

      setUsers(updatedUsers)

      // Si el usuario actualizado es el usuario actual, actualizar también el estado del usuario
      if (user && user.id === updatedUser.id) {
        setUser({ ...user, ...updatedUser })
      }

      // Aquí podrías añadir lógica para persistir los cambios en AsyncStorage o en una API

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating user:", error)
      return Promise.reject(error)
    }
  }

  // Context value
  const value = {
    user,
    users,
    login,
    logout,
    register,
    isLoading,
    isAuthenticated,
    updateUser, // Añadir esta línea
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
