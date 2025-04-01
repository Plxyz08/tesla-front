"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Chip, Divider, ActivityIndicator, SegmentedButtons } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { WorkSession } from "../../models/technician"
import { Calendar } from "react-native-calendars"

// Define the green color palette
const COLORS = {
  primary: "#059669", // Green 600
  primaryDark: "#047857", // Green 700
  primaryLight: "#10b981", // Green 500
  primaryLighter: "#d1fae5", // Green 100
  primaryLightest: "#ecfdf5", // Green 50
  secondary: "#0284c7", // Blue 600
  secondaryLight: "#e0f2fe", // Blue 100
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

export default function TimeHistoryScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [workSessions, setWorkSessions] = useState<WorkSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<WorkSession[]>([])
  const [viewMode, setViewMode] = useState("list")
  const [selectedDate, setSelectedDate] = useState("")
  const [markedDates, setMarkedDates] = useState<any>({})
  const [stats, setStats] = useState({
    totalHours: 0,
    totalBreakHours: 0,
    averageHoursPerDay: 0,
  })

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchTimeHistory()
    }, []),
  )

  // Apply filters when selected date changes
  useEffect(() => {
    if (selectedDate) {
      const sessionsOnDate = workSessions.filter((session) => session.date === selectedDate)
      setFilteredSessions(sessionsOnDate)
    } else {
      setFilteredSessions(workSessions)
    }
  }, [selectedDate, workSessions])

  // Calculate stats when work sessions change
  useEffect(() => {
    calculateStats()
  }, [workSessions])

  // Fetch time history
  const fetchTimeHistory = async () => {
    setIsLoading(true)

    try {
      const response = await technicianApi.workSessions.getAll(user?.id || "")

      if (response.success) {
        // Sort by date (newest first)
        const sortedSessions = [...response.data].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        )

        setWorkSessions(sortedSessions)
        setFilteredSessions(sortedSessions)

        // Generate marked dates for calendar
        generateMarkedDates(sortedSessions)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error fetching time history:", error)
      Alert.alert("Error", "No se pudo cargar el historial de tiempo.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
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
  
      // Create a new date object with the correct date
      // This ensures we're working with the Colombia timezone (UTC-5)
      const adjustedDate = new Date(date)
      adjustedDate.setDate(adjustedDate.getDate() + 1) // Add one day to fix the timezone issue
  
      // Return in YYYY-MM-DD format
      return adjustedDate.toISOString().split("T")[0]
    } catch (error) {
      console.error("Error adjusting date:", error)
      return dateString
    }
  }

  // Handle date selection
  const handleDateSelect = (day: any) => {
    const dateString = adjustDateForTimezone(day.dateString) // Ajustar la fecha según la zona horaria
  
    if (selectedDate === dateString) {
      // Si la misma fecha es seleccionada nuevamente, limpiar la selección
      setSelectedDate("")
      setFilteredSessions(workSessions) // Mostrar todas las sesiones
    } else {
      setSelectedDate(dateString)
  
      // Filtrar sesiones para mostrar exactamente las del día seleccionado
      const sessionsOnDate = workSessions.filter((session) => {
        // Convertir ambas fechas a formato ISO sin la parte de la hora para comparar solo las fechas
        const sessionDate = adjustDateForTimezone(new Date(session.date).toISOString().split("T")[0])
        return sessionDate === dateString
      })
  
      setFilteredSessions(sessionsOnDate)
    }
  
    // Actualizar marcas en el calendario
    const updatedMarkedDates = { ...markedDates }
  
    // Restablecer la selección anterior
    if (selectedDate && updatedMarkedDates[selectedDate]) {
      updatedMarkedDates[selectedDate] = {
        ...updatedMarkedDates[selectedDate],
        selected: false,
        selectedColor: undefined,
        customStyles: {
          ...updatedMarkedDates[selectedDate].customStyles,
          container: {
            backgroundColor: undefined,
          },
          text: {
            color: undefined,
          },
        },
      }
    }
  
    // Establecer nueva selección
    if (dateString !== selectedDate && updatedMarkedDates[dateString]) {
      updatedMarkedDates[dateString] = {
        ...updatedMarkedDates[dateString],
        selected: true,
        selectedColor: COLORS.primary,
        customStyles: {
          ...updatedMarkedDates[dateString]?.customStyles,
          container: {
            backgroundColor: COLORS.primary,
          },
          text: {
            color: "white",
          },
        },
      }
    }
  
    setMarkedDates(updatedMarkedDates)
  }

  // Generate marked dates for calendar
  const generateMarkedDates = (sessions: WorkSession[]) => {
    const dates: any = {}
  
    // Agrupar sesiones por fecha
    const sessionsByDate: Record<string, WorkSession[]> = {}
  
    sessions.forEach((session) => {
      // Asegurarse de que la fecha esté en formato YYYY-MM-DD
      const sessionDate = adjustDateForTimezone(session.date)
  
      if (!sessionsByDate[sessionDate]) {
        sessionsByDate[sessionDate] = []
      }
      sessionsByDate[sessionDate].push(session)
    })
  
    // Marcar fechas con sesiones
    Object.entries(sessionsByDate).forEach(([date, sessionsOnDate]) => {
      // Calcular duración total para el día
      const totalDuration = sessionsOnDate.reduce((total, session) => {
        return total + (session.duration || 0)
      }, 0)
  
      // Determinar color basado en duración (más horas = color más oscuro)
      let dotColor = COLORS.primaryLighter // Verde claro por defecto
      let textColor = COLORS.primary
  
      if (totalDuration > 480) {
        // Más de 8 horas
        dotColor = COLORS.primary // Verde oscuro
        textColor = COLORS.primary
      } else if (totalDuration > 360) {
        // Más de 6 horas
        dotColor = COLORS.primaryLight // Verde medio
        textColor = COLORS.primary
      } else if (totalDuration > 240) {
        // Más de 4 horas
        dotColor = COLORS.primaryLight // Verde claro
        textColor = COLORS.primary
      }
  
      // Mejorar la visualización de las fechas marcadas
      dates[date] = {
        marked: true,
        selected: date === selectedDate,
        selectedColor: date === selectedDate ? COLORS.primary : undefined,
        dotColor: dotColor,
        customStyles: {
          container: {
            backgroundColor: date === selectedDate ? COLORS.primary : undefined,
            borderRadius: 8,
          },
          text: {
            color: date === selectedDate ? "white" : textColor,
            fontWeight: date === selectedDate ? "bold" : "normal",
          },
          dots: [
            {
              color: dotColor,
              selectedDotColor: "white",
            },
          ],
        },
      }
    })
  
    setMarkedDates(dates)
  }  

  // Calculate stats
  const calculateStats = () => {
    const completedSessions = workSessions.filter((session) => session.status === "completed")

    // Calculate total work hours
    const totalMinutes = completedSessions.reduce((total, session) => {
      return total + (session.duration || 0)
    }, 0)

    // Calculate total break hours
    const totalBreakMinutes = completedSessions.reduce((total, session) => {
      return total + (session.breakDuration || 0)
    }, 0)

    // Calculate unique days worked
    const uniqueDays = new Set(completedSessions.map((session) => session.date)).size

    // Calculate average hours per day
    const averageMinutesPerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0

    setStats({
      totalHours: totalMinutes / 60,
      totalBreakHours: totalBreakMinutes / 60,
      averageHoursPerDay: averageMinutesPerDay / 60,
    })
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchTimeHistory()
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Format duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return "N/A"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    return `${hours}h ${mins}m`
  }

  // Render session item
  const renderSessionItem = ({ item }: { item: WorkSession }) => (
    <Card style={styles.sessionCard}>
      <Card.Content>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
          <Chip
            style={[
              styles.statusChip,
              {
                backgroundColor:
                  item.status === "completed"
                    ? COLORS.successLight
                    : item.status === "on_break"
                      ? COLORS.warningLight
                      : COLORS.primaryLighter,
              },
            ]}
            textStyle={{
              color:
                item.status === "completed"
                  ? COLORS.success
                  : item.status === "on_break"
                    ? COLORS.warning
                    : COLORS.primary,
            }}
          >
            {item.status === "completed" ? "Completada" : item.status === "on_break" ? "En Descanso" : "Activa"}
          </Chip>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.sessionTimes}>
          <View style={styles.sessionTimeItem}>
            <Ionicons name="log-in-outline" size={20} color={COLORS.success} />
            <Text style={styles.sessionTimeText}>Entrada: {formatTime(item.clockInEvent.timestamp)}</Text>
          </View>

          {item.clockOutEvent && (
            <View style={styles.sessionTimeItem}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
              <Text style={styles.sessionTimeText}>Salida: {formatTime(item.clockOutEvent.timestamp)}</Text>
            </View>
          )}
        </View>

        <View style={styles.sessionDurations}>
          <View style={styles.durationItem}>
            <Text style={styles.durationLabel}>Tiempo Trabajado:</Text>
            <Text style={styles.durationValue}>{formatDuration(item.duration)}</Text>
          </View>

          {item.breakDuration && item.breakDuration > 0 && (
            <View style={styles.durationItem}>
              <Text style={styles.durationLabel}>Tiempo de Descanso:</Text>
              <Text style={styles.breakDurationValue}>{formatDuration(item.breakDuration)}</Text>
            </View>
          )}
        </View>

        {item.breakEvents.length > 0 && (
          <>
            <Divider style={styles.divider} />

            <Text style={styles.breakEventsTitle}>Descansos:</Text>

            {item.breakEvents
              .reduce(
                (pairs, event, index, array) => {
                  if (event.type === "break_start") {
                    const endEvent = array.find((e, i) => i > index && e.type === "break_end")

                    if (endEvent) {
                      pairs.push({ start: event, end: endEvent })
                    }
                  }
                  return pairs
                },
                [] as { start: any; end: any }[],
              )
              .map((pair, index) => (
                <View key={index} style={styles.breakEventItem}>
                  <Text style={styles.breakEventTime}>
                    {formatTime(pair.start.timestamp)} - {formatTime(pair.end.timestamp)}
                  </Text>
                </View>
              ))}
          </>
        )}
      </Card.Content>
    </Card>
  )

  // Mejorar la visualización del calendario
  // Reemplazar la función renderCalendarLegend con esta versión mejorada:
  const renderCalendarLegend = () => {
    return (
      <View style={styles.calendarLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLighter }]} />
          <Text style={styles.legendText}>{"< 4 horas"}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primaryLight }]} />
          <Text style={styles.legendText}>{"4-6 horas"}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>{"> 6 horas"}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.primary, borderWidth: 2, borderColor: "white" }]} />
          <Text style={styles.legendText}>Seleccionado</Text>
        </View>
      </View>
    )
  }

  // Modificar la función para renderizar la vista de calendario
  const renderCalendarView = () => {
    return (
      <ScrollView contentContainerStyle={styles.calendarContainer}>
        <Calendar
          markedDates={markedDates}
          onDayPress={handleDateSelect}
          theme={{
            todayTextColor: COLORS.primary,
            selectedDayBackgroundColor: COLORS.primary,
            selectedDayTextColor: "white",
            arrowColor: COLORS.primary,
            monthTextColor: COLORS.black,
            textMonthFontWeight: "bold",
            textDayFontSize: 14,
            textMonthFontSize: 16,
            calendarBackground: COLORS.white,
            dayTextColor: COLORS.grayDark,
            textDisabledColor: COLORS.grayLight,
            dotColor: COLORS.primary,
            selectedDotColor: "white",
            indicatorColor: COLORS.primary,
          }}
          enableSwipeMonths={true}
          hideExtraDays={false}
          firstDay={1} // Semana comienza en lunes
          markingType={"custom"}
          current={selectedDate || undefined}
        />
  
        {renderCalendarLegend()}
  
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateTitle}>
            {selectedDate ? `Sesiones para ${formatDate(selectedDate)}` : "Selecciona una fecha para ver detalles"}
          </Text>
  
          {selectedDate && (
            <ScrollView contentContainerStyle={styles.selectedDateListContent}>
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <Card key={session.id} style={styles.sessionCard}>
                    <Card.Content>
                      <View style={styles.sessionHeader}>
                        <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                        <Chip
                          style={[
                            styles.statusChip,
                            {
                              backgroundColor:
                                session.status === "completed"
                                  ? COLORS.successLight
                                  : session.status === "on_break"
                                    ? COLORS.warningLight
                                    : COLORS.primaryLighter,
                            },
                          ]}
                          textStyle={{
                            color:
                              session.status === "completed"
                                ? COLORS.success
                                : session.status === "on_break"
                                  ? COLORS.warning
                                  : COLORS.primary,
                          }}
                        >
                          {session.status === "completed" ? "Completada" : session.status === "on_break" ? "En Descanso" : "Activa"}
                        </Chip>
                      </View>
  
                      <Divider style={styles.divider} />
  
                      <View style={styles.sessionTimes}>
                        <View style={styles.sessionTimeItem}>
                          <Ionicons name="log-in-outline" size={20} color={COLORS.success} />
                          <Text style={styles.sessionTimeText}>Entrada: {formatTime(session.clockInEvent.timestamp)}</Text>
                        </View>
  
                        {session.clockOutEvent && (
                          <View style={styles.sessionTimeItem}>
                            <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
                            <Text style={styles.sessionTimeText}>Salida: {formatTime(session.clockOutEvent.timestamp)}</Text>
                          </View>
                        )}
                      </View>
  
                      <View style={styles.sessionDurations}>
                        <View style={styles.durationItem}>
                          <Text style={styles.durationLabel}>Tiempo Trabajado:</Text>
                          <Text style={styles.durationValue}>{formatDuration(session.duration)}</Text>
                        </View>
  
                        {session.breakDuration && session.breakDuration > 0 && (
                          <View style={styles.durationItem}>
                            <Text style={styles.durationLabel}>Tiempo de Descanso:</Text>
                            <Text style={styles.breakDurationValue}>{formatDuration(session.breakDuration)}</Text>
                          </View>
                        )}
                      </View>
  
                      {session.breakEvents.length > 0 && (
                        <>
                          <Divider style={styles.divider} />
  
                          <Text style={styles.breakEventsTitle}>Descansos:</Text>
  
                          {session.breakEvents
                            .reduce(
                              (pairs, event, index, array) => {
                                if (event.type === "break_start") {
                                  const endEvent = array.find((e, i) => i > index && e.type === "break_end")
  
                                  if (endEvent) {
                                    pairs.push({ start: event, end: endEvent })
                                  }
                                }
                                return pairs
                              },
                              [] as { start: any; end: any }[],
                            )
                            .map((pair, index) => (
                              <View key={index} style={styles.breakEventItem}>
                                <Text style={styles.breakEventTime}>
                                  {formatTime(pair.start.timestamp)} - {formatTime(pair.end.timestamp)}
                                </Text>
                              </View>
                            ))}
                        </>
                      )}
                    </Card.Content>
                  </Card>
                ))
              ) : (
                <View style={styles.emptySelectedDateContainer}>
                  <Text style={styles.emptySelectedDateText}>No hay registros para esta fecha</Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial de Tiempo</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Total Trabajado</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalBreakHours.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Total Descansos</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageHoursPerDay.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Promedio Diario</Text>
        </View>
      </View>

      <View style={styles.viewModeContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode}
          buttons={[
            { value: "list", label: "Lista", icon: "format-list-bulleted" },
            { value: "calendar", label: "Calendario", icon: "calendar" },
          ]}
          style={{ backgroundColor: COLORS.grayLight }}
          theme={{ colors: { primary: COLORS.primary } }}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando historial...</Text>
        </View>
      ) : viewMode === "list" ? (
        <FlatList
          data={filteredSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No hay registros</Text>
              <Text style={styles.emptyText}>
                {selectedDate ? `No hay registros para el ${formatDate(selectedDate)}` : "No has registrado tiempo aún"}
              </Text>
            </View>
          }
        />
      ) : (
        renderCalendarView()
      )}
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
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
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
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "80%",
    backgroundColor: COLORS.grayLight,
  },
  viewModeContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
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
    color: COLORS.gray,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sessionCard: {
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
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: COLORS.grayLight,
  },
  sessionTimes: {
    marginBottom: 12,
  },
  sessionTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionTimeText: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginLeft: 8,
  },
  sessionDurations: {
    backgroundColor: COLORS.grayLight,
    padding: 12,
    borderRadius: 8,
  },
  durationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  durationLabel: {
    fontSize: 14,
    color: COLORS.grayDark,
  },
  durationValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
  },
  breakDurationValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
  },
  breakEventsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.grayDark,
    marginBottom: 8,
  },
  breakEventItem: {
    backgroundColor: COLORS.warningLight,
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  breakEventTime: {
    fontSize: 14,
    color: COLORS.warning,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.grayDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },
  calendarContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 16,
    paddingBottom: 16,
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

  selectedDateContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.background,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  selectedDateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
    textAlign: "center",
  },

  selectedDateListContent: {
    paddingBottom: 40,
  },

  emptySelectedDateContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    marginTop: 8,
  },

  emptySelectedDateText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
  },

  calendarLegend: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },

  legendText: {
    fontSize: 12,
    color: COLORS.gray,
  },
})

