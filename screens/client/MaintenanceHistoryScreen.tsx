"use client"

import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform, StatusBar } from "react-native"
import { Card, Chip, Divider } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import { useApp } from "../../context/AppContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import Animated, { FadeInDown } from "react-native-reanimated"

export default function MaintenanceHistoryScreen() {
  const navigation = useNavigation<any>()
  const { maintenances } = useApp()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<"all" | "completed" | "scheduled" | "in-progress">("all")

  // Filter maintenances based on active filter
  const filteredMaintenances = React.useMemo(() => {
    if (activeFilter === "all") return maintenances
    return maintenances.filter((m) => m.status === activeFilter)
  }, [maintenances, activeFilter])

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }, [])

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10b981" // green
      case "scheduled":
        return "#0284c7" // blue
      case "in-progress":
        return "#f59e0b" // amber
      default:
        return "#6b7280" // gray
    }
  }

  // Get status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "scheduled":
        return "Programado"
      case "in-progress":
        return "En Progreso"
      default:
        return status
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0284c7" />

      {/* Header with gradient */}
      <LinearGradient colors={["#0284c7", "#0369a1"]} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Historial de Mantenimientos</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      {/* Filter tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === "all" && styles.activeFilterChip]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[styles.filterChipText, activeFilter === "all" && styles.activeFilterChipText]}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === "completed" && styles.completedFilterChip]}
            onPress={() => setActiveFilter("completed")}
          >
            <Text style={[styles.filterChipText, activeFilter === "completed" && styles.completedFilterChipText]}>
              Completados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === "scheduled" && styles.scheduledFilterChip]}
            onPress={() => setActiveFilter("scheduled")}
          >
            <Text style={[styles.filterChipText, activeFilter === "scheduled" && styles.scheduledFilterChipText]}>
              Programados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === "in-progress" && styles.inProgressFilterChip]}
            onPress={() => setActiveFilter("in-progress")}
          >
            <Text style={[styles.filterChipText, activeFilter === "in-progress" && styles.inProgressFilterChipText]}>
              En Progreso
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0284c7"]} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredMaintenances.length > 0 ? (
          filteredMaintenances.map((maintenance, index) => (
            <Animated.View key={maintenance.id} entering={FadeInDown.duration(400).delay(index * 100)}>
              <Card style={styles.maintenanceCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                      <Text style={styles.dateText}>{formatDate(maintenance.scheduledDate.toString())}</Text>
                      <Chip
                        style={[styles.statusChip, { backgroundColor: `${getStatusColor(maintenance.status)}20` }]}
                        textStyle={{ color: getStatusColor(maintenance.status) }}
                      >
                        {getStatusText(maintenance.status)}
                      </Chip>
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.maintenanceDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="construct" size={20} color="#0284c7" />
                      <Text style={styles.detailText}>{maintenance.type || "Mantenimiento preventivo"}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color="#0284c7" />
                      <Text style={styles.detailText}>
                        {new Date(maintenance.scheduledDate).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>

                    {maintenance.technicianName && (
                      <View style={styles.detailRow}>
                        <Ionicons name="person" size={20} color="#0284c7" />
                        <Text style={styles.detailText}>Técnico: {maintenance.technicianName}</Text>
                      </View>
                    )}

                    {maintenance.notes && (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text" size={20} color="#0284c7" />
                        <Text style={styles.detailText}>{maintenance.notes}</Text>
                      </View>
                    )}
                  </View>

                  {maintenance.status === "completed" && (
                    <View style={styles.completionInfo}>
                      <View style={styles.completionHeader}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={styles.completionTitle}>Detalles de Finalización</Text>
                      </View>

                      <View style={styles.completionDetails}>
                        {maintenance.completionDate && (
                          <Text style={styles.completionText}>
                            Completado el: {maintenance.completionDate ? new Date(maintenance.completionDate.toString()).toLocaleDateString() : "Fecha no disponible"}
                          </Text>
                        )}

                        {maintenance.duration && (
                          <Text style={styles.completionText}>Duración: {maintenance.duration} minutos</Text>
                        )}
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No hay mantenimientos para mostrar</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === "all"
                ? "No se encontraron registros de mantenimiento"
                : `No hay mantenimientos con estado "${getStatusText(activeFilter)}"`}
            </Text>
          </View>
        )}
      </ScrollView>
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
  filterContainer: {
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
  filterScroll: {
    paddingRight: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: "#0284c7",
  },
  completedFilterChip: {
    backgroundColor: "#d1fae5",
  },
  scheduledFilterChip: {
    backgroundColor: "#e0f2fe",
  },
  inProgressFilterChip: {
    backgroundColor: "#fef3c7",
  },
  filterChipText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "white",
  },
  completedFilterChipText: {
    color: "#10b981",
  },
  scheduledFilterChipText: {
    color: "#0284c7",
  },
  inProgressFilterChipText: {
    color: "#f59e0b",
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  maintenanceCard: {
    marginBottom: 16,
    borderRadius: 12,
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
    marginBottom: 12,
  },
  dateContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginBottom: 16,
  },
  maintenanceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    color: "#4b5563",
    fontSize: 15,
    flex: 1,
  },
  completionInfo: {
    backgroundColor: "#f0fdf4",
    padding: 16,
    borderRadius: 12,
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  completionTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#10b981",
  },
  completionDetails: {
    paddingLeft: 28,
  },
  completionText: {
    color: "#374151",
    marginBottom: 8,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    maxWidth: "80%",
  },
})

