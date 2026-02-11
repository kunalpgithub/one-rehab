import { supabase } from '@/lib/supabase/client'
import type { ScheduledVisit, CreateVisitRequest } from '@/types'
import { generateVisitDates } from '@/utils/visitScheduler'
import { attendanceApi } from './attendance'

// Transform Supabase row to ScheduledVisit interface
function transformVisitRow(row: any): ScheduledVisit {
  return {
    id: row.id,
    patientId: row.patient_id,
    visitorId: row.visitor_id,
    frequency: row.frequency,
    visitsPerPeriod: row.visits_per_period,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    occurrences: row.occurrences || undefined,
    timeSlots: row.time_slots || undefined,
    generatedDates: row.generated_dates || [],
    createdAt: row.created_at,
  }
}

export const visitsApi = {
  // Get all visit schedules
  async getAll(): Promise<ScheduledVisit[]> {
    const { data, error } = await supabase
      .from('visit_schedules')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(transformVisitRow)
  },

  // Get visit schedule by ID
  async getById(id: string): Promise<ScheduledVisit> {
    const { data, error } = await supabase
      .from('visit_schedules')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return transformVisitRow(data)
  },

  // Get visit schedules by patient ID
  async getByPatientId(patientId: string): Promise<ScheduledVisit[]> {
    const { data, error } = await supabase
      .from('visit_schedules')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(transformVisitRow)
  },

  // Create visit schedule and generate attendance records
  async createSchedule(schedule: CreateVisitRequest): Promise<ScheduledVisit> {
    // Generate visit dates
    const generatedDates = generateVisitDates(
      schedule.frequency,
      schedule.visitsPerPeriod,
      schedule.startDate,
      schedule.timeSlots,
      schedule.endDate,
      schedule.occurrences
    )

    if (generatedDates.length === 0) {
      throw new Error('No visits could be generated with the provided parameters')
    }

    // Create the schedule
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('visit_schedules')
      .insert({
        patient_id: schedule.patientId,
        visitor_id: schedule.visitorId,
        frequency: schedule.frequency,
        visits_per_period: schedule.visitsPerPeriod,
        start_date: schedule.startDate,
        end_date: schedule.endDate || null,
        occurrences: schedule.occurrences || null,
        time_slots: schedule.timeSlots,
        generated_dates: generatedDates,
      })
      .select()
      .single()

    if (scheduleError) throw scheduleError

    // Generate attendance records for each generated date
    // Note: generatedDates format is YYYY-MM-DDTHH:mm:ss (local time, no timezone)
    const attendanceRecords = generatedDates.map((dateStr) => {
      // Parse the date string (format: YYYY-MM-DDTHH:mm:ss)
      const [datePart, timePart] = dateStr.split('T')
      const scheduledDate = datePart // Already in YYYY-MM-DD format
      const [hours, minutes] = timePart.split(':')
      const scheduledTime = `${hours}:${minutes}` // HH:MM format

      return {
        patient_id: schedule.patientId,
        visitor_id: schedule.visitorId,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        status: 'pending' as const,
      }
    })
    
    // Remove duplicates before inserting (same patient, date, and time)
    const uniqueRecords = attendanceRecords.filter((record, index, self) => 
      index === self.findIndex(r => 
        r.patient_id === record.patient_id &&
        r.scheduled_date === record.scheduled_date &&
        r.scheduled_time === record.scheduled_time
      )
    )

    // Create attendance records (only unique ones)
    if (uniqueRecords.length > 0) {
      await attendanceApi.createMany(uniqueRecords)
    }

    return transformVisitRow(scheduleData)
  },

  // Update visit schedule
  async update(id: string, updates: Partial<Omit<ScheduledVisit, 'id' | 'created_at'>>): Promise<ScheduledVisit> {
    // Transform camelCase to snake_case for Supabase
    const supabaseUpdates: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.patientId !== undefined) supabaseUpdates.patient_id = updates.patientId
    if (updates.visitorId !== undefined) supabaseUpdates.visitor_id = updates.visitorId
    if (updates.frequency !== undefined) supabaseUpdates.frequency = updates.frequency
    if (updates.visitsPerPeriod !== undefined) supabaseUpdates.visits_per_period = updates.visitsPerPeriod
    if (updates.startDate !== undefined) supabaseUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) supabaseUpdates.end_date = updates.endDate
    if (updates.occurrences !== undefined) supabaseUpdates.occurrences = updates.occurrences
    if (updates.timeSlots !== undefined) supabaseUpdates.time_slots = updates.timeSlots
    if (updates.generatedDates !== undefined) supabaseUpdates.generated_dates = updates.generatedDates

    const { data, error } = await supabase
      .from('visit_schedules')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformVisitRow(data)
  },

  // Delete visit schedule
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visit_schedules')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

