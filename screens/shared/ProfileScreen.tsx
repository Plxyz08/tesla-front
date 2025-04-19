"use client"

import { useState, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
  StatusBar,
  Linking,
} from "react-native"
import AppHeader from "../../components/AppHeader"
import { Card, Button, Divider, Avatar, TextInput, ActivityIndicator } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import AlertMessage from "../../components/alertMessage"
import FutureFeatureModal from "../../components/FutureFeatureModal"
import ErrorMessage from "../../components/ErrorMessage"
import LogoutConfirmationModal from "../../components/LogoutConfirmationModal"
import * as ImagePicker from "expo-image-picker"

const { width } = Dimensions.get("window")

// Cloudinary configuration
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/your-cloud-name/image/upload"
const UPLOAD_PRESET = "your_preset_name" // Replace with your upload preset

export default function ProfileScreen() {
  const navigation = useNavigation<any>()
  const { user, logout, updateUserProfile } = useAuth()
  const insets = useSafeAreaInsets()

  // Estados para las diferentes configuraciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "Usuario",
    email: user?.email || "usuario@ejemplo.com",
    phone: user?.phone || "+34 612 345 678",
    profileImage: user?.profileImage || undefined,
  })
  const [tempProfileData, setTempProfileData] = useState({ ...profileData })

  // Estados para modales
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })
  const [showFutureFeatureModal, setShowFutureFeatureModal] = useState(false)
  const [futureFeatureInfo, setFutureFeatureInfo] = useState<{
    message: string
    title: string
    icon: keyof typeof Ionicons.glyphMap
    releaseDate: string
  }>({ message: "", title: "", icon: "alert", releaseDate: "" })
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [errorData, setErrorData] = useState({ title: "", message: "" })
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Determinar el color primario según el rol del usuario
  const getPrimaryColor = () => {
    switch (user?.role) {
      case "admin":
        return "#7c3aed" // Púrpura para admin
      case "technician":
        return "#059669" // Verde para técnico
      default:
        return "#f7be0d" // Azul para cliente
    }
  }

  const primaryColor = getPrimaryColor()

  // Función para mostrar alerta
  const showAlertMessage = (title: string, message: string) => {
    setAlertData({ title, message })
    setShowAlert(true)
  }

  const handleBiometricFeaturePress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Autenticación Biométrica",
      message: "Próximamente podrás activar la autenticación biométrica para aumentar la seguridad de tu cuenta.",
      icon: "finger-print",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  const handleLanguageFeaturePress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Idioma",
      message: "Próximamente podrás cambiar el idioma de la aplicación.",
      icon: "language-outline",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  const handleTwoFactorAuthFeaturePress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Verificación en Dos Pasos",
      message: "Próximamente podrás activar la verificación en dos pasos para aumentar la seguridad de tu cuenta.",
      icon: "shield-checkmark-outline",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  const handleHelpCenterFeaturePress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Centro de Ayuda",
      message: "Próximamente tendrás acceso a nuestro centro de ayuda con guías y tutoriales.",
      icon: "help-circle-outline",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  // Función para mostrar mensaje de error
  const showError = (title: string, message: string) => {
    setErrorData({ title, message })
    setShowErrorMessage(true)
  }

  // Manejar edición de perfil
  const handleEditProfile = () => {
    if (isEditing) {
      // Guardar cambios
      setProfileData({ ...tempProfileData })
      // En una implementación real, aquí se enviarían los datos al backend
      updateUserProfile &&
        updateUserProfile({ ...tempProfileData, profileImage: tempProfileData.profileImage || undefined })
      showAlertMessage("Perfil Actualizado", "Los cambios en tu perfil han sido guardados correctamente.")
    }
    setIsEditing(!isEditing)
  }

  // Manejar selección y carga de imagen de perfil
  const handleProfileImageUpload = async () => {
    try {
      // Solicitar permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        showError("Permiso Denegado", "Se necesita acceso a la galería para cambiar la foto de perfil.")
        return
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0]

        // Iniciar carga a Cloudinary
        setIsUploading(true)

        // Crear FormData para la carga
        const formData = new FormData()
        formData.append("file", {
          uri: selectedImage.uri,
          type: "image/jpeg",
          name: "profile_image.jpg",
        } as any)
        formData.append("upload_preset", UPLOAD_PRESET)

        // Enviar a Cloudinary
        const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        if (data.secure_url) {
          // Actualizar URL de la imagen
          const newPhotoURL = data.secure_url
          setTempProfileData({ ...tempProfileData, profileImage: newPhotoURL })
          setProfileData({ ...profileData, profileImage: newPhotoURL })

          // En una implementación real, aquí se actualizaría el perfil en el backend
          updateUserProfile && updateUserProfile({ profileImage: newPhotoURL })

          showAlertMessage("Imagen Actualizada", "Tu foto de perfil ha sido actualizada correctamente.")
        } else {
          throw new Error("No se pudo obtener la URL de la imagen")
        }
      }
    } catch (error) {
      console.error("Error al subir imagen:", error)
      showError("Error de Carga", "No se pudo subir la imagen. Inténtalo de nuevo más tarde.")
    } finally {
      setIsUploading(false)
    }
  }

  // Función para abrir el correo electrónico para soporte
  const handleContactSupport = () => {
    const email = "soporte@tuempresa.com"
    const subject = "Solicitud de Soporte - App Ascensores"
    const body = `
Hola Equipo de Soporte,

Necesito ayuda con lo siguiente:

[Describe tu problema aquí]

Información de mi cuenta:
- Nombre: ${profileData.name}
- Email: ${profileData.email}
- ID de Usuario: ${user?.id || "No disponible"}
- Rol: ${user?.role || "Cliente"}

Saludos,
${profileData.name}
`

    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    Linking.canOpenURL(mailtoUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(mailtoUrl)
        } else {
          showError("Error", "No se pudo abrir la aplicación de correo electrónico.")
        }
      })
      .catch((error) => {
        console.error("Error al abrir el correo electrónico:", error)
        showError("Error", "Ocurrió un problema al intentar abrir el correo electrónico.")
      })
  }

  // Manejar cierre de sesión
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  // Confirmar cierre de sesión
  const confirmLogout = () => {
    setShowLogoutModal(false)
    logout()
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={primaryColor} />
      <AppHeader title="Mi Perfil" showBackButton />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de Perfil */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                {isUploading ? (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="large" color={primaryColor} />
                  </View>
                ) : profileData.profileImage ? (
                  <Avatar.Image source={{ uri: profileData.profileImage }} size={80} style={styles.avatar} />
                ) : (
                  <Avatar.Text
                    label={profileData.name?.substring(0, 2).toUpperCase() || "US"}
                    size={80}
                    style={[styles.avatar, { backgroundColor: primaryColor }]}
                  />
                )}
                {!isEditing && !isUploading && (
                  <TouchableOpacity
                    style={[styles.editAvatarButton, { backgroundColor: primaryColor }]}
                    onPress={handleProfileImageUpload}
                  >
                    <Ionicons name="camera" size={18} color="white" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    label="Nombre"
                    value={tempProfileData.name}
                    onChangeText={(text) => setTempProfileData({ ...tempProfileData, name: text })}
                    mode="outlined"
                    style={styles.editInput}
                    outlineColor="#e5e7eb"
                    activeOutlineColor={primaryColor}
                    dense
                  />
                ) : (
                  <Text style={styles.profileName}>{profileData.name}</Text>
                )}

                <View style={[styles.roleChip, { backgroundColor: primaryColor + "20" }]}>
                  <Text style={[styles.roleText, { color: primaryColor }]}>
                    {user?.role === "admin" ? "Administrador" : user?.role === "technician" ? "Técnico" : "Cliente"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: primaryColor }, isEditing && styles.saveButton]}
                onPress={handleEditProfile}
              >
                <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.contactInfo}>
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={20} color="#6b7280" />
                {isEditing ? (
                  <TextInput
                    label="Email"
                    value={tempProfileData.email}
                    onChangeText={(text) => setTempProfileData({ ...tempProfileData, email: text })}
                    mode="outlined"
                    style={styles.editInput}
                    outlineColor="#e5e7eb"
                    activeOutlineColor={primaryColor}
                    dense
                  />
                ) : (
                  <Text style={styles.contactText}>{profileData.email}</Text>
                )}
              </View>

              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color="#6b7280" />
                {isEditing ? (
                  <TextInput
                    label="Teléfono"
                    value={tempProfileData.phone}
                    onChangeText={(text) => setTempProfileData({ ...tempProfileData, phone: text })}
                    mode="outlined"
                    style={styles.editInput}
                    outlineColor="#e5e7eb"
                    activeOutlineColor={primaryColor}
                    dense
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.contactText}>{profileData.phone}</Text>
                )}
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Sección de Configuración */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Configuración</Text>

          <Card style={styles.settingsCard}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Notificaciones Push</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#e5e7eb", true: primaryColor + "40" }}
                thumbColor={notificationsEnabled ? primaryColor : "#f4f3f4"}
                ios_backgroundColor="#e5e7eb"
              />
            </View>

            <Divider style={styles.settingDivider} />

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Notificaciones por Email</Text>
              </View>
              <Switch
                value={emailNotificationsEnabled}
                onValueChange={setEmailNotificationsEnabled}
                trackColor={{ false: "#e5e7eb", true: primaryColor + "40" }}
                thumbColor={emailNotificationsEnabled ? primaryColor : "#f4f3f4"}
                ios_backgroundColor="#e5e7eb"
              />
            </View>
          </Card>
        </Animated.View>

        {/* Sección de Seguridad */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Seguridad</Text>

          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="lock-closed-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Cambiar Contraseña</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Sección de Ayuda y Soporte */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ayuda y Soporte</Text>

          <Card style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingItem} onPress={handleContactSupport}>
              <View style={styles.settingInfo}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Contactar Soporte</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <Divider style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Términos y Condiciones</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <Divider style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-outline" size={22} color={primaryColor} />
                <Text style={styles.settingText}>Política de Privacidad</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </Card>
        </Animated.View>

        {/* Botón de Cerrar Sesión */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#ef4444"
            contentStyle={styles.logoutButtonContent}
          >
            Cerrar Sesión
          </Button>

          <Text style={styles.versionText}>Versión 1.0.0</Text>
        </Animated.View>
      </ScrollView>

      {/* Alerta de mensaje */}
      <AlertMessage
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setShowAlert(false)}
      />

      {/* Modal de Función Futura */}
      <FutureFeatureModal
        visible={showFutureFeatureModal}
        title={futureFeatureInfo.title}
        message={futureFeatureInfo.message}
        icon={futureFeatureInfo.icon}
        releaseDate={futureFeatureInfo.releaseDate}
        onClose={() => setShowFutureFeatureModal(false)}
      />

      {/* Mensaje de Error */}
      <ErrorMessage
        visible={showErrorMessage}
        title={errorData.title}
        message={errorData.message}
        onClose={() => setShowErrorMessage(false)}
      />

      {/* Modal de Confirmación de Cierre de Sesión */}
      <LogoutConfirmationModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        userName={profileData.name}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  avatar: {
    borderWidth: 3,
    borderColor: "white",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  uploadingContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#f7be0d",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  roleChip: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "#f7be0d",
    fontWeight: "600",
    fontSize: 12,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f7be0d",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  divider: {
    marginHorizontal: 16,
  },
  contactInfo: {
    padding: 16,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactText: {
    marginLeft: 12,
    color: "#4b5563",
    fontSize: 15,
  },
  editInput: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: "white",
    fontSize: 15,
    height: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingsCard: {
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    position: "relative",
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    color: "#1f2937",
    fontSize: 15,
  },
  settingDivider: {
    marginHorizontal: 16,
  },
  settingAction: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingValue: {
    color: "#6b7280",
    marginRight: 8,
  },
  comingSoonOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  comingSoonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    marginTop: 24,
    borderColor: "#ef4444",
    borderRadius: 12,
  },
  logoutButtonContent: {
    height: 50,
  },
  versionText: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 16,
    fontSize: 12,
  },
})
