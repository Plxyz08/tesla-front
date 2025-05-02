"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native"
import { Card, Button, Divider, ProgressBar } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../context/AuthContext"
import ErrorMessage from "../../components/ErrorMessage"
import PDFGenerator from "../../services/PDFGenerator"
import FutureFeatureModal from "../../components/FutureFeatureModal"

// Colores principales para clientes
const COLORS = {
  primary: "#efb810", // Color dorado para clientes
  primaryLight: "#fff8e1",
  primaryDark: "#c79a00",
  success: "#10b981",
  successLight: "#d1fae5",
  danger: "#ef4444",
  dangerLight: "#fee2e2",
  warning: "#f59e0b",
  warningLight: "#fef3c7",
  gray: "#6b7280",
  grayLight: "#f3f4f6",
  grayDark: "#374151",
  background: "#f9fafb",
}

export default function ClientAccountScreen() {
  // Obtener datos del contexto
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // Estados del componente
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [errorData, setErrorData] = useState({ title: "", message: "" })
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showFutureFeatureModal, setShowFutureFeatureModal] = useState(false)
  const [futureFeatureInfo, setFutureFeatureInfo] = useState<{
    title: string
    message: string
    icon: keyof typeof Ionicons.glyphMap
    releaseDate: string
  }>({
    title: "",
    message: "",
    icon: "time",
    releaseDate: "",
  })

  // Datos de la cuenta del cliente
  const [accountData, setAccountData] = useState({
    totalAmount: 0,
    monthlyAmount: 0,
    contractDuration: 0,
    remainingMonths: 0,
    startDate: new Date(),
    endDate: new Date(),
    paymentStatus: "debt", // 'paid' o 'debt'
    nextPaymentDate: new Date(),
  })

  // Cargar datos de la cuenta
  useEffect(() => {
    let isMounted = true

    const loadAccountData = async () => {
      try {
        setIsLoading(true)

        // Simular carga de datos con un retraso
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (isMounted && user) {
          // Calcular fechas y meses restantes
          // Usar fecha de inicio de contrato o calcular una fecha por defecto (3 meses atrás)
          const startDate = new Date(new Date().setMonth(new Date().getMonth() - 3))

          const contractDuration = user.duracionContratoMeses || 12

          const endDate = new Date(startDate)
          endDate.setMonth(startDate.getMonth() + contractDuration)

          const today = new Date()
          const remainingMonths = Math.max(
            0,
            Math.floor((endDate.getTime() - today.getTime()) / (30 * 24 * 60 * 60 * 1000)),
          )

          // Calcular próxima fecha de pago (el 5 del próximo mes)
          const nextPaymentDate = new Date()
          nextPaymentDate.setDate(5)
          nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)

          // Establecer datos de la cuenta
          setAccountData({
            totalAmount: user.totalCuentaCliente || 0,
            monthlyAmount: (user.totalCuentaCliente || 0) / contractDuration,
            contractDuration,
            remainingMonths,
            startDate,
            endDate,
            paymentStatus: user.paymentStatus || "debt",
            nextPaymentDate,
          })
        }
      } catch (error) {
        console.error("Error cargando datos de la cuenta:", error)
        if (isMounted) {
          setHasError(true)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadAccountData()

    // Temporizador de respaldo para evitar estado de carga infinito
    const fallbackTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("Tiempo de carga agotado - forzando visualización de contenido")
        setIsLoading(false)
      }
    }, 5000)

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
    }
  }, [user])

  // Manejar acción de actualizar
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setHasError(false)

    // Simular actualización de datos
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }, [])

  // Manejar reintentar después de error
  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)

    // Simular recarga de datos
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  // Mostrar mensaje de error
  const showError = (title: string, message: string) => {
    setErrorData({ title, message })
    setShowErrorMessage(true)
  }

  // Generar y descargar estado de cuenta
  const handleDownloadAccountStatement = useCallback(async () => {
    try {
      setIsGeneratingPDF(true)

      // Información del cliente y la empresa para el PDF
      const accountInfo = {
        customerInfo: {
          name: user?.name || "Cliente",
          address: user?.address || "Dirección no disponible",
          ruc: user?.ruc || "RUC no disponible",
          email: user?.email || "Email no disponible",
          phone: user?.phone || "Teléfono no disponible",
          contractType: "Mantenimiento Mensual",
          contractStart: accountData.startDate.toLocaleDateString(),
          contractEnd: accountData.endDate.toLocaleDateString(),
        },
        companyInfo: {
          name: "TESLA LIFT",
          address: "Edificio Metropolitan, Quito, Pichincha",
          ruc: "1791234567001",
          email: "info@teslalifts.com",
          phone: "+593 968 100 793",
        },
        // HTML personalizado para el estado de cuenta
        customHtml: generateAccountStatementHTML(),
        fileName: `Estado_Cuenta_${user?.name?.replace(/\s+/g, "_") || "Cliente"}_${new Date().toLocaleDateString().replace(/\//g, "-")}`,
      }

      // Generar PDF usando el servicio existente
      const result = await PDFGenerator.generateAccountStatementPDF([], [], accountInfo)

      if (result.success && result.filePath) {
        await PDFGenerator.sharePDF(result.filePath)
        Alert.alert("Éxito", "El estado de cuenta ha sido generado correctamente.")
      } else {
        throw new Error("No se pudo generar el PDF")
      }
    } catch (error) {
      console.error("Error generando PDF:", error)
      showError(
        "Error de Generación de PDF",
        "No se pudo generar el estado de cuenta. Por favor, inténtelo de nuevo más tarde.",
      )
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [user, accountData])

  // Generar HTML para el estado de cuenta
  const generateAccountStatementHTML = useCallback(() => {
    // Calcular el progreso del contrato
    const totalDays = (accountData.endDate.getTime() - accountData.startDate.getTime()) / (24 * 60 * 60 * 1000)
    const elapsedDays = (new Date().getTime() - accountData.startDate.getTime()) / (24 * 60 * 60 * 1000)
    const contractProgress = Math.min(1, Math.max(0, elapsedDays / totalDays))

    // Formatear valores monetarios
    const formatCurrency = (amount: number) => {
      return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")
    }

    // Obtener estado de pago
    const paymentStatusText = accountData.paymentStatus === "paid" ? "Al día" : "Pendiente"
    const paymentStatusColor = accountData.paymentStatus === "paid" ? "#10b981" : "#ef4444"

    // Generar HTML con los colores de cliente y logo
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Estado de Cuenta</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #1f2937;
              background-color: #ffffff;
              background-image: url('data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABrCTAAeEpjHqq4b6AAAAAASUVORK5CYII=');
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 200px;
              margin: 0 auto 20px;
            }
            .statement-title {
              font-size: 24px;
              font-weight: bold;
              color: #efb810;
              margin-bottom: 5px;
            }
            .statement-date {
              color: #6b7280;
              margin-bottom: 20px;
            }
            .divider {
              height: 2px;
              background-color: #efb810;
              margin: 20px 0;
            }
            .section {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #efb810;
              margin-bottom: 15px;
              border-bottom: 1px solid #f3f4f6;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 500;
              color: #4b5563;
            }
            .info-value {
              font-weight: bold;
              color: #1f2937;
            }
            .highlight {
              color: #efb810;
              font-weight: bold;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-weight: bold;
              color: white;
              background-color: ${paymentStatusColor};
            }
            .progress-container {
              margin: 20px 0;
            }
            .progress-bar {
              height: 10px;
              background-color: #f3f4f6;
              border-radius: 5px;
              overflow: hidden;
              margin-top: 5px;
            }
            .progress-fill {
              height: 100%;
              width: ${contractProgress * 100}%;
              background-color: #efb810;
              border-radius: 5px;
            }
            .payment-info {
              background-color: #fff8e1;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
            }
            .contact-section {
              background-color: #f9fafb;
              border-radius: 10px;
              padding: 15px;
              margin-top: 20px;
            }
            .contact-item {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            .contact-icon {
              width: 20px;
              margin-right: 10px;
              text-align: center;
            }
            .footer {
              margin-top: 50px;
              text-align: center;
              color: #6b7280;
              font-size: 12px;
              border-top: 1px solid #f3f4f6;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">
              <!-- Logo de Tesla Lift -->
            <div class="logo-container">
              <img src="ss" class="logo" alt="Tesla Lift Logo">
            </div>
            </div>
            <div class="statement-title">Estado de Cuenta</div>
            <div class="statement-date">Generado el ${new Date().toLocaleDateString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Información del Cliente</div>
            <div class="info-row">
              <span class="info-label">Cliente:</span>
              <span class="info-value">${user?.name || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Edificio:</span>
              <span class="info-value">${user?.buildingName || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">RUC:</span>
              <span class="info-value">${user?.ruc || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Dirección:</span>
              <span class="info-value">${user?.address || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Teléfono:</span>
              <span class="info-value">${user?.phone || "N/A"}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${user?.email || "N/A"}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <div class="section-title">Resumen del Contrato</div>
            <div class="info-row">
              <span class="info-label">Valor Total del Contrato:</span>
              <span class="info-value highlight">$${formatCurrency(accountData.totalAmount)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Valor Mensual:</span>
              <span class="info-value">$${formatCurrency(accountData.monthlyAmount)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duración del Contrato:</span>
              <span class="info-value">${accountData.contractDuration} meses</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Inicio:</span>
              <span class="info-value">${accountData.startDate.toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Fecha de Finalización:</span>
              <span class="info-value">${accountData.endDate.toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Meses Restantes:</span>
              <span class="info-value highlight">${accountData.remainingMonths} meses</span>
            </div>
            <div class="info-row">
              <span class="info-label">Estado de Pago:</span>
              <span class="status-badge">${paymentStatusText}</span>
            </div>

            <div class="progress-container">
              <div class="info-label">Progreso del Contrato:</div>
              <div class="progress-bar">
                <div class="progress-fill"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <small>${accountData.startDate.toLocaleDateString()}</small>
                <small>${Math.round(contractProgress * 100)}%</small>
                <small>${accountData.endDate.toLocaleDateString()}</small>
              </div>
            </div>
          </div>

          <div class="payment-info">
            <div class="section-title">Información de Pago</div>
            <div class="info-row">
              <span class="info-label">Próxima Fecha de Pago:</span>
              <span class="info-value">${accountData.nextPaymentDate.toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Monto a Pagar:</span>
              <span class="info-value highlight">$${formatCurrency(accountData.monthlyAmount)}</span>
            </div>
            <p>
              Para realizar su pago, por favor visite nuestras oficinas o contacte con nuestro departamento de atención al cliente
              para programar una cita de pago.
            </p>
          </div>

          <div class="contact-section">
            <div class="section-title">Contacto</div>
            <div class="contact-item">
              <div class="contact-icon">📍</div>
              <div>Edificio Metropolitan, Quito, Pichincha</div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">📞</div>
              <div>+593 968 100 793</div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">✉️</div>
              <div>info@teslalifts.com</div>
            </div>
            <div class="contact-item">
              <div class="contact-icon">🕒</div>
              <div>Lunes a Viernes: 8:00 - 18:00</div>
            </div>
          </div>

          <div class="footer">
            <p>Este documento es un resumen informativo de su cuenta.</p>
            <p>Para cualquier consulta, contáctenos al +593 968 100 793 o info@teslalifts.com</p>
            <p>© ${new Date().getFullYear()} TESLA LIFT - Todos los derechos reservados</p>
          </div>
        </body>
      </html>
    `
  }, [user, accountData])

  // Manejar llamada a la oficina
  const handleCallOffice = useCallback(() => {
    const phoneNumber = "+593968100793"
    Linking.canOpenURL(`tel:${phoneNumber}`)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(`tel:${phoneNumber}`)
        } else {
          Alert.alert("Error", "No se puede realizar llamadas desde este dispositivo")
        }
      })
      .catch((error) => {
        Alert.alert("Error", "No se pudo iniciar la llamada: " + error.message)
      })
  }, [])

  // Manejar envío de email
  const handleEmailSupport = useCallback(() => {
    const email = "info@teslalifts.com"
    const subject = "Consulta sobre mi cuenta"
    const body = `Hola, soy ${user?.name} y tengo una consulta sobre mi cuenta...`

    Linking.canOpenURL(`mailto:${email}`)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(
            `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
          )
        } else {
          Alert.alert("Error", "No se puede enviar correos desde este dispositivo")
        }
      })
      .catch((error) => {
        Alert.alert("Error", "No se pudo abrir la aplicación de correo: " + error.message)
      })
  }, [user])

  // Manejar WhatsApp
  const handleWhatsAppSupport = useCallback(() => {
    const phoneNumber = "+593968100793"
    const message = `Hola, soy ${user?.name} y tengo una consulta sobre mi cuenta en Tesla Lift.`

    Linking.canOpenURL(`whatsapp://send?phone=${phoneNumber}`)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`)
        } else {
          // Fallback a WhatsApp web
          return Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`)
        }
      })
      .catch((error) => {
        Alert.alert("Error", "No se pudo abrir WhatsApp: " + error.message)
      })
  }, [user])

  // Manejar navegación al mapa
  const handleViewMap = useCallback(() => {
    if (Platform.OS === "ios" || Platform.OS === "android") {
      // Navegar a la pantalla de mapa
      // navigation.navigate('Map')

      // Por ahora, mostrar modal de característica futura
      setFutureFeatureInfo({
        title: "Mapa de Oficinas",
        message:
          "Pronto podrás ver la ubicación de nuestras oficinas en el mapa. Por ahora, puedes contactarnos directamente para obtener indicaciones.",
        icon: "map",
        releaseDate: "Próximamente",
      })
      setShowFutureFeatureModal(true)
    } else {
      // Abrir Google Maps en el navegador
      const address = "Edificio Metropolitan, Quito, Ecuador"
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)
    }
  }, [])

  // Estado de error
  if (hasError && !refreshing) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>No se pudo cargar la información</Text>
        <Text style={styles.errorMessage}>
          Hubo un problema al cargar los datos de tu cuenta. Por favor intenta nuevamente.
        </Text>
        <Button mode="contained" onPress={handleRetry} style={styles.retryButton} buttonColor={COLORS.primary}>
          Reintentar
        </Button>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Estado de Cuenta</Text>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleDownloadAccountStatement}
            disabled={isGeneratingPDF}
          >
            <Ionicons name="download-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {isLoading ? (
          // Estado de carga
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Cargando información de cuenta...</Text>
          </View>
        ) : (
          <>
            {/* Tarjeta de Resumen de Cuenta */}
            <Animated.View entering={FadeIn.duration(300)}>
              <Card style={styles.summaryCard}>
                <Card.Content>
                  <View style={styles.summaryHeader}>
                    <View>
                      <Text style={styles.summaryTitle}>Resumen de Cuenta</Text>
                      <Text style={styles.lastUpdated}>Actualizado: {new Date().toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={onRefresh}
                      accessibilityLabel="Actualizar información"
                      accessibilityRole="button"
                    >
                      <Ionicons name="refresh" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.balanceContainer}>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceLabel}>Valor Mensual</Text>
                      <Text style={styles.balanceAmount}>$ {accountData.monthlyAmount.toFixed(2)}</Text>

                      <View style={styles.paymentStatusContainer}>
                        <View
                          style={[
                            styles.paymentStatusBadge,
                            accountData.paymentStatus === "paid" ? styles.paidBadge : styles.debtBadge,
                          ]}
                        >
                          <Ionicons
                            name={accountData.paymentStatus === "paid" ? "checkmark-circle" : "alert-circle"}
                            size={16}
                            color="white"
                          />
                          <Text style={styles.paymentStatusText}>
                            {accountData.paymentStatus === "paid" ? "Al día" : "Pendiente"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.balanceChart}>
                      <View style={styles.progressRing}>
                        <Text style={styles.progressPercent}>{accountData.remainingMonths}</Text>
                        <Text style={styles.progressLabel}>meses</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.balanceActions}>
                    <Button
                      mode="contained"
                      icon="phone"
                      buttonColor={COLORS.primary}
                      style={styles.actionButton}
                      contentStyle={styles.buttonContent}
                      accessibilityLabel="Llamar para pago"
                      onPress={handleCallOffice}
                    >
                      Llamar
                    </Button>

                    <Button
                      mode="outlined"
                      icon="map-marker"
                      textColor={COLORS.primary}
                      style={styles.actionButton}
                      contentStyle={styles.buttonContent}
                      accessibilityLabel="Ver mapa de oficinas"
                      onPress={handleViewMap}
                    >
                      Ver Mapa
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Tarjeta de Detalles del Contrato */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <Card style={styles.contractCard}>
                <Card.Content>
                  <View style={styles.contractHeader}>
                    <Text style={styles.contractTitle}>Contrato de Servicio</Text>
                    <View
                      style={[
                        styles.contractStatusChip,
                        accountData.paymentStatus === "paid" ? styles.paidChip : styles.debtChip,
                      ]}
                    >
                      <Text style={styles.contractStatusText}>
                        {accountData.paymentStatus === "paid" ? "Al día" : "Pendiente"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contractDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Tipo de Contrato:</Text>
                      <Text style={styles.detailValue}>Mantenimiento Mensual</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Inicio:</Text>
                      <Text style={styles.detailValue}>{accountData.startDate.toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Finalización:</Text>
                      <Text style={styles.detailValue}>{accountData.endDate.toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="cash" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Valor Total:</Text>
                      <Text style={styles.detailValue}>$ {accountData.totalAmount.toFixed(2)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Duración:</Text>
                      <Text style={styles.detailValue}>{accountData.contractDuration} meses</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color={COLORS.primary} />
                      <Text style={styles.detailLabel}>Próximo Pago:</Text>
                      <Text style={styles.detailValue}>{accountData.nextPaymentDate.toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={styles.contractProgress}>
                    <Text style={styles.contractProgressLabel}>Tiempo restante del contrato</Text>
                    <ProgressBar
                      progress={accountData.remainingMonths / accountData.contractDuration}
                      color={COLORS.primary}
                      style={styles.contractProgressBar}
                    />
                    <Text style={styles.contractProgressText}>{accountData.remainingMonths} meses restantes</Text>
                  </View>

                  <Button
                    mode="outlined"
                    icon="file-document"
                    textColor={COLORS.primary}
                    style={styles.downloadButton}
                    accessibilityLabel="Descargar estado de cuenta"
                    onPress={handleDownloadAccountStatement}
                    loading={isGeneratingPDF}
                    disabled={isGeneratingPDF}
                  >
                    Descargar Estado de Cuenta
                  </Button>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Tarjeta de Información de Pago */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Card style={styles.paymentInfoCard}>
                <Card.Content>
                  <Text style={styles.paymentInfoTitle}>Información de Pago</Text>

                  <View style={styles.paymentInfoContent}>
                    <Ionicons name="information-circle" size={24} color={COLORS.primary} style={styles.infoIcon} />
                    <Text style={styles.paymentInfoText}>
                      Para realizar su pago, por favor visite nuestras oficinas o contáctenos para programar una cita.
                      No se aceptan pagos a través de la aplicación.
                    </Text>
                  </View>

                  <Divider style={styles.divider} />

                  <Text style={styles.paymentMethodsTitle}>Métodos de Pago Aceptados:</Text>
                  <View style={styles.paymentMethods}>
                    <View style={styles.paymentMethod}>
                      <Ionicons name="card" size={24} color={COLORS.primary} />
                      <Text style={styles.paymentMethodText}>Tarjeta de Crédito/Débito</Text>
                    </View>
                    <View style={styles.paymentMethod}>
                      <Ionicons name="cash" size={24} color={COLORS.primary} />
                      <Text style={styles.paymentMethodText}>Efectivo</Text>
                    </View>
                    <View style={styles.paymentMethod}>
                      <Ionicons name="business" size={24} color={COLORS.primary} />
                      <Text style={styles.paymentMethodText}>Transferencia Bancaria</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Tarjeta de Soporte */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Card style={styles.supportCard}>
                <Card.Content>
                  <Text style={styles.supportTitle}>¿Necesitas ayuda?</Text>
                  <Text style={styles.supportText}>
                    Si tienes dudas sobre tu facturación o contrato, nuestro equipo está listo para ayudarte.
                  </Text>

                  <View style={styles.supportButtons}>
                    <TouchableOpacity
                      style={styles.supportButton}
                      accessibilityLabel="Llamar a soporte"
                      accessibilityRole="button"
                      onPress={handleCallOffice}
                    >
                      <View style={styles.supportButtonIcon}>
                        <Ionicons name="call" size={24} color="white" />
                      </View>
                      <Text style={styles.supportButtonText}>Llamar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.supportButton}
                      accessibilityLabel="Enviar email a soporte"
                      accessibilityRole="button"
                      onPress={handleEmailSupport}
                    >
                      <View style={[styles.supportButtonIcon, { backgroundColor: COLORS.success }]}>
                        <Ionicons name="mail" size={24} color="white" />
                      </View>
                      <Text style={styles.supportButtonText}>Email</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.supportButton}
                      accessibilityLabel="Contactar por WhatsApp"
                      accessibilityRole="button"
                      onPress={handleWhatsAppSupport}
                    >
                      <View style={[styles.supportButtonIcon, { backgroundColor: "#25D366" }]}>
                        <Ionicons name="logo-whatsapp" size={24} color="white" />
                      </View>
                      <Text style={styles.supportButtonText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Indicador de generación de PDF */}
      {isGeneratingPDF && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Generando documento...</Text>
          </View>
        </View>
      )}

      {/* Modal de Característica Futura */}
      <FutureFeatureModal
        visible={showFutureFeatureModal}
        title={futureFeatureInfo.title}
        message={futureFeatureInfo.message}
        icon={futureFeatureInfo.icon}
        releaseDate={futureFeatureInfo.releaseDate}
        onClose={() => setShowFutureFeatureModal(false)}
        onContact={handleCallOffice}
      />

      {/* Modal de Error */}
      <ErrorMessage
        visible={showErrorMessage}
        title={errorData.title}
        message={errorData.message}
        onClose={() => setShowErrorMessage(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 20,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  lastUpdated: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 12,
  },
  paymentStatusContainer: {
    marginTop: 8,
  },
  paymentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  paidBadge: {
    backgroundColor: COLORS.success,
  },
  debtBadge: {
    backgroundColor: COLORS.danger,
  },
  paymentStatusText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 4,
  },
  balanceChart: {
    width: 100,
    alignItems: "center",
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 8,
    borderColor: COLORS.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  progressLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  balanceActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  contractCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 20,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  contractStatusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  paidChip: {
    backgroundColor: COLORS.successLight,
  },
  debtChip: {
    backgroundColor: COLORS.dangerLight,
  },
  contractStatusText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  contractDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    marginLeft: 8,
    color: "#6b7280",
  },
  detailValue: {
    flex: 1,
    fontWeight: "500",
    color: "#1f2937",
  },
  contractProgress: {
    marginBottom: 16,
  },
  contractProgressLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  contractProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  contractProgressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
    marginTop: 4,
  },
  downloadButton: {
    borderColor: COLORS.primary,
    marginTop: 8,
  },
  paymentInfoCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 20,
  },
  paymentInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 16,
  },
  paymentInfoContent: {
    flexDirection: "row",
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  paymentInfoText: {
    flex: 1,
    color: "#1f2937",
    lineHeight: 20,
  },
  divider: {
    marginVertical: 16,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 12,
  },
  paymentMethods: {
    marginTop: 8,
  },
  paymentMethod: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  paymentMethodText: {
    marginLeft: 12,
    color: "#4b5563",
  },
  supportCard: {
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 20,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  supportText: {
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  supportButton: {
    alignItems: "center",
  },
  supportButtonIcon: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  supportButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
})
