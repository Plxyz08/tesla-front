"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native"
import { Card, Button, TextInput, RadioButton } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import AlertMessage from "../../components/alertMessage"

export default function ScheduleMeetingScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { addNotification } = useApp()

  // Estado para el formulario
  const [meetingType, setMeetingType] = useState("virtual")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [preferredDays, setPreferredDays] = useState<string[]>([])
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("")

  // Estado para alertas
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  // Estado para validación
  const [errors, setErrors] = useState({
    subject: "",
    date: "",
    time: "",
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

  // Manejar cambio de fecha
  const onDateChange = (event: unknown, selectedDate: Date | undefined) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setDate(selectedDate)
      setErrors({ ...errors, date: "" })
    }
  }

  // Manejar cambio de hora
  const onTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setTime(selectedTime)
      setErrors({ ...errors, time: "" })
    }
  }

  // Manejar selección de días preferidos
interface Errors {
    subject: string;
    date: string;
    time: string;
    preferredTimeSlot: string;
}

interface AlertData {
    title: string;
    message: string;
}

interface DayOption {
    label: string;
    value: string;
}

interface TimeSlotOption {
    label: string;
    value: string;
}

const togglePreferredDay = (day: string) => {
    if (preferredDays.includes(day)) {
        setPreferredDays(preferredDays.filter((d) => d !== day));
    } else {
        setPreferredDays([...preferredDays, day]);
    }
};

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

    // Si no hay días preferidos seleccionados, validar fecha específica
    if (preferredDays.length === 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (date < today) {
        newErrors.date = "La fecha no puede ser en el pasado"
        isValid = false
      } else {
        newErrors.date = ""
      }
    }

    // Si no hay horario preferido seleccionado, validar hora específica
    if (!preferredTimeSlot && preferredDays.length === 0) {
      const now = new Date()
      const selectedDateTime = new Date(date)
      selectedDateTime.setHours(time.getHours(), time.getMinutes())

      if (selectedDateTime < now) {
        newErrors.time = "La hora no puede ser en el pasado"
        isValid = false
      } else {
        newErrors.time = ""
      }
    }

    // Si hay días preferidos pero no horario preferido
    if (preferredDays.length > 0 && !preferredTimeSlot) {
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

  // Formatear fecha para mostrar
const formatDate = (date: Date): string => {
    return date.toLocaleDateString()
}

  // Formatear hora para mostrar
const formatTime = (time: Date): string => {
    return time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0284c7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Programar Reunión</Text>
        <View style={{ width: 24 }} />
      </View>

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
                  color="#0284c7"
                />
                <Text style={styles.radioLabel}>Virtual</Text>
              </View>
              <View style={styles.radioButton}>
                <RadioButton
                  value="inPerson"
                  status={meetingType === "inPerson" ? "checked" : "unchecked"}
                  onPress={() => setMeetingType("inPerson")}
                  color="#0284c7"
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
            />

            {/* Opciones de programación */}
            <Text style={styles.sectionSubtitle}>Opciones de Programación</Text>

            <View style={styles.schedulingOptions}>
              <View style={styles.optionTabs}>
                <TouchableOpacity
                  style={[styles.optionTab, preferredDays.length === 0 ? styles.activeOptionTab : null]}
                  onPress={() => setPreferredDays([])}
                >
                  <Text style={preferredDays.length === 0 ? styles.activeOptionText : styles.optionText}>
                    Fecha Específica
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionTab, preferredDays.length > 0 ? styles.activeOptionTab : null]}
                  onPress={() => (preferredDays.length === 0 ? togglePreferredDay("monday") : null)}
                >
                  <Text style={preferredDays.length > 0 ? styles.activeOptionText : styles.optionText}>
                    Días Preferidos
                  </Text>
                </TouchableOpacity>
              </View>

              {preferredDays.length === 0 ? (
                // Opción de fecha específica
                <View style={styles.specificDateContainer}>
                  <Text style={styles.inputLabel}>Fecha *</Text>
                  <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar" size={20} color="#0284c7" />
                    <Text style={styles.datePickerButtonText}>{formatDate(date)}</Text>
                  </TouchableOpacity>
                  {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

                  <Text style={styles.inputLabel}>Hora *</Text>
                  <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowTimePicker(true)}>
                    <Ionicons name="time" size={20} color="#0284c7" />
                    <Text style={styles.datePickerButtonText}>{formatTime(time)}</Text>
                  </TouchableOpacity>
                  {errors.time ? <Text style={styles.errorText}>{errors.time}</Text> : null}
                </View>
              ) : (
                // Opción de días preferidos
                <View style={styles.preferredDaysContainer}>
                  <Text style={styles.inputLabel}>Seleccione días preferidos *</Text>
                  <View style={styles.daysGrid}>
                    {dayOptions.map((day) => (
                      <TouchableOpacity
                        key={day.value}
                        style={[styles.dayChip, preferredDays.includes(day.value) ? styles.selectedDayChip : null]}
                        onPress={() => togglePreferredDay(day.value)}
                      >
                        <Text
                          style={[
                            styles.dayChipText,
                            preferredDays.includes(day.value) ? styles.selectedDayChipText : null,
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Horario preferido *</Text>
                  <View style={styles.timeSlotContainer}>
                    {timeSlotOptions.map((slot) => (
                      <TouchableOpacity
                        key={slot.value}
                        style={[
                          styles.timeSlotButton,
                          preferredTimeSlot === slot.value ? styles.selectedTimeSlot : null,
                        ]}
                        onPress={() => {
                          setPreferredTimeSlot(slot.value)
                          setErrors({ ...errors, preferredTimeSlot: "" })
                        }}
                      >
                        <Text
                          style={[
                            styles.timeSlotText,
                            preferredTimeSlot === slot.value ? styles.selectedTimeSlotText : null,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {errors.preferredTimeSlot ? <Text style={styles.errorText}>{errors.preferredTimeSlot}</Text> : null}
                </View>
              )}
            </View>

            {/* Información adicional */}
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={20} color="#6b7280" />
              <Text style={styles.infoText}>
                Las reuniones están sujetas a disponibilidad. Recibirá una confirmación por correo electrónico.
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
        <Button mode="contained" buttonColor="#0284c7" style={styles.submitButton} onPress={handleSubmit}>
          Enviar Solicitud
        </Button>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
      )}

      {/* Time Picker */}
      {showTimePicker && <DateTimePicker value={time} mode="time" display="default" onChange={onTimeChange} />}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
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
  schedulingOptions: {
    marginBottom: 16,
  },
  optionTabs: {
    flexDirection: "row",
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  activeOptionTab: {
    backgroundColor: "#0284c7",
  },
  optionText: {
    color: "#4b5563",
    fontWeight: "500",
  },
  activeOptionText: {
    color: "white",
    fontWeight: "500",
  },
  specificDateContainer: {
    marginBottom: 16,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0f2fe",
    marginBottom: 16,
  },
  datePickerButtonText: {
    marginLeft: 12,
    color: "#0284c7",
    fontWeight: "500",
  },
  preferredDaysContainer: {
    marginBottom: 16,
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
    backgroundColor: "#0284c7",
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
    backgroundColor: "#0284c7",
  },
  timeSlotText: {
    color: "#4b5563",
    fontWeight: "500",
  },
  selectedTimeSlotText: {
    color: "white",
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    marginLeft: 8,
    color: "#6b7280",
    flex: 1,
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

