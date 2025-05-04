"use client"

import type React from "react"
import { useState } from "react"
import { TouchableOpacity, ActivityIndicator, StyleSheet, View } from "react-native"
import { Feather } from "@expo/vector-icons"
import type { Client } from "../types/supabase"
import { generateClientListPDF, sharePDF } from "../services/pdfService"
import { useToast } from "../hooks/useToast"

interface ExportPDFButtonProps {
  clients: Client[]
  color?: string
  size?: number
}

export const ExportPDFButton: React.FC<ExportPDFButtonProps> = ({ clients, color = "#ffffff", size = 24 }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const handleExport = async () => {
    if (clients.length === 0) {
      showToast({
        type: "error",
        title: "Error",
        message: "No hay clientes para exportar",
      })
      return
    }

    try {
      setIsLoading(true)

      // Generar el PDF
      const filePath = await generateClientListPDF(clients)

      // Mostrar mensaje de éxito
      showToast({
        type: "success",
        title: "PDF Generado",
        message: "El PDF se ha generado correctamente",
      })

      // Compartir el PDF
      await sharePDF(filePath)
    } catch (error) {
      console.error("Error al exportar PDF:", error)
      showToast({
        type: "error",
        title: "Error",
        message: "No se pudo generar el PDF",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableOpacity onPress={handleExport} disabled={isLoading} style={styles.button}>
      {isLoading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <Feather name="file-text" size={size} color={color} />
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
})
