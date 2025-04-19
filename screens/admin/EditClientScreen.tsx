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
import { TextInput, Button, HelperText, SegmentedButtons } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import AppHeader from "../../components/AppHeader"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

interface RouteParams {
  clientId?: string
}

export default function EditClientScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { clientId } = (route.params as RouteParams) || {}
  const isEditing = !!clientId

  // Estados para los campos del formulario
  const [name, setName] = useState("")
  const [ruc, setRuc] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "pending">("active")
  const [contractType, setContractType] = useState<"monthly" | "annual" | "project">("monthly")
  const [buildings, setBuildings] = useState("1")
  const [lifts, setLifts] = useState("1")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

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
  const [isLoading, setIsLoading] = useState(false)

  // Estados para validación
  const [errors, setErrors] = useState<{
    name?: string
    ruc?: string
    email?: string
    phone?: string
    address?: string
    contactPerson?: string
    buildings?: string
    lifts?: string
    password?: string
    confirmPassword?: string
  }>({})

  const [alertData, setAlertData] = useState({ type: "success", title: "", message: "" })
  const [errorData, setErrorData] = useState({ title: "", message: "" })

  // Cargar datos del cliente si estamos en modo edición
  useEffect(() => {
    if (isEditing) {
      // En una aplicación real, esto cargaría los datos del cliente desde una API
      // Aquí simulamos la carga con datos de ejemplo
      setIsLoading(true)
      setTimeout(() => {
        // Datos de ejemplo para simular la carga
        const mockClient = {
          id: clientId,
          name: "Torre Empresarial Lima",
          ruc: "20123456789",
          email: "admin@torreempresarial.com",
          phone: "+51 1 234 5678",
          photo: "https://i.pravatar.cc/150?u=a042581f4e29026704c",
          address: "Av. La Encalada 1234, Surco, Lima",
          contactPerson: "Juan Pérez",
          status: "active" as "active" | "inactive" | "pending",
          contractType: "annual" as "monthly" | "annual" | "project",
          buildings: 1,
          lifts: 4,
        }

        setName(mockClient.name)
        setRuc(mockClient.ruc)
        setEmail(mockClient.email)
        setPhone(mockClient.phone)
        setPhoto(mockClient.photo)
        setAddress(mockClient.address)
        setContactPerson(mockClient.contactPerson)
        setStatus(mockClient.status)
        setContractType(mockClient.contractType)
        setBuildings(mockClient.buildings.toString())
        setLifts(mockClient.lifts.toString())
        setIsLoading(false)
      }, 1000)
    }
  }, [isEditing, clientId])

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

  // Función para validar el formulario
  const validateForm = () => {
    const newErrors: typeof errors = {}

    if (!name.trim()) {
      newErrors.name = "El nombre es obligatorio"
    }

    if (!ruc.trim()) {
      newErrors.ruc = "El RUC es obligatorio"
    } else if (!/^\d{11}$/.test(ruc)) {
      newErrors.ruc = "El RUC debe tener 11 dígitos numéricos"
    }

    if (!email.trim()) {
      newErrors.email = "El correo electrónico es obligatorio"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido"
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es obligatorio"
    }

    if (!address.trim()) {
      newErrors.address = "La dirección es obligatoria"
    }

    if (!contactPerson.trim()) {
      newErrors.contactPerson = "La persona de contacto es obligatoria"
    }

    if (!buildings || Number.parseInt(buildings) < 1) {
      newErrors.buildings = "Debe tener al menos 1 edificio"
    }

    if (!lifts || Number.parseInt(lifts) < 1) {
      newErrors.lifts = "Debe tener al menos 1 ascensor"
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

  // Función para guardar el cliente
  const handleSave = () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor, corrija los errores en el formulario")
      return
    }

    setIsLoading(true)

    // Simulamos una llamada a la API
    setTimeout(() => {
      setIsLoading(false)

      // Datos que se enviarían a la API
      const clientData = {
        id: isEditing ? clientId : Math.random().toString(36).substring(2, 9),
        name,
        ruc,
        email,
        phone,
        photo,
        address,
        contactPerson,
        status,
        contractType,
        buildings: Number.parseInt(buildings),
        lifts: Number.parseInt(lifts),
        password: isEditing ? undefined : password,
      }

      console.log("Datos del cliente a guardar:", clientData)

      Alert.alert(
        "Éxito",
        isEditing ? `Cliente ${name} actualizado correctamente` : `Cliente ${name} creado correctamente`,
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ],
      )
    }, 1500)
  }

  // Función para cambiar el estado del cliente
  const handleStatusChange = (newStatus: "active" | "inactive" | "pending") => {
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <AppHeader
          title={isEditing ? "Editar Cliente" : "Crear Cliente"}
          subtitle={isEditing ? "Actualiza la información del cliente" : "Añade un nuevo cliente al sistema"}
          showBackButton={true}
        />

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Sección de logo/foto */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photo} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="business" size={40} color="#d1d5db" />
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

          {/* Sección de información del cliente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información del Cliente</Text>

            <TextInput
              label="Nombre de la empresa"
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
              label="RUC"
              value={ruc}
              onChangeText={(text) => setRuc(text.replace(/[^0-9]/g, ""))}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              maxLength={11}
              error={!!errors.ruc}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.ruc && <HelperText type="error">{errors.ruc}</HelperText>}

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

            <TextInput
              label="Dirección"
              value={address}
              onChangeText={setAddress}
              mode="outlined"
              style={styles.input}
              error={!!errors.address}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.address && <HelperText type="error">{errors.address}</HelperText>}

            <TextInput
              label="Persona de contacto"
              value={contactPerson}
              onChangeText={setContactPerson}
              mode="outlined"
              style={styles.input}
              error={!!errors.contactPerson}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
            {errors.contactPerson && <HelperText type="error">{errors.contactPerson}</HelperText>}
          </View>

          {/* Sección de detalles del edificio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detalles del Edificio</Text>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <TextInput
                  label="Número de Edificios"
                  value={buildings}
                  onChangeText={(text) => {
                    setBuildings(text.replace(/[^0-9]/g, ""))
                    if (errors.buildings) setErrors({ ...errors, buildings: "" })
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.buildings}
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#7c3aed"
                />
                {errors.buildings && <HelperText type="error">{errors.buildings}</HelperText>}
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <TextInput
                  label="Número de Ascensores"
                  value={lifts}
                  onChangeText={(text) => {
                    setLifts(text.replace(/[^0-9]/g, ""))
                    if (errors.lifts) setErrors({ ...errors, lifts: "" })
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="numeric"
                  error={!!errors.lifts}
                  outlineColor="#e5e7eb"
                  activeOutlineColor="#7c3aed"
                />
                {errors.lifts && <HelperText type="error">{errors.lifts}</HelperText>}
              </View>
            </View>
          </View>

          {/* Sección de tipo de contrato */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipo de Contrato</Text>
            <SegmentedButtons
              value={contractType}
              onValueChange={(value) => setContractType(value as "monthly" | "annual" | "project")}
              buttons={[
                {
                  value: "monthly",
                  label: "Mensual",
                  style: contractType === "monthly" ? styles.selectedSegment : {},
                },
                {
                  value: "annual",
                  label: "Anual",
                  style: contractType === "annual" ? styles.selectedSegment : {},
                },
                {
                  value: "project",
                  label: "Proyecto",
                  style: contractType === "project" ? styles.selectedSegment : {},
                },
              ]}
              style={styles.segmentedButtons}
            />
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
                  status === "pending" && { backgroundColor: "#f59e0b" + "20", borderColor: "#f59e0b" },
                ]}
                onPress={() => handleStatusChange("pending")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#f59e0b" }]} />
                <Text style={[styles.statusText, status === "pending" && { color: "#f59e0b" }]}>Pendiente</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sección de credenciales (solo para creación) */}
          {!isEditing && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Credenciales de Acceso</Text>
              <Text style={styles.sectionSubtitle}>
                Estas credenciales serán utilizadas por el cliente para iniciar sesión
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
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  formGroup: {
    flex: 1,
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
  segmentedButtons: {
    marginTop: 8,
  },
  selectedSegment: {
    backgroundColor: "#7c3aed",
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
