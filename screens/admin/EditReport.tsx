"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Button, ActivityIndicator, Chip, Divider, TextInput, Switch } from "react-native-paper"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { Report } from "../../models/technician"
import Animated, { FadeInDown } from "react-native-reanimated"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

// Definir colores para el tema de administrador
const COLORS = {
  primary: "#7c3aed", // Morado para administradores
  primaryDark: "#6d28d9",
  primaryLight: "#ede9fe",
  secondary: "#8b5cf6", // Morado más claro para acentos
  background: "#f9fafb",
  card: "#ffffff",
  text: "#1f2937",
  textSecondary: "#4b5563",
  textTertiary: "#9ca3af",
  border: "#e5e7eb",
  error: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
}

export default function EditReportScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const reportId = route.params?.reportId

  // Estado
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [editedReport, setEditedReport] = useState<Partial<Report>>({})
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertData, setAlertData] = useState({
    type: "success" as "success" | "error" | "info",
    title: "",
    message: "",
  })
  const [errorVisible, setErrorVisible] = useState(false)
  const [errorData, setErrorData] = useState({
    title: "",
    message: "",
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Mostrar alerta de éxito
  const showSuccessAlert = (title: string, message: string) => {
    setAlertData({
      type: "success",
      title,
      message,
    })
    setAlertVisible(true)
  }

  // Mostrar alerta de error
  const showErrorAlert = (title: string, message: string) => {
    setErrorData({
      title,
      message,
    })
    setErrorVisible(true)
  }

  // Verificar si se proporcionó un ID de reporte válido
  useEffect(() => {
    if (!reportId) {
      showErrorAlert(
        "Error al cargar el reporte",
        "No se proporcionó un ID de reporte válido. Por favor, intente nuevamente.",
      )
      // Navegar de vuelta después de mostrar el error
      setTimeout(() => {
        navigation.goBack()
      }, 2000)
    } else {
      fetchReport()
    }
  }, [reportId])

  // Obtener detalles del reporte
  const fetchReport = async () => {
    setIsLoading(true)

    try {
      // Obtener el reporte desde el almacenamiento local usando technicianApi
      const response = await technicianApi.reports.getById(reportId)

      if (response.success && response.data) {
        // Agregar nombre de técnico simulado
        const technicianNames = ["Carlos Rodríguez", "María López", "Juan Pérez"]
        const randomIndex = Math.floor(Math.random() * technicianNames.length)

        const reportWithTechnician = {
          ...response.data,
          technicianName: technicianNames[randomIndex],
        }

        setReport(reportWithTechnician)
        setEditedReport({})
      } else {
        throw new Error(response.message || "No se pudo cargar el reporte")
      }
    } catch (error: any) {
      console.error("Error fetching report:", error)
      showErrorAlert("Error al cargar el reporte", error.message || "No se pudo cargar el reporte")

      // Navegar de vuelta después de mostrar el error
      setTimeout(() => {
        navigation.goBack()
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Manejar cambios en los campos del reporte
  const handleChange = (field: string, value: any) => {
    setEditedReport((prev) => ({
      ...prev,
      [field]: value,
    }))
    setHasUnsavedChanges(true)
  }

  // Manejar cambios en los items de las secciones
  const handleItemChange = (sectionId: string, itemId: string, value: boolean) => {
    if (!report) return

    const updatedSections = report.sections.map((section) => {
      if (section.sectionId === sectionId) {
        return {
          ...section,
          items: section.items.map((item) => {
            if (item.itemId === itemId) {
              return {
                ...item,
                value,
              }
            }
            return item
          }),
        }
      }
      return section
    })

    setEditedReport((prev) => ({
      ...prev,
      sections: updatedSections,
    }))
    setHasUnsavedChanges(true)
  }

  // Guardar cambios
  const handleSave = async () => {
    if (!report) return

    setIsSaving(true)

    try {
      // Combinar el reporte original con los cambios
      const updatedReport = {
        ...report,
        ...editedReport,
      }

      // Actualizar el reporte en el almacenamiento local
      const response = await technicianApi.reports.update(report.id, editedReport)

      if (response.success) {
        showSuccessAlert("Reporte actualizado", "El reporte ha sido actualizado correctamente")
        setReport(updatedReport)
        setEditedReport({})
        setHasUnsavedChanges(false)

        // Navegar de vuelta después de mostrar el éxito
        setTimeout(() => {
          navigation.goBack()
        }, 1500)
      } else {
        throw new Error(response.message || "No se pudo actualizar el reporte")
      }
    } catch (error: any) {
      console.error("Error updating report:", error)
      showErrorAlert("Error al actualizar reporte", error.message || "No se pudo actualizar el reporte")
    } finally {
      setIsSaving(false)
    }
  }

  // Cancelar edición
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert("Cambios sin guardar", "¿Estás seguro de que deseas salir? Los cambios no guardados se perderán.", [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: () => navigation.goBack() },
      ])
    } else {
      navigation.goBack()
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Fecha inválida"

      // Create date object without timezone adjustments
      const date = new Date(dateString)

      // Check if the date is valid before proceeding
      if (isNaN(date.getTime())) {
        return "Fecha inválida"
      }

      // Use a more reliable date formatting approach
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()

      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Fecha inválida"
    }
  }

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return COLORS.textTertiary
      case "submitted":
        return COLORS.info
      case "approved":
        return COLORS.success
      default:
        return COLORS.textTertiary
    }
  }

  // Obtener etiqueta según estado
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Borrador"
      case "submitted":
        return "Enviado"
      case "approved":
        return "Aprobado"
      default:
        return status
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header con gradiente */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Reporte</Text>
          <TouchableOpacity
            style={[styles.saveButton, !hasUnsavedChanges && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="save" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      ) : report ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado del reporte */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={styles.reportHeaderCard}>
              <Card.Content>
                <View style={styles.reportHeaderTop}>
                  <TextInput
                    label="Nombre del edificio"
                    value={editedReport.buildingName !== undefined ? editedReport.buildingName : report.buildingName}
                    onChangeText={(text) => handleChange("buildingName", text)}
                    style={styles.input}
                    mode="outlined"
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Estado:</Text>
                    <Chip
                      style={[styles.statusChip, { backgroundColor: `${getStatusColor(report.status)}20` }]}
                      textStyle={{ color: getStatusColor(report.status) }}
                      onPress={() => {
                        // Ciclar entre los estados
                        const statuses = ["draft", "submitted", "approved"]
                        const currentIndex = statuses.indexOf(report.status)
                        const nextIndex = (currentIndex + 1) % statuses.length
                        handleChange("status", statuses[nextIndex])
                      }}
                    >
                      {getStatusLabel(editedReport.status || report.status)}
                    </Chip>
                  </View>
                </View>

                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Fecha:</Text>
                  <Text style={styles.dateValue}>{formatDate(report.date)}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.reportDetails}>
                  <TextInput
                    label="Marca de ascensor"
                    value={editedReport.elevatorBrand !== undefined ? editedReport.elevatorBrand : report.elevatorBrand}
                    onChangeText={(text) => handleChange("elevatorBrand", text)}
                    style={styles.input}
                    mode="outlined"
                    outlineColor={COLORS.border}
                    activeOutlineColor={COLORS.primary}
                  />

                  <View style={styles.rowInputs}>
                    <TextInput
                      label="Número de ascensores"
                      value={
                        editedReport.elevatorCount !== undefined
                          ? String(editedReport.elevatorCount)
                          : String(report.elevatorCount)
                      }
                      onChangeText={(text) => handleChange("elevatorCount", Number.parseInt(text) || 0)}
                      style={[styles.input, styles.halfInput]}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      keyboardType="numeric"
                    />

                    <TextInput
                      label="Número de pisos"
                      value={
                        editedReport.floorCount !== undefined
                          ? String(editedReport.floorCount)
                          : String(report.floorCount)
                      }
                      onChangeText={(text) => handleChange("floorCount", Number.parseInt(text) || 0)}
                      style={[styles.input, styles.halfInput]}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.rowInputs}>
                    <TextInput
                      label="Hora de entrada"
                      value={editedReport.clockInTime !== undefined ? editedReport.clockInTime : report.clockInTime}
                      onChangeText={(text) => handleChange("clockInTime", text)}
                      style={[styles.input, styles.halfInput]}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />

                    <TextInput
                      label="Hora de salida"
                      value={
                        editedReport.clockOutTime !== undefined ? editedReport.clockOutTime : report.clockOutTime || ""
                      }
                      onChangeText={(text) => handleChange("clockOutTime", text)}
                      style={[styles.input, styles.halfInput]}
                      mode="outlined"
                      outlineColor={COLORS.border}
                      activeOutlineColor={COLORS.primary}
                    />
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Secciones de la lista de verificación */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trabajos Realizados</Text>
            </View>

            {report.sections.map((section) => (
              <Card key={section.sectionId} style={styles.checklistCard}>
                <Card.Content>
                  <Text style={styles.checklistSectionTitle}>{section.title}</Text>

                  {section.items.map((item) => {
                    // Buscar si el item ha sido editado
                    const editedSections = editedReport.sections || []
                    const editedSection = editedSections.find((s) => s.sectionId === section.sectionId)
                    const editedItem = editedSection?.items.find((i) => i.itemId === item.itemId)
                    const isChecked = editedItem ? editedItem.value === true : item.value === true

                    return (
                      <View key={item.itemId} style={styles.checklistItem}>
                        <Switch
                          value={isChecked}
                          onValueChange={(value) => handleItemChange(section.sectionId, item.itemId, value)}
                          color={COLORS.primary}
                        />
                        <Text style={styles.checklistItemText}>{item.description}</Text>
                      </View>
                    )
                  })}
                </Card.Content>
              </Card>
            ))}
          </Animated.View>

          {/* Observaciones */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Observaciones</Text>
            </View>

            <Card style={styles.observationsCard}>
              <Card.Content>
                <TextInput
                  label="Observaciones"
                  value={
                    editedReport.observations !== undefined ? editedReport.observations : report.observations || ""
                  }
                  onChangeText={(text) => handleChange("observations", text)}
                  style={styles.observationsInput}
                  mode="outlined"
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  multiline
                  numberOfLines={5}
                />
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Botones de acción */}
          <View style={styles.actionButtons}>
            <Button mode="outlined" onPress={handleCancel} style={styles.cancelButton} textColor={COLORS.textSecondary}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButtonLarge}
              buttonColor={COLORS.primary}
              loading={isSaving}
              disabled={!hasUnsavedChanges || isSaving}
            >
              Guardar Cambios
            </Button>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Reporte no encontrado</Text>
          <Text style={styles.errorText}>No se pudo cargar la información del reporte.</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            buttonColor={COLORS.primary}
          >
            Volver
          </Button>
        </View>
      )}

      {/* Componentes de alerta */}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    color: "white",
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    width: 200,
  },
  reportHeaderCard: {
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportHeaderTop: {
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  dateValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  divider: {
    marginVertical: 12,
  },
  reportDetails: {
    marginTop: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS.card,
  },
  rowInputs: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  halfInput: {
    width: "48%",
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  checklistCard: {
    marginBottom: 12,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  checklistSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checklistItemText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    marginLeft: 12,
  },
  observationsCard: {
    marginBottom: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  observationsInput: {
    backgroundColor: COLORS.card,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: COLORS.border,
  },
  saveButtonLarge: {
    flex: 2,
    marginLeft: 8,
  },
})

