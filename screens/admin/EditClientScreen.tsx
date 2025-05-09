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

// Modificar la interfaz RouteParams
interface RouteParams {
  clientId?: string
}

export default function EditClientScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute()
  const { clientId } = (route.params as RouteParams) || {}
  const isEditing = !!clientId

  // Añadir dentro del componente EditClientScreen
  const { users, updateUser } = useAuth()

  // Estados para los campos del formulario
  const [name, setName] = useState("")
  const [ruc, setRuc] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "pending">("active")
  const [contractType, setContractType] = useState<"monthly" | "annual" | "project">("monthly")
  const [buildings, setBuildings] = useState("1")
  const [lifts, setLifts] = useState("1")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Añadir estados para los nuevos campos
  const [buildingName, setBuildingName] = useState("")
  const [elevatorBrand, setElevatorBrand] = useState("")

  // Estados para los datos financieros (Fase 5.1)
  const [duracionContratoMeses, setDuracionContratoMeses] = useState("")
  const [totalCuentaCliente, setTotalCuentaCliente] = useState("")

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
    totalCuentaCliente?: string
    duracionContratoMeses?: string
  }>({})

  const [alertData, setAlertData] = useState({ type: "success", title: "", message: "" })
  const [errorData, setErrorData] = useState({ title: "", message: "" })

  // Estado para el estado de pago
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "debt">("paid")

  // Modificar el useEffect para cargar el estado de pago
  useEffect(() => {
    if (isEditing && clientId) {
      setIsLoading(true)

      // Buscar el cliente en la lista de usuarios
      const client = users?.find((user) => user.id === clientId)

      if (client) {
        setName(client.name || "")
        setRuc(client.ruc || "")
        setEmail(client.email || "")
        setPhone(client.phone || "")
        setPhoto(client.photo || null)
        setAddress(client.address || "")
        setStatus((client.status as "active" | "inactive" | "pending") || "active")
        setBuildings((client.elevatorCount || 1).toString())
        setLifts((client.floorCount || 1).toString())
        setBuildingName(client.buildingName || "")
        setElevatorBrand(client.elevatorBrand || "")

        // Cargar datos financieros
        setDuracionContratoMeses(client.duracionContratoMeses ? client.duracionContratoMeses.toString() : "")
        setTotalCuentaCliente(client.totalCuentaCliente ? client.totalCuentaCliente.toString() : "")

        // Cargar el estado de pago
        setPaymentStatus(client.paymentStatus || "paid")

        setIsLoading(false)
      } else {
        // Si no se encuentra el cliente, mostrar un error
        showErrorAlert("Error", "No se pudo encontrar la información del cliente")
        setIsLoading(false)
        navigation.goBack()
      }
    }
  }, [isEditing, clientId, users])

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

    if (!buildings || Number.parseInt(buildings) < 1) {
      newErrors.buildings = "Debe tener al menos 1 edificio"
    }

    if (!lifts || Number.parseInt(lifts) < 1) {
      newErrors.lifts = "Debe tener al menos 1 ascensor"
    }

    // Validación de campos financieros (Fase 5.1)
    if (!totalCuentaCliente.trim()) {
      newErrors.totalCuentaCliente = "El valor total de la cuenta es obligatorio"
    } else if (isNaN(Number(totalCuentaCliente)) || Number(totalCuentaCliente) < 0) {
      newErrors.totalCuentaCliente = "El valor debe ser un número positivo"
    }

    if (duracionContratoMeses.trim() && (isNaN(Number(duracionContratoMeses)) || Number(duracionContratoMeses) <= 0)) {
      newErrors.duracionContratoMeses = "La duración debe ser un número positivo"
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

  // Modificar la función handleSave para incluir el estado de pago
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor, corrija los errores en el formulario")
      return
    }

    setIsLoading(true)

    try {
      // Preparar los datos del cliente
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

      // Datos actualizados del cliente
      const updatedClient = {
        id: clientId || Math.random().toString(36).substring(2, 9),
        name,
        ruc,
        email,
        phone,
        photo: photoUrl || undefined,
        address,
        status,
        role: "client" as UserRole,
        buildingName,
        elevatorBrand,
        elevatorCount: Number.parseInt(buildings, 10),
        floorCount: Number.parseInt(lifts, 10),
        // Datos financieros actualizados
        duracionContratoMeses: duracionContratoMeses ? Number.parseInt(duracionContratoMeses, 10) : undefined,
        totalCuentaCliente: totalCuentaCliente ? Number.parseFloat(totalCuentaCliente) : undefined,
        paymentStatus: paymentStatus, // Añadir el estado de pago
      }

      // Actualizar el usuario en el contexto
      await updateUser(updatedClient)

      setIsLoading(false)
      showSuccessAlert(
        "Éxito",
        isEditing ? `Cliente ${name} actualizado correctamente` : `Cliente ${name} creado correctamente`,
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

            {/* Añadir campos para el nombre del edificio y marca del ascensor en el formulario */}
            {/* Dentro de la sección "Información del Cliente" */}
            <TextInput
              label="Nombre del edificio o empresa"
              value={buildingName}
              onChangeText={setBuildingName}
              mode="outlined"
              style={styles.input}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />

            <TextInput
              label="Marca del ascensor"
              value={elevatorBrand}
              onChangeText={setElevatorBrand}
              mode="outlined"
              style={styles.input}
              outlineColor="#e5e7eb"
              activeOutlineColor="#7c3aed"
            />
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

          {/* Sección de información financiera (Fase 5.1) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Financiera</Text>

            <View style={styles.formGroup}>
              <TextInput
                label="Valor total del contrato ($)"
                value={totalCuentaCliente}
                onChangeText={(text) => {
                  setTotalCuentaCliente(text.replace(/[^0-9.]/g, ""))
                  if (errors.totalCuentaCliente) setErrors({ ...errors, totalCuentaCliente: "" })
                }}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.totalCuentaCliente}
                outlineColor="#e5e7eb"
                activeOutlineColor="#7c3aed"
                left={<TextInput.Icon icon="cash" />}
              />
              {errors.totalCuentaCliente && <HelperText type="error">{errors.totalCuentaCliente}</HelperText>}
            </View>

            <View style={styles.formGroup}>
              <TextInput
                label="Duración del contrato (meses)"
                value={duracionContratoMeses}
                onChangeText={(text) => {
                  setDuracionContratoMeses(text.replace(/[^0-9]/g, ""))
                  if (errors.duracionContratoMeses) setErrors({ ...errors, duracionContratoMeses: "" })
                }}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.duracionContratoMeses}
                outlineColor="#e5e7eb"
                activeOutlineColor="#7c3aed"
                left={<TextInput.Icon icon="calendar-range" />}
              />
              {errors.duracionContratoMeses && <HelperText type="error">{errors.duracionContratoMeses}</HelperText>}
            </View>
          </View>

          {/* Sección de estado de pago */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estado de Pago</Text>
            <Text style={styles.sectionSubtitle}>Indique si el cliente ha realizado el pago mensual</Text>

            <View style={styles.paymentStatusContainer}>
              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === "paid" && { backgroundColor: "#10b981" + "20", borderColor: "#10b981" },
                ]}
                onPress={() => setPaymentStatus("paid")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
                <Text style={[styles.statusText, paymentStatus === "paid" && { color: "#10b981" }]}>
                  Pago Realizado
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentStatusOption,
                  paymentStatus === "debt" && { backgroundColor: "#ef4444" + "20", borderColor: "#ef4444" },
                ]}
                onPress={() => setPaymentStatus("debt")}
              >
                <View style={[styles.statusDot, { backgroundColor: "#ef4444" }]} />
                <Text style={[styles.statusText, paymentStatus === "debt" && { color: "#ef4444" }]}>En Deuda</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: "center",
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
  paymentStatusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  paymentStatusOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 4,
  },
})
