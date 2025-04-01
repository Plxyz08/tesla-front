"use client"

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
import { TextInput, Button, Checkbox, Divider, ProgressBar, IconButton, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation, useRoute } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { useApp } from "../../context/AppContext"
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas"

interface ChecklistItem {
  id: string
  title: string
  checked: boolean
}

interface MaintenanceFormData {
  maintenanceId: string
  checklistItems: ChecklistItem[]
  notes: string
  photos: string[]
  clientSignature: string | null
  technicianSignature: string | null
  status: "draft" | "completed"
}

export default function MaintenanceFormScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { updateMaintenanceStatus } = useApp()

  // Get maintenance data from route params or use default
  const maintenance = route.params?.maintenance || {
    id: "new",
    clientName: "Cliente de Prueba",
    address: "Av. Ejemplo 123, Lima",
    status: "in-progress",
    scheduledDate: new Date(),
  }

  // Default checklist items
  const defaultChecklist: ChecklistItem[] = [
    { id: "1", title: "Revisión de cables de tracción", checked: false },
    { id: "2", title: "Verificación de sistema de frenos", checked: false },
    { id: "3", title: "Limpieza de foso", checked: false },
    { id: "4", title: "Revisión de puertas y sensores", checked: false },
    { id: "5", title: "Verificación de sistema eléctrico", checked: false },
    { id: "6", title: "Revisión de botones y panel de control", checked: false },
    { id: "7", title: "Verificación de nivelación", checked: false },
    { id: "8", title: "Lubricación de guías", checked: false },
    { id: "9", title: "Revisión de iluminación", checked: false },
    { id: "10", title: "Prueba de sistema de emergencia", checked: false },
  ]

  const [formData, setFormData] = useState<MaintenanceFormData>({
    maintenanceId: maintenance.id,
    checklistItems: defaultChecklist,
    notes: "",
    photos: [],
    clientSignature: null,
    technicianSignature: null,
    status: "draft",
  })

  const [activeSection, setActiveSection] = useState<"checklist" | "photos" | "notes" | "signatures">("checklist")
  const [showClientSignature, setShowClientSignature] = useState(false)
  const [showTechSignature, setShowTechSignature] = useState(false)

  const clientSignatureRef = useRef<SignatureViewRef>(null)
  const techSignatureRef = useRef<SignatureViewRef>(null)

  const handleCheckItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      checklistItems: prev.checklistItems.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
    }))
  }

  const handleAddPhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tus fotos")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri],
      }))
    }
  }

  const handleTakePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert("Permiso denegado", "Necesitamos permiso para acceder a tu cámara")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, result.assets[0].uri],
      }))
    }
  }

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }))
  }

  const handleClientSignature = (signature: string) => {
    setFormData((prev) => ({
      ...prev,
      clientSignature: signature,
    }))
    setShowClientSignature(false)
  }

  const handleTechSignature = (signature: string) => {
    setFormData((prev) => ({
      ...prev,
      technicianSignature: signature,
    }))
    setShowTechSignature(false)
  }

  const handleClearClientSignature = () => {
    clientSignatureRef.current?.clearSignature()
  }

  const handleClearTechSignature = () => {
    techSignatureRef.current?.clearSignature()
  }

  const handleSaveDraft = () => {
    // In a real app, this would save to API/database
    Alert.alert("Guardado", "El formulario ha sido guardado como borrador")
  }

  const validateForm = () => {
    const checkedItems = formData.checklistItems.filter((item) => item.checked).length
    const totalItems = formData.checklistItems.length

    if (checkedItems < totalItems) {
      Alert.alert("Checklist incompleto", "Por favor complete todos los ítems del checklist")
      return false
    }

    if (!formData.clientSignature) {
      Alert.alert("Firma requerida", "Se requiere la firma del cliente")
      return false
    }

    if (!formData.technicianSignature) {
      Alert.alert("Firma requerida", "Se requiere su firma como técnico")
      return false
    }

    return true
  }

  const handleComplete = () => {
    if (!validateForm()) return

    // Update maintenance status
    if (maintenance.id !== "new") {
      updateMaintenanceStatus(maintenance.id, "completed")
    }

    // In a real app, this would submit to API/database
    Alert.alert("Mantenimiento Completado", "El formulario ha sido enviado exitosamente", [
      { text: "OK", onPress: () => navigation.goBack() },
    ])
  }

  const getCompletionPercentage = () => {
    let total = 0

    // Checklist (50%)
    const checkedItems = formData.checklistItems.filter((item) => item.checked).length
    total += (checkedItems / formData.checklistItems.length) * 0.5

    // Photos (20%)
    total += formData.photos.length > 0 ? 0.2 : 0

    // Notes (10%)
    total += formData.notes.trim().length > 0 ? 0.1 : 0

    // Signatures (20%)
    if (formData.clientSignature) total += 0.1
    if (formData.technicianSignature) total += 0.1

    return total
  }

  // Signature handling
  const handleSignature = (signature: string, type: "client" | "technician") => {
    if (type === "client") {
      handleClientSignature(signature)
    } else {
      handleTechSignature(signature)
    }
  }

  const style = `.m-signature-pad--footer {display: none; margin: 0px;}`

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Formulario de Mantenimiento</Text>
          <Text style={styles.headerSubtitle}>{maintenance.clientName}</Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>{Math.round(getCompletionPercentage() * 100)}% Completado</Text>
          <ProgressBar progress={getCompletionPercentage()} color="#059669" style={styles.progressBar} />
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeSection === "checklist" && styles.activeTab]}
          onPress={() => setActiveSection("checklist")}
        >
          <Ionicons name="list" size={20} color={activeSection === "checklist" ? "#059669" : "#6b7280"} />
          <Text style={[styles.tabText, activeSection === "checklist" && styles.activeTabText]}>Checklist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === "photos" && styles.activeTab]}
          onPress={() => setActiveSection("photos")}
        >
          <Ionicons name="camera" size={20} color={activeSection === "photos" ? "#059669" : "#6b7280"} />
          <Text style={[styles.tabText, activeSection === "photos" && styles.activeTabText]}>Fotos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === "notes" && styles.activeTab]}
          onPress={() => setActiveSection("notes")}
        >
          <Ionicons name="document-text" size={20} color={activeSection === "notes" ? "#059669" : "#6b7280"} />
          <Text style={[styles.tabText, activeSection === "notes" && styles.activeTabText]}>Notas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeSection === "signatures" && styles.activeTab]}
          onPress={() => setActiveSection("signatures")}
        >
          <Ionicons name="create" size={20} color={activeSection === "signatures" ? "#059669" : "#6b7280"} />
          <Text style={[styles.tabText, activeSection === "signatures" && styles.activeTabText]}>Firmas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeSection === "checklist" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist de Mantenimiento</Text>

            {formData.checklistItems.map((item) => (
              <TouchableOpacity key={item.id} style={styles.checklistItem} onPress={() => handleCheckItem(item.id)}>
                <Checkbox
                  status={item.checked ? "checked" : "unchecked"}
                  onPress={() => handleCheckItem(item.id)}
                  color="#059669"
                />
                <Text style={[styles.checklistText, item.checked && styles.checklistTextChecked]}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeSection === "photos" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fotos del Mantenimiento</Text>
            <Text style={styles.sectionDescription}>
              Tome fotos del trabajo realizado para documentar el mantenimiento
            </Text>

            <View style={styles.photoButtons}>
              <Button
                mode="contained"
                icon="camera"
                buttonColor="#059669"
                onPress={handleTakePhoto}
                style={styles.photoButton}
              >
                Tomar Foto
              </Button>

              <Button
                mode="outlined"
                icon="image"
                textColor="#059669"
                onPress={handleAddPhoto}
                style={styles.photoButton}
              >
                Galería
              </Button>
            </View>

            {formData.photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {formData.photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity style={styles.removePhotoButton} onPress={() => handleRemovePhoto(index)}>
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyPhotos}>
                <Ionicons name="images-outline" size={48} color="#d1d5db" />
                <Text style={styles.emptyPhotosText}>No hay fotos agregadas</Text>
              </View>
            )}
          </View>
        )}

        {activeSection === "notes" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas y Observaciones</Text>
            <Text style={styles.sectionDescription}>
              Agregue cualquier observación o detalle adicional sobre el mantenimiento
            </Text>

            <TextInput
              mode="outlined"
              multiline
              numberOfLines={8}
              placeholder="Escriba sus observaciones aquí..."
              value={formData.notes}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, notes: text }))}
              style={styles.notesInput}
            />

            <View style={styles.quickNotesContainer}>
              <Text style={styles.quickNotesTitle}>Notas rápidas:</Text>
              <View style={styles.quickNotes}>
                <Chip
                  mode="flat"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: prev.notes + " Se requiere cambio de piezas.",
                    }))
                  }
                  style={styles.quickNote}
                >
                  Cambio de piezas
                </Chip>
                <Chip
                  mode="flat"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: prev.notes + " Mantenimiento preventivo completado sin incidencias.",
                    }))
                  }
                  style={styles.quickNote}
                >
                  Sin incidencias
                </Chip>
                <Chip
                  mode="flat"
                  onPress={() =>
                    setFormData((prev) => ({
                      ...prev,
                      notes: prev.notes + " Se recomienda revisión adicional en próxima visita.",
                    }))
                  }
                  style={styles.quickNote}
                >
                  Revisión adicional
                </Chip>
              </View>
            </View>
          </View>
        )}

        {activeSection === "signatures" && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firmas</Text>
            <Text style={styles.sectionDescription}>
              Se requiere la firma del cliente y del técnico para completar el mantenimiento
            </Text>

            <View style={styles.signatureSection}>
              <Text style={styles.signatureTitle}>Firma del Cliente</Text>

              {formData.clientSignature ? (
                <View style={styles.signatureContainer}>
                  <Image
                    source={{ uri: formData.clientSignature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                  <Button
                    mode="text"
                    textColor="#ef4444"
                    onPress={() => setFormData((prev) => ({ ...prev, clientSignature: null }))}
                  >
                    Borrar firma
                  </Button>
                </View>
              ) : (
                <TouchableOpacity style={styles.signaturePlaceholder} onPress={() => setShowClientSignature(true)}>
                  <Ionicons name="create-outline" size={32} color="#6b7280" />
                  <Text style={styles.signaturePlaceholderText}>Toque para firmar</Text>
                </TouchableOpacity>
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.signatureSection}>
              <Text style={styles.signatureTitle}>Firma del Técnico</Text>

              {formData.technicianSignature ? (
                <View style={styles.signatureContainer}>
                  <Image
                    source={{ uri: formData.technicianSignature }}
                    style={styles.signatureImage}
                    resizeMode="contain"
                  />
                  <Button
                    mode="text"
                    textColor="#ef4444"
                    onPress={() => setFormData((prev) => ({ ...prev, technicianSignature: null }))}
                  >
                    Borrar firma
                  </Button>
                </View>
              ) : (
                <TouchableOpacity style={styles.signaturePlaceholder} onPress={() => setShowTechSignature(true)}>
                  <Ionicons name="create-outline" size={32} color="#6b7280" />
                  <Text style={styles.signaturePlaceholderText}>Toque para firmar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button mode="outlined" textColor="#059669" onPress={handleSaveDraft} style={styles.footerButton}>
          Guardar Borrador
        </Button>

        <Button mode="contained" buttonColor="#059669" onPress={handleComplete} style={styles.footerButton}>
          Completar
        </Button>
      </View>

      {/* Client Signature Modal */}
      {showClientSignature && (
        <View style={styles.signatureModal}>
          <View style={styles.signatureModalHeader}>
            <Text style={styles.signatureModalTitle}>Firma del Cliente</Text>
            <IconButton icon="close" size={24} onPress={() => setShowClientSignature(false)} />
          </View>

          <SignatureScreen
            ref={clientSignatureRef}
            onOK={(signature) => handleSignature(signature, "client")}
            webStyle={style}
          />

          <View style={styles.signatureModalFooter}>
            <Button
              mode="outlined"
              textColor="#ef4444"
              onPress={handleClearClientSignature}
              style={styles.signatureButton}
            >
              Borrar
            </Button>

            <Button
              mode="contained"
              buttonColor="#059669"
              onPress={() => clientSignatureRef.current?.readSignature()}
              style={styles.signatureButton}
            >
              Confirmar
            </Button>
          </View>
        </View>
      )}

      {/* Technician Signature Modal */}
      {showTechSignature && (
        <View style={styles.signatureModal}>
          <View style={styles.signatureModalHeader}>
            <Text style={styles.signatureModalTitle}>Firma del Técnico</Text>
            <IconButton icon="close" size={24} onPress={() => setShowTechSignature(false)} />
          </View>

          <SignatureScreen
            ref={techSignatureRef}
            onOK={(signature) => handleSignature(signature, "technician")}
            webStyle={style}
          />

          <View style={styles.signatureModalFooter}>
            <Button
              mode="outlined"
              textColor="#ef4444"
              onPress={handleClearTechSignature}
              style={styles.signatureButton}
            >
              Borrar
            </Button>

            <Button
              mode="contained"
              buttonColor="#059669"
              onPress={() => techSignatureRef.current?.readSignature()}
              style={styles.signatureButton}
            >
              Confirmar
            </Button>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "white",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#059669",
    marginBottom: 4,
    textAlign: "right",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#059669",
  },
  tabText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  activeTabText: {
    color: "#059669",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  checklistText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#374151",
  },
  checklistTextChecked: {
    textDecorationLine: "line-through",
    color: "#9ca3af",
  },
  photoButtons: {
    flexDirection: "row",
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  photoContainer: {
    width: "31%",
    aspectRatio: 1,
    margin: "1%",
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "white",
    borderRadius: 12,
  },
  emptyPhotos: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  emptyPhotosText: {
    marginTop: 12,
    color: "#6b7280",
  },
  notesInput: {
    backgroundColor: "white",
    marginBottom: 16,
  },
  quickNotesContainer: {
    marginBottom: 16,
  },
  quickNotesTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 8,
  },
  quickNotes: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  quickNote: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f3f4f6",
  },
  signatureSection: {
    marginBottom: 24,
  },
  signatureTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 12,
  },
  signatureContainer: {
    alignItems: "center",
  },
  signatureImage: {
    width: "100%",
    height: 150,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  signaturePlaceholder: {
    height: 150,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  signaturePlaceholderText: {
    marginTop: 8,
    color: "#6b7280",
  },
  divider: {
    marginVertical: 24,
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  signatureModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "white",
    zIndex: 1000,
  },
  signatureModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  signatureModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  signatureModalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureButton: {
    flex: 1,
    marginHorizontal: 4,
  },
})

