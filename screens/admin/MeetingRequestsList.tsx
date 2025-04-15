"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView, // Import ScrollView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import AppHeader from "../../components/AppHeader"
import { useAuth } from "../../context/AuthContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Tipo para las solicitudes de reunión
interface MeetingRequest {
  id: string
  clientId: string
  clientName: string
  clientAddress: string
  clientPhone: string
  requestDate: Date
  preferredDates: {
    date: Date
    timeRanges: string[] // Por ejemplo: ["mañana", "tarde"]
  }[]
  status: "pending" | "confirmed" | "rescheduled" | "cancelled"
  confirmationDate?: Date
  notes?: string
  elevatorModel?: string
  urgency: "low" | "medium" | "high"
  reason: string
}

// Datos de ejemplo para desarrollo
const MOCK_MEETING_REQUESTS: MeetingRequest[] = [
  {
    id: "1",
    clientId: "client123",
    clientName: "Edificio Torres del Parque",
    clientAddress: "Calle 26 #7-50, Bogotá",
    clientPhone: "601-3456789",
    requestDate: new Date(2023, 5, 15, 9, 0),
    preferredDates: [
      {
        date: new Date(2023, 5, 20),
        timeRanges: ["mañana"],
      },
      {
        date: new Date(2023, 5, 21),
        timeRanges: ["tarde"],
      },
    ],
    status: "pending",
    elevatorModel: "TL-2000",
    urgency: "medium",
    reason: "Mantenimiento preventivo semestral",
  },
  {
    id: "2",
    clientId: "client456",
    clientName: "Centro Comercial Andino",
    clientAddress: "Carrera 11 #82-71, Bogotá",
    clientPhone: "601-2345678",
    requestDate: new Date(2023, 5, 14, 15, 30),
    preferredDates: [
      {
        date: new Date(2023, 5, 22),
        timeRanges: ["mañana", "tarde"],
      },
    ],
    status: "confirmed",
    confirmationDate: new Date(2023, 5, 22, 10, 0),
    elevatorModel: "TL-3000",
    urgency: "high",
    reason: "Falla en sistema de nivelación",
    notes: "Cliente reporta ruidos extraños al detenerse",
  },
  {
    id: "3",
    clientId: "client789",
    clientName: "Hospital Santa Fe",
    clientAddress: "Calle 119 #7-75, Bogotá",
    clientPhone: "601-6789012",
    requestDate: new Date(2023, 5, 10, 8, 15),
    preferredDates: [
      {
        date: new Date(2023, 5, 18),
        timeRanges: ["mañana"],
      },
    ],
    status: "rescheduled",
    confirmationDate: new Date(2023, 5, 25, 9, 0),
    elevatorModel: "TL-5000 Medical",
    urgency: "high",
    reason: "Actualización de software de seguridad",
    notes: "Reprogramado a petición del cliente",
  },
  {
    id: "4",
    clientId: "client101",
    clientName: "Residencial Parque Central",
    clientAddress: "Carrera 15 #85-24, Bogotá",
    clientPhone: "601-8901234",
    requestDate: new Date(2023, 5, 12, 11, 45),
    preferredDates: [
      {
        date: new Date(2023, 5, 19),
        timeRanges: ["tarde"],
      },
      {
        date: new Date(2023, 5, 23),
        timeRanges: ["mañana"],
      },
    ],
    status: "pending",
    elevatorModel: "TL-1500",
    urgency: "low",
    reason: "Inspección anual",
  },
  {
    id: "5",
    clientId: "client202",
    clientName: "Torre Colpatria",
    clientAddress: "Carrera 7 #24-89, Bogotá",
    clientPhone: "601-9012345",
    requestDate: new Date(2023, 5, 8, 14, 0),
    preferredDates: [
      {
        date: new Date(2023, 5, 17),
        timeRanges: ["mañana", "tarde"],
      },
    ],
    status: "cancelled",
    elevatorModel: "TL-8000 High-Rise",
    urgency: "medium",
    reason: "Modernización de cabina",
    notes: "Cancelado por cambio de proveedor",
  },
]

/**
 * Componente para gestionar las solicitudes de reuniones de los clientes
 * Permite al administrador ver, confirmar, reagendar y cancelar solicitudes
 */
