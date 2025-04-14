"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Button, Divider, Chip, Portal, Dialog, Checkbox, ProgressBar } from "react-native-paper"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { Report } from "../../models/technician"
import Animated, { FadeInDown } from "react-native-reanimated"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"
import DateTimePicker from "@react-native-community/datetimepicker"

// Definir colores para el tema de administrador
const COLORS = {
  primary: "#7c3aed", // Morado para administradores
  primaryDark: "#6d28d9",
  primaryLight: "#ede9fe",
  secondary: "#8b5cf6", // Morado más claro para acentos
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

const { width } = Dimensions.get("window")

// Datos simulados para técnicos
const technicians = [
  { id: "1", name: "Carlos Rodríguez", role: "Técnico Senior", reports: 12, clients: 8 },
  { id: "2", name: "María López", role: "Técnico Junior", reports: 8, clients: 5 },
  { id: "3", name: "Juan Pérez", role: "Técnico Senior", reports: 15, clients: 10 },
]

// Datos simulados para clientes
const clients = [
  { id: "1001", name: "Torre Empresarial", address: "Av. La Encalada 1234, Lima", reports: 5, technicians: 2 },
  { id: "1002", name: "Centro Comercial Plaza", address: "Av. Javier Prado 567, Lima", reports: 8, technicians: 3 },
  {
    id: "1003",
    name: "Edificio Residencial Los Pinos",
    address: "Calle Las Flores 890, Lima",
    reports: 3,
    technicians: 1,
  },
  { id: "1004", name: "Hospital Central", address: "Av. Salaverry 3456, Lima", reports: 10, technicians: 4 },
]

export default function ReportsModule() {
  const navigation = useNavigation<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // Estado
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)))
  const [endDate, setEndDate] = useState(new Date())
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReportUri, setGeneratedReportUri] = useState<string | null>(null)
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
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterDialogVisible, setFilterDialogVisible] = useState(false)
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([])
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [includeReports, setIncludeReports] = useState(true)
  const [includeTechnicians, setIncludeTechnicians] = useState(true)
  const [includeClients, setIncludeClients] = useState(true)
  const [generationProgress, setGenerationProgress] = useState(0)

  // Cargar reportes al iniciar
  useEffect(() => {
    fetchReports()
  }, [])

  // Obtener reportes
  const fetchReports = async () => {
    setIsLoading(true)

    try {
      // Obtener todos los reportes
      const response = await technicianApi.reports.getAll(user?.id || "admin")

      if (response.success) {
        // Filtrar reportes por fecha
        const filteredReports = response.data.filter((report) => {
          const reportDate = new Date(report.date)
          return reportDate >= startDate && reportDate <= endDate
        })

        // Ordenar reportes por fecha (más recientes primero)
        const sortedReports = filteredReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        // Agregar nombre de técnico simulado a cada reporte
        const reportsWithTechnician = sortedReports.map((report) => {
          const technicianIndex = Math.floor(Math.random() * technicians.length)
          return {
            ...report,
            technicianName: technicians[technicianIndex].name,
            technicianId: technicians[technicianIndex].id,
          }
        })

        setReports(reportsWithTechnician)
      } else {
        throw new Error(response.message || "No se pudieron cargar los reportes")
      }
    } catch (error: any) {
      console.error("Error fetching reports:", error)
      showErrorAlert("Error al cargar reportes", error.message || "No se pudieron cargar los reportes")
    } finally {
      setIsLoading(false)
    }
  }

  // Mostrar alerta de éxito
  const showSuccessAlert = (title: string, message: string) => {
    setAlertData({
      type: "success",
      title,
      message,
    })
    setAlertVisible(true)
  }

  // Mostrar alerta de error
  const showErrorAlert = (title: string, message: string) => {
    setErrorData({
      title,
      message,
    })
    setErrorVisible(true)
  }

  // Manejar cambio de fecha de inicio
  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false)
    if (selectedDate) {
      setStartDate(selectedDate)
    }
  }

  // Manejar cambio de fecha de fin
  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false)
    if (selectedDate) {
      setEndDate(selectedDate)
    }
  }

  // Formatear fecha
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Toggle selección de técnico
  const toggleTechnician = (technicianId: string) => {
    setSelectedTechnicians((prev) => {
      if (prev.includes(technicianId)) {
        return prev.filter((id) => id !== technicianId)
      } else {
        return [...prev, technicianId]
      }
    })
  }

  // Toggle selección de cliente
  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      if (prev.includes(clientId)) {
        return prev.filter((id) => id !== clientId)
      } else {
        return [...prev, clientId]
      }
    })
  }

  // Seleccionar todos los técnicos
  const selectAllTechnicians = () => {
    setSelectedTechnicians(technicians.map((tech) => tech.id))
  }

  // Deseleccionar todos los técnicos
  const deselectAllTechnicians = () => {
    setSelectedTechnicians([])
  }

  // Seleccionar todos los clientes
  const selectAllClients = () => {
    setSelectedClients(clients.map((client) => client.id))
  }

  // Deseleccionar todos los clientes
  const deselectAllClients = () => {
    setSelectedClients([])
  }

  // Aplicar filtros
  const applyFilters = () => {
    setFilterDialogVisible(false)
    fetchReports()
  }

  // Generar informe
  const generateReport = async () => {
    setIsGenerating(true)
    setGenerationProgress(0.1)

    try {
      // Filtrar reportes según selecciones
      let filteredReports = [...reports]

      if (selectedTechnicians.length > 0) {
        filteredReports = filteredReports.filter(
          (report) => report.technicianId && selectedTechnicians.includes(report.technicianId),
        )
      }

      if (selectedClients.length > 0) {
        filteredReports = filteredReports.filter((report) => {
          // Simulamos que cada reporte tiene un clientId basado en el buildingName
          const clientId = clients.find((c) => c.name === report.buildingName)?.id
          return clientId && selectedClients.includes(clientId)
        })
      }

      setGenerationProgress(0.3)

      // Generar HTML para el informe
      const htmlContent = generateReportHtml(filteredReports)

      setGenerationProgress(0.6)

      // Generar PDF usando expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      })

      setGenerationProgress(0.8)

      // Crear nombre de archivo
      const fileName = `Informe_${formatDate(startDate).replace(/\//g, "-")}_a_${formatDate(endDate).replace(/\//g, "-")}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`

      // Renombrar el archivo
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      })

      setGenerationProgress(1)

      // Guardar la URI del informe generado
      setGeneratedReportUri(newUri)
      showSuccessAlert(
        "Informe Generado",
        "El informe ha sido generado correctamente. Ahora puede descargarlo o compartirlo.",
      )
    } catch (error: any) {
      console.error("Error generating report:", error)
      showErrorAlert("Error al generar informe", error.message || "No se pudo generar el informe")
    } finally {
      setIsGenerating(false)
    }
  }

  // Compartir informe
  const shareReport = async () => {
    if (!generatedReportUri) {
      showErrorAlert("Error", "No hay un informe disponible para compartir")
      return
    }

    try {
      // Verificar si el dispositivo puede compartir
      if (!(await Sharing.isAvailableAsync())) {
        showErrorAlert("Compartir no disponible", "La función de compartir no está disponible en este dispositivo")
        return
      }

      // Compartir el archivo
      await Sharing.shareAsync(generatedReportUri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir Informe",
        UTI: "com.adobe.pdf", // Para iOS
      })
    } catch (error: any) {
      console.error("Error sharing report:", error)
      showErrorAlert("Error al compartir", error.message || "No se pudo compartir el informe")
    }
  }

  // Generar HTML para el informe
  const generateReportHtml = (filteredReports: Report[]) => {
    // Filtrar técnicos y clientes según selecciones
    const filteredTechnicians = technicians.filter(
      (tech) => selectedTechnicians.length === 0 || selectedTechnicians.includes(tech.id),
    )

    const filteredClients = clients.filter(
      (client) => selectedClients.length === 0 || selectedClients.includes(client.id),
    )

    // Generar HTML para la sección de reportes
    const reportsHtml = includeReports
      ? `
      <div class="section">
        <h2>Reportes de Mantenimiento</h2>
        <p class="section-description">Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Edificio</th>
              <th>Fecha</th>
              <th>Técnico</th>
              <th>Estado</th>
              <th>Marca</th>
            </tr>
          </thead>
          <tbody>
            ${filteredReports
              .map(
                (report) => `
              <tr>
                <td>${report.buildingName}</td>
                <td>${formatDate(new Date(report.date))}</td>
                <td>${report.technicianName || "No asignado"}</td>
                <td>${getStatusLabel(report.status)}</td>
                <td>${report.elevatorBrand}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="summary-box">
          <h3>Resumen de Reportes</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${filteredReports.length}</div>
              <div class="summary-label">Total de reportes</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${filteredReports.filter((r) => r.status === "approved").length}</div>
              <div class="summary-label">Reportes aprobados</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${filteredReports.filter((r) => r.status === "submitted").length}</div>
              <div class="summary-label">Reportes enviados</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${filteredReports.filter((r) => r.status === "draft").length}</div>
              <div class="summary-label">Reportes en borrador</div>
            </div>
          </div>
        </div>
      </div>
    `
      : ""

    // Generar HTML para la sección de técnicos
    const techniciansHtml = includeTechnicians
      ? `
      <div class="section">
        <h2>Técnicos</h2>
        <p class="section-description">Desempeño en el periodo: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Reportes</th>
              <th>Clientes</th>
              <th>Eficiencia</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTechnicians
              .map((tech) => {
                // Calcular reportes de este técnico en el periodo
                const techReports = filteredReports.filter((r) => r.technicianId === tech.id).length
                // Calcular eficiencia (simulada)
                const efficiency = Math.min(100, Math.round((techReports / tech.reports) * 100))

                return `
                <tr>
                  <td>${tech.name}</td>
                  <td>${tech.role}</td>
                  <td>${techReports}</td>
                  <td>${tech.clients}</td>
                  <td>
                    <div class="progress-container">
                      <div class="progress-bar" style="width: ${efficiency}%"></div>
                      <span class="progress-text">${efficiency}%</span>
                    </div>
                  </td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
        
        <div class="summary-box">
          <h3>Resumen de Técnicos</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${filteredTechnicians.length}</div>
              <div class="summary-label">Total de técnicos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${filteredTechnicians.filter((t) => t.role === "Técnico Senior").length}</div>
              <div class="summary-label">Técnicos senior</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${filteredTechnicians.filter((t) => t.role === "Técnico Junior").length}</div>
              <div class="summary-label">Técnicos junior</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${Math.round(filteredReports.length / filteredTechnicians.length)}</div>
              <div class="summary-label">Promedio de reportes</div>
            </div>
          </div>
        </div>
      </div>
    `
      : ""

    // Generar HTML para la sección de clientes
    const clientsHtml = includeClients
      ? `
      <div class="section">
        <h2>Clientes</h2>
        <p class="section-description">Actividad en el periodo: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Reportes</th>
              <th>Técnicos asignados</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filteredClients
              .map((client) => {
                // Calcular reportes de este cliente en el periodo
                const clientReports = filteredReports.filter((r) => r.buildingName === client.name).length
                // Determinar estado basado en reportes
                let status = "Activo"
                let statusClass = "status-active"

                if (clientReports === 0) {
                  status = "Inactivo"
                  statusClass = "status-inactive"
                } else if (clientReports > client.reports / 2) {
                  status = "Muy activo"
                  statusClass = "status-very-active"
                }

                return `
                <tr>
                  <td>${client.name}</td>
                  <td>${client.address}</td>
                  <td>${clientReports}</td>
                  <td>${client.technicians}</td>
                  <td><span class="${statusClass}">${status}</span></td>
                </tr>
              `
              })
              .join("")}
          </tbody>
        </table>
        
        <div class="summary-box">
          <h3>Resumen de Clientes</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${filteredClients.length}</div>
              <div class="summary-label">Total de clientes</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${
                filteredClients.filter((c) => filteredReports.some((r) => r.buildingName === c.name)).length
              }</div>
              <div class="summary-label">Clientes activos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${
                filteredClients.filter((c) => !filteredReports.some((r) => r.buildingName === c.name)).length
              }</div>
              <div class="summary-label">Clientes inactivos</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${Math.round(filteredReports.length / filteredClients.length)}</div>
              <div class="summary-label">Promedio de reportes</div>
            </div>
          </div>
        </div>
      </div>
    `
      : ""

    // HTML completo del informe
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Informe de Gestión</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
            
            body {
              font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              color: #1f2937;
              line-height: 1.6;
              background-color: #ffffff;
            }
            
            .container {
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              background-color: #7c3aed;
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
              margin-bottom: 0;
            }
            
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            
            .header p {
              margin: 10px 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            
            .report-info {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-top: none;
              border-radius: 0 0 10px 10px;
              padding: 20px 30px;
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            }
            
            .info-group {
              flex: 1;
              min-width: 200px;
            }
            
            .info-label {
              font-weight: 500;
              color: #4b5563;
              margin-bottom: 5px;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 16px;
              font-weight: 400;
              color: #1f2937;
            }
            
            .section {
              background-color: white;
              border-radius: 10px;
              margin-bottom: 30px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              border: 1px solid #e5e7eb;
              padding: 25px;
            }
            
            h2 {
              color: #7c3aed;
              margin: 0 0 10px 0;
              font-size: 22px;
              font-weight: 600;
            }
            
            h3 {
              color: #7c3aed;
              margin: 0 0 15px 0;
              font-size: 18px;
              font-weight: 600;
            }
            
            .section-description {
              color: #6b7280;
              margin: 0 0 20px 0;
              font-size: 14px;
            }
            
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            
            .data-table th {
              background-color: #f3f4f6;
              color: #4b5563;
              font-weight: 600;
              text-align: left;
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 14px;
            }
            
            .data-table td {
              padding: 12px 15px;
              border-bottom: 1px solid #e5e7eb;
              color: #4b5563;
              font-size: 14px;
            }
            
            .data-table tr:last-child td {
              border-bottom: none;
            }
            
            .data-table tr:nth-child(even) {
              background-color: #f9fafb;
            }
            
            .summary-box {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 20px;
              border: 1px solid #e5e7eb;
            }
            
            .summary-grid {
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
              justify-content: space-between;
            }
            
            .summary-item {
              flex: 1;
              min-width: 120px;
              text-align: center;
            }
            
            .summary-value {
              font-size: 24px;
              font-weight: 700;
              color: #7c3aed;
              margin-bottom: 5px;
            }
            
            .summary-label {
              font-size: 14px;
              color: #6b7280;
            }
            
            .progress-container {
              width: 100%;
              height: 20px;
              background-color: #e5e7eb;
              border-radius: 10px;
              overflow: hidden;
              position: relative;
            }
            
            .progress-bar {
              height: 100%;
              background-color: #7c3aed;
              border-radius: 10px;
            }
            
            .progress-text {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #1f2937;
              font-size: 12px;
              font-weight: 500;
            }
            
            .status-active {
              background-color: #10b981;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .status-inactive {
              background-color: #ef4444;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .status-very-active {
              background-color: #3b82f6;
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #6b7280;
              font-size: 13px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            
            .footer p {
              margin: 5px 0;
            }
            
            @media print {
              body {
                padding: 0;
                background-color: white;
              }
              
              .container {
                padding: 0;
                max-width: 100%;
              }
              
              .header {
                border-radius: 0;
              }
              
              .report-info {
                border-radius: 0;
              }
              
              .section {
                break-inside: avoid;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Informe de Gestión</h1>
              <p>Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
            </div>
            
            <div class="report-info">
              <div class="info-group">
                <div class="info-label">Generado por</div>
                <div class="info-value">${user?.name || "Administrador"}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Fecha de generación</div>
                <div class="info-value">${formatDate(new Date())}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Total de reportes</div>
                <div class="info-value">${filteredReports.length}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Técnicos activos</div>
                <div class="info-value">${filteredTechnicians.length}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Clientes activos</div>
                <div class="info-value">${
                  filteredClients.filter((c) => filteredReports.some((r) => r.buildingName === c.name)).length
                }</div>
              </div>
            </div>
            
            ${reportsHtml}
            
            ${techniciansHtml}
            
            ${clientsHtml}
            
            <div class="footer">
              <p>Informe generado el ${formatDate(new Date())} por ${user?.name || "Administrador"}</p>
              <p>© ${new Date().getFullYear()} TeslaLift</p>
            </div>
          </div>
        </body>
      </html>
    `
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
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Módulo de Informes</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de filtros de fecha */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Rango de fechas</Text>
              <Text style={styles.cardDescription}>Seleccione el rango de fechas para generar el informe</Text>

              <View style={styles.datePickersContainer}>
                <View style={styles.datePickerWrapper}>
                  <Text style={styles.datePickerLabel}>Fecha de inicio</Text>
                  <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
                    <Text style={styles.datePickerButtonText}>{formatDate(startDate)}</Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker value={startDate} mode="date" display="default" onChange={handleStartDateChange} />
                  )}
                </View>

                <View style={styles.datePickerWrapper}>
                  <Text style={styles.datePickerLabel}>Fecha de fin</Text>
                  <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
                    <Text style={styles.datePickerButtonText}>{formatDate(endDate)}</Text>
                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker value={endDate} mode="date" display="default" onChange={handleEndDateChange} />
                  )}
                </View>
              </View>

              <Button
                mode="contained"
                onPress={() => setFilterDialogVisible(true)}
                style={styles.filterButton}
                buttonColor={COLORS.primary}
                icon="filter-variant"
              >
                Configurar filtros
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Sección de contenido del informe */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Contenido del informe</Text>
              <Text style={styles.cardDescription}>Seleccione qué información incluir en el informe</Text>

              <View style={styles.contentOptionsContainer}>
                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={includeReports ? "checked" : "unchecked"}
                    onPress={() => setIncludeReports(!includeReports)}
                    color={COLORS.primary}
                  />
                  <Text style={styles.checkboxLabel}>Reportes de mantenimiento</Text>
                </View>

                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={includeTechnicians ? "checked" : "unchecked"}
                    onPress={() => setIncludeTechnicians(!includeTechnicians)}
                    color={COLORS.primary}
                  />
                  <Text style={styles.checkboxLabel}>Información de técnicos</Text>
                </View>

                <View style={styles.checkboxRow}>
                  <Checkbox
                    status={includeClients ? "checked" : "unchecked"}
                    onPress={() => setIncludeClients(!includeClients)}
                    color={COLORS.primary}
                  />
                  <Text style={styles.checkboxLabel}>Información de clientes</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Sección de resumen */}
        <Animated.View entering={FadeInDown.delay(200).duration(300)}>
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.cardTitle}>Resumen</Text>
              <Text style={styles.cardDescription}>Información que se incluirá en el informe</Text>

              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Periodo:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDate(startDate)} - {formatDate(endDate)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Reportes:</Text>
                  <Text style={styles.summaryValue}>{isLoading ? "Cargando..." : reports.length} reportes</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Técnicos:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedTechnicians.length > 0
                      ? `${selectedTechnicians.length} seleccionados`
                      : "Todos los técnicos"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Clientes:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedClients.length > 0 ? `${selectedClients.length} seleccionados` : "Todos los clientes"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Secciones:</Text>
                  <View style={styles.sectionsChipsContainer}>
                    {includeReports && (
                      <Chip style={styles.sectionChip} textStyle={{ color: COLORS.text }}>
                        Reportes
                      </Chip>
                    )}
                    {includeTechnicians && (
                      <Chip style={styles.sectionChip} textStyle={{ color: COLORS.text }}>
                        Técnicos
                      </Chip>
                    )}
                    {includeClients && (
                      <Chip style={styles.sectionChip} textStyle={{ color: COLORS.text }}>
                        Clientes
                      </Chip>
                    )}
                  </View>
                </View>
              </View>

              {isGenerating ? (
                <View style={styles.generatingContainer}>
                  <Text style={styles.generatingText}>Generando informe...</Text>
                  <ProgressBar progress={generationProgress} color={COLORS.primary} style={styles.progressBar} />
                </View>
              ) : generatedReportUri ? (
                <View style={styles.reportActionsContainer}>
                  <Button
                    mode="contained"
                    onPress={shareReport}
                    style={styles.reportActionButton}
                    buttonColor={COLORS.primary}
                    icon="share-variant"
                  >
                    Compartir informe
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setGeneratedReportUri(null)
                      setGenerationProgress(0)
                    }}
                    style={styles.reportActionButton}
                    textColor={COLORS.primary}
                    icon="refresh"
                  >
                    Generar nuevo informe
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={generateReport}
                  style={styles.generateButton}
                  buttonColor={COLORS.primary}
                  icon="file-pdf-box"
                  disabled={isLoading || (!includeReports && !includeTechnicians && !includeClients)}
                >
                  Generar informe
                </Button>
              )}
            </Card.Content>
          </Card>
        </Animated.View>
      </ScrollView>

      {/* Diálogo de filtros */}
      <Portal>
        <Dialog visible={filterDialogVisible} onDismiss={() => setFilterDialogVisible(false)}>
          <Dialog.Title>Filtros adicionales</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogSectionTitle}>Técnicos</Text>
            <View style={styles.dialogSelectAllRow}>
              <Button mode="text" onPress={selectAllTechnicians} textColor={COLORS.primary} compact>
                Seleccionar todos
              </Button>
              <Button mode="text" onPress={deselectAllTechnicians} textColor={COLORS.textSecondary} compact>
                Deseleccionar todos
              </Button>
            </View>
            <View style={styles.dialogOptionsContainer}>
              {technicians.map((tech) => (
                <TouchableOpacity
                  key={tech.id}
                  style={[styles.dialogOption, selectedTechnicians.includes(tech.id) && styles.dialogOptionSelected]}
                  onPress={() => toggleTechnician(tech.id)}
                >
                  <Text
                    style={[
                      styles.dialogOptionText,
                      selectedTechnicians.includes(tech.id) && styles.dialogOptionTextSelected,
                    ]}
                  >
                    {tech.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Divider style={styles.dialogDivider} />

            <Text style={styles.dialogSectionTitle}>Clientes</Text>
            <View style={styles.dialogSelectAllRow}>
              <Button mode="text" onPress={selectAllClients} textColor={COLORS.primary} compact>
                Seleccionar todos
              </Button>
              <Button mode="text" onPress={deselectAllClients} textColor={COLORS.textSecondary} compact>
                Deseleccionar todos
              </Button>
            </View>
            <View style={styles.dialogOptionsContainer}>
              {clients.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  style={[styles.dialogOption, selectedClients.includes(client.id) && styles.dialogOptionSelected]}
                  onPress={() => toggleClient(client.id)}
                >
                  <Text
                    style={[
                      styles.dialogOptionText,
                      selectedClients.includes(client.id) && styles.dialogOptionTextSelected,
                    ]}
                  >
                    {client.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilterDialogVisible(false)}>Cancelar</Button>
            <Button onPress={applyFilters}>Aplicar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Componentes de alerta */}
      <AlertMessage
        visible={alertVisible}
        title={alertData.title}
        message={alertData.message}
        onClose={() => setAlertVisible(false)}
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  datePickersContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  datePickerWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  datePickerLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "white",
  },
  datePickerButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  filterButton: {
    borderRadius: 8,
  },
  contentOptionsContainer: {
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    width: 80,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  sectionsChipsContainer: {
    flexDirection: "column",
    flexWrap: "wrap",    
  },
  sectionChip: {
    backgroundColor: COLORS.primaryLight,
    marginRight: 8,
    marginBottom: 8,
  },
  generateButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  generatingContainer: {
    marginTop: 16,
  },
  generatingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    textAlign: "center",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  reportActionsContainer: {
    marginTop: 16,
  },
  reportActionButton: {
    borderRadius: 8,
    marginBottom: 8,
  },
  dialogSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  dialogSelectAllRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dialogOptionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dialogOption: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  dialogOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  dialogOptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  dialogOptionTextSelected: {
    color: "white",
  },
  dialogDivider: {
    marginVertical: 16,
  },
})

