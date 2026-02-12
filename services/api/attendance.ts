import { supabase } from '@/lib/supabase/client'
import type { VisitAttendance } from '@/types'

export const attendanceApi = {
  // Get attendance for a specific date (main query for visits page), optionally scoped to a visitor
  async getByDate(date: Date, visitorId?: string): Promise<VisitAttendance[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    let q = supabase
      .from('visit_attendance')
      .select(`
        *,
        patient:patients(*)
      `)
      .gte('scheduled_date', startOfDay.toISOString().split('T')[0])
      .lte('scheduled_date', endOfDay.toISOString().split('T')[0])
      .order('scheduled_time', { ascending: true, nullsFirst: false })
      .order('scheduled_date', { ascending: true })
    if (visitorId) q = q.eq('visitor_id', visitorId)
    const { data, error } = await q
    if (error) throw error
    return (data || []) as VisitAttendance[]
  },

  // Get attendance for a patient
  async getByPatient(patientId: string): Promise<VisitAttendance[]> {
    const { data, error } = await supabase
      .from('visit_attendance')
      .select('*')
      .eq('patient_id', patientId)
      .order('scheduled_date', { ascending: false })
    
    if (error) throw error
    return (data || []) as VisitAttendance[]
  },

  // Get attendance for a date range
  async getByDateRange(startDate: Date, endDate: Date): Promise<VisitAttendance[]> {
    const { data, error } = await supabase
      .from('visit_attendance')
      .select(`
        *,
        patient:patients(*)
      `)
      .gte('scheduled_date', startDate.toISOString().split('T')[0])
      .lte('scheduled_date', endDate.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
    
    if (error) throw error
    return (data || []) as VisitAttendance[]
  },

  // Mark attendance: update existing by id, or create new records for slots without id (when saving from UI)
  async markAttendance(
    items: Array<
      | { id: string }
      | { patientId: string; visitorId: string; scheduledDate: string; scheduledTime?: string }
    >,
    status: 'completed' | 'missed',
    markedBy: string
  ): Promise<void> {
    const ids = items.filter((x): x is { id: string } => 'id' in x && !!x.id).map(x => x.id)
    const slots = items.filter(
      (x): x is { patientId: string; visitorId: string; scheduledDate: string; scheduledTime?: string } =>
        'patientId' in x && !!x.patientId
    )

    const now = new Date().toISOString()
    if (ids.length > 0) {
      const { error } = await supabase
        .from('visit_attendance')
        .update({
          status,
          marked_by: markedBy,
          marked_at: now,
          completed_at: status === 'completed' ? now : null,
          updated_at: now,
        })
        .in('id', ids)
      if (error) throw error
    }
    if (slots.length > 0) {
      const rows = slots.map(s => ({
        patient_id: s.patientId,
        visitor_id: s.visitorId,
        scheduled_date: s.scheduledDate,
        scheduled_time: s.scheduledTime || null,
        status,
        marked_by: markedBy,
        marked_at: now,
        completed_at: status === 'completed' ? now : null,
      }))
      const { error } = await supabase.from('visit_attendance').insert(rows)
      if (error) throw error
    }
  },

  // Create attendance records (when schedule is created). schedule_id optional for backfill compatibility.
  async createMany(records: Omit<VisitAttendance, 'id' | 'created_at' | 'updated_at' | 'marked_by' | 'marked_at' | 'completed_at'>[]): Promise<void> {
    const { error } = await supabase
      .from('visit_attendance')
      .insert(records)
    
    if (error) throw error
  },

  // Update single attendance record
  async update(id: string, updates: Partial<Omit<VisitAttendance, 'id' | 'created_at'>>): Promise<VisitAttendance> {
    const { data, error } = await supabase
      .from('visit_attendance')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data as VisitAttendance
  },

  // Delete attendance record
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('visit_attendance')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

