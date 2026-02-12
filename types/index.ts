export type ServiceType = 'Physical Therapy' | 'Occupational Therapy' | 'Speech Therapy' | 'Rehabilitation'

export type VisitFrequency = 'daily' | 'weekly' | 'monthly'

export interface Patient {
  id: string
  name: string
  service: ServiceType
  lastVisit?: string
  status?: 'pending' | 'completed'
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  firmId?: string
}

export interface TimeSlot {
  time: string // Format: "HH:mm" (e.g., "09:00", "14:30")
  dayOfWeek?: number // 0 = Sunday, 6 = Saturday (for weekly)
  dayOfMonth?: number // 1-31 (for monthly)
}

export interface ScheduledVisit {
  id: string
  patientId: string
  visitorId: string
  frequency: VisitFrequency
  visitsPerPeriod: number
  startDate: string
  endDate?: string
  occurrences?: number
  timeSlots?: TimeSlot[] // Time slots for visits (optional for backward compatibility)
  generatedDates: string[]
  createdAt: string
}

export interface CreatePatientRequest {
  name: string
  service: ServiceType
}

export interface CreateVisitRequest {
  patientId: string
  visitorId: string
  frequency: VisitFrequency
  visitsPerPeriod: number
  startDate: string
  endDate?: string
  occurrences?: number
  timeSlots: TimeSlot[]
}

export interface Invoice {
  id: string
  patientId: string
  patientName: string
  service: string
  startDate: string
  endDate: string
  ratePerVisit: number
  visits: Array<{
    date: string
    attended: boolean
    rate: number
  }>
  totalVisits: number
  attendedVisits: number
  missedVisits: number
  totalAmount: number
  createdAt: string
}

export interface CreateInvoiceRequest {
  patientId: string
  startDate: string
  endDate: string
  ratePerVisit: number
}

/** Slot derived from a schedule for a given date (display only; no id until saved as attendance) */
export interface ScheduleSlot {
  schedule_id?: string
  patient_id: string
  visitor_id: string
  scheduled_date: string
  scheduled_time?: string
  patient?: Pick<Patient, 'id' | 'name' | 'service'>
}

export interface VisitAttendance {
  id: string
  schedule_id?: string | null
  patient_id: string
  visitor_id: string
  scheduled_date: string
  scheduled_time?: string
  status: 'pending' | 'completed' | 'missed'
  marked_by?: string
  marked_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  patient?: Patient
  visitor?: User
}
