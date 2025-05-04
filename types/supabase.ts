// Este archivo normalmente se generaría con 'supabase gen types typescript'
// Aquí incluimos una versión simplificada para el ejemplo

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
export type Client = Database["public"]["Tables"]["clients"]["Row"]


export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: "admin" | "technician" | "client"
          profile_image: string | null
          phone: string | null
          photo: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          role: "admin" | "technician" | "client"
          profile_image?: string | null
          phone?: string | null
          photo?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: "admin" | "technician" | "client"
          profile_image?: string | null
          phone?: string | null
          photo?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          user_id: string
          ruc: string | null
          address: string | null
          building_name: string | null
          elevator_brand: string | null
          elevator_count: number
          floor_count: number | null
          contract_type: string | null
          invoice_status: string | null
          payment_status: "paid" | "debt" | null
          contract_duration_months: number | null
          total_account_value: number | null
        }
        Insert: {
          user_id: string
          ruc?: string | null
          address?: string | null
          building_name?: string | null
          elevator_brand?: string | null
          elevator_count?: number
          floor_count?: number | null
          contract_type?: string | null
          invoice_status?: string | null
          payment_status?: "paid" | "debt" | null
          contract_duration_months?: number | null
          total_account_value?: number | null
        }
        Update: {
          user_id?: string
          ruc?: string | null
          address?: string | null
          building_name?: string | null
          elevator_brand?: string | null
          elevator_count?: number
          floor_count?: number | null
          contract_type?: string | null
          invoice_status?: string | null
          payment_status?: "paid" | "debt" | null
          contract_duration_months?: number | null
          total_account_value?: number | null
        }
      }
      // Definiciones simplificadas para otras tablas
      reports: {
        Row: {
          id: string
          technician_id: string
          client_id: string
          template_id: string
          template_type: string
          sheet_number: number
          building_name: string
          elevator_brand: string
          elevator_count: number
          floor_count: number
          clock_in_time: string
          clock_out_time: string | null
          date: string
          observations: string | null
          technician_signature: string | null
          client_signature: string | null
          status: "draft" | "submitted" | "approved"
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
            technician_id: string
            client_id: string
            template_id: string
            template_type: string
            sheet_number: number
            building_name: string
            elevator_brand: string
            elevator_count: number
            floor_count: number
            clock_in_time: string
            clock_out_time?: string | null
            date?: string
            observations?: string | null
            technician_signature?: string | null
            client_signature?: string | null
            status?: "draft" | "submitted" | "approved"
            pdf_url?: string | null
        }
        Update: {
            technician_id?: string
            client_id?: string
            template_id?: string
            template_type?: string
            sheet_number?: number
            building_name?: string
            elevator_brand?: string
            elevator_count?: number
            floor_count?: number
            clock_in_time?: string
            clock_out_time?: string | null
            date?: string
            observations?: string | null
            technician_signature?: string | null
            client_signature?: string | null
            status?: "draft" | "submitted" | "approved"
            pdf_url?: string | null
        }
      }
      clock_events: {
        Row: {
          id: string
          technician_id: string
          type: "clock_in" | "clock_out" | "break_start" | "break_end"
          timestamp: string
          location: { latitude: number; longitude: number; address: string } | null
          notes: string | null
        }
        Insert: {
          technician_id: string
          type: "clock_in" | "clock_out" | "break_start" | "break_end"
          timestamp: string
          location?: { latitude: number; longitude: number; address: string } | null
          notes?: string | null
        }
        Update: {
          technician_id?: string
          type?: "clock_in" | "clock_out" | "break_start" | "break_end"
          timestamp?: string
          location?: { latitude: number; longitude: number; address: string } | null
          notes?: string | null
        }
      }
        work_sessions: {
            Row: {
            id: string
            technician_id: string
            clock_in_event_id: string
            clock_out_event_id: string | null
            status: "active" | "completed" | "cancelled"
            date: string
            }
            Insert: {
            technician_id: string
            clock_in_event_id: string
            clock_out_event_id?: string | null
            status?: "active" | "completed" | "cancelled"
            date?: string
            }
            Update: {
            technician_id?: string
            clock_in_event_id?: string
            clock_out_event_id?: string | null
            status?: "active" | "completed" | "cancelled"
            date?: string
            }
        }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
