"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Share,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card, Button, ActivityIndicator, Chip, Divider } from "react-native-paper"
import { useNavigation, useRoute } from "@react-navigation/native"
import { useAuth } from "../../context/AuthContext"
import { LinearGradient } from "expo-linear-gradient"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import technicianApi from "../../services/technicianApi"
import type { Report } from "../../models/technician"
import Animated, { FadeInDown } from "react-native-reanimated"
import { Image } from "react-native"
import AlertMessage from "../../components/alertMessage"
import ErrorMessage from "../../components/ErrorMessage"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import * as Print from "expo-print"

// Definir colores para el tema de técnicos
const COLORS = {
  primary: "#10b981", // Verde para técnicos
  primaryDark: "#059669",
  primaryLight: "#d1fae5",
  secondary: "#0ea5e9", // Azul para acentos
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

export default function ReportDetailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const reportId = route.params?.reportId

  // Estado
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [pdfUri, setPdfUri] = useState<string | null>(null)
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
  const [showShareOptions, setShowShareOptions] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  // Manejar cierre de alerta
  const handleAlertClose = () => {
    setShowAlert(false)
  }

  // Mostrar alerta de éxito
  const [alertMessage, setAlertMessage] = useState("")

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

  // Verificar si se proporcionó un ID de reporte válido
  useEffect(() => {
    if (!reportId) {
      showErrorAlert(
        "Error al cargar el reporte",
        "No se proporcionó un ID de reporte válido. Por favor, intente nuevamente.",
      )
      // Navegar de vuelta después de mostrar el error
      setTimeout(() => {
        navigation.goBack()
      }, 2000)
    } else {
      fetchReport()
    }
  }, [reportId])

  // Obtener detalles del reporte
  const fetchReport = async () => {
    setIsLoading(true)

    try {
      // Obtener el reporte desde el almacenamiento local usando technicianApi
      const response = await technicianApi.reports.getById(reportId)

      if (response.success && response.data) {
        setReport(response.data)
      } else {
        throw new Error(response.message || "No se pudo cargar el reporte")
      }
    } catch (error: any) {
      console.error("Error fetching report:", error)
      showErrorAlert("Error al cargar el reporte", error.message || "No se pudo cargar el reporte")

      // Navegar de vuelta después de mostrar el error
      setTimeout(() => {
        navigation.goBack()
      }, 2000)
    } finally {
      setIsLoading(false)
    }
  }

  // Generar HTML para el PDF
  const generatePdfHtml = (report: Report) => {
    // Obtener la fecha formateada
    const formattedDate = formatDate(report.date)

    // Generar HTML para las secciones del reporte
    const sectionsHtml = report.sections
      .map((section) => {
        const itemsHtml = section.items
          .map((item) => {
            const isChecked = item.value === true
            return `
              <div class="checklist-item">
                <div class="checkbox ${isChecked ? "checked" : ""}">
                  ${isChecked ? "✓" : ""}
                </div>
                <div class="item-description">${item.description}</div>
              </div>
            `
          })
          .join("")

        return `
          <div class="section">
            <div class="section-header">
              <h3>${section.title}</h3>
            </div>
            <div class="checklist-items">
              ${itemsHtml}
            </div>
          </div>
        `
      })
      .join("")

    // Generar HTML para las firmas
    const signaturesHtml = `
      <div class="signatures">
        <div class="signature-container">
          <h3>Firma del Técnico</h3>
          ${
            report.technicianSignature
              ? `<div class="signature-image-container"><img src="${report.technicianSignature}" class="signature-image" /></div>`
              : `<div class="no-signature">Sin firma</div>`
          }
          <p class="signature-name">${user?.name || "Técnico"}</p>
        </div>
        <div class="signature-container">
          <h3>Firma del Cliente</h3>
          ${
            report.clientSignature
              ? `<div class="signature-image-container"><img src="${report.clientSignature}" class="signature-image" /></div>`
              : `<div class="no-signature">Sin firma</div>`
          }
          <p class="signature-name">Cliente</p>
        </div>
      </div>
    `

    // Generar HTML para las observaciones
    const observationsHtml = report.observations
      ? `
      <div class="observations">
        <div class="section-header">
          <h3>Observaciones</h3>
        </div>
        <p class="observation-text">${report.observations}</p>
      </div>
    `
      : ""

    // HTML completo del PDF
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Reporte de Mantenimiento</title>
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
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              background-color: #10b981;
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
              margin-bottom: 25px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              border: 1px solid #e5e7eb;
            }
            
            .section-header {
              background-color: #f3f4f6;
              padding: 15px 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            
            h3 {
              color: #10b981;
              margin: 0;
              font-size: 18px;
              font-weight: 600;
            }
            
            .checklist-items {
              padding: 15px 20px;
            }
            
            .checklist-item {
              display: flex;
              align-items: flex-start;
              margin-bottom: 12px;
              padding-bottom: 12px;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .checklist-item:last-child {
              margin-bottom: 0;
              padding-bottom: 0;
              border-bottom: none;
            }
            
            .checkbox {
              width: 22px;
              height: 22px;
              border: 2px solid #10b981;
              border-radius: 4px;
              margin-right: 15px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              flex-shrink: 0;
              position: relative;
              top: 2px;
            }
            
            .checkbox.checked {
              background-color: #10b981;
            }
            
            .item-description {
              flex: 1;
              font-size: 15px;
              color: #4b5563;
            }
            
            .observations {
              background-color: white;
              border-radius: 10px;
              margin-bottom: 30px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              border: 1px solid #e5e7eb;
            }
            
            .observation-text {
              padding: 15px 20px;
              margin: 0;
              font-size: 15px;
              color: #4b5563;
              line-height: 1.6;
            }
            
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              margin-bottom: 30px;
              gap: 30px;
            }
            
            .signature-container {
              flex: 1;
              text-align: center;
              background-color: white;
              border-radius: 10px;
              padding: 20px;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              border: 1px solid #e5e7eb;
            }
            
            .signature-container h3 {
              margin-bottom: 15px;
              color: #10b981;
              font-size: 16px;
            }
            
            .signature-image-container {
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              margin-bottom: 10px;
              height: 120px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .signature-image {
              max-width: 100%;
              max-height: 100px;
              object-fit: contain;
            }
            
            .no-signature {
              height: 120px;
              background-color: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #9ca3af;
              margin-bottom: 10px;
              font-style: italic;
            }
            
            .signature-name {
              margin: 5px 0 0;
              font-weight: 500;
              color: #4b5563;
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
              
              .section, .observations, .signature-container {
                break-inside: avoid;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Reporte de Mantenimiento de Ascensor</h1>
              <p>Fecha: ${formattedDate}</p>
            </div>
            
            <div class="report-info">
              <div class="info-group">
                <div class="info-label">Edificio</div>
                <div class="info-value">${report.buildingName}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Marca de Ascensor</div>
                <div class="info-value">${report.elevatorBrand}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Número de Ascensores</div>
                <div class="info-value">${report.elevatorCount}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Número de Paradas</div>
                <div class="info-value">${report.floorCount}</div>
              </div>
              <div class="info-group">
                <div class="info-label">Hora de Entrada</div>
                <div class="info-value">${formatTime(report.clockInTime)}</div>
              </div>
              ${
                report.clockOutTime
                  ? `
                  <div class="info-group">
                    <div class="info-label">Hora de Salida</div>
                    <div class="info-value">${formatTime(report.clockOutTime)}</div>
                  </div>
                `
                  : ""
              }
            </div>
            
            <div class="sections">
              ${sectionsHtml}
            </div>
            
            ${observationsHtml}
            
            ${signaturesHtml}
            
            <div class="footer">
              <p>Reporte generado el ${new Date().toLocaleDateString()} por ${user?.name || "Técnico"}</p>
              <p>© ${new Date().getFullYear()} TeslaLift</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Generar PDF
  const handleGeneratePdf = async () => {
    if (!report) return

    setIsGeneratingPdf(true)

    try {
      // Generar HTML para el PDF sin ajustar la fecha
      const htmlContent = generatePdfHtml(report)

      // Generar PDF usando expo-print
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      })

      // Crear nombre de archivo
      const formattedDate = report ? formatDate(report.date).replace(/\//g, "-") : "" // Reemplazar '/' por '-' en la fecha
      const fileName = `Reporte_${report?.buildingName.replace(/\s+/g, "_")}_${formattedDate}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`

      // Renombrar el archivo
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      })

      // Guardar la URI del PDF
      setPdfUri(newUri)

      // Actualizar el reporte con la URL del PDF
      const updatedReport = {
        ...report,
        pdfUrl: newUri,
        updatedAt: new Date().toISOString(),
      }

      // Actualizar el reporte en el almacenamiento local
      await technicianApi.reports.update(report.id, { pdfUrl: newUri })

      // Actualizar el estado
      setReport(updatedReport)
      showSuccessAlert("PDF Generado", "El PDF ha sido generado correctamente. Ahora puede descargarlo o compartirlo.")
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      showErrorAlert("Error al generar PDF", error.message || "No se pudo generar el PDF")
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // const handleDownloadPdf = async () => {
  //   if (!report?.pdfUrl) return

  //   setIsDownloadingPdf(true)

  //   try {
  //     // Verificar permisos de almacenamiento
  //     const { status } = await MediaLibrary.requestPermissionsAsync()

  //     if (status !== "granted") {
  //       showErrorAlert("Permiso Denegado", "Se necesita permiso para guardar el archivo en su dispositivo.")
  //       return
  //     }

  //     // Crear nombre de archivo
  //     const formattedDate = report ? formatDate(report.date).replace(/\//g, "-") : "" // Reemplazar '/' por '-' en la fecha
  //     const fileName = `Reporte_${report?.buildingName.replace(/\s+/g, "_")}_${formattedDate}.pdf`

  //     // Copiar el archivo a un directorio accesible
  //     const fileUri = `${FileSystem.documentDirectory}${fileName}`
  //     await FileSystem.copyAsync({
  //       from: report.pdfUrl,
  //       to: fileUri,
  //     })

  //     // Guardar en la galería/documentos
  //     const asset = await MediaLibrary.createAssetAsync(fileUri)
  //     await MediaLibrary.createAlbumAsync("Reportes", asset, false)

  //     // Actualizar estado
  //     setPdfUri(fileUri)

  //     // Mostrar mensaje de éxito
  //     showSuccessAlert("PDF Descargado", "El PDF ha sido guardado en su dispositivo. ¿Desea compartirlo ahora?")

  //     // Mostrar opciones de compartir
  //     setShowShareOptions(true)
  //   } catch (error: any) {
  //     console.error("Error downloading PDF:", error)
  //     showErrorAlert("Error al descargar PDF", error.message || "No se pudo descargar el PDF")
  //   } finally {
  //     setIsDownloadingPdf(false)
  //   }
  // }

  // // Abrir PDF
  // const handleOpenPdf = async () => {
  //   if (!report?.pdfUrl) return

  //   try {
  //     if (Platform.OS === "ios") {
  //       // En iOS, usar Linking para abrir el PDF
  //       await Linking.openURL(report.pdfUrl)
  //     } else {
  //       // En Android, usar IntentLauncher para abrir el PDF
  //       await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
  //         data: report.pdfUrl,
  //         flags: 1,
  //         type: "application/pdf",
  //       })
  //     }
  //   } catch (error: any) {
  //     console.error("Error opening PDF:", error)
  //     showErrorAlert("Error al abrir PDF", error.message || "No se pudo abrir el PDF")
  //   }
  // }

  // Compartir PDF
  const handleSharePdf = async () => {
    if (!pdfUri && !report?.pdfUrl) {
      showErrorAlert("Error", "No hay un PDF disponible para compartir")
      return
    }

    try {
      const fileUri = pdfUri || report?.pdfUrl

      // Crear nombre de archivo
      const formattedDate = report ? formatDate(report.date).replace(/\//g, "-") : "" // Reemplazar '/' por '-' en la fecha
      const fileName = `Reporte_${report?.buildingName.replace(/\s+/g, "_")}_${formattedDate}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`

      // Renombrar el archivo si es necesario
      if (fileUri !== newUri) {
        await FileSystem.copyAsync({
          from: fileUri!,
          to: newUri,
        })
      }

      // Verificar si el dispositivo puede compartir
      if (!(await Sharing.isAvailableAsync())) {
        showErrorAlert("Compartir no disponible", "La función de compartir no está disponible en este dispositivo")
        return
      }

      // Compartir el archivo
      await Sharing.shareAsync(newUri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir Reporte de Mantenimiento",
        UTI: "com.adobe.pdf", // Para iOS
      })
    } catch (error: any) {
      console.error("Error sharing PDF:", error)
      showErrorAlert("Error al compartir", error.message || "No se pudo compartir el PDF")
    }
  }

  // Compartir a plataformas específicas
  const handleShareToPlatform = async (platform: string) => {
    if (!pdfUri && !report?.pdfUrl) {
      showErrorAlert("Error", "No hay un PDF disponible para compartir")
      return
    }

    try {
      const fileUri = pdfUri || report?.pdfUrl

      // Crear nombre de archivo
      const formattedDate = report ? formatDate(report.date).replace(/\//g, "-") : "" // Reemplazar '/' por '-' en la fecha
      const fileName = `Reporte_${report?.buildingName.replace(/\s+/g, "_")}_${formattedDate}.pdf`
      const newUri = `${FileSystem.documentDirectory}${fileName}`

      // Renombrar el archivo si es necesario
      if (fileUri !== newUri) {
        await FileSystem.copyAsync({
          from: fileUri!,
          to: newUri,
        })
      }

      const reportTitle = `Reporte de Mantenimiento - ${report?.buildingName}`
      const message = `${reportTitle}\nFecha: ${formatDate(report?.date || "")}\nTécnico: ${user?.name || "Técnico"}`

      // Compartir usando la API de Share
      await Share.share(
        {
          title: reportTitle,
          message: Platform.OS === "ios" ? message : `${message}\n${newUri}`,
          url: Platform.OS === "ios" ? newUri : undefined,
        },
        {
          dialogTitle: "Compartir Reporte de Mantenimiento",
          subject: reportTitle,
        },
      )
    } catch (error: any) {
      console.error(`Error sharing to ${platform}:`, error)
      showErrorAlert("Error al compartir", error.message || `No se pudo compartir a ${platform}`)
    }
  }

  // Adjust date for timezone issues
  const adjustDateForTimezone = (dateString: string) => {
    if (!dateString) return dateString

    try {
      // Parse the date string
      const date = new Date(dateString)

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateString
      }

      // Return in YYYY-MM-DD format without adding an extra day
      return date.toISOString().split("T")[0]
    } catch (error) {
      console.error("Error adjusting date:", error)
      return dateString
    }
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Fecha inválida"

      // Create date object without timezone adjustments
      const date = new Date(dateString)

      // Check if the date is valid before proceeding
      if (isNaN(date.getTime())) {
        return "Fecha inválida"
      }

      // Use a more reliable date formatting approach
      const day = String(date.getDate()).padStart(2, "0")
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const year = date.getFullYear()

      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Fecha inválida"
    }
  }

  // Formatear hora
  const formatTime = (timeString: string) => {
    if (!timeString) return ""

    try {
      // Check if timeString is already in HH:MM format
      if (/^\d{1,2}:\d{2}$/.test(timeString)) {
        return timeString
      }

      const date = new Date(timeString)
      if (isNaN(date.getTime())) {
        return timeString // Return original if invalid
      }

      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      console.error("Error formatting time:", error)
      return timeString // Return original on error
    }
  }

  // Obtener color según estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return COLORS.textTertiary
      case "submitted":
        return COLORS.info
      case "approved":
        return COLORS.success
      default:
        return COLORS.textTertiary
    }
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

  // Renderizar opciones de compartir
  const renderShareOptions = () => {
    if (!showShareOptions) return null

    return (
      <View style={styles.shareOptionsContainer}>
        <Text style={styles.shareOptionsTitle}>Compartir a:</Text>

        <View style={styles.shareButtonsRow}>
          <TouchableOpacity style={styles.shareButton} onPress={() => handleShareToPlatform("WhatsApp")}>
            <View style={[styles.shareIconContainer, { backgroundColor: "#25D366" }]}>
              <Ionicons name="logo-whatsapp" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => handleShareToPlatform("Drive")}>
            <View style={[styles.shareIconContainer, { backgroundColor: "#4285F4" }]}>
              <Ionicons name="cloud-outline" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>Drive</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => handleShareToPlatform("Email")}>
            <View style={[styles.shareIconContainer, { backgroundColor: "#EA4335" }]}>
              <Ionicons name="mail-outline" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.shareButtonsRow}>
          <TouchableOpacity style={styles.shareButton} onPress={() => handleShareToPlatform("Instagram")}>
            <View style={[styles.shareIconContainer, { backgroundColor: "#E1306C" }]}>
              <Ionicons name="logo-instagram" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => handleShareToPlatform("Facebook")}>
            <View style={[styles.shareIconContainer, { backgroundColor: "#1877F2" }]}>
              <Ionicons name="logo-facebook" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={handleSharePdf}>
            <View style={[styles.shareIconContainer, { backgroundColor: COLORS.primary }]}>
              <Ionicons name="share-social-outline" size={24} color="white" />
            </View>
            <Text style={styles.shareButtonText}>Otros</Text>
          </TouchableOpacity>
        </View>

        <Button
          mode="outlined"
          onPress={() => setShowShareOptions(false)}
          style={styles.closeShareButton}
          textColor={COLORS.textSecondary}
        >
          Cerrar
        </Button>
      </View>
    )
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
          <Text style={styles.headerTitle}>Detalle de Reporte</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleSharePdf}>
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando reporte...</Text>
        </View>
      ) : report ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado del reporte */}
          <Animated.View entering={FadeInDown.duration(300)}>
            <Card style={styles.reportHeaderCard}>
              <Card.Content>
                <View style={styles.reportHeaderTop}>
                  <View>
                    <Text style={styles.reportBuilding}>{report.buildingName}</Text>
                    <Text style={styles.reportDate}>{formatDate(report.date)}</Text>
                  </View>
                  <Chip
                    style={[styles.statusChip, { backgroundColor: `${getStatusColor(report.status)}20` }]}
                    textStyle={{ color: getStatusColor(report.status) }}
                  >
                    {getStatusLabel(report.status)}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.reportDetails}>
                  <View style={styles.reportDetailRow}>
                    <Ionicons name="business-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.reportDetailText}>Marca: {report.elevatorBrand}</Text>
                  </View>

                  <View style={styles.reportDetailRow}>
                    <Ionicons name="layers-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.reportDetailText}>
                      Ascensores: {report.elevatorCount} | Pisos: {report.floorCount}
                    </Text>
                  </View>

                  <View style={styles.reportDetailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.reportDetailText}>
                      Hora entrada: {formatTime(report.clockInTime)}
                      {report.clockOutTime ? ` | Hora salida: ${formatTime(report.clockOutTime)}` : ""}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Secciones de la lista de verificación */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trabajos Realizados</Text>
            </View>

            {report.sections.map((section) => (
              <Card key={section.sectionId} style={styles.checklistCard}>
                <Card.Content>
                  <Text style={styles.checklistSectionTitle}>{section.title}</Text>

                  {section.items.map((item) => (
                    <View key={item.itemId} style={styles.checklistItem}>
                      <View style={styles.checkboxContainer}>
                        <View style={[styles.checkbox, item.value === true ? styles.checkboxChecked : {}]}>
                          {item.value === true && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                      </View>
                      <Text style={styles.checklistItemText}>{item.description}</Text>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            ))}
          </Animated.View>

          {/* Observaciones */}
          {report.observations && (
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Observaciones</Text>
              </View>

              <Card style={styles.observationsCard}>
                <Card.Content>
                  <Text style={styles.observationsText}>{report.observations}</Text>
                </Card.Content>
              </Card>
            </Animated.View>
          )}

          {/* Firmas */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Firmas</Text>
            </View>

            <Card style={styles.signaturesCard}>
              <Card.Content>
                <View style={styles.signaturesContainer}>
                  <View style={styles.signatureContainer}>
                    <Text style={styles.signatureLabel}>Técnico</Text>
                    {report.technicianSignature ? (
                      <Image
                        source={{ uri: report.technicianSignature }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.noSignature}>
                        <Text style={styles.noSignatureText}>Sin firma</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.signatureContainer}>
                    <Text style={styles.signatureLabel}>Cliente</Text>
                    {report.clientSignature ? (
                      <Image
                        source={{ uri: report.clientSignature }}
                        style={styles.signatureImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.noSignature}>
                        <Text style={styles.noSignatureText}>Sin firma</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>

          {/* Acciones PDF */}
          <Animated.View entering={FadeInDown.delay(400).duration(300)}>
            <View style={styles.pdfActionsContainer}>
              {report.pdfUrl ? (
                <View style={styles.pdfButtonsContainer}>
                  <Button
                    mode="outlined"
                    onPress={handleSharePdf}
                    style={[styles.pdfButton, styles.secondaryButton]}
                    icon="share"
                    textColor={COLORS.primary}
                  >
                    Compartir
                  </Button>
                </View>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleGeneratePdf}
                  style={styles.pdfButton}
                  icon="file-pdf-box"
                  buttonColor={COLORS.primary}
                  loading={isGeneratingPdf}
                  disabled={isGeneratingPdf}
                >
                  Generar PDF
                </Button>
              )}
            </View>
          </Animated.View>

          {/* Opciones de compartir */}
          {renderShareOptions()}
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Reporte no encontrado</Text>
          <Text style={styles.errorText}>No se pudo cargar la información del reporte.</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
            buttonColor={COLORS.primary}
          >
            Volver
          </Button>
        </View>
      )}

      {/* Componentes de alerta */}
      <AlertMessage visible={showAlert} title={alertData.title} message={alertMessage} onClose={handleAlertClose} />

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
  shareButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
  },
  errorButton: {
    width: 200,
  },
  reportHeaderCard: {
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
  reportHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reportBuilding: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  reportDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusChip: {
    height: 28,
  },
  divider: {
    marginVertical: 12,
  },
  reportDetails: {
    marginTop: 4,
  },
  reportDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reportDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  checklistCard: {
    marginBottom: 12,
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
  checklistSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
    padding: 8,
    borderRadius: 8,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checklistItemText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  observationsCard: {
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
  observationsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  signaturesCard: {
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
  signaturesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 8,
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  signatureImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  noSignature: {
    width: "100%",
    height: 100,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  noSignatureText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  pdfActionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  pdfButtonsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  pdfButton: {
    borderRadius: 8,
  },
  secondaryButton: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  shareOptionsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  shareOptionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
    textAlign: "center",
  },
  shareButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  shareIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  shareButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  closeShareButton: {
    marginTop: 8,
  },
})

