"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { ActivityIndicator } from "react-native-paper"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as SecureStore from "expo-secure-store"

const { width, height } = Dimensions.get("window")

export default function LoginScreen() {
  const { login } = useAuth()
  const insets = useSafeAreaInsets()

  // Form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [ruc, setRuc] = useState("")

  // Validation state
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
    ruc: "",
  })

  // Load saved credentials on mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await SecureStore.getItemAsync("user_email")
        const savedRememberMe = await SecureStore.getItemAsync("remember_me")

        if (savedEmail && savedRememberMe === "true") {
          setEmail(savedEmail)
          setRememberMe(true)
        }
      } catch (error) {
        console.error("Error loading saved credentials:", error)
      }
    }

    loadSavedCredentials()
  }, [])

  // Validate form
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido"
      isValid = false
    } else {
      newErrors.email = ""
    }

    // Password validation
    if (!password) {
      newErrors.password = "La contraseña es obligatoria"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      isValid = false
    } else {
      newErrors.password = ""
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({ ...errors, general: "" })

    try {
      // Save credentials if remember me is checked
      if (rememberMe) {
        await SecureStore.setItemAsync("user_email", email)
        await SecureStore.setItemAsync("remember_me", "true")
      } else {
        await SecureStore.deleteItemAsync("user_email")
        await SecureStore.deleteItemAsync("remember_me")
      }

      // Attempt login with Supabase
      await login(email, password)

      // Si el login es exitoso, el AuthContext redirigirá automáticamente
    } catch (error: any) {
      console.error("Login error:", error)
      setErrors({
        ...errors,
        general: error.message || "Credenciales inválidas. Por favor, inténtalo de nuevo.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#f7be0d" />

      <LinearGradient colors={["#f7be0d", "#e6a800"]} style={[styles.header, { paddingTop: insets.top }]}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Bienvenido de nuevo. Por favor, ingresa tus credenciales.</Text>

          {errors.general ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>RUC (Opcional)</Text>
            <View style={[styles.inputWrapper, errors.ruc ? styles.inputWrapperError : {}]}>
              <Ionicons name="business-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu RUC"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                value={ruc}
                onChangeText={(text) => {
                  setRuc(text)
                  if (errors.ruc) setErrors({ ...errors, ruc: "" })
                }}
              />
            </View>
            {errors.ruc ? <Text style={styles.fieldErrorText}>{errors.ruc}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={[styles.inputWrapper, errors.email ? styles.inputWrapperError : {}]}>
              <Ionicons name="mail" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu correo electrónico"
                placeholderTextColor="#9ca3af"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text)
                  if (errors.email) setErrors({ ...errors, email: "" })
                }}
              />
            </View>
            {errors.email ? <Text style={styles.fieldErrorText}>{errors.email}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={[styles.inputWrapper, errors.password ? styles.inputWrapperError : {}]}>
              <Ionicons name="lock-closed" size={20} color="#9ca3af" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text)
                  if (errors.password) setErrors({ ...errors, password: "" })
                }}
              />
              <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.fieldErrorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.rememberMeContainer} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.checkbox, rememberMe ? styles.checkboxChecked : {}]}>
                {rememberMe && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.rememberMeText}>Recordarme</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    height: height * 0.25,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: width * 0.7,
    height: 120,
    tintColor: "white",
  },
  scrollView: {
    flex: 1,
    marginTop: -30,
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#ef4444",
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    height: 50,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#1f2937",
    fontSize: 15,
  },
  passwordToggle: {
    padding: 12,
  },
  fieldErrorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#f7be0d",
    borderColor: "#f7be0d",
  },
  rememberMeText: {
    fontSize: 14,
    color: "#4b5563",
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#f7be0d",
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#f7be0d",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
