"use client"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from "react-native"
import { Card, Button, Badge, Chip } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import  FloatingMenuButton  from "../../components/FloatingMenuButton"

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

  // Datos simulados para técnicos recientes
  const recentTechnicians = [
    {
      id: "1",
      name: "Carlos Rodríguez",
      photo: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
      status: "active",
      reportsCount: 15,
    },
    {
      id: "2",
      name: "María López",
      photo: "https://i.pravatar.cc/150?u=a042581f4e29026705e",
      status: "active",
      reportsCount: 12,
    },
    {
      id: "3",
      name: "Juan Pérez",
      photo: "https://i.pravatar.cc/150?u=a042581f4e29026706f",
      status: "inactive",
      reportsCount: 8,
    },
  ]

  // Datos simulados para clientes recientes
  const recentClients = [
    {
      id: "1",
      name: "Torre Empresarial Lima",
      buildingsCount: 1,
      liftsCount: 4,
      status: "active",
    },
    {
      id: "2",
      name: "Centro Comercial Plaza",
      buildingsCount: 2,
      liftsCount: 8,
      status: "active",
    },
    {
      id: "3",
      name: "Hospital Nacional",
      buildingsCount: 1,
      liftsCount: 6,
      status: "pending",
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
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Bienvenido</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#7c3aed" />
            {unreadNotifications > 0 && <Badge style={styles.badge}>{unreadNotifications}</Badge>}
          </TouchableOpacity>
        </View>
      </View>
  
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateToScreen("TechniciansList")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#e0e7ff" }]}>
                <Ionicons name="people" size={24} color="#6366f1" />
              </View>
              <Text style={styles.quickActionTitle}>Técnicos</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateToScreen("ClientsList")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#f0fdf4" }]}>
                <Ionicons name="business" size={24} color="#22c55e" />
              </View>
              <Text style={styles.quickActionTitle}>Clientes</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateToScreen("ReportsList")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#eff6ff" }]}>
                <Ionicons name="document-text" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.quickActionTitle}>Reportes</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={styles.quickActionCard} onPress={() => navigateToScreen("CreateReport")}>
              <View style={[styles.quickActionIcon, { backgroundColor: "#faf5ff" }]}>
                <Ionicons name="add-circle" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.quickActionTitle}>Crear Reporte</Text>
            </TouchableOpacity>
          </View>
        </View>
  
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Resumen General</Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsIconContainer}>
                  <Ionicons name="people" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statsValue}>{techniciansCount}</Text>
                <Text style={styles.statsLabel}>Técnicos</Text>
              </Card.Content>
            </Card>
  
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsIconContainer}>
                  <Ionicons name="business" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statsValue}>{activeClients}</Text>
                <Text style={styles.statsLabel}>Clientes Activos</Text>
              </Card.Content>
            </Card>
  
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsIconContainer}>
                  <Ionicons name="document-text" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statsValue}>{reportsThisMonth}</Text>
                <Text style={styles.statsLabel}>Reportes este mes</Text>
              </Card.Content>
            </Card>
  
            <Card style={styles.statsCard}>
              <Card.Content>
                <View style={styles.statsIconContainer}>
                  <Ionicons name="alert-circle" size={24} color="#7c3aed" />
                </View>
                <Text style={styles.statsValue}>{pendingReports}</Text>
                <Text style={styles.statsLabel}>Reportes pendientes</Text>
              </Card.Content>
            </Card>
          </View>
        </View>
  
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Reportes Recientes</Text>
            <Button mode="text" textColor="#7c3aed" onPress={() => navigateToScreen("ReportsList")}>
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
                    textStyle={{ color: getStatusColor(report.status) }}
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
                >
                  Ver Detalles
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
  
      {/* Botón flotante para abrir el menú */}
      <FloatingMenuButton />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7c3aed",
  },
  headerButtons: {
    flexDirection: "row",
  },
  iconButton: {
    marginLeft: 16,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
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
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
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
    borderRadius: 12,
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f3ff",
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
  reportCard: {
    marginBottom: 16,
    borderRadius: 12,
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
    height: "auto",
    borderRadius: 12,
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
  },
  technicianCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  technicianHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  technicianPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  technicianInfo: {
    flex: 1,
  },
  technicianName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  technicianStats: {
    flexDirection: "row",
  },
  technicianStat: {
    fontSize: 14,
    color: "#6b7280",
  },
  clientCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  clientStats: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  clientStat: {
    fontSize: 14,
    color: "#6b7280",
    marginRight: 12,
    marginBottom: 4,
  },
})

