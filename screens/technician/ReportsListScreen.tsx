"use client"

import { useState, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform, StatusBar } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Chip, Searchbar, Button, ActivityIndicator, Divider } from "react-native-paper"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { Report } from "../../models/technician"
import Animated, { FadeInDown } from "react-native-reanimated"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"

// Definir colores para el tema de técnicos
const COLORS = {
  primary: "#10b981", // Verde para técnicos
  primaryDark: "#059669",
  primaryLight: "#d1fae5",
  secondary: "#0ea5e9", // Azul para acentos
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

export default function ReportsListScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // Estado
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [filteredReports, setFilteredReports] = useState<Report[]>([])
  const [searchQuery, setSearchQuery] = useState("")
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

  // Mostrar alerta de éxito
  const showSuccessAlert = (title: string, message: string) => {
    setAlertData({
      type: "success",
      title,
      message,
    })
    setAlertVisible(true)
  }

  // Cerrar alerta
  const handleAlertClose = () => {
    setAlertVisible(false)
  }

  // Mostrar alerta de error
  const showErrorAlert = (title: string, message: string) => {
    setErrorData({
      title,
      message,
    })
    setErrorVisible(true)
  }

  // Cargar reportes cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      fetchReports()
    }, []),
  )

  // Obtener reportes
  const fetchReports = async () => {
    if (!user?.id) {
      showErrorAlert("Error", "No se pudo identificar al usuario")
      return
    }

    setIsLoading(true)

    try {
      const response = await technicianApi.reports.getAll(user.id)

      if (response.success) {
        // Ordenar reportes por fecha (más recientes primero)
        const sortedReports = response.data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setReports(sortedReports)
        setFilteredReports(sortedReports)
      } else {
        throw new Error(response.message || "No se pudieron cargar los reportes")
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error)
      showErrorAlert("Error al cargar reportes", error.message || "No se pudieron cargar los reportes")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Manejar búsqueda
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (!query.trim()) {
      setFilteredReports(reports)
      return
    }

    const filtered = reports.filter(
      (report) =>
        report.buildingName.toLowerCase().includes(query.toLowerCase()) ||
        report.elevatorBrand.toLowerCase().includes(query.toLowerCase()) ||
        formatDate(report.date).includes(query.toLowerCase()),
    )

    setFilteredReports(filtered)
  }

  // Manejar actualización
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchReports()
  }

  // Navegar a detalles del reporte
  const navigateToReportDetail = (reportId: string) => {
    navigation.navigate("Detalles", { reportId })
  }

  // Navegar a crear reporte
  const navigateToCreateReport = () => {
    navigation.navigate("Reportes")
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return "Fecha inválida"
      }
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

  // Renderizar item de reporte
  const renderReportItem = ({ item, index }: { item: Report; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(300)}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigateToReportDetail(item.id)}
          style={styles.reportItemContainer}
        >
          <Card style={styles.reportCard}>
            <Card.Content>
              <View style={styles.reportHeader}>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportBuilding}>{item.buildingName}</Text>
                  <Text style={styles.reportDate}>{formatDate(item.date)}</Text>
                </View>
                <Chip
                  style={[styles.statusChip, { backgroundColor: `${getStatusColor(item.status)}20` }]}
                  textStyle={{ color: getStatusColor(item.status) }}
                >
                  {getStatusLabel(item.status)}
                </Chip>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.reportDetails}>
                <View style={styles.reportDetailRow}>
                  <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.reportDetailText}>Marca: {item.elevatorBrand}</Text>
                </View>

                <View style={styles.reportDetailRow}>
                  <Ionicons name="layers-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.reportDetailText}>
                    Ascensores: {item.elevatorCount} | Pisos: {item.floorCount}
                  </Text>
                </View>
              </View>

              <View style={styles.reportActions}>
                <Button
                  mode="text"
                  onPress={() => navigateToReportDetail(item.id)}
                  icon="eye-outline"
                  textColor={COLORS.primary}
                >
                  Ver detalles
                </Button>
                {item.pdfUrl && (
                  <Button
                    mode="text"
                    onPress={() => navigateToReportDetail(item.id)}
                    icon="file"
                    textColor={COLORS.secondary}
                  >
                    Ver PDF
                  </Button>
                )}
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  // Renderizar contenido vacío
  const renderEmptyContent = () => {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No hay reportes</Text>
        <Text style={styles.emptyText}>
          {searchQuery
            ? "No se encontraron reportes que coincidan con tu búsqueda."
            : "Aún no has creado ningún reporte de mantenimiento."}
        </Text>
        {!searchQuery && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate("Reportes")}
            style={styles.createButton}
            buttonColor={COLORS.primary}
            icon="plus"
          >
            Crear reporte
          </Button>
        )}
      </View>
    )
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
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Reportes</Text>
          <TouchableOpacity style={styles.createReportButton} onPress={() => navigation.navigate("Reportes")}          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Searchbar
          placeholder="Buscar reportes..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={COLORS.textSecondary}
          clearIcon="close-circle"
        />
      </LinearGradient>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando reportes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          renderItem={renderReportItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Componentes de alerta */}
      <AlertMessage
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={handleAlertClose}
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
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  createReportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
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
  searchBar: {
    elevation: 0,
    backgroundColor: "white",
    borderRadius: 10,
  },
  searchInput: {
    fontSize: 14,
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  reportItemContainer: {
    marginBottom: 16,
  },
  reportCard: {
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
  reportInfo: {
    flex: 1,
  },
  reportBuilding: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  reportDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  reportDetails: {
    marginBottom: 12,
  },
  reportDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  reportActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    borderRadius: 8,
  },
})

