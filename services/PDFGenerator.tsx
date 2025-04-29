import { Platform, Alert, Share } from "react-native"
import * as Sharing from "expo-sharing"
import * as FileSystem from "expo-file-system"
import * as Print from "expo-print"

// Use a type that works across platforms for easy migration
type PDFConfig = {
  html: string
  fileName: string
  directory?: string
}

// Actualizar la interfaz para incluir información adicional
type CustomerInfo = {
  name: string
  address: string
  ruc: string
  email: string
  phone: string
  contractType?: string
  contractStart?: string
  contractEnd?: string
}

type CompanyInfo = {
  name: string
  address: string
  ruc: string
  email: string
  phone: string
}

// PDF Templates
export const generateInvoicePDF = async (invoice: any) => {
  // Extraer información del cliente y la empresa
  const customerInfo = invoice.customerInfo || {
    name: "Cliente Demo",
    address: "Av. Ejemplo 123, Lima",
    ruc: "12345678901",
    email: "cliente@ejemplo.com",
    phone: "+51 123 456 789",
  }

  const companyInfo = invoice.companyInfo || {
    name: "TESLA LIFT",
    address: "Edificio Metropolitan, Quito, Pichincha",
    ruc: "1791234567001",
    email: "info@teslalifts.com",
    phone: "+593 968 100 793",
  }

  // Format dates
  const issueDate = new Date(invoice.dueDate.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
  const dueDate = invoice.dueDate.toLocaleDateString()

  // Calculate amounts
  const subtotal = (invoice.amount * 0.82).toFixed(2)
  const tax = (invoice.amount * 0.18).toFixed(2)
  const total = invoice.amount.toFixed(2)

  // Get status info
  const statusText = getStatusText(invoice.status)
  const statusColor = getStatusColor(invoice.status)

  // Generate items table if available
  let itemsTableHtml = ""
  if (invoice.items && invoice.items.length > 0) {
    const itemRows = invoice.items
      .map((item: { description: string; quantity: number; price: number }) => {
        const itemTotal = (item.quantity * item.price).toFixed(2)
        return `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$ ${item.price.toFixed(2)}</td>
          <td style="text-align: right;">$ ${itemTotal}</td>
        </tr>
      `
      })
      .join("")

    itemsTableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Descripción</th>
            <th style="width: 15%; text-align: center;">Cantidad</th>
            <th style="width: 15%; text-align: right;">Precio Unit.</th>
            <th style="width: 20%; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
    `
  } else {
    itemsTableHtml = `
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio Unitario</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${invoice.description}</td>
            <td style="text-align: center;">1</td>
            <td style="text-align: right;">$ ${subtotal}</td>
            <td style="text-align: right;">$ ${subtotal}</td>
          </tr>
        </tbody>
      </table>
    `
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Factura ${invoice.id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            color: #1f2937;
          }
          .header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .company-info {
            width: 50%;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0284c7;
            margin-bottom: 10px;
          }
          .invoice-details {
            width: 50%;
            text-align: right;
          }
          .invoice-id {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 16px;
            font-weight: bold;
            background-color: ${statusColor.bg};
            color: ${statusColor.text};
            margin-bottom: 10px;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
          }
          .customer-info {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #0284c7;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #4b5563;
          }
          .amount-table {
            width: 50%;
            margin-left: auto;
            margin-top: 30px;
          }
          .amount-table th {
            text-align: right;
          }
          .amount-table td {
            text-align: right;
          }
          .total-row {
            font-weight: bold;
            font-size: 16px;
          }
          .total-row td {
            color: #0284c7;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .details-section {
            margin-bottom: 20px;
          }
          .details-text {
            color: #4b5563;
            line-height: 1.5;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <div class="logo">${companyInfo.name}</div>
            <div>${companyInfo.address}</div>
            <div>RUC: ${companyInfo.ruc}</div>
            <div>Tel: ${companyInfo.phone}</div>
            <div>Email: ${companyInfo.email}</div>
          </div>
          <div class="invoice-details">
            <div class="invoice-id">Factura #${invoice.id}</div>
            <div class="status-badge">${statusText}</div>
            <div>Fecha de Emisión: ${issueDate}</div>
            <div>Fecha de Vencimiento: ${dueDate}</div>
          </div>
        </div>

        <div class="customer-info">
          <div class="section-title">Cliente</div>
          <div>Nombre: ${customerInfo.name}</div>
          <div>Dirección: ${customerInfo.address}</div>
          <div>RUC: ${customerInfo.ruc}</div>
          <div>Email: ${customerInfo.email}</div>
          <div>Teléfono: ${customerInfo.phone}</div>
        </div>

        ${
          invoice.details
            ? `
        <div class="details-section">
          <div class="section-title">Detalles del Servicio</div>
          <div class="details-text">${invoice.details}</div>
        </div>
        `
            : ""
        }

        <div class="section-title">Detalles de Factura</div>
        ${itemsTableHtml}

        <table class="amount-table">
          <tr>
            <th>Subtotal:</th>
            <td>$ ${subtotal}</td>
          </tr>
          <tr>
            <th>IGV (18%):</th>
            <td>$ ${tax}</td>
          </tr>
          <tr class="total-row">
            <th>Total:</th>
            <td>$ ${total}</td>
          </tr>
        </table>

        <div class="footer">
          <p>Este documento es una representación digital de su factura.</p>
          <p>Para cualquier consulta, contáctenos al ${companyInfo.phone} o ${companyInfo.email}</p>
          <p>© ${new Date().getFullYear()} ${companyInfo.name} - Todos los derechos reservados</p>
        </div>
      </body>
    </html>
  `

  // Simplificar el nombre del archivo
  const fileName = `Factura_${invoice.id.replace(/[^a-zA-Z0-9]/g, "")}`

  return await generatePDF({
    html,
    fileName,
  })
}

// Actualizar la función generateAccountStatementPDF para incluir información adicional
export const generateAccountStatementPDF = async (invoices: any[], payments: any[], accountInfo?: any) => {
  // Extraer información del cliente y la empresa
  const customerInfo = accountInfo?.customerInfo || {
    name: "Cliente Demo",
    address: "Av. Ejemplo 123, Lima",
    ruc: "12345678901",
    email: "cliente@ejemplo.com",
    phone: "+51 123 456 789",
    contractType: "Mantenimiento Mensual",
    contractStart: "01/01/2024",
    contractEnd: "31/12/2024",
  }

  const companyInfo = accountInfo?.companyInfo || {
    name: "TESLA LIFT",
    address: "Edificio Metropolitan, Quito, Pichincha",
    ruc: "1791234567001",
    email: "info@teslalifts.com",
    phone: "+593 968 100 793",
  }

  // Si hay HTML personalizado, usarlo directamente
  if (accountInfo?.customHtml) {
    return await generatePDF({
      html: accountInfo.customHtml,
      fileName: accountInfo.fileName || "Documento",
    })
  }

  // Calculate totals
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0).toFixed(2)
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)
  const balance = (Number.parseFloat(totalInvoiced) - Number.parseFloat(totalPaid)).toFixed(2)

  // Create invoice rows HTML
  const invoiceRows = invoices
    .map(
      (invoice) => `
    <tr>
      <td>${invoice.id}</td>
      <td>${invoice.description}</td>
      <td>${invoice.dueDate.toLocaleDateString()}</td>
      <td>${getStatusText(invoice.status)}</td>
      <td style="text-align: right;">$ ${invoice.amount.toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

  // Create payment rows HTML
  const paymentRows = payments
    .map(
      (payment) => `
    <tr>
      <td>${payment.date.toLocaleDateString()}</td>
      <td>${payment.method}</td>
      <td>${payment.reference}</td>
      <td style="text-align: right;">$ ${payment.amount.toFixed(2)}</td>
    </tr>
  `,
    )
    .join("")

  const html = `
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
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0284c7;
            margin-bottom: 10px;
          }
          .statement-title {
            font-size: 20px;
            margin-bottom: 5px;
          }
          .statement-date {
            color: #6b7280;
            margin-bottom: 20px;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
          }
          .customer-info {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #0284c7;
            margin-top: 30px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #4b5563;
          }
          .summary-table {
            width: 50%;
            margin-left: auto;
            margin-top: 30px;
          }
          .summary-table th {
            text-align: right;
          }
          .summary-table td {
            text-align: right;
          }
          .balance-row {
            font-weight: bold;
            font-size: 16px;
          }
          .balance-row td {
            color: #0284c7;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .contract-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f9ff;
            border-radius: 8px;
          }
          .contract-title {
            font-weight: bold;
            color: #0284c7;
            margin-bottom: 10px;
          }
          .contract-detail {
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${companyInfo.name}</div>
          <div class="statement-title">Estado de Cuenta</div>
          <div class="statement-date">Generado el ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="customer-info">
          <div class="section-title">Información del Cliente</div>
          <div>Nombre: ${customerInfo.name}</div>
          <div>Dirección: ${customerInfo.address}</div>
          <div>RUC: ${customerInfo.ruc}</div>
          <div>Email: ${customerInfo.email}</div>
          <div>Teléfono: ${customerInfo.phone}</div>
          
          <div class="contract-info">
            <div class="contract-title">Información del Contrato</div>
            <div class="contract-detail">Tipo de Contrato: ${customerInfo.contractType || "Mantenimiento Mensual"}</div>
            <div class="contract-detail">Fecha de Inicio: ${customerInfo.contractStart || "01/01/2024"}</div>
            <div class="contract-detail">Fecha de Finalización: ${customerInfo.contractEnd || "31/12/2024"}</div>
          </div>
        </div>

        <div class="section-title">Resumen de Cuenta</div>
        <table class="summary-table">
          <tr>
            <th>Total Facturado:</th>
            <td>$ ${totalInvoiced}</td>
          </tr>
          <tr>
            <th>Total Pagado:</th>
            <td>$ ${totalPaid}</td>
          </tr>
          <tr class="balance-row">
            <th>Saldo Actual:</th>
            <td>$ ${balance}</td>
          </tr>
        </table>

        <div class="section-title">Facturas</div>
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Descripción</th>
              <th>Fecha Vencimiento</th>
              <th>Estado</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${
              invoiceRows ||
              `
              <tr>
                <td colspan="5" style="text-align: center; color: #6b7280;">No hay facturas disponibles</td>
              </tr>
            `
            }
          </tbody>
        </table>

        <div class="section-title">Pagos Realizados</div>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Método</th>
              <th>Referencia</th>
              <th style="text-align: right;">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${
              paymentRows ||
              `
              <tr>
                <td colspan="4" style="text-align: center; color: #6b7280;">No hay pagos registrados</td>
              </tr>
            `
            }
          </tbody>
        </table>

        <div class="footer">
          <p>Este documento es un resumen de su cuenta.</p>
          <p>Para cualquier consulta, contáctenos al ${companyInfo.phone} o ${companyInfo.email}</p>
          <p>© ${new Date().getFullYear()} ${companyInfo.name} - Todos los derechos reservados</p>
        </div>
      </body>
    </html>
  `

  // Simplificar el nombre del archivo
  const fileName = "EstadoDeCuenta"

  return await generatePDF({
    html,
    fileName,
  })
}

// Implementación mejorada para generar PDF usando expo-print
const generatePDF = async (config: PDFConfig) => {
  try {
    if (Platform.OS === "web") {
      console.log("PDF generation on web not implemented")
      return { filePath: null, success: false }
    }

    // Usar expo-print para generar un PDF real
    const { uri } = await Print.printToFileAsync({
      html: config.html,
      base64: false,
    })

    // Crear un nombre de archivo con extensión .pdf
    const pdfFileName = `${config.fileName}.pdf`

    // Definir la ruta de destino en el directorio de documentos
    const destinationUri = FileSystem.documentDirectory + pdfFileName

    // Copiar el archivo generado a la ubicación final
    await FileSystem.copyAsync({
      from: uri,
      to: destinationUri,
    })

    console.log(`PDF guardado en: ${destinationUri}`)
    return { filePath: destinationUri, success: true }
  } catch (error) {
    console.error("Error generating PDF:", error)

    // Fallback: intentar guardar como HTML si falla la generación de PDF
    try {
      const fileName = `${config.fileName}.pdf`
      const filePath = `${FileSystem.documentDirectory}${fileName}`

      await FileSystem.writeAsStringAsync(filePath, config.html, {
        encoding: FileSystem.EncodingType.UTF8,
      })

      console.log(`Archivo guardado como PDF (contenido HTML) en: ${filePath}`)
      return { filePath, success: true }
    } catch (fallbackError) {
      console.error("Error en fallback:", fallbackError)
      return { filePath: null, success: false, error }
    }
  }
}

// Helper function to share PDF
export const sharePDF = async (filePath: string | null) => {
  try {
    if (!filePath) {
      throw new Error("No file path provided")
    }

    if (Platform.OS === "ios" || Platform.OS === "android") {
      // For native platforms, use Expo's Sharing API
      const canShare = await Sharing.isAvailableAsync()

      if (canShare) {
        await Sharing.shareAsync(filePath, {
          UTI: "application/pdf",
          mimeType: "application/pdf",
        })
        return { success: true }
      } else {
        // Fallback to React Native's Share API
        await Share.share({
          url: filePath,
          title: "Documento PDF",
        })
        return { success: true }
      }
    }

    return { success: false }
  } catch (error) {
    console.error("Error sharing PDF:", error)
    Alert.alert("Error", "No se pudo compartir el documento. Por favor, intente nuevamente.")
    return { success: false, error }
  }
}

// Helper status functions
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "paid":
      return { bg: "#dcfce7", text: "#166534" }
    case "pending":
      return { bg: "#fef9c3", text: "#854d0e" }
    case "overdue":
      return { bg: "#fee2e2", text: "#b91c1c" }
    default:
      return { bg: "#f3f4f6", text: "#374151" }
  }
}

export default {
  generateInvoicePDF,
  generateAccountStatementPDF,
  sharePDF,
}

