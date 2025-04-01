import type {
  ClockEvent,
  WorkSession,
  Report,
  ReportTemplate,
  TechnicianStats,
  ClockEventType,
} from "../models/technician"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Technician API service
const technicianApi = {
  // Clock events
  clockEvents: {
    recordEvent: async (
      technicianId: string,
      eventType: ClockEventType,
      location?: { latitude: number; longitude: number },
      notes?: string,
    ) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // In a real implementation, this would be a POST request to the API
      const mockEvent: ClockEvent = {
        id: `event-${Date.now()}`,
        technicianId,
        type: eventType,
        timestamp: new Date().toISOString(),
        location: location
          ? {
              ...location,
              address: "Detected location", // In a real app, this would be a reverse geocoded address
            }
          : undefined,
        notes,
      }

      // Store in local storage for demo purposes
      const storedEvents = await getStoredClockEvents()
      storedEvents.push(mockEvent)
      await storeClockEvents(storedEvents)

      return {
        success: true,
        data: mockEvent,
        message: `${eventType.replace("_", " ")} recorded successfully`,
      }
    },

    getAll: async (technicianId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get stored events
      const storedEvents = await getStoredClockEvents()
      const technicianEvents = storedEvents.filter((event) => event.technicianId === technicianId)

      return {
        success: true,
        data: technicianEvents,
        message: "Clock events retrieved successfully",
      }
    },
  },

  // Work sessions
  workSessions: {
    getAll: async (technicianId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get stored events
      const storedEvents = await getStoredClockEvents()
      const technicianEvents = storedEvents.filter((event) => event.technicianId === technicianId)

      // Calculate work sessions from clock events
      const workSessions = calculateWorkSessions(technicianEvents)

      return {
        success: true,
        data: workSessions,
        message: "Work sessions retrieved successfully",
      }
    },

    getCurrent: async (technicianId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get stored events
      const storedEvents = await getStoredClockEvents()
      const technicianEvents = storedEvents.filter((event) => event.technicianId === technicianId)

      // Calculate work sessions from clock events
      const workSessions = calculateWorkSessions(technicianEvents)

      // Find the active session (if any)
      const activeSession = workSessions.find((session) => session.status === "active" || session.status === "on_break")

      return {
        success: true,
        data: activeSession || null,
        message: activeSession ? "Active work session retrieved" : "No active work session found",
      }
    },
  },

  // Reports
  reports: {
    getTemplates: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In a real implementation, this would fetch templates from the API
      const mockTemplates: ReportTemplate[] = [
        {
          id: "template-1",
          type: "type1",
          name: "Mantenimiento Tipo 1",
          sheetNumber: 1,
          sections: [
            {
              id: "section-1",
              title: "Control",
              items: [
                {
                  id: "item-1",
                  description: "Comprobar funcionamiento de contactores, relé y otros elementos de control",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-2",
                  description: "Comprobar funcionamiento del sistema de frenado",
                  type: "checkbox",
                  required: true,
                },
                { id: "item-3", description: "Corrección de conexiones flojas", type: "checkbox", required: true },
                { id: "item-4", description: "Chequeos de voltajes AC-DC", type: "checkbox", required: true },
                { id: "item-5", description: "Limpieza de ventiladores de variador", type: "checkbox", required: true },
                { id: "item-6", description: "Limpieza de control", type: "checkbox", required: true },
              ],
            },
            {
              id: "section-2",
              title: "Foso",
              items: [
                {
                  id: "item-7",
                  description:
                    "Comprobar funcionamiento de interruptores finales de carrera y cambio de velocidad inferiores y superiores",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-8",
                  description: "Comprobar integridad de cables de tracción y cable de comunicación",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-9",
                  description: "Comprobar estado de zapatas cabina y contrapeso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-10",
                  description: "Comprobar accionamiento de buffer de cabina y contra peso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-11",
                  description: "Comprobar funcionamiento de microswich de seguridad del pozo",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-12",
                  description: "Comprobar integridad de cuñas o polea deflectora de cabina",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-13",
                  description: "Comprobar integridad de cuñas o polea deflectora de contra peso",
                  type: "checkbox",
                  required: true,
                },
                { id: "item-14", description: "Limpieza de foso", type: "checkbox", required: true },
              ],
            },
            {
              id: "section-3",
              title: "Sistema de puertas",
              items: [
                {
                  id: "item-15",
                  description: "Comprobar funcionamiento de cerraduras y contactos de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-16",
                  description: "Limpieza y lubricación del sistema mecánico de puestas de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-17",
                  description: "Comprobar estado de zapatas de puertas cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-18",
                  description: "Comprobar funcionamiento del operador de puerta de cabina",
                  type: "checkbox",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          id: "template-2",
          type: "type2",
          name: "Mantenimiento Tipo 2",
          sheetNumber: 2,
          sections: [
            {
              id: "section-1",
              title: "Maquina",
              items: [
                {
                  id: "item-1",
                  description: "Comprobar desgaste de polea de tracción",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-2",
                  description: "Comprobar funcionamiento del sistema mecánico de freno",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-3",
                  description: "Comprobar funcionamiento de microswich de seguridad",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-4",
                  description: "Limpieza de la maquina y gobernador de velocidad",
                  type: "checkbox",
                  required: true,
                },
              ],
            },
            {
              id: "section-2",
              title: "Foso",
              items: [
                {
                  id: "item-5",
                  description:
                    "Comprobar funcionamiento de interruptores finales de carrera y cambio de velocidad inferiores y superiores",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-6",
                  description: "Comprobar integridad de cables de tracción y cable de comunicación",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-7",
                  description: "Comprobar estado de zapatas cabina y contrapeso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-8",
                  description: "Comprobar accionamiento de buffer de cabina y contra peso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-9",
                  description: "Comprobar funcionamiento de microswich de seguridad del pozo",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-10",
                  description: "Comprobar integridad de cuñas o polea deflectora de cabina",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-11",
                  description: "Comprobar integridad de cuñas o polea deflectora de contra peso",
                  type: "checkbox",
                  required: true,
                },
                { id: "item-12", description: "Limpieza de foso", type: "checkbox", required: true },
              ],
            },
            {
              id: "section-3",
              title: "Sistema de puertas",
              items: [
                {
                  id: "item-13",
                  description: "Comprobar funcionamiento de cerraduras y contactos de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-14",
                  description: "Limpieza y lubricación del sistema mecánico de puestas de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-15",
                  description: "Comprobar estado de zapatas de puertas cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-16",
                  description: "Comprobar funcionamiento del operador de puerta de cabina",
                  type: "checkbox",
                  required: true,
                },
              ],
            },
          ],
        },
        {
          id: "template-3",
          type: "type3",
          name: "Mantenimiento Tipo 3",
          sheetNumber: 3,
          sections: [
            {
              id: "section-1",
              title: "Cabina",
              items: [
                {
                  id: "item-1",
                  description: "Comprobar funcionamiento de mando de inspección",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-2",
                  description: "Comprobar funcionamiento de inductores de subida y bajada",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-3",
                  description: "Comprobar funcionamiento de la cortina electrónica",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-4",
                  description: "Comprobar funcionamiento de stop y componentes de seguridad",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-5",
                  description: "Comprobar funcionamiento de botonera de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                { id: "item-6", description: "Limpieza parte superior de cabina", type: "checkbox", required: true },
              ],
            },
            {
              id: "section-2",
              title: "Foso",
              items: [
                {
                  id: "item-7",
                  description:
                    "Comprobar funcionamiento de interruptores finales de carrera y cambio de velocidad inferiores y superiores",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-8",
                  description: "Comprobar integridad de cables de tracción y cable de comunicación",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-9",
                  description: "Comprobar estado de zapatas cabina y contrapeso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-10",
                  description: "Comprobar accionamiento de buffer de cabina y contra peso",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-11",
                  description: "Comprobar funcionamiento de microswich de seguridad del pozo",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-12",
                  description: "Comprobar integridad de cuñas o polea deflectora de cabina",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-13",
                  description: "Comprobar integridad de cuñas o polea deflectora de contra peso",
                  type: "checkbox",
                  required: true,
                },
                { id: "item-14", description: "Limpieza de foso", type: "checkbox", required: true },
              ],
            },
            {
              id: "section-3",
              title: "Sistema de puertas",
              items: [
                {
                  id: "item-15",
                  description: "Comprobar funcionamiento de cerraduras y contactos de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-16",
                  description: "Limpieza y lubricación del sistema mecánico de puestas de cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-17",
                  description: "Comprobar estado de zapatas de puertas cabina y hall",
                  type: "checkbox",
                  required: true,
                },
                {
                  id: "item-18",
                  description: "Comprobar funcionamiento del operador de puerta de cabina",
                  type: "checkbox",
                  required: true,
                },
              ],
            },
          ],
        },
      ]

      return {
        success: true,
        data: mockTemplates,
        message: "Report templates retrieved successfully",
      }
    },

    getTemplateForMonth: async (month: number) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get all templates
      const templatesResponse = await technicianApi.reports.getTemplates()

      if (!templatesResponse.success) {
        return {
          success: false,
          data: null,
          message: "Failed to retrieve templates",
        }
      }

      // Calculate sheet number for the given month (0-based, January = 0)
      const sheetNumber = (month % 3) + 1

      // Find template with matching sheet number
      const template = templatesResponse.data.find((t) => t.sheetNumber === sheetNumber)

      if (!template) {
        return {
          success: false,
          data: null,
          message: `No template found for month ${month + 1}`,
        }
      }

      return {
        success: true,
        data: template,
        message: "Template for month retrieved successfully",
      }
    },

    getAll: async (technicianId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Get stored reports
      const storedReports = await getStoredReports()
      const technicianReports = storedReports.filter((report) => report.technicianId === technicianId)

      return {
        success: true,
        data: technicianReports,
        message: "Reports retrieved successfully",
      }
    },

    getById: async (reportId: string) => {
      // Simular API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      try {
        // Obtener reportes almacenados
        const storedReports = await getStoredReports()

        // Buscar el reporte por ID
        const report = storedReports.find((report) => report.id === reportId)

        if (!report) {
          return {
            success: false,
            data: null,
            message: "Reporte no encontrado. El ID proporcionado no corresponde a ningún reporte existente.",
          }
        }

        return {
          success: true,
          data: report,
          message: "Reporte recuperado correctamente",
        }
      } catch (error) {
        console.error("Error al recuperar el reporte:", error)
        return {
          success: false,
          data: null,
          message: "Error al recuperar el reporte. Por favor, inténtelo de nuevo.",
        }
      }
    },

    update: async (reportId: string, data: Partial<Report>) => {
      // Simular API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      try {
        // Obtener reportes almacenados
        const storedReports = await getStoredReports()
        const reportIndex = storedReports.findIndex((report) => report.id === reportId)

        if (reportIndex === -1) {
          return {
            success: false,
            data: null,
            message: "Reporte no encontrado. No se puede actualizar.",
          }
        }

        // Actualizar reporte
        const updatedReport: Report = {
          ...storedReports[reportIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        }

        storedReports[reportIndex] = updatedReport
        await storeReports(storedReports)

        return {
          success: true,
          data: updatedReport,
          message: "Reporte actualizado correctamente",
        }
      } catch (error) {
        console.error("Error al actualizar el reporte:", error)
        return {
          success: false,
          data: null,
          message: "Error al actualizar el reporte. Por favor, inténtelo de nuevo.",
        }
      }
    },

    create: async (reportData: Omit<Report, "id" | "createdAt" | "updatedAt" | "pdfUrl">) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // In a real implementation, this would be a POST request to the API
      const newReport: Report = {
        ...reportData,
        id: `report-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Store in local storage for demo purposes
      const storedReports = await getStoredReports()
      storedReports.push(newReport)
      await storeReports(storedReports)

      return {
        success: true,
        data: newReport,
        message: "Report created successfully",
      }
    },

    generatePdf: async (reportId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Get stored reports
      const storedReports = await getStoredReports()
      const reportIndex = storedReports.findIndex((report) => report.id === reportId)

      if (reportIndex === -1) {
        return {
          success: false,
          data: null,
          message: "Report not found",
        }
      }

      // Update report with PDF URL
      const updatedReport: Report = {
        ...storedReports[reportIndex],
        pdfUrl: "https://example.com/reports/pdf/" + reportId + ".pdf", // Mock URL
        updatedAt: new Date().toISOString(),
      }

      storedReports[reportIndex] = updatedReport
      await storeReports(storedReports)

      return {
        success: true,
        data: updatedReport,
        message: "PDF generated successfully",
      }
    },

    delete: async (reportId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get stored reports
      const storedReports = await getStoredReports()
      const filteredReports = storedReports.filter((report) => report.id !== reportId)

      await storeReports(filteredReports)

      return {
        success: true,
        data: null,
        message: "Report deleted successfully",
      }
    },
  },

  // Stats
  stats: {
    getTechnicianStats: async (technicianId: string) => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1200))

      // Get stored events and reports
      const storedEvents = await getStoredClockEvents()
      const storedReports = await getStoredReports()

      // Filter by technician
      const technicianEvents = storedEvents.filter((event) => event.technicianId === technicianId)
      const technicianReports = storedReports.filter((report) => report.technicianId === technicianId)

      // Calculate work sessions
      const workSessions = calculateWorkSessions(technicianEvents)

      // Calculate stats
      const completedSessions = workSessions.filter((session) => session.status === "completed")
      const totalWorkDuration = completedSessions.reduce((total, session) => total + (session.duration || 0), 0)
      const totalBreakDuration = completedSessions.reduce((total, session) => total + (session.breakDuration || 0), 0)
      const averageSessionDuration = completedSessions.length > 0 ? totalWorkDuration / completedSessions.length : 0

      const completedReports = technicianReports.filter(
        (report) => report.status === "submitted" || report.status === "approved",
      ).length
      const pendingReports = technicianReports.filter((report) => report.status === "draft").length

      // Calculate weekly work hours (mock data for demo)
      const weeklyWorkHours = [8, 7.5, 8, 8.5, 7, 0, 0] // Hours for each day of the week

      const stats: TechnicianStats = {
        totalWorkSessions: completedSessions.length,
        totalWorkDuration,
        totalBreakDuration,
        averageSessionDuration,
        completedReports,
        pendingReports,
        weeklyWorkHours,
      }

      return {
        success: true,
        data: stats,
        message: "Technician stats retrieved successfully",
      }
    },
  },
}

// Helper functions for local storage (would be replaced with API calls in a real app)
const getStoredClockEvents = async (): Promise<ClockEvent[]> => {
  try {
    // En una app real, esto sería una llamada a la API
    const storedEvents = await AsyncStorage.getItem("clockEvents")
    return storedEvents ? JSON.parse(storedEvents) : []
  } catch (error) {
    console.error("Error getting stored clock events:", error)
    return []
  }
}

// Reemplazar storeClockEvents
const storeClockEvents = async (events: ClockEvent[]): Promise<void> => {
  try {
    // En una app real, esto sería una llamada a la API
    await AsyncStorage.setItem("clockEvents", JSON.stringify(events))
  } catch (error) {
    console.error("Error storing clock events:", error)
  }
}

// Reemplazar getStoredReports
const getStoredReports = async (): Promise<Report[]> => {
  try {
    // En una app real, esto sería una llamada a la API
    const storedReports = await AsyncStorage.getItem("reports")
    return storedReports ? JSON.parse(storedReports) : []
  } catch (error) {
    console.error("Error getting stored reports:", error)
    return []
  }
}

// Reemplazar storeReports
const storeReports = async (reports: Report[]): Promise<void> => {
  try {
    // En una app real, esto sería una llamada a la API
    await AsyncStorage.setItem("reports", JSON.stringify(reports))
  } catch (error) {
    console.error("Error storing reports:", error)
  }
}

// Helper function to calculate work sessions from clock events
const calculateWorkSessions = (events: ClockEvent[]): WorkSession[] => {
  const sortedEvents = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const sessions: WorkSession[] = []

  let currentClockIn: ClockEvent | null = null
  let currentBreakStart: ClockEvent | null = null
  let breakEvents: ClockEvent[] = []
  let breakDuration = 0

  for (const event of sortedEvents) {
    if (event.type === "clock_in") {
      // Si ya hay un clock-in activo, cerrarlo primero (manejar clock-out faltante)
      if (currentClockIn) {
        sessions.push({
          id: `session-${currentClockIn.id}`,
          technicianId: currentClockIn.technicianId,
          clockInEvent: currentClockIn,
          breakEvents: [...breakEvents],
          status: "completed",
          date: new Date(currentClockIn.timestamp).toISOString().split("T")[0], // Formato YYYY-MM-DD
          duration: 0, // Duración desconocida para clock-out faltante
          breakDuration,
        })

        // Reiniciar seguimiento de descansos
        breakEvents = []
        breakDuration = 0
        currentBreakStart = null
      }

      currentClockIn = event
    } else if (event.type === "clock_out" && currentClockIn) {
      // Si hay un descanso activo, terminarlo implícitamente
      if (currentBreakStart) {
        const breakEndTime = new Date(event.timestamp).getTime()
        const breakStartTime = new Date(currentBreakStart.timestamp).getTime()
        const currentBreakDuration = Math.round((breakEndTime - breakStartTime) / (1000 * 60))

        breakDuration += currentBreakDuration
        currentBreakStart = null
      }

      // Calcular duración en minutos
      const clockInTime = new Date(currentClockIn.timestamp).getTime()
      const clockOutTime = new Date(event.timestamp).getTime()
      const durationMs = clockOutTime - clockInTime
      const durationMinutes = Math.round(durationMs / (1000 * 60))

      // Asegurarse de que la fecha se almacene en formato YYYY-MM-DD
      const sessionDate = new Date(currentClockIn.timestamp).toISOString().split("T")[0]

      sessions.push({
        id: `session-${currentClockIn.id}`,
        technicianId: currentClockIn.technicianId,
        clockInEvent: currentClockIn,
        clockOutEvent: event,
        breakEvents: [...breakEvents],
        duration: durationMinutes - breakDuration, // Restar tiempo de descanso
        breakDuration,
        status: "completed",
        date: sessionDate,
      })

      // Reiniciar seguimiento
      currentClockIn = null
      breakEvents = []
      breakDuration = 0
      currentBreakStart = null
    } else if (event.type === "break_start" && currentClockIn) {
      // Iniciar un descanso
      currentBreakStart = event
      breakEvents.push(event)
    } else if (event.type === "break_end" && currentClockIn && currentBreakStart) {
      // Terminar un descanso y calcular su duración
      breakEvents.push(event)

      const breakEndTime = new Date(event.timestamp).getTime()
      const breakStartTime = new Date(currentBreakStart.timestamp).getTime()
      const currentBreakDuration = Math.round((breakEndTime - breakStartTime) / (1000 * 60))

      breakDuration += currentBreakDuration
      currentBreakStart = null
    }
  }

  // Si hay un clock-in activo sin clock-out, agregarlo como sesión activa
  if (currentClockIn) {
    const status = currentBreakStart ? "on_break" : "active"
    const now = new Date().getTime()
    const clockInTime = new Date(currentClockIn.timestamp).getTime()
    const currentDuration = Math.round((now - clockInTime) / (1000 * 60))

    // Asegurarse de que la fecha se almacene en formato YYYY-MM-DD
    const sessionDate = new Date(currentClockIn.timestamp).toISOString().split("T")[0]

    sessions.push({
      id: `session-${currentClockIn.id}`,
      technicianId: currentClockIn.technicianId,
      clockInEvent: currentClockIn,
      breakEvents: [...breakEvents],
      duration: currentDuration - breakDuration, // Restar tiempo de descanso
      breakDuration,
      status,
      date: sessionDate,
    })
  }

  return sessions
}

export default technicianApi

