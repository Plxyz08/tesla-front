import type { Client } from "../types/supabase"
import { Platform, Share } from "react-native"
import RNHTMLtoPDF from "react-native-html-to-pdf"
import FileViewer from "react-native-file-viewer"
import RNFS from "react-native-fs"
import { format } from "date-fns"
import { es } from "date-fns/locale"

/**
 * Genera un PDF con la lista de clientes
 * @param clients Lista de clientes para incluir en el PDF
 * @returns Ruta del archivo PDF generado
 */
export const generateClientListPDF = async (clients: Client[]): Promise<string> => {
  try {
    // Generar el HTML para el PDF
    const html = generateClientListHTML(clients)

    // Configurar opciones del PDF
    const options = {
      html,
      fileName: `TeslaLift_Clientes_${format(new Date(), "yyyy-MM-dd")}`,
      directory: "Documents",
      base64: false,
    }

    // Generar el PDF
    const file = await RNHTMLtoPDF.convert(options)

    if (file.filePath) {
      return file.filePath
    } else {
      throw new Error("No se pudo generar el PDF")
    }
  } catch (error) {
    console.error("Error al generar PDF:", error)
    throw error
  }
}

/**
 * Comparte el PDF generado
 * @param filePath Ruta del archivo PDF a compartir
 */
export const sharePDF = async (filePath: string): Promise<void> => {
  try {
    if (Platform.OS === "android") {
      const fileExists = await RNFS.exists(filePath)
      if (!fileExists) {
        throw new Error("El archivo no existe")
      }
    }

    await Share.share({
      url: Platform.OS === "ios" ? filePath : `file://${filePath}`,
      title: "Lista de Clientes TeslaLift",
    })
  } catch (error) {
    console.error("Error al compartir PDF:", error)
    throw error
  }
}

/**
 * Abre el PDF generado para previsualización
 * @param filePath Ruta del archivo PDF a abrir
 */
export const openPDF = async (filePath: string): Promise<void> => {
  try {
    await FileViewer.open(filePath, { showOpenWithDialog: true })
  } catch (error) {
    console.error("Error al abrir PDF:", error)
    throw error
  }
}

/**
 * Genera el HTML para el PDF de la lista de clientes
 * @param clients Lista de clientes para incluir en el PDF
 * @returns HTML formateado para el PDF
 */
const generateClientListHTML = (clients: Client[]): string => {
  const currentDate = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es })

  // Calcular estadísticas
  const totalClients = clients.length
  const activeContracts = clients.filter((client) => client.contract_type !== "inactive").length
  const totalElevators = clients.reduce((sum, client) => sum + (client.elevator_count || 0), 0)

  // Agrupar por estado de pago
  const paymentStatusGroups: Record<string, number> = {}
  clients.forEach((client) => {
    const status = client.payment_status || "No especificado"
    paymentStatusGroups[status] = (paymentStatusGroups[status] || 0) + 1
  })

  // Generar filas de la tabla
  const tableRows = clients
    .map(
      (client, index) => `
    <tr class="${index % 2 === 0 ? "even-row" : "odd-row"}">
      <td>${client.building_name || "N/A"}</td>
      <td>${client.address || "N/A"}</td>
      <td>${client.elevator_count || 0}</td>
      <td>${client.contract_type || "N/A"}</td>
      <td>${client.payment_status || "N/A"}</td>
      <td>${client.elevator_brand || "N/A"}</td>
    </tr>
  `,
    )
    .join("")

  // Generar gráfico de estado de pagos (representación simple en HTML)
  let paymentStatusHTML = ""
  Object.entries(paymentStatusGroups).forEach(([status, count]) => {
    const percentage = Math.round((count / totalClients) * 100)
    paymentStatusHTML += `
      <div class="status-item">
        <div class="status-label">${status}</div>
        <div class="status-bar-container">
          <div class="status-bar" style="width: ${percentage}%"></div>
          <div class="status-percentage">${percentage}% (${count})</div>
        </div>
      </div>
    `
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Lista de Clientes TeslaLift</title>
      <style>
        body {
          font-family: 'Helvetica', Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #0066cc;
          padding-bottom: 10px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .date {
          font-size: 14px;
          color: #666;
        }
        h1 {
          color: #0066cc;
          margin-bottom: 5px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 20px;
        }
        .summary {
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .summary-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #0066cc;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .summary-item {
          background-color: white;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
          color: #0066cc;
        }
        .summary-label {
          font-size: 14px;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #0066cc;
          color: white;
          text-align: left;
          padding: 10px;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
        }
        .even-row {
          background-color: #f9f9f9;
        }
        .odd-row {
          background-color: white;
        }
        .status-section {
          margin-top: 30px;
        }
        .status-item {
          margin-bottom: 10px;
        }
        .status-label {
          font-weight: bold;
          margin-bottom: 5px;
        }
        .status-bar-container {
          background-color: #eee;
          height: 20px;
          border-radius: 10px;
          position: relative;
        }
        .status-bar {
          background-color: #0066cc;
          height: 20px;
          border-radius: 10px 0 0 10px;
        }
        .status-percentage {
          position: absolute;
          top: 0;
          right: 10px;
          line-height: 20px;
          font-size: 12px;
          color: #333;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">TeslaLift</div>
        <div class="date">Generado el: ${currentDate}</div>
      </div>
      
      <h1>Lista de Clientes</h1>
      <div class="subtitle">Reporte completo de clientes registrados en el sistema</div>
      
      <div class="summary">
        <div class="summary-title">Resumen</div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${totalClients}</div>
            <div class="summary-label">Clientes Totales</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${activeContracts}</div>
            <div class="summary-label">Contratos Activos</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${totalElevators}</div>
            <div class="summary-label">Elevadores Totales</div>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Edificio</th>
            <th>Dirección</th>
            <th>Elevadores</th>
            <th>Tipo de Contrato</th>
            <th>Estado de Pago</th>
            <th>Marca de Elevador</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="status-section">
        <h2>Estado de Pagos</h2>
        ${paymentStatusHTML}
      </div>
      
      <div class="footer">
        © ${new Date().getFullYear()} TeslaLift - Todos los derechos reservados
      </div>
    </body>
    </html>
  `
}
