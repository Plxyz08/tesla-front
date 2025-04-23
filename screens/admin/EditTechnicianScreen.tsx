"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { TextInput, Button, HelperText } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import AppHeader from "../../components/AppHeader"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

// Importar el contexto de autenticación
import { useAuth, type UserRole } from "../../context/AuthContext"
import * as FileSystem from "expo-file-system"

// Tipos de especialización disponibles para los técnicos
const SPECIALIZATIONS = [
  "Mantenimiento",
  "Reparación",
  "Instalación",
  "Emergencias",
  "Inspección",
  "Modernización",
  "Certificación",
]

// Modificar la interfaz RouteParams
interface RouteParams {
  technicianId?: string
}

export default function EditTechnicianScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { technicianId } = (route.params as RouteParams) || {}
  const isEditing = !!technicianId

  // Estados para los campos del formulario
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">("active")
  const [specializations, setSpecializations] = useState<string[]>([])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Alert message state
  const [alertVisible, setAlertVisible] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("info")
  const [alertMessage, setAlertMessage] = useState("")
  const [alertTitle, setAlertTitle] = useState("")

  // Error message state
  const [errorVisible, setErrorVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [errorTitle, setErrorTitle] = useState("")

  // Estados para validación
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    phone?: string
    password?: string
    confirmPassword?: string
  }>({})

  const [alertData, setAlertData] = useState({
    type: "info",
    title: "",
    message: "",
  })

  const [errorData, setErrorData] = useState({
    title: "",
    message: "",
  })

  // Añadir dentro del componente EditTechnicianScreen
  const { users, updateUser } = useAuth()

  // Cargar datos del técnico si estamos en modo edición
  useEffect(() => {
    if (isEditing && technicianId) {
      setIsLoading(true)

      // Buscar el técnico en la lista de usuarios
      const technician = users?.find((user) => user.id === technicianId)

      if (technician) {
        setName(technician.name || "")
        setEmail(technician.email || "")
        setPhone(technician.phone || "")
        setPhoto(technician.photo || null)
        setStatus((technician.status as "active" | "inactive" | "on_leave") || "active")
        setSpecializations(technician.specialization || [])

        setIsLoading(false)
      } else {
        // Si no se encuentra el técnico, mostrar un error
        showErrorAlert("Error", "No se pudo encontrar la información del técnico")
        setIsLoading(false)
        navigation.goBack()
      }
    }
  }, [isEditing, technicianId, users])

  // Función para seleccionar una imagen de la galería
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri)
    }
  }

  // Función para tomar una foto con la cámara
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()

    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Se necesita acceso a la cámara para tomar fotos.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto(result.assets[0].uri)
    }
  }

  // Función para alternar una especialización
  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec))
    } else {
      setSpecializations([...specializations, spec])
    }
  }

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido"
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
    }

    if (!isEditing) {
      if (!password) {
        newErrors.password = "La contraseña es obligatoria"
      } else if (password.length < 6) {
        newErrors.password = "La contraseña debe tener al menos 6 caracteres"
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Modificar la función handleSave para guardar los cambios reales
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor, corrija los errores en el formulario")
      return
    }

    setIsLoading(true)

    try {
      // Preparar los datos del técnico
      let photoUrl = photo

      // Si hay una nueva foto seleccionada y es una URI local, subirla a Cloudinary
      if (photo && photo.startsWith("file://")) {
        try {
          const base64 = await FileSystem.readAsStringAsync(photo, {
            encoding: FileSystem.EncodingType.Base64,
          })

          const formData = new FormData()
          formData.append("file", `data:image/jpeg;base64,${base64}`)
          formData.append("upload_preset", "teslalift-perfil")

          const response = await fetch("https://api.cloudinary.com/v1_1/your-cloud-name/image/upload", {
            method: "POST",
            body: formData,
          })

          const data = await response.json()
          photoUrl = data.secure_url
        } catch (error) {
          console.error("Error al subir la imagen:", error)
          setIsLoading(false)
          showErrorAlert("Error", "No se pudo subir la imagen. Inténtelo de nuevo.")
          return
        }
      }

      // Datos actualizados del técnico
      const updatedTechnician = {
        id: technicianId || Math.random().toString(36).substring(2, 9),
        name,
        email,
        phone,
        photo: photoUrl || undefined,
        status,
        role: "technician" as UserRole,
        specialization: specializations,
      }

      // Actualizar el usuario en el contexto
      await updateUser(updatedTechnician)

      setIsLoading(false)
      showSuccessAlert(
        "Éxito",
        isEditing ? `Técnico ${name} actualizado correctamente` : `Técnico ${name} creado correctamente`,
      )

      // Navegar de vuelta después de un breve retraso
      setTimeout(() => {
        navigation.goBack()
      }, 1500)
    } catch (error) {
      setIsLoading(false)
      showErrorAlert("Error", "Ocurrió un error al guardar los datos. Inténtelo de nuevo.")
    }
  }

  // Función para cambiar el estado del técnico
  const handleStatusChange = (newStatus: "active" | "inactive" | "on_leave") => {
    setStatus(newStatus)
  }

  // Función para mostrar alerta de éxito
  const showSuccessAlert = (title: string, message: string) => {
    setAlertData({
      type: "success",
      title,
      message,
    })
    setAlertVisible(true)
  }

  // Función para mostrar alerta de error
  const showErrorAlert = (title: string, message: string) => {
    setErrorData({
      title,
      message,
    })
    setErrorVisible(true)
  }

  // Obtener el color según el estado
  const getStatusColor = (statusValue: string) => {
    switch (statusValue) {
      case "active":
        return "#10b981"
      case "inactive":
        return "#ef4444"
      case "on_leave":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  // Obtener el texto según el estado
  const getStatusText = (statusValue: string) => {
    switch (statusValue) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "on_leave":
        return "De permiso"
      default:
        return statusValue
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <AppHeader
          title={isEditing ? "Editar Técnico" : "Crear Técnico"}
          subtitle={isEditing ? "Actualiza la información del técnico" : "Añade un nuevo técnico al sistema"}
          showBackButton={true}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Sección de foto de perfil */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="person" size={40} color="#d1d5db" />
                </View>
              )}
              <View style={styles.photoActions}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Ionicons name="image" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Sección de información personal */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>

            <TextInput
              label="Nombre completo"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
              error={!!errors.name}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.name && <HelperText type="error">{errors.name}</HelperText>}

            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              error={!!errors.email}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.email && <HelperText type="error">{errors.email}</HelperText>}

            <TextInput
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              error={!!errors.phone}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
          </View>

          {/* Sección de estado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado</Text>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === "active" && { backgroundColor: "#10b981" + "20", borderColor: "#10b981" },
                ]}
                onPress={() => handleStatusChange("active")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
                <Text style={[styles.statusText, status === "active" && { color: "#10b981" }]}>Activo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === "inactive" && { backgroundColor: "#ef4444" + "20", borderColor: "#ef4444" },
                ]}
                onPress={() => handleStatusChange("inactive")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.statusText, status === "inactive" && { color: "#ef4444" }]}>Inactivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.statusOption,
                  status === "on_leave" && { backgroundColor: "#f59e0b" + "20", borderColor: "#f59e0b" },
                ]}
                onPress={() => handleStatusChange("on_leave")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={[styles.statusText, status === "on_leave" && { color: "#f59e0b" }]}>De permiso</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección de especializaciones */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Especializaciones</Text>
            <Text style={styles.sectionSubtitle}>Selecciona las áreas de especialización del técnico</Text>

            <View style={styles.specializationsContainer}>
              {SPECIALIZATIONS.map((spec) => (
                <TouchableOpacity
                  key={spec}
                  style={[
                    styles.specializationChip,
                    specializations.includes(spec) && styles.specializationChipSelected,
                  ]}
                  onPress={() => toggleSpecialization(spec)}
                >
                  <Text
                    style={[
                      styles.specializationChipText,
                      specializations.includes(spec) && styles.specializationChipTextSelected,
                    ]}
                  >
                    {spec}
                  </Text>
                  {specializations.includes(spec) && (
                    <Ionicons name="checkmark" size={16} color="white" style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sección de credenciales (solo para creación) */}
          {!isEditing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credenciales de Acceso</Text>
              <Text style={styles.sectionSubtitle}>
                Estas credenciales serán utilizadas por el técnico para iniciar sesión
              </Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  label="Contraseña"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.password}
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#7c3aed"
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                />
                {errors.password && <HelperText type="error">{errors.password}</HelperText>}
              </View>

              <View style={styles.passwordContainer}>
                <TextInput
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.confirmPassword}
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#7c3aed"
                />
                {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
              </View>
            </View>
          )}

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.cancelButton} textColor="#6b7280">
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              loading={isLoading}
              disabled={isLoading}
            >
              {isEditing ? "Actualizar" : "Crear"}
            </Button>
          </View>
        </ScrollView>
        <AlertMessage
          visible={alertVisible}
          title={alertData.title}
          message={alertData.message}
          onClose={() => setAlertVisible(false)}
        />
        <ErrorMessage
          visible={errorVisible}
          title={errorData.title}
          message={errorData.message}
          onClose={() => setErrorVisible(false)}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  photoSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  photoContainer: {
    position: "relative",
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#7c3aed",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#e5e7eb",
  },
  photoActions: {
    position: "absolute",
    bottom: 0,
    right: 0,
    flexDirection: "row",
  },
  photoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: "white",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  statusOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: "#6b7280",
  },
  specializationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  specializationChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  specializationChipSelected: {
    backgroundColor: "#7c3aed",
  },
  specializationChipText: {
    fontSize: 14,
    color: "#4b5563",
  },
  specializationChipTextSelected: {
    color: "white",
  },
  checkIcon: {
    marginLeft: 4,
  },
  passwordContainer: {
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#d1d5db",
  },
  saveButton: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#7c3aed",
  },
})
