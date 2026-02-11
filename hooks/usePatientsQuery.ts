import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Patient, CreatePatientRequest } from '@/types'
import { patientsApi } from '@/services/api/patients'

const PATIENTS_QUERY_KEY = ['patients']

export function usePatientsQuery() {
  return useQuery({
    queryKey: PATIENTS_QUERY_KEY,
    queryFn: () => patientsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (patient: CreatePatientRequest) => patientsApi.create(patient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Patient, 'id' | 'created_at'>> }) =>
      patientsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATIENTS_QUERY_KEY })
    },
  })
}

