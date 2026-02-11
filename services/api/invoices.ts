import { supabase } from '@/lib/supabase/client'
import type { Invoice, CreateInvoiceRequest } from '@/types'
import { attendanceApi } from './attendance'

// Transform Supabase row to Invoice interface
function transformInvoiceRow(row: any): Invoice {
  return {
    id: row.id,
    patientId: row.patient_id,
    patientName: row.patient_name,
    service: row.service,
    startDate: row.start_date,
    endDate: row.end_date,
    ratePerVisit: parseFloat(row.rate_per_visit),
    visits: row.visits || [],
    totalVisits: row.total_visits,
    attendedVisits: row.attended_visits,
    missedVisits: row.missed_visits,
    totalAmount: parseFloat(row.total_amount),
    createdAt: row.created_at,
  }
}

export const invoicesApi = {
  // Get all invoices
  async getAll(): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(transformInvoiceRow)
  },

  // Get invoice by ID
  async getById(id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return transformInvoiceRow(data)
  },

  // Get invoices by patient ID
  async getByPatientId(patientId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(transformInvoiceRow)
  },

  // Create invoice from attendance records
  async create(invoiceRequest: CreateInvoiceRequest): Promise<Invoice> {
    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('name, service')
      .eq('id', invoiceRequest.patientId)
      .single()

    if (patientError) throw patientError
    if (!patient) throw new Error('Patient not found')

    // Get attendance records for the date range
    const startDate = new Date(invoiceRequest.startDate)
    const endDate = new Date(invoiceRequest.endDate)
    const attendanceRecords = await attendanceApi.getByDateRange(startDate, endDate)

    // Filter to only this patient's records
    const patientAttendance = attendanceRecords.filter(
      record => record.patient_id === invoiceRequest.patientId
    )

    // Build visits array
    const visits = patientAttendance.map(record => ({
      date: record.scheduled_date,
      attended: record.status === 'completed',
      rate: invoiceRequest.ratePerVisit,
    }))

    // Calculate totals
    const totalVisits = visits.length
    const attendedVisits = visits.filter(v => v.attended).length
    const missedVisits = totalVisits - attendedVisits
    const totalAmount = attendedVisits * invoiceRequest.ratePerVisit

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        patient_id: invoiceRequest.patientId,
        patient_name: patient.name,
        service: patient.service,
        start_date: invoiceRequest.startDate,
        end_date: invoiceRequest.endDate,
        rate_per_visit: invoiceRequest.ratePerVisit,
        visits: visits,
        total_visits: totalVisits,
        attended_visits: attendedVisits,
        missed_visits: missedVisits,
        total_amount: totalAmount,
      })
      .select()
      .single()

    if (invoiceError) throw invoiceError
    return transformInvoiceRow(invoice)
  },

  // Update invoice (e.g., toggle visit attendance)
  async update(id: string, updates: Partial<Omit<Invoice, 'id' | 'created_at'>>): Promise<Invoice> {
    // Transform camelCase to snake_case for Supabase
    const supabaseUpdates: any = {
      updated_at: new Date().toISOString(),
    }
    
    // If visits are updated, recalculate totals
    if (updates.visits) {
      const totalVisits = updates.visits.length
      const attendedVisits = updates.visits.filter(v => v.attended).length
      const missedVisits = totalVisits - attendedVisits
      const ratePerVisit = updates.ratePerVisit || 0
      const totalAmount = attendedVisits * ratePerVisit

      supabaseUpdates.visits = updates.visits
      supabaseUpdates.total_visits = totalVisits
      supabaseUpdates.attended_visits = attendedVisits
      supabaseUpdates.missed_visits = missedVisits
      supabaseUpdates.total_amount = totalAmount
    }
    
    if (updates.patientId !== undefined) supabaseUpdates.patient_id = updates.patientId
    if (updates.patientName !== undefined) supabaseUpdates.patient_name = updates.patientName
    if (updates.service !== undefined) supabaseUpdates.service = updates.service
    if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate
    if (updates.ratePerVisit !== undefined) supabaseUpdates.rate_per_visit = updates.ratePerVisit

    const { data, error } = await supabase
      .from('invoices')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformInvoiceRow(data)
  },

  // Delete invoice
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

