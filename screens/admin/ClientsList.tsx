"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Feather } from "@expo/vector-icons"
import AppHeader from "../../components/AppHeader"
import FloatingMenuButton  from "../../components/FloatingMenuButton"
import ErrorMessage  from "../../components/ErrorMessage"
import { getClients } from "../../services/clientService"
import type { Client } from "../../types/supabase"
import { ExportPDFButton } from "../../components/ExportPDFButton"
type RootStackParamList = {
  ClientsList: undefined
  ClientDetails: { clientId: string }
  AddClient: undefined
}

export const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getClients()
      setClients(data)
    } catch (err) {
      console.error("Error al cargar clientes:", err)
      setError("No se pudieron cargar los clientes. Por favor, intente de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleClientPress = (client: Client) => {
    // Navegar a la pantalla de detalles del cliente
    navigation.navigate("ClientDetails", { clientId: client.user_id })
  }

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity style={styles.clientCard} onPress={() => handleClientPress(item)}>
      <View style={styles.clientHeader}>
        <Text style={styles.buildingName}>{item.building_name || "Sin nombre"}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.payment_status ?? undefined) }]}>
          <Text style={styles.statusText}>{item.payment_status || "No especificado"}</Text>
        </View>
      </View>

      <View style={styles.clientInfo}>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={16} color="#666" />
          <Text style={styles.infoText}>{item.address || "Sin dirección"}</Text>
        </View>

        <View style={styles.infoRow}>
          <Feather name="box" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.elevator_count || 0} elevadores • {item.elevator_brand || "Marca N/A"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Feather name="file-text" size={16} color="#666" />
          <Text style={styles.infoText}>Contrato: {item.contract_type || "No especificado"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "al día":
      case "pagado":
        return "#4CAF50"
      case "pendiente":
        return "#FF9800"
      case "atrasado":
      case "mora":
        return "#F44336"
      default:
        return "#9E9E9E"
    }
  }

  const renderHeader = () => <AppHeader title="Clientes" rightComponent={<ExportPDFButton clients={clients} />} />

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Cargando clientes...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <ErrorMessage
          visible={!!error}
          title="Error"
          message={error}
          onClose={() => setError(null)}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderHeader()}

      {clients.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather name="users" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay clientes registrados</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddClient")}>
            <Text style={styles.addButtonText}>Agregar Cliente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clients}
          renderItem={renderClientItem}
          keyExtractor={(item) => item.user_id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FloatingMenuButton />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Espacio para el botón flotante
  },
  clientCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  buildingName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  clientInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: "#0066cc",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