const MeetingRequestsList: React.FC = () => {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [meetingRequests, setMeetingRequests] = useState<MeetingRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MeetingRequest[]>([])
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<MeetingRequest | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [confirmationDate, setConfirmationDate] = useState(new Date())
  const [confirmationTime, setConfirmationTime] = useState(new Date())
  const [confirmationNotes, setConfirmationNotes] = useState("")

  // Cargar datos de solicitudes (simulado)
  useEffect(() => {
    // Aquí se haría la llamada a la API para obtener las solicitudes reales
    setTimeout(() => {
      setMeetingRequests(MOCK_MEETING_REQUESTS)
      setFilteredRequests(MOCK_MEETING_REQUESTS)
      setIsLoading(false)
    }, 1000)
  }, [])

  // Filtrar solicitudes según el filtro activo y la búsqueda
  useEffect(() => {
    let filtered = [...meetingRequests]

    // Aplicar filtro de estado
    if (activeFilter !== "all") {
      filtered = filtered.filter((request) => request.status === activeFilter)
    }

    // Aplicar búsqueda
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (request) =>
          request.clientName.toLowerCase().includes(query) ||
          request.reason.toLowerCase().includes(query) ||
          request.elevatorModel?.toLowerCase().includes(query),
      )
    }

    setFilteredRequests(filtered)
  }, [activeFilter, searchQuery, meetingRequests])

  // Manejar la confirmación de una reunión
  const handleConfirmMeeting = () => {
    if (!selectedRequest) return

    // Combinar fecha y hora seleccionadas
    const combinedDateTime = new Date(confirmationDate)
    combinedDateTime.setHours(confirmationTime.getHours())
    combinedDateTime.setMinutes(confirmationTime.getMinutes())

    // Actualizar el estado de la solicitud (en producción, esto sería una llamada a la API)
    const updatedRequests = meetingRequests.map((request) => {
      if (request.id === selectedRequest.id) {
        return {
          ...request,
          status: "confirmed" as const,
          confirmationDate: combinedDateTime,
          notes: confirmationNotes || request.notes,
        }
      }
      return request
    })

    setMeetingRequests(updatedRequests)

    // Mostrar confirmación al usuario
    Alert.alert(
      "Reunión Confirmada",
      `La reunión con ${selectedRequest.clientName} ha sido programada para el ${format(
        combinedDateTime,
        "PPP 'a las' p",
        {
          locale: es,
        },
      )}`,
      [{ text: "OK" }],
    )

    // Limpiar el estado
    setSelectedRequest(null)
    setConfirmationNotes("")
  }

  // Manejar la cancelación de una reunión
  const handleCancelMeeting = (request: MeetingRequest) => {
    Alert.alert("Cancelar Solicitud", `¿Estás seguro de que deseas cancelar la solicitud de ${request.clientName}?`, [
      { text: "No", style: "cancel" },
      {
        text: "Sí, Cancelar",
        style: "destructive",
        onPress: () => {
          // Actualizar el estado de la solicitud (en producción, esto sería una llamada a la API)
          const updatedRequests = meetingRequests.map((item) => {
            if (item.id === request.id) {
              return {
                ...item,
                status: "cancelled" as const,
              }
            }
            return item
          })

          setMeetingRequests(updatedRequests)

          // Mostrar confirmación al usuario
          Alert.alert("Solicitud Cancelada", "La solicitud ha sido cancelada correctamente.")
        },
      },
    ])
  }

  // Renderizar cada elemento de la lista de solicitudes
  const renderMeetingRequestItem = ({ item }: { item: MeetingRequest }) => {
    // Determinar el color según la urgencia
    const urgencyColors = {
      low: "#22c55e", // Verde
      medium: "#f59e0b", // Ámbar
      high: "#ef4444", // Rojo
    }

    // Determinar el color según el estado
    const statusColors = {
      pending: "#f59e0b", // Ámbar
      confirmed: "#22c55e", // Verde
      rescheduled: "#3b82f6", // Azul
      cancelled: "#6b7280", // Gris
    }

    // Traducir el estado para mostrar
    const statusText = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      rescheduled: "Reagendada",
      cancelled: "Cancelada",
    }

    // Traducir la urgencia para mostrar
    const urgencyText = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
    }

    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.clientName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
              <Text style={styles.statusText}>{statusText[item.status]}</Text>
            </View>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors[item.urgency] }]}>
            <Text style={styles.urgencyText}>Urgencia: {urgencyText[item.urgency]}</Text>
          </View>
        </View>

        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.clientAddress}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.clientPhone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              Solicitado: {format(new Date(item.requestDate), "PPP", { locale: es })}
            </Text>
          </View>
          {item.confirmationDate && (
            <View style={styles.detailRow}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#22c55e" />
              <Text style={styles.detailText}>
                Confirmado: {format(new Date(item.confirmationDate), "PPP 'a las' p", { locale: es })}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="construct-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Modelo: {item.elevatorModel || "No especificado"}</Text>
          </View>
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Motivo:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas:</Text>
              <Text style={styles.notesText}>{item.notes}</Text>
            </View>
          )}

          <Text style={styles.preferredDatesLabel}>Fechas preferidas:</Text>
          {item.preferredDates.map((preferred, index) => (
            <View key={index} style={styles.preferredDateItem}>
              <Text style={styles.preferredDateText}>
                {format(new Date(preferred.date), "EEEE d 'de' MMMM", { locale: es })}
              </Text>
              <Text style={styles.preferredTimeText}>Horario: {preferred.timeRanges.join(", ")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionButtons}>
          {item.status === "pending" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => {
                setSelectedRequest(item)
                setConfirmationDate(new Date())
                setConfirmationTime(new Date())
                setConfirmationNotes("")
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Confirmar</Text>
            </TouchableOpacity>
          )}

          {(item.status === "pending" || item.status === "confirmed") && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => {
                // Aquí iría la lógica para reagendar
                Alert.alert("Reagendar", "Funcionalidad de reagendación en desarrollo")
              }}
            >
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Reagendar</Text>
            </TouchableOpacity>
          )}

          {item.status !== "cancelled" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelMeeting(item)}
            >
              <Ionicons name="close-circle-outline" size={18} color="white" />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    )
  }

  // Renderizar el componente de confirmación de reunión
  const renderConfirmationModal = () => {
    if (!selectedRequest) return null

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Confirmar Reunión</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedRequest(null)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalClientName}>{selectedRequest.clientName}</Text>
          <Text style={styles.modalReason}>{selectedRequest.reason}</Text>

          <View style={styles.datePickerContainer}>
            <Text style={styles.datePickerLabel}>Fecha de la reunión:</Text>
            <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={20} color="#7c3aed" />
              <Text style={styles.datePickerButtonText}>
                {format(confirmationDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={confirmationDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false)
                  if (selectedDate) {
                    setConfirmationDate(selectedDate)
                  }
                }}
                minimumDate={new Date()}
              />
            )}
          </View>

          <View style={styles.timePickerContainer}>
            <Text style={styles.timePickerLabel}>Hora de la reunión:</Text>
            <TouchableOpacity style={styles.timePickerButton} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={20} color="#7c3aed" />
              <Text style={styles.timePickerButtonText}>{format(confirmationTime, "h:mm a", { locale: es })}</Text>
            </TouchableOpacity>

            {showTimePicker && (
              <DateTimePicker
                value={confirmationTime}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowTimePicker(false)
                  if (selectedTime) {
                    setConfirmationTime(selectedTime)
                  }
                }}
              />
            )}
          </View>

          <View style={styles.notesInputContainer}>
            <Text style={styles.notesInputLabel}>Notas adicionales:</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Añade notas o instrucciones para el cliente"
              multiline
              numberOfLines={3}
              value={confirmationNotes}
              onChangeText={setConfirmationNotes}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelModalButton]}
              onPress={() => setSelectedRequest(null)}
            >
              <Text style={styles.cancelModalButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.confirmModalButton]} onPress={handleConfirmMeeting}>
              <Text style={styles.confirmModalButtonText}>Confirmar Reunión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  // Componente para los filtros de estado
  const StatusFilter = () => {
    const filters = [
      { id: "all", label: "Todas" },
      { id: "pending", label: "Pendientes" },
      { id: "confirmed", label: "Confirmadas" },
      { id: "rescheduled", label: "Reagendadas" },
      { id: "cancelled", label: "Canceladas" },
    ]

    return (
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScrollView}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterButton, activeFilter === filter.id && styles.activeFilterButton]}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text style={[styles.filterButtonText, activeFilter === filter.id && styles.activeFilterButtonText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    )
  }

  // Renderizar el componente principal
  return (
    <View style={styles.container}>
      <AppHeader
        title="Solicitudes de Reuniones"
        subtitle="Gestiona las solicitudes de los clientes"
        showBackButton
        rightComponent={
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por cliente, motivo o modelo..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      <StatusFilter />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay solicitudes</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "No se encontraron resultados para tu búsqueda"
              : activeFilter !== "all"
                ? `No hay solicitudes con estado "${
                    activeFilter === "pending"
                      ? "pendiente"
                      : activeFilter === "confirmed"
                        ? "confirmada"
                        : activeFilter === "rescheduled"
                          ? "reagendada"
                          : "cancelada"
                  }"`
                : "No hay solicitudes de reuniones disponibles"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderMeetingRequestItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedRequest && renderConfirmationModal()}
    </View>
  )
}

// Estilos del componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  filtersScrollView: {
    paddingRight: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  activeFilterButton: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  activeFilterButtonText: {
    color: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4b5563",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  requestDetails: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 8,
  },
  reasonContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#1f2937",
  },
  notesContainer: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: "#4b5563",
    fontStyle: "italic",
  },
  preferredDatesLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4b5563",
    marginBottom: 8,
  },
  preferredDateItem: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  preferredDateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    textTransform: "capitalize",
  },
  preferredTimeText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textTransform: "capitalize",
  },
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  confirmButton: {
    backgroundColor: "#22c55e",
  },
  rescheduleButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalClientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modalReason: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 20,
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 8,
    textTransform: "capitalize",
  },
  timePickerContainer: {
    marginBottom: 16,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 8,
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
  },
  timePickerButtonText: {
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 8,
  },
  notesInputContainer: {
    marginBottom: 20,
  },
  notesInputLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#1f2937",
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelModalButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelModalButtonText: {
    color: "#4b5563",
    fontWeight: "500",
    fontSize: 16,
  },
  confirmModalButton: {
    backgroundColor: "#7c3aed",
  },
  confirmModalButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
})

export default MeetingRequestsList
