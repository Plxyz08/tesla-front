"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native"
import { Card, Button, TextInput, RadioButton } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import AlertMessage from "../../components/alertMessage"
import AppHeader from "../../components/AppHeader"

export default function ScheduleMeetingScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { addNotification } = useApp()

  // Estado para el formulario
  const [meetingType, setMeetingType] = useState("virtual")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("")

  // Estado para alertas
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  // Estado para validación
  const [errors, setErrors] = useState({
    subject: "",
    preferredDays: "",
    preferredTimeSlot: "",
  })

  // Opciones para días preferidos
  const dayOptions = [
    { label: "Lunes", value: "monday" },
    { label: "Martes", value: "tuesday" },
    { label: "Miércoles", value: "wednesday" },
    { label: "Jueves", value: "thursday" },
    { label: "Viernes", value: "friday" },
  ]

  // Opciones para horarios preferidos
  const timeSlotOptions = [
    { label: "Mañana (9:00 - 12:00)", value: "morning" },
    { label: "Tarde (14:00 - 17:00)", value: "afternoon" },
  ]

  // Manejar selección de días preferidos
  const togglePreferredDay = (day: string) => {
    if (preferredDays.includes(day)) {
      setPreferredDays(preferredDays.filter((d) => d !== day))
    } else {
      setPreferredDays([...preferredDays, day])
    }
    setErrors({ ...errors, preferredDays: "" })
  }

  // Validar formulario
  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    if (!subject.trim()) {
      newErrors.subject = "El asunto es requerido"
      isValid = false
    } else {
      newErrors.subject = ""
    }

    if (preferredDays.length === 0) {
      newErrors.preferredDays = "Seleccione al menos un día preferido"
      isValid = false
    } else {
      newErrors.preferredDays = ""
    }

    if (!preferredTimeSlot) {
      newErrors.preferredTimeSlot = "Seleccione un horario preferido"
      isValid = false
    } else {
      newErrors.preferredTimeSlot = ""
    }

    setErrors(newErrors)
    return isValid
  }

  // Enviar solicitud de reunión
  const handleSubmit = () => {
    if (!validateForm()) return

    // En una implementación real, esto enviaría datos a una API
    // Aquí simulamos el proceso

    // Crear notificación para el administrador
    addNotification({
      title: "Nueva solicitud de reunión",
      message: `El cliente ${user?.name} ha solicitado una reunión sobre: ${subject}`,
      type: "task",
    })

    // Mostrar mensaje de éxito
    setAlertData({
      title: "Solicitud Enviada",
      message:
        "Su solicitud de reunión ha sido enviada con éxito. Nos pondremos en contacto pronto para confirmar los detalles.",
    })
    setShowAlert(true)
  }

  // Manejar cierre de alerta y navegación
  const handleAlertClose = () => {
    setShowAlert(false)
    navigation.goBack()
  }

  // Obtener etiqueta del día
  const getDayLabel = (value: string) => {
    const option = dayOptions.find((day) => day.value === value)
    return option ? option.label : value
  }

  // Obtener etiqueta del horario
  const getTimeSlotLabel = (value: string) => {
    const option = timeSlotOptions.find((slot) => slot.value === value)
    return option ? option.label : value
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Programar Reunión" subtitle="Solicita una reunión con nuestro equipo" showBackButton={true} />

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.formCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Detalles de la Reunión</Text>

            {/* Tipo de reunión */}
            <Text style={styles.inputLabel}>Tipo de Reunión</Text>
            <View style={styles.radioGroup}>
              <View style={styles.radioButton}>
                <RadioButton
                  value="virtual"
                  status={meetingType === "virtual" ? "checked" : "unchecked"}
                  onPress={() => setMeetingType("virtual")}
                  color="#efb810"
                />
                <Text style={styles.radioLabel}>Virtual</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton
                  value="inPerson"
                  status={meetingType === "inPerson" ? "checked" : "unchecked"}
                  onPress={() => setMeetingType("inPerson")}
                  color="#efb810"
                />
                <Text style={styles.radioLabel}>Presencial</Text>
              </View>
            </View>

            {/* Asunto */}
            <TextInput
              label="Asunto *"
              value={subject}
              onChangeText={(text) => {
                setSubject(text)
                if (text.trim()) setErrors({ ...errors, subject: "" })
              }}
              mode="outlined"
              style={styles.input}
              error={!!errors.subject}
              outlineColor="#e5e7eb"
              activeOutlineColor="#efb810"
            />
            {errors.subject ? <Text style={styles.errorText}>{errors.subject}</Text> : null}

            {/* Descripción */}
            <TextInput
              label="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea]}
              outlineColor="#e5e7eb"
              activeOutlineColor="#efb810"
            />

            {/* Disponibilidad */}
            <Text style={styles.sectionSubtitle}>Disponibilidad</Text>

            <Text style={styles.inputLabel}>Seleccione días preferidos *</Text>
            <View style={styles.daysGrid}>
              {dayOptions.map((day) => (
                <TouchableOpacity
                  key={day.value}
                  style={[styles.dayChip, preferredDays.includes(day.value) ? styles.selectedDayChip : null]}
                  onPress={() => togglePreferredDay(day.value)}
                >
                  <Text
                    style={[styles.dayChipText, preferredDays.includes(day.value) ? styles.selectedDayChipText : null]}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.preferredDays ? <Text style={styles.errorText}>{errors.preferredDays}</Text> : null}

            <Text style={styles.inputLabel}>Horario preferido *</Text>
            <View style={styles.timeSlotContainer}>
              {timeSlotOptions.map((slot) => (
                <TouchableOpacity
                  key={slot.value}
                  style={[styles.timeSlotButton, preferredTimeSlot === slot.value ? styles.selectedTimeSlot : null]}
                  onPress={() => {
                    setPreferredTimeSlot(slot.value)
                    setErrors({ ...errors, preferredTimeSlot: "" })
                  }}
                >
                  <Text
                    style={[styles.timeSlotText, preferredTimeSlot === slot.value ? styles.selectedTimeSlotText : null]}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.preferredTimeSlot ? <Text style={styles.errorText}>{errors.preferredTimeSlot}</Text> : null}

            {/* Resumen */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Resumen de la Solicitud</Text>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Tipo de reunión:</Text>
                <Text style={styles.summaryValue}>{meetingType === "virtual" ? "Virtual" : "Presencial"}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Asunto:</Text>
                <Text style={styles.summaryValue}>{subject}</Text>
              </View>

              {description.trim() && (
                <View style={styles.summaryDescriptionContainer}>
                  <Text style={styles.summaryLabel}>Descripción:</Text>
                  <Text style={styles.summaryDescription}>{description}</Text>
                </View>
              )}

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Días preferidos:</Text>
                <View style={styles.summaryDaysContainer}>
                  {preferredDays.map((day, index) => (
                    <Text key={day} style={styles.summaryDayValue}>
                      {getDayLabel(day)}
                      {index < preferredDays.length - 1 ? ", " : ""}
                    </Text>
                  ))}
                </View>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Franja horaria:</Text>
                <Text style={styles.summaryValue}>{preferredTimeSlot ? getTimeSlotLabel(preferredTimeSlot) : ""}</Text>
              </View>
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.infoText}>
                Las reuniones están sujetas a disponibilidad. Un administrador confirmará la fecha y hora exacta de la
                reunión.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Botones de acción */}
      <View style={styles.footer}>
        <Button mode="outlined" textColor="#6b7280" style={styles.cancelButton} onPress={() => navigation.goBack()}>
          Cancelar
        </Button>
        <Button mode="contained" buttonColor="#efb810" style={styles.submitButton} onPress={handleSubmit}>
          Enviar Solicitud
        </Button>
      </View>

      {/* Alerta de éxito */}
      <AlertMessage
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        onClose={handleAlertClose}
      />
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
    paddingBottom: 100, // Extra padding for footer
  },
  formCard: {
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 24,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  radioGroup: {
    flexDirection: "row",
    marginBottom: 16,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  radioLabel: {
    fontSize: 16,
    color: "#1f2937",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  textArea: {
    minHeight: 100,
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
    backgroundColor: "#efb810",
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
    backgroundColor: "#efb810",
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
  summaryDescriptionContainer: {
    marginBottom: 12,
  },
  summaryDescription: {
    fontSize: 14,
    color: "#1f2937",
    marginTop: 8,
    lineHeight: 20,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#fff7e6",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    color: "#6b7280",
    flex: 1,
    fontSize: 12,
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
  cancelButton: {
    flex: 1,
    marginRight: 8,
    borderColor: "#d1d5db",
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
})
