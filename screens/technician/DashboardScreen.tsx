"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Chip, Divider, ActivityIndicator, Button } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Animated, { FadeInDown } from "react-native-reanimated"
import technicianApi from "../../services/technicianApi"
import { type WorkSession, type TechnicianStats, type Report, getReportSheetForMonth } from "../../models/technician"
import * as Location from "expo-location"
import FutureFeatureModal from "../../components/FutureFeatureModal"
import { StatusBar } from "expo-status-bar"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

const { width } = Dimensions.get("window")

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

export default function TechnicianDashboardScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  // State
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [recentReports, setRecentReports] = useState<Report[]>([])

  // Time tracking state
  const [isClockedIn, setIsClockedIn] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [currentSession, setCurrentSession] = useState<WorkSession | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [breakTime, setBreakTime] = useState(0) // in seconds
  const [isClockingIn, setIsClockingIn] = useState(false)
  const [isClockingOut, setIsClockingOut] = useState(false)
  const [isTogglingBreak, setIsTogglingBreak] = useState(false)
  const [technicianStats, setTechnicianStats] = useState<TechnicianStats | null>(null)
  const [locationPermission, setLocationPermission] = useState(false)
  const [currentMonthTemplate, setCurrentMonthTemplate] = useState<any>(null)
  const [futureFeatureInfo, setFutureFeatureInfo] = useState<{
    message: string
    title: string
    icon: keyof typeof Ionicons.glyphMap
    releaseDate: string
  }>({ message: "", title: "", icon: "alert", releaseDate: "" })

  // Alert message state
  const [alertVisible, setAlertVisible] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertType, setAlertType] = useState<"success" | "error" | "info">("info")

  // Error message state
  const [errorVisible, setErrorVisible] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)

  // Future feature modal state
  const [showFutureFeatureModal, setShowFutureFeatureModal] = useState(false)
  const [featureInfo, setFeatureInfo] = useState({ title: "", description: "", icon: "" })

  // Timer interval for active session
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (currentSession) {
      interval = setInterval(() => {
        const now = new Date().getTime()

        if (currentSession.status === "active") {
          // Calculate elapsed time excluding breaks
          const clockInTime = new Date(currentSession.clockInEvent.timestamp).getTime()
          const rawElapsedSeconds = Math.floor((now - clockInTime) / 1000)
          const breakSeconds = (currentSession.breakDuration || 0) * 60
          setElapsedTime(rawElapsedSeconds - breakSeconds)
          setBreakTime(breakSeconds)
        } else if (currentSession.status === "on_break") {
          // Calculate elapsed time and current break time
          const clockInTime = new Date(currentSession.clockInEvent.timestamp).getTime()
          const rawElapsedSeconds = Math.floor((now - clockInTime) / 1000)

          // Find the last break start event
          const lastBreakStart = currentSession.breakEvents.findLast((e) => e.type === "break_start")

          if (lastBreakStart) {
            const breakStartTime = new Date(lastBreakStart.timestamp).getTime()
            const currentBreakSeconds = Math.floor((now - breakStartTime) / 1000)
            const previousBreakSeconds = (currentSession.breakDuration || 0) * 60

            setElapsedTime(rawElapsedSeconds - (previousBreakSeconds + currentBreakSeconds))
            setBreakTime(previousBreakSeconds + currentBreakSeconds)
          }
        }
      }, 1000)
    } else {
      setElapsedTime(0)
      setBreakTime(0)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentSession])

  // Request location permission on mount
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        setLocationPermission(status === "granted")
      } catch (error) {
        console.error("Error requesting location permission:", error)
        setLocationPermission(false)
      }
    }

    requestLocationPermission()
  }, [])

  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData()
    }, []),
  )

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setIsLoading(true)

    try {
      // Get current session
      const sessionResponse = await technicianApi.workSessions.getCurrent(user?.id || "")
      setCurrentSession(sessionResponse.data)
      setIsClockedIn(!!sessionResponse.data)
      setIsOnBreak(sessionResponse.data?.status === "on_break")

      // Get technician stats
      const statsResponse = await technicianApi.stats.getTechnicianStats(user?.id || "")
      if (statsResponse.success) {
        setTechnicianStats(statsResponse.data)
      }

      // Get recent reports
      const reportsResponse = await technicianApi.reports.getAll(user?.id || "")
      if (reportsResponse.success) {
        // Sort by date (newest first) and take the 3 most recent
        const sortedReports = [...reportsResponse.data]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3)
        setRecentReports(sortedReports)
      }

      // Get template for current month
      const currentMonth = new Date().getMonth()
      const templateResponse = await technicianApi.reports.getTemplateForMonth(currentMonth)
      if (templateResponse.success) {
        setCurrentMonthTemplate(templateResponse.data)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setErrorVisible(true)
      showError("Error", "No se pudieron cargar los datos. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchDashboardData()
  }

  // Handle clock in
  const handleClockIn = async () => {
    setIsClockingIn(true)

    try {
      let location

      if (locationPermission) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }
      }

      const response = await technicianApi.clockEvents.recordEvent(user?.id || "", "clock_in", location)

      if (response.success) {
        setIsClockedIn(true)
        fetchDashboardData() // Refresh data
        setAlertVisible(true)
        setAlertType("success")
        showAlertMessage("Entrada registrada correctamente","Has registrado tu entrada correctamente.")
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error clocking in:", error)
      setErrorVisible(true)
      showError("Error", "No se pudo registrar la entrada. Inténtalo de nuevo.")
    } finally {
      setIsClockingIn(false)
    }
  }

  // Handle clock out
  const handleClockOut = async () => {
    setIsClockingOut(true)

    try {
      let location

      if (locationPermission) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }
      }

      const response = await technicianApi.clockEvents.recordEvent(user?.id || "", "clock_out", location)

      if (response.success) {
        setIsClockedIn(false)
        setIsOnBreak(false)
        fetchDashboardData() // Refresh data
        setAlertVisible(true)
        setAlertType("success")
        showAlertMessage("Salida registrada correctamente","Has registrado tu salida correctamente.")
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error clocking out:", error)
      setErrorVisible(true)
      showError("Error", "No se pudo registrar la salida. Inténtalo de nuevo.")
    } finally {
      setIsClockingOut(false)
    }
  }

  // Handle break toggle
  const handleBreakToggle = async () => {
    setIsTogglingBreak(true)

    try {
      let location

      if (locationPermission) {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        }
      }

      const eventType = isOnBreak ? "break_end" : "break_start"

      const response = await technicianApi.clockEvents.recordEvent(user?.id || "", eventType, location)

      if (response.success) {
        setIsOnBreak(!isOnBreak)
        fetchDashboardData() // Refresh data
        setAlertVisible(true)
        setAlertType("success")
        showAlertMessage(
          isOnBreak ? "Has reanudado tu trabajo." : "Has iniciado un descanso.",
          isOnBreak ? "Has reanudado tu trabajo correctamente." : "Has iniciado un descanso correctamente."
        )
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error("Error toggling break:", error)
      setErrorVisible(true)
      setShowErrorMessage(true)
    } finally {
      setIsTogglingBreak(false)
    }
  }

  // Format time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":")
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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return COLORS.warning
      case "in_progress":
        return COLORS.secondary
      case "completed":
        return COLORS.success
      case "cancelled":
        return COLORS.danger
      case "draft":
        return COLORS.gray
      case "submitted":
        return COLORS.secondary
      case "approved":
        return COLORS.success
      default:
        return COLORS.gray
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente"
      case "in_progress":
        return "En Progreso"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
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

  // Show future feature modal
  const handleServiceOrdersFeaturePress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Órdenes de Servicio",
      message:
        "Próximamente podrás ver y gestionar tus órdenes de servicio asignadas, incluyendo detalles del cliente, ubicación, tipo de servicio y prioridad. Esta función te ayudará a organizar mejor tu trabajo diario.",
      icon: "clipboard",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  const showAlertMessage = (title: string, message: string) => {
    setAlertData({ title, message })
    setShowAlert(true)
  }

  const handleAlertClose = () => {
    setShowAlert(false)
  }

  const showError = (title: string, message: string) => {
    setAlertData({ title, message })
    setShowErrorMessage(true)
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.primary} />

      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Bienvenido,</Text>
            <Text style={styles.nameText}>{user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate("Profile")}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitial}>{user?.name?.charAt(0) || "T"}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          <>
            {/* Time Tracking Card */}
            <Animated.View entering={FadeInDown.duration(300)}>
              <Card style={styles.timeTrackingCard}>
                <Card.Content>
                  <View style={styles.timeTrackingHeader}>
                    <Text style={styles.timeTrackingTitle}>{isClockedIn ? "Sesión Activa" : "Registro de Tiempo"}</Text>
                    <Chip
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: isClockedIn
                            ? isOnBreak
                              ? COLORS.warningLight
                              : COLORS.successLight
                            : COLORS.grayLight,
                        },
                      ]}
                      textStyle={{
                        color: isClockedIn ? (isOnBreak ? COLORS.warning : COLORS.success) : COLORS.gray,
                      }}
                    >
                      {isClockedIn ? (isOnBreak ? "En Descanso" : "En Servicio") : "Fuera de Servicio"}
                    </Chip>
                  </View>

                  {isClockedIn && currentSession ? (
                    <View style={styles.activeSessionContainer}>
                      <View style={styles.timeDisplayContainer}>
                        <Text style={styles.timeDisplayLabel}>Tiempo Trabajado</Text>
                        <Text style={styles.timeDisplay}>{formatTime(elapsedTime)}</Text>

                        <View style={styles.breakTimeContainer}>
                          <Ionicons name="cafe-outline" size={16} color={COLORS.warning} />
                          <Text style={styles.breakTimeText}>Tiempo de descanso: {formatTime(breakTime)}</Text>
                        </View>
                      </View>

                      <View style={styles.sessionInfoContainer}>
                        <View style={styles.sessionInfoItem}>
                          <Ionicons name="time-outline" size={20} color={COLORS.gray} />
                          <Text style={styles.sessionInfoText}>
                            Entrada:{" "}
                            {new Date(currentSession.clockInEvent.timestamp).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.timeTrackingActions}>
                        <Button
                          mode="contained"
                          onPress={handleBreakToggle}
                          style={[styles.breakButton, isOnBreak ? styles.resumeButton : {}]}
                          contentStyle={styles.buttonContent}
                          loading={isTogglingBreak}
                          disabled={isTogglingBreak || isClockingOut}
                          buttonColor={isOnBreak ? COLORS.success : COLORS.warning}
                          icon={isOnBreak ? "play" : "pause"}
                        >
                          {isOnBreak ? "Reanudar Trabajo" : "Tomar Descanso"}
                        </Button>

                        <Button
                          mode="contained"
                          onPress={handleClockOut}
                          style={styles.clockOutButton}
                          contentStyle={styles.buttonContent}
                          loading={isClockingOut}
                          disabled={isClockingOut || isTogglingBreak}
                          buttonColor={COLORS.danger}
                          icon="logout"
                        >
                          Finalizar Jornada
                        </Button>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.clockInContainer}>
                      <Text style={styles.clockInText}>Registra tu entrada para comenzar a trabajar</Text>

                      <Button
                        mode="contained"
                        onPress={handleClockIn}
                        style={styles.clockInButton}
                        contentStyle={styles.buttonContent}
                        loading={isClockingIn}
                        disabled={isClockingIn}
                        buttonColor={COLORS.success}
                        icon="login"
                      >
                        Iniciar Jornada
                      </Button>
                    </View>
                  )}

                  <View style={styles.timeHistoryLink}>
                    <TouchableOpacity
                      style={styles.timeHistoryButton}
                      onPress={() => navigation.navigate("Tiempo")}
                    >
                      <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                      <Text style={[styles.timeHistoryText, { color: COLORS.primary }]}>Ver historial de tiempo</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInDown.delay(100).duration(300)}>
              <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
              <View style={styles.quickActionsContainer}>
                <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate("Tiempo")}>
                  <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLightest }]}>
                    <Ionicons name="time-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Historial de Tiempos</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate("Reportes")}>
                  <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLightest }]}>
                    <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Generar Reporte</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate("Lista")}>
                  <View style={[styles.quickActionIcon, { backgroundColor: COLORS.primaryLightest }]}>
                    <Ionicons name="list-outline" size={24} color={COLORS.primary} />
                  </View>
                  <Text style={styles.quickActionText}>Historial de Reportes</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Monthly Report Card */}
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <Text style={styles.sectionTitle}>Reporte Mensual</Text>
              <Card style={styles.monthlyReportCard}>
                <Card.Content>
                  <View style={styles.monthlyReportHeader}>
                    <View>
                      <Text style={styles.monthlyReportTitle}>
                        {getMonthName(new Date().getMonth())} {new Date().getFullYear()}
                      </Text>
                      <Text style={styles.monthlyReportSubtitle}>
                        {currentMonthTemplate
                          ? `Plantilla: ${currentMonthTemplate.name}`
                          : "Plantilla de mantenimiento para este mes"}
                      </Text>
                    </View>
                    <View style={styles.sheetNumberContainer}>
                      <Text style={styles.sheetNumberLabel}>Hoja</Text>
                      <Text style={styles.sheetNumber}>
                        {currentMonthTemplate?.sheetNumber || getReportSheetForMonth(new Date().getMonth())}
                      </Text>
                    </View>
                  </View>

                  <Button
                    mode="contained"
                    onPress={() => navigation.navigate("Reportes")}
                    style={styles.createReportButton}
                    contentStyle={styles.buttonContent}
                    buttonColor={COLORS.primary}
                    icon="file-document-edit"
                  >
                    Crear Reporte
                  </Button>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Recent Reports */}
            {recentReports.length > 0 && (
              <Animated.View entering={FadeInDown.delay(300).duration(300)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Reportes Recientes</Text>
                  <TouchableOpacity style={styles.viewAllButton} onPress={() => navigation.navigate("Lista")}>
                    <Text style={[styles.viewAllText, { color: COLORS.primary }]}>Ver Todos</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {recentReports.map((report) => (
                  <TouchableOpacity
                    key={report.id}
                    onPress={() => navigation.navigate("Detalles", { reportId: report.id })}
                  >
                    <Card style={styles.reportCard}>
                      <Card.Content>
                        <View style={styles.reportHeader}>
                          <View>
                            <Text style={styles.reportBuilding}>{report.buildingName}</Text>
                            <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
                          </View>
                          <Chip
                            style={[styles.statusChip, { backgroundColor: `${getStatusColor(report.status)}20` }]}
                            textStyle={{ color: getStatusColor(report.status) }}
                          >
                            {getStatusLabel(report.status)}
                          </Chip>
                        </View>

                        <Divider style={styles.divider} />

                        <View style={styles.reportDetails}>
                          <View style={styles.reportDetailRow}>
                            <Ionicons name="business-outline" size={16} color={COLORS.gray} />
                            <Text style={styles.reportDetailText}>Marca: {report.elevatorBrand}</Text>
                          </View>

                          <View style={styles.reportDetailRow}>
                            <Ionicons name="layers-outline" size={16} color={COLORS.gray} />
                            <Text style={styles.reportDetailText}>
                              Ascensores: {report.elevatorCount} | Pisos: {report.floorCount}
                            </Text>
                          </View>

                          <View style={styles.reportDetailRow}>
                            <Ionicons name="document-text-outline" size={16} color={COLORS.gray} />
                            <Text style={styles.reportDetailText}>Hoja: {report.sheetNumber}</Text>
                          </View>
                        </View>

                        {report.pdfUrl && (
                          <View style={styles.reportActions}>
                            <TouchableOpacity style={styles.reportAction}>
                              <Ionicons name="download-outline" size={16} color={COLORS.primary} />
                              <Text style={[styles.reportActionText, { color: COLORS.primary }]}>Descargar PDF</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </Card.Content>
                    </Card>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            {/* Coming Soon - Service Orders */}
            <Animated.View entering={FadeInDown.delay(400).duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Próximas Órdenes de Servicio</Text>
              </View>

              <TouchableOpacity
                style={styles.comingSoonCard}
                onPress={handleServiceOrdersFeaturePress}
              >
                <View style={styles.comingSoonContent}>
                  <Ionicons name="clipboard-outline" size={48} color={COLORS.gray} />
                  <Text style={styles.comingSoonTitle}>Órdenes de Servicio</Text>
                  <Text style={styles.comingSoonDescription}>
                    Esta función estará disponible próximamente. Podrás ver y gestionar tus órdenes de servicio
                    asignadas.
                  </Text>
                </View>
                <View style={styles.comingSoonOverlay}>
                  <View style={[styles.comingSoonBadge, { backgroundColor: COLORS.primary + "20" }]}>
                    <Text style={[styles.comingSoonText, { color: COLORS.primary }]}>Próximamente</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Work Summary */}
            {technicianStats && (
              <Animated.View entering={FadeInDown.delay(500).duration(300)}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Resumen de Trabajo</Text>
                </View>

                <Card style={styles.summaryCard}>
                  <Card.Content>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{technicianStats.totalWorkSessions}</Text>
                        <Text style={styles.summaryLabel}>Sesiones</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{Math.round(technicianStats.totalWorkDuration / 60)}h</Text>
                        <Text style={styles.summaryLabel}>Horas Totales</Text>
                      </View>

                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{technicianStats.completedReports}</Text>
                        <Text style={styles.summaryLabel}>Reportes</Text>
                      </View>
                    </View>

                    <Divider style={styles.divider} />

                    <Text style={styles.weeklyLabel}>Horas Trabajadas por Día</Text>
                    <View style={styles.weeklyHoursContainer}>
                      {technicianStats.weeklyWorkHours.map((hours, index) => (
                        <View key={index} style={styles.weeklyHourBar}>
                          <View
                            style={[
                              styles.weeklyHourFill,
                              {
                                height: `${Math.min((hours / 10) * 100, 100)}%`,
                                backgroundColor: COLORS.primary,
                              },
                            ]}
                          />
                          <Text style={styles.weeklyHourText}>{["L", "M", "X", "J", "V", "S", "D"][index]}</Text>
                        </View>
                      ))}
                    </View>
                  </Card.Content>
                </Card>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: COLORS.primary }]}
        onPress={() => navigation.navigate("Reportes")}
      >
        <Ionicons name="document-text" size={24} color="white" />
      </TouchableOpacity>

      {/* Future Feature Modal */}
      <FutureFeatureModal
        visible={showFutureFeatureModal}
        title={futureFeatureInfo.title}
        message={futureFeatureInfo.message}
        icon={futureFeatureInfo.icon}
        releaseDate={futureFeatureInfo.releaseDate}
        onClose={() => setShowFutureFeatureModal(false)}
      />

      {/* Alert Message */}
      <AlertMessage
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        onClose={handleAlertClose}
      />

      {/* Error Message */}
      <ErrorMessage
        visible={showErrorMessage}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setShowErrorMessage(false)}
      />    </View>
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
  welcomeText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  profileImage: {
    width: 40,
    height: 40,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 80,
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
  // Section Header Styles
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Time Tracking Card Styles
  timeTrackingCard: {
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
  timeTrackingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeTrackingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  statusChip: {
    height: 28,
  },
  activeSessionContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  timeDisplayContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  timeDisplayLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  timeDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.black,
    fontVariant: ["tabular-nums"],
  },
  breakTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  breakTimeText: {
    marginLeft: 4,
    fontSize: 14,
    color: COLORS.warning,
  },
  sessionInfoContainer: {
    width: "100%",
    marginBottom: 16,
  },
  sessionInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sessionInfoText: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginLeft: 8,
  },
  timeTrackingActions: {
    width: "100%",
    flexDirection: "column",
    gap: 8,
  },
  breakButton: {
    borderRadius: 8,
  },
  resumeButton: {
    borderRadius: 8,
  },
  clockOutButton: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  clockInContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  clockInText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 20,
  },
  clockInButton: {
    width: "100%",
    borderRadius: 8,
  },
  timeHistoryLink: {
    alignItems: "center",
    marginTop: 8,
  },
  timeHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  timeHistoryText: {
    marginLeft: 4,
    fontSize: 14,
  },
  // Quick Actions Styles
  quickActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
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
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.grayDark,
    textAlign: "center",
  },
  // Monthly Report Card Styles
  monthlyReportCard: {
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
  monthlyReportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthlyReportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  monthlyReportSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
  sheetNumberContainer: {
    alignItems: "center",
    backgroundColor: COLORS.primaryLightest,
    padding: 8,
    borderRadius: 8,
  },
  sheetNumberLabel: {
    fontSize: 12,
    color: COLORS.primary,
  },
  sheetNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  createReportButton: {
    borderRadius: 8,
  },
  // Report Card Styles
  reportCard: {
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
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportBuilding: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  reportDate: {
    fontSize: 14,
    color: COLORS.gray,
  },
  reportDetails: {
    marginTop: 4,
  },
  reportDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: COLORS.grayDark,
    marginLeft: 8,
    flex: 1,
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  reportAction: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  reportActionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  // Coming Soon Styles
  comingSoonBadge: {
    backgroundColor: COLORS.primaryLightest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comingSoonText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: "500",
  },
  comingSoonCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderStyle: "dashed",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  comingSoonContent: {
    padding: 24,
    alignItems: "center",
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 16,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  learnMoreText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Summary Card Styles
  summaryCard: {
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  weeklyLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.grayDark,
    marginBottom: 12,
  },
  weeklyHoursContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 100,
    marginTop: 8,
  },
  weeklyHourBar: {
    width: 24,
    height: "100%",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  weeklyHourFill: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  weeklyHourText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: COLORS.grayLight,
  },
  fab: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
})

