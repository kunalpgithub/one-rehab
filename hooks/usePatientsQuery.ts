import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Patient } from '@/types'
import { patientsStorage } from '@/utils/storage'

const PATIENTS_QUERY_KEY = ['patients']

// Fetch patients from localStorage
async function fetchPatients(): Promise<Patient[]> {
  return patientsStorage.getAll()
}

// Create patient
async function createPatient(patient: Patient): Promise<Patient> {
  if (patientsStorage.add(patient)) {
    return patient
  }
  throw new Error('Failed to create patient')
}

// Update patient
async function updatePatient({ id, updates }: { id: string; updates: Partial<Patient> }): Promise<Patient> {
  const patients = patientsStorage.getAll()
  const patient = patients.find(p => p.id === id)
  if (!patient) {
    throw new Error('Patient not found')
  }
  const updated = { ...patient, ...updates }
  if (patientsStorage.update(id, updated)) {
    return updated
  }
  throw new Error('Failed to update patient')
}

// Delete patient
async function deletePatient(id: string): Promise<void> {
  if (!patientsStorage.delete(id)) {
    throw new Error('Failed to delete patient')
  }
}

export function usePatientsQuery() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: fetchPatients,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

