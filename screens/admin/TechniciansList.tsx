"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native"
import { Searchbar, Card, Button, Chip, FAB, Dialog, Portal, Divider, Menu } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import AppHeader from "../../components/AppHeader"

interface Technician {
  id: string
  name: string
  email: string
  phone: string
  photo: string
  status: "active" | "inactive" | "on_leave"
  specialization: string[]
  reportsCount: number
  lastActive?: string
}

export default function TechniciansList() {
  const navigation = useNavigation<any>()
  const [searchQuery, setSearchQuery] = useState("")
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [statusMenuVisible, setStatusMenuVisible] = useState(false)
  const [statusMenuPosition, setStatusMenuPosition] = useState({ x: 0, y: 0 })
  const [filterMenuVisible, setFilterMenuVisible] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<{
    status: string[]
    specialization: string[]
  }>({
    status: [],
    specialization: [],
  })

  // Cargar datos de ejemplo
  useEffect(() => {
    const mockTechnicians: Technician[] = [
      {
        id: "1",
        name: "Carlos Rodríguez",
        email: "carlos.rodriguez@teslalifts.com",
        phone: "+51 999 888 777",
        photo: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        status: "active",
        specialization: ["Mantenimiento", "Instalación"],
        reportsCount: 15,
        lastActive: "2023-05-15",
      },
      {
        id: "2",
        name: "María López",
        email: "maria.lopez@teslalifts.com",
        phone: "+51 999 777 666",
        photo: "https://i.pravatar.cc/150?u=a042581f4e29026705e",
        status: "active",
        specialization: ["Reparación", "Emergencias"],
        reportsCount: 12,
        lastActive: "2023-05-18",
      },
      {
        id: "3",
        name: "Juan Pérez",
        email: "juan.perez@teslalifts.com",
        phone: "+51 999 666 555",
        photo: "https://i.pravatar.cc/150?u=a042581f4e29026706f",
        status: "inactive",
        specialization: ["Mantenimiento", "Inspección"],
        reportsCount: 8,
        lastActive: "2023-05-10",
      },
      {
        id: "4",
        name: "Ana Gómez",
        email: "ana.gomez@teslalifts.com",
        phone: "+51 999 555 444",
        photo: "https://i.pravatar.cc/150?u=a042581f4e29026707g",
        status: "on_leave",
        specialization: ["Instalación", "Modernización"],
        reportsCount: 10,
        lastActive: "2023-05-12",
      },
      {
        id: "5",
        name: "Pedro Sánchez",
        email: "pedro.sanchez@teslalifts.com",
        phone: "+51 999 444 333",
        photo: "https://i.pravatar.cc/150?u=a042581f4e29026708h",
        status: "active",
        specialization: ["Certificación", "Inspección"],
        reportsCount: 7,
        lastActive: "2023-05-17",
      },
    ]

    setTechnicians(mockTechnicians)
    setFilteredTechnicians(mockTechnicians)
  }, [])

  // Filtrar técnicos
  useEffect(() => {
    let result = [...technicians]

    // Aplicar búsqueda
    if (searchQuery) {
      result = result.filter(
        (technician) =>
          technician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          technician.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          technician.phone.includes(searchQuery),
      )
    }

    // Aplicar filtros de estado
    if (selectedFilters.status.length > 0) {
      result = result.filter((technician) => selectedFilters.status.includes(technician.status))
    }

    // Aplicar filtros de especialización
    if (selectedFilters.specialization.length > 0) {
      result = result.filter((technician) =>
        technician.specialization.some((spec) => selectedFilters.specialization.includes(spec)),
      )
    }

    setFilteredTechnicians(result)
  }, [searchQuery, selectedFilters, technicians])

  const onChangeSearch = (query: string) => setSearchQuery(query)

  const handleAddTechnician = () => {
    navigation.navigate("EditTechnician")
  }

  const handleEditTechnician = (technician: Technician) => {
    navigation.navigate("EditTechnician", { technicianId: technician.id })
  }

  const handleDeleteTechnician = (technician: Technician) => {
    setSelectedTechnician(technician)
    setDeleteDialogVisible(true)
  }

  const confirmDeleteTechnician = () => {
    // En una aplicación real, esto enviaría una solicitud a la API
    Alert.alert("Éxito", `Técnico ${selectedTechnician?.name} eliminado correctamente`)
    setDeleteDialogVisible(false)

    // Actualizar la lista de técnicos (simulado)
    const updatedTechnicians = technicians.filter((technician) => technician.id !== selectedTechnician?.id)
    setTechnicians(updatedTechnicians)
  }

  const handleStatusChange = (technician: Technician, status: "active" | "inactive" | "on_leave") => {
    // En una aplicación real, esto enviaría una solicitud a la API
    const updatedTechnicians = technicians.map((t) => (t.id === technician.id ? { ...t, status } : t))
    setTechnicians(updatedTechnicians)
    setStatusMenuVisible(false)
  }

  const openStatusMenu = (technician: Technician, event: any) => {
    const { pageX, pageY } = event.nativeEvent
    setSelectedTechnician(technician)
    setStatusMenuPosition({ x: pageX, y: pageY })
    setStatusMenuVisible(true)
  }

  const toggleFilter = (type: "status" | "specialization", value: string) => {
    setSelectedFilters((prev) => {
      const current = [...prev[type]]
      const index = current.indexOf(value)

      if (index > -1) {
        current.splice(index, 1)
      } else {
        current.push(value)
      }

      return {
        ...prev,
        [type]: current,
      }
    })
  }

  const clearFilters = () => {
    setSelectedFilters({
      status: [],
      specialization: [],
    })
    setSearchQuery("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10b981"
      case "inactive":
        return "#ef4444"
      case "on_leave":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "inactive":
        return "Inactivo"
      case "on_leave":
        return "De permiso"
      default:
        return status
    }
  }

  // Componente para el botón de filtro en el header
  const FilterButton = () => (
    <TouchableOpacity
      style={styles.filterButton}
      onPress={() => setFilterMenuVisible(true)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="options-outline" size={22} color="white" />
    </TouchableOpacity>
  )

  const renderItem = ({ item }: { item: Technician }) => (
    <Card style={styles.technicianCard}>
      <Card.Content>
        <View style={styles.technicianHeader}>
          <Image source={{ uri: item.photo }} style={styles.technicianPhoto} />
          <View style={styles.technicianInfo}>
            <Text style={styles.technicianName}>{item.name}</Text>
            <Text style={styles.technicianEmail}>{item.email}</Text>
            <Text style={styles.technicianPhone}>{item.phone}</Text>
          </View>
          <TouchableOpacity onPress={(e) => openStatusMenu(item, e)}>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) + "20" }]}
              textStyle={{ color: getStatusColor(item.status) }}
            >
              {getStatusText(item.status)}
            </Chip>
          </TouchableOpacity>
        </View>

        <View style={styles.specializationContainer}>
          {item.specialization.map((spec) => (
            <Chip key={spec} style={styles.specializationChip}>
              {spec}
            </Chip>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.reportsCount} reportes</Text>
          </View>
          {item.lastActive && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.statText}>Activo: {new Date(item.lastActive).toLocaleDateString()}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            textColor="#7c3aed"
            onPress={() => handleEditTechnician(item)}
            style={styles.actionButton}
          >
            Editar
          </Button>
          <Button
            mode="outlined"
            textColor="#ef4444"
            onPress={() => handleDeleteTechnician(item)}
            style={styles.actionButton}
          >
            Eliminar
          </Button>
        </View>
      </Card.Content>
    </Card>
  )

  return (
    <View style={styles.container}>
      <AppHeader
        title="Lista de Técnicos"
        subtitle="Gestiona todos los técnicos de Tesla Lift"
        showBackButton={true}
        rightComponent={<FilterButton />}
      />

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar técnicos"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#7c3aed"
        />

        {(selectedFilters.status.length > 0 || selectedFilters.specialization.length > 0) && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredTechnicians}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No se encontraron técnicos</Text>
          </View>
        }
      />

      <FAB style={styles.fab} icon="plus" color="white" onPress={handleAddTechnician} />

      <Portal>
        <Menu visible={statusMenuVisible} onDismiss={() => setStatusMenuVisible(false)} anchor={statusMenuPosition}>
          <Menu.Item
            onPress={() => handleStatusChange(selectedTechnician!, "active")}
            title="Activo"
            leadingIcon="check-circle"
          />
          <Menu.Item
            onPress={() => handleStatusChange(selectedTechnician!, "inactive")}
            title="Inactivo"
            leadingIcon="close-circle"
          />
          <Menu.Item
            onPress={() => handleStatusChange(selectedTechnician!, "on_leave")}
            title="De permiso"
            leadingIcon="calendar"
          />
        </Menu>

        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={{ x: 0, y: 120 }}
          contentStyle={styles.filterMenu}
        >
          <Text style={styles.filterTitle}>Estado</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.status.includes("active") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("status", "active")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.status.includes("active") && styles.selectedFilterChipText,
                ]}
              >
                Activo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.status.includes("inactive") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("status", "inactive")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.status.includes("inactive") && styles.selectedFilterChipText,
                ]}
              >
                Inactivo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.status.includes("on_leave") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("status", "on_leave")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.status.includes("on_leave") && styles.selectedFilterChipText,
                ]}
              >
                De permiso
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.filterTitle}>Especialización</Text>
          <View style={styles.filterOptions}>
            {[
              "Mantenimiento",
              "Reparación",
              "Instalación",
              "Emergencias",
              "Inspección",
              "Modernización",
              "Certificación",
            ].map((spec) => (
              <TouchableOpacity
                key={spec}
                style={[styles.filterChip, selectedFilters.specialization.includes(spec) && styles.selectedFilterChip]}
                onPress={() => toggleFilter("specialization", spec)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilters.specialization.includes(spec) && styles.selectedFilterChipText,
                  ]}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Divider style={styles.divider} />

          <Button
            mode="contained"
            onPress={() => setFilterMenuVisible(false)}
            buttonColor="#7c3aed"
            style={styles.applyFiltersButton}
          >
            Aplicar Filtros
          </Button>
        </Menu>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Confirmar eliminación</Dialog.Title>
          <Dialog.Content>
            <Text>¿Está seguro que desea eliminar al técnico {selectedTechnician?.name}?</Text>
            <Text style={styles.warningText}>Esta acción no se puede deshacer.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button textColor="#ef4444" onPress={confirmDeleteTechnician}>
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchbar: {
    elevation: 0,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
  },
  clearFiltersButton: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  clearFiltersText: {
    color: "#7c3aed",
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  technicianCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  technicianHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  technicianPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  technicianEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  technicianPhone: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: "auto",
    borderRadius: 12,
    marginLeft: 10,
    marginTop: -40,
  },
  specializationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  specializationChip: {
    margin: 4,
    backgroundColor: "#f3f4f6",
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#7c3aed",
    borderRadius: 28,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  filterMenu: {
    padding: 16,
    marginTop: 10,
    width: "80%",
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterChip: {
    backgroundColor: "#7c3aed",
  },
  filterChipText: {
    fontSize: 14,
    color: "#4b5563",
  },
  selectedFilterChipText: {
    color: "white",
  },
  divider: {
    marginVertical: 16,
  },
  applyFiltersButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  warningText: {
    color: "#ef4444",
    marginTop: 8,
  },
})

