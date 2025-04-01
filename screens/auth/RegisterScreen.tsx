"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native"
import { TextInput, Button, RadioButton } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"

export default function RegisterScreen() {
  const [userType, setUserType] = useState<"client" | "technician">("client")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [ruc, setRuc] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const navigation = useNavigation<any>()
  const { register } = useAuth()

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/
    return re.test(email)
  }

  const validateForm = () => {
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor complete todos los campos obligatorios")
      return false
    }

    if (userType === "client" && !ruc) {
      Alert.alert("Error", "Por favor ingrese su RUC")
      return false
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Por favor ingrese un correo electrónico válido")
      return false
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden")
      return false
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres")
      return false
    }

    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const userData = {
        name,
        email,
        phone,
        ruc: userType === "client" ? ruc : undefined,
        companyName: userType === "client" ? companyName : undefined,
        password,
      }

      const success = await register(userData, userType === "client" ? "client" : "technician")

      if (success) {
        Alert.alert("Éxito", "Registro completado con éxito")
      } else {
        Alert.alert("Error", "No se pudo completar el registro")
      }
    } catch (error) {
      Alert.alert("Error", "Ha ocurrido un error. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Crear Cuenta</Text>
        <Text style={styles.subtitle}>Ingresa tus datos para registrarte</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.userTypeContainer}>
          <Text style={styles.userTypeLabel}>Tipo de usuario:</Text>
          <View style={styles.radioGroup}>
            <View style={styles.radioButton}>
              <RadioButton
                value="client"
                status={userType === "client" ? "checked" : "unchecked"}
                onPress={() => setUserType("client")}
                color="#0284c7"
              />
              <Text>Cliente</Text>
            </View>
            <View style={styles.radioButton}>
              <RadioButton
                value="technician"
                status={userType === "technician" ? "checked" : "unchecked"}
                onPress={() => setUserType("technician")}
                color="#0284c7"
              />
              <Text>Técnico</Text>
            </View>
          </View>
        </View>

        <TextInput
          label="Nombre completo"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
        />

        <TextInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          left={<TextInput.Icon icon="phone" />}
        />

        {userType === "client" && (
          <>
            <TextInput
              label="RUC"
              value={ruc}
              onChangeText={setRuc}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              left={<TextInput.Icon icon="card-account-details" />}
            />

            <TextInput
              label="Nombre de la empresa"
              value={companyName}
              onChangeText={setCompanyName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="domain" />}
            />
          </>
        )}

        <TextInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="lock" />}
          right={
            <TextInput.Icon
              icon={passwordVisible ? "eye-off" : "eye"}
              onPress={() => setPasswordVisible(!passwordVisible)}
            />
          }
        />

        <TextInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!passwordVisible}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="lock-check" />}
        />

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.registerButton}
          loading={isLoading}
          disabled={isLoading}
        >
          Registrarme
        </Button>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0284c7",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userTypeContainer: {
    marginBottom: 20,
  },
  userTypeLabel: {
    marginBottom: 8,
    fontWeight: "500",
    color: "#4b5563",
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  registerButton: {
    paddingVertical: 8,
    backgroundColor: "#0284c7",
    marginTop: 8,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  loginText: {
    color: "#4b5563",
  },
  loginLink: {
    color: "#0284c7",
    fontWeight: "500",
  },
})

