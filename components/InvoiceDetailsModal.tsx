import type React from "react"
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button } from "react-native-paper"

interface InvoiceDetailsModalProps {
  visible: boolean
  invoice: {
    id: string
    amount: number
    status: "paid" | "pending" | "overdue"
    dueDate: Date
    description: string
    details?: string
    items?: Array<{
      description: string
      quantity: number
      price: number
    }>
  } | null
  onClose: () => void
  onDownload: () => void
  onPay: () => void
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({ visible, invoice, onClose, onDownload, onPay }) => {
  if (!invoice) return null

  const getStatusColor = (
    status: string,
  ): { bg: string; text: string; icon: "checkmark-circle" | "time" | "alert-circle" | "document-text" } => {
    switch (status) {
      case "paid":
        return { bg: "#dcfce7", text: "#166534", icon: "checkmark-circle" }
      case "pending":
        return { bg: "#fef9c3", text: "#854d0e", icon: "time" }
      case "overdue":
        return { bg: "#fee2e2", text: "#b91c1c", icon: "alert-circle" }
      default:
        return { bg: "#f3f4f6", text: "#374151", icon: "document-text" }
    }
  }

  const getStatusText = (status: string) => {
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
  }

  const statusInfo = getStatusColor(invoice.status)

  // Calcular subtotal e IGV
  const subtotal = invoice.amount * 0.82
  const igv = invoice.amount * 0.18

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalles de Factura</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.invoiceHeader}>
              <View style={styles.invoiceNumberContainer}>
                <Text style={styles.invoiceNumberLabel}>Factura</Text>
                <Text style={styles.invoiceNumber}>{invoice.id}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                <Ionicons name={statusInfo.icon} size={16} color={statusInfo.text} style={styles.statusIcon} />
                <Text style={[styles.statusText, { color: statusInfo.text }]}>{getStatusText(invoice.status)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Descripción</Text>
                <Text style={styles.detailValue}>{invoice.description}</Text>
              </View>

              {invoice.details && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Detalles</Text>
                  <Text style={styles.detailValue}>{invoice.details}</Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monto</Text>
                <Text style={styles.detailValue}>$ {invoice.amount.toFixed(2)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Emisión</Text>
                <Text style={styles.detailValue}>
                  {new Date(invoice.dueDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de Vencimiento</Text>
                <Text style={styles.detailValue}>{invoice.dueDate.toLocaleDateString()}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Método de Pago</Text>
                <Text style={styles.detailValue}>Transferencia Bancaria / Tarjeta</Text>
              </View>
            </View>

            {invoice.items && invoice.items.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.itemsTitle}>Detalle de Servicios</Text>

                <View style={styles.itemsTable}>
                  <View style={styles.itemsHeader}>
                    <Text style={[styles.itemHeaderText, { flex: 2 }]}>Descripción</Text>
                    <Text style={[styles.itemHeaderText, { flex: 1, textAlign: "center" }]}>Cant.</Text>
                    <Text style={[styles.itemHeaderText, { flex: 1, textAlign: "right" }]}>Precio</Text>
                    <Text style={[styles.itemHeaderText, { flex: 1, textAlign: "right" }]}>Total</Text>
                  </View>

                  {invoice.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                      <Text style={[styles.itemText, { flex: 2 }]}>{item.description}</Text>
                      <Text style={[styles.itemText, { flex: 1, textAlign: "center" }]}>{item.quantity}</Text>
                      <Text style={[styles.itemText, { flex: 1, textAlign: "right" }]}>$ {item.price.toFixed(2)}</Text>
                      <Text style={[styles.itemText, { flex: 1, textAlign: "right" }]}>
                        $ {(item.quantity * item.price).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.divider} />

            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>$ {subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGV (18%)</Text>
                <Text style={styles.summaryValue}>$ {igv.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>$ {invoice.amount.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              icon="download"
              onPress={onDownload}
              style={styles.actionButton}
              textColor="#0284c7"
            >
              Descargar
            </Button>

            {invoice.status !== "paid" && (
              <Button
                mode="contained"
                icon="credit-card"
                onPress={onPay}
                style={styles.actionButton}
                buttonColor="#0284c7"
              >
                Pagar Ahora
              </Button>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  content: {
    padding: 16,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  invoiceNumberContainer: {
    flex: 1,
  },
  invoiceNumberLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusIcon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  detailsSection: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  summary: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1f2937",
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0284c7",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
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
})

export default InvoiceDetailsModal

