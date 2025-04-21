"use client"

import React from "react"

import { useState, useRef } from "react"
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
import { TextInput, Button, RadioButton, HelperText, IconButton } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../../context/AuthContext"
import AppHeader from "../../components/AppHeader"
import * as ImagePicker from "expo-image-picker"
import type { RouteProp } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import Animated, { FadeInDown } from "react-native-reanimated"


// Cloudinary configuration
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/teslalift/upload"
const UPLOAD_PRESET = "teslalift-perfil"

// Define el tipo para las props de la pantalla
type Props = {
  navigation: NativeStackNavigationProp<any, any>
  route: RouteProp<any, any>
}

// Define los tipos de usuario
type UserType = "client" | "technician"

// Define los pasos del formulario
type FormStep = "type" | "personal" | "details" | "credentials" | "review"

// Define los colores principales
const COLORS = {
  primary: "#0284c7",
  primaryLight: "#e0f2fe",
  secondary: "#7c3aed",
  secondaryLight: "#ede9fe",
  success: "#10b981",
  successLight: "#d1fae5",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayDark: "#374151",
  background: "#f9fafb",
}

export default function CreateUserScreen({ navigation, route }: Props) {
  // Estado para el paso actual del formulario
  const [currentStep, setCurrentStep] = useState<FormStep>("type")
  const [userType, setUserType] = useState<UserType>("client")

  // Estados para los datos personales
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  // Estados para los datos de cliente
  const [ruc, setRuc] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [address, setAddress] = useState("")
  const [elevatorBrand, setElevatorBrand] = useState("")
  const [elevatorCount, setElevatorCount] = useState("")
  const [floorCount, setFloorCount] = useState("")

  // Estados para los datos de técnico
  const [specialization, setSpecialization] = useState<string[]>([])
  const [status, setStatus] = useState<"active" | "inactive" | "on_leave">("active")

  // Estados para las credenciales
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)

  // Estados para la foto de perfil
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  // Referencia al ScrollView para manejar el scroll automático
  const scrollViewRef = useRef<ScrollView>(null)

  const { register } = useAuth()

  // Opciones de especialización para técnicos
  const specializationOptions = [
    "Mantenimiento",
    "Reparación",
    "Instalación",
    "Emergencias",
    "Inspección",
    "Modernización",
    "Certificación",
  ]

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Función para validar el paso actual
  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === "personal") {
      if (!profileImage) {
        newErrors.profileImage = "La foto de perfil es obligatoria"
      }
      
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
    }

    if (currentStep === "details" && userType === "client") {
      if (!ruc.trim()) {
        newErrors.ruc = "El RUC es obligatorio"
      } else if (!/^\d{6,13}$/.test(ruc)) {
        newErrors.ruc = "El RUC debe tener entre 6 y 13 dígitos numéricos"
      }

      if (!companyName.trim()) {
        newErrors.companyName = "El nombre de la empresa es obligatorio"
      }

      if (!address.trim()) {
        newErrors.address = "La dirección es obligatoria"
      }
    }

    if (currentStep === "credentials") {
      if (!password.trim()) {
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

  // Función para avanzar al siguiente paso
  const goToNextStep = () => {
    if (!validateCurrentStep()) {
      return
    }

    switch (currentStep) {
      case "type":
        setCurrentStep("personal")
        break
      case "personal":
        setCurrentStep("details")
        break
      case "details":
        setCurrentStep("credentials")
        break
      case "credentials":
        setCurrentStep("review")
        break
    }

    // Scroll al inicio cuando cambia el paso
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }, 100)
  }

  // Función para retroceder al paso anterior
  const goToPreviousStep = () => {
    switch (currentStep) {
      case "personal":
        setCurrentStep("type")
        break
      case "details":
        setCurrentStep("personal")
        break
      case "credentials":
        setCurrentStep("details")
        break
      case "review":
        setCurrentStep("credentials")
        break
    }

    // Scroll al inicio cuando cambia el paso
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }, 100)
  }

  // Función para alternar una especialización
  const toggleSpecialization = (spec: string) => {
    if (specialization.includes(spec)) {
      setSpecialization(specialization.filter((s) => s !== spec))
    } else {
      setSpecialization([...specialization, spec])
    }
  }

  // Función para seleccionar una imagen de la galería
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al seleccionar imagen:", error)
      Alert.alert("Error", "No se pudo seleccionar la imagen. Inténtelo de nuevo.")
    }
  }

  // Función para tomar una foto con la cámara
  const takePhoto = async () => {
    try {
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
        setProfileImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error("Error al tomar foto:", error)
      Alert.alert("Error", "No se pudo tomar la foto. Inténtelo de nuevo.")
    }
  }

  // Función para subir la imagen a Cloudinary
  const uploadImageToCloudinary = async (imageUri: string): Promise<string | null> => {
    try {
      setIsUploading(true)

      // Crear el FormData para la subida
      const formData = new FormData()
      formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile_image.jpg",
      } as any)
      formData.append("upload_preset", UPLOAD_PRESET)

      // Realizar la petición a Cloudinary
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (data.secure_url) {
        return data.secure_url
      } else {
        throw new Error("No se pudo obtener la URL de la imagen")
      }
    } catch (error) {
      console.error("Error al subir imagen a Cloudinary:", error)
      Alert.alert("Error", "No se pudo subir la imagen. Inténtelo de nuevo.")
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Función para registrar al usuario
  const handleRegister = async () => {
    try {
      setIsLoading(true)

      let profileImageUrl: string | null = null

      // Subir imagen a Cloudinary si existe
      if (profileImage) {
        profileImageUrl = await uploadImageToCloudinary(profileImage)
        if (!profileImageUrl) {
          setIsLoading(false)
          return
        }
      }

      // Crear objeto con datos del usuario
      const userData = {
        name,
        email,
        phone,
        // Datos específicos de cliente
        ...(userType === "client" && {
          ruc,
          companyName,
          address,
          elevatorBrand: elevatorBrand || undefined,
          elevatorCount: elevatorCount ? Number.parseInt(elevatorCount) : undefined,
          floorCount: floorCount ? Number.parseInt(floorCount) : undefined,
        }),
        // Datos específicos de técnico
        ...(userType === "technician" && {
          specialization,
          status,
        }),
        password,
        profileImage: profileImageUrl || undefined,
      }

      // Registrar usuario
      const success = await register(userData, userType)

      if (success) {
        Alert.alert("Éxito", "Usuario creado correctamente", [{ text: "OK", onPress: () => navigation.goBack() }])
      } else {
        Alert.alert("Error", "No se pudo completar el registro")
      }
    } catch (error) {
      console.error("Error en el registro:", error)
      Alert.alert("Error", "Ha ocurrido un error. Intente nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  // Renderizar el indicador de progreso
  const renderProgressIndicator = () => {
    const steps = ["type", "personal", "details", "credentials", "review"]
    const currentIndex = steps.indexOf(currentStep)

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View style={[styles.progressStep, index <= currentIndex ? styles.progressStepActive : {}]}>
              <Text style={[styles.progressStepText, index <= currentIndex ? styles.progressStepTextActive : {}]}>
                {index + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={[styles.progressLine, index < currentIndex ? styles.progressLineActive : {}]} />
            )}
          </React.Fragment>
        ))}
      </View>
    )
  }

  // Renderizar el paso de selección de tipo de usuario
  const renderTypeStep = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Tipo de Usuario</Text>
        <Text style={styles.stepDescription}>Seleccione el tipo de usuario que desea crear</Text>

        <TouchableOpacity
          style={[styles.typeCard, userType === "client" ? styles.typeCardSelected : {}]}
          onPress={() => setUserType("client")}
        >
          <View
            style={[styles.typeIconContainer, userType === "client" ? { backgroundColor: COLORS.primaryLight } : {}]}
          >
            <Ionicons name="business-outline" size={32} color={userType === "client" ? COLORS.primary : COLORS.gray} />
          </View>
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === "client" ? { color: COLORS.primary } : {}]}>Cliente</Text>
            <Text style={styles.typeDescription}>Empresas o edificios que requieren servicios de mantenimiento</Text>
          </View>
          <RadioButton
            value="client"
            status={userType === "client" ? "checked" : "unchecked"}
            onPress={() => setUserType("client")}
            color={COLORS.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeCard, userType === "technician" ? styles.typeCardSelected : {}]}
          onPress={() => setUserType("technician")}
        >
          <View
            style={[
              styles.typeIconContainer,
              userType === "technician" ? { backgroundColor: COLORS.secondaryLight } : {},
            ]}
          >
            <Ionicons
              name="construct-outline"
              size={32}
              color={userType === "technician" ? COLORS.secondary : COLORS.gray}
            />
          </View>
          <View style={styles.typeTextContainer}>
            <Text style={[styles.typeTitle, userType === "technician" ? { color: COLORS.secondary } : {}]}>
              Técnico
            </Text>
            <Text style={styles.typeDescription}>Personal técnico que realiza mantenimiento e instalaciones</Text>
          </View>
          <RadioButton
            value="technician"
            status={userType === "technician" ? "checked" : "unchecked"}
            onPress={() => setUserType("technician")}
            color={COLORS.secondary}
          />
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Renderizar el paso de información personal
  const renderPersonalInfoStep = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Información Personal</Text>
        <Text style={styles.stepDescription}>
          Ingrese los datos personales del {userType === "client" ? "cliente" : "técnico"}
        </Text>

        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name={userType === "client" ? "business" : "person"} size={40} color="#d1d5db" />
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
          <Text style={styles.photoHint}>Foto de perfil (Obligatoria)</Text>
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Nombre completo"
            value={name}
            onChangeText={(text) => {
              setName(text)
              if (errors.name) {
                setErrors({ ...errors, name: "" })
              }
            }}
            mode="outlined"
            style={styles.input}
            error={!!errors.name}
            outlineColor="#e5e7eb"
            activeOutlineColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            left={<TextInput.Icon icon="account" />}
          />
          {errors.name && <HelperText type="error">{errors.name}</HelperText>}
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Correo electrónico"
            value={email}
            onChangeText={(text) => {
              setEmail(text)
              if (errors.email) {
                setErrors({ ...errors, email: "" })
              }
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            error={!!errors.email}
            outlineColor="#e5e7eb"
            activeOutlineColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            left={<TextInput.Icon icon="email" />}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Teléfono"
            value={phone}
            onChangeText={(text) => {
              setPhone(text)
              if (errors.phone) {
                setErrors({ ...errors, phone: "" })
              }
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            error={!!errors.phone}
            outlineColor="#e5e7eb"
            activeOutlineColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            left={<TextInput.Icon icon="phone" />}
          />
          {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
        </View>
      </Animated.View>
    )
  }

  // Renderizar el paso de detalles específicos
  const renderDetailsStep = () => {
    if (userType === "client") {
      return (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Detalles del Cliente</Text>
          <Text style={styles.stepDescription}>Ingrese la información específica de la empresa o edificio</Text>

          <View style={styles.formGroup}>
            <TextInput
              label="RUC"
              value={ruc}
              onChangeText={(text) => {
                setRuc(text.replace(/[^0-9]/g, ""))
                if (errors.ruc) {
                  setErrors({ ...errors, ruc: "" })
                }
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
              maxLength={13}
              error={!!errors.ruc}
              outlineColor="#e5e7eb"
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="card-account-details" />}
            />
            {errors.ruc && <HelperText type="error">{errors.ruc}</HelperText>}
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Nombre de la empresa o edificio"
              value={companyName}
              onChangeText={(text) => {
                setCompanyName(text)
                if (errors.companyName) {
                  setErrors({ ...errors, companyName: "" })
                }
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.companyName}
              outlineColor="#e5e7eb"
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="domain" />}
            />
            {errors.companyName && <HelperText type="error">{errors.companyName}</HelperText>}
          </View>

          <View style={styles.formGroup}>
            <TextInput
              label="Dirección"
              value={address}
              onChangeText={(text) => {
                setAddress(text)
                if (errors.address) {
                  setErrors({ ...errors, address: "" })
                }
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.address}
              outlineColor="#e5e7eb"
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="map-marker" />}
            />
            {errors.address && <HelperText type="error">{errors.address}</HelperText>}
          </View>

          <Text style={styles.sectionTitle}>Información de Ascensores (Opcional)</Text>

          <View style={styles.formGroup}>
            <TextInput
              label="Marca del ascensor"
              value={elevatorBrand}
              onChangeText={setElevatorBrand}
              mode="outlined"
              style={styles.input}
              outlineColor="#e5e7eb"
              activeOutlineColor={COLORS.primary}
              left={<TextInput.Icon icon="elevator" />}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <TextInput
                label="Ascensores"
                value={elevatorCount}
                onChangeText={(text) => setElevatorCount(text.replace(/[^0-9]/g, ""))}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                outlineColor="#e5e7eb"
                activeOutlineColor={COLORS.primary}
                left={<TextInput.Icon icon="elevator-passenger" />}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <TextInput
                label="Paradas"
                value={floorCount}
                onChangeText={(text) => setFloorCount(text.replace(/[^0-9]/g, ""))}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
                outlineColor="#e5e7eb"
                activeOutlineColor={COLORS.primary}
                left={<TextInput.Icon icon="floor-plan" />}
              />
            </View>
          </View>
        </Animated.View>
      )
    } else {
      return (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Detalles del Técnico</Text>
          <Text style={styles.stepDescription}>Seleccione las especializaciones y el estado del técnico</Text>

          <Text style={styles.sectionTitle}>Especializaciones</Text>
          <Text style={styles.sectionSubtitle}>Seleccione las áreas de especialización del técnico</Text>

          <View style={styles.specializationsContainer}>
            {specializationOptions.map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[styles.specializationChip, specialization.includes(spec) && styles.specializationChipSelected]}
                onPress={() => toggleSpecialization(spec)}
              >
                <Text
                  style={[
                    styles.specializationChipText,
                    specialization.includes(spec) && styles.specializationChipTextSelected,
                  ]}
                >
                  {spec}
                </Text>
                {specialization.includes(spec) && (
                  <Ionicons name="checkmark" size={16} color="white" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusOption,
                status === "active" && { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
              ]}
              onPress={() => setStatus("active")}
            >
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.statusText, status === "active" && { color: COLORS.success }]}>Activo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                status === "inactive" && { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
              ]}
              onPress={() => setStatus("inactive")}
            >
              <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
              <Text style={[styles.statusText, status === "inactive" && { color: COLORS.danger }]}>Inactivo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusOption,
                status === "on_leave" && { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
              ]}
              onPress={() => setStatus("on_leave")}
            >
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
              <Text style={[styles.statusText, status === "on_leave" && { color: COLORS.warning }]}>De permiso</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )
    }
  }

  // Renderizar el paso de credenciales
  const renderCredentialsStep = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Credenciales de Acceso</Text>
        <Text style={styles.stepDescription}>Establezca la contraseña para el acceso del usuario</Text>

        <View style={styles.formGroup}>
          <TextInput
            label="Contraseña"
            value={password}
            onChangeText={(text) => {
              setPassword(text)
              if (errors.password) {
                setErrors({ ...errors, password: "" })
              }
            }}
            secureTextEntry={!passwordVisible}
            mode="outlined"
            style={styles.input}
            error={!!errors.password}
            outlineColor="#e5e7eb"
            activeOutlineColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />
          {errors.password && <HelperText type="error">{errors.password}</HelperText>}
        </View>

        <View style={styles.formGroup}>
          <TextInput
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text)
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: "" })
              }
            }}
            secureTextEntry={!passwordVisible}
            mode="outlined"
            style={styles.input}
            error={!!errors.confirmPassword}
            outlineColor="#e5e7eb"
            activeOutlineColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            left={<TextInput.Icon icon="lock-check" />}
          />
          {errors.confirmPassword && <HelperText type="error">{errors.confirmPassword}</HelperText>}
        </View>

        <View style={styles.passwordRequirements}>
          <Text style={styles.passwordRequirementsTitle}>Requisitos de contraseña:</Text>
          <View style={styles.passwordRequirementItem}>
            <Ionicons
              name={password.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={password.length >= 6 ? COLORS.success : COLORS.gray}
            />
            <Text style={styles.passwordRequirementText}>Al menos 6 caracteres</Text>
          </View>
          <View style={styles.passwordRequirementItem}>
            <Ionicons
              name={password === confirmPassword ? "checkmark-circle" : "ellipse-outline"}
              size={16}
              color={password === confirmPassword ? COLORS.success : COLORS.gray}
            />
            <Text style={styles.passwordRequirementText}>Las contraseñas coinciden</Text>
          </View>
        </View>
      </Animated.View>
    )
  }

  // Renderizar el paso de revisión
  const renderReviewStep = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Revisar Información</Text>
        <Text style={styles.stepDescription}>
          Verifique que toda la información sea correcta antes de crear el usuario
        </Text>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewSectionTitle}>Tipo de Usuario</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Tipo:</Text>
            <Text style={styles.reviewValue}>{userType === "client" ? "Cliente" : "Técnico"}</Text>
          </View>
        </View>

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewSectionTitle}>Información Personal</Text>
            <IconButton icon="pencil" size={20} onPress={() => setCurrentStep("personal")} iconColor={COLORS.primary} />
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Nombre:</Text>
            <Text style={styles.reviewValue}>{name}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Email:</Text>
            <Text style={styles.reviewValue}>{email}</Text>
          </View>
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Teléfono:</Text>
            <Text style={styles.reviewValue}>{phone}</Text>
          </View>
          {profileImage && (
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Foto:</Text>
              <Image source={{ uri: profileImage }} style={styles.reviewImage} />
            </View>
          )}
        </View>

        {userType === "client" ? (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewSectionTitle}>Detalles del Cliente</Text>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setCurrentStep("details")}
                iconColor={COLORS.primary}
              />
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>RUC:</Text>
              <Text style={styles.reviewValue}>{ruc}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Empresa:</Text>
              <Text style={styles.reviewValue}>{companyName}</Text>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Dirección:</Text>
              <Text style={styles.reviewValue}>{address}</Text>
            </View>
            {elevatorBrand && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Marca de ascensor:</Text>
                <Text style={styles.reviewValue}>{elevatorBrand}</Text>
              </View>
            )}
            {elevatorCount && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Número de ascensores:</Text>
                <Text style={styles.reviewValue}>{elevatorCount}</Text>
              </View>
            )}
            {floorCount && (
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Número de paradas:</Text>
                <Text style={styles.reviewValue}>{floorCount}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewSectionTitle}>Detalles del Técnico</Text>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => setCurrentStep("details")}
                iconColor={COLORS.secondary}
              />
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Estado:</Text>
              <View
                style={[
                  styles.statusBadge,
                  status === "active"
                    ? styles.statusBadgeActive
                    : status === "inactive"
                      ? styles.statusBadgeInactive
                      : styles.statusBadgeOnLeave,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {status === "active" ? "Activo" : status === "inactive" ? "Inactivo" : "De permiso"}
                </Text>
              </View>
            </View>
            <View style={styles.reviewItem}>
              <Text style={styles.reviewLabel}>Especializaciones:</Text>
              <View style={styles.reviewSpecializations}>
                {specialization.length > 0 ? (
                  specialization.map((spec) => (
                    <View key={spec} style={styles.reviewSpecializationChip}>
                      <Text style={styles.reviewSpecializationText}>{spec}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.reviewValue}>Ninguna seleccionada</Text>
                )}
              </View>
            </View>
          </View>
        )}
      </Animated.View>
    )
  }

  // Renderizar los botones de navegación
  const renderNavigationButtons = () => {
    return (
      <View style={styles.navigationButtons}>
        {currentStep !== "type" && (
          <Button
            mode="outlined"
            onPress={goToPreviousStep}
            style={[styles.navigationButton, styles.backButton]}
            icon="arrow-left"
            contentStyle={{ flexDirection: "row-reverse" }}
          >
            Atrás
          </Button>
        )}

        {currentStep !== "review" ? (
          <Button
            mode="contained"
            onPress={goToNextStep}
            style={[styles.navigationButton, styles.nextButton, currentStep === "type" ? styles.fullWidthButton : {}]}
            buttonColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            icon="arrow-right"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleRegister}
            style={[styles.navigationButton, styles.nextButton]}
            buttonColor={userType === "client" ? COLORS.primary : COLORS.secondary}
            icon="check"
            loading={isLoading}
            disabled={isLoading}
          >
            Crear Usuario
          </Button>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.container}>
        <AppHeader
          title="Crear Usuario"
          subtitle={`Nuevo ${userType === "client" ? "cliente" : "técnico"}`}
          showBackButton={true}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {renderProgressIndicator()}

          {currentStep === "type" && renderTypeStep()}
          {currentStep === "personal" && renderPersonalInfoStep()}
          {currentStep === "details" && renderDetailsStep()}
          {currentStep === "credentials" && renderCredentialsStep()}
          {currentStep === "review" && renderReviewStep()}
        </ScrollView>

        {renderNavigationButtons()}
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
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  progressStepActive: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b7280",
  },
  progressStepTextActive: {
    color: "white",
  },
  progressLine: {
    height: 2,
    width: 30,
    backgroundColor: "#e5e7eb",
  },
  progressLineActive: {
    backgroundColor: "#0284c7",
  },
  stepContainer: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  typeCardSelected: {
    borderColor: "#0284c7",
    backgroundColor: "#f0f9ff",
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  photoContainer: {
    position: "relative",
    marginBottom: 8,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#0284c7",
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
    backgroundColor: "#0284c7",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  photoHint: {
    fontSize: 14,
    color: "#6b7280",
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "white",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 8,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  specializationsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
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
  passwordRequirements: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  passwordRequirementsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 8,
  },
  passwordRequirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  passwordRequirementText: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 8,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  reviewItem: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  reviewLabel: {
    width: 140,
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  reviewValue: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
  },
  reviewImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewSpecializations: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  reviewSpecializationChip: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
  },
  reviewSpecializationText: {
    fontSize: 12,
    color: "#7c3aed",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeActive: {
    backgroundColor: "#d1fae5",
  },
  statusBadgeInactive: {
    backgroundColor: "#fee2e2",
  },
  statusBadgeOnLeave: {
    backgroundColor: "#fef3c7",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navigationButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  backButton: {
    borderColor: "#d1d5db",
  },
  nextButton: {
    backgroundColor: "#0284c7",
  },
  fullWidthButton: {
    flex: 1,
  },
})
