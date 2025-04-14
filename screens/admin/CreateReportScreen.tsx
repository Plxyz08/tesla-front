"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Button, ActivityIndicator, Chip, Checkbox } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { ReportTemplate, ReportSectionData } from "../../models/technician"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import SignatureScreen from "react-native-signature-canvas"
import Animated, { FadeInDown } from "react-native-reanimated"
import { StatusBar } from "expo-status-bar"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

// Definir colores para el tema de administrador (morado)
const COLORS = {
  primary: "#7c3aed", // Morado para administradores
  primaryDark: "#6d28d9",
  primaryLight: "#ede9fe",
  primaryLighter: "#f5f3ff", // Morado 50
  primaryLightest: "#faf5ff", // Morado 50
  secondary: "#8b5cf6", // Morado más claro para acentos
  secondaryLight: "#e0e7ff", // Indigo 100
  danger: "#ef4444", // Red 500
  dangerLight: "#fee2e2", // Red 100
  warning: "#f59e0b", // Amber 500
  warningLight: "#fef3c7", // Amber 100
  success: "#10b981", // Green 500
  successLight: "#d1fae5", // Green 100
  gray: "#6b7280", // Gray 500
  grayLight: "#f3f4f6", // Gray 100
  grayDark: "#374151", // Gray 700
  background: "#f9fafb", // Gray 50
  white: "#ffffff",
  black: "#1f2937", // Gray 800
}

