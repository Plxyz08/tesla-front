import { getSupabaseClient } from "../lib/supabase"
import type { Database } from "../types/supabase"

type Report = Database["public"]["Tables"]["reports"]["Row"]
type ReportTemplate = {
  id: string
  type: string
  name: string
  sheet_number: number
  sections: {
    id: string
    title: string
    items: {
      id: string
      description: string
      type: string
      required: boolean
    }[]
  }[]
}

export const reportService = {
  // Obtener todas las plantillas de reportes
  getTemplates: async () => {
    const supabase = getSupabaseClient()

    try {
      // 1. Obtener plantillas
      const { data: templates, error: templatesError } = await supabase
        .from("report_templates")
        .select("*")
        .order("sheet_number", { ascending: true })

      if (templatesError) {
        throw templatesError
      }

      // 2. Para cada plantilla, obtener sus secciones
      const templatesWithSections: ReportTemplate[] = []

      for (const template of templates) {
        // Obtener secciones
        const { data: sections, error: sectionsError } = await supabase
          .from("template_sections")
          .select("*")
          .eq("template_id", template.id)
          .order("order_index", { ascending: true })

        if (sectionsError) {
          throw sectionsError
        }

        // Para cada sección, obtener sus items
        const sectionsWithItems = []

        for (const section of sections) {
          const { data: items, error: itemsError } = await supabase
            .from("section_items")
            .select("*")
            .eq("section_id", section.id)
            .order("order_index", { ascending: true })

          if (itemsError) {
            throw itemsError
          }

          sectionsWithItems.push({
            id: section.id,
            title: section.title,
            items: items,
          })
        }

        templatesWithSections.push({
          id: template.id,
          type: template.type,
          name: template.name,
          sheet_number: template.sheet_number,
          sections: sectionsWithItems,
        })
      }

      return { success: true, data: templatesWithSections, message: "Plantillas obtenidas correctamente" }
    } catch (error: any) {
      console.error("Error fetching templates:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener plantilla para un mes específico
  getTemplateForMonth: async (month: number) => {
    const supabase = getSupabaseClient()

    try {
      // Calcular el número de hoja para el mes (1, 2 o 3)
      const sheetNumber = (month % 3) + 1

      // Obtener la plantilla
      const { data: template, error: templateError } = await supabase
        .from("report_templates")
        .select("*")
        .eq("sheet_number", sheetNumber)
        .single()

      if (templateError) {
        throw templateError
      }

      // Obtener secciones
      const { data: sections, error: sectionsError } = await supabase
        .from("template_sections")
        .select("*")
        .eq("template_id", template.id)
        .order("order_index", { ascending: true })

      if (sectionsError) {
        throw sectionsError
      }

      // Para cada sección, obtener sus items
      const sectionsWithItems = []

      for (const section of sections) {
        const { data: items, error: itemsError } = await supabase
          .from("section_items")
          .select("*")
          .eq("section_id", section.id)
          .order("order_index", { ascending: true })

        if (itemsError) {
          throw itemsError
        }

        sectionsWithItems.push({
          id: section.id,
          title: section.title,
          items: items,
        })
      }

      const templateWithSections: ReportTemplate = {
        id: template.id,
        type: template.type,
        name: template.name,
        sheet_number: template.sheet_number,
        sections: sectionsWithItems,
      }

      return { success: true, data: templateWithSections, message: "Plantilla obtenida correctamente" }
    } catch (error: any) {
      console.error("Error fetching template for month:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Crear un nuevo reporte
  create: async (reportData: any) => {
    const supabase = getSupabaseClient()

    try {
      // 1. Crear el reporte
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .insert({
          technician_id: reportData.technicianId,
          client_id: reportData.clientId,
          template_id: reportData.templateId,
          template_type: reportData.templateType,
          sheet_number: reportData.sheetNumber,
          building_name: reportData.buildingName,
          elevator_brand: reportData.elevatorBrand,
          elevator_count: reportData.elevatorCount,
          floor_count: reportData.floorCount,
          clock_in_time: reportData.clockInTime,
          clock_out_time: reportData.clockOutTime,
          date: reportData.date,
          observations: reportData.observations,
          technician_signature: reportData.technicianSignature,
          client_signature: reportData.clientSignature,
          status: reportData.status,
        })
        .select()
        .single()

      if (reportError) {
        throw reportError
      }

      // 2. Crear las secciones del reporte
      for (const section of reportData.sections) {
        const { data: reportSection, error: sectionError } = await supabase
          .from("report_sections")
          .insert({
            report_id: report.id,
            section_id: section.sectionId,
            title: section.title,
          })
          .select()
          .single()

        if (sectionError) {
          throw sectionError
        }

        // 3. Crear los items de cada sección
        for (const item of section.items) {
          const { error: itemError } = await supabase.from("report_items").insert({
            report_section_id: reportSection.id,
            item_id: item.itemId,
            description: item.description,
            value: item.value,
          })

          if (itemError) {
            throw itemError
          }
        }
      }

      return { success: true, data: report, message: "Reporte creado correctamente" }
    } catch (error: any) {
      console.error("Error creating report:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener todos los reportes de un técnico
  getAll: async (technicianId: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("reports")
        .select(`
          *,
          client:client_id (
            name,
            email
          )
        `)
        .eq("technician_id", technicianId)
        .order("date", { ascending: false })

      if (error) {
        throw error
      }

      return { success: true, data, message: "Reportes obtenidos correctamente" }
    } catch (error: any) {
      console.error("Error fetching reports:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Obtener un reporte por ID
  getById: async (reportId: string) => {
    const supabase = getSupabaseClient()

    try {
      // 1. Obtener el reporte
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select(`
          *,
          client:client_id (
            name,
            email,
            phone
          ),
          technician:technician_id (
            name,
            email,
            phone
          )
        `)
        .eq("id", reportId)
        .single()

      if (reportError) {
        throw reportError
      }

      // 2. Obtener las secciones del reporte
      const { data: sections, error: sectionsError } = await supabase
        .from("report_sections")
        .select("*")
        .eq("report_id", reportId)

      if (sectionsError) {
        throw sectionsError
      }

      // 3. Para cada sección, obtener sus items
      const sectionsWithItems = []

      for (const section of sections) {
        const { data: items, error: itemsError } = await supabase
          .from("report_items")
          .select("*")
          .eq("report_section_id", section.id)

        if (itemsError) {
          throw itemsError
        }

        sectionsWithItems.push({
          ...section,
          items,
        })
      }

      const reportWithSections = {
        ...report,
        sections: sectionsWithItems,
      }

      return { success: true, data: reportWithSections, message: "Reporte obtenido correctamente" }
    } catch (error: any) {
      console.error("Error fetching report:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Actualizar el estado de un reporte
  updateStatus: async (reportId: string, status: "draft" | "submitted" | "approved") => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", reportId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data, message: "Estado del reporte actualizado correctamente" }
    } catch (error: any) {
      console.error("Error updating report status:", error)
      return { success: false, data: null, message: error.message }
    }
  },

  // Generar PDF para un reporte
  generatePdf: async (reportId: string, pdfUrl: string) => {
    const supabase = getSupabaseClient()

    try {
      const { data, error } = await supabase
        .from("reports")
        .update({ pdf_url: pdfUrl, updated_at: new Date().toISOString() })
        .eq("id", reportId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return { success: true, data, message: "PDF generado correctamente" }
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      return { success: false, data: null, message: error.message }
    }
  },
}
