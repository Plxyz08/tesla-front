"use client"

import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Dimensions,
  StatusBar,
  Linking,
} from "react-native"
import { Card, Button, Badge, Chip, ProgressBar, Divider } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { useApp } from "../../context/AppContext"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import AlertMessage from "../../components/alertMessage"

const { width } = Dimensions.get("window")

export default function ClientDashboardScreen() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const { notifications, invoices, maintenances } = useApp()
  const insets = useSafeAreaInsets()

  const [refreshing, setRefreshing] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  const unreadNotifications = notifications.filter((n) => !n.read).length
  const pendingInvoices = invoices.filter((i) => i.status === "pending" || i.status === "overdue").length
  const nextMaintenance = maintenances.find((m) => m.status === "scheduled")

  // Función para manejar el refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }, [])

  const handleEmergency = () => {
    navigation.navigate("Emergency")
  }

  const handleNotifications = () => {
    navigation.navigate("Notifications")
  }

  // Función para mostrar alerta de éxito
  const showSuccessAlert = (title: string, message: string) => {
    setAlertData({ title, message })
    setShowAlert(true)
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#f7be0d" />

      {/* Header con gradiente */}
      <LinearGradient colors={["#f7be0d", "#e6a800"]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Bienvenido</Text>
            <Text style={styles.userName}>{user?.name || "Cliente"}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
              <Ionicons name="notifications-outline" size={24} color="white" />
              {unreadNotifications > 0 && <Badge style={styles.badge}>{unreadNotifications}</Badge>}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#f7be0d"]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Emergencia */}
        <Animated.View entering={FadeIn.duration(300)}>
          <Card style={styles.emergencyCard}>
            <LinearGradient
              colors={["#fecdd3", "#fecaca"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.emergencyGradient}
            >
              <View style={styles.emergencyCardContent}>
                <View style={styles.emergencyTextContainer}>
                  <Text style={styles.emergencyTitle}>Emergencia</Text>
                  <Text style={styles.emergencyDescription}>
                    Asistencia inmediata en caso de atrapamiento en ascensor
                  </Text>
                  <Button
                    mode="contained"
                    buttonColor="#f43f5e"
                    onPress={handleEmergency}
                    style={styles.emergencyButton}
                    icon="phone"
                  >
                    Llamada de Emergencia
                  </Button>
                </View>
                <View style={styles.emergencyIconContainer}>
                  <Ionicons name="alert-circle" size={60} color="#f43f5e" />
                </View>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        {/* Accesos Rápidos */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.quickAccessContainer}>
            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("Request")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#fff8e1" }]}>
                <Ionicons name="construct" size={24} color="#f7be0d" />
              </View>
              <Text style={styles.quickAccessText}>Solicitar Servicio</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("Account")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#f0fdf4" }]}>
                <Ionicons name="document-text" size={24} color="#10b981" />
              </View>
              <Text style={styles.quickAccessText}>Estado de Cuenta</Text>
              {pendingInvoices > 0 && <Badge style={styles.quickAccessBadge}>{pendingInvoices}</Badge>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("ScheduleMeeting")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#fef3c7" }]}>
                <Ionicons name="calendar" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.quickAccessText}>Agendar Reunión</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem} onPress={() => navigation.navigate("Map")}>
              <View style={[styles.quickAccessIcon, { backgroundColor: "#ede9fe" }]}>
                <Ionicons name="location" size={24} color="#8b5cf6" />
              </View>
              <Text style={styles.quickAccessText}>Ubicación</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Próximo Mantenimiento */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Card style={styles.maintenanceCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Próximo Mantenimiento</Text>
                <Chip style={styles.statusChip} textStyle={styles.statusChipText}>
                  Programado
                </Chip>
              </View>

              <View style={[styles.maintenanceDetails, { backgroundColor: "#fff8e1" }]}>
                <View style={styles.maintenanceRow}>
                  <Ionicons name="calendar" size={20} color="#f7be0d" />
                  <Text style={styles.maintenanceText}>15 de Mayo, 2024</Text>
                </View>
                <View style={styles.maintenanceRow}>
                  <Ionicons name="time" size={20} color="#f7be0d" />
                  <Text style={styles.maintenanceText}>9:00 AM - 11:00 AM</Text>
                </View>
                <View style={styles.maintenanceRow}>
                  <Ionicons name="person" size={20} color="#f7be0d" />
                  <Text style={styles.maintenanceText}>Técnico: Carlos Rodríguez</Text>
                </View>
                <View style={styles.maintenanceRow}>
                  <Ionicons name="information-circle" size={20} color="#f7be0d" />
                  <Text style={styles.maintenanceText}>Mantenimiento preventivo mensual</Text>
                </View>
              </View>

              <View style={styles.maintenanceActions}>
                <Button
                  mode="outlined"
                  textColor="#f7be0d"
                  style={styles.maintenanceButton}
                  icon="calendar-sync"
                  onPress={() => {
                    showSuccessAlert(
                      "Solicitud Enviada",
                      "Su solicitud de reprogramación ha sido enviada. Nos pondremos en contacto pronto para confirmar.",
                    )
                  }}
                >
                  Reprogramar
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#f7be0d"
                  style={styles.maintenanceButton}
                  icon="check-circle"
                  onPress={() => {
                    showSuccessAlert(
                      "Mantenimiento Confirmado",
                      "Ha confirmado su cita de mantenimiento para el 15 de Mayo, 2024.",
                    )
                  }}
                >
                  Confirmar
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Resumen de Cuenta */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Card style={styles.accountSummaryCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Resumen de Cuenta</Text>
                <Chip
                  style={pendingInvoices > 0 ? styles.warningChip : styles.successChip}
                  textStyle={pendingInvoices > 0 ? styles.warningChipText : styles.successChipText}
                >
                  {pendingInvoices > 0 ? "Pagos pendientes" : "Al día"}
                </Chip>
              </View>

              <View style={styles.accountSummaryContent}>
                <View style={styles.accountInfoRow}>
                  <View style={styles.accountInfoItem}>
                    <Text style={styles.accountInfoLabel}>Facturas Pendientes</Text>
                    <Text
                      style={[styles.accountInfoValue, pendingInvoices > 0 ? styles.warningText : styles.successText]}
                    >
                      {pendingInvoices}
                    </Text>
                  </View>

                  <View style={styles.accountInfoItem}>
                    <Text style={styles.accountInfoLabel}>Facturas Pagadas</Text>
                    <Text style={styles.accountInfoValue}>{invoices.filter((i) => i.status === "paid").length}</Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.contractStatusContainer}>
                  <View style={styles.contractStatusHeader}>
                    <Text style={styles.contractStatusLabel}>Estado de Contrato</Text>
                    <Text style={styles.contractStatusValue}>Activo (8 meses restantes)</Text>
                  </View>
                  <ProgressBar progress={0.65} color="#f7be0d" style={styles.contractProgressBar} />
                </View>
              </View>

              <Button
                mode="outlined"
                textColor="#f7be0d"
                style={[styles.viewAccountButton, { borderColor: "#f7be0d" }]}
                icon="file-document"
                onPress={() => navigation.navigate("Account")}
              >
                Ver Estado de Cuenta
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Historial de Mantenimientos */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
          <Card style={styles.historyCard}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Historial de Mantenimientos</Text>
                <TouchableOpacity onPress={() => navigation.navigate("MaintenanceHistory")}>
                  <Text style={[styles.viewAllText, { color: "#f7be0d" }]}>Ver todos</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.maintenanceHistoryList}>
                {maintenances
                  .filter((m) => m.status === "completed")
                  .slice(0, 3)
                  .map((maintenance, index) => (
                    <View key={maintenance.id} style={styles.historyItem}>
                      <View style={styles.historyItemIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      </View>
                      <View style={styles.historyItemContent}>
                        <Text style={styles.historyItemTitle}>Mantenimiento Completado</Text>
                        <Text style={styles.historyItemDate}>
                          {new Date(maintenance.scheduledDate).toLocaleDateString()}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                    </View>
                  ))}

                {maintenances.filter((m) => m.status === "completed").length === 0 && (
                  <View style={styles.emptyHistoryContainer}>
                    <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
                    <Text style={styles.emptyHistoryText}>No hay mantenimientos completados</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Soporte y Ayuda */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
          <Card style={styles.supportCard}>
            <LinearGradient
              colors={["#fff8e1", "#ffefc1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.supportGradient}
            >
              <Card.Content>
                <Text style={styles.supportTitle}>¿Necesitas ayuda?</Text>
                <Text style={styles.supportText}>
                  Nuestro equipo de soporte está disponible para asistirte con cualquier consulta.
                </Text>

                <View style={styles.supportActions}>
                  <TouchableOpacity style={styles.supportAction} onPress={() => Linking.openURL(`tel:+593968100793`)}>
                    <View style={styles.supportActionIcon}>
                      <Ionicons name="call" size={24} color="#f7be0d" />
                    </View>
                    <Text style={styles.supportActionText}>Llamar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportAction}
                    onPress={() => {
                      const email = "soporte@teslalifts.com"
                      const subject = "Solicitud de Soporte"
                      const body = "Hola, necesito ayuda con lo siguiente:"
                      Linking.openURL(
                        `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                      )
                    }}
                  >
                    <View style={styles.supportActionIcon}>
                      <Ionicons name="mail" size={24} color="#f7be0d" />
                    </View>
                    <Text style={styles.supportActionText}>Email</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportAction}
                    onPress={() => {
                      const phoneNumber = "+593968100793"
                      const message = "Hola, necesito soporte con mi ascensor."
                      Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`)
                    }}
                  >
                    <View style={styles.supportActionIcon}>
                      <Ionicons name="logo-whatsapp" size={24} color="#f7be0d" />
                    </View>
                    <Text style={styles.supportActionText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </Card.Content>
            </LinearGradient>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Alerta de mensaje */}
      <AlertMessage
        visible={showAlert}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setShowAlert(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
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
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherWidget: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
  },
  weatherText: {
    color: "white",
    marginLeft: 4,
    fontWeight: "500",
  },
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#f43f5e",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emergencyCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  emergencyGradient: {
    borderRadius: 16,
  },
  emergencyCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#9f1239",
    marginBottom: 8,
  },
  emergencyDescription: {
    color: "#9f1239",
    lineHeight: 20,
    marginBottom: 16,
    fontSize: 15,
  },
  emergencyIconContainer: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emergencyButton: {
    borderRadius: 8,
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  quickAccessItem: {
    width: width / 2 - 24,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    position: "relative",
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
  quickAccessIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  quickAccessText: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
  },
  quickAccessBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f43f5e",
  },
  maintenanceCard: {
    marginBottom: 20,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusChip: {
    backgroundColor: "#fff8e1",
  },
  statusChipText: {
    color: "#f7be0d",
  },
  maintenanceDetails: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  maintenanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  maintenanceText: {
    marginLeft: 12,
    color: "#1f2937",
    fontSize: 15,
  },
  maintenanceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  maintenanceButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  accountSummaryCard: {
    marginBottom: 20,
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
  warningChip: {
    backgroundColor: "#fef9c3",
  },
  warningChipText: {
    color: "#854d0e",
  },
  successChip: {
    backgroundColor: "#dcfce7",
  },
  successChipText: {
    color: "#166534",
  },
  accountSummaryContent: {
    marginBottom: 16,
  },
  accountInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  accountInfoItem: {
    width: "48%",
  },
  accountInfoLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  accountInfoValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
  },
  warningText: {
    color: "#f59e0b",
  },
  successText: {
    color: "#10b981",
  },
  divider: {
    marginBottom: 16,
  },
  contractStatusContainer: {
    marginBottom: 8,
  },
  contractStatusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  contractStatusLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  contractStatusValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10b981",
  },
  contractProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  viewAccountButton: {
    borderColor: "#f7be0d",
  },
  historyCard: {
    marginBottom: 20,
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
  viewAllText: {
    fontWeight: "600",
  },
  maintenanceHistoryList: {
    marginTop: 8,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historyItemIcon: {
    marginRight: 12,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  historyItemDate: {
    fontSize: 13,
    color: "#6b7280",
  },
  emptyHistoryContainer: {
    alignItems: "center",
    padding: 24,
  },
  emptyHistoryText: {
    marginTop: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  supportCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
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
  supportGradient: {
    borderRadius: 16,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e6a800",
    marginBottom: 8,
    marginTop: 16,
  },
  supportText: {
    color: "#e6a800",
    marginBottom: 16,
    lineHeight: 20,
  },
  supportActions: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  supportAction: {
    alignItems: "center",
    width: "30%",
  },
  supportActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
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
  supportActionText: {
    color: "#e6a800",
    fontWeight: "600",
  },
})

