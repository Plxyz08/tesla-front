"use client"

import React, { useState, useEffect, useCallback } from "react"
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
} from "react-native"
import { Card, Button, Chip, Divider, ProgressBar } from "react-native-paper"
import { Ionicons } from "@expo/vector-icons"
import { useApp } from "../../context/AppContext"
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { useAuth } from "../../context/AuthContext"

// First, import the new components at the top of the file
import InvoiceDetailsModal from "../../components/InvoiceDetailsModal"
import FutureFeatureModal from "../../components/FutureFeatureModal"
import PDFGenerator from "../../services/PDFGenerator"
import ErrorMessage from "../../components/ErrorMessage"

// Define types
type InvoiceStatus = "paid" | "pending" | "overdue"

// Define payment history type
interface Payment {
  id: string
  date: Date
  amount: number
  method: string
  reference: string
  invoiceId?: string
  bankInfo?: string
  cardInfo?: string
  paymentTime?: string
}

export default function ClientAccountScreen() {
  // Get data from context
  const { invoices: contextInvoices } = useApp()
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  // Component state
  const [activeTab, setActiveTab] = useState<"all" | InvoiceStatus>("all")
  const [page, setPage] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const itemsPerPage = 3
  const [showErrorMessage, setShowErrorMessage] = useState(false)
  const [errorData, setErrorData] = useState({ title: "", message: "" })

  // Then add these state variables inside the AccountScreen component, after the existing state variables
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Added new state for PDF error notification
  const [showPDFErrorNotification, setShowPDFErrorNotification] = useState(false)
  const [currentPDFAction, setCurrentPDFAction] = useState<"invoice" | "statement" | null>(null)

  // Modificar la sección de estado para incluir mockdata más completa
  const [invoices, setInvoices] = useState<any[]>([
    {
      id: "INV-2024-001",
      amount: 2500.0,
      status: "paid",
      dueDate: new Date(2024, 0, 15), // 15 de enero de 2024
      description: "Mantenimiento mensual - Enero 2024",
      details: "Servicio de mantenimiento preventivo de ascensores",
      items: [
        { description: "Revisión de sistemas eléctricos", quantity: 1, price: 800 },
        { description: "Lubricación de componentes mecánicos", quantity: 1, price: 600 },
        { description: "Ajuste de sistemas de seguridad", quantity: 1, price: 700 },
        { description: "Pruebas de funcionamiento", quantity: 1, price: 400 },
      ],
    },
    {
      id: "INV-2024-002",
      amount: 2500.0,
      status: "paid",
      dueDate: new Date(2024, 1, 15), // 15 de febrero de 2024
      description: "Mantenimiento mensual - Febrero 2024",
      details: "Servicio de mantenimiento preventivo de ascensores",
      items: [
        { description: "Revisión de sistemas eléctricos", quantity: 1, price: 800 },
        { description: "Lubricación de componentes mecánicos", quantity: 1, price: 600 },
        { description: "Ajuste de sistemas de seguridad", quantity: 1, price: 700 },
        { description: "Pruebas de funcionamiento", quantity: 1, price: 400 },
      ],
    },
    {
      id: "INV-2024-003",
      amount: 2500.0,
      status: "pending",
      dueDate: new Date(2024, 2, 15), // 15 de marzo de 2024
      description: "Mantenimiento mensual - Marzo 2024",
      details: "Servicio de mantenimiento preventivo de ascensores",
      items: [
        { description: "Revisión de sistemas eléctricos", quantity: 1, price: 800 },
        { description: "Lubricación de componentes mecánicos", quantity: 1, price: 600 },
        { description: "Ajuste de sistemas de seguridad", quantity: 1, price: 700 },
        { description: "Pruebas de funcionamiento", quantity: 1, price: 400 },
      ],
    },
    {
      id: "INV-2024-004",
      amount: 3200.0,
      status: "overdue",
      dueDate: new Date(2024, 2, 1), // 1 de marzo de 2024
      description: "Reparación de emergencia",
      details: "Reparación de sistema de frenos de emergencia",
      items: [
        { description: "Diagnóstico de falla", quantity: 1, price: 500 },
        { description: "Reemplazo de componentes", quantity: 1, price: 1800 },
        { description: "Mano de obra especializada", quantity: 4, price: 225 },
        { description: "Pruebas de seguridad", quantity: 1, price: 400 },
      ],
    },
  ])

  // Memoize filtered invoices to prevent unnecessary recalculations
  const filteredInvoices = React.useMemo(() => {
    return activeTab === "all" ? invoices : invoices.filter((invoice) => invoice.status === activeTab)
  }, [invoices, activeTab])

  // Pagination calculations
  const startIndex = page * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  // Reemplazar la carga de datos de pagos con mockdata más detallada
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      try {
        setIsLoading(true)

        // Simulate data loading with a delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (isMounted) {
          // Load mock payment history data
          const mockPayments: Payment[] = [
            {
              id: "PAY-2024-001",
              date: new Date(2024, 0, 15), // 15 de enero de 2024
              amount: 2500.0,
              method: "Transferencia bancaria",
              reference: "TRF-78945612",
              invoiceId: "INV-2024-001",
              bankInfo: "Banco Pichincha",
              paymentTime: "14:30",
            },
            {
              id: "PAY-2024-002",
              date: new Date(2024, 1, 15), // 15 de febrero de 2024
              amount: 2500.0,
              method: "Tarjeta de crédito",
              reference: "CC-45678923",
              invoiceId: "INV-2024-002",
              cardInfo: "VISA ****4589",
              paymentTime: "10:15",
            },
          ]

          setPayments(mockPayments)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error loading account data:", error)
        if (isMounted) {
          setHasError(true)
          setIsLoading(false)
        }
      }
    }

    loadData()

    // Fallback timeout to prevent infinite loading state
    const fallbackTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("Loading timeout - forcing content display")
        setIsLoading(false)
      }
    }, 5000)

    return () => {
      isMounted = false
      clearTimeout(fallbackTimer)
    }
  }, [])

  // Handle refresh action
  const onRefresh = useCallback(() => {
    setRefreshing(true)

    // Reset error state on refresh
    setHasError(false)

    // Simulate refreshing data
    setTimeout(() => {
      setRefreshing(false)
    }, 1500)
  }, [])

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)

    // Simulate retrying data load
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }, [])

  // Status helper functions
  const getStatusColor = useCallback((status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return { bg: "#dcfce7", text: "#166534", light: "#f0fdf4" }
      case "pending":
        return { bg: "#fef9c3", text: "#854d0e", light: "#fefce8" }
      case "overdue":
        return { bg: "#fee2e2", text: "#b91c1c", light: "#fef2f2" }
      default:
        return { bg: "#f3f4f6", text: "#374151", light: "#f9fafb" }
    }
  }, [])

  const getStatusText = useCallback((status: InvoiceStatus) => {
    switch (status) {
      case "paid":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "overdue":
        return "Vencido"
      default:
        return status
    }
  }, [])

  // Calculate account statistics
  const accountStats = React.useMemo(() => {
    const pendingAmount = invoices
      .filter((invoice) => invoice.status === "pending" || invoice.status === "overdue")
      .reduce((sum, invoice) => sum + invoice.amount, 0)

    const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
    const paidAmount = invoices
      .filter((invoice) => invoice.status === "paid")
      .reduce((sum, invoice) => sum + invoice.amount, 0)
    const paymentProgress = totalAmount > 0 ? paidAmount / totalAmount : 0

    // Calculate the balance
    const balance = (user?.totalCuentaCliente || 0) - paidAmount

    return {
      pendingAmount,
      totalAmount,
      paidAmount,
      paymentProgress,
      balance,
    }
  }, [invoices, payments, user])

  // Skeleton loading component
  const renderSkeletonInvoice = useCallback(
    () => (
      <View style={styles.skeletonInvoice}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "50%" }]} />
      </View>
    ),
    [],
  )

  // Updated handling for PDF generation errors
  const handleViewInvoice = useCallback((invoice: any) => {
    setSelectedInvoice(invoice)
    setShowInvoiceModal(true)
  }, [])

  // Actualizar la función handleDownloadInvoice para manejar mejor la generación de PDF
  const handleDownloadInvoice = useCallback(async (invoice: any) => {
    try {
      setIsGeneratingPDF(true)
      setCurrentPDFAction("invoice")

      // Asegurarse de que el invoice tenga todos los datos necesarios
      const completeInvoice = {
        ...invoice,
        customerInfo: {
          name: "Cliente Demo S.A.",
          address: "Av. Amazonas N36-152, Quito",
          ruc: "1792456789001",
          email: "cliente@ejemplo.com",
          phone: "+593 2 394 5600",
        },
        companyInfo: {
          name: "TESLA LIFT",
          address: "Edificio Metropolitan, Quito, Pichincha",
          ruc: "1791234567001",
          email: "info@teslalifts.com",
          phone: "+593 968 100 793",
        },
      }

      const result = await PDFGenerator.generateInvoicePDF(completeInvoice)
      setIsGeneratingPDF(false)

      if (result.success && result.filePath) {
        await PDFGenerator.sharePDF(result.filePath)
      } else {
        throw new Error("No se pudo generar el PDF")
      }
    } catch (error) {
      setIsGeneratingPDF(false)
      console.error("Error generating PDF:", error)
      showError("Error de Generación de PDF", "No se pudo generar el PDF. Por favor, inténtelo de nuevo más tarde.")
    }
  }, [])

  // Actualizar la función handleDownloadButtonPress para incluir información más completa
  const handleDownloadButtonPress = useCallback(async () => {
    try {
      setIsGeneratingPDF(true)
      setCurrentPDFAction("statement")

      // Añadir información adicional para el estado de cuenta
      const accountInfo = {
        customerInfo: {
          name: user?.name,
          address: user?.address,
          ruc: user?.ruc,
          email: user?.email,
          phone: user?.phone,
          contractType: "Mantenimiento Mensual",
          contractStart: "01/01/2024",
          contractEnd: "31/12/2024",
        },
        companyInfo: {
          name: "TESLA LIFT",
          address: "Edificio Metropolitan, Quito, Pichincha",
          ruc: "1791234567001",
          email: "info@teslalifts.com",
          phone: "+593 968 100 793",
        },
      }

      const result = await PDFGenerator.generateAccountStatementPDF(invoices, payments, accountInfo)
      setIsGeneratingPDF(false)

      if (result.success && result.filePath) {
        await PDFGenerator.sharePDF(result.filePath)
      } else {
        throw new Error("No se pudo generar el PDF")
      }
    } catch (error) {
      setIsGeneratingPDF(false)
      console.error("Error generating PDF:", error)
      showError("Error de Generación de PDF", "No se pudo generar el PDF. Por favor, inténtelo de nuevo más tarde.")
    }
  }, [invoices, payments, user])

  const showError = (title: string, message: string) => {
    setErrorData({ title, message })
    setShowErrorMessage(true)
  }

  // Retry handler for PDF generation
  const handleRetryPDFGeneration = useCallback(() => {
    setShowPDFErrorNotification(false)
    if (currentPDFAction === "invoice" && selectedInvoice) {
      setTimeout(() => handleDownloadInvoice(selectedInvoice), 500)
    } else if (currentPDFAction === "statement") {
      setTimeout(() => handleDownloadButtonPress(), 500)
    }
  }, [currentPDFAction, selectedInvoice, handleDownloadInvoice, handleDownloadButtonPress])

  const handlePayButtonPress = useCallback(() => {
    setFutureFeatureInfo({
      title: "Pago en línea",
      message:
        "El pago en línea estará disponible en futuras versiones. Por favor, contacte directamente con la empresa para realizar sus pagos.",
      icon: "card",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  const handleViewContract = useCallback(() => {
    setFutureFeatureInfo({
      title: "Visualización de Contrato",
      message:
        "La visualización del contrato completo estará disponible en futuras versiones. Por favor, contacte con la empresa para obtener una copia de su contrato.",
      icon: "document-text",
      releaseDate: "Pronto",
    })
    setShowFutureFeatureModal(true)
  }, [])

  // Handle Call button press
  const handleCallSupport = useCallback(() => {
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

  // Handle Email button press
  const handleEmailSupport = useCallback(() => {
    const email = "soporte@teslalifts.com"
    const subject = "Consulta sobre facturación"
    const body = "Hola, tengo una consulta sobre mi facturación..."

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
  }, [])

  // Handle WhatsApp button press
  const handleWhatsAppSupport = useCallback(() => {
    const phoneNumber = "+593968100793"
    const message = "Hola, tengo una consulta sobre mi cuenta en Tesla Lift."

    Linking.canOpenURL(`whatsapp://send?phone=${phoneNumber}`)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(`whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`)
        } else {
          // Fallback to web WhatsApp
          return Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`)
        }
      })
      .catch((error) => {
        Alert.alert("Error", "No se pudo abrir WhatsApp: " + error.message)
      })
  }, [])

  // Error state
  if (hasError && !refreshing) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorTitle}>No se pudo cargar la información</Text>
        <Text style={styles.errorMessage}>
          Hubo un problema al cargar los datos de tu cuenta. Por favor intenta nuevamente.
        </Text>
        <Button mode="contained" onPress={handleRetry} style={styles.retryButton} buttonColor="#f7be0d">
          Reintentar
        </Button>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#f7be0d", "#e6a800"]} style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Estado de Cuenta</Text>
          <TouchableOpacity style={styles.headerActionButton} onPress={handleDownloadButtonPress}>
            <Ionicons name="download-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#f7be0d"]} />}
      >
        {isLoading ? (
          // Skeleton loading state
          <View style={styles.skeletonContainer}>
            <View style={styles.skeletonBalance} />
            <View style={styles.skeletonActions} />
            <View style={styles.skeletonTabs} />
            {renderSkeletonInvoice()}
            {renderSkeletonInvoice()}
          </View>
        ) : (
          <>
            {/* Account Summary Card */}
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
                      <Ionicons name="refresh" size={20} color="#f7be0d" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.balanceContainer}>
                    <View style={styles.balanceInfo}>
                      <Text style={styles.balanceLabel}>Saldo Actual</Text>
                      <Text style={styles.balanceAmount}>$ {accountStats.balance.toFixed(2)}</Text>
                      <View style={styles.paymentStatusContainer}>
                        <Text style={styles.paymentStatusLabel}>
                          {accountStats.paymentProgress >= 0.75
                            ? "Buen estado de pago"
                            : accountStats.paymentProgress >= 0.5
                              ? "Estado de pago regular"
                              : "Requiere atención"}
                        </Text>
                        <ProgressBar
                          progress={accountStats.paymentProgress}
                          color={
                            accountStats.paymentProgress >= 0.75
                              ? "#10b981"
                              : accountStats.paymentProgress >= 0.5
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                          style={styles.paymentProgress}
                        />
                      </View>
                    </View>

                    <View style={styles.balanceChart}>
                      <View style={styles.progressRing}>
                        <Text style={styles.progressPercent}>{Math.round(accountStats.paymentProgress * 100)}%</Text>
                        <Text style={styles.progressLabel}>Pagado</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.balanceActions}>
                    <Button
                      mode="contained"
                      icon="credit-card"
                      buttonColor="#f7be0d"
                      style={styles.payButton}
                      contentStyle={styles.buttonContent}
                      accessibilityLabel="Pagar ahora"
                      onPress={handlePayButtonPress}
                    >
                      Pagar Ahora
                    </Button>

                    <Button
                      mode="outlined"
                      icon="file-pdf-box"
                      textColor="#f7be0d"
                      style={styles.downloadButton}
                      contentStyle={styles.buttonContent}
                      accessibilityLabel="Descargar estado de cuenta"
                      onPress={handleDownloadButtonPress}
                    >
                      Descargar
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Billing History Section */}
            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <Card style={styles.billingHistoryCard}>
                <Card.Content>
                  <Text style={styles.billingHistoryTitle}>Historial de Pagos</Text>

                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <View key={payment.id} style={styles.paymentItem}>
                        <View style={styles.paymentHeader}>
                          <View style={styles.paymentInfo}>
                            <Text style={styles.paymentDate}>{payment.date.toLocaleDateString()}</Text>
                            <Text style={styles.paymentMethod}>{payment.method}</Text>
                          </View>
                          <Text style={styles.paymentAmount}>$ {payment.amount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.paymentReference}>
                          <Text style={styles.paymentReferenceLabel}>Referencia:</Text>
                          <Text style={styles.paymentReferenceValue}>{payment.reference}</Text>
                        </View>
                        <Divider style={styles.paymentDivider} />
                      </View>
                    ))
                  ) : (
                    <View style={styles.noPaymentsContainer}>
                      <Ionicons name="cash-outline" size={48} color="#d1d5db" />
                      <Text style={styles.noPaymentsText}>No hay pagos registrados en el historial</Text>
                      <Text style={styles.noPaymentsSubtext}>
                        Los pagos realizados aparecerán aquí una vez procesados
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Invoices Card */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Card style={styles.invoicesCard}>
                <Card.Content>
                  <Text style={styles.invoicesTitle}>Facturas</Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContainer}
                  >
                    <TouchableOpacity
                      style={[styles.filterChip, activeTab === "all" && styles.activeFilterChip]}
                      onPress={() => setActiveTab("all")}
                      accessibilityLabel="Filtrar todas las facturas"
                      accessibilityState={{ selected: activeTab === "all" }}
                    >
                      <Text style={[styles.filterChipText, activeTab === "all" && styles.activeFilterChipText]}>
                        Todas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, activeTab === "pending" && styles.pendingFilterChip]}
                      onPress={() => setActiveTab("pending")}
                      accessibilityLabel="Filtrar facturas pendientes"
                      accessibilityState={{ selected: activeTab === "pending" }}
                    >
                      <Text style={[styles.filterChipText, activeTab === "pending" && styles.pendingFilterChipText]}>
                        Pendientes
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, activeTab === "paid" && styles.paidFilterChip]}
                      onPress={() => setActiveTab("paid")}
                      accessibilityLabel="Filtrar facturas pagadas"
                      accessibilityState={{ selected: activeTab === "paid" }}
                    >
                      <Text style={[styles.filterChipText, activeTab === "paid" && styles.filterChipText]}>
                        Pagadas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.filterChip, activeTab === "overdue" && styles.overdueFilterChip]}
                      onPress={() => setActiveTab("overdue")}
                      accessibilityLabel="Filtrar facturas vencidas"
                      accessibilityState={{ selected: activeTab === "overdue" }}
                    >
                      <Text style={[styles.filterChipText, activeTab === "overdue" && styles.overdueFilterChipText]}>
                        Vencidas
                      </Text>
                    </TouchableOpacity>
                  </ScrollView>

                  <Divider style={styles.divider} />

                  {paginatedInvoices.length > 0 ? (
                    paginatedInvoices.map((invoice) => {
                      const statusColor = getStatusColor(invoice.status)

                      return (
                        <TouchableOpacity
                          key={invoice.id}
                          style={[styles.invoiceItem, { backgroundColor: statusColor.light }]}
                          accessibilityLabel={`Factura: ${invoice.description}, Estado: ${getStatusText(invoice.status)}, Monto: ${invoice.amount.toFixed(2)}`}
                          accessibilityRole="button"
                          onPress={() => handleViewInvoice(invoice)} // Manejar el evento onPress para abrir los detalles de la factura
                        >
                          <View style={styles.invoiceHeader}>
                            <View style={styles.invoiceInfo}>
                              <Text style={styles.invoiceDescription}>{invoice.description}</Text>
                              <Text style={styles.invoiceDate}>Vence: {invoice.dueDate.toLocaleDateString()}</Text>
                            </View>
                            <View style={styles.invoiceAmount}>
                              <Text style={styles.invoiceAmountText}>$ {invoice.amount.toFixed(2)}</Text>
                              <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                <Text style={[styles.statusText, { color: statusColor.text }]}>
                                  {getStatusText(invoice.status)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </TouchableOpacity>
                      )
                    })
                  ) : (
                    <View style={styles.noInvoicesContainer}>
                      <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
                      <Text style={styles.noInvoicesText}>No hay facturas para mostrar</Text>
                    </View>
                  )}

                  {filteredInvoices.length > itemsPerPage && (
                    <View style={styles.pagination}>
                      <TouchableOpacity
                        style={[styles.paginationButton, page === 0 && styles.paginationButtonDisabled]}
                        onPress={() => setPage(Math.max(0, page - 1))}
                        disabled={page === 0}
                        accessibilityLabel="Página anterior"
                        accessibilityState={{ disabled: page === 0 }}
                      >
                        <Ionicons name="chevron-back" size={18} color={page === 0 ? "#d1d5db" : "#0284c7"} />
                      </TouchableOpacity>

                      <Text style={styles.paginationText}>
                        {startIndex + 1}-{Math.min(endIndex, filteredInvoices.length)} de {filteredInvoices.length}
                      </Text>

                      <TouchableOpacity
                        style={[styles.paginationButton, page >= totalPages - 1 && styles.paginationButtonDisabled]}
                        onPress={() => setPage(Math.min(totalPages - 1, page + 1))}
                        disabled={page >= totalPages - 1}
                        accessibilityLabel="Página siguiente"
                        accessibilityState={{ disabled: page >= totalPages - 1 }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={page >= totalPages - 1 ? "#d1d5db" : "#0284c7"}
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Contract Card */}
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <Card style={styles.contractCard}>
                <Card.Content>
                  <View style={styles.contractHeader}>
                    <Text style={styles.contractTitle}>Contrato de Servicio</Text>
                    <Chip style={styles.contractStatusChip}>Activo</Chip>
                  </View>

                  <View style={styles.contractDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="document-text" size={20} color="#0284c7" />
                      <Text style={styles.detailText}>Tipo de Contrato: Mantenimiento Mensual</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="calendar" size={20} color="#0284c7" />
                      <Text style={styles.detailText}>Fecha de Renovación: 31/12/2024</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Ionicons name="time" size={20} color="#0284c7" />
                      <Text style={styles.detailText}>Visitas Programadas: 2 mensuales</Text>
                    </View>
                  </View>

                  <View style={styles.contractProgress}>
                    <Text style={styles.contractProgressLabel}>Tiempo restante del contrato</Text>
                    <ProgressBar progress={0.65} color="#0284c7" style={styles.contractProgressBar} />
                    <Text style={styles.contractProgressText}>8 meses restantes</Text>
                  </View>

                  <Button
                    mode="outlined"
                    icon="file-document"
                    textColor="#0284c7"
                    style={styles.viewContractButton}
                    accessibilityLabel="Ver contrato completo"
                    onPress={handleViewContract}
                  >
                    Ver Contrato Completo
                  </Button>
                </Card.Content>
              </Card>
            </Animated.View>

            {/* Support Card */}
            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
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
                      onPress={handleCallSupport}
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
                      <View style={[styles.supportButtonIcon, { backgroundColor: "#10b981" }]}>
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

      {/* PDF Generation loading indicator */}
      {isGeneratingPDF && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0284c7" />
            <Text style={styles.loadingText}>Generando documento...</Text>
          </View>
        </View>
      )}

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        visible={showInvoiceModal}
        invoice={selectedInvoice}
        onClose={() => setShowInvoiceModal(false)}
        onDownload={() => {
          if (selectedInvoice) {
            handleDownloadInvoice(selectedInvoice)
          }
          setShowInvoiceModal(false)
        }}
        onPay={() => {
          setShowInvoiceModal(false)
          handlePayButtonPress()
        }}
      />

      {/* Future Feature Modal */}
      <FutureFeatureModal
        visible={showFutureFeatureModal}
        title={futureFeatureInfo.title}
        message={futureFeatureInfo.message}
        icon={futureFeatureInfo.icon}
        releaseDate={futureFeatureInfo.releaseDate}
        onClose={() => setShowFutureFeatureModal(false)}
        onContact={handleCallSupport}
      />

      {/* Error Modal */}
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
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#0284c7",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  modalButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  skeletonContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  skeletonItem: {
    width: "100%",
    height: 40,
    backgroundColor: "#e5e7eb",
    marginBottom: 10,
    borderRadius: 5,
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
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#0284c7",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  itemsTable: {
    marginBottom: 16,
  },
  itemsHeader: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  itemHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  itemRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  itemText: {
    fontSize: 13,
    color: "#1f2937",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
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
    color: "#0284c7",
    marginBottom: 12,
  },
  paymentStatusContainer: {
    marginTop: 8,
  },
  paymentStatusLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  paymentProgress: {
    height: 6,
    borderRadius: 3,
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
    borderColor: "#e0f2fe",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0284c7",
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
  payButton: {
    flex: 1,
    marginRight: 8,
  },
  downloadButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: "#0284c7",
  },
  buttonContent: {
    paddingVertical: 6,
  },
  billingHistoryCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  billingHistoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  paymentItem: {
    marginBottom: 10,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  paymentMethod: {
    fontSize: 14,
    color: "#6b7280",
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  paymentReference: {
    flexDirection: "row",
    marginBottom: 8,
  },
  paymentReferenceLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginRight: 4,
  },
  paymentReferenceValue: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "500",
  },
  paymentDivider: {
    marginBottom: 12,
  },
  noPaymentsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noPaymentsText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 10,
  },
  noPaymentsSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  invoicesCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  invoicesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: "#0284c7",
  },
  pendingFilterChip: {
    backgroundColor: "#fef9c3",
  },
  paidFilterChip: {
    backgroundColor: "#dcfce7",
  },
  overdueFilterChip: {
    backgroundColor: "#fee2e2",
  },
  filterChipText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "white",
  },
  pendingFilterChipText: {
    color: "#854d0e",
  },
  overdueFilterChipText: {
    color: "#b91c1c",
  },
  invoiceItem: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceDescription: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  invoiceDate: {
    fontSize: 14,
    color: "#6b7280",
  },
  invoiceAmount: {
    alignItems: "flex-end",
  },
  invoiceAmountText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  noInvoicesContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noInvoicesText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 10,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  paginationButton: {
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 16,
    color: "#6b7280",
  },
  contractCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  contractHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  contractStatusChip: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  contractDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 5,
  },
  contractProgress: {
    marginBottom: 10,
  },
  contractProgressLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 5,
  },
  contractProgressBar: {
    height: 8,
    borderRadius: 4,
  },
  contractProgressText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "right",
  },
  viewContractButton: {
    borderColor: "#0284c7",
  },
  supportCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  supportText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
    lineHeight: 24,
  },
  supportButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  supportButton: {
    alignItems: "center",
  },
  supportButtonIcon: {
    backgroundColor: "#0284c7",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  supportButtonText: {
    fontSize: 14,
    color: "#6b7280",
  },
  skeletonLine: {
    height: 20,
    backgroundColor: "#e5e7eb",
    marginBottom: 10,
    borderRadius: 5,
  },
  skeletonBalance: {
    height: 100,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
    borderRadius: 8,
    width: "100%",
  },
  skeletonInvoice: {
    padding: 16,
    backgroundColor: "white",
    borderRadius: 10,
    marginBottom: 10,
  },
  skeletonActions: {
    height: 60,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
    borderRadius: 8,
    width: "100%",
  },
  skeletonTabs: {
    height: 40,
    backgroundColor: "#e5e7eb",
    marginBottom: 16,
    borderRadius: 8,
    width: "100%",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
})
