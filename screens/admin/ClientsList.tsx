"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { Searchbar, Card, Button, Chip, FAB, Dialog, Portal, Divider, Menu } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"


interface Client {
  id: string
  name: string
  ruc: string
  email: string
  phone: string
  address: string
  status: "active" | "inactive" | "pending"
  contractType: "monthly" | "annual" | "project"
  invoiceStatus: "paid" | "pending" | "overdue"
  buildings: number
  lifts: number
  contactPerson?: string
  lastInvoiceDate?: string
}

export default function ClientsList() {
  const navigation = useNavigation<any>()
  const [searchQuery, setSearchQuery] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [statusMenuVisible, setStatusMenuVisible] = useState(false)
  const [statusMenuPosition, setStatusMenuPosition] = useState({ x: 0, y: 0 })
  const [filterMenuVisible, setFilterMenuVisible] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<{
    status: string[]
    contractType: string[]
    invoiceStatus: string[]
  }>({
    status: [],
    contractType: [],
    invoiceStatus: [],
  })

  // Cargar datos de ejemplo
  useEffect(() => {
    const mockClients: Client[] = [
      {
        id: "1",
        name: "Torre Empresarial Lima",
        ruc: "20123456789",
        email: "admin@torreempresarial.com",
        phone: "+51 1 234 5678",
        address: "Av. La Encalada 1234, Surco, Lima",
        status: "active",
        contractType: "annual",
        invoiceStatus: "paid",
        buildings: 1,
        lifts: 4,
        contactPerson: "Juan Pérez",
        lastInvoiceDate: "2023-05-01",
      },
      {
        id: "2",
        name: "Centro Comercial Plaza",
        ruc: "20987654321",
        email: "admin@ccplaza.com",
        phone: "+51 1 987 6543",
        address: "Av. Javier Prado 567, San Isidro, Lima",
        status: "active",
        contractType: "monthly",
        invoiceStatus: "pending",
        buildings: 2,
        lifts: 8,
        contactPerson: "María Rodríguez",
        lastInvoiceDate: "2023-05-15",
      },
      {
        id: "3",
        name: "Hospital Nacional",
        ruc: "20456789123",
        email: "admin@hospitalnacional.com",
        phone: "+51 1 456 7890",
        address: "Av. Grau 800, Lima",
        status: "pending",
        contractType: "project",
        invoiceStatus: "overdue",
        buildings: 1,
        lifts: 6,
        contactPerson: "Carlos Gómez",
        lastInvoiceDate: "2023-04-20",
      },
      {
        id: "4",
        name: "Residencial Miraflores",
        ruc: "20345678912",
        email: "admin@residencialmiraflores.com",
        phone: "+51 1 345 6789",
        address: "Calle Berlín 1500, Miraflores, Lima",
        status: "active",
        contractType: "annual",
        invoiceStatus: "paid",
        buildings: 1,
        lifts: 2,
        contactPerson: "Ana Sánchez",
        lastInvoiceDate: "2023-05-10",
      },
      {
        id: "5",
        name: "Edificio Corporativo Sigma",
        ruc: "20234567891",
        email: "admin@edificiosigma.com",
        phone: "+51 1 234 5678",
        address: "Av. República de Panamá 3030, San Isidro, Lima",
        status: "inactive",
        contractType: "monthly",
        invoiceStatus: "overdue",
        buildings: 1,
        lifts: 5,
        contactPerson: "Pedro Martínez",
        lastInvoiceDate: "2023-04-15",
      },
    ]

    setClients(mockClients)
    setFilteredClients(mockClients)
  }, [])

  // Filtrar clientes
  useEffect(() => {
    let result = [...clients]

    // Aplicar búsqueda
    if (searchQuery) {
      result = result.filter(
        (client) =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.ruc.includes(searchQuery) ||
          client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.phone.includes(searchQuery),
      )
    }

    // Aplicar filtros de estado
    if (selectedFilters.status.length > 0) {
      result = result.filter((client) => selectedFilters.status.includes(client.status))
    }

    // Aplicar filtros de tipo de contrato
    if (selectedFilters.contractType.length > 0) {
      result = result.filter((client) => selectedFilters.contractType.includes(client.contractType))
    }

    // Aplicar filtros de estado de factura
    if (selectedFilters.invoiceStatus.length > 0) {
      result = result.filter((client) => selectedFilters.invoiceStatus.includes(client.invoiceStatus))
    }

    setFilteredClients(result)
  }, [searchQuery, selectedFilters, clients])

  const onChangeSearch = (query: string) => setSearchQuery(query)

  const handleAddClient = () => {
    navigation.navigate("EditClient")
  }

  const handleEditClient = (client: Client) => {
    navigation.navigate("EditClient", { clientId: client.id })
  }

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client)
    setDeleteDialogVisible(true)
  }

  const confirmDeleteClient = () => {
    // En una aplicación real, esto enviaría una solicitud a la API
    Alert.alert("Éxito", `Cliente ${selectedClient?.name} eliminado correctamente`)
    setDeleteDialogVisible(false)

    // Actualizar la lista de clientes (simulado)
    const updatedClients = clients.filter((client) => client.id !== selectedClient?.id)
    setClients(updatedClients)
  }

  const handleStatusChange = (client: Client, status: "active" | "inactive" | "pending") => {
    // En una aplicación real, esto enviaría una solicitud a la API
    const updatedClients = clients.map((c) => (c.id === client.id ? { ...c, status } : c))
    setClients(updatedClients)
    setStatusMenuVisible(false)
  }

  const openStatusMenu = (client: Client, event: any) => {
    const { pageX, pageY } = event.nativeEvent
    setSelectedClient(client)
    setStatusMenuPosition({ x: pageX, y: pageY })
    setStatusMenuVisible(true)
  }

  const toggleFilter = (type: "status" | "contractType" | "invoiceStatus", value: string) => {
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
      contractType: [],
      invoiceStatus: [],
    })
    setSearchQuery("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#10b981"
      case "inactive":
        return "#ef4444"
      case "pending":
        return "#f59e0b"
      case "paid":
        return "#10b981"
      case "overdue":
        return "#ef4444"
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
      case "pending":
        return "Pendiente"
      case "paid":
        return "Pagado"
      case "overdue":
        return "Vencido"
      case "monthly":
        return "Mensual"
      case "annual":
        return "Anual"
      case "project":
        return "Proyecto"
      default:
        return status
    }
  }

  const renderItem = ({ item }: { item: Client }) => (
    <Card style={styles.clientCard}>
      <Card.Content>
        <View style={styles.clientHeader}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{item.name}</Text>
            <Text style={styles.clientRuc}>RUC: {item.ruc}</Text>
            <Text style={styles.clientEmail}>{item.email}</Text>
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

        <View style={styles.clientDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.address}</Text>
          </View>
          {item.contactPerson && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color="#6b7280" />
              <Text style={styles.detailText}>Contacto: {item.contactPerson}</Text>
            </View>
          )}
        </View>

        <View style={styles.clientStats}>
          <View style={styles.statItem}>
            <Ionicons name="business-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.buildings} edificios</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="git-merge-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.lifts} ascensores</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="document-text-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>Contrato: {getStatusText(item.contractType)}</Text>
          </View>
        </View>

        <View style={styles.invoiceSection}>
          <Chip
            style={[styles.invoiceChip, { backgroundColor: getStatusColor(item.invoiceStatus) + "20" }]}
            textStyle={{ color: getStatusColor(item.invoiceStatus) }}
          >
            Factura: {getStatusText(item.invoiceStatus)}
          </Chip>
          {item.lastInvoiceDate && (
            <Text style={styles.invoiceDate}>
              Última factura: {new Date(item.lastInvoiceDate).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button
            mode="outlined"
            textColor="#7c3aed"
            onPress={() => handleEditClient(item)}
            style={styles.actionButton}
          >
            Editar
          </Button>
          <Button
            mode="outlined"
            textColor="#ef4444"
            onPress={() => handleDeleteClient(item)}
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity onPress={() => setFilterMenuVisible(true)}>
          <Ionicons name="options" size={24} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar clientes"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#7c3aed"
        />

        {(selectedFilters.status.length > 0 ||
          selectedFilters.contractType.length > 0 ||
          selectedFilters.invoiceStatus.length > 0) && (
          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredClients}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
        }
      />

      <FAB style={styles.fab} icon="plus" color="white" onPress={handleAddClient} />

      <Portal>
        <Menu visible={statusMenuVisible} onDismiss={() => setStatusMenuVisible(false)} anchor={statusMenuPosition}>
          <Menu.Item
            onPress={() => handleStatusChange(selectedClient!, "active")}
            title="Activo"
            leadingIcon="check-circle"
          />
          <Menu.Item
            onPress={() => handleStatusChange(selectedClient!, "inactive")}
            title="Inactivo"
            leadingIcon="close-circle"
          />
          <Menu.Item
            onPress={() => handleStatusChange(selectedClient!, "pending")}
            title="Pendiente"
            leadingIcon="clock"
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
              style={[styles.filterChip, selectedFilters.status.includes("pending") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("status", "pending")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.status.includes("pending") && styles.selectedFilterChipText,
                ]}
              >
                Pendiente
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.filterTitle}>Tipo de Contrato</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.contractType.includes("monthly") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("contractType", "monthly")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.contractType.includes("monthly") && styles.selectedFilterChipText,
                ]}
              >
                Mensual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.contractType.includes("annual") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("contractType", "annual")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.contractType.includes("annual") && styles.selectedFilterChipText,
                ]}
              >
                Anual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.contractType.includes("project") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("contractType", "project")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.contractType.includes("project") && styles.selectedFilterChipText,
                ]}
              >
                Proyecto
              </Text>
            </TouchableOpacity>
          </View>

          <Divider style={styles.divider} />

          <Text style={styles.filterTitle}>Estado de Factura</Text>
          <View style={styles.filterOptions}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFilters.invoiceStatus.includes("paid") && styles.selectedFilterChip]}
              onPress={() => toggleFilter("invoiceStatus", "paid")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.invoiceStatus.includes("paid") && styles.selectedFilterChipText,
                ]}
              >
                Pagado
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.invoiceStatus.includes("pending") && styles.selectedFilterChip,
              ]}
              onPress={() => toggleFilter("invoiceStatus", "pending")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.invoiceStatus.includes("pending") && styles.selectedFilterChipText,
                ]}
              >
                Pendiente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilters.invoiceStatus.includes("overdue") && styles.selectedFilterChip,
              ]}
              onPress={() => toggleFilter("invoiceStatus", "overdue")}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilters.invoiceStatus.includes("overdue") && styles.selectedFilterChipText,
                ]}
              >
                Vencido
              </Text>
            </TouchableOpacity>
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
            <Text>¿Está seguro que desea eliminar al cliente {selectedClient?.name}?</Text>
            <Text style={styles.warningText}>Esta acción no se puede deshacer.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancelar</Button>
            <Button textColor="#ef4444" onPress={confirmDeleteClient}>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#7c3aed",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
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
  clientCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  clientHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  clientRuc: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  statusChip: {
    height: "auto",
    borderRadius: 12,
  },
  clientDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  clientStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 6,
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#6b7280",
  },
  invoiceSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  invoiceChip: {
    marginRight: 8,
  },
  invoiceDate: {
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
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#7c3aed",
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
    marginTop: 50,
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
  },
  warningText: {
    color: "#ef4444",
    marginTop: 8,
  },
})

