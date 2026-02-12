import { supabase } from '@/lib/supabase/client'
import type { ScheduledVisit, CreateVisitRequest, ScheduleSlot } from '@/types'
import { generateVisitDates } from '@/utils/visitScheduler'

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
  // Get all visit schedules, optionally scoped to a visitor
  async getAll(visitorId?: string): Promise<ScheduledVisit[]> {
    let q = supabase
      .from('visit_schedules')
      .select('*')
      .order('created_at', { ascending: false })
    if (visitorId) q = q.eq('visitor_id', visitorId)
    const { data, error } = await q
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

  // Create visit schedule only (no attendance records — those are created when marking from UI)
  async createSchedule(schedule: CreateVisitRequest): Promise<ScheduledVisit> {
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
    return transformVisitRow(scheduleData)
  },

  // Slots for a date from schedules only (for display; no DB attendance). Used for upcoming/future dates and to merge with saved attendance for today.
  async getSlotsForDate(date: Date, visitorId?: string): Promise<ScheduleSlot[]> {
    const dateStr = date.toISOString().split('T')[0]
    let q = supabase
      .from('visit_schedules')
      .select('id, patient_id, visitor_id, generated_dates, patient:patients(id, name, service)')
    if (visitorId) q = q.eq('visitor_id', visitorId)
    const { data: rows, error } = await q
    if (error) throw error

    const slots: ScheduleSlot[] = []
    for (const row of rows || []) {
      const dates = (row.generated_dates || []) as string[]
      for (const dateTimeStr of dates) {
        if (dateTimeStr.startsWith(dateStr)) {
          const [, timePart] = dateTimeStr.includes('T') ? dateTimeStr.split('T') : [dateStr, '00:00:00']
          const scheduledTime = timePart ? timePart.slice(0, 5) : undefined // HH:MM
          slots.push({
            schedule_id: row.id,
            patient_id: row.patient_id,
            visitor_id: row.visitor_id,
            scheduled_date: dateStr,
            scheduled_time: scheduledTime || undefined,
            patient: (row as any).patient ?? undefined,
          })
        }
      }
    }
    slots.sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
    return slots
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

