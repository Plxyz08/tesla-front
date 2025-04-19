"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native"
import { TextInput, Button, RadioButton } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import AppHeader from "../../components/AppHeader"
import * as ImagePicker from "expo-image-picker"
import type { RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

// Cloudinary configuration
const CLOUDINARY_URL = process.env.CLOUDINARY_URL
const UPLOAD_PRESET = "teslalift-perfil" // Replace with your upload preset

// Define el tipo para las props de la pantalla
type Props = {
  navigation: NativeStackNavigationProp<any, any>
  route: RouteProp<any, any>
}

export default function CreateUserScreen({ navigation, route }: Props) {
  const [userType, setUserType] = useState<"client" | "technician">("client")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [ruc, setRuc] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [specialization, setSpecialization] = useState<string[]>([])
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">("active")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const { register } = useAuth()

  // Validation state
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    ruc: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  })

  const handleRegister = async () => {
    setIsLoading(true)

    // Validate form
    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      let profileImageUrl: string | null = null

      if (profileImage) {
        setIsUploading(true)
        // Upload profile image to Cloudinary
        const formData = new FormData()
        formData.append("file", {
          uri: profileImage,
          type: "image/jpeg",
          name: "profile_image.jpg",
        } as any)
        formData.append("upload_preset", UPLOAD_PRESET)

        const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (data.secure_url) {
          profileImageUrl = data.secure_url
        } else {
          throw new Error("No se pudo obtener la URL de la imagen")
        }
      }

      const userData = {
        name,
        email,
        phone,
        ruc: userType === "client" ? ruc : undefined,
        companyName: userType === "client" ? companyName : undefined,
        password,
        profileImage: profileImageUrl || undefined, // Include profile image URL
      }

      const success = await register(userData, userType === "client" ? "client" : "technician")

      if (success) {
        Alert.alert("Éxito", "Registro completado con éxito")
        navigation.goBack()
      } else {
        Alert.alert("Error", "No se pudo completar el registro")
      }
    } catch (error) {
      console.error("Registration error:", error)
      Alert.alert("Error", "Ha ocurrido un error. Intente nuevamente.")
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  const specializationOptions = [
    "Mantenimiento",
    "Reparación",
    "Instalación",
    "Emergencias",
    "Inspección",
    "Modernización",
    "Certificación",
  ]

  const toggleSpecialization = (spec: string) => {
    if (specialization.includes(spec)) {
      setSpecialization(specialization.filter((s) => s !== spec))
    } else {
      setSpecialization([...specialization, spec])
    }
  }

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    })

    console.log(result)

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri)
    }
  }

  // Validate form
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    }

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido"
      isValid = false
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
      isValid = false
    }

    if (userType === "client") {
      if (!ruc.trim()) {
        newErrors.ruc = "El RUC es obligatorio"
        isValid = false
      }
      if (!companyName.trim()) {
        newErrors.companyName = "El nombre de la empresa es obligatorio"
        isValid = false
      }
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria"
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      isValid = false
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Crear Usuario" subtitle="Crea un nuevo técnico o cliente" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.content}>
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

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} disabled={isUploading}>
          {isUploading ? (
            <ActivityIndicator size="large" color="#ccc" />
          ) : profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.image} />
          ) : (
            <Ionicons name="camera" size={64} color="#ccc" />
          )}
        </TouchableOpacity>

        <TextInput
          label="Nombre completo"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
          error={!!errors.name}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <TextInput
          label="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
          error={!!errors.email}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

        <TextInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
          left={<TextInput.Icon icon="phone" />}
          error={!!errors.phone}
        />
        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}

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
              error={!!errors.ruc}
            />
            {errors.ruc ? <Text style={styles.errorText}>{errors.ruc}</Text> : null}

            <TextInput
              label="Nombre de la empresa"
              value={companyName}
              onChangeText={setCompanyName}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="domain" />}
              error={!!errors.companyName}
            />
            {errors.companyName ? <Text style={styles.errorText}>{errors.companyName}</Text> : null}
          </>
        )}

        {userType === "technician" && (
          <>
            <Text style={styles.sectionTitle}>Especializaciones</Text>
            <View style={styles.specializationContainer}>
              {specializationOptions.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specializationChip,
                    specialization.includes(spec) && styles.selectedSpecializationChip,
                  ]}
                  onPress={() => toggleSpecialization(spec)}
                >
                  <Text
                    style={[
                      styles.specializationChipText,
                      specialization.includes(spec) && styles.selectedSpecializationChipText,
                    ]}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
          error={!!errors.password}
        />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

        <TextInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!passwordVisible}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="lock-check" />}
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

        <Button
          mode="contained"
          onPress={handleRegister}
          style={styles.registerButton}
          loading={isLoading}
          disabled={isLoading || isUploading}
        >
          Crear Usuario
        </Button>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
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
  imagePicker: {
    borderRadius: 50,
    width: 100,
    height: 100,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  specializationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  specializationChip: {
    margin: 4,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedSpecializationChip: {
    backgroundColor: "#7c3aed",
  },
  specializationChipText: {
    fontSize: 14,
    color: "#4b5563",
  },
  selectedSpecializationChipText: {
    color: "white",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -8,
  },
})
