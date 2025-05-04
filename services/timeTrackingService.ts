import { getSupabaseClient } from "../lib/supabase"
import type { Database } from "../types/supabase"

type ClockEvent = Database["public"]["Tables"]["clock_events"]["Row"]
type WorkSession = Database["public"]["Tables"]["work_sessions"]["Row"]

export const timeTrackingService = {
  // Registrar un evento de reloj (entrada, salida, inicio de descanso, fin de descanso)
  recordEvent: async (
    technicianId: string,
    eventType: "clock_in" | "clock_out" | "break_start" | "break_end",
    location?: { latitude: number; longitude: number },
    notes?: string,
  ) => {
    const supabase = getSupabaseClient()

    try {
      // Crear el evento
      const { data: event, error } = await supabase
        .from("clock_events")
        .insert({
          technician_id: technicianId,
          type: eventType,
          timestamp: new Date().toISOString(),
          location: location ? { ...location, address: "Ubicación detectada" } : null,
          notes,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Si es un evento de entrada, crear una nueva sesión de trabajo
      if (eventType === "clock_in") {
        const { data: session, error: sessionError } = await supabase
          .from("work_sessions")
          .insert({
            technician_id: technicianId,
            clock_in_event_id: event.id,
            status: "active",
            date: new Date().toISOString().split("T")[0],
          })
          .select()
          .single()

        if (sessionError) {
          throw sessionError
        }
      }
      // Si es un evento de salida, actualizar la sesión de trabajo activa
      else if (eventType === "clock_out") {
        // Buscar la sesión activa
        const { data: activeSession, error: sessionError } = await supabase
          .from("work_sessions")
          .select("*")
          .eq("technician_id", technicianId)
          .eq("status", "active")
          .single()

        if (sessionError) {
          throw sessionError
        }

        if (activeSession) {
          // Calcular la duración en minutos
          const clockInEvent = await supabase
            .from("clock_events")
            .select("timestamp")
            .eq("id", activeSession.clock_in_event_id)
            .single()

          const clockInTime = new Date(clockInEvent.data!.timestamp).getTime()
          const clockOutTime = new Date(event.timestamp).getTime()
          const durationMs = clockOutTime - clockInTime
          const durationMinutes = Math.round(durationMs / (1000 * 60))

          // Actualizar la sesión
          const { error: updateError } = await supabase
            .from("work_sessions")
            .update({
              clock_out_event_id: event.id,
              duration: durationMinutes - (activeSession.break_duration || 0),
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeSession.id)

          if (updateError) {
            throw updateError
          }
        }
      }
      // Si es un evento de inicio de descanso, actualizar la sesión activa
      else if (eventType === "break_start") {
        // Buscar la sesión activa
        const { data: activeSession, error: sessionError } = await supabase
          .from("work_sessions")
          .select("*")
          .eq("technician_id", technicianId)
          .eq("status", "active")
          .single()

        if (sessionError) {
          throw sessionError
        }

        if (activeSession) {
          // Crear un evento de descanso
          const { data: breakEvent, error: breakError } = await supabase
            .from("break_events")
            .insert({
              work_session_id: activeSession.id,
              start_event_id: event.id,
            })
            .select()
            .single()

          if (breakError) {
            throw breakError
          }

          // Actualizar el estado de la sesión
          const { error: updateError } = await supabase
            .from("work_sessions")
            .update({
              status: "on_break",
              updated_at: new Date().toISOString(),
            })
            .eq("id", activeSession.id)

          if (updateError) {
            throw updateError
          }
        }
      }
      // Si es un evento de fin de descanso, actualizar el evento de descanso y la sesión
      else if (eventType === "break_end") {
        // Buscar la sesión en descanso
        const { data: breakSession, error: sessionError } = await supabase
          .from("work_sessions")
          .select("*")
          .eq("technician_id", technicianId)
          .eq("status", "on_break")
          .single()

        if (sessionError) {
          throw sessionError
        }

        if (breakSession) {
          // Buscar el evento de descanso sin finalizar
          const { data: breakEvent, error: breakError } = await supabase
            .from("break_events")
            .select("*")
            .eq("work_session_id", breakSession.id)
            .is("end_event_id", null)
            .single()

          if (breakError) {
            throw breakError
          }

          if (breakEvent) {
            // Calcular la duración del descanso
            const breakStartEvent = await supabase
              .from("clock_events")
              .select("timestamp")
              .eq("id", breakEvent.start_event_id)
              .single()

            const breakStartTime = new Date(breakStartEvent.data!.timestamp).getTime()
            const breakEndTime = new Date(event.timestamp).getTime()
            const breakDurationMs = breakEndTime - breakStartTime
            const breakDurationMinutes = Math.round(breakDurationMs / (1000 * 60))

            // Actualizar el evento de descanso
            const { error: updateBreakError } = await supabase
              .from("break_events")
              .update({
                end_event_id: event.id,
                duration: breakDurationMinutes,
              })
              .eq("id", breakEvent.id)

            if (updateBreakError) {
              throw updateBreakError
            }

            // Actualizar la sesión
            const { error: updateSessionError } = await supabase
              .from("work_sessions")
              .update({
                break_duration: (breakSession.break_duration || 0) + breakDurationMinutes,
                status: "active",
                updated_at: new Date().toISOString(),
              })
              .eq("id", breakSession.id)

            if (updateSessionError) {
              throw updateSessionError
            }
          }
        }
      }

      return { success: true, data: event, message: `${eventType.replace("_", " ")} registrado correctamente` }
    } catch (error: any) {
      console.error("Error recording clock event:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener todos los eventos de reloj de un técnico
  getEvents: async (technicianId: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("clock_events")
        .select("*")
        .eq("technician_id", technicianId)
        .order("timestamp", { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data, message: "Eventos obtenidos correctamente" }
    } catch (error: any) {
      console.error("Error fetching clock events:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener todas las sesiones de trabajo de un técnico
  getSessions: async (technicianId: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("work_sessions")
        .select(`
          *,
          clock_in_event:clock_in_event_id (timestamp),
          clock_out_event:clock_out_event_id (timestamp),
          break_events (
            id,
            duration,
            start_event_id,
            end_event_id
          )
        `)
        .eq("technician_id", technicianId)
        .order("date", { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data, message: "Sesiones obtenidas correctamente" }
    } catch (error: any) {
      console.error("Error fetching work sessions:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener la sesión de trabajo activa de un técnico
  getActiveSession: async (technicianId: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("work_sessions")
        .select(`
          *,
          clock_in_event:clock_in_event_id (timestamp),
          break_events (
            id,
            duration,
            start_event_id,
            end_event_id
          )
        `)
        .eq("technician_id", technicianId)
        .or("status.eq.active,status.eq.on_break")
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          // No se encontró ninguna sesión activa
          return { success: true, data: null, message: "No hay sesión activa" }
        }
        throw error
      }

      return { success: true, data, message: "Sesión activa obtenida correctamente" }
    } catch (error: any) {
      console.error("Error fetching active session:", error)
      return { success: false, data: null, message: error.message }
    }
  },
}
