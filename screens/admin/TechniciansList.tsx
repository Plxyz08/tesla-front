"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from "react-native"
import { Searchbar, Card, Button, Chip, FAB, Dialog, Portal } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"
import AppHeader from "../../components/AppHeader"
import { useAuth } from "../../context/AuthContext"
import type { User } from "../../context/AuthContext"
import PDFGenerator from "../../services/PDFGenerator"

// Modificar la interfaz Technician para que coincida con la estructura de datos real
interface Technician extends User {
  // No necesitamos redefinir propiedades que ya están en User
}

export default function TechniciansList() {
  const navigation = useNavigation<any>()
  const { user, users } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [filteredTechnicians, setFilteredTechnicians] = useState<Technician[]>([])
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null)
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Cargar datos de ejemplo
  // Modificar el useEffect para mapear correctamente los datos
  useEffect(() => {
    // Filter technicians from all users
    const technicianList = users?.filter((user): user is Technician => user.role === "technician") as Technician[]
    setTechnicians(technicianList || [])
    setFilteredTechnicians(technicianList || [])
  }, [users])

  // Filtrar técnicos
  useEffect(() => {
    let result = [...technicians]

    // Aplicar búsqueda
    if (searchQuery) {
      result = result.filter(
        (technician) =>
          technician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          technician.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          technician.phone?.includes(searchQuery),
      )
    }

    setFilteredTechnicians(result)
  }, [searchQuery, technicians])

  const onChangeSearch = (query: string) => setSearchQuery(query)

  const handleAddTechnician = () => {
    navigation.navigate("CreateUser")
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
    Alert.alert("Éxito", `Técnico ${selectedTechnician?.name} eliminado correctamente`, [
      { text: "OK", onPress: () => navigation.navigate("TechniciansList" as never) },
    ])
    setDeleteDialogVisible(false)

    // Actualizar la lista de técnicos (simulado)
    const updatedTechnicians = technicians.filter((technician) => technician.id !== selectedTechnician?.id)
    setTechnicians(updatedTechnicians)
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

  // Función para exportar técnicos a PDF
  const exportTechniciansToPDF = async () => {
    try {
      setIsExporting(true)

      // Obtener la fecha actual formateada
      const today = new Date()
      const formattedDate = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`
      const fileName = `Lista_tecnicos_${formattedDate}`

      // Estadísticas de técnicos
      const totalTechnicians = filteredTechnicians.length
      const activeTechnicians = filteredTechnicians.filter((tech) => tech.status === "active").length
      const inactiveTechnicians = filteredTechnicians.filter((tech) => tech.status === "inactive").length
      const onLeaveTechnicians = filteredTechnicians.filter((tech) => tech.status === "on_leave").length

      // Crear filas de la tabla de técnicos
      const technicianRows = filteredTechnicians
        .map(
          (technician, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${technician.name || "N/A"}</td>
          <td>${technician.email || "N/A"}</td>
          <td>${technician.phone || "N/A"}</td>
          <td>${technician.specialization?.join(", ") || "N/A"}</td>
          <td>
            <span style="
              display: inline-block;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              background-color: ${getStatusColor(technician.status || "inactive")}20;
              color: ${getStatusColor(technician.status || "inactive")};
            ">
              ${getStatusText(technician.status || "inactive")}
            </span>
          </td>
        </tr>
      `,
        )
        .join("")

      // Crear el HTML del PDF
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Lista de Técnicos</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                color: #1f2937;
                position: relative;
              }
              
              /* Marca de agua */
              body::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-image: url('data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrCTAAeEpjHqq4b6AAAAAASUVORK5CYII=');
                background-repeat: no-repeat;
                background-position: center;
                background-size: 200px;
                opacity: 0.1;
                z-index: -1;
              }
              
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              
              .logo {
                font-size: 24px;
                font-weight: bold;
                color: #efb810;
                margin-bottom: 10px;
              }
              
              .report-title {
                font-size: 22px;
                margin-bottom: 5px;
                color: #efb810;
              }
              
              .report-date {
                color: #6b7280;
                margin-bottom: 20px;
              }
              
              .summary-section {
                margin-bottom: 30px;
                background-color: #fffbeb;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #efb810;
              }
              
              .summary-title {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #efb810;
              }
              
              .summary-stats {
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
              }
              
              .stat-item {
                margin-bottom: 10px;
                width: 48%;
              }
              
              .stat-label {
                color: #6b7280;
                font-size: 14px;
              }
              
              .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #1f2937;
              }
              
              .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
                color: #efb810;
                border-bottom: 2px solid #efb810;
                padding-bottom: 5px;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
              }
              
              th, td {
                padding: 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
              }
              
              th {
                background-color: #fffbeb;
                font-weight: bold;
                color: #92400e;
              }
              
              tr:nth-child(even) {
                background-color: #fafafa;
              }
              
              .footer {
                margin-top: 50px;
                text-align: center;
                color: #6b7280;
                font-size: 12px;
                border-top: 1px solid #e5e7eb;
                padding-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TESLA LIFT</div>
              <div class="report-title">Lista de Técnicos</div>
              <div class="report-date">Generado el ${today.toLocaleDateString()}</div>
            </div>
            
            <div class="summary-section">
              <div class="summary-title">Resumen</div>
              <div class="summary-stats">
                <div class="stat-item">
                  <div class="stat-label">Total de Técnicos</div>
                  <div class="stat-value">${totalTechnicians}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Técnicos Activos</div>
                  <div class="stat-value">${activeTechnicians}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Técnicos Inactivos</div>
                  <div class="stat-value">${inactiveTechnicians}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">Técnicos de Permiso</div>
                  <div class="stat-value">${onLeaveTechnicians}</div>
                </div>
              </div>
            </div>
            
            <div class="section-title">Listado de Técnicos</div>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Especialización</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${
                  technicianRows ||
                  `
                  <tr>
                    <td colspan="6" style="text-align: center; color: #6b7280;">No hay técnicos disponibles</td>
                  </tr>
                `
                }
              </tbody>
            </table>
            
            <div class="footer">
              <p>Este documento es un reporte generado automáticamente.</p>
              <p>© ${new Date().getFullYear()} TESLA LIFT - Todos los derechos reservados</p>
            </div>
          </body>
        </html>
      `

      // Generar el PDF utilizando el servicio existente
      const result = await PDFGenerator.generateAccountStatementPDF([], [], {
        customHtml: html,
        fileName: fileName,
      })

      if (result.success) {
        // Compartir el PDF generado
        await PDFGenerator.sharePDF(result.filePath)
        Alert.alert("Éxito", "Lista de técnicos exportada correctamente")
      } else {
        Alert.alert("Error", "No se pudo generar el PDF. Intente nuevamente.")
      }
    } catch (error) {
      console.error("Error al exportar técnicos:", error)
      Alert.alert("Error", "Ocurrió un error al exportar la lista de técnicos")
    } finally {
      setIsExporting(false)
    }
  }

  // Componente para el botón de exportar en el header
  const ExportButton = () => (
    <TouchableOpacity
      style={styles.exportButton}
      onPress={exportTechniciansToPDF}
      disabled={isExporting}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="download-outline" size={22} color="white" />
    </TouchableOpacity>
  )

  // Modificar el renderItem para mostrar correctamente los datos
  const renderItem = ({ item }: { item: Technician }) => (
    <Card style={styles.technicianCard}>
      <Card.Content>
        <View style={styles.technicianHeader}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.technicianPhoto} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="person" size={30} color="#d1d5db" />
            </View>
          )}
          <View style={styles.technicianInfo}>
            <Text style={styles.technicianName}>{item.name}</Text>
            <Text style={styles.technicianEmail}>{item.email}</Text>
            <Text style={styles.technicianPhone}>{item.phone || "No disponible"}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status || "inactive") + "20" }]}
            textStyle={{ color: getStatusColor(item.status || "inactive") }}
          >
            {getStatusText(item.status || "inactive")}
          </Chip>
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
        rightComponent={<ExportButton />}
      />

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Buscar técnicos"
          onChangeText={onChangeSearch}
          value={searchQuery}
          style={styles.searchbar}
          iconColor="#7c3aed"
        />
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

// Añadir estilo para el placeholder de la foto
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  exportButton: {
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
  warningText: {
    color: "#ef4444",
    marginTop: 8,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
})
