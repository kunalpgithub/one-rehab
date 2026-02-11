import { supabase } from '@/lib/supabase/client'
import type { Patient, CreatePatientRequest } from '@/types'

// Transform Supabase row to Patient interface
function transformPatientRow(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    service: row.service,
    lastVisit: row.last_visit || undefined,
    status: row.status || undefined,
  }
}

export const patientsApi = {
  // Get all patients (RLS will filter automatically)
  async getAll(): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return (data || []).map(transformPatientRow)
  },

  // Get patient by ID
  async getById(id: string): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return transformPatientRow(data)
  },

  // Create patient
  async create(patient: CreatePatientRequest): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        name: patient.name,
        service: patient.service,
      })
      .select()
      .single()
    
    if (error) throw error
    return transformPatientRow(data)
  },

  // Update patient
  async update(id: string, updates: Partial<Omit<Patient, 'id' | 'created_at'>>): Promise<Patient> {
    // Transform camelCase to snake_case for Supabase
    const supabaseUpdates: any = {
      updated_at: new Date().toISOString(),
    }
    
    if (updates.name !== undefined) supabaseUpdates.name = updates.name
    if (updates.service !== undefined) supabaseUpdates.service = updates.service
    if (updates.lastVisit !== undefined) supabaseUpdates.last_visit = updates.lastVisit
    if (updates.status !== undefined) supabaseUpdates.status = updates.status

    const { data, error } = await supabase
      .from('patients')
      .update(supabaseUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return transformPatientRow(data)
  },

  // Delete patient
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

