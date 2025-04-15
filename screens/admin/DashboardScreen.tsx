"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from "react-native"
import { Card, Button, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import AppHeader from "../../components/AppHeader"

const { width } = Dimensions.get("window")

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { notifications, maintenances, invoices } = useApp()

  const unreadNotifications = notifications.filter((n) => !n.read).length
  const pendingMaintenances = maintenances.filter((m) => m.status !== "completed").length
  const completedMaintenances = maintenances.filter((m) => m.status === "completed").length
  const overdueInvoices = invoices.filter((i) => i.status === "overdue").length
  const pendingInvoices = invoices.filter((i) => i.status === "pending").length

  // Datos simulados para el dashboard
  const techniciansCount = 12
  const activeClients = 28
  const reportsThisMonth = 45
  const pendingReports = 8
  const pendingMeetings = 5

  // Datos simulados para reportes recientes
  const recentReports = [
    {
      id: "1",
      technicianName: "Carlos Rodríguez",
      buildingName: "Torre Empresarial Lima",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "approved",
    },
    {
      id: "2",
      technicianName: "María López",
      buildingName: "Centro Comercial Plaza",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      status: "submitted",
    },
    {
      id: "3",
      technicianName: "Juan Pérez",
      buildingName: "Hospital Nacional",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "draft",
    },
  ]

  const handleNotifications = () => {
    navigation.navigate("Notifications")
  }

  const navigateToScreen = (screen: string) => {
    navigation.navigate(screen)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981"
      case "submitted":
        return "#3b82f6"
      case "draft":
        return "#f59e0b"
      case "rejected":
        return "#ef4444"
      case "active":
        return "#10b981"
      case "inactive":
        return "#ef4444"
      case "pending":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprobado"
      case "submitted":
        return "Enviado"
      case "draft":
        return "Borrador"
      case "rejected":
        return "Rechazado"
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  // Componente para el botón de notificaciones en el header
  const NotificationsButton = () => (
    <TouchableOpacity style={styles.notificationButton} onPress={handleNotifications}>
      <Ionicons name="notifications" size={22} color="white" />
      {unreadNotifications > 0 && (
        <View style={styles.notificationBadge}>
          <Text style={styles.notificationBadgeText}>{unreadNotifications}</Text>
        </View>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <AppHeader
        title={`Bienvenido, ${user?.name || "Administrador"}`}
        subtitle="Panel de control de Tesla Lift"
        showBackButton={false}
        rightComponent={<NotificationsButton />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.welcomeSection}>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickActionCard, styles.purpleGradient]}
              onPress={() => navigateToScreen("TechniciansList")}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="people" size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>Técnicos</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" style={styles.quickActionArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.greenGradient]}
              onPress={() => navigateToScreen("ClientsList")}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="business" size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>Clientes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" style={styles.quickActionArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.blueGradient]}
              onPress={() => navigateToScreen("ReportsList")}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="document-text" size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>Reportes</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" style={styles.quickActionArrow} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionCard, styles.orangeGradient]}
              onPress={() => navigateToScreen("MeetingRequests")}
            >
              <View style={styles.quickActionContent}>
                <View style={styles.quickActionIcon}>
                  <Ionicons name="calendar" size={24} color="white" />
                </View>
                <Text style={styles.quickActionTitle}>Reuniones</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="white" style={styles.quickActionArrow} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={[styles.statsIconContainer, { backgroundColor: "#f5f3ff" }]}>
                  <Ionicons name="people" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statsValue}>{techniciansCount}</Text>
                <Text style={styles.statsLabel}>Técnicos</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={[styles.statsIconContainer, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="business" size={24} color="#22c55e" />
                </View>
                <Text style={styles.statsValue}>{activeClients}</Text>
                <Text style={styles.statsLabel}>Clientes Activos</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={[styles.statsIconContainer, { backgroundColor: "#eff6ff" }]}>
                  <Ionicons name="document-text" size={24} color="#3b82f6" />
                </View>
                <Text style={styles.statsValue}>{reportsThisMonth}</Text>
                <Text style={styles.statsLabel}>Reportes este mes</Text>
              </Card.Content>
            </Card>

            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={[styles.statsIconContainer, { backgroundColor: "#fff7ed" }]}>
                  <Ionicons name="calendar" size={24} color="#f97316" />
                </View>
                <Text style={styles.statsValue}>{pendingMeetings}</Text>
                <Text style={styles.statsLabel}>Reuniones pendientes</Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reportes Recientes</Text>
            <Button
              mode="text"
              textColor="#7c3aed"
              onPress={() => navigateToScreen("ReportsList")}
              labelStyle={styles.viewAllButtonLabel}
            >
              Ver todos
            </Button>
          </View>

          {recentReports.map((report) => (
            <Card key={report.id} style={styles.reportCard}>
              <Card.Content>
                <View style={styles.reportHeader}>
                  <View>
                    <Text style={styles.reportBuildingName}>{report.buildingName}</Text>
                    <Text style={styles.reportTechnicianName}>Técnico: {report.technicianName}</Text>
                  </View>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: getStatusColor(report.status) + "20" }]}
                    textStyle={{ color: getStatusColor(report.status), fontWeight: "500" }}
                  >
                    {getStatusText(report.status)}
                  </Chip>
                </View>

                <View style={styles.reportDetails}>
                  <View style={styles.reportDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                    <Text style={styles.reportDetailText}>{report.date.toLocaleDateString()}</Text>
                  </View>
                </View>

                <Button
                  mode="outlined"
                  textColor="#7c3aed"
                  onPress={() => navigateToScreen("ReportDetail")}
                  style={styles.viewButton}
                  labelStyle={styles.viewButtonLabel}
                >
                  Ver Detalles
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  notificationButton: {
    position: "relative",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 24,
    marginTop: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  dateText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textTransform: "capitalize",
  },
  quickActionsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#1f2937",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quickActionCard: {
    width: "48%",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purpleGradient: {
    backgroundColor: "#7c3aed",
  },
  greenGradient: {
    backgroundColor: "#10b981",
  },
  blueGradient: {
    backgroundColor: "#3b82f6",
  },
  orangeGradient: {
    backgroundColor: "#f97316",
  },
  quickActionContent: {
    flexDirection: "column",
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  quickActionArrow: {
    opacity: 0.7,
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statsCard: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  recentSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  reportCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reportBuildingName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  reportTechnicianName: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: 28,
    borderRadius: 14,
  },
  reportDetails: {
    marginBottom: 16,
  },
  reportDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportDetailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  viewButton: {
    borderColor: "#7c3aed",
    borderRadius: 8,
  },
  viewButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
})
