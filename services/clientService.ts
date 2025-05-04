import { getSupabaseClient } from "../lib/supabase"
import type { Database } from "../types/supabase"

type Client = Database["public"]["Tables"]["clients"]["Row"] & {
  user: Database["public"]["Tables"]["users"]["Row"]
}

export const clientService = {
  // Obtener todos los clientes
  getAll: async () => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          user:user_id (*)
        `)
        .order("user:name", { ascending: true })

      if (error) {
        throw error
      }

      return { success: true, data, message: "Clientes obtenidos correctamente" }
    } catch (error: any) {
      console.error("Error fetching clients:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener un cliente por ID
  getById: async (clientId: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          user:user_id (*)
        `)
        .eq("user_id", clientId)
        .single()

      if (error) {
        throw error
      }

      return { success: true, data, message: "Cliente obtenido correctamente" }
    } catch (error: any) {
      console.error("Error fetching client:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Crear un nuevo cliente
  create: async (userData: any, clientData: any) => {
    const supabase = getSupabaseClient()

    try {
      // 1. Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
      })

      if (authError) {
        throw authError
      }

      // 2. Crear perfil de usuario
      const { error: userError } = await supabase.from("users").insert({
        id: authData.user.id,
        name: userData.name,
        email: userData.email,
        role: "client",
        phone: userData.phone,
        photo: userData.photo,
        status: "active",
      })

      if (userError) {
        // Rollback: eliminar usuario de Auth
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw userError
      }

      // 3. Crear cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          user_id: authData.user.id,
          ruc: clientData.ruc,
          address: clientData.address,
          building_name: clientData.buildingName,
          elevator_brand: clientData.elevatorBrand,
          elevator_count: clientData.elevatorCount || 1,
          floor_count: clientData.floorCount,
          contract_type: clientData.contractType,
          payment_status: clientData.paymentStatus || "paid",
          contract_duration_months: clientData.contractDurationMonths,
          total_account_value: clientData.totalAccountValue,
        })
        .select()
        .single()

      if (clientError) {
        // Rollback: eliminar usuario y perfil
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw clientError
      }

      return { success: true, data: client, message: "Cliente creado correctamente" }
    } catch (error: any) {
      console.error("Error creating client:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Actualizar un cliente
  update: async (clientId: string, userData: any, clientData: any) => {
    const supabase = getSupabaseClient()

    try {
      // 1. Actualizar perfil de usuario
      const { error: userError } = await supabase
        .from("users")
        .update({
          name: userData.name,
          phone: userData.phone,
          photo: userData.photo,
          status: userData.status,
        })
        .eq("id", clientId)

      if (userError) {
        throw userError
      }

      // 2. Actualizar cliente
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .update({
          ruc: clientData.ruc,
          address: clientData.address,
          building_name: clientData.buildingName,
          elevator_brand: clientData.elevatorBrand,
          elevator_count: clientData.elevatorCount,
          floor_count: clientData.floorCount,
          contract_type: clientData.contractType,
          payment_status: clientData.paymentStatus,
          contract_duration_months: clientData.contractDurationMonths,
          total_account_value: clientData.totalAccountValue,
        })
        .eq("user_id", clientId)
        .select()
        .single()

      if (clientError) {
        throw clientError
      }

      return { success: true, data: client, message: "Cliente actualizado correctamente" }
    } catch (error: any) {
      console.error("Error updating client:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Eliminar un cliente
  delete: async (clientId: string) => {
    const supabase = getSupabaseClient()

    try {
      // Eliminar cliente (las políticas RLS se encargarán de verificar permisos)
      const { error: clientError } = await supabase.from("clients").delete().eq("user_id", clientId)

      if (clientError) {
        throw clientError
      }

      // Eliminar usuario
      const { error: userError } = await supabase.from("users").delete().eq("id", clientId)

      if (userError) {
        throw userError
      }

      // Eliminar usuario de Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(clientId)

      if (authError) {
        throw authError
      }

      return { success: true, data: null, message: "Cliente eliminado correctamente" }
    } catch (error: any) {
      console.error("Error deleting client:", error)
      return { success: false, data: null, message: error.message }
    }
  },
}

export const getClients = async () => {
    const result = await clientService.getAll()
    if (result.success) {
      return result.data ?? []
    }
    throw new Error(result.message)
  }
