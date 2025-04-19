"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from "react-native"
import { Divider, IconButton, Button, Menu, Searchbar } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useApp } from "../../context/AppContext"
import { useAuth } from "../../context/AuthContext"
import Animated, { FadeInRight, FadeOutLeft } from "react-native-reanimated"
import AppHeader from "../../components/AppHeader"
import AlertMessage from "../../components/alertMessage"

const COLORS = {
  adminPrimary: "#7c3aed", // Morado para admin
  technicianPrimary: "#059669", // Verde para técnico
  clientPrimary: "#efb810", // Dorado para clientes
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

export default function NotificationsScreen() {
  const navigation = useNavigation<any>()
  const { notifications, markNotificationAsRead, clearNotifications } = useApp()
  const { user } = useAuth()

  const [filteredNotifications, setFilteredNotifications] = useState(notifications)
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "emergency" | "task" | "info">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [menuVisible, setMenuVisible] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertData, setAlertData] = useState({ title: "", message: "" })

  // Determinar el color primario según el rol del usuario
  const primaryColor =
    user?.role === "admin"
      ? COLORS.adminPrimary
      : user?.role === "technician"
        ? COLORS.technicianPrimary
        : COLORS.clientPrimary

  useEffect(() => {
    applyFilters()
  }, [notifications, activeFilter, searchQuery])

  const applyFilters = () => {
    let filtered = [...notifications]

    // Apply type filter
    if (activeFilter !== "all") {
      if (activeFilter === "unread") {
        filtered = filtered.filter((notification) => !notification.read)
      } else {
        filtered = filtered.filter((notification) => notification.type === activeFilter)
      }
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (notification) =>
          notification.title.toLowerCase().includes(query) || notification.message.toLowerCase().includes(query),
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredNotifications(filtered)
  }

  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === "emergency") {
      if (user?.role === "client") {
        navigation.navigate("Emergency" as never)
      } else {
        // For technicians and admins, navigate to the relevant maintenance
        Alert.alert("Emergencia", notification.message, [
          { text: "Ver en mapa", onPress: () => navigation.navigate("Map" as never) },
          { text: "Cerrar", style: "cancel" },
        ])
      }
    } else if (notification.type === "task") {
      if (user?.role === "technician") {
        navigation.navigate("Maintenance" as never)
      } else if (user?.role === "admin") {
        navigation.navigate("TechnicianList" as never)
      } else {
        navigation.navigate("Request" as never)
      }
    } else {
      // Info notifications just mark as read
    }
  }

  const handleClearAll = () => {
    Alert.alert("Limpiar notificaciones", "¿Está seguro que desea eliminar todas las notificaciones?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: clearNotifications },
    ])
  }

  const handleMarkAllAsRead = () => {
    filteredNotifications.forEach((notification) => {
      if (!notification.read) {
        markNotificationAsRead(notification.id)
      }
    })
    setMenuVisible(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return "alert-circle"
      case "task":
        return "construct"
      case "info":
        return "information-circle"
      default:
        return "notifications"
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "emergency":
        return COLORS.error
      case "task":
        return COLORS.warning
      case "info":
        return COLORS.info
      default:
        return COLORS.textTertiary
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "Ahora mismo"
    if (diffMins < 60) return `Hace ${diffMins} minutos`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} horas`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 30) return `Hace ${diffDays} días`

    return date.toLocaleDateString()
  }

  const renderNotification = ({ item }: { item: any }) => (
    <Animated.View entering={FadeInRight.duration(300)} exiting={FadeOutLeft.duration(300)}>
      <TouchableOpacity
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.notificationIcon, { backgroundColor: getNotificationColor(item.type) }]}>
          <Ionicons name={getNotificationIcon(item.type)} size={20} color="white" />
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatTimeAgo(item.timestamp)}</Text>
          </View>

          <Text style={styles.notificationMessage} numberOfLines={2}>
            {item.message}
          </Text>

          {!item.read && <View style={styles.unreadIndicator} />}
        </View>
      </TouchableOpacity>
      <Divider />
    </Animated.View>
  )

  const handleAlertClose = () => {
    setAlertVisible(false)
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notificaciones" showBackButton />
      <View style={styles.header}>

        <Searchbar
          placeholder="Buscar notificaciones"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#6b7280"
        />

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === "all" && styles.activeFilterChip]}
              onPress={() => setActiveFilter("all")}
            >
              <Text style={[styles.filterChipText, activeFilter === "all" && styles.activeFilterChipText]}>Todas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, activeFilter === "unread" && styles.activeFilterChip]}
              onPress={() => setActiveFilter("unread")}
            >
              <Text style={[styles.filterChipText, activeFilter === "unread" && styles.activeFilterChipText]}>
                No leídas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "emergency" && styles.activeFilterChip,
                activeFilter === "emergency" && { backgroundColor: "#fef2f2" },
              ]}
              onPress={() => setActiveFilter("emergency")}
            >
              <Text style={[styles.filterChipText, activeFilter === "emergency" && { color: "#ef4444" }]}>
                Emergencias
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "task" && styles.activeFilterChip,
                activeFilter === "task" && { backgroundColor: "#fffbeb" },
              ]}
              onPress={() => setActiveFilter("task")}
            >
              <Text style={[styles.filterChipText, activeFilter === "task" && { color: "#f59e0b" }]}>Tareas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === "info" && styles.activeFilterChip,
                activeFilter === "info" && { backgroundColor: "#f0f9ff" },
              ]}
              onPress={() => setActiveFilter("info")}
            >
              <Text style={[styles.filterChipText, activeFilter === "info" && { color: "#0ea5e9" }]}>Información</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationsList}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyText}>No hay notificaciones</Text>
          {searchQuery && <Text style={styles.emptySubtext}>No se encontraron resultados para "{searchQuery}"</Text>}
          {activeFilter !== "all" && !searchQuery && (
            <Text style={styles.emptySubtext}>No hay notificaciones con el filtro seleccionado</Text>
          )}
          <Button
            mode="outlined"
            onPress={() => {
              setActiveFilter("all")
              setSearchQuery("")
            }}
            style={styles.resetButton}
          >
            Mostrar todas
          </Button>
        </View>
      )}

      {/* Alert Message */}
      <AlertMessage
        visible={alertVisible}
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
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  menu: {
    position: "absolute",
    top: 50,
    right: 16,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    elevation: 0,
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: "#e0f2fe",
  },
  filterChipText: {
    fontSize: 14,
    color: "#6b7280",
  },
  activeFilterChipText: {
    color: "#0ea5e9",
    fontWeight: "500",
  },
  notificationsList: {
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
  },
  unreadNotification: {
    backgroundColor: "#f0f9ff",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    position: "relative",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#6b7280",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0ea5e9",
    position: "absolute",
    top: 0,
    right: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  resetButton: {
    marginTop: 8,
  },
})
