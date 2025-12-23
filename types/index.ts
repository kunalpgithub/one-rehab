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

export interface ScheduledVisit {
  id: string
  patientId: string
  visitorId: string
  frequency: VisitFrequency
  visitsPerPeriod: number
  startDate: string
  endDate?: string
  occurrences?: number
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