export default function CreateReportScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [totalSteps, setTotalSteps] = useState(4)

  // Report data
  const [buildingName, setBuildingName] = useState("")
  const [elevatorBrand, setElevatorBrand] = useState("")
  const [elevatorCount, setElevatorCount] = useState("1")
  const [floorCount, setFloorCount] = useState("")
  const [clockInTime, setClockInTime] = useState("")
  const [clockOutTime, setClockOutTime] = useState("")
  const [reportDate, setReportDate] = useState(new Date())
  const [reportSections, setReportSections] = useState<ReportSectionData[]>([])
  const [observations, setObservations] = useState("")
  const [technicianSignature, setTechnicianSignature] = useState("")
  const [clientSignature, setClientSignature] = useState("")

  // UI state
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const [isClockInPickerVisible, setClockInPickerVisible] = useState(false)
  const [isClockOutPickerVisible, setClockOutPickerVisible] = useState(false)
  const [showTechSignatureModal, setShowTechSignatureModal] = useState(false)
  const [showClientSignatureModal, setShowClientSignatureModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentMonthTemplate, setCurrentMonthTemplate] = useState<ReportTemplate | null>(null)

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

  // Handle navigation steps
  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prevStep) => Math.min(prevStep + 1, totalSteps))
    }
  }

  const handlePrevStep = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1))
  }

  const handleSaveReport = () => {
    if (validateCurrentStep()) {
      setShowConfirmationModal(true)
    }
  }

  // Fetch templates and current month template on mount
  useEffect(() => {
    fetchTemplates()
    fetchCurrentMonthTemplate()
  }, [])

  // Initialize report sections when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      const initialSections = selectedTemplate.sections.map((section) => ({
        sectionId: section.id,
        title: section.title,
        items: section.items.map((item) => ({
          itemId: item.id,
          description: item.description,
          value: item.type === "checkbox" ? false : "",
        })),
      }))

      setReportSections(initialSections)
    }
  }, [selectedTemplate])

  // Fetch templates
  const fetchTemplates = async () => {
    setIsLoading(true)

    try {
      const response = await technicianApi.reports.getTemplates()

      if (response.success) {
        setTemplates(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      showError("Error", "No se pudieron cargar las plantillas de reportes.")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch current month template
  const fetchCurrentMonthTemplate = async () => {
    try {
      const currentMonth = new Date().getMonth()
      const response = await technicianApi.reports.getTemplateForMonth(currentMonth)

      if (response.success) {
        setCurrentMonthTemplate(response.data)
        setSelectedTemplate(response.data)
      }
    } catch (error) {
      console.error("Error fetching current month template:", error)
    }
  }

  // Handle template selection
  const handleSelectTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template)
    setCurrentStep(2)
  }

  // Handle date picker
  const showDatePicker = () => {
    setDatePickerVisible(true)
  }

  const hideDatePicker = () => {
    setDatePickerVisible(false)
  }

  const adjustDateForTimezone = (dateString: string) => {
    if (!dateString) return dateString

    try {
      // Parse the date string
      const date = new Date(dateString)

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString
      }

      // Return in YYYY-MM-DD format without adding an extra day
      return date.toISOString().split("T")[0]
    } catch (error) {
      console.error("Error adjusting date:", error)
      return dateString
    }
  }

  const handleDateConfirm = (date: Date) => {
    try {
      // Usar directamente la fecha seleccionada sin ajustes adicionales
      setReportDate(date)
      hideDatePicker()
      setErrors({ ...errors, date: "" })
    } catch (error) {
      console.error("Error al confirmar la fecha:", error)
      showError("Error", "No se pudo establecer la fecha seleccionada.")
    }
  }

  // Handle clock in picker
  const showClockInPicker = () => {
    setClockInPickerVisible(true)
  }

  const hideClockInPicker = () => {
    setClockInPickerVisible(false)
  }

  const handleClockInConfirm = (time: Date) => {
    setClockInTime(time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }))
    hideClockInPicker()
    setErrors({ ...errors, clockInTime: "" })
  }

  // Handle clock out picker
  const showClockOutPicker = () => {
    setClockOutPickerVisible(true)
  }

  const hideClockOutPicker = () => {
    setClockOutPickerVisible(false)
  }

  const handleClockOutConfirm = (time: Date) => {
    setClockOutTime(time.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }))
    hideClockOutPicker()
  }

  // Handle checkbox change
  const handleCheckboxChange = (sectionIndex: number, itemIndex: number, value: boolean) => {
    const updatedSections = [...reportSections]
    updatedSections[sectionIndex].items[itemIndex].value = value
    setReportSections(updatedSections)
  }

  // Handle text input change
  const handleTextInputChange = (sectionIndex: number, itemIndex: number, value: string) => {
    const updatedSections = [...reportSections]
    updatedSections[sectionIndex].items[itemIndex].value = value
    setReportSections(updatedSections)
  }

  // Handle tech signature
  const handleTechSignature = (signature: string) => {
    setTechnicianSignature(signature)
    setShowTechSignatureModal(false)
    setErrors({ ...errors, technicianSignature: "" })
  }

  // Handle client signature
  const handleClientSignature = (signature: string) => {
    setClientSignature(signature)
    setShowClientSignatureModal(false)
  }

  // Show success alert
  const showSuccessAlert = (title: string, message: string) => {
    setAlertTitle(title)
    setAlertMessage(message)
    setAlertType("success")
    setAlertVisible(true)
  }

  // Show error alert
  const showError = (title: string, message: string) => {
    setErrorTitle(title)
    setErrorMessage(message)
    setErrorVisible(true)
  }

  // Validate current step
  const validateCurrentStep = () => {
    try {
      const newErrors: Record<string, string> = {}

      if (currentStep === 2) {
        if (!buildingName.trim()) {
          newErrors.buildingName = "El nombre del edificio es requerido"
        }

        if (!elevatorBrand.trim()) {
          newErrors.elevatorBrand = "La marca del ascensor es requerida"
        }

        if (!elevatorCount || Number.parseInt(elevatorCount) < 1) {
          newErrors.elevatorCount = "El número de ascensores debe ser al menos 1"
        }

        if (!floorCount || Number.parseInt(floorCount) < 1) {
          newErrors.floorCount = "El número de paradas debe ser al menos 1"
        }

        if (!clockInTime) {
          newErrors.clockInTime = "La hora de entrada es requerida"
        }
      }

      if (currentStep === 3) {
        // Verificar que al menos un elemento de la lista de verificación esté seleccionado
        let atLeastOneSelected = false

        for (const section of reportSections) {
          for (const item of section.items) {
            if (item.value === true) {
              atLeastOneSelected = true
              break
            }
          }
          if (atLeastOneSelected) break
        }

        if (!atLeastOneSelected) {
          newErrors.checklist = "Debe seleccionar al menos un elemento de la lista de verificación"
        }
      }

      if (currentStep === 4) {
        if (!technicianSignature) {
          newErrors.technicianSignature = "La firma del técnico es requerida"
        }
      }

      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    } catch (error) {
      console.error("Error en la validación:", error)
      showError("Error", "Ocurrió un error al validar los datos. Por favor, inténtelo de nuevo.")
      return false
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Fecha inválida"
    }
  }

  // Get month name
  const getMonthName = (month: number) => {
    const monthNames = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]
    return monthNames[month]
  }

  // Render progress steps
  const renderProgressSteps = () => {
    return (
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <View
              style={[
                styles.progressStep,
                currentStep > index ? styles.progressStepCompleted : {},
                currentStep === index + 1 ? styles.progressStepCurrent : {},
              ]}
            >
              <Text
                style={[
                  styles.progressStepText,
                  currentStep > index || currentStep === index + 1 ? styles.progressStepTextActive : {},
                ]}
              >
                {index + 1}
              </Text>
            </View>
            {index < totalSteps - 1 && (
              <View style={[styles.progressLine, currentStep > index + 1 ? styles.progressLineCompleted : {}]} />
            )}
          </React.Fragment>
        ))}
      </View>
    )
  }

  // Render template selection step
  const renderTemplateSelection = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Seleccionar Plantilla</Text>

        {currentMonthTemplate && (
          <View style={styles.currentMonthContainer}>
            <Text style={styles.currentMonthTitle}>
              Plantilla Recomendada para {getMonthName(new Date().getMonth())}
            </Text>
            <View style={styles.sheetNumberBadge}>
              <Text style={styles.sheetNumberText}>Hoja {currentMonthTemplate.sheetNumber}</Text>
            </View>
          </View>
        )}

        <Text style={styles.stepDescription}>Elija el tipo de reporte de mantenimiento que desea generar</Text>

        {templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={[
              styles.templateCard,
              selectedTemplate?.id === template.id && styles.templateCardSelected,
              template.id === currentMonthTemplate?.id && styles.templateCardRecommended,
            ]}
            onPress={() => handleSelectTemplate(template)}
          >
            <View style={styles.templateIconContainer}>
              {template.type === "type1" && <Ionicons name="construct-outline" size={24} color={COLORS.primary} />}
              {template.type === "type2" && <Ionicons name="cog-outline" size={24} color={COLORS.primary} />}
              {template.type === "type3" && <Ionicons name="build-outline" size={24} color={COLORS.primary} />}
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateDescription}>
                Hoja {template.sheetNumber} • {template.sections.length} secciones
              </Text>
              {template.id === currentMonthTemplate?.id && (
                <Chip style={styles.recommendedChip} textStyle={{ color: COLORS.success, fontSize: 12 }}>
                  Recomendado para este mes
                </Chip>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    )
  }

  // Render building info step
  const renderBuildingInfo = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Información del Edificio</Text>
        <Text style={styles.stepDescription}>Ingrese los datos del edificio y ascensor</Text>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Nombre del Edificio</Text>
          <TextInput
            style={[styles.textInput, errors.buildingName ? styles.inputError : {}]}
            placeholder="Ej: Edificio Central"
            value={buildingName}
            onChangeText={(text) => {
              setBuildingName(text)
              if (errors.buildingName) setErrors({ ...errors, buildingName: "" })
            }}
          />
          {errors.buildingName ? <Text style={styles.errorText}>{errors.buildingName}</Text> : null}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Marca del Ascensor</Text>
          <TextInput
            style={[styles.textInput, errors.elevatorBrand ? styles.inputError : {}]}
            placeholder="Ej: MITSUBISHI"
            value={elevatorBrand}
            onChangeText={(text) => {
              setElevatorBrand(text)
              if (errors.elevatorBrand) setErrors({ ...errors, elevatorBrand: "" })
            }}
          />
          {errors.elevatorBrand ? <Text style={styles.errorText}>{errors.elevatorBrand}</Text> : null}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Número de Ascensores</Text>
            <TextInput
              style={[styles.textInput, errors.elevatorCount ? styles.inputError : {}]}
              placeholder="Ej: 1"
              value={elevatorCount}
              onChangeText={(text) => {
                setElevatorCount(text.replace(/[^0-9]/g, ""))
                if (errors.elevatorCount) setErrors({ ...errors, elevatorCount: "" })
              }}
              keyboardType="numeric"
            />
            {errors.elevatorCount ? <Text style={styles.errorText}>{errors.elevatorCount}</Text> : null}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Número de Paradas</Text>
            <TextInput
              style={[styles.textInput, errors.floorCount ? styles.inputError : {}]}
              placeholder="Ej: 10"
              value={floorCount}
              onChangeText={(text) => {
                setFloorCount(text.replace(/[^0-9]/g, ""))
                if (errors.floorCount) setErrors({ ...errors, floorCount: "" })
              }}
              keyboardType="numeric"
            />
            {errors.floorCount ? <Text style={styles.errorText}>{errors.floorCount}</Text> : null}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Fecha de Mantenimiento</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
            <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
            <Text style={styles.datePickerButtonText}>{formatDate(reportDate)}</Text>
          </TouchableOpacity>
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>Hora de Entrada</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, errors.clockInTime ? styles.inputError : {}]}
              onPress={showClockInPicker}
            >
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.datePickerButtonText}>{clockInTime || "Seleccionar"}</Text>
            </TouchableOpacity>
            {errors.clockInTime ? <Text style={styles.errorText}>{errors.clockInTime}</Text> : null}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>Hora de Salida (Opcional)</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={showClockOutPicker}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.datePickerButtonText}>{clockOutTime || "Seleccionar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    )
  }

  // Render checklist step
  const renderChecklist = () => {
    if (!selectedTemplate) return null

    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Lista de Verificación</Text>
        <Text style={styles.stepDescription}>Marque los trabajos realizados durante el mantenimiento</Text>

        {errors.checklist ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
            <Text style={styles.errorText}>{errors.checklist}</Text>
          </View>
        ) : null}

        {reportSections.map((section, sectionIndex) => (
          <View key={section.sectionId} style={styles.checklistSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            {section.items.map((item, itemIndex) => (
              <View key={item.itemId} style={styles.checklistItem}>
                <Checkbox
                  status={item.value === true ? "checked" : "unchecked"}
                  onPress={() => handleCheckboxChange(sectionIndex, itemIndex, !item.value as boolean)}
                  color={COLORS.primary}
                />
                <Text style={styles.checklistItemText}>{item.description}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>Observaciones</Text>
          <TextInput
            style={[styles.textArea]}
            placeholder="Ingrese observaciones adicionales aquí..."
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={4}
          />
        </View>
      </Animated.View>
    )
  }

  // Render signatures step
  const renderSignatures = () => {
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Firmas</Text>
        <Text style={styles.stepDescription}>Firmas del técnico y cliente para validar el reporte</Text>

        <View style={styles.signatureContainer}>
          <Text style={styles.signatureLabel}>Firma del Técnico</Text>

          {technicianSignature ? (
            <View style={styles.signatureImageContainer}>
              <Image source={{ uri: technicianSignature }} style={styles.signatureImage} resizeMode="contain" />
              <View style={styles.signatureOverlay}>
                <TouchableOpacity style={styles.resetSignatureButton} onPress={() => setTechnicianSignature("")}>
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.signatureButton, errors.technicianSignature ? styles.inputError : {}]}
              onPress={() => setShowTechSignatureModal(true)}
            >
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.signatureButtonText}>Firmar aquí</Text>
            </TouchableOpacity>
          )}

          {errors.technicianSignature ? <Text style={styles.errorText}>{errors.technicianSignature}</Text> : null}
        </View>

        <View style={styles.signatureContainer}>
          <Text style={styles.signatureLabel}>Firma del Cliente (Opcional)</Text>

          {clientSignature ? (
            <View style={styles.signatureImageContainer}>
              <Image source={{ uri: clientSignature }} style={styles.signatureImage} resizeMode="contain" />
              <View style={styles.signatureOverlay}>
                <TouchableOpacity style={styles.resetSignatureButton} onPress={() => setClientSignature("")}>
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.signatureButton} onPress={() => setShowClientSignatureModal(true)}>
              <Ionicons name="create-outline" size={24} color={COLORS.primary} />
              <Text style={styles.signatureButtonText}>Firmar aquí</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={20} color={COLORS.gray} />
          <Text style={styles.disclaimerText}>
            Al enviar este reporte, confirma que toda la información proporcionada es correcta. Una vez enviado, el
            reporte no podrá ser modificado.
          </Text>
        </View>
      </Animated.View>
    )
  }

  // Confirm save report
  const confirmSaveReport = async () => {
    setShowConfirmationModal(false)
    setIsSaving(true)

    try {
      if (!selectedTemplate || !user?.id) {
        throw new Error("Datos de reporte incompletos")
      }

      // Formatear la fecha correctamente sin añadir días extra
      const formattedDate = reportDate.toISOString().split("T")[0]

      const reportData = {
        technicianId: user.id,
        templateId: selectedTemplate.id,
        templateType: selectedTemplate.type,
        sheetNumber: selectedTemplate.sheetNumber,
        buildingName,
        elevatorBrand,
        elevatorCount: Number.parseInt(elevatorCount),
        floorCount: Number.parseInt(floorCount),
        clockInTime,
        clockOutTime,
        // Usar la fecha formateada directamente
        date: formattedDate,

        sections: reportSections,
        observations,
        technicianSignature,
        clientSignature,
        status: "submitted" as const,
      }

      const response = await technicianApi.reports.create(reportData)

      if (response.success) {
        // Resetear el formulario a su estado inicial
        resetForm()

        showSuccessAlert(
          "Reporte Guardado",
          "El reporte ha sido guardado correctamente. Serás redirigido al listado de reportes.",
        )

        // Delay navigation to allow the user to see the success message
        setTimeout(() => {
          navigation.navigate("ReportsList")
        }, 2000)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error saving report:", error)
      showError("Error", "No se pudo guardar el reporte. Inténtalo de nuevo.")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle alert close
  const handleAlertClose = () => {
    setAlertVisible(false)
  }

  // Add a resetForm function to clear all fields and reset the form to its initial state
  const resetForm = () => {
    setSelectedTemplate(null)
    setBuildingName("")
    setElevatorBrand("")
    setElevatorCount("1")
    setFloorCount("")
    setClockInTime("")
    setClockOutTime("")
    setReportDate(new Date())
    setReportSections([])
    setObservations("")
    setTechnicianSignature("")
    setClientSignature("")
    setCurrentStep(1)
    setErrors({})

    // Fetch current month template again
    fetchCurrentMonthTemplate()
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar style="light" backgroundColor={COLORS.primary} />

      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={handlePrevStep}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear Reporte</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando plantillas...</Text>
          </View>
        ) : (
          <Card style={styles.formCard}>
            <Card.Content>
              {renderProgressSteps()}

              {currentStep === 1 && renderTemplateSelection()}
              {currentStep === 2 && renderBuildingInfo()}
              {currentStep === 3 && renderChecklist()}
              {currentStep === 4 && renderSignatures()}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevStep}
          style={styles.footerButton}
          contentStyle={styles.footerButtonContent}
          icon="arrow-left"
          textColor={COLORS.gray}
        >
          {currentStep === 1 ? "Cancelar" : "Anterior"}
        </Button>

        {currentStep < totalSteps ? (
          <Button
            mode="contained"
            onPress={handleNextStep}
            style={styles.footerButton}
            contentStyle={[styles.footerButtonContent, { flexDirection: "row-reverse" }]}
            buttonColor={COLORS.primary}
            icon="arrow-right"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSaveReport}
            style={styles.footerButton}
            contentStyle={styles.footerButtonContent}
            buttonColor={COLORS.primary}
            icon="check"
            loading={isSaving}
            disabled={isSaving}
          >
            Guardar Reporte
          </Button>
        )}
      </View>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
        date={reportDate}
      />

      {/* Clock In Picker Modal */}
      <DateTimePickerModal
        isVisible={isClockInPickerVisible}
        mode="time"
        onConfirm={handleClockInConfirm}
        onCancel={hideClockInPicker}
        date={new Date()}
      />

      {/* Clock Out Picker Modal */}
      <DateTimePickerModal
        isVisible={isClockOutPickerVisible}
        mode="time"
        onConfirm={handleClockOutConfirm}
        onCancel={hideClockOutPicker}
        date={new Date()}
      />

      {/* Technician Signature Modal */}
      <Modal
        visible={showTechSignatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTechSignatureModal(false)}
      >
        <View style={styles.signatureModalContainer}>
          <View style={styles.signatureModalContent}>
            <View style={styles.signatureModalHeader}>
              <Text style={styles.signatureModalTitle}>Firma del Técnico</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowTechSignatureModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.signatureCanvasContainer}>
              <SignatureScreen
                onOK={(signature) => handleTechSignature(signature)}
                onEmpty={() => showError("Error", "Por favor firme antes de continuar")}
                descriptionText="Firma Técnico"
                clearText="Limpiar"
                confirmText="Guardar"
                webStyle={`
                  .m-signature-pad {
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    border: none;
                  }
                  .m-signature-pad--body {
                    border: none;
                  }
                  .m-signature-pad--body canvas {
                    background-color: #ffffff;
                    border: 2px dashed ${COLORS.primary}; /* Añade un borde punteado para indicar el área de firma */
                  }
                  .m-signature-pad--footer {
                    display: flex;
                    justify-content: space-between;
                    background-color: ${COLORS.primaryLightest};
                    padding: 16px;
                    border-top: 1px solid #e5e7eb;
                  }
                  .m-signature-pad--footer .button {
                    background-color: ${COLORS.primary};
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center; /* Centra el texto horizontalmente */
                    display: flex;
                    justify-content: center; /* Centra el texto horizontalmente */
                    align-items: center; /* Centra el texto verticalmente */
                  }
                  .m-signature-pad--footer .button:hover {
                    background-color: ${COLORS.primaryDark};
                    transform: translateY(-1px);
                  }
                  .m-signature-pad--footer .button.clear {
                    background-color: #f3f4f6;
                    color: ${COLORS.grayDark};
                  }
                  .m-signature-pad--footer .description {
                    color: ${COLORS.grayDark};
                    font-size: 14px;
                    margin-bottom: 10px;
                    text-align: center;
                    padding: 10px;
                  }
                `}
              />
            </View>

            <View style={styles.signatureModalFooter}>
              <Text style={styles.signatureModalFooterText}>Utilice su dedo o un lápiz digital para firmar</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Client Signature Modal */}
      <Modal
        visible={showClientSignatureModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowClientSignatureModal(false)}
      >
        <View style={styles.signatureModalContainer}>
          <View style={styles.signatureModalContent}>
            <View style={styles.signatureModalHeader}>
              <Text style={styles.signatureModalTitle}>Firma del Cliente</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowClientSignatureModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.signatureCanvasContainer}>
              <SignatureScreen
                onOK={(signature) => handleClientSignature(signature)}
                onEmpty={() => showError("Error", "Por favor firme antes de continuar")}
                descriptionText="Firma Cliente"
                clearText="Limpiar"
                confirmText="Guardar"
                webStyle={`
                  .m-signature-pad {
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    border: none;
                  }
                  .m-signature-pad--body {
                    border: none;
                  }
                  .m-signature-pad--body canvas {
                    background-color: #ffffff;
                    border: 2px dashed ${COLORS.primary}; /* Añade un borde punteado para indicar el área de firma */
                  }
                  .m-signature-pad--footer {
                    display: flex;
                    justify-content: space-between;
                    background-color: ${COLORS.primaryLightest};
                    padding: 16px;
                    border-top: 1px solid #e5e7eb;
                  }
                  .m-signature-pad--footer .button {
                    background-color: ${COLORS.primary};
                    color: #fff;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center; /* Centra el texto horizontalmente */
                    display: flex;
                    justify-content: center; /* Centra el texto horizontalmente */
                    align-items: center; /* Centra el texto verticalmente */
                  }
                  .m-signature-pad--footer .button:hover {
                    background-color: ${COLORS.primaryDark};
                    transform: translateY(-1px);
                  }
                  .m-signature-pad--footer .button.clear {
                    background-color: #f3f4f6;
                    color: ${COLORS.grayDark};
                  }
                  .m-signature-pad--footer .description {
                    color: ${COLORS.grayDark};
                    font-size: 14px;
                    margin-bottom: 10px;
                    text-align: center;
                    padding: 10px;
                  }
                `}
              />
            </View>

            <View style={styles.signatureModalFooter}>
              <Text style={styles.signatureModalFooterText}>Entregue el dispositivo al cliente para que firme</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmationModal(false)}
      >
        <View style={styles.confirmationModalContainer}>
          <View style={styles.confirmationModalContent}>
            <Ionicons name="warning" size={48} color={COLORS.warning} style={styles.confirmationIcon} />

            <Text style={styles.confirmationTitle}>¿Está seguro?</Text>
            <Text style={styles.confirmationText}>
              Una vez guardado, este reporte no podrá ser modificado. ¿Desea continuar?
            </Text>

            <View style={styles.confirmationButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowConfirmationModal(false)}
                style={styles.confirmationButton}
                textColor={COLORS.gray}
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                onPress={confirmSaveReport}
                style={styles.confirmationButton}
                buttonColor={COLORS.primary}
                loading={isSaving}
                disabled={isSaving}
              >
                Confirmar
              </Button>
            </View>
          </View>
        </View>
      </Modal>
                    
      {/* Alert Message */}
      <AlertMessage visible={showAlert} title={alertTitle} message={alertMessage} onClose={handleAlertClose} />

      {/* Error Message */}
      <ErrorMessage
        visible={errorVisible}
        title={errorTitle}
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
    </KeyboardAvoidingView>
    
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 300,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.gray,
  },
  formCard: {
    borderRadius: 16,
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.grayLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  progressStepCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressStepCurrent: {
    borderColor: COLORS.primary,
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.gray,
  },
  progressStepTextActive: {
    color: "white",
  },
  progressLine: {
    height: 2,
    width: 30,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 5,
  },
  progressLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 20,
  },
  currentMonthContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primaryLightest,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  currentMonthTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
  },
  sheetNumberBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sheetNumberText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLightest,
  },
  templateCardRecommended: {
    borderColor: COLORS.success,
    borderWidth: 2,
  },
  templateIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLightest,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  recommendedChip: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.successLight,
    height: "auto",
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    height: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.white,
  },
  datePickerButtonText: {
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.black,
  },
  checklistSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.grayDark,
    marginBottom: 12,
    backgroundColor: COLORS.grayLight,
    padding: 8,
    borderRadius: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checklistItemText: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginLeft: 8,
    flex: 1,
  },
  signatureContainer: {
    marginBottom: 24,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.grayDark,
    marginBottom: 10,
  },
  signatureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 20,
    backgroundColor: COLORS.white,
    borderStyle: "dashed",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  signatureButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "500",
  },
  signatureImageContainer: {
    position: "relative",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    height: 160,
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  signatureImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.white,
  },
  signatureOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderBottomLeftRadius: 12,
  },
  resetSignatureButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  signatureModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  signatureModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  signatureModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  signatureModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  signatureCanvasContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  signatureModalFooter: {
    padding: 16,
    backgroundColor: COLORS.primaryLightest,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  signatureModalFooterText: {
    textAlign: "center",
    color: COLORS.grayDark,
    fontSize: 14,
  },
  confirmationModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationModalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "80%",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 24,
  },
  confirmationButtons: {
    flexDirection: "row",
    width: "100%",
  },
  confirmationButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: COLORS.white,
  },
  disclaimerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.grayLight,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  footerButtonContent: {
    height: 50,
  },
  disclaimerText: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginLeft: 8,
    flex: 1,
  },
})

