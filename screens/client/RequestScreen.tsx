"use client"

import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  Image,
  Dimensions,
} from "react-native"
import { Card, Button, TextInput, Chip, Divider, SegmentedButtons } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import * as ImagePicker from "expo-image-picker"
import Animated, { FadeIn } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import AlertMessage from "../../components/alertMessage"
import AppHeader from "../../components/AppHeader"

const { width } = Dimensions.get("window")

const primaryColor = "#efb810"

export default function RequestScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { addNotification } = useApp()
  const insets = useSafeAreaInsets()

  // Form state
  type RequestType = "maintenance" | "installation" | "consultation"
  const [requestType, setRequestType] = useState<RequestType>("maintenance")
  const [serviceType, setServiceType] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState("normal")
  const [description, setDescription] = useState("")

  // Disponibilidad en lugar de fecha/hora específica
  const [availableDays, setAvailableDays] = useState<string[]>([])
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("")
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date()) // Solo para seleccionar días en el calendario

  const [contactMethod, setContactMethod] = useState("phone")
  const [images, setImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  // Add useRef for form reset functionality
  const [formKey, setFormKey] = useState(0)

  // Validation state
  // Expand the errors state to include all required fields
  const [errors, setErrors] = useState({
    requestType: "",
    serviceType: "",
    description: "",
    contactMethod: "",
    availableDays: "",
    preferredTimeSlot: "",
    preferredDate: "",
    preferredTime: "",
  })

  // Alert state
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  // Service type options based on request type
  const serviceTypeOptions = {
    maintenance: [
      { label: "Mantenimiento preventivo", value: "preventive" },
      { label: "Reparación", value: "repair" },
      { label: "Inspección", value: "inspection" },
      { label: "Modernización", value: "modernization" },
    ],
    installation: [
      { label: "Instalación nueva", value: "new" },
      { label: "Reemplazo", value: "replacement" },
      { label: "Actualización", value: "upgrade" },
    ],
    consultation: [
      { label: "Consulta técnica", value: "technical" },
      { label: "Presupuesto", value: "quote" },
      { label: "Información general", value: "info" },
    ],
  }

  // Opciones de días de la semana
  const dayOptions = [
    { label: "Lunes", value: "monday" },
    { label: "Martes", value: "tuesday" },
    { label: "Miércoles", value: "wednesday" },
    { label: "Jueves", value: "thursday" },
    { label: "Viernes", value: "friday" },
  ]

  // Opciones de franjas horarias
  const timeSlotOptions = [
    { label: "Mañana (9:00 - 12:00)", value: "morning" },
    { label: "Tarde (14:00 - 17:00)", value: "afternoon" },
  ]

  // Date and time state
  const [preferredDate, setPreferredDate] = useState(new Date())
  const [preferredTime, setPreferredTime] = useState(new Date())
  const [showTimePicker, setShowTimePicker] = useState(false)

  // Handle date selection for available days
  const onDaySelection = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setSelectedDate(selectedDate)

      // Convertir la fecha a día de la semana
      const dayOfWeek = selectedDate.toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase()

      // Mapear el día de la semana al valor correspondiente
      let dayValue = ""
      switch (dayOfWeek) {
        case "lunes":
          dayValue = "monday"
          break
        case "martes":
          dayValue = "tuesday"
          break
        case "miércoles":
          dayValue = "wednesday"
          break
        case "jueves":
          dayValue = "thursday"
          break
        case "viernes":
          dayValue = "friday"
          break
        default:
          return // No añadir sábados ni domingos
      }

      // Añadir o quitar el día de la lista de días disponibles
      if (availableDays.includes(dayValue)) {
        setAvailableDays(availableDays.filter((day) => day !== dayValue))
      } else {
        setAvailableDays([...availableDays, dayValue])
      }

      setErrors({ ...errors, availableDays: "" })
    }
  }

  // Handle date selection
  const onDateChange = (event: any, selectedDate: Date | undefined) => {
    const currentDate = selectedDate || preferredDate
    setShowDatePicker(false)
    setPreferredDate(currentDate)
    setErrors({ ...errors, preferredDate: "" })
  }

  // Handle time selection
  const onTimeChange = (event: any, selectedTime: Date | undefined) => {
    const currentTime = selectedTime || preferredTime
    setShowTimePicker(false)
    setPreferredTime(currentTime)
    setErrors({ ...errors, preferredTime: "" })
  }

  // Toggle day selection
  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day))
    } else {
      setAvailableDays([...availableDays, day])
    }
    setErrors({ ...errors, availableDays: "" })
  }

  // Handle image picker
  const handleAddImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== "granted") {
        showAlertMessage("Permiso Denegado", "Se necesita acceso a la galería para añadir imágenes.")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 3,
      })

      if (!result.canceled && result.assets) {
        // Limit to 3 images total
        const newImages = result.assets.map((asset) => asset.uri)
        setImages((current) => {
          const combined = [...current, ...newImages]
          return combined.slice(0, 3)
        })
      }
    } catch (error) {
      console.error("Error selecting image:", error)
      showAlertMessage("Error", "No se pudo seleccionar la imagen. Inténtalo de nuevo.")
    }
  }

  // Add a function to handle camera capture
  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()

      if (status !== "granted") {
        showAlertMessage("Permiso Denegado", "Se necesita acceso a la cámara para tomar fotos.")
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add the captured image to the images array
        const newImage = result.assets[0].uri
        setImages((current) => {
          const combined = [...current, newImage]
          return combined.slice(0, 3) // Limit to 3 images total
        })
      }
    } catch (error) {
      console.error("Error capturing image:", error)
      showAlertMessage("Error", "No se pudo capturar la imagen. Inténtalo de nuevo.")
    }
  }

  // Remove image
  const handleRemoveImage = (index: number) => {
    setImages((current) => current.filter((_, i) => i !== index))
  }

  // Add a function to reset the form
  const resetForm = () => {
    // Reset all form fields to initial values
    setRequestType("maintenance")
    setServiceType("")
    setUrgencyLevel("normal")
    setDescription("")
    setAvailableDays([])
    setPreferredTimeSlot("")
    setContactMethod("phone")
    setImages([])
    setCurrentStep(1)
    setErrors({
      requestType: "",
      serviceType: "",
      description: "",
      contactMethod: "",
      availableDays: "",
      preferredTimeSlot: "",
      preferredDate: "",
      preferredTime: "",
    })
    setPreferredDate(new Date())
    setPreferredTime(new Date())
    // Force re-render of the form
    setFormKey((prevKey) => prevKey + 1)
  }

  // Validate form
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Validate based on current step
    if (currentStep === 1 || currentStep === 3) {
      if (!requestType) {
        newErrors.requestType = "Por favor seleccione un tipo de solicitud"
        isValid = false
      } else {
        newErrors.requestType = ""
      }

      if (!serviceType) {
        newErrors.serviceType = "Por favor seleccione un tipo de servicio"
        isValid = false
      } else {
        newErrors.serviceType = ""
      }
    }

    if (currentStep === 2 || currentStep === 3) {
      if (!description.trim()) {
        newErrors.description = "Por favor proporcione una descripción"
        isValid = false
      } else {
        newErrors.description = ""
      }

      if (!contactMethod) {
        newErrors.contactMethod = "Por favor seleccione un método de contacto"
        isValid = false
      } else {
        newErrors.contactMethod = ""
      }
    }

    if (currentStep === 3) {
      if (preferredDate === null) {
        newErrors.preferredDate = "Por favor seleccione una fecha"
        isValid = false
      } else {
        newErrors.preferredDate = ""
      }

      if (preferredTime === null) {
        newErrors.preferredTime = "Por favor seleccione una hora"
        isValid = false
      } else {
        newErrors.preferredTime = ""
      }
    }

    setErrors(newErrors)
    return isValid
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) return

    // En una implementación real, esto enviaría datos a una API
    // Aquí simulamos el proceso

    // Crear notificación para admin
    addNotification({
      title: "Nueva solicitud de servicio",
      message: `El cliente ${user?.name} ha solicitado un servicio de ${getServiceTypeLabel(serviceType)}`,
      type: "task",
    })

    // Mostrar mensaje de éxito
    showAlertMessage(
      "Solicitud Enviada",
      "Su solicitud de servicio ha sido enviada con éxito. Nos pondremos en contacto pronto para confirmar los detalles.",
    )

    // Resetear el formulario después del envío exitoso
    resetForm()
  }

  // Show alert message
  const showAlertMessage = (title: string, message: string) => {
    setAlertData({ title, message })
    setShowAlert(true)
  }

  // Handle alert close
  const handleAlertClose = () => {
    setShowAlert(false)
    // Solo navegar hacia atrás si no se muestra el mensaje de éxito después de resetear el formulario
    if (alertData.title !== "Solicitud Enviada") {
      navigation.goBack()
    }
  }

  // Get service type label
  const getServiceTypeLabel = (value: string) => {
    const option = serviceTypeOptions[requestType].find((opt) => opt.value === value)
    return option ? option.label : value
  }

  // Get day label
  const getDayLabel = (value: string) => {
    const option = dayOptions.find((day) => day.value === value)
    return option ? option.label : value
  }

  // Get time slot label
  const getTimeSlotLabel = (value: string) => {
    const option = timeSlotOptions.find((slot) => slot.value === value)
    return option ? option.label : value
  }

  // Handle next step
  const handleNextStep = () => {
    let canProceed = true
    const newErrors = { ...errors }

    if (currentStep === 1) {
      if (!serviceType) {
        newErrors.serviceType = "Por favor seleccione un tipo de servicio"
        canProceed = false
      } else {
        newErrors.serviceType = ""
      }
    }

    if (currentStep === 2) {
      if (!description.trim()) {
        newErrors.description = "Por favor proporcione una descripción"
        canProceed = false
      } else {
        newErrors.description = ""
      }

      if (!contactMethod) {
        newErrors.contactMethod = "Por favor seleccione un método de contacto"
        canProceed = false
      } else {
        newErrors.contactMethod = ""
      }
    }

    setErrors(newErrors)

    if (canProceed && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderServiceTypeStep()
      case 2:
        return renderDetailsStep()
      case 3:
        return renderSchedulingStep()
      default:
        return null
    }
  }

  // Render service type step
  const renderServiceTypeStep = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Tipo de Servicio</Text>
        <Text style={styles.stepDescription}>Seleccione el tipo de servicio que necesita para su ascensor</Text>

        <View style={styles.requestTypeContainer}>
          <SegmentedButtons
            value={requestType}
            onValueChange={(value) => setRequestType(value as RequestType)}
            buttons={[
              { value: "maintenance", label: "Mantenimiento", icon: "wrench" },
              { value: "installation", label: "Instalación", icon: "tools" },
              { value: "consultation", label: "Consulta", icon: "help-circle" },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        <Text style={styles.sectionLabel}>Seleccione una opción:</Text>
        <View style={styles.serviceTypeGrid}>
          {serviceTypeOptions[requestType].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.serviceTypeCard, serviceType === option.value && styles.serviceTypeCardSelected]}
              onPress={() => {
                setServiceType(option.value)
                setErrors({ ...errors, serviceType: "" })
              }}
            >
              <View style={[styles.serviceTypeIcon, serviceType === option.value && styles.serviceTypeIconSelected]}>
                <Ionicons
                  name={getIconForServiceType(option.value)}
                  size={24}
                  color={serviceType === option.value ? "white" : primaryColor}
                />
              </View>
              <Text style={[styles.serviceTypeText, serviceType === option.value && styles.serviceTypeTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.serviceType ? <Text style={styles.errorText}>{errors.serviceType}</Text> : null}

        <View style={styles.urgencyContainer}>
          <Text style={styles.sectionLabel}>Nivel de Urgencia:</Text>
          <View style={styles.urgencyOptions}>
            <TouchableOpacity
              style={[styles.urgencyOption, urgencyLevel === "low" && styles.urgencyOptionSelected]}
              onPress={() => setUrgencyLevel("low")}
            >
              <View style={[styles.urgencyDot, { backgroundColor: "#10b981" }]} />
              <Text style={styles.urgencyText}>Baja</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.urgencyOption, urgencyLevel === "normal" && styles.urgencyOptionSelected]}
              onPress={() => setUrgencyLevel("normal")}
            >
              <View style={[styles.urgencyDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={styles.urgencyText}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.urgencyOption, urgencyLevel === "high" && styles.urgencyOptionSelected]}
              onPress={() => setUrgencyLevel("high")}
            >
              <View style={[styles.urgencyDot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.urgencyText}>Alta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    )
  }

  // Render details step
  // Update the renderDetailsStep function to include camera button
  const renderDetailsStep = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Detalles del Servicio</Text>
        <Text style={styles.stepDescription}>Proporcione detalles sobre el servicio que necesita</Text>

        <Text style={styles.sectionLabel}>Descripción del problema o solicitud:</Text>
        <TextInput
          label="Descripción detallada"
          value={description}
          onChangeText={(text) => {
            setDescription(text)
            if (text.trim()) setErrors({ ...errors, description: "" })
          }}
          mode="outlined"
          multiline
          numberOfLines={6}
          style={styles.textArea}
          outlineColor="#e5e7eb"
          activeOutlineColor={primaryColor}
          error={!!errors.description}
        />
        {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

        <Text style={styles.sectionLabel}>Añadir imágenes (opcional):</Text>
        <Text style={styles.helperText}>Las imágenes ayudan a nuestros técnicos a entender mejor el problema</Text>

        <View style={styles.imagesContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imagePreviewContainer}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 3 && (
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                <Ionicons name="images" size={24} color={primaryColor} />
                <Text style={styles.addImageText}>Galería</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.addImageButton} onPress={handleCameraCapture}>
                <Ionicons name="camera" size={24} color={primaryColor} />
                <Text style={styles.addImageText}>Cámara</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.sectionLabel}>Método de contacto preferido:</Text>
        <View style={styles.contactMethodContainer}>
          <TouchableOpacity
            style={[styles.contactMethodOption, contactMethod === "phone" && styles.contactMethodSelected]}
            onPress={() => {
              setContactMethod("phone")
              setErrors({ ...errors, contactMethod: "" })
            }}
          >
            <Ionicons name="call" size={24} color={contactMethod === "phone" ? "white" : primaryColor} />
            <Text style={[styles.contactMethodText, contactMethod === "phone" && styles.contactMethodTextSelected]}>
              Teléfono
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactMethodOption, contactMethod === "email" && styles.contactMethodSelected]}
            onPress={() => {
              setContactMethod("email")
              setErrors({ ...errors, contactMethod: "" })
            }}
          >
            <Ionicons name="mail" size={24} color={contactMethod === "email" ? "white" : primaryColor} />
            <Text style={[styles.contactMethodText, contactMethod === "email" && styles.contactMethodTextSelected]}>
              Email
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactMethodOption, contactMethod === "whatsapp" && styles.contactMethodSelected]}
            onPress={() => {
              setContactMethod("whatsapp")
              setErrors({ ...errors, contactMethod: "" })
            }}
          >
            <Ionicons name="logo-whatsapp" size={24} color={contactMethod === "whatsapp" ? "white" : primaryColor} />
            <Text style={[styles.contactMethodText, contactMethod === "whatsapp" && styles.contactMethodTextSelected]}>
              WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
        {errors.contactMethod ? <Text style={styles.errorText}>{errors.contactMethod}</Text> : null}
      </Animated.View>
    )
  }

  // Render scheduling step
  // Update the renderSchedulingStep function to show time error
  const renderSchedulingStep = () => {
    return (
      <Animated.View entering={FadeIn.duration(300)} style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Programación</Text>
        <Text style={styles.stepDescription}>Seleccione su fecha y hora preferida para el servicio</Text>

        <View style={styles.dateTimeContainer}>
          <Text style={styles.sectionLabel}>Fecha preferida:</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar" size={20} color={primaryColor} />
            <Text style={styles.datePickerButtonText}>{formatDate(preferredDate)}</Text>
          </TouchableOpacity>
          {errors.preferredDate ? <Text style={styles.errorText}>{errors.preferredDate}</Text> : null}

          <Text style={styles.sectionLabel}>Hora preferida:</Text>
          <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time" size={20} color={primaryColor} />
            <Text style={styles.datePickerButtonText}>{formatTime(preferredTime)}</Text>
          </TouchableOpacity>
          {errors.preferredTime ? <Text style={styles.errorText}>{errors.preferredTime}</Text> : null}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen de la Solicitud</Text>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tipo de Servicio:</Text>
            <Text style={styles.summaryValue}>{getServiceTypeLabel(serviceType)}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Urgencia:</Text>
            <Chip
              style={[
                styles.urgencyChip,
                urgencyLevel === "low" && styles.lowUrgencyChip,
                urgencyLevel === "normal" && styles.normalUrgencyChip,
                urgencyLevel === "high" && styles.highUrgencyChip,
              ]}
            >
              {urgencyLevel === "low" ? "Baja" : urgencyLevel === "normal" ? "Normal" : "Alta"}
            </Chip>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Fecha y Hora:</Text>
            <Text style={styles.summaryValue}>
              {formatDate(preferredDate)} a las {formatTime(preferredTime)}
            </Text>
          </View>

          <Divider style={styles.summaryDivider} />

          <View style={styles.summaryDescriptionContainer}>
            <Text style={styles.summaryLabel}>Descripción:</Text>
            <Text style={styles.summaryDescription}>{description}</Text>
          </View>

          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Método de contacto:</Text>
            <Text style={styles.summaryValue}>
              {contactMethod === "phone" ? "Teléfono" : contactMethod === "email" ? "Email" : "WhatsApp"}
            </Text>
          </View>

          {images.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryLabel}>Imágenes adjuntas:</Text>
              <View style={styles.summaryImagesGrid}>
                {images.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.summaryImage} />
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.disclaimerContainer}>
          <Ionicons name="information-circle" size={20} color="#6b7280" />
          <Text style={styles.disclaimerText}>
            Al enviar esta solicitud, un administrador se pondrá en contacto con usted para confirmar la fecha y hora del
            servicio.
          </Text>
        </View>
      </Animated.View>
    )
  }

  // Get icon for service type
  const getIconForServiceType = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case "preventive":
        return "shield-checkmark"
      case "repair":
        return "construct"
      case "inspection":
        return "search"
      case "modernization":
        return "trending-up"
      case "new":
        return "add-circle"
      case "replacement":
        return "repeat"
      case "upgrade":
        return "arrow-up-circle"
      case "technical":
        return "help-buoy"
      case "quote":
        return "cash"
      case "info":
        return "information-circle"
      default:
        return "construct"
    }
  }

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Format time
  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Update the main return statement to include the formKey
  return (
    <KeyboardAvoidingView
      key={formKey}
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <AppHeader title="Solicitar Servicio" subtitle="Realiza una solicitud para tu ascensor" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.formCard}>
          <Card.Content>
            {renderProgressSteps()}
            {renderStepContent()}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.footer}>
        {currentStep > 1 ? (
          <Button
            mode="outlined"
            onPress={handlePrevStep}
            style={styles.footerButton}
            contentStyle={styles.footerButtonContent}
            icon="arrow-left"
            textColor="#6b7280"
          >
            Anterior
          </Button>
        ) : (
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.footerButton}
            contentStyle={styles.footerButtonContent}
            textColor="#6b7280"
          >
            Cancelar
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            mode="contained"
            onPress={handleNextStep}
            style={styles.footerButton}
            contentStyle={[styles.footerButtonContent, { flexDirection: "row-reverse" }]}
            buttonColor={primaryColor}
            icon="arrow-right"
          >
            Siguiente
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.footerButton}
            contentStyle={styles.footerButtonContent}
            buttonColor={primaryColor}
            icon="check"
          >
            Enviar Solicitud
          </Button>
        )}
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={preferredDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && <DateTimePicker value={preferredTime} mode="time" display="default" onChange={onTimeChange} />}

      {/* Alert message */}
      <AlertMessage
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        onClose={handleAlertClose}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  content: {
    padding: 16,
    paddingBottom: 100, // Extra padding for footer
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
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  progressStepCompleted: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  progressStepCurrent: {
    borderColor: primaryColor,
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
    marginHorizontal: 5,
  },
  progressLineCompleted: {
    backgroundColor: primaryColor,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  requestTypeContainer: {
    marginBottom: 20,
  },
  segmentedButtons: {
    backgroundColor: "#f3f4f6",
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  serviceTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  serviceTypeCard: {
    width: (width - 64) / 2,
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  serviceTypeCardSelected: {
    borderColor: primaryColor,
    backgroundColor: "#fef9c3",
  },
  serviceTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff7e6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceTypeIconSelected: {
    backgroundColor: primaryColor,
  },
  serviceTypeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    textAlign: "center",
  },
  serviceTypeTextSelected: {
    color: primaryColor,
    fontWeight: "600",
  },
  urgencyContainer: {
    marginBottom: 20,
  },
  urgencyOptions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  urgencyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  urgencyOptionSelected: {
    borderColor: primaryColor,
    backgroundColor: "#fef9c3",
  },
  urgencyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  textArea: {
    marginBottom: 20,
    backgroundColor: "white",
    minHeight: 120,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    marginBottom: 12,
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  imageButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 212, // Width of two buttons plus margin
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    marginRight: 12,
    marginBottom: 12,
  },
  addImageText: {
    marginTop: 8,
    fontSize: 12,
    color: primaryColor,
  },
  contactMethodContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  contactMethodOption: {
    width: (width - 64) / 3.5,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  contactMethodSelected: {
    borderColor: primaryColor,
    backgroundColor: primaryColor,
  },
  contactMethodText: {
    marginTop: 8,
    fontSize: 12,
    color: "#4b5563",
  },
  contactMethodTextSelected: {
    color: "white",
  },
  availabilityContainer: {
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedDayChip: {
    backgroundColor: primaryColor,
  },
  dayChipText: {
    color: "#4b5563",
    fontWeight: "500",
  },
  selectedDayChipText: {
    color: "white",
  },
  timeSlotContainer: {
    marginBottom: 16,
  },
  timeSlotButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginBottom: 8,
  },
  selectedTimeSlot: {
    backgroundColor: primaryColor,
  },
  timeSlotText: {
    color: "#4b5563",
    fontWeight: "500",
  },
  selectedTimeSlotText: {
    color: "white",
  },
  summaryContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  summaryDaysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    flex: 1,
    justifyContent: "flex-end",
  },
  summaryDayValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  urgencyChip: {
    height: 28,
  },
  lowUrgencyChip: {
    backgroundColor: "#dcfce7",
  },
  normalUrgencyChip: {
    backgroundColor: "#fef9c3",
  },
  highUrgencyChip: {
    backgroundColor: "#fee2e2",
  },
  summaryDivider: {
    marginVertical: 12,
  },
  summaryDescriptionContainer: {
    marginBottom: 12,
  },
  summaryDescription: {
    fontSize: 14,
    color: "#1f2937",
    marginTop: 8,
    lineHeight: 20,
  },
  disclaimerContainer: {
    flexDirection: "row",
    backgroundColor: "#fff7e6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  footerButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  footerButtonContent: {
    height: 48,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  dateTimeContainer: {
    marginBottom: 20,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 8,
  },
  summaryImagesContainer: {
    marginTop: 12,
  },
  summaryImagesGrid: {
    flexDirection: "row",
    marginTop: 8,
  },
  summaryImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
})
