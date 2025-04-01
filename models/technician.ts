// Data models for the Technician module

// Clock event types
export type ClockEventType = "clock_in" | "clock_out" | "break_start" | "break_end"

// Clock event model
export interface ClockEvent {
  id: string
  technicianId: string
  type: ClockEventType
  timestamp: string // ISO date string
  location?: {
    latitude: number
    longitude: number
    address?: string
  }
  notes?: string
}

// Work session model (calculated from clock events)
export interface WorkSession {
  id: string
  technicianId: string
  clockInEvent: ClockEvent
  clockOutEvent?: ClockEvent // Optional because session might be ongoing
  breakEvents: ClockEvent[] // Array of break_start and break_end events
  duration?: number // Duration in minutes (excluding breaks)
  breakDuration?: number // Duration of breaks in minutes
  status: "active" | "on_break" | "completed"
  date: string // YYYY-MM-DD
}

// Report template types based on the provided documents
export type ReportTemplateType = "type1" | "type2" | "type3"

// Report template model
export interface ReportTemplate {
  id: string
  type: ReportTemplateType
  name: string
  sheetNumber: number // 1, 2, or 3 for the cyclical assignment
  sections: ReportSection[]
}

// Report section model
export interface ReportSection {
  id: string
  title: string
  items: ReportItem[]
}

// Report item model
export interface ReportItem {
  id: string
  description: string
  type: "checkbox" | "text" | "number"
  required: boolean
}

// Report model
export interface Report {
  id: string
  technicianId: string
  templateId: string
  templateType: ReportTemplateType
  sheetNumber: number // 1, 2, or 3 for the cyclical assignment
  buildingName: string
  elevatorBrand: string
  elevatorCount: number
  floorCount: number
  clockInTime: string
  clockOutTime?: string
  date: string // YYYY-MM-DD
  sections: ReportSectionData[]
  observations?: string
  technicianSignature?: string
  clientSignature?: string
  status: "draft" | "submitted" | "approved"
  createdAt: string
  updatedAt: string
  pdfUrl?: string
  technicianName?: string; // Added property
}

// Report section data model
export interface ReportSectionData {
  sectionId: string
  title: string
  items: ReportItemData[]
}

// Report item data model
export interface ReportItemData {
  itemId: string
  description: string
  value: boolean | string | number
}

// Technician stats model
export interface TechnicianStats {
  totalWorkSessions: number
  totalWorkDuration: number // in minutes
  totalBreakDuration: number // in minutes
  averageSessionDuration: number // in minutes
  completedReports: number
  pendingReports: number
  weeklyWorkHours: number[]
}

// Monthly report assignment helper
export const getReportSheetForMonth = (month: number): number => {
  // January = 0, February = 1, etc.
  // Sheet 1 for months 0, 3, 6, 9 (Jan, Apr, Jul, Oct)
  // Sheet 2 for months 1, 4, 7, 10 (Feb, May, Aug, Nov)
  // Sheet 3 for months 2, 5, 8, 11 (Mar, Jun, Sep, Dec)
  return (month % 3) + 1
}

